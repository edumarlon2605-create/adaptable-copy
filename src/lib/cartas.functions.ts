// Wrappers cliente-side para o módulo de Cartas.
import { adminSupabase, clienteSupabase } from "@/lib/dual-supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient<any>;
type Payload<T = any> = { data?: T } | undefined;

async function call<TOut = any>(client: Client, action: string, data?: any): Promise<TOut> {
  const { data: res, error } = await client.functions.invoke("bbc-api", {
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

const admin = <T = any>(action: string) => (p?: any) =>
  call<T>(adminSupabase as any, action, p?.data);
const cliente = <T = any>(action: string) => (p?: any) =>
  call<T>(clienteSupabase as any, action, p?.data);

// ===================== Helpers puros (client-side) =====================
export const PRESET_PRAZOS = [12, 24, 36, 48, 60, 72, 84, 120] as const;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function calcularCarta(input: {
  valor_bem: number;
  parcelas_totais: number;
  percentual_administrativo: number;
}) {
  const valor_bem = round2(input.valor_bem);
  const perc = input.percentual_administrativo;
  const valor_administrativo = round2((valor_bem * perc) / 100);
  const valor_total = round2(valor_bem + valor_administrativo);
  const base = Math.floor((valor_total * 100) / input.parcelas_totais) / 100;
  const parcelas: number[] = new Array(input.parcelas_totais).fill(base);
  const soma = round2(base * input.parcelas_totais);
  const dif = round2(valor_total - soma);
  parcelas[parcelas.length - 1] = round2(parcelas[parcelas.length - 1] + dif);
  return { valor_bem, valor_administrativo, valor_total, parcelas };
}

export function calcularPrimeiroVencimento(data_adesao: string): string {
  const d = new Date(data_adesao + "T12:00:00");
  const dia = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth(), 10, 12, 0, 0);
  if (dia >= 10) target.setMonth(target.getMonth() + 1);
  return toISODate(target);
}

export function calcParcela(saldo: number, prazo: number) {
  if (!saldo || !prazo) return 0;
  return round2(saldo / prazo);
}

// ===================== Ações =====================
export const listCartas = admin("listCartas");
export const getConfig = admin("getConfig");
export const setConfig = admin("setConfig");
export const listModelos = admin("listModelos");
export const saveModelo = admin("saveModelo");
export const deleteModelo = admin("deleteModelo");
export const upsertCarta = admin("upsertCarta");
export const getCarta = admin("getCarta");
export const deleteCarta = admin("deleteCarta");
export const toggleParcelaPaga = admin("toggleParcelaPaga");
export const listPaymentHistory = admin("listPaymentHistory");
export const markAllParcelasPagas = admin("markAllParcelasPagas");

// Área do cliente
export const listMinhasCartas = cliente("listMinhasCartas");
export const getMinhaCarta = cliente("getMinhaCarta");
