import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/login-admin")({
  head: () => ({
    meta: [
      { title: "Acesso Administrativo — BBC Consórcios" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAdminAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.error) throw result.error;
      navigate({ to: "/admin" });
    } catch (err) {
      setError((err as Error).message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <main className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
            Painel Administrativo
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Área restrita. Somente administradores e consultores.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-foreground">E-mail</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="admin@bbc.com.br"
                autoComplete="username"
                required
              />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Senha</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </label>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? "Entrando..." : "Entrar no painel"}
          </Button>
        </form>
      </main>
    </div>
  );
}
