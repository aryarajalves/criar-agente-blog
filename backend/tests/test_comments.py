from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models import Post, Comment, User

# Helper para obter token de autenticação
def get_auth_headers(client: TestClient, email: str, password: str) -> dict:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_comment_success(client: TestClient, session: Session):
    # Inserir um post público de teste
    post = Post(
        title="Post para Comentario",
        slug="post-para-comentario",
        content="Conteúdo do post",
        summary="Resumo do post",
        published=True,
        client_id="default_client"
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    comment_data = {
        "post_id": post.id,
        "author_name": "João Silva",
        "author_email": "joao@email.com",
        "content": "Excelente artigo, me ajudou muito!",
        "author_avatar_url": "http://example.com/avatar.jpg"
    }
    
    response = client.post("/api/comments", json=comment_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["author_name"] == comment_data["author_name"]
    assert data["content"] == comment_data["content"]
    assert data["post_id"] == post.id
    assert data["author_avatar_url"] == "http://example.com/avatar.jpg"
    # Deve herdar o client_id do post
    assert data["client_id"] == "default_client"
    
    # Verificar persistência no banco
    db_comment = session.get(Comment, data["id"])
    assert db_comment is not None
    assert db_comment.author_name == "João Silva"
    assert db_comment.author_avatar_url == "http://example.com/avatar.jpg"

def test_create_comment_invalid_post_id(client: TestClient):
    comment_data = {
        "post_id": 9999,
        "author_name": "Ghost Rider",
        "content": "Comentário fantasma"
    }
    response = client.post("/api/comments", json=comment_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "Post não encontrado."

def test_get_comments_by_post(client: TestClient, session: Session):
    # Inserir post de teste
    post = Post(
        title="Post Listagem",
        slug="post-listagem",
        content="Conteúdo",
        summary="Resumo",
        published=True,
        client_id="default_client"
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    # Inserir comentários
    c1 = Comment(
        post_id=post.id,
        author_name="Maria",
        content="Primeiro comentário!",
        client_id="default_client",
        approved=True
    )
    c2 = Comment(
        post_id=post.id,
        author_name="Pedro",
        content="Segundo comentário!",
        client_id="default_client",
        approved=True
    )
    c3 = Comment(
        post_id=post.id,
        author_name="Spammer",
        content="Comentário não aprovado",
        client_id="default_client",
        approved=False
    )
    session.add(c1)
    session.add(c2)
    session.add(c3)
    session.commit()
    
    response = client.get(f"/api/comments/post/{post.id}")
    assert response.status_code == 200
    data = response.json()
    
    # Deve trazer apenas os aprovados (2 comentários)
    assert len(data) == 2
    assert data[0]["author_name"] == "Maria"
    assert data[1]["author_name"] == "Pedro"

def test_delete_comment_success(client: TestClient, test_admin: User, session: Session):
    # Inserir post pertencente ao test_client (mesmo do test_admin)
    post = Post(
        title="Post Admin Delete",
        slug="post-admin-delete",
        content="Conteúdo",
        summary="Resumo",
        published=True,
        client_id="test_client"
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    # Inserir comentário
    comment = Comment(
        post_id=post.id,
        author_name="Leitor",
        content="Comentário a ser deletado",
        client_id="test_client",
        approved=True
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    response = client.delete(f"/api/comments/{comment.id}", headers=headers)
    assert response.status_code == 204
    
    # Validar no banco
    db_comment = session.get(Comment, comment.id)
    assert db_comment is None

def test_delete_comment_unauthorized(client: TestClient, session: Session):
    comment = Comment(
        post_id=1,
        author_name="Leitor Anonimo",
        content="Não vai deletar",
        client_id="default_client",
        approved=True
    )
    # Criar de forma leve mockando ou mockando banco
    # Mas como não salvamos no banco, vamos colocar um ID arbitrário
    response = client.delete("/api/comments/123")
    assert response.status_code == 401

def test_delete_comment_idor_prevention(client: TestClient, test_admin: User, session: Session):
    # Post de outro cliente
    post = Post(
        title="Post de Outro",
        slug="post-de-outro",
        content="Conteúdo",
        summary="Resumo",
        published=True,
        client_id="other_client"
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    # Comentário de outro cliente
    comment = Comment(
        post_id=post.id,
        author_name="Leitor de Outro",
        content="Comentário intocável por test_client",
        client_id="other_client",
        approved=True
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    
    # Logar com admin que tem client_id = test_client
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    # Tentar apagar o comentário de outro cliente
    response = client.delete(f"/api/comments/{comment.id}", headers=headers)
    
    # Deve retornar 404 (IDOR check impedindo encontrar o comentário)
    assert response.status_code == 404
    
    # Garantir que o comentário não foi deletado
    db_comment = session.get(Comment, comment.id)
    assert db_comment is not None

def test_upload_avatar_success(client: TestClient):
    import io
    file_content = b"fake-avatar-png-data"
    file_name = "avatar.png"
    files = {"file": (file_name, io.BytesIO(file_content), "image/png")}
    
    response = client.post("/api/comments/upload-avatar", files=files)
    assert response.status_code == 201
    assert "url" in response.json()
    assert "/static/avatars/" in response.json()["url"]
    
    # Limpar arquivo criado
    import os
    filename = response.json()["url"].split("/")[-1]
    saved_path = os.path.join("app", "static", "avatars", filename)
    if os.path.exists(saved_path):
        os.remove(saved_path)
