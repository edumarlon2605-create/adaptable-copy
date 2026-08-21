import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/consorcio/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona o Consórcio — BBC Consórcios" },
      {
        name: "description",
        content:
          "Entenda o passo a passo do consórcio: adesão, contribuição mensal, contemplação por sorteio ou lance, e entrega do bem via carta de crédito.",
      },
    ],
  }),
  component: Page,
});

const steps = [
  {
    n: "01",
    title: "Adesão",
    desc: "O cliente escolhe o valor do crédito que deseja para adquirir seu bem e o prazo de pagamento. Ao assinar o contrato de adesão, passa a integrar o grupo de consórcio.",
  },
  {
    n: "02",
    title: "Contribuição Mensal",
    desc: 'Todos os integrantes do grupo realizam pagamentos mensais. A soma desses valores forma o "Fundo Comum", que é o capital utilizado para comprar os bens do mês.',
  },
  {
    n: "03",
    title: "Contemplação",
    desc: "É o momento em que o consorciado tem o direito de utilizar o crédito. Ela ocorre exclusivamente nas Assembleias Gerais Ordinárias por duas vias:",
    bullets: [
      "Sorteio: uma cota é extraída de forma aleatória, garantindo igualdade de chances a todos os ativos.",
      "Lance: o consorciado oferece a antecipação de parcelas com recursos próprios ou utilizando parte do próprio crédito (lance embutido). O maior lance ofertado, conforme as regras do grupo, vence e é contemplado.",
    ],
  },
  {
    n: "04",
    title: "Entrega do Bem",
    desc: "Após a contemplação e a validação das garantias exigidas em contrato, a administradora libera a Carta de Crédito para que o cliente adquira o bem de sua preferência.",
  },
];

function Page() {
  return (
    <PageShell
      eyebrow="Consórcio"
      title="Como Funciona"
      subtitle="Do momento da adesão até a entrega do bem — um caminho claro, transparente e planejado."
    >
      <ol className="space-y-6">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-xl font-bold">
              {s.n}
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.desc}</p>
              {"bullets" in s && s.bullets && (
                <ul className="mt-3 space-y-2 pl-5 list-disc text-muted-foreground leading-relaxed">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
