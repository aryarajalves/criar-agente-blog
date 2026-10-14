import sys
import os

# Adiciona o diretório principal do backend ao path para importarmos app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from app.models import Comment
from app.logger import logger
from sqlmodel import SQLModel

def main():
    logger.info("Executando migração: Criando tabela 'comments' se não existir...")
    try:
        # Cria apenas a tabela comments se ela não existir
        SQLModel.metadata.create_all(engine)
        logger.info("Migração concluída com sucesso! Tabela 'comments' criada/verificada.")
    except Exception as e:
        logger.error(f"Erro ao executar a migração: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
