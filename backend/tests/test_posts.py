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

def test_create_post_success(client: TestClient, test_admin: User, session: Session):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    post_data = {
        "title": "Minha Interface Incrível",
        "content": "# Conteúdo\nEsta é uma bela interface.",
        "summary": "Um resumo sobre a interface.",
        "cover_image_url": "http://example.com/cover.jpg",
        "published": True
    }
    
    response = client.post("/api/posts", json=post_data, headers=headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["title"] == post_data["title"]
    assert data["slug"] == "minha-interface-incrivel" # Auto gerado
    assert data["client_id"] == "test_client" # Do admin logado
    
    # Verificar no banco
    db_post = session.exec(select(Post).where(Post.id == data["id"])).first()
    assert db_post is not None
    assert db_post.title == "Minha Interface Incrível"

def test_create_post_unauthorized(client: TestClient):
    post_data = {
        "title": "Post Sem Login",
        "content": "Conteúdo...",
        "summary": "Resumo...",
        "published": True
    }
    response = client.post("/api/posts", json=post_data)
    assert response.status_code == 401

def test_get_public_posts(client: TestClient, test_admin: User, session: Session):
    # Inserir alguns posts diretamente no banco
    post1 = Post(
        title="Post 1",
        slug="post-1",
        content="Post 1 content",
        summary="Summary 1",
        published=True,
        client_id="default_client" # padrão
    )
    post2 = Post(
        title="Post 2 Draft",
        slug="post-2",
        content="Post 2 content",
        summary="Summary 2",
        published=False,
        client_id="default_client"
    )
    session.add(post1)
    session.add(post2)
    session.commit()
    
    # Listar posts públicos (default_client)
    response = client.get("/api/posts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Post 1"

def test_get_post_by_slug(client: TestClient, session: Session):
    post = Post(
        title="SEO Interface",
        slug="seo-interface",
        content="SEO content",
        summary="SEO summary",
        published=True,
        client_id="default_client"
    )
    session.add(post)
    session.commit()
    
    response = client.get("/api/posts/seo-interface")
    assert response.status_code == 200
    assert response.json()["title"] == "SEO Interface"

def test_get_admin_posts_all(client: TestClient, test_admin: User, session: Session):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    # Inserir posts com client_id do admin e outro
    post_admin = Post(
        title="Admin Post",
        slug="admin-post",
        content="Admin content",
        summary="Admin summary",
        published=False,
        client_id="test_client" # mesmo do admin
    )
    post_other = Post(
        title="Other Client Post",
        slug="other-client-post",
        content="Other content",
        summary="Other summary",
        published=True,
        client_id="other_client"
    )
    session.add(post_admin)
    session.add(post_other)
    session.commit()
    
    response = client.get("/api/posts/admin/all", headers=headers)
    assert response.status_code == 200
    data = response.json()
    # Deve retornar apenas o post do client_id do admin (IDOR Check)
    assert len(data) == 1
    assert data[0]["title"] == "Admin Post"

def test_update_post_success(client: TestClient, test_admin: User, session: Session):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    post = Post(
        title="Old Title",
        slug="old-title",
        content="Old content",
        summary="Old summary",
        published=True,
        client_id="test_client"
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    update_data = {
        "title": "New Title",
        "published": False
    }
    
    response = client.put(f"/api/posts/{post.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"
    assert response.json()["published"] is False

def test_delete_post_success(client: TestClient, test_admin: User, session: Session):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    post = Post(
        title="To Delete",
        slug="to-delete",
        content="Delete this content",
        summary="Delete summary",
        published=True,
        client_id="test_client"
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    
    response = client.delete(f"/api/posts/{post.id}", headers=headers)
    assert response.status_code == 204
    
    # Verificar se foi excluído
    db_post = session.exec(select(Post).where(Post.id == post.id)).first()
    assert db_post is None

def test_upload_image_success(client: TestClient, test_admin: User):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    # Simular arquivo de imagem PNG na memória
    import io
    file_content = b"fake-png-data-here"
    file_name = "test_image.png"
    
    files = {"file": (file_name, io.BytesIO(file_content), "image/png")}
    
    response = client.post("/api/posts/upload-image", files=files, headers=headers)
    assert response.status_code == 201
    assert "url" in response.json()
    assert "/static/uploads/" in response.json()["url"]
    
    # Validar se o arquivo realmente foi criado na pasta temporária ou local de testes do container
    import os
    filename = response.json()["url"].split("/")[-1]
    saved_path = os.path.join("app", "static", "uploads", filename)
    assert os.path.exists(saved_path)
    
    # Limpar após o teste
    if os.path.exists(saved_path):
        os.remove(saved_path)

def test_upload_image_unauthorized(client: TestClient):
    import io
    files = {"file": ("test_image.png", io.BytesIO(b"data"), "image/png")}
    response = client.post("/api/posts/upload-image", files=files)
    assert response.status_code == 401

def test_upload_image_invalid_type(client: TestClient, test_admin: User):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    import io
    files = {"file": ("test.txt", io.BytesIO(b"text file content"), "text/plain")}
    
    response = client.post("/api/posts/upload-image", files=files, headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Apenas arquivos de imagem são permitidos (JPEG, PNG, WEBP, GIF)."

def test_get_posts_pagination(client: TestClient, session: Session):
    # Criar 25 posts publicados
    for i in range(25):
        post = Post(
            title=f"Post Paginado {i}",
            slug=f"post-paginado-{i}",
            content="Conteúdo do post",
            summary="Resumo",
            published=True,
            client_id="default_client"
        )
        session.add(post)
    session.commit()

    # Página 1 com 20 posts
    res_p1 = client.get("/api/posts?page=1&page_size=20")
    assert res_p1.status_code == 200
    data_p1 = res_p1.json()
    assert len(data_p1) == 20

    # Página 2 com os 5 restantes
    res_p2 = client.get("/api/posts?page=2&page_size=20")
    assert res_p2.status_code == 200
    data_p2 = res_p2.json()
    assert len(data_p2) >= 5

def test_get_admin_posts_pagination(client: TestClient, test_admin: User, session: Session):
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    
    # Criar 22 posts para o admin
    for i in range(22):
        post = Post(
            title=f"Admin Post Paginado {i}",
            slug=f"admin-post-paginado-{i}",
            content="Conteúdo",
            summary="Resumo",
            published=False,
            client_id="test_client"
        )
        session.add(post)
    session.commit()

    # Página 1 deve retornar 20
    res_p1 = client.get("/api/posts/admin/all?page=1&page_size=20", headers=headers)
    assert res_p1.status_code == 200
    assert len(res_p1.json()) == 20

    # Página 2 deve retornar os 2 restantes
    res_p2 = client.get("/api/posts/admin/all?page=2&page_size=20", headers=headers)
    assert res_p2.status_code == 200
    assert len(res_p2.json()) == 2

