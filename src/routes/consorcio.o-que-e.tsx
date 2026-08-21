import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { ShieldCheck, Users, Building2 } from "lucide-react";

export const Route = createFileRoute("/consorcio/o-que-e")({
  head: () => ({
    meta: [
      { title: "O que é Consórcio — BBC Consórcios" },
      {
        name: "description",
        content:
          "Consórcio é a união de pessoas em grupo para formar uma poupança comum destinada à aquisição de bens ou serviços, regulamentada pelo Banco Central do Brasil.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell
      eyebrow="Consórcio"
      title="O que é Consórcio?"
      subtitle="Uma forma inteligente, planejada e sem juros de conquistar seus bens e serviços — regulamentada pelo Banco Central do Brasil."
    >
      <div className="prose prose-lg max-w-none">
        <p className="text-lg leading-relaxed text-foreground/90">
          O consórcio é uma modalidade de compra baseada na união de pessoas físicas ou jurídicas em um grupo,
          com o objetivo comum de formar uma poupança para a aquisição de bens (imóveis, veículos, etc.) ou serviços.
          Essa união é gerida por uma Administradora de Consórcios, devidamente autorizada e fiscalizada pelo
          <strong> Banco Central do Brasil</strong>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mt-12">
        {[
          { icon: Users, title: "União de pessoas", desc: "Um grupo com objetivo comum contribui mensalmente para um fundo compartilhado." },
          { icon: Building2, title: "Administradora autorizada", desc: "A BBC Consórcios administra o grupo com transparência e conformidade total." },
          { icon: ShieldCheck, title: "Fiscalizada pelo BCB", desc: "Modalidade segura, regulamentada e auditada pelo Banco Central do Brasil." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary mb-4">
              <c.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">{c.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
