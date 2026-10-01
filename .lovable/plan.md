# Solicitação com valor informado

## Objetivo
Substituir a solicitação automática pelo Valor do Bem por um valor de pagamento informado pelo administrador ou consultor.

## O que será alterado
- Adicionar o campo obrigatório **Valor do pagamento** ao formulário que já recebe os dados do recebedor.
- Aceitar apenas valores positivos e não superiores ao **Valor do Bem** da carta.
- Aplicar a mesma validação na tela e no servidor.
- Usar o valor informado na solicitação, no histórico, no painel administrativo e no extrato do cliente.
- Trocar os textos de “pagamento total” por “pagamento” nas telas relacionadas, sem alterar solicitações antigas.
- Manter o bloqueio de uma nova solicitação enquanto houver outra pendente.
- Manter a limpeza dos dados do recebedor quando a solicitação for cancelada.

## Detalhes técnicos
- O formulário enviará o valor em formato numérico junto aos dados bancários.
- O servidor buscará o Valor do Bem atual da carta e rejeitará valores inválidos ou acima desse limite.
- A estrutura atual da base será reutilizada, pois a coluna de valor já existe.
