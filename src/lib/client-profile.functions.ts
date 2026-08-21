import { clienteSupabase } from "@/lib/dual-supabase";

type Payload<T = any> = { data?: T } | undefined;

async function call<TOut = any>(action: string, data?: any): Promise<TOut> {
  const { data: res, error } = await clienteSupabase.functions.invoke("bbc-api", {
    body: { action, data: data ?? {} },
  });
  if (error) {
    let msg = error.message || "Falha na chamada.";
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === "function") {
        const j = await ctx.json();
        if (j?.error) msg = j.error;
      }
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res && typeof res === "object" && "error" in res && (res as any).error) {
    throw new Error((res as any).error);
  }
  return res as TOut;
}

export const getMyProfile = (p?: any) => call("getMyProfile", p?.data);
export const updateMyProfile = (p?: any) => call("updateMyProfile", p?.data);
export const saveMyDocument = (p?: any) => call("saveMyDocument", p?.data);
export const deleteMyDocument = (p?: any) => call("deleteMyDocument", p?.data);
