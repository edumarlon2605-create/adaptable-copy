# Copiar o histórico de pagamento para a carta 1321/3242

## Situação

- A carta da foto é a **1804/2930 (JULIANO RAFAEL MÜLLER)**, com parcelas vencendo de 09/2026 a 08/2031.
- A carta destino é a **1321/3242 (jaoo silva)**, com parcelas vencendo de 09/2021 a 08/2026 — todas já marcadas como pagas.

Como os vencimentos das duas cartas são de anos diferentes, copiar as datas exatas da foto colocaria pagamentos anos depois do vencimento (parcela 1 vencendo em 2021 e "paga" em 2026).

## O que vou fazer

Copiar o **padrão** de pagamento parcela por parcela: para cada parcela, uso a mesma diferença de dias em relação ao vencimento e o mesmo horário da carta da foto.

Exemplo, com a parcela 1 da foto paga 3 dias após o vencimento às 17:54:38:
- carta 1321/3242, parcela 1 vence 10/09/2021 → passa a constar como paga em 13/09/2021 às 17:54:38.

Resultado: o histórico da carta de jaoo silva fica com exatamente o mesmo ritmo de pagamentos (às vezes adiantado, às vezes atrasado, sempre a partir das 05:00) que aparece na foto, mas ancorado nos vencimentos corretos dela.

## Também será atualizado

- O histórico financeiro da carta destino, para que as datas exibidas lá batam com as parcelas.
- A área do cliente e o painel admin passam a mostrar as novas datas; nada muda em valores, vencimentos ou status.

## Detalhes técnicos

- Ler `carta_parcelas` da carta origem `e8fd0eed-bd7a-42df-aee5-8a40e110ee72` e calcular, por número de parcela, o deslocamento (`pago_em - vencimento`) em dias e o horário (hora/minuto/segundo) em horário de Brasília.
- Aplicar em `carta_parcelas` da carta `ab46cd77-b741-4c02-83f6-6d65b4ee4e06`: `pago_em = vencimento + deslocamento + horário`, mantendo `status = 'pago'`, `valor`, `numero` e `vencimento` intactos (o gatilho `protect_paid_parcela` permite alterar apenas `pago_em`).
- Sincronizar `payment_history` da carta destino: atualizar `payment_date` (e `due_date`/`amount` quando divergentes) dos registros `pagamento_registrado` por `installment_number`; inserir os que faltarem. Não excluir registros (o gatilho `block_history_delete` impede).
- Alterações de dados via a ferramenta de execução SQL de dados; nenhuma mudança de esquema e nenhuma alteração de código da aplicação.

## Se você preferir as datas literais

Se a intenção for realmente gravar as mesmas datas de calendário da foto (2026-2031) na carta de jaoo silva, é só dizer — nesse caso o correto seria também trocar os vencimentos dessa carta para o mesmo período.
