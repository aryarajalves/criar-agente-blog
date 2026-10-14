import sys
import os
from sqlalchemy import text

# Adiciona o diretório principal do backend ao path para importarmos app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from app.logger import logger

def main():
    logger.info("Executando migração: Adicionando coluna 'tags' à tabela 'posts' se não existir...")
    try:
        with engine.connect() as conn:
            # Em PostgreSQL, ALTER TABLE ADD COLUMN IF NOT EXISTS é suportado nativamente
            conn.execute(text("ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags VARCHAR;"))
            conn.commit()
        logger.info("Migração concluída com sucesso! Coluna 'tags' adicionada/verificada.")
    except Exception as e:
        logger.error(f"Erro ao executar a migração: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
