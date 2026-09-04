import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { adminSupabase, clienteSupabase } from "./dual-supabase";
import { resolveClienteLogin } from "./admin.functions";

export type AppRole = "admin" | "consultor" | "cliente";

interface SessionState {
  user: User | null;
  role: AppRole | null;
  isLoading: boolean;
}

function useSessionState(client: SupabaseClient) {
  const [state, setState] = useState<SessionState>({
    user: null,
    role: null,
    isLoading: true,
  });

  const load = useCallback(
    async (u: User | null) => {
      if (!u) {
        setState({ user: null, role: null, isLoading: false });
        return;
      }
      const { data } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", u.id)
        .maybeSingle();
      setState({ user: u, role: (data?.role as AppRole) ?? null, isLoading: false });
    },
    [client],
  );

  useEffect(() => {
    let mounted = true;
    client.auth.getUser().then(({ data }) => {
      if (mounted) load(data.user ?? null);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (mounted) load(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [client, load]);

  return state;
}

/* -------------------- CLIENTE -------------------- */

interface ClienteAuth extends SessionState {
  signInWithCPF: (cpf: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
}

const ClienteCtx = createContext<ClienteAuth | undefined>(undefined);

export function ClienteAuthProvider({ children }: { children: React.ReactNode }) {
  const state = useSessionState(clienteSupabase);

  const signInWithCPF = useCallback(async (cpf: string, password: string) => {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return { error: new Error("CPF inválido.") };
    if (!password) return { error: new Error("Informe a senha.") };

    let email: string;
    try {
      const res = await resolveClienteLogin({ data: { cpf: clean } });
      email = res.email;
    } catch (e: any) {
      return { error: new Error(e?.message ?? "Usuário não encontrado.") };
    }

    const { error } = await clienteSupabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("[cliente-login]", error);
      if (/invalid/i.test(error.message)) return { error: new Error("Senha inválida.") };
      return { error: new Error("Falha de comunicação com o servidor.") };
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await clienteSupabase.auth.signOut();
  }, []);

  return (
    <ClienteCtx.Provider value={{ ...state, signInWithCPF, signOut }}>
      {children}
    </ClienteCtx.Provider>
  );
}

export function useClienteAuth() {
  const ctx = useContext(ClienteCtx);
  if (!ctx) throw new Error("useClienteAuth must be used inside ClienteAuthProvider");
  return ctx;
}

/* -------------------- ADMIN -------------------- */

interface AdminAuth extends SessionState {
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  hasRole: (roles: AppRole[]) => boolean;
}

const AdminCtx = createContext<AdminAuth | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const state = useSessionState(adminSupabase);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email || !password) return { error: new Error("Informe e-mail e senha.") };
    const { data, error } = await adminSupabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      console.error("[admin-login]", error);
      if (/invalid/i.test(error?.message ?? "")) return { error: new Error("E-mail ou senha inválidos.") };
      return { error: new Error("Falha de comunicação com o servidor.") };
    }
    const { data: r } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (r?.role !== "admin" && r?.role !== "consultor") {
      await adminSupabase.auth.signOut();
      return { error: new Error("Este acesso é exclusivo para administradores e consultores.") };
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await adminSupabase.auth.signOut();
  }, []);

  const hasRole = useCallback(
    (roles: AppRole[]) => (state.role ? roles.includes(state.role) : false),
    [state.role],
  );

  return (
    <AdminCtx.Provider value={{ ...state, signIn, signOut, hasRole }}>
      {children}
    </AdminCtx.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}

/**
 * Compat: telas administrativas antigas chamam `useAuth()`. Aponta para a sessão admin.
 */
export function useAuth() {
  return useAdminAuth();
}
