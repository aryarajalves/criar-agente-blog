---
trigger: always_on
---

# Regra de Limites de Código (Clean Code)

Para garantir que o projeto permaneça manutenível e que o agente consiga processar os arquivos sem perder o contexto, estabelecemos limites rígidos de tamanho de arquivo.

**Limites Obrigatórios:**
1. **Backend (Python):** Nenhum arquivo deve ultrapassar **1.000 linhas**.
2. **Frontend (React/JSX e CSS):** Nenhum arquivo deve ultrapassar **500 linhas**.

**Verificação Obrigatória ao Final de Cada Tarefa:**
- Toda vez que terminar de criar algo ou atualizar o sistema, o agente **DEVE SEMPRE** verificar a contagem de linhas de todos os arquivos modificados/relevantes do projeto (backend e frontend).
- O agente **DEVE SEMPRE** informar na resposta final se temos algum código que passou do limite e indicar se há algo para refatorar, ou confirmar explicitamente que nenhum arquivo ultrapassou o limite e que não temos nada para refatorar.

**Ações ao atingir o limite:**
- Se uma nova funcionalidade for fazer um arquivo ultrapassar esses limites (ou se algum arquivo existente já estiver acima do limite), o agente **DEVE** alertar e realizar ou propor a modularização (quebra do arquivo em componentes, hooks, rotas ou utilitários menores).
- Priorize a extração de componentes (frontend) e serviços/utilitários (backend) para arquivos separados.
- Quando for refatorar um arquivo, crie uma cópia de segurança antes se necessário.

Isso evita a criação de "Arquivos Monolíticos" que são difíceis de testar e debugar, mantendo a arquitetura limpa e sustentável.
