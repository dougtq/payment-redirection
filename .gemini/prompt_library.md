## 1. planejamento-feature
Aja como um arquiteto de software sênior. Com base na solicitação "{descreva a feature ou tarefa}", gere um plano de execução detalhado. O plano deve incluir:
1.  Os arquivos que precisam ser criados ou modificados.
2.  As funções principais a serem implementadas, com suas assinaturas (parâmetros e tipo de retorno).
3.  As dependências (externas e internas) necessárias.
4.  Uma lista dos casos de teste (sucesso, falha, casos extremos) que precisam ser cobertos.

## 2. criar-testes-jest
Com base no plano de execução para a feature "{nome da feature}", escreva os testes unitários e de integração usando Jest.
Os testes devem ser escritos primeiro (TDD).
Certifique-se de cobrir os seguintes cenários: {descreva os cenários, ex: "payload válido, boleto vencido, falha na API da Starkbank"}.
Faça o mock de todas as chamadas de serviços externos (SDK da Starkbank, Slack, e acesso ao banco de dados).

## 3. implementar-codigo-typescript
Com base no plano de execução e nos testes Jest já criados para a feature "{nome da feature}", escreva o código TypeScript necessário para fazer todos os testes passarem.
O código deve seguir as melhores práticas de TypeScript, ser modular e aderir a todo o contexto do projeto definido no `context.md`.
Use `async/await` para operações assíncronas.

## 4. gerar-schema-zod
Com base na estrutura do payload SQS (`paga_boleto.json`), gere um schema de validação usando a biblioteca Zod.
O schema deve garantir que todos os campos `cid_*` são strings não vazias e que `id_parcela` é um número inteiro.

## 5. criar-script-deploy
Crie um arquivo `deploy.sh` (shell script) para automatizar o deploy desta função Lambda. O script deve executar os seguintes passos:
1.  Remover a pasta `dist` antiga.
2.  Executar o build do TypeScript (`tsc`).
3.  Instalar apenas as dependências de produção (`npm install --production`) em uma pasta `dist`.
4.  Criar um arquivo .zip com o conteúdo da pasta `dist` e o `node_modules`.
5.  Usar a AWS CLI (`aws lambda update-function-code`) para enviar o .zip para a função Lambda chamada `{nome_da_lambda}`.