import sys
import os

# Adiciona o diretório raiz ao path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.database import engine
from app.logger import logger

def add_whatsapp_column():
    """Adiciona a coluna whatsapp na tabela users se ainda não existir."""
    logger.info("Verificando/adicionando coluna 'whatsapp' na tabela users...")
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR;"))
    logger.info("Migração concluída: Coluna 'whatsapp' pronta.")

if __name__ == "__main__":
    add_whatsapp_column()
