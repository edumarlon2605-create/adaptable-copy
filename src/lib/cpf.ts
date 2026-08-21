/** Utilitários de CPF: apenas dígitos são gravados no banco; máscara é só de interface. */

export function sanitizeCpf(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

export function formatCpf(v: string | null | undefined): string {
  const d = sanitizeCpf(v).slice(0, 11);
  if (d.length !== 11) return d;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Valida CPF pelos dígitos verificadores. Rejeita repetidos (000..., 111...). */
export function isValidCpf(v: string | null | undefined): boolean {
  const cpf = sanitizeCpf(v);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (factor - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = calc(cpf.slice(0, 9), 10);
  if (d1 !== parseInt(cpf[9], 10)) return false;
  const d2 = calc(cpf.slice(0, 10), 11);
  return d2 === parseInt(cpf[10], 10);
}
