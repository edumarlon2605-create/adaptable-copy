import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats } from "@/lib/admin.functions";
import { Users, UserCog, CreditCard, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestTotalPayment } from "@/lib/cartas.functions";
import { toast } from "sonner";
import { mapError } from "@/lib/error-messages";
import { PaymentRecipientDialog, type PaymentRecipientInput } from "@/components/payment-recipient-dialog";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BBC Consórcios" },
      { name: "description", content: "Dashboard administrativo da BBC Consórcios." },
      { property: "og:title", content: "Dashboard — BBC Consórcios" },
      { property: "og:description", content: "Dashboard administrativo da BBC Consórcios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const qc = useQueryClient();
  const [selectedCarta, setSelectedCarta] = useState<any | null>(null);
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const fetchStats = getDashboardStats;
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: fetchStats,
    refetchOnWindowFocus: true,
  });

  const stats = data ?? {
    clientes: 0,
    consultores: 0,
    cartasTotal: 0,
    cartasDisponiveis: 0,
    cartasVendidas: 0,
    recentes: [] as Array<{ id: string; name: string; role: string; createdAt: string }>,
    cartas: [] as any[],
  };
  const requestPayment = useMutation({
    mutationFn: (input: PaymentRecipientInput) => {
      if (!selectedCarta?.id) throw new Error("Carta não informada.");
      return requestTotalPayment({ data: { carta_id: selectedCarta.id, ...input } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      setSelectedCarta(null);
      toast.success("Solicitação de pagamento total enviada.");
    },
    onError: (error) => toast.error(mapError(error)),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Dados atualizados em tempo real.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Clientes" value={isLoading ? "…" : String(stats.clientes)} />
          {isAdmin && (
            <StatCard icon={UserCog} label="Consultores" value={isLoading ? "…" : String(stats.consultores)} />
          )}
          <StatCard icon={CreditCard} label="Cartas cadastradas" value={isLoading ? "…" : String((stats as any).cartasTotal ?? 0)} />
          <StatCard icon={CreditCard} label="Cartas disponíveis" value={isLoading ? "…" : String(stats.cartasDisponiveis)} />
          <StatCard icon={Award} label="Vendidas / quitadas" value={isLoading ? "…" : String(stats.cartasVendidas)} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">Solicitar pagamento total</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : stats.cartas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma carta cadastrada.</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.cartas.map((carta: any) => (
                <div key={carta.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">{carta.cliente?.name ?? "Sem cliente"} · Grupo {carta.grupo} / Cota {carta.cota}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(carta.valor_bem ?? 0))}
                      {carta.pending_request ? ` · Solicitado em ${new Date(carta.pending_request.requested_at).toLocaleString("pt-BR")}` : ""}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={Boolean(carta.pending_request) || requestPayment.isPending}
                    onClick={() => setSelectedCarta(carta)}
                  >
                    {carta.pending_request ? "Pagamento solicitado" : "Solicitar pagamento total"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <PaymentRecipientDialog
          open={Boolean(selectedCarta)}
          onOpenChange={(open) => !open && setSelectedCarta(null)}
          amount={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(selectedCarta?.valor_bem ?? 0))}
          submitting={requestPayment.isPending}
          onSubmit={(input) => requestPayment.mutate(input)}
        />

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">Cadastros recentes</h2>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && stats.recentes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum cadastro recente.</p>
          )}
          {!isLoading && stats.recentes.length > 0 && (
            <ul className="divide-y divide-border">
              {stats.recentes.map((r: any) => (
                <li key={r.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{r.role}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-card transition-shadow">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-display font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
