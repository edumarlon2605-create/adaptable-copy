import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useClienteAuth } from "@/lib/auth-context";

/**
 * Faz signOut automático do cliente após `timeoutMs` de inatividade
 * (sem cliques, teclas, scroll ou toque) e redireciona para /login.
 */
export function useIdleSignout(timeoutMs = 30 * 60 * 1000) {
  const { user, signOut } = useClienteAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await signOut();
        router.navigate({ to: "/login" });
      }, timeoutMs);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, signOut, router, timeoutMs]);
}
