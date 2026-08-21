import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, Plus, Search, Pencil, Trash2, ListChecks, FileText, Settings, History,
} from "lucide-react";
import { toast } from "sonner";
import {
  listCartas, upsertCarta, deleteCarta, getCarta, toggleParcelaPaga,
  calcularCarta, calcularPrimeiroVencimento,
  listModelos, saveModelo, deleteModelo,
  getConfig, setConfig, listPaymentHistory,
  markAllParcelasPagas,
  PRESET_PRAZOS,
} from "@/lib/cartas.functions";
import { listClients } from "@/lib/admin.functions";
import { mapError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/cartas")({
  head: () => ({
    meta: [
      { title: "Cartas — BBC Consórcios" },
      { name: "description", content: "Gestão automática de cartas de crédito." },
    ],
  }),
  component: CartasPage,
});

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtBRL = (n: number | null | undefined) => (n == null ? "—" : BRL.format(Number(n)));
const fmtDate = (s?: string | null) =>
  s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—";
const fmtDT = (s?: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR") : "—";
const parseNum = (v: string) => {
  const n = Number(String(v).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const CATEGORIAS_CARTA = [
  "Imóvel",
  "Automóvel",
  "Motocicleta",
  "Caminhão / Utilitário",
  "Serviços",
  "Náutico",
  "Aeronave",
  "Máquinas e Equipamentos",
  "Energia Solar",
  "Outros",
] as const;

type FormState = {
  id?: string;
  administradora: string;
  grupo: string;
  cota: string;
  cliente_id: string;
  valor_bem: string;
  parcelas_totais: number;
  data_adesao: string;
  percentual_administrativo: string;
  situacao: "disponivel" | "reservada" | "vendida" | "quitado";
  categoria: string;
  bem_especifico: string;
  descricao: string;
};

function emptyForm(percPadrao: number): FormState {
  return {
    administradora: "",
    grupo: "",
    cota: "",
    cliente_id: "",
    valor_bem: "",
    parcelas_totais: 60,
    data_adesao: new Date().toISOString().slice(0, 10),
    percentual_administrativo: String(percPadrao ?? 12),
    situacao: "disponivel",
    categoria: "",
    bem_especifico: "",
    descricao: "",
  };
}

function CartasPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Cartas</h1>
          <p className="text-muted-foreground">
            Cadastro automatizado: informe cliente, valor do bem, parcelas, adesão e % administrativo.
            O sistema calcula tudo e gera o cronograma.
          </p>
        </div>
        <Tabs defaultValue="cartas">
          <TabsList>
            <TabsTrigger value="cartas"><CreditCard className="h-4 w-4 mr-2" />Cartas</TabsTrigger>
            <TabsTrigger value="modelos"><FileText className="h-4 w-4 mr-2" />Modelos</TabsTrigger>
            <TabsTrigger value="config"><Settings className="h-4 w-4 mr-2" />Configurações</TabsTrigger>
          </TabsList>
          <TabsContent value="cartas" className="mt-6"><CartasTab /></TabsContent>
          <TabsContent value="modelos" className="mt-6"><ModelosTab /></TabsContent>
          <TabsContent value="config" className="mt-6"><ConfigTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// =================================================================
// TAB CARTAS
// =================================================================
function CartasTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [situacao, setSituacao] = useState<string>("todas");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [applyModelo, setApplyModelo] = useState<any | null>(null);

  const listFn = listCartas;
  const listCli = listClients;
  const upsertFn = upsertCarta;
  const delFn = deleteCarta;
  const cfgFn = getConfig;

  const cfg = useQuery({ queryKey: ["app-config"], queryFn: () => cfgFn() });
  const cartasQ = useQuery({ queryKey: ["cartas"], queryFn: () => listFn(), refetchOnWindowFocus: true });
  const clientesQ = useQuery({ queryKey: ["clients"], queryFn: () => listCli() });

  const percPadrao = cfg.data?.percentual_administrativo_padrao ?? 12;
  const [form, setForm] = useState<FormState>(() => emptyForm(percPadrao));

  useEffect(() => {
    if (applyModelo) {
      setForm((f) => ({
        ...f,
        administradora: applyModelo.administradora ?? f.administradora,
        valor_bem: String(applyModelo.valor_bem),
        parcelas_totais: applyModelo.parcelas_totais,
        percentual_administrativo: String(applyModelo.percentual_administrativo),
        descricao: applyModelo.descricao ?? "",
      }));
      setApplyModelo(null);
      setOpen(true);
    }
  }, [applyModelo]);

  const cartas = useMemo(() => {
    const list = (cartasQ.data ?? []) as any[];
    return list.filter((c) => {
      const s = search.trim().toLowerCase();
      const okS = !s ||
        c.administradora?.toLowerCase().includes(s) ||
        c.grupo?.toLowerCase().includes(s) ||
        c.cota?.toLowerCase().includes(s) ||
        c.cliente?.name?.toLowerCase().includes(s);
      const okSit = situacao === "todas" || c.situacao === situacao;
      return okS && okSit;
    });
  }, [cartasQ.data, search, situacao]);

  const saveMut = useMutation({
    mutationFn: (payload: any) => upsertFn({ data: payload }),
    onSuccess: () => {
      toast.success("Carta salva e cronograma atualizado.");
      qc.invalidateQueries({ queryKey: ["cartas"] });
      setOpen(false);
      setForm(emptyForm(percPadrao));
    },
    onError: (e) => toast.error(mapError(e)),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Carta excluída.");
      qc.invalidateQueries({ queryKey: ["cartas"] });
      setConfirmDel(null);
    },
    onError: (e) => toast.error(mapError(e)),
  });

  function openNew() {
    setForm(emptyForm(percPadrao));
    setOpen(true);
  }

  function openEdit(c: any) {
    setForm({
      id: c.id,
      administradora: c.administradora ?? "",
      grupo: c.grupo ?? "",
      cota: c.cota ?? "",
      cliente_id: c.cliente_id ?? "",
      valor_bem: c.valor_bem ? String(c.valor_bem) : "",
      parcelas_totais: c.parcelas_totais ?? 60,
      data_adesao: c.data_adesao ?? new Date().toISOString().slice(0, 10),
      percentual_administrativo: String(c.percentual_administrativo ?? percPadrao),
      situacao: c.situacao ?? "disponivel",
      categoria: c.categoria ?? "",
      bem_especifico: c.bem_especifico ?? "",
      descricao: c.descricao ?? "",
    });
    setOpen(true);
  }

  function submit() {
    const valorBem = parseNum(form.valor_bem);
    const perc = parseNum(form.percentual_administrativo);
    if (!valorBem) return toast.error("Informe o valor do bem.");
    if (!form.parcelas_totais) return toast.error("Informe a quantidade de parcelas.");
    if (!form.data_adesao) return toast.error("Informe a data de adesão.");
    if (!form.administradora || !form.grupo || !form.cota)
      return toast.error("Preencha administradora, grupo e cota.");

    saveMut.mutate({
      id: form.id,
      administradora: form.administradora,
      grupo: form.grupo,
      cota: form.cota,
      cliente_id: form.cliente_id || null,
      valor_bem: valorBem,
      parcelas_totais: Number(form.parcelas_totais),
      data_adesao: form.data_adesao,
      percentual_administrativo: perc,
      situacao: form.situacao,
      categoria: form.categoria || null,
      bem_especifico: form.bem_especifico || null,
      descricao: form.descricao || null,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full" />
          </div>
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger className="w-[180px] rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas situações</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservada">Reservada</SelectItem>
              <SelectItem value="vendida">Vendida</SelectItem>
              <SelectItem value="quitado">Quitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> Nova Carta
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Adm. / Grupo / Cota</TableHead>
              <TableHead>Valor do bem</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cartasQ.isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : cartas.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                Nenhuma carta cadastrada. Clique em <strong>Nova Carta</strong>.
              </TableCell></TableRow>
            ) : cartas.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell>{c.cliente?.name ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.administradora} · {c.grupo}/{c.cota}</TableCell>
                <TableCell>{fmtBRL(c.valor_bem)}</TableCell>
                <TableCell>{fmtBRL(c.parcela)}</TableCell>
                <TableCell>{c.parcelas_pagas ?? 0}/{c.parcelas_totais ?? 0}</TableCell>
                <TableCell className="capitalize">{c.situacao}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="outline" size="icon" className="rounded-full"
                    onClick={() => setDetailId(c.id)} title="Detalhes">
                    <ListChecks className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full"
                    onClick={() => openEdit(c)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" className="rounded-full"
                    onClick={() => setConfirmDel(c.id)} title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CartaFormDialog
        open={open} onOpenChange={setOpen}
        form={form} setForm={setForm}
        clientes={(clientesQ.data ?? []) as any[]}
        onSubmit={submit} saving={saveMut.isPending}
      />
      <CartaDetalheDialog cartaId={detailId} onClose={() => setDetailId(null)} />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir carta?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as parcelas serão removidas. O histórico financeiro é preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && delMut.mutate(confirmDel)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =================================================================
// Form Dialog
// =================================================================
function CartaFormDialog({
  open, onOpenChange, form, setForm, clientes, onSubmit, saving,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  form: FormState; setForm: (f: FormState) => void;
  clientes: any[]; onSubmit: () => void; saving: boolean;
}) {
  const valorBem = parseNum(form.valor_bem);
  const perc = parseNum(form.percentual_administrativo);
  const preview = valorBem && form.parcelas_totais
    ? calcularCarta({ valor_bem: valorBem, parcelas_totais: form.parcelas_totais, percentual_administrativo: perc })
    : null;
  const primeiroVenc = form.data_adesao ? calcularPrimeiroVencimento(form.data_adesao) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar carta" : "Nova carta"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Cliente titular *">
              <Select value={form.cliente_id || "none"}
                onValueChange={(v) => setForm({ ...form, cliente_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {clientes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Administradora *">
              <Input value={form.administradora}
                onChange={(e) => setForm({ ...form, administradora: e.target.value })} />
            </Field>
            <Field label="Situação">
              <Select value={form.situacao}
                onValueChange={(v: any) => setForm({ ...form, situacao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservada">Reservada</SelectItem>
                  <SelectItem value="vendida">Vendida</SelectItem>
                  <SelectItem value="quitado">Quitado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Grupo *">
              <Input value={form.grupo}
                onChange={(e) => setForm({ ...form, grupo: e.target.value })} />
            </Field>
            <Field label="Cota *">
              <Input value={form.cota}
                onChange={(e) => setForm({ ...form, cota: e.target.value })} />
            </Field>
            <Field label="Data de adesão *">
              <Input type="date" value={form.data_adesao}
                onChange={(e) => setForm({ ...form, data_adesao: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Valor do bem (R$) *">
              <Input inputMode="decimal" value={form.valor_bem}
                onChange={(e) => setForm({ ...form, valor_bem: e.target.value })}
                placeholder="100000,00" />
            </Field>
            <Field label="% Administrativo *">
              <Input inputMode="decimal" value={form.percentual_administrativo}
                onChange={(e) => setForm({ ...form, percentual_administrativo: e.target.value })}
                placeholder="12" />
            </Field>
            <Field label="Parcelas *">
              <Select value={String(form.parcelas_totais)}
                onValueChange={(v) => setForm({ ...form, parcelas_totais: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRESET_PRAZOS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} parcelas</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Categoria">
              <Select
                value={form.categoria || "none"}
                onValueChange={(v) => setForm({ ...form, categoria: v === "none" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {CATEGORIAS_CARTA.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Bem específico">
              <Input
                value={form.bem_especifico}
                onChange={(e) => setForm({ ...form, bem_especifico: e.target.value })}
                placeholder="Ex.: Apartamento 60m² · Honda Civic 2024"
              />
            </Field>
          </div>


          {preview && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Info label="Valor administrativo" value={fmtBRL(preview.valor_administrativo)} />
              <Info label="Valor total" value={fmtBRL(preview.valor_total)} />
              <Info label="Valor da parcela" value={fmtBRL(preview.parcelas[0])} />
              <Info label="1º vencimento" value={primeiroVenc ? fmtDate(primeiroVenc) : "—"} />
            </div>
          )}

          <Field label="Observações">
            <Textarea rows={2} value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </Field>

          <p className="text-xs text-muted-foreground">
            Todas as parcelas subsequentes vencem no dia <strong>10</strong> de cada mês.
            O ajuste de arredondamento (se houver) é aplicado exclusivamente na última parcela.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={saving} className="rounded-full">
            {saving ? "Salvando..." : "Salvar e gerar cronograma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

// =================================================================
// Detalhe (Dashboard + Parcelas + Histórico)
// =================================================================
function CartaDetalheDialog({ cartaId, onClose }: { cartaId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const getFn = getCarta;
  const toggleFn = toggleParcelaPaga;
  const histFn = listPaymentHistory;
  const markAllFn = markAllParcelasPagas;
  const [confirmAll, setConfirmAll] = useState(false);

  const q = useQuery({
    queryKey: ["carta", cartaId],
    queryFn: () => getFn({ data: { id: cartaId! } }),
    enabled: !!cartaId,
    refetchOnWindowFocus: true,
  });
  const hist = useQuery({
    queryKey: ["payment-history", cartaId],
    queryFn: () => histFn({ data: { carta_id: cartaId! } }),
    enabled: !!cartaId,
    refetchOnWindowFocus: true,
  });

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["carta", cartaId] });
    qc.invalidateQueries({ queryKey: ["payment-history", cartaId] });
    qc.invalidateQueries({ queryKey: ["cartas"] });
  }

  const toggle = useMutation({
    mutationFn: (v: { id: string; pago: boolean }) => toggleFn({ data: v }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Parcela atualizada.");
    },
    onError: (e) => toast.error(mapError(e)),
  });

  const markAll = useMutation({
    mutationFn: () => markAllFn({ data: { carta_id: cartaId! } }),
    onSuccess: (r: any) => {
      invalidateAll();
      setConfirmAll(false);
      toast.success(`${r?.marked ?? 0} parcela(s) marcadas como pagas.`);
    },
    onError: (e) => toast.error(mapError(e)),
  });

  const carta: any = q.data?.carta;
  const dash: any = q.data?.dashboard;
  const parcelas: any[] = q.data?.parcelas ?? [];

  return (
    <Dialog open={!!cartaId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {carta
              ? `Carta — ${carta.cliente?.name ?? "sem cliente"} · ${carta.administradora} ${carta.grupo}/${carta.cota}`
              : "Carta"}
          </DialogTitle>
        </DialogHeader>

        {q.isLoading || !q.data ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <Tabs defaultValue="dashboard">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="parcelas">Parcelas</TabsTrigger>
              <TabsTrigger value="historico"><History className="h-4 w-4 mr-1" />Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Info label="Valor do bem" value={fmtBRL(carta.valor_bem)} />
                <Info label="% Administrativo" value={`${carta.percentual_administrativo}%`} />
                <Info label="Valor administrativo" value={fmtBRL(carta.valor_administrativo)} />
                <Info label="Valor total" value={fmtBRL(carta.valor_total)} />
                <Info label="Nº de parcelas" value={String(carta.parcelas_totais)} />
                <Info label="Valor da parcela" value={fmtBRL(carta.parcela)} />
                <Info label="Adesão" value={fmtDate(carta.data_adesao)} />
                <Info label="1º vencimento" value={fmtDate(carta.primeiro_vencimento)} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card title="Total pago" value={fmtBRL(dash!.total_pago)} tone="green" />
                <Card title="Em aberto" value={fmtBRL(dash!.total_aberto)} tone="amber" />
                <Card title="Em atraso" value={fmtBRL(dash!.total_atraso)} tone="red" />
                <Card title="% quitado" value={`${dash!.percentual_quitado}%`} tone="blue" />
                <Card title="Parcelas pagas" value={String(dash!.parcelas_pagas)} tone="green" />
                <Card title="Parcelas pendentes" value={String(dash!.parcelas_pendentes)} tone="amber" />
                <Card title="Parcelas em atraso" value={String(dash!.parcelas_atraso)} tone="red" />
                <Card title="% restante" value={`${dash!.percentual_restante}%`} tone="blue" />
              </div>
            </TabsContent>

            <TabsContent value="parcelas" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button
                  variant="default"
                  className="rounded-full gap-2"
                  disabled={markAll.isPending || parcelas.every((p: any) => p.status === "pago")}
                  onClick={() => setConfirmAll(true)}
                >
                  <ListChecks className="h-4 w-4" />
                  Marcar todas como pagas
                </Button>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pago em</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parcelas.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.numero}</TableCell>
                        <TableCell>{fmtDate(p.vencimento)}</TableCell>
                        <TableCell>{fmtBRL(p.valor)}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-sm">{p.pago_em ? fmtDT(p.pago_em) : "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="rounded-full"
                            disabled={toggle.isPending}
                            onClick={() => toggle.mutate({ id: p.id, pago: p.status !== "pago" })}>
                            {p.status === "pago" ? "Estornar" : "Marcar pago"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Marcar todas as parcelas como pagas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todas as parcelas em aberto ou em atraso serão registradas como pagas,
                      usando a data de vencimento de cada uma como referência.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={markAll.isPending}
                      onClick={() => markAll.mutate()}
                    >
                      {markAll.isPending ? "Processando..." : "Confirmar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>


            <TabsContent value="historico" className="mt-4">
              {hist.isLoading ? (
                <div className="py-6 text-center text-muted-foreground">Carregando...</div>
              ) : (hist.data ?? []).length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">Nenhum evento registrado.</div>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-4">
                  {(hist.data as any[]).map((h) => (
                    <li key={h.id} className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                      <div className="text-xs text-muted-foreground">{fmtDT(h.created_at)} · {h.created_by_name}</div>
                      <div className="font-medium">{eventLabel(h.event_type)}
                        {h.installment_number ? ` — Parcela ${h.installment_number}` : ""}
                      </div>
                      {h.amount != null && (
                        <div className="text-sm">Valor: {fmtBRL(Number(h.amount))}
                          {h.due_date ? ` · Vencimento ${fmtDate(h.due_date)}` : ""}
                        </div>
                      )}
                      {h.notes && <div className="text-sm text-muted-foreground mt-1">{h.notes}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function eventLabel(t: string) {
  switch (t) {
    case "carta_criada": return "Carta criada";
    case "carta_atualizada": return "Carta atualizada / cronograma reprocessado";
    case "pagamento_registrado": return "Pagamento registrado";
    case "pagamento_estornado": return "Pagamento estornado";
    default: return t;
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pago: "bg-green-100 text-green-700",
    pendente: "bg-amber-100 text-amber-700",
    atraso: "bg-red-100 text-red-700",
  };
  const label: Record<string, string> = { pago: "Pago", pendente: "Pendente", atraso: "Em atraso" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? ""}`}>
    {label[status] ?? status}
  </span>;
}

function Card({ title, value, tone }: { title: string; value: string; tone: "green" | "amber" | "red" | "blue" }) {
  const tones: Record<string, string> = {
    green: "border-green-200 bg-green-50 text-green-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="text-xs opacity-80">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

// =================================================================
// TAB MODELOS
// =================================================================
type ModeloForm = {
  id?: string;
  nome: string;
  administradora: string;
  valor_bem: string;
  parcelas_totais: number;
  percentual_administrativo: string;
  descricao: string;
};
const emptyModelo = (perc: number): ModeloForm => ({
  nome: "", administradora: "", valor_bem: "",
  parcelas_totais: 60, percentual_administrativo: String(perc ?? 12), descricao: "",
});

function ModelosTab() {
  const qc = useQueryClient();
  const listFn = listModelos;
  const saveFn = saveModelo;
  const delFn = deleteModelo;
  const cfgFn = getConfig;

  const cfg = useQuery({ queryKey: ["app-config"], queryFn: () => cfgFn() });
  const q = useQuery({ queryKey: ["carta-modelos"], queryFn: () => listFn() });
  const percPadrao = cfg.data?.percentual_administrativo_padrao ?? 12;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ModeloForm>(() => emptyModelo(percPadrao));
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (p: any) => saveFn({ data: p }),
    onSuccess: () => {
      toast.success("Modelo salvo.");
      qc.invalidateQueries({ queryKey: ["carta-modelos"] });
      setOpen(false);
      setForm(emptyModelo(percPadrao));
    },
    onError: (e) => toast.error(mapError(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Modelo excluído.");
      qc.invalidateQueries({ queryKey: ["carta-modelos"] });
      setConfirmDel(null);
    },
    onError: (e) => toast.error(mapError(e)),
  });

  function submit() {
    const valor = parseNum(form.valor_bem);
    if (!form.nome) return toast.error("Informe o nome do modelo.");
    if (!valor) return toast.error("Informe o valor do bem.");
    save.mutate({
      id: form.id,
      nome: form.nome,
      administradora: form.administradora || null,
      valor_bem: valor,
      parcelas_totais: Number(form.parcelas_totais),
      percentual_administrativo: parseNum(form.percentual_administrativo),
      descricao: form.descricao || null,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="rounded-full gap-2"
          onClick={() => { setForm(emptyModelo(percPadrao)); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo Modelo
        </Button>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Administradora</TableHead>
              <TableHead>Valor do bem</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>% Admin</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : (q.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                Nenhum modelo cadastrado.
              </TableCell></TableRow>
            ) : (q.data as any[]).map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell>{m.administradora ?? "—"}</TableCell>
                <TableCell>{fmtBRL(m.valor_bem)}</TableCell>
                <TableCell>{m.parcelas_totais}</TableCell>
                <TableCell>{m.percentual_administrativo}%</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="outline" size="icon" className="rounded-full" title="Editar"
                    onClick={() => { setForm({
                      id: m.id, nome: m.nome, administradora: m.administradora ?? "",
                      valor_bem: String(m.valor_bem), parcelas_totais: m.parcelas_totais,
                      percentual_administrativo: String(m.percentual_administrativo),
                      descricao: m.descricao ?? "",
                    }); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" className="rounded-full" title="Excluir"
                    onClick={() => setConfirmDel(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Editar modelo" : "Novo modelo"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <Field label="Nome *">
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Field>
            <Field label="Administradora">
              <Input value={form.administradora}
                onChange={(e) => setForm({ ...form, administradora: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Valor do bem (R$) *">
                <Input inputMode="decimal" value={form.valor_bem}
                  onChange={(e) => setForm({ ...form, valor_bem: e.target.value })} />
              </Field>
              <Field label="Parcelas *">
                <Select value={String(form.parcelas_totais)}
                  onValueChange={(v) => setForm({ ...form, parcelas_totais: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRESET_PRAZOS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="% Admin *">
                <Input inputMode="decimal" value={form.percentual_administrativo}
                  onChange={(e) => setForm({ ...form, percentual_administrativo: e.target.value })} />
              </Field>
            </div>
            <Field label="Descrição">
              <Textarea rows={2} value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancelar</Button>
            <Button onClick={submit} disabled={save.isPending} className="rounded-full">
              {save.isPending ? "Salvando..." : "Salvar Modelo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && del.mutate(confirmDel)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =================================================================
// TAB CONFIG
// =================================================================
function ConfigTab() {
  const qc = useQueryClient();
  const getCfg = getConfig;
  const setCfg = setConfig;
  const q = useQuery({ queryKey: ["app-config"], queryFn: () => getCfg() });
  const [perc, setPerc] = useState<string>("");

  useEffect(() => {
    if (q.data) setPerc(String(q.data.percentual_administrativo_padrao));
  }, [q.data]);

  const save = useMutation({
    mutationFn: (v: number) => setCfg({ data: { percentual_administrativo_padrao: v } }),
    onSuccess: () => {
      toast.success("Configuração salva.");
      qc.invalidateQueries({ queryKey: ["app-config"] });
    },
    onError: (e) => toast.error(mapError(e)),
  });

  return (
    <div className="max-w-md space-y-4">
      <Field label="Percentual administrativo padrão (%)">
        <Input inputMode="decimal" value={perc} onChange={(e) => setPerc(e.target.value)} />
      </Field>
      <Button onClick={() => save.mutate(parseNum(perc))} disabled={save.isPending} className="rounded-full">
        {save.isPending ? "Salvando..." : "Salvar configuração"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Este valor é sugerido ao criar novas cartas. Cada carta pode ter seu próprio percentual.
      </p>
    </div>
  );
}
