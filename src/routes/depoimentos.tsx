import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { Quote, Star } from "lucide-react";
import { testimonials } from "@/lib/testimonials-data";

export const Route = createFileRoute("/depoimentos")({
  head: () => ({
    meta: [
      { title: "Depoimentos — BBC Consórcios" },
      {
        name: "description",
        content:
          "Histórias reais de clientes BBC Consórcios: empresários e investidores de todo o Brasil que confiaram no nosso atendimento executivo.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell
      eyebrow="Clientes BBC"
      title="Depoimentos"
      subtitle="Histórias reais de empresários e investidores que confiaram na BBC Consórcios para transformar seus planos em conquistas."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {testimonials.map((t, i) => (
          <article
            key={i}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Quote className="h-4 w-4" />
              </div>
              <div className="flex gap-0.5 text-primary" aria-label="5 estrelas">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-foreground/90">“{t.quote}”</p>
            <div className="mt-5 border-t border-border pt-3">
              <div className="font-semibold text-foreground">{t.name}</div>
              <div className="text-sm text-muted-foreground">{t.location}</div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
