from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models import Post, User

# Helper para obter token de autenticação
def get_auth_headers(client: TestClient, email: str, password: str) -> dict:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_post_with_tags_success(client: TestClient, test_admin: User, session: Session):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    post_data = {
        "title": "Post Com Tags",
        "content": "# Conteúdo\nEste post possui várias tags de SEO.",
        "summary": "Resumo de teste de tags.",
        "cover_image_url": "http://example.com/tags.jpg",
        "tags": "SaaS, UI/UX, Design, SEO",
        "published": True
    }
    
    response = client.post("/api/posts", json=post_data, headers=headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["title"] == post_data["title"]
    assert data["tags"] == "SaaS, UI/UX, Design, SEO"
    
    # Verificar no banco de dados
    db_post = session.exec(select(Post).where(Post.id == data["id"])).first()
    assert db_post is not None
    assert db_post.tags == "SaaS, UI/UX, Design, SEO"

def test_update_post_tags_success(client: TestClient, test_admin: User, session: Session):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    post = Post(
        title="Post Sem Tags",
        slug="post-sem-tags",
        content="Conteúdo inicial",
        summary="Resumo inicial",
        tags=None,
        published=True,
        client_id="test_client"
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    update_data = {
        "tags": "React, FastAPI, Docker"
    }
    
    response = client.put(f"/api/posts/{post.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["tags"] == "React, FastAPI, Docker"
    
    # Verificar persistência no banco
    session.expire(post)
    db_post = session.exec(select(Post).where(Post.id == post.id)).first()
    assert db_post.tags == "React, FastAPI, Docker"
