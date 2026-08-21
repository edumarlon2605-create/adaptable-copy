import { createFileRoute, Outlet } from "@tanstack/react-router";

// Este layout apenas isola SSR — cada subárvore (admin, cliente) tem sua própria porta de entrada.
export const Route = createFileRoute("/_authenticated")({
  
  component: () => <Outlet />,
});
