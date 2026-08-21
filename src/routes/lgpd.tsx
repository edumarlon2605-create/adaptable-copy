import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/lgpd")({
  head: () => ({
    meta: [
      { title: "LGPD — BBC Consórcios" },
      {
        name: "description",
        content:
          "Como a BBC Consórcios trata seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell
      eyebrow="Privacidade"
      title="LGPD — Lei Geral de Proteção de Dados"
      subtitle="Sua privacidade é levada a sério. Aqui está como tratamos seus dados."
    >
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="text-lg leading-relaxed text-foreground/90">
            A <strong>BBC Consórcios</strong> assume o compromisso de proteger a privacidade e a segurança dos
            dados pessoais de seus clientes e usuários. Em estrita conformidade com a Lei Geral de Proteção de
            Dados (Lei nº 13.709/2018), informamos que os dados coletados em nossos canais de atendimento digital
            são utilizados exclusivamente para a execução de simulações de crédito, suporte técnico, comunicações
            comerciais e prestação de serviços contratados. Adotamos medidas de segurança técnicas e
            administrativas aptas a proteger os seus dados de acessos não autorizados. O titular dos dados possui
            o direito de solicitar a consulta, retificação ou exclusão de suas informações a qualquer momento
            através do nosso canal oficial de atendimento.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
