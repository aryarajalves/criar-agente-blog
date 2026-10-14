import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Request
from pydantic import BaseModel, Field, ConfigDict
from sqlmodel import Session, select
from app.database import get_session
from app.models import Comment, Post, User
from app.auth import get_current_user
from app.logger import logger

router = APIRouter(prefix="/api/comments", tags=["comments"])

class CommentCreate(BaseModel):
    post_id: int
    author_name: str = Field(..., min_length=2, max_length=100)
    author_email: Optional[str] = Field(default=None, max_length=150)
    content: str = Field(..., min_length=2, max_length=2000)
    author_avatar_url: Optional[str] = Field(default=None)

class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    author_name: str
    author_email: Optional[str]
    content: str
    created_at: datetime
    approved: bool
    client_id: str
    author_avatar_url: Optional[str]


# 1. Criar comentário (Público)
@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_data: CommentCreate,
    session: Session = Depends(get_session)
):
    logger.info(f"Recebendo comentário público para o post ID: {comment_data.post_id}")
    
    # Validar se o post existe
    post = session.get(Post, comment_data.post_id)
    if not post:
        logger.warning(f"Tentativa de comentar em post inexistente ID: {comment_data.post_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post não encontrado."
        )
        
    # Herdar o client_id do post para garantir isolamento e prevenção de IDOR
    db_comment = Comment(
        post_id=comment_data.post_id,
        author_name=comment_data.author_name,
        author_email=comment_data.author_email,
        content=comment_data.content,
        client_id=post.client_id,
        approved=True,  # Aprovado por padrão conforme regras acordadas
        author_avatar_url=comment_data.author_avatar_url
    )
    
    try:
        session.add(db_comment)
        session.commit()
        session.refresh(db_comment)
        logger.info(f"Comentário criado com sucesso ID: {db_comment.id}")
        return db_comment
    except Exception as e:
        session.rollback()
        logger.error(f"Erro ao salvar comentário no banco: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao salvar comentário."
        )

# 2. Listar comentários de um post (Público)
@router.get("/post/{post_id}", response_model=List[CommentResponse])
def get_comments_by_post(
    post_id: int,
    session: Session = Depends(get_session)
):
    logger.info(f"Listando comentários para o post ID: {post_id}")
    
    # Validar se o post existe
    post = session.get(Post, post_id)
    if not post:
        logger.warning(f"Post ID {post_id} não encontrado ao buscar comentários.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post não encontrado."
        )
        
    statement = select(Comment).where(
        Comment.post_id == post_id,
        Comment.approved == True
    ).order_by(Comment.created_at.asc())
    
    comments = session.exec(statement).all()
    return comments

# 3. Deletar comentário (Protegida - Admin)
@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    logger.info(f"Admin {current_user.email} tentando deletar comentário ID: {comment_id}")
    
    # Prevenção de IDOR: Filtro obrigatório por client_id do usuário logado
    statement = select(Comment).where(
        Comment.id == comment_id,
        Comment.client_id == current_user.client_id
    )
    db_comment = session.exec(statement).first()
    
    if not db_comment:
        logger.warning(f"Comentário ID {comment_id} não encontrado para o client_id {current_user.client_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentário não encontrado ou você não tem permissão para deletá-lo."
        )
        
    try:
        session.delete(db_comment)
        session.commit()
        logger.info(f"Comentário ID {comment_id} deletado com sucesso.")
        return None
    except Exception as e:
        session.rollback()
        logger.error(f"Erro ao deletar comentário ID {comment_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao deletar o comentário."
        )

# 4. Listar todos os comentários do admin (Protegida - Admin)
@router.get("/admin/all", response_model=List[CommentResponse])
def get_admin_comments(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    logger.info(f"Admin {current_user.email} listando todos os comentários do client_id: {current_user.client_id}")
    
    # Prevenção de IDOR: Filtro obrigatório por client_id do usuário logado
    statement = select(Comment).where(
        Comment.client_id == current_user.client_id
    ).order_by(Comment.created_at.desc())
    
    comments = session.exec(statement).all()
    return comments

# 5. Upload de Imagem de Avatar para o comentário (Público)
@router.post("/upload-avatar", status_code=status.HTTP_201_CREATED)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...)
):
    logger.info(f"Recebendo imagem de avatar pública: {file.filename}")
    
    # Validar que é uma imagem
    if not file.content_type or not file.content_type.startswith("image/"):
        logger.warning(f"Tipo de arquivo inválido de avatar: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas arquivos de imagem são permitidos (JPEG, PNG, WEBP, GIF)."
        )
        
    # Garantir a criação da pasta static/avatars
    upload_dir = os.path.join("app", "static", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Gerar nome único
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        if "png" in file.content_type:
            ext = ".png"
        elif "jpeg" in file.content_type or "jpg" in file.content_type:
            ext = ".jpg"
        elif "webp" in file.content_type:
            ext = ".webp"
        elif "gif" in file.content_type:
            ext = ".gif"
        else:
            ext = ".png"
            
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Salvar o arquivo no disco
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"Imagem de avatar salva com sucesso em {file_path}")
    except Exception as e:
        logger.error(f"Erro ao salvar avatar enviado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar a imagem no servidor."
        )
        
    # Construir a URL pública absoluta
    base_url = str(request.base_url)
    url = f"{base_url.rstrip('/')}/static/avatars/{unique_filename}"
    
    return {"url": url}
