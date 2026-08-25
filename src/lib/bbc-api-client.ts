import type { SupabaseClient } from "@supabase/supabase-js";

type ApiErrorBody = { error?: string } | null;

async function parseResponse<T>(response: Response): Promise<{ body: T | ApiErrorBody; raw: string }> {
  const raw = await response.text().catch(() => "");
  if (!raw) return { body: null, raw };

  try {
    return { body: JSON.parse(raw) as T | ApiErrorBody, raw };
  } catch {
    return { body: null, raw };
  }
}

async function getAccessToken(client: SupabaseClient, forceRefresh = false): Promise<string | null> {
  if (forceRefresh) {
    const { data, error } = await client.auth.refreshSession();
    if (error) return null;
    return data.session?.access_token ?? null;
  }

  const { data, error } = await client.auth.getSession();
  if (error || !data.session) return null;

  const expiresAt = data.session.expires_at ?? 0;
  const expiresSoon = expiresAt * 1000 <= Date.now() + 60_000;
  if (!expiresSoon) return data.session.access_token;

  const refreshed = await client.auth.refreshSession();
  if (refreshed.error) return null;
  return refreshed.data.session?.access_token ?? null;
}

async function sendRequest<T>(action: string, data: unknown, token: string | null) {
  const response = await fetch("/api/bbc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, data: data ?? {} }),
  });
  const parsed = await parseResponse<T>(response);
  return { response, ...parsed };
}

export async function callBbcApi<T = unknown>(
  client: SupabaseClient,
  action: string,
  data?: unknown,
): Promise<T> {
  let token = await getAccessToken(client);
  let result: Awaited<ReturnType<typeof sendRequest<T>>>;

  try {
    result = await sendRequest<T>(action, data, token);
    if (result.response.status === 401 && token) {
      token = await getAccessToken(client, true);
      if (token) result = await sendRequest<T>(action, data, token);
    }
  } catch {
    throw new Error("Falha de comunicação com o servidor.");
  }

  const errorBody = result.body && typeof result.body === "object" && "error" in result.body
    ? result.body
    : null;

  if (!result.response.ok || errorBody?.error) {
    const message = errorBody?.error || (
      result.response.status === 401
        ? "Sessão expirada. Entre novamente."
        : result.response.status === 403
          ? "Você não tem permissão para esta ação."
          : `Erro no servidor (${result.response.status}). Tente novamente.`
    );
    throw new Error(message);
  }

  return result.body as T;
}