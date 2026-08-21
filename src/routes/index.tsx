import { createFileRoute, Link } from "@tanstack/react-router";
import { useWhatsapp } from "@/lib/whatsapp-config";
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  BadgeCheck,
  Home,
  Car,
  Bike,
  Truck,
  Briefcase,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Users,
  Award,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter, WhatsappFloat } from "@/components/site-footer";
import { TestimonialToast } from "@/components/testimonial-toast";
import heroFamily from "@/assets/hero-family.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BBC Consórcios — Consórcios planejados, seguros e sem juros" },
      {
        name: "description",
        content:
          "Realize seus sonhos com consórcios de imóveis, veículos e serviços. Sem juros, com parcelas planejadas e segurança regulamentada pelo Banco Central.",
      },
      { property: "og:title", content: "BBC Consórcios — Consórcios planejados, seguros e sem juros" },
      {
        property: "og:description",
        content:
          "Realize seus sonhos com consórcios de imóveis, veículos e serviços. Sem juros, com parcelas planejadas e segurança regulamentada pelo Banco Central.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HomePage,
});

const categories = [
  { icon: Home, label: "Imóveis", slug: "imoveis" as const },
  { icon: Car, label: "Automóveis", slug: "automoveis" as const },
  { icon: Bike, label: "Motos", slug: "motos" as const },
  { icon: Truck, label: "Caminhões", slug: "caminhoes" as const },
  { icon: Briefcase, label: "Serviços", slug: "servicos" as const },
  { icon: Sparkles, label: "Investimentos", slug: "investimentos" as const },
];

const advantages = [
  { icon: Wallet, title: "Sem juros", desc: "Apenas taxa de administração transparente e prevista em contrato." },
  { icon: TrendingUp, title: "Poder de compra à vista", desc: "Use sua carta de crédito como pagamento à vista e negocie descontos." },
  { icon: ShieldCheck, title: "Segurança jurídica", desc: "Empresa regulamentada e fiscalizada pelo Banco Central do Brasil." },
  { icon: BadgeCheck, title: "Planejamento financeiro", desc: "Parcelas que cabem no bolso e disciplina para formar patrimônio." },
];

const steps = [
  { n: "01", title: "Escolha o valor da carta", desc: "Defina o crédito ideal para o seu objetivo." },
  { n: "02", title: "Escolha o prazo", desc: "Prazos flexíveis com parcelas planejadas." },
  { n: "03", title: "Faça sua adesão", desc: "Adesão simples ao grupo administrado." },
  { n: "04", title: "Participe das assembleias", desc: "Assembleias mensais com sorteios e lances." },
  { n: "05", title: "Seja contemplado", desc: "Por sorteio ou lance, com total transparência." },
  { n: "06", title: "Use sua carta de crédito", desc: "Adquira imóveis, veículos, máquinas ou serviços." },
];

function HomePage() {
  const { url: whatsappUrl } = useWhatsapp();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroFamily}
          alt="Família conquistando sua casa própria"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Gradiente para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-primary/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur px-4 py-1.5 text-xs font-medium ring-1 ring-primary-foreground/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Regulamentado pelo Banco Central
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] drop-shadow-md">
              Realize seus sonhos com <span className="text-[var(--color-gold)]">planejamento</span> e sem juros.
            </h1>
            <p className="mt-6 text-lg opacity-95 max-w-xl drop-shadow">
              Consórcio de imóveis, veículos, motos, caminhões e serviços. Uma forma segura, transparente e inteligente de conquistar seu patrimônio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-[var(--color-gold)] text-primary hover:opacity-90 font-semibold h-12 px-6">
                <Link to="/simulador/$categoria" params={{ categoria: "imoveis" }}>
                  Simular agora <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6 border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur text-primary-foreground hover:bg-primary-foreground/20">
                <Link to="/consorcio/como-funciona">Como funciona</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <Stat value="+15" label="Anos de mercado" />
              <Stat value="+50k" label="Clientes atendidos" />
              <Stat value="100%" label="Regulamentado BCB" />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">O que você quer conquistar?</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground">
              Consórcios para cada tipo de sonho
            </h2>
            <p className="mt-4 text-muted-foreground">
              Escolha a categoria da sua carta de crédito e comece hoje o planejamento do seu próximo patrimônio.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(({ icon: Icon, label, slug }) => (
              <Link
                key={label}
                to="/simulador/$categoria"
                params={{ categoria: slug }}
                className="group rounded-2xl border border-border bg-card p-6 text-center hover:border-primary hover:shadow-card transition-all"
              >
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-4 font-semibold text-foreground">{label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-secondary/40">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">Como funciona</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Simples, transparente e planejado</h2>
            <p className="mt-4 text-muted-foreground">
              Do primeiro passo à contemplação, cada etapa é conduzida com clareza e segurança.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl bg-card border border-border p-6 hover:shadow-card transition-shadow">
                <div className="font-display text-4xl font-bold text-primary/20">{s.n}</div>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground max-w-3xl mx-auto">
            Após a contemplação, a administradora realiza análise documental antes da liberação do crédito, conforme regulamentação vigente.
          </p>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">Vantagens</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Por que escolher o consórcio</h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-card border border-border p-6 hover:-translate-y-1 hover:shadow-card transition-all">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-20 bg-gradient-to-b from-secondary/40 to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">Comparativo</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold">Consórcio × Financiamento</h2>
            <p className="mt-4 text-muted-foreground">
              Veja por que o consórcio é a escolha mais inteligente para quem planeja o futuro.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-primary text-primary-foreground p-8 shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-foreground/15">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">Consórcio</h3>
              </div>
              <ul className="mt-6 space-y-3">
                {["Sem juros", "Menor custo total", "Compra planejada", "Flexibilidade de prazos", "Poder de compra à vista"].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-[var(--color-gold)]" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl bg-card border border-border p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-muted-foreground">Financiamento</h3>
              </div>
              <ul className="mt-6 space-y-3">
                {["Juros elevados", "Entrada geralmente necessária", "Maior custo final", "Análise de crédito rigorosa", "Comprometimento de renda"].map((i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <X className="h-5 w-5 text-destructive/70" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="py-16 bg-background border-y border-border">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-3 text-center">
          <TrustItem icon={ShieldCheck} title="Segurança" desc="Regulamentado e fiscalizado pelo Banco Central do Brasil." />
          <TrustItem icon={Users} title="Atendimento humano" desc="Consultores especialistas ao seu lado em cada etapa." />
          <TrustItem icon={Award} title="Credibilidade" desc="Mais de uma década construindo patrimônio com nossos clientes." />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-10 md:p-16 text-center text-primary-foreground shadow-elegant">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[var(--color-gold)]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary-light/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl mx-auto">
                Pronto para começar a planejar seu próximo patrimônio?
              </h2>
              <p className="mt-4 opacity-90 max-w-xl mx-auto">
                Faça uma simulação gratuita e descubra a carta de crédito ideal para você.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg" className="rounded-full bg-[var(--color-gold)] text-primary hover:opacity-90 font-semibold h-12 px-8">
                  <Link to="/simulador/$categoria" params={{ categoria: "imoveis" }}>Simular minha carta</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-8 border-primary-foreground/30 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/15">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    Falar no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <WhatsappFloat />
      <TestimonialToast />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold text-[var(--color-gold)]">{value}</div>
      <div className="text-xs opacity-80 mt-1">{label}</div>
    </div>
  );
}

function TrustItem({ icon: Icon, title, desc }: { icon: typeof ShieldCheck; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">{desc}</p>
    </div>
  );
}
