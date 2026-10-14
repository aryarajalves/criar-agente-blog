from datetime import datetime, timedelta
import pytest
from app.auth import create_access_token, get_password_hash
from app.models import User, Invite

@pytest.fixture(name="admin_token")
def admin_token_fixture(test_admin):
    return create_access_token(data={"sub": test_admin.email})

@pytest.fixture(name="normal_admin")
def normal_admin_fixture(session):
    user = User(
        username="normaladmin",
        email="normal@admin.com",
        hashed_password=get_password_hash("password123"),
        role="admin",
        client_id="test_client"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def test_list_users(client, admin_token, test_admin):
    response = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(u["email"] == test_admin.email and u["role"] == "super_admin" for u in data)

def test_delete_super_admin_forbidden(client, admin_token, test_admin):
    response = client.delete(f"/api/users/{test_admin.id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 400
    assert "Super Admin" in response.json()["detail"]

def test_delete_normal_admin(client, admin_token, normal_admin):
    response = client.delete(f"/api/users/{normal_admin.id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Usuário excluído com sucesso."

def test_create_invite_valid_durations(client, admin_token):
    for hours in [24, 48, 72, 96]:
        response = client.post(
            "/api/users/invites",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"role": "admin", "expires_in_hours": hours}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
        assert data["used"] is False
        assert "token" in data

def test_create_invite_invalid_duration(client, admin_token):
    response = client.post(
        "/api/users/invites",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "admin", "expires_in_hours": 12} # Não é 24, 48, 72 ou 96
    )
    assert response.status_code == 400
    assert "24, 48, 72 ou 96" in response.json()["detail"]

def test_create_invite_invalid_role(client, admin_token):
    response = client.post(
        "/api/users/invites",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "super_admin", "expires_in_hours": 24}
    )
    assert response.status_code == 400
    assert "Apenas o tipo de usuário 'Admin'" in response.json()["detail"]

def test_validate_and_accept_invite_lifecycle(client, admin_token):
    # 1. Gerar convite
    res_create = client.post(
        "/api/users/invites",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "admin", "expires_in_hours": 48}
    )
    assert res_create.status_code == 200
    token = res_create.json()["token"]

    # 2. Validar convite pela rota pública
    res_val = client.get(f"/api/users/invites/{token}")
    assert res_val.status_code == 200
    assert res_val.json()["valid"] is True
    assert res_val.json()["role"] == "admin"

    # 3. Aceitar convite e criar usuário
    res_accept = client.post(
        f"/api/users/invites/{token}/accept",
        json={
            "username": "novoadmin",
            "email": "novoadmin@teste.com",
            "password": "senhaforte123"
        }
    )
    assert res_accept.status_code == 200
    assert res_accept.json()["role"] == "admin"

    # 4. Tentar aceitar o convite novamente (deve falhar pois já foi usado)
    res_reuse = client.post(
        f"/api/users/invites/{token}/accept",
        json={
            "username": "outroadmin",
            "email": "outro@teste.com",
            "password": "senhaforte123"
        }
    )
    assert res_reuse.status_code == 400
    assert "já foi utilizado" in res_reuse.json()["detail"]

def test_expired_invite(client, session, admin_token):
    # Criar convite expirado manualmente no banco
    expired_invite = Invite(
        token="expired_token_123",
        role="admin",
        created_at=datetime.utcnow() - timedelta(days=5),
        expires_at=datetime.utcnow() - timedelta(days=1),
        used=False,
        client_id="test_client"
    )
    session.add(expired_invite)
    session.commit()

    # Validar que a API rejeita convite expirado
    res_val = client.get("/api/users/invites/expired_token_123")
    assert res_val.status_code == 400
    assert "expirou" in res_val.json()["detail"]

    # Rejeita cadastro com convite expirado
    res_accept = client.post(
        "/api/users/invites/expired_token_123/accept",
        json={
            "username": "admin_expirado",
            "email": "expirado@teste.com",
            "password": "senhaforte123"
        }
    )
    assert res_accept.status_code == 400
    assert "expirou" in res_accept.json()["detail"]
