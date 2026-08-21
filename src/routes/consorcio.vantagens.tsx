import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/consorcio/vantagens")({
  head: () => ({
    meta: [
      { title: "Vantagens do Consórcio vs Financiamento — BBC Consórcios" },
      {
        name: "description",
        content:
          "Compare consórcio e financiamento: sem juros, sem entrada, compra planejada e poder de barganha à vista.",
      },
    ],
  }),
  component: Page,
});

const rows = [
  {
    feature: "Juros",
    consorcio: "Zero juros. Existe apenas uma taxa de administração diluída nas parcelas.",
    financiamento: "Juros compostos. O valor final do bem pode dobrar ou triplicar.",
  },
  {
    feature: "Entrada",
    consorcio: "Não exige valor de entrada. O plano começa do zero.",
    financiamento: "Exige entrada — geralmente de 20% a 30% do valor total do bem.",
  },
  {
    feature: "Planejamento",
    consorcio: "Compra programada. Ideal para quem quer construir patrimônio com inteligência.",
    financiamento: "Imediato. Você pega o bem na hora, mas assume uma dívida cara a longo prazo.",
  },
  {
    feature: "Poder de Barganha",
    consorcio: "Compra à vista. Quando contemplado, você negocia com o poder do dinheiro na mão.",
    financiamento: "Pagamento parcelado ao vendedor pela instituição financeira.",
  },
];

function Page() {
  return (
    <PageShell
      eyebrow="Consórcio"
      title="Consórcio vs. Financiamento"
      subtitle="Uma comparação honesta para você entender por que o consórcio é a forma mais inteligente de conquistar seus bens."
    >
      <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-4 font-display text-foreground">Característica</th>
              <th className="text-left p-4 font-display text-primary">🪙 Consórcio</th>
              <th className="text-left p-4 font-display text-muted-foreground">🏦 Financiamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                <td className="p-4 font-semibold text-foreground align-top">{r.feature}</td>
                <td className="p-4 text-foreground/90 align-top">
                  <div className="flex gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{r.consorcio}</span>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground align-top">
                  <div className="flex gap-2">
                    <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <span>{r.financiamento}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
