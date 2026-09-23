import { z } from "zod";

export const paymentRecipientSchema = z.object({
  recipient_name: z.string().trim().min(2, "Informe o nome ou razão social.").max(150),
  recipient_document: z.string().transform((value) => value.replace(/\D/g, "")).refine(
    (value) => value.length === 11 || value.length === 14,
    "Informe um CPF ou CNPJ válido.",
  ),
  bank_name: z.string().trim().min(2, "Informe o banco.").max(100),
  bank_agency: z.string().trim().min(1, "Informe a agência.").max(20),
  bank_account: z.string().trim().min(1, "Informe a conta.").max(30),
  bank_account_type: z.enum(["corrente", "poupanca", "pagamento"]),
  bank_account_holder: z.string().trim().min(2, "Informe o titular da conta.").max(150),
});

export type PaymentRecipientInput = z.input<typeof paymentRecipientSchema>;
export type PaymentRecipientData = z.output<typeof paymentRecipientSchema>;