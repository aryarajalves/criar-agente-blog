from sqlmodel import create_engine, Session, SQLModel
from app.config import DATABASE_URL
from app.logger import logger

# Criar engine de conexão
try:
    logger.info("Inicializando o engine do banco de dados PostgreSQL...")
    engine = create_engine(DATABASE_URL, echo=False)
except Exception as e:
    logger.error(f"Erro ao inicializar o engine do banco de dados: {str(e)}")
    raise e

def init_db():
    try:
        logger.info("Criando tabelas no banco de dados se não existirem...")
        SQLModel.metadata.create_all(engine)
        logger.info("Tabelas verificadas/criadas com sucesso.")
    except Exception as e:
        logger.error(f"Erro ao criar as tabelas no banco de dados: {str(e)}")
        raise e

def get_session():
    with Session(engine) as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Erro durante a sessão de banco de dados: {str(e)}")
            raise e
