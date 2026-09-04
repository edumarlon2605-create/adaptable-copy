# Aba "Documentos" do cliente após validação do admin

Quando o admin marcar o cliente como **Documentos verificados**, a aba Documentos na área do cliente deixa de mostrar envios e passa a mostrar apenas uma confirmação, sem acesso ao arquivo enviado.

## O que o cliente vai ver

Estado validado (admin já verificou):

- Um painel de confirmação com selo verde e ícone de escudo/check:
  - Título: "Enviado e documento validado com sucesso"
  - Texto: "Nossa equipe conferiu seus documentos. Não é necessário enviar nada novamente."
- Abaixo, a lista dos três itens (RG, CNH, Comprovante de residência), cada um com um selo "Validado" — sem botão Enviar, sem link para abrir o arquivo, sem botão de excluir.
- Nenhum link, miniatura ou nome de arquivo é exibido.

Estado não validado (como hoje):

- Os três campos com botão "Enviar", igual ao atual.
- Acréscimo de um aviso discreto no topo: "Seus documentos ficam em análise após o envio."

## Detalhes técnicos

- `getMyProfile` (em `src/routes/api/bbc.ts`) já devolve `documentos_ok`; nenhuma mudança no backend.
- Em `src/routes/_authenticated/cliente/perfil.tsx`, na `TabsContent value="documentos"`, ramificar por `profile?.documentos_ok`:
  - verdadeiro → novo bloco de confirmação (sem renderizar `DocumentUploader`, portanto sem URLs assinadas na tela);
  - falso → os `DocumentUploader` atuais.
- Cores e tipografia via tokens do design system existente; nenhuma alteração de esquema, regra de acesso ou lógica de upload.
