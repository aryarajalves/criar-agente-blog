# Blog Portfólio de Interfaces Premium 🌟

Este é um projeto completo de Blog e Portfólio projetado sob medida para o **Aryaraj** atrair clientes de alto padrão (experts e co-produtores) interessados em parcerias estratégicas de UX/UI. 

A arquitetura une um backend robusto em Python, um frontend altamente estético em React/Vite com suporte a SEO por meio de Geração de Site Estático (SSG), e um banco de dados relacional PostgreSQL, todos orquestrados por Docker Compose.

---

## 🛠️ Stack Tecnológica

- **Backend:** FastAPI (Python 3.11) + SQLModel (SQLAlchemy & Pydantic)
- **Frontend:** React (Vite) + Vanilla CSS (Design System Premium, Glassmorphism & Cyber Glow)
- **Banco de Dados:** PostgreSQL 15
- **Geração Estática (SSG):** Scripts customizados pós-build para geração de páginas de posts indexáveis pelo Google e geração de `sitemap.xml`.
- **Testes:** Pytest (Backend) + Vitest / React Testing Library (Frontend)
- **Orquestração:** Docker Compose

---

## 💡 Funcionalidades em Destaque

- **Barra Lateral de Navegação (Sidebar):** Menu de navegação lateral moderno com efeito glassmorphism e identidade visual Aryaraj. Oferece links rápidos para o Blog, Gestão de Usuário e Painel Administrativo, com suporte total a dispositivos móveis através de drawer responsivo e botão hambúrguer.
- **Gestão de Usuários e Convites:** Sistema completo de permissões com papéis de **Super Admin** (administrador inicial imutável) e **Admin**. Permite gerar links de convite com prazo de expiração customizado (**24, 48, 72 ou 96 horas**).
- **Tela de Aceite de Convite Standalone:** Rota dedicada `/convite/:token` focada na experiência de ativação de conta. Apresenta formulário sem barra lateral, renderização instantânea sem animações lentas e bloqueio de autofill inadequado.
- **Datas em Horário Oficial de Brasília:** Todos os registros temporais de cadastro e expiração de convites são exibidos no horário oficial de Brasília (`America/Sao_Paulo`, GMT-3).
- **Banner Inferior Fixo com Máscara Gradiente:** Rodapé permanentemente fixo na base da tela (`position: relative; flex-shrink: 0`), mantendo a rolagem restrita ao conteúdo central (`.app-main-content`) com efeito suave de máscara gradiente (`mask-image`), eliminando cortes abruptos.
- **Paginação de Posts:** Listagem de posts da página inicial e do painel com paginação otimizada exibindo 20 posts por página.
- **Assistente de Escrita com IA (✨ IA):** Painel lateral interativo integrado ao OpenAI GPT-4 que auxilia na geração de títulos, resumos e conteúdos Markdown com seleção de tons e tamanhos.
- **Editor Fullscreen de Conteúdo:** Modo de tela cheia para escrita de posts com contador de caracteres e guia rápido Markdown.
- **Seção de Comentários e Moderação:** Sistema de comentários em tempo real nos posts com moderação e exclusão por administradores autenticados com confirmação em popup.
- **Otimização de SEO e SSG:** Tags nos posts, metatags Open Graph dinâmicas e sitemap XML estático para indexação no Google.
- **Modularização e Clean Code:** Código modularizado respeitando limites rígidos (Frontend <= 500 linhas e Backend <= 1.000 linhas).

---

## 🔑 Credenciais de Acesso (Ambiente de Desenvolvimento)

- **URL da Interface:** `http://localhost:5300`
- **URL da API (Swagger):** `http://localhost:8000/docs`
- **E-mail do Super Admin:** `admin@exemplo.com` (definido no arquivo `.env` via `ADMIN_EMAIL`)
- **Senha:** `senha_segura_exemplo` (definida no arquivo `.env` via `ADMIN_PASSWORD`)

---

## 📁 Estrutura do Projeto

