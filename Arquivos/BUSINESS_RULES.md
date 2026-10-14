# Regras de Negócio do Projeto (BUSINESS_RULES.md)

Este documento centraliza as definições, diretrizes de negócio e comportamentos esperados acordados para a plataforma do Blog Portfólio de Interfaces.

---

## 📌 Escopo e Objetivos do Sistema
- **Objetivo Principal:** Servir como um portfólio altamente estético de estudos de caso e análises de interfaces, focado em converter visitantes de alto valor (experts e co-produtores de lançamentos/SaaS) em parceiros comerciais de coprodução de design de interfaces.
- **Canal de Tráfego:** Acessível e otimizado para ser indexado pelo Google (foco total em SEO para busca orgânica).

---

## 🛠️ Stack Tecnológica de Negócio
- **Backend:** Python com framework FastAPI.
- **Acesso a Banco de Dados:** SQLModel (com SQLAlchemy e Pydantic) conectando ao PostgreSQL.
- **Frontend:** React + Vite, sem o uso de TailwindCSS (Vanilla CSS puro de alta performance e flexibilidade visual).
- **SEO Strategy:** Geração de Site Estático (SSG) pós-build no frontend, injetando metadados de SEO individualizados em HTML estático por post e criando automaticamente o `sitemap.xml`.
- **Infraestrutura:** Docker Compose orquestrando Banco, Backend e Frontend.

---

## 🔐 Regras de Autenticação e Segurança
- **Acesso Administrativo:**
  - Login restrito na URL `http://localhost:5300/login`.
  - Autenticação baseada em JWT com validade padrão de 7 dias.
  - Credenciais oficiais de desenvolvimento:
    - **E-mail:** `aryarajmarketing@gmail.com`
    - **Senha:** `123456`
- **Prevenção de IDOR:**
  - Toda operação de CRUD de posts na área administrativa (criar, ler todos, atualizar, excluir) é rigidamente filtrada pelo `client_id` associado ao usuário administrador autenticado no contexto.
  - A API pública de posts filtra os dados pelo `client_id` padrão (`default_client`) para garantir isolamento e consistência.

---

## 📝 Gestão de Conteúdo (Posts)
- **Campos do Post:**
  - `title`: Título do caso de interface.
  - `slug`: String limpa para URL amigável. Gerada automaticamente a partir do título, convertendo caracteres acentuados para ASCII simples (ex: "í" vira "i") e removendo caracteres especiais.
  - `summary`: Resumo curto do post, utilizado para a descrição no card e como a meta description de SEO.
  - `content`: Conteúdo do post (suporta Markdown básico ou HTML).
  - `published`: Flag booleano (Rascunho vs Publicado). Apenas posts publicados são expostos na API pública e gerados no processo de build estático (SSG).

---

## 📋 Perguntas em Aberto (Histórico)

- [x] Qual framework Python utilizar no backend? (Respondido: FastAPI)
- [x] Como lidar com o SEO no frontend? (Respondido: React/Vite com SSG)
- [x] Qual ORM/Acesso a Banco usar? (Respondido: SQLModel)
- [x] Como gerenciar os posts? (Respondido: Painel administrativo no próprio React)
- [x] Como rodar o banco de dados? (Respondido: Docker Compose rodando tudo)
