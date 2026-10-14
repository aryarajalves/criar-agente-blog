---
trigger: always_on
---

# Regra de Limites de Código (Clean Code)

Para garantir que o projeto permaneça manutenível e que o agente consiga processar os arquivos sem perder o contexto, estabelecemos limites rígidos de tamanho de arquivo.

**Limites Obrigatórios:**
1. **Backend (Python):** Nenhum arquivo deve ultrapassar **1.000 linhas**.
2. **Frontend (React/JSX e CSS):** Nenhum arquivo deve ultrapassar **500 linhas**.

**Regra Obrigatória a Cada Entrega:**
- **Toda vez que terminar de criar algo ou atualizar, deve SEMPRE verificar se temos algum código que passou do limite e informar se tem algo para refatorar, ou se não temos nada.**
- O agente deve obrigatoriamente apresentar na resposta final o diagnóstico de limites com as respectivas quantidades de linhas dos maiores arquivos do projeto.

**Protocolo de Refatoração e Ações ao Atingir o Limite:**
- Se uma nova funcionalidade for fazer um arquivo ultrapassar esses limites (ou se o arquivo já estiver acima do limite), você **DEVE obrigatoriamente alertar o usuário e perguntar antes** se ele deseja realizar a modularização (quebra do arquivo) antes de prosseguir com a implementação.
- Ao propor a modularização, priorize a extração de componentes (frontend) e serviços/utilitários (backend) para arquivos separados.
- Crie uma cópia de segurança intacta do arquivo antes de modificá-lo (`backups_refactor/`).
- Aguarde a confirmação do usuário antes de realizar a quebra estrutural.

Isso evita a criação de "Arquivos Monolíticos", protege o código contra perdas e mantém o sistema 100% manutenível e transparente.
