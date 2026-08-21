import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useClienteAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { User, Lock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Área do Cliente — BBC Consórcios" },
      {
        name: "description",
        content: "Acesse sua conta de cliente para acompanhar grupo, boletos e assembleias.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithCPF } = useClienteAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInWithCPF(cpf, password);
      if (result.error) throw result.error;
      navigate({ to: "/bem-vindo", replace: true });
    } catch (err) {
      setError((err as Error).message || "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="text-center mb-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
            Área do Cliente
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesso exclusivo para clientes cadastrados.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-foreground">CPF</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="000.000.000-00"
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
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Ainda não é cliente? Fale com um de nossos consultores.
          </p>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar para o site
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
