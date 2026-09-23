# Solicitação de pagamento no extrato

## Objetivo
Exibir a solicitação de pagamento total também no **Extrato** da área do cliente.

## Alteração
- Adicionar cada solicitação como um lançamento separado junto ao extrato de pagamentos.
- Mostrar **Solicitação de pagamento total**, valor, situação e data/hora exatas.
- Manter as parcelas e seus pagamentos atuais sem alteração.
- Atualizar automaticamente o lançamento quando a solicitação for confirmada ou cancelada.

## Detalhes técnicos
- Usar as solicitações já retornadas no detalhe da carta, sem criar novos dados.
- Ordenar os lançamentos do extrato por data, incluindo parcelas e solicitações.
