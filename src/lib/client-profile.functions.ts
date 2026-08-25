import { clienteSupabase } from "@/lib/dual-supabase";
import { callBbcApi } from "@/lib/bbc-api-client";

async function call<TOut = any>(action: string, data?: any): Promise<TOut> {
  return callBbcApi<TOut>(clienteSupabase, action, data);
}

export const getMyProfile = (p?: any) => call("getMyProfile", p?.data);
export const updateMyProfile = (p?: any) => call("updateMyProfile", p?.data);
export const saveMyDocument = (p?: any) => call("saveMyDocument", p?.data);
export const deleteMyDocument = (p?: any) => call("deleteMyDocument", p?.data);
