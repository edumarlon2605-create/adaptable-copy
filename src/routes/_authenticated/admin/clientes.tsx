import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminLayout } from "@/components/admin-layout";
import { listClients, createClient, updateClient, deleteClient, resetClientPassword } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, KeyRound, FileCheck2 } from "lucide-react";
import { isValidCpf, sanitizeCpf } from "@/lib/cpf";
import { formatCnpj, isValidCnpj, sanitizeCnpj } from "@/lib/cnpj";
import { mapError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — BBC Consórcios" },
      { name: "description", content: "Gerenciamento de clientes da BBC Consórcios." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  return (
    <AdminLayout>
      <ClientsManager />
    </AdminLayout>
  );
}

type FormState = {
  person_type: "cpf" | "cnpj";
  name: string;
  cpf: string;
  cnpj: string;
  cnae: string;
  corporate_name: string;
  phone: string;
  password: string;
  status: "ativo" | "inativo" | "pendente";
  documentos_ok: boolean;
};

const EMPTY_FORM: FormState = {
  person_type: "cpf", name: "", cpf: "", cnpj: "", cnae: "", corporate_name: "",
  phone: "", password: "", status: "ativo", documentos_ok: false,
};

function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

function ClientsManager() {
  const queryClient = useQueryClient();
  const fetchClients = listClients;
  const createClientFn = createClient;
  const updateClientFn = updateClient;
  const deleteClientFn = deleteClient;
  const resetPasswordFn = resetClientPassword;

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const filtered = clients.filter((c: any) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.corporate_name?.toLowerCase().includes(q) ||
      c.cpf?.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
      c.cnpj?.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
      c.phone?.includes(search)
    );
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return updateClientFn({ data: payload });
      return createClientFn({ data: payload });
    },
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (err) => setFormError(mapError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClientFn({ data: { id } }),
    onSuccess: () => {
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (err) => alert(mapError(err)),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: { id: string; password: string }) =>
      resetPasswordFn({ data: payload }),
    onSuccess: () => {
      setResetTarget(null);
      setNewPassword("");
      setResetError("");
    },
    onError: (err) => setResetError(mapError(err)),
  });

  const docsMutation = useMutation({
    mutationFn: (c: any) =>
      updateClientFn({ data: { id: c.id, documentos_ok: !c.documentos_ok } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
    onError: (err) => alert(mapError(err)),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setOpen(true);
  }

  function openEdit(c: any) {
    setEditing(c);
    setForm({
      person_type: c.person_type === "cnpj" ? "cnpj" : "cpf",
      name: c.name || "",
      cpf: maskCpf(c.cpf || ""),
      cnpj: formatCnpj(c.cnpj || ""),
      cnae: c.cnae || "",
      corporate_name: c.corporate_name || "",
      phone: maskPhone(c.phone || ""),
      password: "",
      status: c.status || "ativo",
      documentos_ok: !!c.documentos_ok,
    });
    setFormError("");
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const cpfDigits = sanitizeCpf(form.cpf);
    const cnpjDigits = sanitizeCnpj(form.cnpj);
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (!form.name.trim()) return setFormError("Informe o nome do cliente ou responsável.");
    if (form.person_type === "cpf" && !isValidCpf(cpfDigits)) return setFormError("CPF inválido.");
    if (form.person_type === "cnpj" && !isValidCnpj(cnpjDigits)) return setFormError("CNPJ inválido.");
    if (form.person_type === "cnpj" && !form.corporate_name.trim()) return setFormError("Informe a razão social.");
    if (form.person_type === "cnpj" && !form.cnae.trim()) return setFormError("Informe o CNAE.");
    if (phoneDigits.length < 10) return setFormError("Telefone inválido.");
    if (!editing && form.password.length < 6)
      return setFormError("A senha deve ter pelo menos 6 caracteres.");

    if (editing) {
      saveMutation.mutate({
        id: editing.id,
        person_type: form.person_type,
        name: form.name.trim(),
        cpf: form.person_type === "cpf" ? cpfDigits : null,
        cnpj: form.person_type === "cnpj" ? cnpjDigits : null,
        cnae: form.person_type === "cnpj" ? form.cnae.trim() : null,
        corporate_name: form.person_type === "cnpj" ? form.corporate_name.trim() : null,
        phone: phoneDigits,
        whatsapp: phoneDigits,
        status: form.status,
        documentos_ok: form.documentos_ok,
      });
    } else {
      saveMutation.mutate({
        name: form.name.trim(),
        person_type: form.person_type,
        cpf: form.person_type === "cpf" ? cpfDigits : null,
        cnpj: form.person_type === "cnpj" ? cnpjDigits : null,
        cnae: form.person_type === "cnpj" ? form.cnae.trim() : null,
        corporate_name: form.person_type === "cnpj" ? form.corporate_name.trim() : null,
        phone: phoneDigits,
        password: form.password,
        status: form.status,
      });
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Cadastre pessoas físicas por CPF e empresas por CNPJ.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : (setOpen(false), setEditing(null)))}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar cliente" : "Aprovar novo cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Tipo de cliente</Label>
                <Select
                  value={form.person_type}
                  onValueChange={(value) => setForm({
                    ...form,
                    person_type: value as "cpf" | "cnpj",
                    cpf: value === "cpf" ? form.cpf : "",
                    cnpj: value === "cnpj" ? form.cnpj : "",
                  })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">Pessoa física (CPF)</SelectItem>
                    <SelectItem value="cnpj">Pessoa jurídica (CNPJ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{form.person_type === "cnpj" ? "Nome do responsável" : "Nome completo"}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              {form.person_type === "cnpj" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Razão Social</Label>
                    <Input value={form.corporate_name} onChange={(e) => setForm({ ...form, corporate_name: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CNPJ</Label>
                    <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: formatCnpj(e.target.value) })} placeholder="00.000.000/0000-00" inputMode="numeric" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CNAE</Label>
                    <Input value={form.cnae} onChange={(e) => setForm({ ...form, cnae: e.target.value })} placeholder="0000-0/00" required />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {form.person_type === "cpf" && (
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    required
                  />
                </div>
                )}
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    required
                  />
                </div>
              </div>
              {!editing && (
                <div className="space-y-1.5">
                  <Label>Senha inicial</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editing && (
                <Button
                  type="button"
                  variant={form.documentos_ok ? "default" : "outline"}
                  className="w-full rounded-full gap-2"
                  onClick={() => setForm({ ...form, documentos_ok: !form.documentos_ok })}
                >
                  <FileCheck2 className="h-4 w-4" />
                  {form.documentos_ok
                    ? "Documentos verificados"
                    : "Marcar documentos como verificados"}
                </Button>
              )}
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
              <Button type="submit" disabled={saveMutation.isPending} className="w-full rounded-full">
                {saveMutation.isPending ? "Salvando..." : editing ? "Salvar alterações" : "Aprovar cadastro"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF, CNPJ ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-full"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Carregando clientes...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <div>{c.person_type === "cnpj" ? formatCnpj(c.cnpj || "") : maskCpf(c.cpf || "")}</div>
                  {c.person_type === "cnpj" && c.corporate_name && (
                    <div className="text-xs text-muted-foreground">{c.corporate_name}</div>
                  )}
                </TableCell>
                <TableCell>{maskPhone(c.phone || "")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant={
                        c.status === "ativo" ? "default" : c.status === "pendente" ? "outline" : "secondary"
                      }
                      className="capitalize"
                    >
                      {c.status}
                    </Badge>
                    {c.documentos_ok && (
                      <Badge variant="secondary" className="gap-1">
                        <FileCheck2 className="h-3 w-3" /> Documentos verificados
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(c)}>
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1"
                    onClick={() => {
                      setResetTarget(c);
                      setNewPassword("");
                      setResetError("");
                    }}
                    title="Redefinir senha"
                  >
                    <KeyRound className="h-4 w-4" />
                    Senha
                  </Button>
                  <Button
                    variant={c.documentos_ok ? "default" : "outline"}
                    size="sm"
                    className="rounded-full gap-1"
                    disabled={docsMutation.isPending}
                    onClick={() => docsMutation.mutate(c)}
                    title={c.documentos_ok ? "Remover verificação de documentos" : "Marcar documentos como verificados"}
                  >
                    <FileCheck2 className="h-4 w-4" />
                    {c.documentos_ok ? "Verificados" : "Verificar docs"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente <strong>{confirmDelete?.name}</strong> e o acesso dele à área do
              cliente. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmDelete) deleteMutation.mutate(confirmDelete.id);
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!resetTarget}
        onOpenChange={(o) => {
          if (!o) {
            setResetTarget(null);
            setNewPassword("");
            setResetError("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setResetError("");
              if (newPassword.length < 6) {
                setResetError("A senha deve ter pelo menos 6 caracteres.");
                return;
              }
              resetPasswordMutation.mutate({ id: resetTarget.id, password: newPassword });
            }}
            className="space-y-4 mt-2"
          >
            <p className="text-sm text-muted-foreground">
              Defina uma nova senha para <strong>{resetTarget?.name}</strong>. O cadastro e os documentos
              serão preservados.
            </p>
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoFocus
              />
            </div>
            {resetError && (
              <p className="text-sm text-destructive" role="alert">
                {resetError}
              </p>
            )}
            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full rounded-full"
            >
              {resetPasswordMutation.isPending ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
