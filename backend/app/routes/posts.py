import os
import re
import uuid
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Request
from pydantic import BaseModel
from sqlmodel import Session, select
from app.database import get_session
from app.models import Post, User
from app.auth import get_current_user
from app.logger import logger

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

router = APIRouter(prefix="/api/posts", tags=["posts"])

# Schemas Pydantic para validação
class PostCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    content: str
    summary: str
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None
    published: Optional[bool] = False

class PostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: Optional[str] = None
    published: Optional[bool] = None

class AiGenerateRequest(BaseModel):
    description: str
    tone: Optional[str] = "profissional"  # profissional | descontraido | tecnico | persuasivo
    size: Optional[str] = "medio"        # curto | medio | longo
    variations_count: Optional[int] = 1

class AiVariation(BaseModel):
    title: str
    summary: str
    content: str
    tags: Optional[str] = None

class AiGenerateResponse(BaseModel):
    variations: List[AiVariation]


# Função utilitária para gerar slug a partir do título
def generate_slug(title: str) -> str:
    import unicodedata
    # Normalizar para decompor caracteres acentuados (ex: í -> i)
    normalized = unicodedata.normalize('NFKD', title)
    ascii_title = normalized.encode('ascii', 'ignore').decode('ascii')
    # Converter para minúsculo, remover caracteres especiais e espaços por hífens
    slug = ascii_title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    return slug.strip('-')


# 0. Rota de IA: Gerar conteúdo de post com GPT (Protegida)
@router.post("/ai/generate", response_model=AiGenerateResponse)
async def generate_post_with_ai(
    request_data: AiGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Admin {current_user.email} solicitando geração de post com IA.")

    if not OPENAI_AVAILABLE:
        logger.error("Biblioteca OpenAI não instalada.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de IA não disponível. Biblioteca OpenAI não encontrada."
        )

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "sk-sua-chave-openai-aqui":
        logger.error("OPENAI_API_KEY não configurada no ambiente.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de IA não configurado. Adicione a OPENAI_API_KEY ao .env."
        )

    # Mapear opções para descrições amigáveis no prompt
    tone_map = {
        "profissional": "profissional e autoritativo",
        "descontraido": "descontraído, amigável e acessível",
        "tecnico": "técnico e detalhista, voltado para desenvolvedores e profissionais de tecnologia",
        "persuasivo": "persuasivo e focado em converter leitores em clientes"
    }
    size_map = {
        "curto": "curto, com cerca de 300 palavras",
        "medio": "médio, com cerca de 600 palavras",
        "longo": "longo e completo, com cerca de 1200 palavras"
    }

    tone_desc = tone_map.get(request_data.tone, "profissional")
    size_desc = size_map.get(request_data.size, "médio, com cerca de 600 palavras")
    variations_count = request_data.variations_count if request_data.variations_count and request_data.variations_count > 0 else 1
    variations_count = min(variations_count, 5)

    system_prompt = f"""Você é um especialista em marketing de conteúdo e copywriting para blogs de tecnologia e design de interfaces.
Seu objetivo é escrever posts de blog altamente envolventes, bem estruturados e otimizados para SEO.

Você deve gerar exatamente {variations_count} variações alternativas para permitir testes A/B de escrita.
Ao receber a descrição do post, você DEVE retornar um JSON válido com exatamente este formato (sem markdown code block, apenas o JSON puro):
{{
  "variations": [
    {{
      "title": "Título atrativo e otimizado para SEO da variação",
      "summary": "Meta description concisa de 150-160 caracteres da variação",
      "content": "Conteúdo completo da variação em Markdown",
      "tags": "Tags recomendadas para SEO (máximo 4), separadas por vírgula. Exemplo: SaaS, UI/UX, Design, Conversão"
    }}
  ]
}}

Regras obrigatórias:
- A lista "variations" deve conter exatamente {variations_count} variações. Cada variação deve ter títulos, resumos e conteúdos ligeiramente diferentes para que possamos testá-los.
- O conteúdo DEVE usar Markdown: # para títulos principais, ## para sub-seções, **negrito**, listas, etc.
- O título deve ser cativante e incluir palavras-chave relevantes.
- O resumo deve ser uma meta description de até 160 caracteres.
- Não inclua o título (h1) dentro do conteúdo Markdown, apenas sub-títulos.
- O campo "tags" deve conter de 2 a 4 tags estratégicas e curtas para o post, separadas por vírgula.
- Escreva sempre em português do Brasil.
- Retorne APENAS o JSON puro, sem nenhum texto antes ou depois."""

    user_message = f"""Crie {variations_count} variações de post de blog com as seguintes especificações:

Descrição: {request_data.description}
Tom de escrita: {tone_desc}
Tamanho: {size_desc}

Lembre-se de retornar apenas o JSON válido."""

    try:
        client = AsyncOpenAI(api_key=api_key)
        response = await client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )

        raw_content = response.choices[0].message.content
        logger.info(f"Resposta bruta da OpenAI recebida para {current_user.email}.")

        generated = json.loads(raw_content)

        # Tratar fallback de resposta em formato antigo (objeto único)
        if "variations" not in generated or not isinstance(generated["variations"], list):
            if all(k in generated for k in ("title", "summary", "content")):
                generated = {"variations": [generated]}
            else:
                logger.error(f"Resposta da IA com formato inválido: {raw_content}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="A IA retornou um formato inesperado. Tente novamente."
                )

        # Validar conteúdo das variações
        for var in generated["variations"]:
            if not all(k in var for k in ("title", "summary", "content")):
                logger.error(f"Variação inválida na resposta da IA: {raw_content}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="A IA retornou um formato inesperado em alguma das variações."
                )

        logger.info(f"Geradas {len(generated['variations'])} variações com sucesso para {current_user.email}.")
        
        return AiGenerateResponse(
            variations=[
                AiVariation(
                    title=var["title"],
                    summary=var["summary"],
                    content=var["content"],
                    tags=var.get("tags", "")
                ) for var in generated["variations"]
            ]
        )

    except json.JSONDecodeError as e:
        logger.error(f"Erro ao decodificar JSON da OpenAI: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="A IA retornou uma resposta inválida. Tente novamente."
        )
    except Exception as e:
        logger.error(f"Erro ao chamar a API da OpenAI para {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro ao comunicar com a IA: {str(e)}"
        )


