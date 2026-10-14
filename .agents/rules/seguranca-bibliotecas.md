---
trigger: always_on
---

# Regra de Auditoria de Segurança de Bibliotecas Externas

Para garantir a proteção do ecossistema e evitar a introdução de vulnerabilidades conhecidas (CVEs), ataques de supply-chain ou pacotes desatualizados, foi estabelecido o protocolo de validação contínua de dependências.

**Protocolo Obrigatório:**
1. **Auditoria Pré-Publicação:** Toda vez que for atualizar o projeto no repositório GitHub (`git push`), o agente **DEVE OBRIGATORIAMENTE** executar a validação de segurança das dependências externas do backend e frontend.
2. **Ferramenta Utilizada:** A validação deve ser realizada através do script dedicado `python backend/scripts/validate_security.py`, que executa:
   - **Backend:** `pip-audit` para inspecionar vulnerabilidades nas bibliotecas Python.
   - **Frontend:** `npm audit` para inspecionar vulnerabilidades nas dependências Node.js.
3. **Relatório na Entrega:** O resultado da auditoria deve sempre ser apresentado de forma transparente e resumida para o usuário (total de vulnerabilidades, criticidade e recomendações de atualização).
