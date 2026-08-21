import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useWhatsapp } from "@/lib/whatsapp-config";
import { useMemo, useState } from "react";
import { Home, Car, Bike, Truck, Briefcase, Sparkles, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter, WhatsappFloat } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CategoriaKey = "imoveis" | "automoveis" | "motos" | "caminhoes" | "servicos" | "investimentos";

const TAXA_ADM_MENSAL = 0.0012; // 0,12% ao mês

const CATEGORIAS: Record<CategoriaKey, {
  label: string;
  icon: typeof Home;
  min: number;
  max: number;
  defaultCredito: number;
  prazos: number[];
}> = {
  imoveis:       { label: "Imóveis",       icon: Home,      min: 80000,  max: 2000000, defaultCredito: 350000, prazos: [120, 180, 200, 240] },
  automoveis:    { label: "Automóveis",    icon: Car,       min: 30000,  max: 500000,  defaultCredito: 90000,  prazos: [60, 72, 84, 100] },
  motos:         { label: "Motos",         icon: Bike,      min: 8000,   max: 120000,  defaultCredito: 20000,  prazos: [36, 48, 60, 72] },
  caminhoes:     { label: "Caminhões",     icon: Truck,     min: 100000, max: 1500000, defaultCredito: 350000, prazos: [60, 80, 100, 120] },
  servicos:      { label: "Serviços",      icon: Briefcase, min: 5000,   max: 100000,  defaultCredito: 25000,  prazos: [24, 36, 48, 60] },
  investimentos: { label: "Investimentos", icon: Sparkles,  min: 50000,  max: 1000000, defaultCredito: 200000, prazos: [80, 120, 180, 240] },
};

const CATEGORIA_KEYS = Object.keys(CATEGORIAS) as CategoriaKey[];

function isCategoria(v: string): v is CategoriaKey {
  return (CATEGORIA_KEYS as string[]).includes(v);
}

