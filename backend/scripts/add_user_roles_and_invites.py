import sys
import os
from sqlalchemy import text
from sqlmodel import SQLModel

# Adiciona o diretório principal do backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from app.config import ADMIN_EMAIL
from app.logger import logger
from app.models import Invite # Importa para registrar no metadata

def main():
    logger.info("Executando migração: Adicionando roles aos usuários e criando tabela de convites...")
    try:
        with engine.connect() as conn:
            # 1. Adicionar coluna 'role' à tabela 'users' se não existir
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'admin';"))
            
            # 2. Adicionar coluna 'created_at' à tabela 'users' se não existir
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"))
            
            # 3. Assegurar que o usuário do ADMIN_EMAIL seja super_admin
            conn.execute(text(f"UPDATE users SET role = 'super_admin' WHERE email = '{ADMIN_EMAIL}';"))
            
            conn.commit()

        # 4. Criar tabela invites se não existir através do SQLModel
        SQLModel.metadata.create_all(engine)
        
        logger.info("Migração concluída com sucesso! Coluna 'role' e tabela 'invites' prontas.")
    except Exception as e:
        logger.error(f"Erro ao executar a migração: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
