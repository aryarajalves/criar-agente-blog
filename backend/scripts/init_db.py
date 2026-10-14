import sys
import os

# Adiciona o diretório principal do backend ao path para importarmos app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db
from app.logger import logger

def main():
    logger.info("Executando script de inicialização do banco de dados...")
    try:
        init_db()
        logger.info("Banco de dados inicializado com sucesso!")
    except Exception as e:
        logger.error(f"Falha na execução do script: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
