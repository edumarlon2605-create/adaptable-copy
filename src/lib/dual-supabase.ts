import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function isNewKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}

function makeFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (isNewKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

type StorageKind = "local" | "session";

function make(storageKey: string, kind: StorageKind): SupabaseClient<Database> {
  const URL =
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
  const KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);
  if (!URL || !KEY) throw new Error("Missing Supabase env vars");
  const storage =
    typeof window === "undefined"
      ? undefined
      : kind === "session"
        ? window.sessionStorage
        : window.localStorage;
  return createClient<Database>(URL, KEY, {
    global: { fetch: makeFetch(KEY) },
    auth: {
      storage,
      storageKey,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _c: SupabaseClient<Database> | undefined;
let _a: SupabaseClient<Database> | undefined;

/** Sessão exclusiva de CLIENTE — sessionStorage: encerra ao fechar a aba/navegador. */
export const clienteSupabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, p) {
    if (!_c) {
      _c = make("sb-bbc-cliente-auth", "session");
      // Migração: se sobrou sessão antiga em localStorage, descartar.
      if (typeof window !== "undefined") {
        try { window.localStorage.removeItem("sb-bbc-cliente-auth"); } catch {}
      }
    }
    return Reflect.get(_c, p);
  },
});

/** Sessão exclusiva de ADMIN/CONSULTOR — localStorage (mantém sessão do painel). */
export const adminSupabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, p) {
    if (!_a) _a = make("sb-bbc-admin-auth", "local");
    return Reflect.get(_a, p);
  },
});
