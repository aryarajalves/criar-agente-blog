"""
Testes unitários para a rota POST /api/posts/ai/generate
Usa mock da biblioteca OpenAI para evitar chamadas reais à API.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models import User


def get_auth_headers(client: TestClient, email: str, password: str) -> dict:
    """Helper para obter token de autenticação."""
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Teste 1: Rota bloqueada sem autenticação (401)
# ---------------------------------------------------------------------------
def test_ai_generate_unauthorized(client: TestClient):
    """Sem token JWT, a rota deve retornar 401."""
    response = client.post(
        "/api/posts/ai/generate",
        json={"description": "Um post sobre UI design"}
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Teste 2: Sem OPENAI_API_KEY configurada -> 503
# ---------------------------------------------------------------------------
def test_ai_generate_missing_api_key(client: TestClient, test_admin: User):
    """Se a OPENAI_API_KEY não estiver configurada, deve retornar 503."""
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")

    with patch.dict("os.environ", {"OPENAI_API_KEY": ""}, clear=False):
        response = client.post(
            "/api/posts/ai/generate",
            json={"description": "Post de teste"},
            headers=headers
        )
    assert response.status_code == 503
    assert "não configurado" in response.json()["detail"].lower() or \
           "não disponível" in response.json()["detail"].lower() or \
           "openai_api_key" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Teste 3: Payload sem 'description' -> 422 (validação Pydantic)
# ---------------------------------------------------------------------------
def test_ai_generate_missing_description(client: TestClient, test_admin: User):
    """Sem o campo 'description', deve retornar 422 (Unprocessable Entity)."""
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")
    response = client.post(
        "/api/posts/ai/generate",
        json={"tone": "profissional"},
        headers=headers
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Teste 4: Geração com sucesso (mock da OpenAI)
# ---------------------------------------------------------------------------
def test_ai_generate_success(client: TestClient, test_admin: User):
    """Com mock da OpenAI, deve retornar a lista de variações com title, summary e content."""
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")

    # Simula a resposta da API da OpenAI no formato de variações
    mock_message = MagicMock()
    mock_message.content = '{"variations": [{"title": "Título Gerado pela IA", "summary": "Resumo SEO do post gerado.", "content": "## Introdução\\n\\nConteúdo gerado com sucesso pela IA.", "tags": "UI/UX, SaaS, Design"}]}'
    mock_choice = MagicMock()
    mock_choice.message = mock_message

    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    # Mock do cliente assíncrono da OpenAI
    mock_openai_instance = MagicMock()
    mock_openai_instance.chat = MagicMock()
    mock_openai_instance.chat.completions = MagicMock()
    mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch.dict("os.environ", {"OPENAI_API_KEY": "sk-test-key-valid"}, clear=False):
        with patch("app.routes.posts.OPENAI_AVAILABLE", True):
            with patch("app.routes.posts.AsyncOpenAI", return_value=mock_openai_instance):
                response = client.post(
                    "/api/posts/ai/generate",
                    json={
                        "description": "Um post sobre como criei um dashboard de métricas",
                        "tone": "profissional",
                        "size": "medio",
                        "variations_count": 1
                    },
                    headers=headers
                )

    assert response.status_code == 200
    data = response.json()
    assert "variations" in data
    assert len(data["variations"]) == 1
    assert data["variations"][0]["title"] == "Título Gerado pela IA"
    assert data["variations"][0]["summary"] == "Resumo SEO do post gerado."
    assert "## Introdução" in data["variations"][0]["content"]
    assert data["variations"][0]["tags"] == "UI/UX, SaaS, Design"


# ---------------------------------------------------------------------------
# Teste 5: IA retorna JSON inválido -> 502
# ---------------------------------------------------------------------------
def test_ai_generate_invalid_json_response(client: TestClient, test_admin: User):
    """Se a IA retornar JSON inválido, deve retornar 502."""
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")

    mock_message = MagicMock()
    mock_message.content = "isso não é um json válido { quebrado"

    mock_choice = MagicMock()
    mock_choice.message = mock_message

    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    mock_openai_instance = MagicMock()
    mock_openai_instance.chat = MagicMock()
    mock_openai_instance.chat.completions = MagicMock()
    mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch.dict("os.environ", {"OPENAI_API_KEY": "sk-test-key-valid"}, clear=False):
        with patch("app.routes.posts.OPENAI_AVAILABLE", True):
            with patch("app.routes.posts.AsyncOpenAI", return_value=mock_openai_instance):
                response = client.post(
                    "/api/posts/ai/generate",
                    json={"description": "Post de teste"},
                    headers=headers
                )

    assert response.status_code == 502
    assert "inválida" in response.json()["detail"].lower() or "inválido" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Teste 6: IA retorna JSON sem campos obrigatórios -> 502
# ---------------------------------------------------------------------------
def test_ai_generate_missing_fields_in_response(client: TestClient, test_admin: User):
    """Se o JSON da IA não tiver title/summary/content, deve retornar 502."""
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")

    mock_message = MagicMock()
    mock_message.content = '{"title": "Só título, faltando os outros campos"}'

    mock_choice = MagicMock()
    mock_choice.message = mock_message

    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    mock_openai_instance = MagicMock()
    mock_openai_instance.chat = MagicMock()
    mock_openai_instance.chat.completions = MagicMock()
    mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch.dict("os.environ", {"OPENAI_API_KEY": "sk-test-key-valid"}, clear=False):
        with patch("app.routes.posts.OPENAI_AVAILABLE", True):
            with patch("app.routes.posts.AsyncOpenAI", return_value=mock_openai_instance):
                response = client.post(
                    "/api/posts/ai/generate",
                    json={"description": "Post de teste"},
                    headers=headers
                )

    assert response.status_code == 502


# ---------------------------------------------------------------------------
# Teste 7: Valores padrão de tone e size
# ---------------------------------------------------------------------------
def test_ai_generate_default_values(client: TestClient, test_admin: User):
    """Sem especificar tone e size, deve usar os defaults (profissional, medio)."""
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")

    mock_message = MagicMock()
    mock_message.content = '{"variations": [{"title": "Título", "summary": "Resumo.", "content": "Conteúdo.", "tags": "Test, Tag"}]}'

    mock_choice = MagicMock()
    mock_choice.message = mock_message

    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    mock_openai_instance = MagicMock()
    mock_openai_instance.chat = MagicMock()
    mock_openai_instance.chat.completions = MagicMock()
    mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch.dict("os.environ", {"OPENAI_API_KEY": "sk-test-key-valid"}, clear=False):
        with patch("app.routes.posts.OPENAI_AVAILABLE", True):
            with patch("app.routes.posts.AsyncOpenAI", return_value=mock_openai_instance):
                response = client.post(
                    "/api/posts/ai/generate",
                    json={"description": "Post sem especificar tom ou tamanho"},
                    headers=headers
                )

    assert response.status_code == 200
    data = response.json()
    assert "variations" in data
    assert len(data["variations"]) == 1
    assert data["variations"][0]["title"] == "Título"
    assert data["variations"][0]["summary"] == "Resumo."
    assert data["variations"][0]["content"] == "Conteúdo."
    assert data["variations"][0]["tags"] == "Test, Tag"


# ---------------------------------------------------------------------------
# Teste 8: Múltiplas variações geradas com sucesso
# ---------------------------------------------------------------------------
def test_ai_generate_multiple_variations(client: TestClient, test_admin: User):
    """Com variations_count > 1, deve retornar a lista com múltiplas variações."""
    headers = get_auth_headers(client, "test@admin.com", "testpassword123")

    # Mock retornando 3 variações
    mock_message = MagicMock()
    mock_message.content = (
        '{"variations": ['
        '  {"title": "Título V1", "summary": "Resumo V1.", "content": "Corpo V1.", "tags": "V1"},'
        '  {"title": "Título V2", "summary": "Resumo V2.", "content": "Corpo V2.", "tags": "V2"},'
        '  {"title": "Título V3", "summary": "Resumo V3.", "content": "Corpo V3.", "tags": "V3"}'
        ']}'
    )

    mock_choice = MagicMock()
    mock_choice.message = mock_message

    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    mock_openai_instance = MagicMock()
    mock_openai_instance.chat = MagicMock()
    mock_openai_instance.chat.completions = MagicMock()
    mock_openai_instance.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch.dict("os.environ", {"OPENAI_API_KEY": "sk-test-key-valid"}, clear=False):
        with patch("app.routes.posts.OPENAI_AVAILABLE", True):
            with patch("app.routes.posts.AsyncOpenAI", return_value=mock_openai_instance):
                response = client.post(
                    "/api/posts/ai/generate",
                    json={
                        "description": "Post de teste com variações",
                        "variations_count": 3
                    },
                    headers=headers
                )

    assert response.status_code == 200
    data = response.json()
    assert "variations" in data
    assert len(data["variations"]) == 3
    assert data["variations"][0]["title"] == "Título V1"
    assert data["variations"][1]["title"] == "Título V2"
    assert data["variations"][2]["title"] == "Título V3"
    assert data["variations"][0]["tags"] == "V1"
