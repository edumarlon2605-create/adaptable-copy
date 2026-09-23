# Solicitação de pagamento total da carta

## Objetivo
Permitir que administrador ou consultor solicite o pagamento total de uma carta pelo **Valor do Bem**, acompanhe a solicitação e encerre-a por confirmação ou cancelamento.

## O que será criado
- Na tela de detalhes da carta, adicionar o botão **Solicitar pagamento total**.
- No dashboard administrativo, adicionar uma lista de cartas com acesso rápido à mesma ação.
- Registrar cada solicitação com valor, situação e data/hora exatas.
- Impedir uma nova solicitação enquanto a carta tiver outra pendente.
- Disponibilizar as ações **Confirmar pagamento** e **Cancelar solicitação**.
- Mostrar a solicitação pendente e seu andamento na área do cliente.
- Exibir solicitação, confirmação e cancelamento no histórico da carta.
- Não marcar parcelas como pagas e não modificar o cronograma ao confirmar a solicitação.

## Regras
- O valor solicitado será sempre o **Valor do Bem** da carta.
- A situação inicial será **Pagamento solicitado**.
- Somente administrador ou consultor autorizado poderá criar, confirmar ou cancelar.
- O cliente poderá apenas visualizar solicitações vinculadas à própria carta.
- O horário será gravado automaticamente no momento exato de cada ação.

## Detalhes técnicos
- Criar uma tabela própria para solicitações, vinculada à carta, com valor, situação, autor e datas de criação e encerramento.
- Proteger os dados por usuário e função, mantendo a leitura do cliente restrita às próprias cartas.
- Registrar eventos imutáveis no histórico existente: `pagamento_total_solicitado`, `pagamento_total_confirmado` e `pagamento_total_cancelado`.
- Atualizar as consultas de carta e dashboard para retornar a solicitação atual.
