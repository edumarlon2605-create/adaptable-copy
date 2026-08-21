import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClienteGuard } from "@/lib/cliente-guard";

export const Route = createFileRoute("/meus-pedidos")({
  head: () => ({
    meta: [{ title: "Meus Pedidos — BBC Consórcios" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <ClienteGuard>
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl w-full flex-1 px-4 py-16">
          <h1 className="font-display text-3xl font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground mt-2">Você ainda não possui pedidos.</p>
        </main>
        <SiteFooter />
      </div>
    </ClienteGuard>
  ),
});
