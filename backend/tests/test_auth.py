from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models import User

def test_login_success(client: TestClient, test_admin: User):
    response = client.post(
        "/api/auth/login",
        json={"email": "test@admin.com", "password": "testpassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["username"] == "testadmin"
    assert data["email"] == "test@admin.com"

def test_login_failed_wrong_password(client: TestClient, test_admin: User):
    response = client.post(
        "/api/auth/login",
        json={"email": "test@admin.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "E-mail ou senha incorretos."

def test_login_failed_nonexistent_email(client: TestClient, test_admin: User):
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@admin.com", "password": "testpassword123"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "E-mail ou senha incorretos."
