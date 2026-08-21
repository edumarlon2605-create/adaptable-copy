import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getConfig, setConfig } from "@/lib/cartas.functions";
import { buildWhatsappUrl, refreshWhatsappConfig } from "@/lib/whatsapp-config";

function ConfiguracoesPage() {
  const [numero, setNumero] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getConfig()
      .then((c: any) => {
        setNumero(String(c?.whatsapp_numero ?? ""));
        setMensagem(String(c?.whatsapp_mensagem ?? ""));
      })
      .catch((e: any) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const salvar = async () => {
    const num = numero.replace(/\D/g, "");
    if (num.length < 10) return toast.error("Informe o número com DDI e DDD. Ex: 551140966528");
    if (!mensagem.trim()) return toast.error("Escreva a mensagem padrão.");
    setSaving(true);
    try {
      await setConfig({ data: { whatsapp_numero: num, whatsapp_mensagem: mensagem.trim() } });
      await refreshWhatsappConfig();
      toast.success("Configurações do WhatsApp atualizadas.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const preview = buildWhatsappUrl({ numero, mensagem });

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold">Configurações</h1>
      <p className="text-muted-foreground mt-2">
        Ajuste o número e a mensagem padrão usados em todos os botões de WhatsApp do site.
      </p>

      <div className="mt-8 max-w-2xl rounded-2xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold text-lg">WhatsApp</h2>

        <div className="space-y-2">
          <Label htmlFor="wa-numero">Número (com DDI e DDD, somente dígitos)</Label>
          <Input
            id="wa-numero"
            value={numero}
            disabled={loading}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="551140966528"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-msg">Mensagem padrão</Label>
          <Textarea
            id="wa-msg"
            rows={3}
            value={mensagem}
            disabled={loading}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Olá! Vim pelo site da BBC Consórcios..."
          />
          <p className="text-xs text-muted-foreground">
            Essa mensagem já vem preenchida na conversa quando o cliente clica em qualquer botão de WhatsApp.
          </p>
        </div>

        <div className="rounded-xl bg-muted p-3 text-xs break-all">
          <span className="font-medium">Link gerado: </span>
          <a href={preview} target="_blank" rel="noopener noreferrer" className="underline">
            {preview}
          </a>
        </div>

        <Button onClick={salvar} disabled={saving || loading}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </AdminLayout>
  );
}

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — BBC Admin" }] }),
  component: ConfiguracoesPage,
});
