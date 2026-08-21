import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ClienteHeader } from "@/components/cliente-header";
import { ClienteFooter } from "@/components/cliente-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clienteSupabase } from "@/lib/dual-supabase";
import { mapError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/cliente/senha")({
  head: () => ({
    meta: [
      { title: "Alterar senha — BBC Consórcios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SenhaPage,
});

function SenhaPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 6) return setMsg({ type: "error", text: "A senha deve ter pelo menos 6 caracteres." });
    if (pw !== pw2) return setMsg({ type: "error", text: "As senhas não coincidem." });
    setLoading(true);
    try {
      const { error } = await clienteSupabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setMsg({ type: "success", text: "Senha alterada com sucesso." });
      setPw("");
      setPw2("");
    } catch (err) {
      setMsg({ type: "error", text: mapError(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClienteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">Alterar senha</h1>
        <p className="text-muted-foreground">Escolha uma nova senha para sua conta.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label>Nova senha</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar nova senha</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required autoComplete="new-password" />
          </div>
          {msg && (
            <p className={`text-sm ${msg.type === "success" ? "text-primary" : "text-destructive"}`} role="alert">
              {msg.text}
            </p>
          )}
          <div className="flex justify-between">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => router.navigate({ to: "/cliente" })}>
              Voltar
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full">
              {loading ? "Salvando..." : "Alterar senha"}
            </Button>
          </div>
        </form>
      </main>
      <ClienteFooter />
    </div>
  );
}