export const Route = createFileRoute("/simulador/$categoria")({
  head: ({ params }) => {
    const key = isCategoria(params.categoria) ? params.categoria : "imoveis";
    const label = CATEGORIAS[key].label;
    return {
      meta: [
        { title: `Simulador de Consórcio de ${label} — BBC Consórcios` },
        { name: "description", content: `Simule seu consórcio de ${label.toLowerCase()} com a BBC Consórcios. Planejamento executivo, sem juros e regulamentado pelo Banco Central.` },
      ],
    };
  },
  component: SimuladorPage,
});

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function SimuladorPage() {
  const { url: whatsappUrl } = useWhatsapp();
  const { categoria } = Route.useParams();
  const navigate = useNavigate();
  const key: CategoriaKey = isCategoria(categoria) ? categoria : "imoveis";
  const cfg = CATEGORIAS[key];
  const Icon = cfg.icon;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [credito, setCredito] = useState<number>(cfg.defaultCredito);
  const [prazo, setPrazo] = useState<number>(cfg.prazos[1]);

  const parcela = useMemo(() => (credito * (1 + TAXA_ADM_MENSAL * prazo)) / prazo, [credito, prazo]);
  const [creditoInput, setCreditoInput] = useState<string>(() => brl(cfg.defaultCredito));

  const [form, setForm] = useState({ nome: "", cpf: "", nascimento: "", email: "", telefone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (form.nome.trim().length < 3) e.nome = "Informe nome e sobrenome.";
    if (!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(form.cpf.trim())) e.cpf = "CPF inválido.";
    if (!form.nascimento) e.nascimento = "Informe a data de nascimento.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "E-mail inválido.";
    if (form.telefone.replace(/\D/g, "").length < 10) e.telefone = "Telefone/WhatsApp inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("simulacao_leads" as any).insert({
        categoria: cfg.label,
        credito: credito,
        prazo: prazo,
        parcela: Math.round(parcela * 100) / 100,
        nome: form.nome.trim(),
        cpf: form.cpf.trim(),
        nascimento: form.nascimento || null,
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.trim(),
        status: "novo",
      });
      if (error) throw error;
      setStep(3);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível enviar sua solicitação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Link to="/" className="inline-flex items-center gap-1 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest opacity-80">Simulador</div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">Consórcio de {cfg.label}</h1>
            </div>
          </div>
          <p className="mt-4 opacity-90 max-w-2xl">
            Personalize sua carta de crédito e receba o contato de um consultor executivo.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <ol className="flex items-center gap-2 text-sm mb-8">
          <StepBadge n={1} active={step >= 1} label="Simulação" />
          <div className="h-px flex-1 bg-border" />
          <StepBadge n={2} active={step >= 2} label="Seus dados" />
          <div className="h-px flex-1 bg-border" />
          <StepBadge n={3} active={step >= 3} label="Contato" />
        </ol>

        {/* Categoria switcher */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIA_KEYS.map((k) => {
            const active = k === key;
            const CIcon = CATEGORIAS[k].icon;
            return (
              <button
                key={k}
                onClick={() => navigate({ to: "/simulador/$categoria", params: { categoria: k } })}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary"
                }`}
              >
                <CIcon className="h-4 w-4" />
                {CATEGORIAS[k].label}
              </button>
            );
          })}
        </div>

        {step === 1 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <label className="block">
                <span className="text-sm font-semibold text-foreground">Valor do crédito desejado</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={creditoInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const n = digits ? Number(digits) : 0;
                    setCredito(n);
                    setCreditoInput(digits ? brl(n) : "");
                  }}
                  onBlur={() => {
                    const clamped = Math.min(cfg.max, Math.max(cfg.min, credito || cfg.min));
                    setCredito(clamped);
                    setCreditoInput(brl(clamped));
                  }}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-3xl font-display font-bold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={brl(cfg.defaultCredito)}
                  aria-label="Valor do crédito desejado"
                />
                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={Math.max(1000, Math.round((cfg.max - cfg.min) / 200))}
                  value={Math.min(cfg.max, Math.max(cfg.min, credito || cfg.min))}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setCredito(n);
                    setCreditoInput(brl(n));
                  }}
                  className="mt-4 w-full accent-[var(--color-gold)]"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{brl(cfg.min)}</span>
                  <span>{brl(cfg.max)}</span>
                </div>
              </label>


              <div className="mt-8">
                <span className="text-sm font-semibold text-foreground">Prazo (meses)</span>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {cfg.prazos.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrazo(p)}
                      className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                        prazo === p
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary"
                      }`}
                    >
                      {p}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="rounded-2xl bg-primary text-primary-foreground p-6 md:p-8 shadow-elegant">
              <div className="text-xs uppercase tracking-widest opacity-80">Parcela estimada</div>
              <div className="mt-2 text-4xl font-display font-bold text-[var(--color-gold)]">
                {brl(parcela)}
              </div>
              <div className="mt-1 text-sm opacity-80">/ mês por {prazo} meses</div>

              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-[var(--color-gold)]" /> Sem juros — apenas taxa administrativa</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 mt-0.5 text-[var(--color-gold)]" /> Contemplação por sorteio ou lance</li>
                <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 text-[var(--color-gold)]" /> Regulamentado pelo Banco Central</li>
              </ul>

              <Button
                onClick={() => setStep(2)}
                size="lg"
                className="mt-8 w-full rounded-full bg-[var(--color-gold)] text-primary hover:opacity-90 font-semibold"
              >
                Solicitar contato <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <p className="mt-3 text-[11px] opacity-75 leading-relaxed">
                Simulação de caráter informativo. Valores finais sujeitos à análise e regulamento do grupo.
              </p>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-5"
            >
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Seus dados</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha para que um consultor executivo entre em contato pelo seu WhatsApp.
                </p>
              </div>

              <Field label="Nome e sobrenome" error={errors.nome}>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  maxLength={100}
                  className="input"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="CPF" error={errors.cpf}>
                  <input
                    inputMode="numeric"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                    maxLength={14}
                    placeholder="000.000.000-00"
                    className="input"
                  />
                </Field>
                <Field label="Data de nascimento" error={errors.nascimento}>
                  <input
                    type="date"
                    value={form.nascimento}
                    onChange={(e) => setForm({ ...form, nascimento: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="E-mail" error={errors.email}>
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                  className="input"
                />
              </Field>

              <Field label="Telefone com WhatsApp" error={errors.telefone}>
                <input
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  maxLength={20}
                  placeholder="(00) 90000-0000"
                  className="input"
                />
              </Field>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="rounded-full">
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold flex-1 sm:flex-none"
                >
                  {submitting ? "Enviando..." : "Enviar solicitação"}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ao enviar, você concorda com o tratamento dos seus dados conforme a nossa política de LGPD.
              </p>
            </form>

            <aside className="rounded-2xl bg-secondary/60 border border-border p-6 h-fit">
              <div className="text-xs uppercase tracking-widest text-primary font-semibold">Resumo da simulação</div>
              <dl className="mt-4 space-y-3 text-sm">
                <Row k="Categoria" v={cfg.label} />
                <Row k="Crédito" v={brl(credito)} />
                <Row k="Prazo" v={`${prazo} meses`} />
                <Row k="Parcela estimada" v={brl(parcela)} highlight />
              </dl>
            </aside>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-xl mx-auto text-center rounded-2xl border border-border bg-card p-10 shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-display font-bold text-foreground">
              Solicitação enviada com sucesso!
            </h2>
            <p className="mt-3 text-muted-foreground">
              Um dos nossos consultores executivos entrará em contato pelo seu WhatsApp em breve
              para finalizar os detalhes do seu consórcio de <strong>{cfg.label}</strong>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/">Voltar para a home</Link>
              </Button>
              <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  Falar agora no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
      <WhatsappFloat />

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.875rem;
          font-size: 0.9rem;
          color: hsl(var(--foreground));
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15);
        }
      `}</style>
    </div>
  );
}

function StepBadge({ n, active, label }: { n: number; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {n}
      </div>
      <span className={`hidden sm:inline text-sm ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={`font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{v}</dd>
    </div>
  );
}
