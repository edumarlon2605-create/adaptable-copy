import { createFileRoute } from "@tanstack/react-router";

type AppRole = "admin" | "consultor" | "cliente";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function calcularCarta(input: {
  valor_bem: number;
  parcelas_totais: number;
  percentual_administrativo: number;
}) {
  const valor_bem = round2(input.valor_bem);
  const perc = input.percentual_administrativo;
  const valor_administrativo = round2((valor_bem * perc) / 100);
  const valor_total = round2(valor_bem + valor_administrativo);
  const base = Math.floor((valor_total * 100) / input.parcelas_totais) / 100;
  const parcelas: number[] = new Array(input.parcelas_totais).fill(base);
  const soma = round2(base * input.parcelas_totais);
  const dif = round2(valor_total - soma);
  parcelas[parcelas.length - 1] = round2(parcelas[parcelas.length - 1] + dif);
  return { valor_bem, valor_administrativo, valor_total, parcelas };
}
function calcularPrimeiroVencimento(data_adesao: string): string {
  const d = new Date(data_adesao + "T12:00:00");
  const dia = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth(), 10, 12, 0, 0);
  if (dia >= 10) target.setMonth(target.getMonth() + 1);
  return toISODate(target);
}
function addMonths(iso: string, months: number) {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

async function getAuth(request: Request) {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { supabaseAdmin, userId: null as string | null, role: null as AppRole | null };
  }
  const token = authHeader.slice(7);
  if (!token) return { supabaseAdmin, userId: null, role: null };
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { supabaseAdmin, userId: null, role: null };
  const userId = data.user.id;
  const { data: roleRow } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId!)
    .maybeSingle();
  return { supabaseAdmin, userId, role: (roleRow?.role as AppRole) ?? null };
}

async function profileByUserId(supabaseAdmin: any, userId: string) {
  const { data } = await supabaseAdmin.from("profiles").select("*").eq("user_id", userId!).maybeSingle();
  return data;
}

function docSignedUrl(supabaseAdmin: any, path: string | null | undefined) {
  if (!path) return Promise.resolve(null);
  return supabaseAdmin.storage
    .from("client-documents")
    .createSignedUrl(path, 60 * 60)
    .then((r: any) => r?.data?.signedUrl ?? null)
    .catch(() => null);
}

async function recomputeCartaTotals(supabaseAdmin: any, cartaId: string) {
  const { data: parcelas } = await supabaseAdmin
    .from("carta_parcelas")
    .select("status,valor")
    .eq("carta_id", cartaId);
  const list = parcelas ?? [];
  const parcelas_pagas = list.filter((p: any) => p.status === "pago").length;
  const valores_pagos = round2(
    list.filter((p: any) => p.status === "pago").reduce((acc: number, p: any) => acc + Number(p.valor || 0), 0),
  );
  await supabaseAdmin.from("cartas").update({ parcelas_pagas, valores_pagos }).eq("id", cartaId);
}

function withDynamicStatus(p: any) {
  const today = toISODate(new Date());
  if (p.status === "pendente" && p.vencimento && p.vencimento < today) {
    return { ...p, status: "atraso" };
  }
  return p;
}

