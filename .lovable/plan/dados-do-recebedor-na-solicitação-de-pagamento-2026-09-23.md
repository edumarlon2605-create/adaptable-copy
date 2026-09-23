# Dados do recebedor na solicitação de pagamento

## Objetivo
Ao clicar em **Solicitar pagamento total**, abrir um formulário obrigatório antes do envio e registrar os dados do recebedor junto à solicitação.

## O que será criado
- Formulário com nome completo ou razão social, CPF/CNPJ, banco, agência, conta e tipo de conta.
- O envio somente será permitido após validar todos os campos.
- O formulário será usado tanto na tela da carta quanto no dashboard.
- A solicitação continuará usando o **Valor do Bem**, com data e horário exatos.
- Os dados bancários ficarão visíveis no detalhe da carta para administrador/consultor e na área do cliente.
- Solicitações antigas continuarão funcionando, mesmo sem esses dados.

## Detalhes técnicos
- Adicionar campos opcionais à tabela de solicitações para manter compatibilidade com registros existentes.
- Validar tamanho e formato dos dados no navegador e novamente no servidor.
- Salvar os dados no mesmo registro da solicitação e incluí-los nas consultas já existentes.