# 1. Rota pública para listar posts publicados
@router.get("", response_model=List[Post])
def get_posts(
    client_id: str = "default_client",
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(20, ge=1, le=100),
    session: Session = Depends(get_session)
):
    logger.info(f"Listando posts públicos para o cliente: {client_id}")
    statement = select(Post).where(
        Post.client_id == client_id,
        Post.published == True
    ).order_by(Post.created_at.desc())
    
    if page is not None:
        statement = statement.offset((page - 1) * page_size).limit(page_size)
    
    posts = session.exec(statement).all()
    return posts

# 2. Rota pública para obter detalhe de um post pelo slug
@router.get("/{slug}", response_model=Post)
def get_post_by_slug(
    slug: str, 
    client_id: str = "default_client", 
    session: Session = Depends(get_session)
):
    logger.info(f"Buscando post com slug: {slug} e cliente: {client_id}")
    statement = select(Post).where(
        Post.client_id == client_id,
        Post.slug == slug
    )
    post = session.exec(statement).first()
    
    if not post:
        logger.warning(f"Post não encontrado para o slug: {slug}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post não encontrado."
        )
    return post

# --- Rotas Administrativas (Protegidas) ---

# 3. Listar todos os posts (publicados ou rascunhos) no painel admin
@router.get("/admin/all", response_model=List[Post])
def get_admin_posts(
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    logger.info(f"Admin {current_user.email} listando todos os posts para o client_id: {current_user.client_id}")
    
    # Prevenção de IDOR: Filtro obrigatório por client_id do usuário logado
    statement = select(Post).where(
        Post.client_id == current_user.client_id
    ).order_by(Post.created_at.desc())
    
    if page is not None:
        statement = statement.offset((page - 1) * page_size).limit(page_size)
    
    posts = session.exec(statement).all()
    return posts

# 4. Criar um novo post
@router.post("", response_model=Post, status_code=status.HTTP_201_CREATED)
def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    logger.info(f"Admin {current_user.email} criando post: {post_data.title}")
    
    slug = post_data.slug or generate_slug(post_data.title)
    
    # Verificar se o slug já existe para este client_id
    statement = select(Post).where(
        Post.client_id == current_user.client_id,
        Post.slug == slug
    )
    existing_post = session.exec(statement).first()
    if existing_post:
        logger.warning(f"Slug já existe: {slug} para o client_id: {current_user.client_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Um post com esse slug ou título semelhante já existe."
        )
        
    db_post = Post(
        title=post_data.title,
        slug=slug,
        content=post_data.content,
        summary=post_data.summary,
        cover_image_url=post_data.cover_image_url,
        tags=post_data.tags,
        published=post_data.published,
        client_id=current_user.client_id
    )
    
    try:
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        logger.info(f"Post criado com sucesso ID: {db_post.id}")
        return db_post
    except Exception as e:
        session.rollback()
        logger.error(f"Erro ao salvar post no banco: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao criar o post."
        )

# 5. Atualizar um post existente
@router.put("/{post_id}", response_model=Post)
def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    logger.info(f"Admin {current_user.email} atualizando post ID: {post_id}")
    
    # Prevenção de IDOR: Filtro obrigatório por client_id do usuário logado
    statement = select(Post).where(
        Post.id == post_id,
        Post.client_id == current_user.client_id
    )
    db_post = session.exec(statement).first()
    
    if not db_post:
        logger.warning(f"Post ID {post_id} não encontrado para o client_id {current_user.client_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post não encontrado."
        )
        
    # Atualizar campos se fornecidos
    update_data = post_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "slug" and value:
            # Validar se o novo slug é único
            slug_statement = select(Post).where(
                Post.id != post_id,
                Post.client_id == current_user.client_id,
                Post.slug == value
            )
            existing_post = session.exec(slug_statement).first()
            if existing_post:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Este slug já está sendo utilizado por outro post."
                )
        setattr(db_post, key, value)
        
    db_post.updated_at = datetime.utcnow()
    
    try:
        session.add(db_post)
        session.commit()
        session.refresh(db_post)
        logger.info(f"Post ID {post_id} atualizado com sucesso.")
        return db_post
    except Exception as e:
        session.rollback()
        logger.error(f"Erro ao atualizar post ID {post_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao atualizar o post."
        )

