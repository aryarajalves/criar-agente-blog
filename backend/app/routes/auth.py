from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import Session, select
from app.database import get_session
from app.models import User
from app.auth import verify_password, create_access_token
from app.logger import logger

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    email: str
    role: str

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, session: Session = Depends(get_session)):
    logger.info(f"Tentativa de login para o e-mail: {request.email}")
    
    statement = select(User).where(User.email == request.email)
    user = session.exec(statement).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        logger.warning(f"Falha de autenticação para o e-mail: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )
    
    access_token = create_access_token(data={"sub": user.email})
    logger.info(f"Login bem-sucedido para o e-mail: {request.email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "email": user.email,
        "role": user.role or "admin"
    }

from app.auth import get_current_user

@router.get("/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role or "admin"
    }

# Suporte ao formulário padrão OAuth2 do Swagger
@router.post("/login-swagger", response_model=dict)
def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    statement = select(User).where(User.email == form_data.username)
    user = session.exec(statement).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