```
├── Arquivos/
│   ├── BUSINESS_RULES.md          # Regras de negócio e especificações funcionais
│   └── DATABASE_SCHEMA_LOG.md     # Registro histórico de modelagem do banco de dados
├── docker/
│   ├── docker-compose-local.yml   # Configuração dos containers Docker para ambiente local
│   ├── .dockerignore
│   ├── backend/
│   │   └── Dockerfile             # Imagem Docker do backend Python/FastAPI
│   └── frontend/
│       └── Dockerfile             # Imagem Docker do frontend Node/React/Vite
├── README.md                      # Instruções e documentação geral do projeto
├── backend/
│   ├── requirements.txt           # Dependências do Python (versões fixas)
│   ├── app/
│   │   ├── main.py                # Ponto de entrada do FastAPI e seeds
│   │   ├── config.py              # Leitura do arquivo .env
│   │   ├── database.py            # Configuração de sessão e conexão PostgreSQL
│   │   ├── models.py              # Modelos SQLModel (User, Post, Comment, Invite)
│   │   ├── auth.py                # Serviços de JWT e hash de senhas bcrypt
│   │   └── routes/                # Rotas da API (auth, posts, comments, users)
│   │       ├── auth.py
│   │       ├── comments.py
│   │       ├── posts.py
│   │       └── users.py           # Gestão de usuários e convites
│   └── tests/                     # Testes unitários do Backend (Pytest + SQLite em memória)
│       ├── conftest.py
│       ├── test_ai_route.py
│       ├── test_auth.py
│       ├── test_comments.py
│       ├── test_posts.py
│       ├── test_posts_tags.py
│       └── test_users_and_invites.py
└── frontend/
    ├── package.json
    ├── vite.config.js             # Configuração do Vite e Vitest
    ├── index.html
    ├── scripts/
    │   └── ssg.js                 # Script de Geração de Site Estático e Sitemap
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                # Roteador principal e layout com máscara
    │   ├── index.css              # Design System base e glassmorphism
    │   ├── sidebar.css            # Estilos da barra lateral, footer fixo e máscara
    │   ├── components/            # Componentes visuais
    │   ├── pages/                 # Home, PostDetail, AdminDashboard, Login, UserManagement, AcceptInvite
    │   └── utils/
    │       ├── api.js             # Cliente HTTP da API
    │       └── date.js            # Formatadores de data no horário de Brasília
    └── tests/                     # Testes unitários do Frontend (Vitest + Testing Library)
```

---

## 🚀 Como Executar o Projeto

Certifique-se de possuir o Docker e Docker Compose instalados.

1. **Subir os containers:**
   Na raiz do projeto, execute:
   ```bash
   docker compose -f docker/docker-compose-local.yml up -d
   ```
2. **Acessar a aplicação:**
   - **Frontend (Interface):** Acesse `http://localhost:5300`
   - **Backend (Swagger API):** Acesse `http://localhost:8000/docs`

---

## 🧪 Como Executar os Testes Unitários

### Testes do Backend (Pytest)
```bash
docker exec -it blog_backend pytest
```

### Testes do Frontend (Vitest)
```bash
docker exec -it blog_frontend npm run test
```

---

## 🛡️ Segurança e Proteção

1. **Prevenção de IDOR:** Consultas vinculadas com segurança aos identificadores dos usuários autenticados.
2. **Permissões Granulares:** Super Admin protegido contra exclusão ou alteração de privilégios.
3. **Autenticação Segura:** Senhas criptografadas usando o algoritmo `bcrypt` e tokens `JWT`.
4. **Proteção de Variáveis de Ambiente:** Arquivos `.env` protegidos pelo `.gitignore` e pelo `.dockerignore`.
5. **Auditoria de Bibliotecas Externas:** Script automatizado (`python backend/scripts/validate_security.py` / `npm run audit`) integrando `pip-audit` (backend) e `npm audit` (frontend) para validação preventiva de CVEs antes de cada atualização no GitHub.