# 6. Deletar um post
@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    logger.info(f"Admin {current_user.email} deletando post ID: {post_id}")
    
    # Prevenção de IDOR: Filtro obrigatório por client_id do usuário logado
    statement = select(Post).where(
        Post.id == post_id,
        Post.client_id == current_user.client_id
    )
    db_post = session.exec(statement).first()
    
    if not db_post:
        logger.warning(f"Post ID {post_id} não encontrado para o client_id {current_user.client_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post não encontrado."
        )
        
    try:
        session.delete(db_post)
        session.commit()
        logger.info(f"Post ID {post_id} deletado com sucesso.")
        return None
    except Exception as e:
        session.rollback()
        logger.error(f"Erro ao deletar post ID {post_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao deletar o post."
        )

# 7. Upload de Imagem para Capa de Post (Apenas Admin)
@router.post("/upload-image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Admin {current_user.email} enviando imagem de capa: {file.filename}")
    
    # Validar que é uma imagem
    if not file.content_type or not file.content_type.startswith("image/"):
        logger.warning(f"Tipo de arquivo inválido enviado por {current_user.email}: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas arquivos de imagem são permitidos (JPEG, PNG, WEBP, GIF)."
        )
        
    # Garantir a criação da pasta
    upload_dir = os.path.join("app", "static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Gerar nome único para evitar sobrescrever arquivos existentes
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
        logger.info(f"Imagem salva com sucesso em {file_path}")
    except Exception as e:
        logger.error(f"Erro ao salvar arquivo enviado por {current_user.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao salvar a imagem no servidor."
        )
        
    # Construir a URL pública absoluta
    base_url = str(request.base_url)
    url = f"{base_url.rstrip('/')}/static/uploads/{unique_filename}"
    
    return {"url": url}
