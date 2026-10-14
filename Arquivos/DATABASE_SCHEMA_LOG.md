# Log de Alterações do Banco de Dados (DATABASE_SCHEMA_LOG.md)

## [2026-05-23] - Inicialização do Banco de Dados

### Tabelas Criadas

#### 1. `users`
Tabela para armazenar usuários administradores do painel do blog.
- `id`: INTEGER (Chave Primária, Auto-incremento)
- `username`: VARCHAR (Indexado)
- `email`: VARCHAR (Único, Indexado)
- `hashed_password`: VARCHAR
- `client_id`: VARCHAR (Indexado, padrão: 'default_client' para prevenção de IDOR)

#### 2. `posts`
Tabela para armazenar posts/cases do blog portfólio.
- `id`: INTEGER (Chave Primária, Auto-incremento)
- `title`: VARCHAR
- `slug`: VARCHAR (Único, Indexado para rotas de SEO)
- `content`: TEXT (Conteúdo do post em Markdown/HTML)
- `summary`: VARCHAR (Resumo para listagens e meta tags)
- `cover_image_url`: VARCHAR (Opcional, imagem de capa)
- `published`: BOOLEAN (Status de publicação)
- `created_at`: TIMESTAMP (Data de criação, default: UTC now)
- `updated_at`: TIMESTAMP (Data de atualização, default: UTC now)
- `client_id`: VARCHAR (Indexado, padrão: 'default_client' para prevenção de IDOR)

### Scripts de Inicialização / Migração
- **Script:** [init_db.py](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Cria%20Blog%20-%20Aryaraj/backend/scripts/init_db.py)
- **Ação:** Criação inicial de todas as tabelas descritas acima através do metadata do SQLModel/SQLAlchemy.

## [2026-05-23] - Criação da Tabela de Comentários

### Tabelas Criadas

#### 1. `comments`
Tabela para armazenar comentários nos posts do blog.
- `id`: INTEGER (Chave Primária, Auto-incremento)
- `post_id`: INTEGER (Chave Estrangeira referenciando posts.id, com ON DELETE CASCADE)
- `author_name`: VARCHAR
- `author_email`: VARCHAR (Opcional)
- `content`: TEXT (Conteúdo do comentário)
- `created_at`: TIMESTAMP (Data de criação, default: UTC now)
- `approved`: BOOLEAN (Status de aprovação, default: true)
- `client_id`: VARCHAR (Indexado, padrão: 'default_client' para prevenção de IDOR)

### Scripts de Inicialização / Migração
- **Script:** [create_comments_table.py](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Cria%20Blog%20-%20Aryaraj/backend/scripts/create_comments_table.py)
- **Ação:** Executa a migração criando a tabela `comments` no banco de dados.

## [2026-05-23] - Adição da Coluna de Tags em Posts

### Tabelas Alteradas

#### 1. `posts`
Adicionada a coluna `tags` para classificar posts e otimizar metadados de SEO.
- `tags`: VARCHAR (Opcional, armazena tags separadas por vírgula)

### Scripts de Inicialização / Migração
- **Script:** [add_tags_to_posts.py](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Cria%20Blog%20-%20Aryaraj/backend/scripts/add_tags_to_posts.py)
- **Ação:** Executa `ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags VARCHAR;` para criar a coluna caso não exista.

## [2026-05-23] - Adição da Coluna de Avatar em Comentários

### Tabelas Alteradas

#### 1. `comments`
Adicionada a coluna `author_avatar_url` para permitir que leitores façam upload de imagens personalizadas de perfil para seus comentários.
- `author_avatar_url`: VARCHAR (Opcional, URL pública do avatar)

### Scripts de Inicialização / Migração
- **Script:** [add_avatar_url_to_comments.py](file:///c:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Cria%20Blog%20-%20Aryaraj/backend/scripts/add_avatar_url_to_comments.py)
## [2026-10-13] - Gestão de Usuários (Super Admin & Admin) e Tabela de Convites

### Tabelas Alteradas

#### 1. `users`
Adicionadas as colunas `role` e `created_at` para diferenciar o Super Admin do Admin:
- `role`: VARCHAR (Indexado, padrão: 'admin', valores: 'super_admin' | 'admin')
- `created_at`: TIMESTAMP (Data de cadastro do usuário, padrão: CURRENT_TIMESTAMP)

### Tabelas Criadas

#### 1. `invites`
Tabela para gerenciamento e auditoria de links de convite para novos administradores:
- `id`: INTEGER (Chave Primária, Auto-incremento)
- `token`: VARCHAR (Único, Indexado, gerado com secrets.token_urlsafe)
- `role`: VARCHAR (Tipo de conta convidada, estritamente 'admin')
- `created_at`: TIMESTAMP (Data de geração do convite)
- `expires_at`: TIMESTAMP (Data de expiração calculada: 24h, 48h, 72h ou 96h)
- `used`: BOOLEAN (Status de utilização do link, padrão: false)
- `used_at`: TIMESTAMP (Opcional, momento do cadastro)
- `used_by_email`: VARCHAR (Opcional, e-mail do usuário que utilizou o link)
- `created_by_user_id`: INTEGER (Opcional, ID do usuário que gerou o convite)
- `client_id`: VARCHAR (Indexado, padrão: 'default_client')

### Scripts de Inicialização / Migração
- **Script:** [add_user_roles_and_invites.py](file:///C:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Cria%20Blog%20-%20Aryaraj/backend/scripts/add_user_roles_and_invites.py)
- **Ação:** Adiciona colunas à tabela `users`, atualiza o usuário inicial do `.env` para `super_admin` e cria a tabela `invites`.

## [2026-10-13] - Adição da Coluna de WhatsApp na Tabela de Usuários

### Tabelas Alteradas

#### 1. `users`
Adicionada a coluna `whatsapp` para armazenar o número de contato internacional formatado (com DDI e DDD) do administrador:
- `whatsapp`: VARCHAR (Opcional, armazena telefone com código de país e máscara, ex: `+55 (11) 99999-9999`)

### Scripts de Inicialização / Migração
- **Script:** [add_whatsapp_to_users.py](file:///C:/Users/aryar/.gemini/antigravity/scratch/Projetos%20Serios/Projetos%20Principais/Cria%20Blog%20-%20Aryaraj/backend/scripts/add_whatsapp_to_users.py)
- **Ação:** Executa `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR;` garantindo persistência retrocompatível.
