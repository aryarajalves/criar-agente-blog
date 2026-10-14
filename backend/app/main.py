from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from app.config import ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
from app.database import init_db, engine
from app.models import User
from app.auth import get_password_hash
from app.routes import auth, posts, comments, users
from app.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialização na inicialização da aplicação
    logger.info("Iniciando a aplicação FastAPI...")
    try:
        # Criar tabelas se não existirem
        init_db()

        # Garantir colunas adicionais para bancos existentes
        try:
            from sqlalchemy import text
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR;"))
        except Exception as col_err:
            logger.warning(f"Aviso ao verificar coluna whatsapp: {col_err}")
        
        # Garantir diretório de uploads
        os.makedirs(os.path.join("app", "static", "uploads"), exist_ok=True)
        
        # Criar usuário administrador padrão (Seed)
        with Session(engine) as session:
            statement = select(User).where(User.email == ADMIN_EMAIL)
            admin = session.exec(statement).first()
            if not admin:
                logger.info(f"Criando usuário Super Admin padrão ({ADMIN_EMAIL})...")
                hashed_pw = get_password_hash(ADMIN_PASSWORD)
                new_admin = User(
                    username=ADMIN_USERNAME,
                    email=ADMIN_EMAIL,
                    hashed_password=hashed_pw,
                    role="super_admin",
                    client_id="default_client" # padrão
                )
                session.add(new_admin)
                session.commit()
                logger.info("Usuário Super Admin padrão criado com sucesso.")
            else:
                if admin.role != "super_admin":
                    admin.role = "super_admin"
                    session.add(admin)
                    session.commit()
                logger.info("Usuário administrador já existente no banco de dados com role super_admin.")
    except Exception as e:
        logger.error(f"Erro no ciclo de vida de inicialização: {str(e)}")
        
    yield
    # Lógica de encerramento da aplicação (se houver)
    logger.info("Encerrando a aplicação FastAPI...")

app = FastAPI(
    title="Blog de Interfaces API",
    description="API de gerenciamento do blog portfólio de interfaces premium",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar middleware de CORS para permitir requisições do frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em prod, restringir para a URL específica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(users.router)

# Servir arquivos estáticos (uploads de imagens)
from fastapi.staticfiles import StaticFiles
os.makedirs(os.path.join("app", "static"), exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/")
def read_root():
    return {"status": "Online", "message": "API do Blog de Interfaces está ativa."}
