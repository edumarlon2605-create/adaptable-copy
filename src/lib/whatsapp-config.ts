import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_WHATSAPP_NUMERO = "551140966528";
export const DEFAULT_WHATSAPP_MENSAGEM =
  "Olá! Vim pelo site da BBC Consórcios e gostaria de tirar uma dúvida sobre consórcio.";

export type WhatsappConfig = { numero: string; mensagem: string };

let cache: WhatsappConfig | null = null;
let inflight: Promise<WhatsappConfig> | null = null;
const listeners = new Set<(c: WhatsappConfig) => void>();

export function buildWhatsappUrl(cfg: WhatsappConfig, mensagem?: string) {
  const num = (cfg.numero || DEFAULT_WHATSAPP_NUMERO).replace(/\D/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(mensagem ?? cfg.mensagem)}`;
}

async function fetchConfig(): Promise<WhatsappConfig> {
  try {
    const { data } = await supabase
      .from("app_config")
      .select("key,value")
      .in("key", ["whatsapp_numero", "whatsapp_mensagem"]);
    const map: Record<string, unknown> = {};
    (data ?? []).forEach((r: any) => (map[r.key] = r.value));
    const cfg: WhatsappConfig = {
      numero: String(map.whatsapp_numero ?? DEFAULT_WHATSAPP_NUMERO),
      mensagem: String(map.whatsapp_mensagem ?? DEFAULT_WHATSAPP_MENSAGEM),
    };
    cache = cfg;
    listeners.forEach((l) => l(cfg));
    return cfg;
  } catch {
    return { numero: DEFAULT_WHATSAPP_NUMERO, mensagem: DEFAULT_WHATSAPP_MENSAGEM };
  }
}

export function refreshWhatsappConfig() {
  inflight = fetchConfig();
  return inflight;
}

export function useWhatsapp() {
  const [cfg, setCfg] = useState<WhatsappConfig>(
    cache ?? { numero: DEFAULT_WHATSAPP_NUMERO, mensagem: DEFAULT_WHATSAPP_MENSAGEM },
  );

  useEffect(() => {
    listeners.add(setCfg);
    if (cache) setCfg(cache);
    else {
      inflight = inflight ?? fetchConfig();
      inflight.then(setCfg).catch(() => {});
    }
    return () => {
      listeners.delete(setCfg);
    };
  }, []);

  return {
    ...cfg,
    url: buildWhatsappUrl(cfg),
    urlWith: (mensagem: string) => buildWhatsappUrl(cfg, mensagem),
  };
}
