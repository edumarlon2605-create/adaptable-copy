import { clienteSupabase } from "@/lib/dual-supabase";

async function call<TOut = any>(action: string, data?: any): Promise<TOut> {
  const { data: sess } = await clienteSupabase.auth.getSession();
  const token = sess?.session?.access_token;
  let res: Response;
  try {
    res = await fetch("/api/bbc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, data: data ?? {} }),
    });
  } catch {
    throw new Error("Falha de comunicação com o servidor.");
  }
  let json: any = null;
  try {
    json = await res.json();
  } catch { /* ignore */ }
  if (!res.ok || (json && typeof json === "object" && "error" in json && json.error)) {
    throw new Error(json?.error || "Falha na chamada.");
  }
  return json as TOut;
}

export const getMyProfile = (p?: any) => call("getMyProfile", p?.data);
export const updateMyProfile = (p?: any) => call("updateMyProfile", p?.data);
export const saveMyDocument = (p?: any) => call("saveMyDocument", p?.data);
export const deleteMyDocument = (p?: any) => call("deleteMyDocument", p?.data);
