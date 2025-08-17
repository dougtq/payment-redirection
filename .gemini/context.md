# Contexto do Projeto: Processador de Pagamento de Boletos (Lambda SQS)

## 1. Propósito e Fluxo Geral
O projeto consiste em uma função AWS Lambda desenvolvida em TypeScript. A função é acionada por mensagens de uma fila AWS SQS. O objetivo principal é processar pagamentos de boletos.

O fluxo de execução é o seguinte:
1.  A Lambda recebe uma mensagem da fila SQS contendo um payload com identificadores (ex: `cid_acordo`, `id_parcela`).
2.  Utilizando os identificadores, a função consulta um banco de dados MySQL para buscar os detalhes completos do boleto, como linha digitável e valor.
3.  Os dados recebidos e buscados são validados de acordo com as regras de negócio.
4.  Se a validação for bem-sucedida, a função utiliza a SDK da Starkbank para realizar o pagamento do boleto.
5.  Se ocorrer qualquer erro durante o processo (validação, consulta ao banco, pagamento), uma notificação é enviada para um canal do Slack.

## 2. Tecnologias e Ferramentas
- **Linguagem:** TypeScript
- **Ambiente de Execução:** Node.js na AWS Lambda
- **Gatilho (Trigger):** AWS SQS
- **Banco de Dados:** MySQL
- **Validação de Schema:** Zod
- **Testes:** Jest
- **Integração de Pagamentos:** SDK oficial da Starkbank para Node.js
- **Notificações:** Webhook URL do Slack
- **Deploy:** Scripts manuais (ex: shell script com AWS CLI)

## 3. Lógica de Negócio Detalhada
1.  **Recepção da Mensagem:** A função principal (`handler`) receberá o evento do SQS, que contém um ou mais registros (`Records`). O corpo (`body`) de cada registro é uma string JSON com o payload do pagamento.
2.  **Busca de Dados no Banco:**
    - A função deve se conectar ao banco de dados MySQL.
    - Usando o `cid_acordo` e `id_parcela` do payload, a função deve buscar os dados do boleto. Isso requer joins entre as tabelas: `acordos` -> `acordos_parcelas` -> `parcelas_boletos` -> `boletos`.
    - Os campos essenciais a serem recuperados da tabela `boletos` são `linha_digitavel_boleto`, `valor_pagamento_boleto` e `vencimento_boleto`.
3.  **Validação:**
    - **Schema do Payload SQS:** Usar Zod para garantir que os campos `cid_*` são strings não vazias e `id_parcela` é um inteiro.
    - **Regras de Negócio:**
        - O `vencimento_boleto` buscado no banco deve ser maior ou igual à data atual.
        - O `valor_pagamento_boleto` buscado no banco deve ser de no mínimo R$ 2,00.

## 4. Integrações Externas
- **Stark Bank:**
    - **Ação:** Realizar o pagamento do boleto (`boleto-payment`).
    - **Autenticação:** Utilizar a SDK oficial com `projectId` e `privateKey`.
- **Slack:**
    - **Ação:** Enviar uma notificação de erro para uma `Webhook URL`.
    - **Formato da Mensagem:** A mensagem de erro deve conter, no mínimo, o `messageId` da mensagem SQS e os identificadores `cid_*` do payload original para facilitar a depuração.

## 5. Gerenciamento de Segredos
As seguintes informações sensíveis devem ser gerenciadas via variáveis de ambiente da Lambda:
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `STARK_PROJECT_ID`, `STARK_PRIVATE_KEY`
- `SLACK_WEBHOOK_URL`

## 6. Estrutura do Banco de Dados
A estrutura detalhada das tabelas de `acordos`, `parcelas` e meios de pagamento (`boletos`, `pix`) está definida nos arquivos `acordo.sql` e `meio_pagamento.sql` na raiz do projeto. O agente deve consultar estes arquivos para entender os relacionamentos e os campos disponíveis.