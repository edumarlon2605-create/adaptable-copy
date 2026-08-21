import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/sobre/historia")({
  head: () => ({
    meta: [
      { title: "Nossa História — BBC Consórcios" },
      {
        name: "description",
        content:
          "Conheça a trajetória da BBC Consórcios: transparência, ética e foco no cliente para transformar o acesso ao crédito no Brasil.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell
      eyebrow="Sobre Nós"
      title="Nossa História"
      subtitle="Transformando o acesso ao crédito e a conquista de bens no Brasil, com transparência e foco no cliente."
    >
      <div className="space-y-6 text-lg leading-relaxed text-foreground/90">
        <p>
          A <strong>BBC Consórcios</strong> nasceu com a sólida missão de democratizar o acesso ao crédito e
          transformar a conquista de patrimônio no Brasil. Inspirada nos modelos de maior credibilidade, ética
          e eficiência do mercado financeiro nacional, construímos nossa trajetória baseada na transparência
          absoluta e no compromisso com o consorciado.
        </p>
        <p>
          Surgimos com o propósito de oferecer uma alternativa viável, inteligente e justa frente às taxas
          abusivas do sistema tradicional de financiamentos. Hoje, consolidamos nossa marca como sinônimo de
          segurança jurídica e inovação, aplicando as melhores práticas regulamentares para que milhares de
          famílias e empresas planejem, poupem e realizem seus objetivos com total inteligência financeira.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 mt-12">
        {[
          { n: "+10.000", label: "Famílias atendidas" },
          { n: "100%", label: "Regulamentado pelo BCB" },
          { n: "0", label: "Juros nas parcelas" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="font-display text-3xl font-bold text-primary">{s.n}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