async function buildCartaDashboard(supabaseAdmin: any, cartaId: string, carta: any) {
  const { data: parcelasRaw } = await supabaseAdmin
    .from("carta_parcelas")
    .select("*")
    .eq("carta_id", cartaId)
    .order("numero", { ascending: true });
  const parcelas = (parcelasRaw ?? []).map(withDynamicStatus);
  const total_pago = round2(parcelas.filter((p: any) => p.status === "pago").reduce((a: number, p: any) => a + Number(p.valor), 0));
  const total_aberto = round2(parcelas.filter((p: any) => p.status === "pendente").reduce((a: number, p: any) => a + Number(p.valor), 0));
  const total_atraso = round2(parcelas.filter((p: any) => p.status === "atraso").reduce((a: number, p: any) => a + Number(p.valor), 0));
  const parcelas_pagas = parcelas.filter((p: any) => p.status === "pago").length;
  const parcelas_pendentes = parcelas.filter((p: any) => p.status === "pendente").length;
  const parcelas_atraso = parcelas.filter((p: any) => p.status === "atraso").length;
  const totalParcelas = parcelas.length || 1;
  const percentual_quitado = round2((parcelas_pagas / totalParcelas) * 100);
  const percentual_restante = round2(100 - percentual_quitado);
  const saldo_devedor = round2(Number(carta.valor_total ?? 0) - total_pago);
  const proxima = parcelas.find((p: any) => p.status !== "pago") ?? null;
  const ultima = [...parcelas].reverse().find((p: any) => p.status === "pago") ?? null;
  return {
    parcelas,
    dashboard: {
      total_pago,
      total_aberto,
      total_atraso,
      percentual_quitado,
      percentual_restante,
      parcelas_pagas,
      parcelas_pendentes,
      parcelas_atraso,
    },
    resumo: {
      proxima,
      ultima,
      parcelas_pagas,
      parcelas_totais: carta.parcelas_totais,
      saldo_devedor,
      total_pago,
    },
  };
}

async function generateParcelas(supabaseAdmin: any, cartaId: string, opts: {
  parcelas_totais: number;
  parcelas_valores: number[];
  primeiro_vencimento: string;
}) {
  await supabaseAdmin.from("carta_parcelas").delete().eq("carta_id", cartaId);
  const rows = [];
  for (let i = 0; i < opts.parcelas_totais; i++) {
    rows.push({
      carta_id: cartaId,
      numero: i + 1,
      vencimento: addMonths(opts.primeiro_vencimento, i),
      valor: opts.parcelas_valores[i],
      status: "pendente",
    });
  }
  await supabaseAdmin.from("carta_parcelas").insert(rows);
}

