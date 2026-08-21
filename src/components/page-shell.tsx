import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter, WhatsappFloat } from "@/components/site-footer";

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          {eyebrow && (
            <div className="inline-flex items-center rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-widest mb-4">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{title}</h1>
          {subtitle && (
            <p className="mt-4 text-lg opacity-90 max-w-3xl leading-relaxed">{subtitle}</p>
          )}
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">{children}</main>
      <SiteFooter />
      <WhatsappFloat />
    </div>
  );
}
