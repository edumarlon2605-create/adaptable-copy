import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { getDashboardStats } from "@/lib/admin.functions";
import { Users, UserCog, CreditCard, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BBC Consórcios" },
      { name: "description", content: "Dashboard administrativo da BBC Consórcios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
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
    cartasDisponiveis: 0,
    cartasVendidas: 0,
    recentes: [] as Array<{ id: string; name: string; role: string; createdAt: string }>,
  };

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
          <StatCard icon={CreditCard} label="Cartas disponíveis" value={isLoading ? "…" : String(stats.cartasDisponiveis)} />
          <StatCard icon={Award} label="Cartas vendidas" value={isLoading ? "…" : String(stats.cartasVendidas)} />
        </div>

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
