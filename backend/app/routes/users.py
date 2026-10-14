import re
import secrets
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from app.database import get_session
from app.models import User, Invite
from app.auth import get_current_user, get_password_hash
from app.logger import logger

router = APIRouter(prefix="/api/users", tags=["users"])

# Schemas de Entrada e Saída
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    whatsapp: Optional[str] = None
    role: str
    created_at: datetime

class InviteCreateRequest(BaseModel):
    role: str = "admin"
    expires_in_hours: int # 24, 48, 72, 96

class InviteResponse(BaseModel):
    id: int
    token: str
    role: str
    created_at: datetime
    expires_at: datetime
    used: bool
    used_at: Optional[datetime] = None
    used_by_email: Optional[str] = None

class InviteValidationResponse(BaseModel):
    valid: bool
    role: str
    expires_at: datetime

class AcceptInviteRequest(BaseModel):
    username: str
    email: str
    password: str
    whatsapp: Optional[str] = None

# 1. Listar Usuários (Requer autenticação)
@router.get("", response_model=List[UserResponse])
def list_users(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(User).order_by(User.id.asc())
    users = session.exec(statement).all()
    return users

# 2. Excluir Usuário (Requer autenticação)
@router.delete("/{user_id}", response_model=dict)
def delete_user(user_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    
    # O Super Admin NUNCA pode ser excluído
    if user.role == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O Super Admin é o usuário mestre do sistema e não pode ser excluído."
        )
    
    # Usuário não pode excluir a si mesmo
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode excluir sua própria conta enquanto estiver logado."
        )
    
    session.delete(user)
    session.commit()
    logger.info(f"Usuário {user.username} ({user.email}) excluído por {current_user.username}.")
    return {"message": "Usuário excluído com sucesso."}

# 3. Gerar Convite (Requer autenticação)
@router.post("/invites", response_model=InviteResponse)
def create_invite(
    request: InviteCreateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Regra: Só pode criar convite para o tipo Admin
    if request.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas o tipo de usuário 'Admin' pode ser convidado. O Super Admin é fixo e exclusivo do sistema."
        )
    
    # Regra: O tempo para expirar só pode ser 24, 48, 72 ou 96 horas
    allowed_hours = [24, 48, 72, 96]
    if request.expires_in_hours not in allowed_hours:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"O tempo de expiração do convite deve ser exatamente 24, 48, 72 ou 96 horas. Recebido: {request.expires_in_hours}."
        )
    
    # Gerar token único e seguro
    token = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=request.expires_in_hours)
    
    invite = Invite(
        token=token,
        role="admin",
        created_at=now,
        expires_at=expires_at,
        used=False,
        created_by_user_id=current_user.id,
        client_id=current_user.client_id
    )
    session.add(invite)
    session.commit()
    session.refresh(invite)
    
    logger.info(f"Convite de Admin criado por {current_user.username} (expira em {request.expires_in_hours}h).")
    return invite

# 4. Listar Convites (Requer autenticação)
@router.get("/invites", response_model=List[InviteResponse])
def list_invites(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(Invite).order_by(Invite.created_at.desc())
    invites = session.exec(statement).all()
    return invites

# 5. Validar Convite (Rota Pública para a tela de aceite)
@router.get("/invites/{token}", response_model=InviteValidationResponse)
def validate_invite(token: str, session: Session = Depends(get_session)):
    statement = select(Invite).where(Invite.token == token)
    invite = session.exec(statement).first()
    
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Convite não encontrado.")
    
    if invite.used:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este convite já foi utilizado.")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este link de convite expirou.")
    
    return {
        "valid": True,
        "role": invite.role,
        "expires_at": invite.expires_at
    }

# 6. Aceitar Convite e Criar Usuário Admin (Rota Pública)
@router.post("/invites/{token}/accept", response_model=dict)
def accept_invite(
    token: str,
    request: AcceptInviteRequest,
    session: Session = Depends(get_session)
):
    statement = select(Invite).where(Invite.token == token)
    invite = session.exec(statement).first()
    
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Convite não encontrado.")
    
    if invite.used:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este convite já foi utilizado.")
    
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este link de convite expirou.")
    
    # Validações de tamanho
    clean_username = request.username.strip()
    clean_email = request.email.strip().lower()
    
    if "@" not in clean_email or "." not in clean_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Por favor, forneça um endereço de e-mail válido.")
    
    if len(clean_username) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O nome de usuário deve ter pelo menos 3 caracteres.")
    
    # Validações de senha (mínimo 12 caracteres, maiúscula, minúscula, número e caractere especial)
    if len(request.password) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="A senha deve ter no mínimo 12 caracteres."
        )
    if not re.search(r'[A-Z]', request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter pelo menos uma letra maiúscula."
        )
    if not re.search(r'[a-z]', request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter pelo menos uma letra minúscula."
        )
    if not re.search(r'[0-9]', request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter pelo menos um número."
        )
    if not re.search(r'[^A-Za-z0-9]', request.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve conter pelo menos um caractere especial (ex: !@#$%^&*)."
        )
    
    clean_whatsapp = request.whatsapp.strip() if request.whatsapp else None

    # Verificar e-mail duplicado
    existing_email = session.exec(select(User).where(User.email == clean_email)).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já existe um usuário cadastrado com este e-mail.")
    
    # Verificar nome de usuário duplicado
    existing_username = session.exec(select(User).where(User.username == clean_username)).first()
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já existe um usuário com este nome de usuário.")
    
    # Criar novo usuário com role "admin"
    hashed_password = get_password_hash(request.password)
    new_user = User(
        username=clean_username,
        email=clean_email,
        whatsapp=clean_whatsapp,
        hashed_password=hashed_password,
        role="admin", # Garantido como Admin
        client_id=invite.client_id
    )
    session.add(new_user)
    
    # Marcar convite como utilizado
    invite.used = True
    invite.used_at = datetime.utcnow()
    invite.used_by_email = clean_email
    session.add(invite)
    
    session.commit()
    logger.info(f"Novo usuário Admin cadastrado via convite: {clean_username} ({clean_email}) com whatsapp {clean_whatsapp}.")
    
    return {
        "message": "Conta de administrador criada com sucesso!",
        "username": clean_username,
        "email": clean_email,
        "whatsapp": clean_whatsapp,
        "role": "admin"
    }
