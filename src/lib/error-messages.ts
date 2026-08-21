/** Traduz erros do Supabase/Postgres/servidor em mensagens amigáveis. */
export function mapError(err: unknown, fallback = "Não foi possível concluir a operação."): string {
  if (import.meta.env.DEV) console.error("[app-error]", err);

  const anyErr = err as {
    message?: string;
    code?: string;
    status?: number;
    details?: string;
  } | null;
  const raw = (anyErr?.message || anyErr?.details || "").toString();
  const code = (anyErr?.code || "").toString();
  const status = anyErr?.status;
  const lower = raw.toLowerCase();

  // Casos específicos por conteúdo/código
  if (code === "23505" || /duplicate|unique|already/i.test(lower)) {
    if (/cpf/.test(lower)) return "CPF já cadastrado.";
    if (/email/.test(lower)) return "E-mail já cadastrado.";
    return "Registro duplicado.";
  }
  if (/cpf inválido|invalid cpf/i.test(lower)) return "CPF inválido.";
  if (/user not found|no user/i.test(lower)) return "Usuário não encontrado.";
  if (/invalid login credentials|invalid_grant/i.test(lower)) return "CPF ou senha inválidos.";
  if (/wrong password|invalid password/i.test(lower)) return "Senha inválida.";
  if (/password.*(short|6)|weak.password/i.test(lower)) return "A senha deve ter pelo menos 6 caracteres.";
  if (/forbidden|permission|not authorized|rls|policy/i.test(lower)) return "Permissão insuficiente.";
  if (/not found|registro/i.test(lower) && /404/.test(String(status))) return "Registro não localizado.";
  if (/network|fetch|failed to fetch|econn|timeout/i.test(lower))
    return "Falha de comunicação com o servidor.";
  if (/exclusiv/i.test(lower)) return raw; // mensagens de separação de perfil já em PT-BR
  if (/informe/i.test(lower)) return raw; // validações client-side já em PT-BR

  return raw || fallback;
}
