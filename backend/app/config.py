import os
from dotenv import load_dotenv

# Carregar arquivo .env se existir (útil para desenvolvimento local fora do Docker)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin_password_123@localhost:5432/blog_db")
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_jwt_key_987654321")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "senha_segura_123")
