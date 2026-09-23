# Cadastro e acesso de clientes por CPF ou CNPJ

## Objetivo
Permitir que o administrador cadastre clientes pessoa física ou pessoa jurídica, preservando integralmente os cadastros e telas atuais de CPF.

## Alterações
- Adicionar ao cadastro de clientes a escolha entre **Pessoa física (CPF)** e **Pessoa jurídica (CNPJ)**.
- Validar e formatar CPF ou CNPJ conforme o tipo escolhido.
- Para pessoa jurídica, cadastrar também **Razão Social** e **CNAE**.
- Atualizar busca e listagem administrativa para identificar CPF/CNPJ.
- Alterar a tela de acesso para aceitar **CPF/CNPJ** no mesmo campo.
- Manter o login dos clientes CPF funcionando sem mudanças.
- Na área do cliente CNPJ, substituir a aba de dados pessoais por uma aba **Empresa**, com CNPJ, CNAE e Razão Social.
- Na área do cliente CPF, manter a aba **Dados Pessoais** atual.

## Dados e segurança
- Acrescentar ao cadastro existente os campos de tipo de pessoa, CNPJ, CNAE e Razão Social.
- Garantir unicidade de CNPJ, assim como já ocorre com CPF.
- O CNPJ será usado apenas para localizar a conta de acesso; a senha continuará protegida pelo sistema de autenticação.
- Clientes existentes serão considerados pessoa física automaticamente.

## Validação
- Testar criação e edição de clientes CPF e CNPJ.
- Testar acesso pelo CPF e pelo CNPJ.
- Conferir que cada tipo vê somente a aba correspondente na área do cliente.
