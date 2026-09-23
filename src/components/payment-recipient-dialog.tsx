import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentRecipientSchema, type PaymentRecipientInput } from "@/lib/payment-recipient";

export type { PaymentRecipientInput } from "@/lib/payment-recipient";

const EMPTY_FORM: PaymentRecipientInput = {
  recipient_name: "",
  recipient_document: "",
  bank_name: "",
  bank_agency: "",
  bank_account: "",
  bank_account_type: "corrente",
  bank_account_holder: "",
};

export function PaymentRecipientDialog({
  open,
  onOpenChange,
  amount,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  submitting: boolean;
  onSubmit: (input: PaymentRecipientInput) => void;
}) {
  const [form, setForm] = useState<PaymentRecipientInput>(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open]);

  function update<K extends keyof PaymentRecipientInput>(key: K, value: PaymentRecipientInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    const parsed = paymentRecipientSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados do recebedor.");
      return;
    }
    setError("");
    onSubmit(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !submitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dados do recebedor</DialogTitle>
          <DialogDescription>
            Informe a conta que receberá o pagamento total de {amount}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nome ou razão social">
              <Input
                value={form.recipient_name}
                onChange={(event) => update("recipient_name", event.target.value)}
                maxLength={150}
                autoComplete="name"
              />
            </FormField>
            <FormField label="CPF ou CNPJ">
              <Input
                value={form.recipient_document}
                onChange={(event) => update("recipient_document", event.target.value)}
                inputMode="numeric"
                maxLength={18}
                placeholder="Somente números"
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Banco">
              <Input
                value={form.bank_name}
                onChange={(event) => update("bank_name", event.target.value)}
                maxLength={100}
                placeholder="Nome ou código do banco"
              />
            </FormField>
            <FormField label="Tipo de conta">
              <Select
                value={form.bank_account_type}
                onValueChange={(value: PaymentRecipientInput["bank_account_type"]) => update("bank_account_type", value)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta corrente</SelectItem>
                  <SelectItem value="poupanca">Conta poupança</SelectItem>
                  <SelectItem value="pagamento">Conta de pagamento</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Agência">
              <Input
                value={form.bank_agency}
                onChange={(event) => update("bank_agency", event.target.value)}
                maxLength={20}
              />
            </FormField>
            <FormField label="Conta com dígito">
              <Input
                value={form.bank_account}
                onChange={(event) => update("bank_account", event.target.value)}
                maxLength={30}
              />
            </FormField>
          </div>

          <FormField label="Titular da conta">
            <Input
              value={form.bank_account_holder}
              onChange={(event) => update("bank_account_holder", event.target.value)}
              maxLength={150}
            />
          </FormField>

          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}