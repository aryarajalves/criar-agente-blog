import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from app.logger import logger
from sqlmodel import Session, text

def main():
    logger.info("Executando migração: Adicionando coluna 'author_avatar_url' à tabela 'comments'...")
    try:
        with Session(engine) as session:
            # PostgreSQL suporta ADD COLUMN IF NOT EXISTS
            session.exec(text("ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_avatar_url VARCHAR;"))
            session.commit()
        logger.info("Migração concluída com sucesso! Coluna 'author_avatar_url' adicionada/verificada.")
    except Exception as e:
        logger.error(f"Erro ao executar a migração: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
