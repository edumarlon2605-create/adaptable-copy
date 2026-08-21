import { useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClienteAuth } from "@/lib/auth-context";

export function ClienteHeader() {
  const { signOut } = useClienteAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/favicon-512.png"
            alt="BBC Consórcios"
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-foreground">BBC Consórcios</div>
            <div className="text-xs text-muted-foreground">Área do Cliente</div>
          </div>
        </div>
        <Button variant="outline" className="rounded-full gap-2" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </header>
  );
}
