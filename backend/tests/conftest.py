import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from app.main import app
from app.database import get_session
from app.auth import get_password_hash
from app.models import User

# Configura banco de dados em memória para os testes
@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

# Configura cliente de testes do FastAPI
@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

# Fixture para criar um admin padrão no banco de teste
@pytest.fixture(name="test_admin")
def test_admin_fixture(session: Session):
    hashed_pw = get_password_hash("testpassword123")
    admin = User(
        username="testadmin",
        email="test@admin.com",
        hashed_password=hashed_pw,
        role="super_admin",
        client_id="test_client"
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin
