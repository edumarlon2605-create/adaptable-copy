import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useWhatsapp } from "@/lib/whatsapp-config";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Home, Search, LogOut, Wrench, Barcode, FileText,
  ChevronLeft, ChevronRight, User, KeyRound, Info, ChevronDown, ChevronUp,
  Car, Bike, Truck, Ship, Plane, Cog, Sun, Package, Building2,
  TrendingUp,
} from "lucide-react";

const CATEGORIA_ICONS: Record<string, any> = {
  "imóvel": Building2,
  "imovel": Building2,
  "automóvel": Car,
  "automovel": Car,
  "motocicleta": Bike,
  "caminhão/utilitário": Truck,
  "caminhão / utilitário": Truck,
  "caminhao/utilitario": Truck,
  "caminhao / utilitario": Truck,
  "serviços": Wrench,
  "servicos": Wrench,
  "náutico": Ship,
  "nautico": Ship,
  "aeronave": Plane,
  "máquinas e equipamentos": Cog,
  "maquinas e equipamentos": Cog,
  "energia solar": Sun,
  "outros": Package,
};
import { useClienteAuth } from "@/lib/auth-context";
import { getMyProfile } from "@/lib/client-profile.functions";
import { listMinhasCartas, getMinhaCarta } from "@/lib/cartas.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cliente/")({
  head: () => ({
    meta: [
      { title: "Minha Conta — BBC Consórcios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClienteHome,
});

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtBRL = (n: number | null | undefined) =>
  n == null ? "R$ 0,00" : BRL.format(Number(n));
const fmtDate = (s?: string | null) =>
  s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—";
const pad3 = (n: number | string) => String(n).padStart(3, "0");
const pad4 = (n: number | string) => String(n).padStart(4, "0");

function ClienteHome() {
  const wa = useWhatsapp();
  const router = useRouter();
  const { signOut } = useClienteAuth();
  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: getMyProfile });
  const { data: cartas, isLoading } = useQuery({
    queryKey: ["me", "cartas"],
    queryFn: listMinhasCartas,
    refetchOnWindowFocus: true,
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [extratoOpen, setExtratoOpen] = useState(false);
  const list = (cartas as any[]) || [];
  const carta = list[selectedIdx] ?? null;

  const { data: detail } = useQuery({
    queryKey: ["me", "carta", carta?.id],
    queryFn: () => getMinhaCarta({ data: { id: carta.id } }),
    enabled: !!carta?.id,
  });

  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/login" });
  }

  const parcelas: any[] = detail?.parcelas ?? [];
  const resumo = detail?.resumo;
  const pagas = useMemo(
    () => parcelas.filter((p) => p.status === "pago").sort((a, b) => b.numero - a.numero),
    [parcelas],
  );
  const proxima = resumo?.proxima ?? carta?.proxima_parcela ?? null;
  const ultima = resumo?.ultima ?? null;
  const parcelasPagas = resumo?.parcelas_pagas ?? carta?.parcelas_pagas ?? 0;
  const parcelasTotais = resumo?.parcelas_totais ?? carta?.parcelas_totais ?? 0;
  const pct = parcelasTotais > 0 ? (parcelasPagas / parcelasTotais) * 100 : 0;

  const valorBem = Number(carta?.valor_bem ?? 0);
  const saldoDevedor = Number(resumo?.saldo_devedor ?? 0);
  const valorPago = Number(resumo?.total_pago ?? 0);

  const nomeUpper = (profile?.name || "cliente").toUpperCase();

  return (
    <div className="min-h-screen bg-[#f2f2f2] flex flex-col">
      {/* Top bar */}
      <header className="bg-[#176F62] text-white">
        <div className="mx-auto max-w-screen-2xl px-4 h-16 flex items-center gap-4">
          <Link to="/cliente" className="flex items-center gap-2 shrink-0">
            <img src="/favicon-512.png" alt="BBC" className="h-10 w-10 rounded-md object-contain" />
            <div className="leading-tight">
              <div className="font-display text-xl font-extrabold tracking-tight">BBC</div>
              <div className="text-xs -mt-0.5 opacity-90">Consórcio</div>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl relative">
            <input
              className="w-full h-11 rounded-lg pl-4 pr-10 text-foreground placeholder:text-muted-foreground bg-white outline-none"
              placeholder="Faça uma Busca"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#e0a800]" />
          </div>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <a
              href={wa.url}
              target="_blank" rel="noreferrer"
              className="hidden sm:grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M20.52 3.48A11.9 11.9 0 0 0 12.06 0C5.5 0 .17 5.33.17 11.9c0 2.1.55 4.14 1.6 5.94L0 24l6.34-1.66a11.87 11.87 0 0 0 5.72 1.46h.01c6.56 0 11.89-5.33 11.89-11.9 0-3.18-1.24-6.17-3.44-8.42Zm-8.46 18.3h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.76.98 1-3.66-.24-.38a9.86 9.86 0 0 1-1.51-5.23c0-5.46 4.44-9.9 9.92-9.9 2.65 0 5.14 1.03 7.01 2.9a9.83 9.83 0 0 1 2.9 7.02c0 5.46-4.44 9.86-9.91 9.86Zm5.44-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.52-.07-.15-.66-1.6-.9-2.19-.24-.58-.48-.5-.66-.5h-.56c-.2 0-.52.07-.79.38-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
              </svg>
            </a>
            <button className="uppercase font-semibold tracking-wide hover:underline">Alto Contraste</button>
            <div className="flex items-center gap-1">
              <button className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 font-semibold" aria-label="Aumentar fonte">A+</button>
              <button className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 font-semibold" aria-label="Diminuir fonte">A-</button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-24 bg-[#176F62] text-white/95 shrink-0">
          <nav className="flex flex-col items-center gap-6 py-6 text-[11px] font-semibold uppercase tracking-wide">
            <SideBtn icon={Home} label="Início" active />
            <SideBtn icon={Wrench} label="Serviços" onClick={() => router.navigate({ to: "/cliente/perfil" })} />
            <SideBtn icon={LogOut} label="Sair" onClick={handleSignOut} />

          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
          {isLoading ? (
            <div className="grid place-items-center h-64">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#176F62] border-t-transparent" />
            </div>
          ) : list.length === 0 ? (
            <EmptyState onEdit={() => router.navigate({ to: "/cliente/perfil" })} nome={profile?.name} />
          ) : (
            <>
              {list.length > 1 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Suas cartas:</span>
                  {list.map((c: any, i: number) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedIdx(i)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                        i === selectedIdx
                          ? "bg-[#176F62] text-white border-[#176F62]"
                          : "bg-white text-[#176F62] border-[#176F62]/30 hover:bg-[#176F62]/5"
                      }`}
                    >
                      Grupo {pad3(c.grupo)} · Cota {pad4(c.cota)}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Coluna 1 — Resumo da carta */}
                <section className="bg-white rounded-md shadow-sm p-5">
                  <div className="text-[15px] font-extrabold text-[#176F62]">
                    OLÁ {nomeUpper}
                    <span className="ml-2 align-middle text-xs font-semibold text-muted-foreground">CONSORCIADO</span>
                  </div>

                  <div className="mt-3 rounded-md bg-[#fff8d6] border border-[#f2d97a] px-4 py-2 font-bold text-[#3a3a3a] text-center uppercase tracking-wide">
                    Grupo {pad3(carta.grupo)} · Cota {pad4(carta.cota)}
                  </div>


                  <dl className="mt-4 text-sm divide-y divide-dashed">
                    <Row label="Valor do Bem" value={fmtBRL(valorBem)} info />
                    <Row label="Saldo Devedor" value={fmtBRL(saldoDevedor)} />
                    <Row label="Valores Pagos" value={fmtBRL(valorPago)} />
                    <Row label="Crédito Disponível" value={fmtBRL(valorBem)} info />
                  </dl>

                  <div className="mt-4 rounded-lg bg-gradient-to-br from-[#176F62] to-[#125c52] text-white px-4 py-4 shadow-md">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide opacity-90">
                      <Info className="h-3.5 w-3.5" />
                      Crédito Disponível
                    </div>
                    <div className="mt-1 font-display text-2xl font-extrabold">
                      {fmtBRL(valorBem)}
                    </div>
                    <div className="mt-1 text-[11px] opacity-80">
                      Valor do bem como referência
                    </div>
                  </div>


                  <dl className="mt-4 text-sm divide-y">
                    <Row label="Data da Contemplação" value={fmtDate(carta.data_contemplacao)} />
                    <Row label="Data de Adesão" value={fmtDate(carta.data_adesao)} />
                    <Row label="Previsão de Encerramento" value={fmtDate(ultima?.vencimento)} />
                    <Row label="Última Parcela" value={fmtDate(ultima?.vencimento)} />
                  </dl>
                  <button className="mt-1 text-xs font-semibold text-[#e0a800] hover:underline">
                    ver detalhes →
                  </button>

                  <div className="mt-6 flex flex-col items-center gap-2 text-[#176F62]">
                    <div className="flex items-center gap-3 self-start">
                      <div className="grid h-10 w-10 place-items-center rounded-md bg-[#176F62]/10">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="font-extrabold uppercase text-sm">
                        Crédito {String(carta.categoria || "consórcio").toUpperCase()} {fmtBRL(valorBem)}
                      </div>
                    </div>
                    {(() => {
                      const key = String(carta.categoria || "").toLowerCase().trim();
                      const Icon = CATEGORIA_ICONS[key];
                      if (!Icon) return null;
                      return (
                        <div className="mt-2 grid h-24 w-24 place-items-center rounded-full bg-[#176F62]/10 border-2 border-[#176F62]/20">
                          <Icon className="h-12 w-12 text-[#176F62]" strokeWidth={1.5} />
                        </div>
                      );
                    })()}
                  </div>
                </section>

                {/* Coluna 2 — Boleto + Proposta + Extrato */}
                <section className="flex flex-col gap-4">
                  <Card title="2ª Via de Boleto" icon={Barcode}>
                    {proxima ? (
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#176F62]/10 text-[#176F62] font-bold">
                          {pad3(proxima.numero)}
                        </div>
                        <div className="flex-1 grid grid-cols-2 text-sm">
                          <span className="font-semibold">{fmtDate(proxima.vencimento)}</span>
                          <span className="text-right font-semibold">{fmtBRL(proxima.valor)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma parcela em aberto.</p>
                    )}
                    <div className="mt-3 text-right">
                      <a
                        href={wa.urlWith(
                          `Olá! Sou ${profile?.name || "cliente"} e gostaria de solicitar a 2ª via do meu boleto${proxima ? ` (parcela ${pad3(proxima.numero)} - vencimento ${fmtDate(proxima.vencimento)})` : ""}.`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#e0a800] hover:underline"
                      >
                        ver detalhes →
                      </a>
                    </div>
                  </Card>

                  <Card title="simular novo consórcio" icon={TrendingUp}>
                    <p className="text-sm text-muted-foreground">
                      Simule uma nova proposta de consórcio na hora, escolhendo categoria, valor e prazo.
                    </p>
                    <div className="mt-3 text-right">
                      <Link
                        to="/simulador/$categoria"
                        params={{ categoria: "imovel" }}
                        target="_blank"
                        className="text-xs font-semibold text-[#e0a800] hover:underline"
                      >
                        começar simulação →
                      </Link>
                    </div>
                  </Card>

                  <div className="bg-white rounded-md shadow-sm p-5">
                    <button
                      type="button"
                      onClick={() => setExtratoOpen((v) => !v)}
                      className="w-full flex items-center gap-2 text-[#176F62] font-extrabold border-b border-[#176F62]/20 pb-2 mb-3"
                    >
                      <FileText className="h-5 w-5" />
                      <span>Extrato</span>
                      <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-[#e0a800]">
                        {extratoOpen ? "recolher" : "ver detalhes"}
                        {extratoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </button>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#4a4a4a] font-semibold">
                        {parcelasPagas} de {parcelasTotais} parcelas pagas
                      </span>
                      <DonutCounter pagas={parcelasPagas} totais={parcelasTotais} />
                    </div>

                    {extratoOpen && (
                      parcelas.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">Nenhuma parcela registrada.</p>
                      ) : (
                        <div className="mt-4 overflow-x-auto -mx-2 max-h-80 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white">
                              <tr className="text-[11px] uppercase text-muted-foreground border-b">
                                <th className="text-left py-2 px-2 font-semibold">Nº</th>
                                <th className="text-left py-2 px-2 font-semibold">Vencimento</th>
                                <th className="text-right py-2 px-2 font-semibold">Valor</th>
                                <th className="text-center py-2 px-2 font-semibold">Status</th>
                                <th className="text-left py-2 px-2 font-semibold">Pago em</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {[...parcelas].sort((a, b) => a.numero - b.numero).map((p) => (
                                <tr key={p.id}>
                                  <td className="py-2 px-2 font-semibold">{pad3(p.numero)}</td>
                                  <td className="py-2 px-2">{fmtDate(p.vencimento)}</td>
                                  <td className="py-2 px-2 text-right font-semibold">{fmtBRL(p.valor)}</td>
                                  <td className="py-2 px-2 text-center">
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                        p.status === "pago"
                                          ? "bg-[#176F62]/10 text-[#176F62]"
                                          : "bg-[#fff8d6] text-[#8a6a00] border border-[#f2d97a]"
                                      }`}
                                    >
                                      {p.status === "pago" ? "Pago" : "Em aberto"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                                    {p.status === "pago" && p.pago_em
                                      ? new Date(p.pago_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>

                </section>

                {/* Coluna 3 — Demonstrativo + Assembleia + Ações */}
                <section className="flex flex-col gap-4">

                  <div className="rounded-md bg-[#fff8d6] border border-[#f2d97a] px-4 py-3 text-center">
                    <div className="text-xs font-semibold uppercase text-[#3a3a3a]">Encerrado</div>
                    <div className="font-extrabold text-[#3a3a3a]">
                      {carta.data_contemplacao ? String(carta.data_contemplacao).slice(0, 4) : "—"}
                    </div>
                  </div>


                  <Card title="Antecipar / Quitar" icon={FileText}>
                    <button className="w-full mb-2 rounded-md border border-[#176F62] px-4 py-3 text-left font-semibold text-[#3a3a3a] hover:bg-[#176F62]/5 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#176F62]" /> Antecipar Parcelas
                    </button>
                    <button className="w-full rounded-md border border-[#e0a800] bg-[#fff8d6] px-4 py-3 text-left font-semibold text-[#3a3a3a] hover:bg-[#fff2a8] flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#176F62]" /> Quitar Saldo Devedor
                    </button>
                  </Card>

                  <Card title="Meus Dados" icon={User}>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" className="rounded-full gap-2 bg-[#176F62] hover:bg-[#125c52]">
                        <Link to="/cliente/perfil"><User className="h-4 w-4" /> Editar dados</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-full gap-2">
                        <Link to="/cliente/senha"><KeyRound className="h-4 w-4" /> Alterar senha</Link>
                      </Button>
                    </div>
                  </Card>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- Sub-componentes ---------- */
function SideBtn({
  icon: Icon, label, active, onClick,
}: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 opacity-90 hover:opacity-100 ${active ? "opacity-100" : ""}`}
    >
      <span className={`grid h-10 w-10 place-items-center rounded-md ${active ? "bg-white/15" : ""}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span>{label}</span>
    </button>
  );
}

function Card({
  title, icon: Icon, children,
}: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-md shadow-sm p-5">
      <div className="flex items-center gap-2 text-[#176F62] font-extrabold border-b border-[#176F62]/20 pb-2 mb-3">
        <Icon className="h-5 w-5" />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Row({
  label, value, info, bold,
}: { label: string; value: string; info?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={`text-[#4a4a4a] ${bold ? "font-bold" : ""}`}>{label}</span>
      <span className={`text-[#3a3a3a] ${bold ? "font-extrabold" : "font-semibold"} flex items-center gap-1`}>
        {value}
        {info && <Info className="h-3.5 w-3.5 text-[#e0a800]" />}
      </span>
    </div>
  );
}

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 text-right">
      <button className="text-xs font-semibold text-[#e0a800] hover:underline">{children}</button>
    </div>
  );
}

function DonutCounter({ pagas, totais }: { pagas: number; totais: number }) {
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = totais > 0 ? pagas / totais : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="#176F62" strokeWidth={stroke} fill="none"
          strokeDasharray={`${c * pct} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-tight">
        <div>
          <div className="font-extrabold text-[#3a3a3a]">{pagas}/{totais}</div>
          <div className="text-[10px] uppercase text-muted-foreground">Parcelas<br/>Pagas</div>
        </div>
      </div>
    </div>
  );
}

function MiniBars({ pago, utilizado }: { pago: number; utilizado: number }) {
  const max = Math.max(pago, utilizado, 1);
  const h1 = Math.round((pago / max) * 70);
  const h2 = Math.round((utilizado / max) * 70);
  return (
    <div className="flex items-end gap-4 h-20">
      <div className="flex flex-col items-center gap-1">
        <div className="w-6 rounded-t bg-[#176F62]" style={{ height: h1 }} />
        <span className="text-[10px] text-muted-foreground">Coletado</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="w-6 rounded-t bg-[#e0a800]" style={{ height: h2 }} />
        <span className="text-[10px] text-muted-foreground">Utilizado</span>
      </div>
    </div>
  );
}

function MiniDonut({ pct }: { pct: number }) {
  const size = 70, stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#e0a800" strokeWidth={stroke} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r}
        stroke="#176F62" strokeWidth={stroke} fill="none"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
    </svg>
  );
}

function EmptyState({ onEdit, nome }: { onEdit: () => void; nome?: string }) {
  return (
    <div className="mx-auto max-w-2xl bg-white rounded-md shadow-sm p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-[#176F62]">
        Olá, {nome || "cliente"}!
      </h1>
      <p className="text-muted-foreground mt-2">
        Nenhuma carta vinculada ao seu CPF ainda. Complete seu cadastro para agilizar o atendimento.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={onEdit} className="rounded-full bg-[#176F62] hover:bg-[#125c52]">
          Editar meus dados
        </Button>
      </div>
    </div>
  );
}