export const Route = createFileRoute("/api/bbc")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 200 }),
      POST: async ({ request }) => {
        let body: { action?: string; data?: any };
        try {
          body = await request.json();
        } catch {
          return jsonError("Corpo da requisição inválido.");
        }
        const action = body?.action;
        const data = body?.data ?? {};
        if (!action) return jsonError("Ação não informada.");

        const { supabaseAdmin, userId, role } = await getAuth(request);

        const requireAuth = () => {
          if (!userId) throw jsonErrorThrow("Não autenticado.", 401);
        };
        const requireRole = (...roles: AppRole[]) => {
          requireAuth();
          if (!role || !roles.includes(role)) throw jsonErrorThrow("Acesso negado.", 403);
        };

        function jsonErrorThrow(message: string, status: number): never {
          const err: any = new Error(message);
          err.__status = status;
          throw err;
        }

        try {
          switch (action) {
            /* ===================== PUBLIC ===================== */
            case "resolveClienteLogin": {
              const cpf = String(data.cpf ?? "").replace(/\D/g, "");
              if (cpf.length !== 11) return jsonError("CPF inválido.");
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("email")
                .eq("cpf", cpf)
                .maybeSingle();
              if (!profile) return jsonError("Cliente não encontrado.", 404);
              return Response.json({ email: profile.email });
            }

            /* ===================== USERS (admin) ===================== */
            case "listUsers": {
              requireRole("admin");
              const { data: roles } = await supabaseAdmin
                .from("user_roles")
                .select("user_id, role")
                .in("role", ["admin", "consultor"]);
              const ids = (roles ?? []).map((r: any) => r.user_id);
              if (ids.length === 0) return Response.json([]);
              const { data: profiles } = await supabaseAdmin.from("profiles").select("*").in("user_id", ids);
              const roleByUser: Record<string, string> = {};
              (roles ?? []).forEach((r: any) => (roleByUser[r.user_id] = r.role));
              const result = (profiles ?? []).map((p: any) => ({ ...p, user_roles: { role: roleByUser[p.user_id] } }));
              return Response.json(result);
            }

            case "createUser": {
              requireRole("admin");
              const { email, password, name, role: newRole, cpf, phone, whatsapp } = data;
              if (!email || !password || !name || !newRole) return jsonError("Dados incompletos.");
              const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
              });
              if (createErr || !created?.user) return jsonError(createErr?.message || "Falha ao criar usuário.");
              const newUserId = created.user.id;
              const { error: profErr } = await supabaseAdmin.from("profiles").insert({
                user_id: newUserId,
                email,
                name,
                cpf: cpf || null,
                phone: phone || null,
                whatsapp: whatsapp || null,
                status: "ativo",
              });
              if (profErr) return jsonError(profErr.message);
              const { error: roleErr } = await supabaseAdmin
                .from("user_roles")
                .insert({ user_id: newUserId, role: newRole });
              if (roleErr) return jsonError(roleErr.message);
              return Response.json({ ok: true, user_id: newUserId });
            }

            case "updateUser": {
              requireRole("admin");
              const { userId: targetId, name, email, role: newRole, cpf, phone, whatsapp } = data;
              if (!targetId) return jsonError("Usuário não informado.");
              const updates: Record<string, any> = {};
              if (name !== undefined) updates.name = name;
              if (email !== undefined) updates.email = email;
              if (cpf !== undefined) updates.cpf = cpf;
              if (phone !== undefined) updates.phone = phone;
              if (whatsapp !== undefined) updates.whatsapp = whatsapp;
              if (Object.keys(updates).length > 0) {
                const { error } = await supabaseAdmin.from("profiles").update(updates as never).eq("user_id", targetId);
                if (error) return jsonError(error.message);
              }
              if (newRole) {
                const { error } = await supabaseAdmin
                  .from("user_roles")
                  .update({ role: newRole })
                  .eq("user_id", targetId);
                if (error) return jsonError(error.message);
              }
              return Response.json({ ok: true });
            }

            case "deleteUser": {
              requireRole("admin");
              const targetId = data.userId;
              if (!targetId) return jsonError("Usuário não informado.");
              const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId);
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            /* ===================== CLIENTS (admin/consultor) ===================== */
            case "listClients": {
              requireRole("admin", "consultor");
              const { data: roles } = await supabaseAdmin
                .from("user_roles")
                .select("user_id")
                .eq("role", "cliente");
              const ids = (roles ?? []).map((r: any) => r.user_id);
              if (ids.length === 0) return Response.json([]);
              let query = supabaseAdmin.from("profiles").select("*").in("user_id", ids);
              if (role === "consultor") query = query.eq("consultor_user_id", userId);
              const { data: profiles, error } = await query;
              if (error) return jsonError(error.message);
              return Response.json(profiles ?? []);
            }

            case "createClient": {
              requireRole("admin", "consultor");
              const { name, cpf, phone, whatsapp, password, status } = data;
              const cpfDigits = String(cpf ?? "").replace(/\D/g, "");
              if (!name || cpfDigits.length !== 11 || !password) return jsonError("Dados incompletos.");
              const email = `${cpfDigits}@clientes.bbc.local`;
              const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
              });
              if (createErr || !created?.user) return jsonError(createErr?.message || "Falha ao criar cliente.");
              const newUserId = created.user.id;
              const { error: profErr } = await supabaseAdmin.from("profiles").insert({
                user_id: newUserId,
                email,
                name,
                cpf: cpfDigits,
                phone: phone || null,
                whatsapp: whatsapp || phone || null,
                status: status || "ativo",
                consultor_user_id: role === "consultor" ? userId : null,
              });
              if (profErr) return jsonError(profErr.message);
              const { error: roleErr } = await supabaseAdmin
                .from("user_roles")
                .insert({ user_id: newUserId, role: "cliente" });
              if (roleErr) return jsonError(roleErr.message);
              return Response.json({ ok: true, user_id: newUserId });
            }

            case "updateClient": {
              requireRole("admin", "consultor");
              const { id, name, cpf, phone, whatsapp, status } = data;
              if (!id) return jsonError("Cliente não informado.");
              const { data: existing } = await supabaseAdmin.from("profiles").select("*").eq("id", id).maybeSingle();
              if (!existing) return jsonError("Cliente não encontrado.", 404);
              if (role === "consultor" && existing.consultor_user_id !== userId) return jsonError("Acesso negado.", 403);
              const updates: Record<string, any> = {};
              if (name !== undefined) updates.name = name;
              if (cpf !== undefined) updates.cpf = String(cpf).replace(/\D/g, "");
              if (phone !== undefined) updates.phone = phone;
              if (whatsapp !== undefined) updates.whatsapp = whatsapp;
              if (status !== undefined) updates.status = status;
              const { error } = await supabaseAdmin.from("profiles").update(updates as never).eq("id", id);
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            case "deleteClient": {
              requireRole("admin", "consultor");
              const { id } = data;
              if (!id) return jsonError("Cliente não informado.");
              const { data: existing } = await supabaseAdmin.from("profiles").select("*").eq("id", id).maybeSingle();
              if (!existing) return jsonError("Cliente não encontrado.", 404);
              if (role === "consultor" && existing.consultor_user_id !== userId) return jsonError("Acesso negado.", 403);
              const { error } = await supabaseAdmin.auth.admin.deleteUser(existing.user_id);
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            case "resetClientPassword": {
              requireRole("admin", "consultor");
              const { id, password } = data;
              if (!id || !password) return jsonError("Dados incompletos.");
              const { data: existing } = await supabaseAdmin.from("profiles").select("*").eq("id", id).maybeSingle();
              if (!existing) return jsonError("Cliente não encontrado.", 404);
              if (role === "consultor" && existing.consultor_user_id !== userId) return jsonError("Acesso negado.", 403);
              const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.user_id, { password });
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            case "listConsultores": {
              requireRole("admin");
              const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "consultor");
              const ids = (roles ?? []).map((r: any) => r.user_id);
              if (ids.length === 0) return Response.json([]);
              const { data: profiles } = await supabaseAdmin.from("profiles").select("*").in("user_id", ids);
              return Response.json(profiles ?? []);
            }

            case "getDashboardStats": {
              requireRole("admin", "consultor");
              const { data: clienteRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "cliente");
              const clienteIds = (clienteRoles ?? []).map((r: any) => r.user_id);
              let clientesCount = 0;
              if (clienteIds.length > 0) {
                let q = supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).in("user_id", clienteIds);
                if (role === "consultor") q = q.eq("consultor_user_id", userId);
                const { count } = await q;
                clientesCount = count ?? 0;
              }
              let consultoresCount = 0;
              if (role === "admin") {
                const { count } = await supabaseAdmin
                  .from("user_roles")
                  .select("user_id", { count: "exact", head: true })
                  .eq("role", "consultor");
                consultoresCount = count ?? 0;
              }
              const { count: disponiveisCount } = await supabaseAdmin
                .from("cartas")
                .select("id", { count: "exact", head: true })
                .eq("situacao", "disponivel");
              const { count: vendidasCount } = await supabaseAdmin
                .from("cartas")
                .select("id", { count: "exact", head: true })
                .eq("situacao", "vendida");
              const { data: recentProfiles } = await supabaseAdmin
                .from("profiles")
                .select("id,name,created_at,user_id")
                .order("created_at", { ascending: false })
                .limit(5);
              const recentIds = (recentProfiles ?? []).map((p: any) => p.user_id);
              const { data: recentRoles } = recentIds.length
                ? await supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", recentIds)
                : { data: [] };
              const roleMap: Record<string, string> = {};
              (recentRoles ?? []).forEach((r: any) => (roleMap[r.user_id] = r.role));
              const recentes = (recentProfiles ?? []).map((p: any) => ({
                id: p.id,
                name: p.name,
                role: roleMap[p.user_id] ?? "cliente",
                createdAt: p.created_at,
              }));
              return Response.json({
                clientes: clientesCount,
                consultores: consultoresCount,
                cartasDisponiveis: disponiveisCount ?? 0,
                cartasVendidas: vendidasCount ?? 0,
                recentes,
              });
            }

            /* ===================== CARTAS (admin/consultor) ===================== */
            case "listCartas": {
              requireRole("admin", "consultor");
              const { data: cartas, error } = await supabaseAdmin
                .from("cartas")
                .select("*, cliente:profiles!cartas_cliente_id_fkey(id,name,consultor_user_id)")
                .order("created_at", { ascending: false });
              if (error) return jsonError(error.message);
              let list = cartas ?? [];
              if (role === "consultor") {
                list = list.filter((c: any) => c.cliente?.consultor_user_id === userId);
              }
              return Response.json(list);
            }

            case "getConfig": {
              requireRole("admin", "consultor");
              const { data: rows } = await supabaseAdmin.from("app_config").select("*");
              const cfg: Record<string, any> = {};
              (rows ?? []).forEach((r: any) => (cfg[r.key] = r.value));
              return Response.json(cfg);
            }

            case "setConfig": {
              requireRole("admin");
              const entries = Object.entries(data ?? {});
              for (const [key, value] of entries) {
                await supabaseAdmin.from("app_config").upsert({ key, value: value as any, updated_at: new Date().toISOString() });
              }
              return Response.json({ ok: true });
            }

            case "listModelos": {
              requireRole("admin", "consultor");
              const { data: rows, error } = await supabaseAdmin.from("carta_modelos").select("*").order("nome");
              if (error) return jsonError(error.message);
              return Response.json(rows ?? []);
            }

            case "saveModelo": {
              requireRole("admin");
              const { id, nome, administradora, valor_bem, parcelas_totais, percentual_administrativo, descricao } = data;
              if (!nome || !valor_bem || !parcelas_totais) return jsonError("Dados incompletos.");
              const payload: any = {
                nome,
                administradora: administradora ?? null,
                valor_bem,
                parcelas_totais,
                percentual_administrativo: percentual_administrativo ?? 12,
                descricao: descricao ?? null,
                updated_at: new Date().toISOString(),
              };
              if (id) {
                const { error } = await supabaseAdmin.from("carta_modelos").update(payload).eq("id", id);
                if (error) return jsonError(error.message);
              } else {
                payload.created_by = userId;
                const { error } = await supabaseAdmin.from("carta_modelos").insert(payload);
                if (error) return jsonError(error.message);
              }
              return Response.json({ ok: true });
            }

            case "deleteModelo": {
              requireRole("admin");
              const { id } = data;
              if (!id) return jsonError("Modelo não informado.");
              const { error } = await supabaseAdmin.from("carta_modelos").delete().eq("id", id);
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            case "upsertCarta": {
              requireRole("admin", "consultor");
              const {
                id, administradora, grupo, cota, cliente_id, valor_bem, parcelas_totais,
                data_adesao, percentual_administrativo, situacao, categoria, bem_especifico, descricao,
              } = data;
              if (!administradora || !grupo || !cota || !valor_bem || !parcelas_totais || !data_adesao) {
                return jsonError("Dados incompletos.");
              }
              const calc = calcularCarta({ valor_bem, parcelas_totais, percentual_administrativo });
              const primeiro_vencimento = calcularPrimeiroVencimento(data_adesao);
              const payload: any = {
                administradora,
                grupo,
                cota,
                cliente_id: cliente_id || null,
                valor_bem: calc.valor_bem,
                valor_administrativo: calc.valor_administrativo,
                valor_total: calc.valor_total,
                parcela: calc.parcelas[0],
                parcelas_totais,
                percentual_administrativo,
                data_adesao,
                primeiro_vencimento,
                situacao: situacao ?? "disponivel",
                categoria: categoria ?? null,
                bem_especifico: bem_especifico ?? null,
                descricao: descricao ?? null,
                credito_disponivel: calc.valor_bem,
                saldo_devedor: calc.valor_total,
                updated_at: new Date().toISOString(),
              };

              let cartaId = id;
              if (id) {
                const { error } = await supabaseAdmin.from("cartas").update(payload).eq("id", id);
                if (error) return jsonError(error.message);
              } else {
                const { data: inserted, error } = await supabaseAdmin.from("cartas").insert(payload).select("id").single();
                if (error) return jsonError(error.message);
                cartaId = inserted.id;
              }
              await generateParcelas(supabaseAdmin, cartaId, {
                parcelas_totais,
                parcelas_valores: calc.parcelas,
                primeiro_vencimento,
              });
              await recomputeCartaTotals(supabaseAdmin, cartaId);
              await supabaseAdmin.from("payment_history").insert({
                carta_id: cartaId,
                event_type: id ? "carta_atualizada" : "carta_criada",
                created_by: userId,
              });
              return Response.json({ ok: true, id: cartaId });
            }

            case "getCarta": {
              requireRole("admin", "consultor");
              const { id } = data;
              if (!id) return jsonError("Carta não informada.");
              const { data: carta, error } = await supabaseAdmin
                .from("cartas")
                .select("*, cliente:profiles!cartas_cliente_id_fkey(id,name,consultor_user_id)")
                .eq("id", id)
                .maybeSingle();
              if (error || !carta) return jsonError("Carta não encontrada.", 404);
              if (role === "consultor" && carta.cliente?.consultor_user_id !== userId) return jsonError("Acesso negado.", 403);
              const { parcelas, dashboard } = await buildCartaDashboard(supabaseAdmin, id, carta);
              return Response.json({ carta, parcelas, dashboard });
            }

            case "deleteCarta": {
              requireRole("admin", "consultor");
              const { id } = data;
              if (!id) return jsonError("Carta não informada.");
              await supabaseAdmin.from("carta_parcelas").delete().eq("carta_id", id);
              const { error } = await supabaseAdmin.from("cartas").delete().eq("id", id);
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            case "toggleParcelaPaga": {
              requireRole("admin", "consultor");
              const { id, pago } = data;
              if (!id) return jsonError("Parcela não informada.");
              const { data: parcela } = await supabaseAdmin.from("carta_parcelas").select("*").eq("id", id).maybeSingle();
              if (!parcela) return jsonError("Parcela não encontrada.", 404);
              const updates: any = pago
                ? { status: "pago", pago_em: new Date().toISOString(), pago_por: userId }
                : { status: "pendente", pago_em: null, pago_por: null };
              const { error } = await supabaseAdmin.from("carta_parcelas").update(updates as never).eq("id", id);
              if (error) return jsonError(error.message);
              await supabaseAdmin.from("payment_history").insert({
                carta_id: parcela.carta_id,
                event_type: pago ? "pagamento_registrado" : "pagamento_estornado",
                installment_number: parcela.numero,
                amount: parcela.valor,
                due_date: parcela.vencimento,
                payment_date: pago ? toISODate(new Date()) : null,
                created_by: userId,
              });
              await recomputeCartaTotals(supabaseAdmin, parcela.carta_id);
              return Response.json({ ok: true });
            }

            case "listPaymentHistory": {
              requireRole("admin", "consultor");
              const { carta_id } = data;
              if (!carta_id) return jsonError("Carta não informada.");
              const { data: rows, error } = await supabaseAdmin
                .from("payment_history")
                .select("*")
                .eq("carta_id", carta_id)
                .order("created_at", { ascending: false });
              if (error) return jsonError(error.message);
              const creatorIds = Array.from(new Set((rows ?? []).map((r: any) => r.created_by).filter(Boolean)));
              const { data: profiles } = creatorIds.length
                ? await supabaseAdmin.from("profiles").select("user_id,name").in("user_id", creatorIds)
                : { data: [] };
              const nameMap: Record<string, string> = {};
              (profiles ?? []).forEach((p: any) => (nameMap[p.user_id] = p.name));
              const result = (rows ?? []).map((r: any) => ({ ...r, created_by_name: nameMap[r.created_by] ?? "—" }));
              return Response.json(result);
            }

            case "markAllParcelasPagas": {
              requireRole("admin", "consultor");
              const { carta_id, numero } = data;
              if (!carta_id) return jsonError("Carta não informada.");
              let query = supabaseAdmin.from("carta_parcelas").select("*").eq("carta_id", carta_id).neq("status", "pago");
              if (numero) query = query.lte("numero", numero);
              const { data: pendentes } = await query;
              const list = pendentes ?? [];
              for (const p of list) {
                await supabaseAdmin
                  .from("carta_parcelas")
                  .update({ status: "pago", pago_em: new Date().toISOString(), pago_por: userId })
                  .eq("id", p.id);
                await supabaseAdmin.from("payment_history").insert({
                  carta_id,
                  event_type: "pagamento_registrado",
                  installment_number: p.numero,
                  amount: p.valor,
                  due_date: p.vencimento,
                  payment_date: p.vencimento,
                  created_by: userId,
                });
              }
              await recomputeCartaTotals(supabaseAdmin, carta_id);
              return Response.json({ ok: true, marked: list.length });
            }

            /* ===================== CLIENTE (own data) ===================== */
            case "listMinhasCartas": {
              requireRole("cliente");
              const profile = await profileByUserId(supabaseAdmin, userId!);
              if (!profile) return jsonError("Perfil não encontrado.", 404);
              const { data: cartas, error } = await supabaseAdmin
                .from("cartas")
                .select("*")
                .eq("cliente_id", profile.id)
                .order("created_at", { ascending: false });
              if (error) return jsonError(error.message);
              return Response.json(cartas ?? []);
            }

            case "getMinhaCarta": {
              requireRole("cliente");
              const { id } = data;
              if (!id) return jsonError("Carta não informada.");
              const profile = await profileByUserId(supabaseAdmin, userId!);
              const { data: carta, error } = await supabaseAdmin.from("cartas").select("*").eq("id", id).maybeSingle();
              if (error || !carta) return jsonError("Carta não encontrada.", 404);
              if (!profile || carta.cliente_id !== profile.id) return jsonError("Acesso negado.", 403);
              const { parcelas, resumo } = await buildCartaDashboard(supabaseAdmin, id, carta);
              return Response.json({ carta, parcelas, resumo });
            }

            case "getMyProfile": {
              requireRole("cliente");
              const profile = await profileByUserId(supabaseAdmin, userId!);
              if (!profile) return jsonError("Perfil não encontrado.", 404);
              const [rg_doc_url, cnh_doc_url, address_proof_url] = await Promise.all([
                docSignedUrl(supabaseAdmin, profile.rg_doc_path),
                docSignedUrl(supabaseAdmin, profile.cnh_doc_path),
                docSignedUrl(supabaseAdmin, profile.address_proof_path),
              ]);
              return Response.json({ ...profile, rg_doc_url, cnh_doc_url, address_proof_url });
            }

            case "updateMyProfile": {
              requireRole("cliente");
              const allowed = [
                "name", "rg", "birth_date", "marital_status", "profession",
                "email", "phone", "whatsapp", "cep", "street", "number",
                "complement", "neighborhood", "city", "state", "country",
              ];
              const updates: Record<string, any> = {};
              for (const key of allowed) {
                if (data[key] !== undefined) updates[key] = data[key] || null;
              }
              const { error } = await supabaseAdmin.from("profiles").update(updates as never).eq("user_id", userId!);
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            case "saveMyDocument": {
              requireRole("cliente");
              const { kind, path } = data;
              if (!["rg", "cnh", "address_proof"].includes(kind) || !path) return jsonError("Dados incompletos.");
              const column = kind === "address_proof" ? "address_proof_path" : `${kind}_doc_path`;
              const { error } = await supabaseAdmin.from("profiles").update({ [column]: path } as never).eq("user_id", userId!);
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            case "deleteMyDocument": {
              requireRole("cliente");
              const { kind } = data;
              if (!["rg", "cnh", "address_proof"].includes(kind)) return jsonError("Dados incompletos.");
              const column = kind === "address_proof" ? "address_proof_path" : `${kind}_doc_path`;
              const profile = await profileByUserId(supabaseAdmin, userId!);
              const existingPath = profile?.[column];
              if (existingPath) {
                await supabaseAdmin.storage.from("client-documents").remove([existingPath]);
              }
              const { error } = await supabaseAdmin.from("profiles").update({ [column]: null } as never).eq("user_id", userId!);
              if (error) return jsonError(error.message);
              return Response.json({ ok: true });
            }

            default:
              return jsonError(`Ação desconhecida: ${action}`, 400);
          }
        } catch (err: any) {
          const status = err?.__status ?? 400;
          return jsonError(err?.message ?? "Erro inesperado.", status);
        }
      },
    },
  },
});
