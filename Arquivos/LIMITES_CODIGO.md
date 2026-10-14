# Diretrizes de Limites de Código (Clean Code)

Para garantir que o projeto permaneça manutenível, modular e que o agente de inteligência artificial consiga processar os arquivos com máxima precisão e contexto, estabelecemos limites rígidos de tamanho de arquivo.

---

## 📏 Limites Obrigatórios

1. **Backend (Python):** Nenhum arquivo deve ultrapassar **1.000 linhas**.
2. **Frontend (React/JSX e CSS):** Nenhum arquivo deve ultrapassar **500 linhas**.

---

## 📋 Regra Obrigatória a Cada Entrega

> **Toda vez que terminar de criar algo ou atualizar, deve SEMPRE verificar se temos algum código que passou do limite e informar se tem algo para refatorar, ou se não temos nada.**

- O agente apresentará sempre ao final de cada interação a contagem de linhas dos arquivos principais do sistema.
- Se algum arquivo ultrapassar o limite, a refatoração deve ser planejada e autorizada pelo usuário.
- Se nenhum arquivo ultrapassar, deve ser confirmado explicitamente que o código está em conformidade e não há nada para refatorar.

---

## 🛡️ Protocolo de Refatoração

1. **Backup Prévio:** Antes de modularizar qualquer arquivo, criar uma cópia integral em `backups_refactor/`.
2. **Aprovação do Usuário:** Alertar e solicitar permissão antes de realizar alterações estruturais.
3. **Extração Modular:** Priorizar a separação de componentes reutilizáveis no frontend e utilitários/serviços no backend.

---

## 📊 Histórico de Verificações de Conformidade

### [13/10/2026] - Campo WhatsApp com DDI e Validação Forte de Senha
- **Backend (Limite: 1.000 linhas):**
  - `backend/app/routes/users.py`: 235 linhas ✅
  - `backend/app/models.py`: 53 linhas ✅
  - `backend/app/main.py`: 84 linhas ✅
  - `backend/scripts/add_whatsapp_to_users.py`: 15 linhas ✅
  - `backend/tests/test_users_and_invites.py`: 166 linhas ✅
  - **Status Backend:** 0 arquivos ultrapassaram o limite. Nada a refatorar.
- **Frontend (Limite: 500 linhas):**
  - `frontend/src/components/PhoneInputField.jsx`: 237 linhas ✅
  - `frontend/src/pages/AcceptInvite.jsx`: 358 linhas ✅
  - `frontend/src/utils/api.js`: 304 linhas ✅
  - `frontend/tests/PhoneInputField.test.jsx`: 44 linhas ✅
  - `frontend/tests/AcceptInvite.test.jsx`: 147 linhas ✅
  - **Status Frontend:** 0 arquivos ultrapassaram o limite. Nada a refatorar.
- **Conclusão:** 100% dos arquivos em conformidade com as diretrizes Clean Code.

