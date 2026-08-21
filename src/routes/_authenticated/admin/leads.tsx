import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { adminSupabase } from "@/lib/dual-supabase";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({
    meta: [
      { title: "Solicitações do Simulador — BBC Consórcios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadsPage,
});

type Lead = {
  id: string;
  categoria: string;
  credito: number;
  prazo: number;
  parcela: number;
  nome: string;
  cpf: string;
  nascimento: string | null;
  email: string;
  telefone: string;
  status: string;
  observacoes: string | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "convertido", label: "Convertido" },
  { value: "descartado", label: "Descartado" },
];

const brl = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function waLink(phone: string, nome: string, categoria: string) {
  const p = onlyDigits(phone);
  const num = p.length >= 11 && !p.startsWith("55") ? `55${p}` : p;
  const msg = encodeURIComponent(
    `Olá ${nome.split(" ")[0]}, aqui é da BBC Consórcios. Recebemos sua simulação de ${categoria} e queremos ajudar você a dar o próximo passo.`,
  );
  return `https://wa.me/${num}?text=${msg}`;
}

function LeadsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "leads"],
    queryFn: async () => {
      const { data, error } = await adminSupabase
        .from("simulacao_leads" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await adminSupabase
        .from("simulacao_leads" as any)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "leads"] });
      toast.success("Status atualizado.");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao atualizar."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await adminSupabase.from("simulacao_leads" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "leads"] });
      toast.success("Solicitação removida.");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao remover."),
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const term = q.trim().toLowerCase();
    return list.filter((l) => {
      if (filterStatus !== "todos" && l.status !== filterStatus) return false;
      if (!term) return true;
      return (
        l.nome.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        onlyDigits(l.cpf).includes(onlyDigits(term)) ||
        onlyDigits(l.telefone).includes(onlyDigits(term)) ||
        l.categoria.toLowerCase().includes(term)
      );
    });
  }, [data, q, filterStatus]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: data?.length ?? 0 };
    STATUS_OPTIONS.forEach((s) => (c[s.value] = 0));
    (data ?? []).forEach((l) => (c[l.status] = (c[l.status] ?? 0) + 1));
    return c;
  }, [data]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Solicitações do Simulador</h1>
          <p className="text-muted-foreground">
            Contatos enviados pelos visitantes através do simulador de consórcio.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-5">
          {[{ value: "todos", label: "Todos" }, ...STATUS_OPTIONS].map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                filterStatus === s.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="text-2xl font-display font-bold text-foreground">
                {counts[s.value] ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome, e-mail, CPF, telefone ou categoria"
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          {isLoading && <div className="p-8 text-center text-muted-foreground">Carregando…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              Nenhuma solicitação encontrada.
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <ul className="divide-y divide-border">
              {filtered.map((l) => (
                <li key={l.id} className="p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{l.nome}</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 capitalize">
                          {l.categoria}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(l.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        CPF {l.cpf}
                        {l.nascimento && (
                          <> · Nasc. {new Date(l.nascimento).toLocaleDateString("pt-BR")}</>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-foreground hover:text-primary">
                          <Mail className="h-4 w-4" /> {l.email}
                        </a>
                        <a href={`tel:${onlyDigits(l.telefone)}`} className="inline-flex items-center gap-1 text-foreground hover:text-primary">
                          <Phone className="h-4 w-4" /> {l.telefone}
                        </a>
                        <a
                          href={waLink(l.telefone, l.nome, l.categoria)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:opacity-80"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      </div>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <Info k="Crédito" v={brl(l.credito)} />
                        <Info k="Prazo" v={`${l.prazo} meses`} />
                        <Info k="Parcela" v={brl(l.parcela)} />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <select
                        value={l.status}
                        onChange={(e) => updateStatus.mutate({ id: l.id, status: e.target.value })}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Remover esta solicitação?")) remove.mutate(l.id);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 border border-border px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-semibold text-foreground">{v}</div>
    </div>
  );
}
