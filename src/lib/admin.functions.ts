// Wrappers cliente-side: chamam o server route `/api/bbc`.
// Mantém as MESMAS assinaturas usadas pelos consumidores:
//   fn()  ou  fn({ data: {...} })  → retorna Promise<T>
import { adminSupabase, clienteSupabase } from "@/lib/dual-supabase";
import { supabase as anonSupabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { callBbcApi } from "@/lib/bbc-api-client";

type Client = SupabaseClient<any>;

async function call<TOut = any>(client: Client, action: string, data?: any): Promise<TOut> {
  return callBbcApi<TOut>(client, action, data);
}

const adminCall = <T = any>(action: string, data?: any) => call<T>(adminSupabase as any, action, data);
const clienteCall = <T = any>(action: string, data?: any) => call<T>(clienteSupabase as any, action, data);
const publicCall = <T = any>(action: string, data?: any) => call<T>(anonSupabase as any, action, data);

// Wrapper que aceita tanto fn() quanto fn({ data: ... })
const admin = <T = any>(action: string) => (p?: any) => adminCall<T>(action, p?.data);
const cliente = <T = any>(action: string) => (p?: any) => clienteCall<T>(action, p?.data);
const pub = <T = any>(action: string) => (p?: any) => publicCall<T>(action, p?.data);

// ===================== USERS =====================
export const listUsers = admin("listUsers");
export const createUser = admin("createUser");
export const updateUser = admin("updateUser");
export const deleteUser = admin("deleteUser");

// ===================== CLIENTS =====================
export const listClients = admin("listClients");
export const createClient = admin("createClient");
export const updateClient = admin("updateClient");
export const deleteClient = admin("deleteClient");
export const resetClientPassword = admin("resetClientPassword");
export const listConsultores = admin("listConsultores");
export const getDashboardStats = admin("getDashboardStats");

// ===================== PUBLIC =====================
export const resolveClienteLogin = pub("resolveClienteLogin");
