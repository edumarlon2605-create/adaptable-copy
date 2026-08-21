import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Upload, FileText, ExternalLink, Trash2, KeyRound, User, MapPin, Phone, FileBadge } from "lucide-react";
import { ClienteHeader } from "@/components/cliente-header";
import { ClienteFooter } from "@/components/cliente-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  getMyProfile,
  updateMyProfile,
  saveMyDocument,
  deleteMyDocument,
} from "@/lib/client-profile.functions";
import { clienteSupabase } from "@/lib/dual-supabase";
import { mapError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/cliente/perfil")({
  head: () => ({
    meta: [
      { title: "Meus Dados — BBC Consórcios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PerfilPage,
});

/* ---------- máscaras ---------- */
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
};
const maskCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
const maskCEP = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{0,3})/, "$1-$2");

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const MARITAL = [
  { v: "solteiro", l: "Solteiro(a)" },
  { v: "casado", l: "Casado(a)" },
  { v: "divorciado", l: "Divorciado(a)" },
  { v: "viuvo", l: "Viúvo(a)" },
  { v: "uniao_estavel", l: "União Estável" },
];

type Form = {
  name: string; rg: string; birth_date: string; marital_status: string; profession: string;
  email: string; phone: string; whatsapp: string;
  cep: string; street: string; number: string; complement: string;
  neighborhood: string; city: string; state: string; country: string;
};
const emptyForm: Form = {
  name: "", rg: "", birth_date: "", marital_status: "", profession: "",
  email: "", phone: "", whatsapp: "",
  cep: "", street: "", number: "", complement: "",
  neighborhood: "", city: "", state: "", country: "Brasil",
};

function PerfilPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["me"], queryFn: getMyProfile });
  const [form, setForm] = useState<Form>(emptyForm);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name || "",
      rg: profile.rg || "",
      birth_date: profile.birth_date || "",
      marital_status: profile.marital_status || "",
      profession: profile.profession || "",
      email: profile.email?.endsWith("@clientes.bbc.local") ? "" : (profile.email || ""),
      phone: maskPhone(profile.phone || ""),
      whatsapp: maskPhone(profile.whatsapp || ""),
      cep: maskCEP(profile.cep || ""),
      street: profile.street || "",
      number: profile.number || "",
      complement: profile.complement || "",
      neighborhood: profile.neighborhood || "",
      city: profile.city || "",
      state: profile.state || "",
      country: profile.country || "Brasil",
    });
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: Form) => updateMyProfile({ data }),
    onSuccess: async () => {
      setMsg({ type: "success", text: "Dados atualizados com sucesso." });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setMsg({ type: "error", text: mapError(e) }),
  });

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      setCepLoading(true);
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const j = await r.json();
      if (j?.erro) return;
      setForm((f) => ({
        ...f,
        street: j.logradouro || f.street,
        neighborhood: j.bairro || f.neighborhood,
        city: j.localidade || f.city,
        state: j.uf || f.state,
        country: f.country || "Brasil",
      }));
    } catch { /* silencioso */ }
    finally { setCepLoading(false); }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    mutation.mutate(form);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClienteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Meus Dados</h1>
            <p className="text-muted-foreground">Cadastro completo para agilizar seu atendimento.</p>
          </div>
          <Button variant="ghost" className="rounded-full" onClick={() => router.navigate({ to: "/cliente" })}>
            Voltar
          </Button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <Tabs defaultValue="pessoais" className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto">
                <TabsTrigger value="pessoais" className="gap-1"><User className="h-4 w-4" />Pessoais</TabsTrigger>
                <TabsTrigger value="contato" className="gap-1"><Phone className="h-4 w-4" />Contato</TabsTrigger>
                <TabsTrigger value="endereco" className="gap-1"><MapPin className="h-4 w-4" />Endereço</TabsTrigger>
                <TabsTrigger value="documentos" className="gap-1"><FileBadge className="h-4 w-4" />Documentos</TabsTrigger>
                <TabsTrigger value="seguranca" className="gap-1"><KeyRound className="h-4 w-4" />Segurança</TabsTrigger>
              </TabsList>

              {/* ============== PESSOAIS ============== */}
              <TabsContent value="pessoais" className="mt-6">
                <Card>
                  <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nome completo" className="sm:col-span-2">
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field label="CPF">
                      <Input value={maskCPF(profile?.cpf || "")} readOnly disabled />
                    </Field>
                    <Field label="RG">
                      <Input value={form.rg} onChange={(e) => setForm({ ...form, rg: e.target.value })} placeholder="00.000.000-0" />
                    </Field>
                    <Field label="Data de nascimento">
                      <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                    </Field>
                    <Field label="Estado civil">
                      <Select value={form.marital_status} onValueChange={(v) => setForm({ ...form, marital_status: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {MARITAL.map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Profissão" className="sm:col-span-2">
                      <Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
                    </Field>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============== CONTATO ============== */}
              <TabsContent value="contato" className="mt-6">
                <Card>
                  <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <Field label="E-mail" className="sm:col-span-2">
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="seuemail@dominio.com"
                        autoComplete="email"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Este e-mail passa a ser usado para comunicações. O login continua sendo por CPF.
                      </p>
                    </Field>
                    <Field label="Celular">
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} inputMode="tel" />
                    </Field>
                    <Field label="WhatsApp">
                      <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })} inputMode="tel" />
                    </Field>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============== ENDEREÇO ============== */}
              <TabsContent value="endereco" className="mt-6">
                <Card>
                  <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-6">
                    <Field label="CEP" className="sm:col-span-2">
                      <Input
                        value={form.cep}
                        onChange={(e) => setForm({ ...form, cep: maskCEP(e.target.value) })}
                        onBlur={(e) => lookupCep(e.target.value)}
                        inputMode="numeric"
                        placeholder="00000-000"
                      />
                      {cepLoading && <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>}
                    </Field>
                    <Field label="Rua" className="sm:col-span-4">
                      <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                    </Field>
                    <Field label="Número" className="sm:col-span-1">
                      <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
                    </Field>
                    <Field label="Complemento" className="sm:col-span-3">
                      <Input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
                    </Field>
                    <Field label="Bairro" className="sm:col-span-2">
                      <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
                    </Field>
                    <Field label="Cidade" className="sm:col-span-3">
                      <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </Field>
                    <Field label="Estado" className="sm:col-span-1">
                      <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                        <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>
                          {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="País" className="sm:col-span-2">
                      <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                    </Field>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============== DOCUMENTOS ============== */}
              <TabsContent value="documentos" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentos</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Envie fotos ou PDFs dos seus documentos (máx. 5 MB cada).
                    </p>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <DocumentUploader kind="rg" title="RG" url={profile?.rg_doc_url} onChanged={() => qc.invalidateQueries({ queryKey: ["me"] })} />
                    <Separator />
                    <DocumentUploader kind="cnh" title="CNH" url={profile?.cnh_doc_url} onChanged={() => qc.invalidateQueries({ queryKey: ["me"] })} />
                    <Separator />
                    <DocumentUploader kind="address_proof" title="Comprovante de residência" url={profile?.address_proof_url} onChanged={() => qc.invalidateQueries({ queryKey: ["me"] })} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ============== SEGURANÇA ============== */}
              <TabsContent value="seguranca" className="mt-6">
                <Card>
                  <CardHeader><CardTitle>Segurança</CardTitle></CardHeader>
                  <CardContent className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium">Senha de acesso</p>
                      <p className="text-sm text-muted-foreground">Recomendamos alterá-la periodicamente.</p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full gap-2">
                      <Link to="/cliente/senha"><KeyRound className="h-4 w-4" />Alterar senha</Link>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {msg && (
              <p className={`mt-6 text-sm ${msg.type === "success" ? "text-primary" : "text-destructive"}`} role="alert">
                {msg.text}
              </p>
            )}

            <div className="mt-6 flex justify-end sticky bottom-4">
              <Button type="submit" disabled={mutation.isPending} className="rounded-full shadow-lg">
                {mutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        )}
      </main>
      <ClienteFooter />
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ---------- Document uploader ---------- */
function DocumentUploader({
  kind, title, url, onChanged,
}: {
  kind: "rg" | "cnh" | "address_proof";
  title: string;
  url?: string | null;
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    if (file.size > 5 * 1024 * 1024) {
      setErr("Arquivo muito grande (máx. 5 MB).");
      return;
    }
    const okTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!okTypes.includes(file.type)) {
      setErr("Formato inválido. Envie JPG, PNG, WEBP ou PDF.");
      return;
    }
    setBusy("upload");
    try {
      const { data: sess } = await clienteSupabase.auth.getUser();
      const uid = sess.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${uid}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await clienteSupabase.storage
        .from("client-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      await saveMyDocument({ data: { kind, path } });
      onChanged();
    } catch (e: any) {
      setErr(e?.message || "Falha no upload.");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setErr(null);
    setBusy("remove");
    try {
      await deleteMyDocument({ data: { kind } });
      onChanged();
    } catch (e: any) {
      setErr(e?.message || "Falha ao remover.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-1 min-w-[220px]">
        <div className="h-10 w-10 grid place-items-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {url ? "Arquivo enviado" : "Nenhum arquivo enviado"}
          </p>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {url && (
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Ver
            </a>
          </Button>
        )}
        <Button
          type="button" variant="outline" size="sm" className="rounded-full gap-1"
          onClick={() => inputRef.current?.click()} disabled={busy !== null}
        >
          <Upload className="h-4 w-4" /> {url ? "Substituir" : "Enviar"}
        </Button>
        {url && (
          <Button
            type="button" variant="ghost" size="sm" className="rounded-full text-destructive"
            onClick={handleRemove} disabled={busy !== null}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
