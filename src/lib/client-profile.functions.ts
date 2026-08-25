import { clienteSupabase } from "@/lib/dual-supabase";

async function call<TOut = any>(client: Client, action: string, data?: any): Promise<TOut> {
  const { data: sess } = await client.auth.getSession();
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
  const raw = await res.text().catch(() => "");
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch { /* resposta não-JSON (ex.: página de erro) */ }
  if (!res.ok || (json && typeof json === "object" && "error" in json && json.error)) {
    const msg =
      json?.error ||
      (res.status === 401
        ? "Sessão expirada. Entre novamente."
        : res.status === 403
          ? "Você não tem permissão para esta ação."
          : `Erro no servidor (${res.status}). Tente novamente.`);
    throw new Error(msg);
  }
  return json as TOut;
}

export const getMyProfile = (p?: any) => call("getMyProfile", p?.data);
export const updateMyProfile = (p?: any) => call("updateMyProfile", p?.data);
export const saveMyDocument = (p?: any) => call("saveMyDocument", p?.data);
export const deleteMyDocument = (p?: any) => call("deleteMyDocument", p?.data);
