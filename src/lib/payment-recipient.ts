import { z } from "zod";
import { isValidCpf } from "@/lib/cpf";
import { isValidCnpj } from "@/lib/cnpj";

export const paymentRecipientSchema = z.object({
  recipient_name: z.string().trim().min(2, "Informe o nome ou razão social.").max(150),
  recipient_document: z.string().transform((value) => value.replace(/\D/g, "")).refine(
    (value) => isValidCpf(value) || isValidCnpj(value),
    "Informe um CPF ou CNPJ válido.",
  ),
  bank_name: z.string().trim().min(2, "Informe o banco.").max(100),
  bank_agency: z.string().trim().min(1, "Informe a agência.").max(20),
  bank_account: z.string().trim().min(1, "Informe a conta.").max(30),
  bank_account_type: z.enum(["corrente", "poupanca", "pagamento"]),
  bank_account_holder: z.string().trim().min(2, "Informe o titular da conta.").max(150),
});

export const paymentRequestSchema = paymentRecipientSchema.extend({
  amount: z.preprocess(
    (value) => {
      if (typeof value === "number") return value;
      if (typeof value !== "string") return value;
      const normalized = value.trim().replace(/\./g, "").replace(",", ".");
      return normalized === "" ? Number.NaN : Number(normalized);
    },
    z.number({ invalid_type_error: "Informe o valor do pagamento." })
      .finite("Informe um valor de pagamento válido.")
      .positive("O valor deve ser maior que zero."),
  ),
});

export function formatPaymentAmountInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 15);
  if (!digits) return "";
  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export type PaymentRecipientInput = z.input<typeof paymentRecipientSchema>;
export type PaymentRecipientData = z.output<typeof paymentRecipientSchema>;
export type PaymentRequestInput = PaymentRecipientInput & { amount: string };
export type PaymentRequestData = z.output<typeof paymentRequestSchema>;