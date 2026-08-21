import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useClienteAuth } from "@/lib/auth-context";
import { useIdleSignout } from "@/lib/use-idle-signout";

export const Route = createFileRoute("/_authenticated/cliente")({
  component: ClienteGate,
});

function ClienteGate() {
  const { user, role, isLoading } = useClienteAuth();
  const router = useRouter();

  // Encerra sessão após 30 min sem interação.
  useIdleSignout(30 * 60 * 1000);

  useEffect(() => {
    if (isLoading) return;
    if (!user || role !== "cliente") {
      router.navigate({ to: "/login" });
    }
  }, [user, role, isLoading, router]);

  if (isLoading || !user || role !== "cliente") {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <Outlet />;
}

