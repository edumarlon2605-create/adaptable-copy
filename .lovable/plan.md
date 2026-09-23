# Aba Dados do Administrador para clientes CNPJ

## Objetivo
Adicionar, apenas na área de clientes CNPJ, uma aba **Administrador** ao lado da aba **Empresa**.

## Alterações
- Manter a aba **Empresa** com Razão Social, CNPJ e CNAE.
- Criar a aba **Administrador** com Nome completo, CPF, RG, Data de nascimento, Estado civil e Profissão.
- Reaproveitar os campos pessoais já associados ao responsável e adicionar um campo próprio para o CPF do administrador, sem mudar o CPF de clientes pessoa física nem o CNPJ usado no acesso da empresa.
- Permitir que o cliente CNPJ salve e atualize esses dados em **Meus Dados**.
- Manter a navegação atual de clientes CPF sem alterações.

## Detalhes técnicos
- Adicionar `administrator_cpf` ao perfil, opcional e exclusivo para pessoa jurídica.
- Atualizar a leitura e gravação do perfil para aceitar esse campo com validação de CPF.
- Ajustar a quantidade de abas para preservar o alinhamento em telas maiores e a quebra adequada em telas menores.
- Validar a tela e o salvamento sem alterar documentos, pagamentos ou dados das cartas.
