"""
Tests del flujo de roles y permisos via TestClient (HTTP real).
Cubre: crear rol → asignar permiso → listar → quitar permiso → listar usuarios.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool

from backend.seguridad.modelos import (
    Permiso,
    Rol,
    RolPermiso,
    Usuario,
    UsuarioRol,
)
from backend.seguridad.seed import sembrar_permisos, sembrar_roles
from backend.seguridad.seguridad import hashear_password
from backend.seguridad.dependencias import obtener_db
from main import app


@pytest.fixture(name="engine")
def engine_in_memory():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(eng)
    yield eng


@pytest.fixture(name="cliente")
def cliente_http(engine):
    def override_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[obtener_db] = override_db
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="headers_admin")
def headers_admin(engine) -> dict[str, str]:
    """Crea un admin en la DB in-memory, lo loguea y devuelve headers con Bearer token."""
    with Session(engine) as db:
        permisos = sembrar_permisos(db)
        sembrar_roles(db, permisos)

        admin = Usuario(
            email="admin@test.com",
            password_hash=hashear_password("Admin1234"),
            email_verificado=True,
        )
        db.add(admin)
        db.flush()

        rol_admin = db.exec(select(Rol).where(Rol.nombre == "admin")).first()
        if rol_admin:
            db.add(UsuarioRol(usuario_id=admin.id, rol_id=rol_admin.id))
        db.commit()

    def override_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[obtener_db] = override_db
    client = TestClient(app)

    resp = client.post("/auth/login", json={"email": "admin@test.com", "password": "Admin1234"})
    assert resp.status_code == 200, f"Login falló: {resp.json()}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_flujo_roles_y_permisos(cliente: TestClient, headers_admin: dict[str, str]):
    # 1. Crear un permiso nuevo
    resp = cliente.post(
        "/auth/permisos",
        json={"codigo": "test:leer", "descripcion": "Leer tests"},
        headers=headers_admin,
    )
    assert resp.status_code == 200
    permiso_id = resp.json()["id"]

    # 2. Crear un rol nuevo
    resp = cliente.post(
        "/auth/roles",
        json={"nombre": "tester", "descripcion": "Rol de prueba"},
        headers=headers_admin,
    )
    assert resp.status_code == 200
    rol_id = resp.json()["id"]
    assert resp.json()["nombre"] == "tester"

    # 3. Asignar el permiso al rol
    resp = cliente.post(
        f"/auth/roles/{rol_id}/permisos",
        json={"permiso_id": permiso_id},
        headers=headers_admin,
    )
    assert resp.status_code == 200

    # 4. Listar roles y confirmar que el permiso aparece
    resp = cliente.get("/auth/roles", headers=headers_admin)
    assert resp.status_code == 200
    roles = resp.json()
    rol_tester = next(r for r in roles if r["id"] == rol_id)
    assert permiso_id in rol_tester["permisos"]

    # 5. Quitar el permiso del rol
    resp = cliente.delete(
        f"/auth/roles/{rol_id}/permisos/{permiso_id}",
        headers=headers_admin,
    )
    assert resp.status_code == 200

    # 6. Listar roles y confirmar que el permiso ya no aparece
    resp = cliente.get("/auth/roles", headers=headers_admin)
    assert resp.status_code == 200
    rol_tester = next(r for r in resp.json() if r["id"] == rol_id)
    assert permiso_id not in rol_tester["permisos"]

    # 7. Listar usuarios y confirmar que no explota
    resp = cliente.get("/auth/usuarios", headers=headers_admin)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_asignar_rol_a_usuario(cliente: TestClient, headers_admin: dict[str, str], engine):
    with Session(engine) as db:
        usuario = Usuario(
            email="user@test.com",
            password_hash=hashear_password("User12345"),
            email_verificado=True,
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        usuario_id = str(usuario.id)

    # Crear un rol
    resp = cliente.post(
        "/auth/roles",
        json={"nombre": "observador", "descripcion": None},
        headers=headers_admin,
    )
    assert resp.status_code == 200
    rol_id = resp.json()["id"]

    # Asignar rol al usuario
    resp = cliente.post(
        f"/auth/usuarios/{usuario_id}/roles",
        json={"rol_id": rol_id},
        headers=headers_admin,
    )
    assert resp.status_code == 200

    # Listar usuarios y confirmar que tiene el rol
    resp = cliente.get("/auth/usuarios", headers=headers_admin)
    assert resp.status_code == 200
    u = next(u for u in resp.json() if u["id"] == usuario_id)
    assert any(r["id"] == rol_id for r in u["roles"])

    # Quitar el rol
    resp = cliente.delete(
        f"/auth/usuarios/{usuario_id}/roles/{rol_id}",
        headers=headers_admin,
    )
    assert resp.status_code == 200

    # Confirmar que ya no tiene el rol
    resp = cliente.get("/auth/usuarios", headers=headers_admin)
    u = next(u for u in resp.json() if u["id"] == usuario_id)
    assert not any(r["id"] == rol_id for r in u["roles"])


def test_crear_rol_respuesta_incluye_permisos(cliente: TestClient, headers_admin: dict[str, str]):
    """El POST de crear rol debe devolver permisos como [] y ser consistente con GET."""
    resp = cliente.post(
        "/auth/roles",
        json={"nombre": "QA", "descripcion": "Quality Assurance"},
        headers=headers_admin,
    )
    assert resp.status_code == 200
    rol_creado = resp.json()

    # El POST ya devuelve permisos: []
    assert rol_creado["permisos"] == []

    # Asignarle un permiso sin recargar la lista de roles
    permisos_resp = cliente.get("/auth/permisos", headers=headers_admin)
    permiso_id = permisos_resp.json()[0]["id"]

    cliente.post(
        f"/auth/roles/{rol_creado['id']}/permisos",
        json={"permiso_id": permiso_id},
        headers=headers_admin,
    )

    # GET debe mostrar el permiso recién asignado
    roles_resp = cliente.get("/auth/roles", headers=headers_admin)
    rol_qa = next(r for r in roles_resp.json() if r["id"] == rol_creado["id"])
    assert permiso_id in rol_qa["permisos"]
