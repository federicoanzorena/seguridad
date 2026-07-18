"""
Módulo de seguridad de usuarios — Modelos de datos
Diseñado para ser reutilizable en cualquier proyecto FastAPI + SQLModel.
No contiene referencias a ningún dominio de negocio específico.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Tablas intermedias (relaciones N:M)
# ---------------------------------------------------------------------------

class UsuarioRol(SQLModel, table=True):
    """Relación N:M entre Usuario y Rol. Un usuario puede tener varios roles."""
    __tablename__ = "usuario_rol"

    usuario_id: UUID = Field(foreign_key="usuario.id", primary_key=True)
    rol_id: UUID = Field(foreign_key="rol.id", primary_key=True)
    asignado_en: datetime = Field(default_factory=ahora_utc)


class RolPermiso(SQLModel, table=True):
    """Relación N:M entre Rol y Permiso. Un rol agrupa varios permisos."""
    __tablename__ = "rol_permiso"

    rol_id: UUID = Field(foreign_key="rol.id", primary_key=True)
    permiso_id: UUID = Field(foreign_key="permiso.id", primary_key=True)


# ---------------------------------------------------------------------------
# Entidades principales
# ---------------------------------------------------------------------------

class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    nombre_completo: Optional[str] = Field(default=None)

    esta_activo: bool = Field(default=True)
    email_verificado: bool = Field(default=False)

    creado_en: datetime = Field(default_factory=ahora_utc)
    actualizado_en: datetime = Field(default_factory=ahora_utc)
    ultimo_login: Optional[datetime] = Field(default=None)

    roles: list["Rol"] = Relationship(back_populates="usuarios", link_model=UsuarioRol)
    tokens_refresco: list["TokenRefresco"] = Relationship(back_populates="usuario")


class Rol(SQLModel, table=True):
    __tablename__ = "rol"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    nombre: str = Field(unique=True, index=True, nullable=False)  # ej: "admin", "editor"
    descripcion: Optional[str] = Field(default=None)

    usuarios: list[Usuario] = Relationship(back_populates="roles", link_model=UsuarioRol)
    permisos: list["Permiso"] = Relationship(back_populates="roles", link_model=RolPermiso)


class Permiso(SQLModel, table=True):
    __tablename__ = "permiso"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    codigo: str = Field(unique=True, index=True, nullable=False)  # ej: "productos:eliminar"
    descripcion: Optional[str] = Field(default=None)

    roles: list[Rol] = Relationship(back_populates="permisos", link_model=RolPermiso)


# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------

class TokenRefresco(SQLModel, table=True):
    """Refresh token persistido, para poder invalidarlo (logout, rotación)."""
    __tablename__ = "token_refresco"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    usuario_id: UUID = Field(foreign_key="usuario.id", nullable=False)
    token_hash: str = Field(nullable=False, index=True)

    creado_en: datetime = Field(default_factory=ahora_utc)
    expira_en: datetime = Field(nullable=False)
    revocado: bool = Field(default=False)

    usuario: Usuario = Relationship(back_populates="tokens_refresco")

    @property
    def esta_vencido(self) -> bool:
        expira = self.expira_en
        if expira.tzinfo is None:
            expira = expira.replace(tzinfo=timezone.utc)
        return ahora_utc() > expira


class TokenVerificacion(SQLModel, table=True):
    """Token de un solo uso para verificar email o resetear contraseña."""
    __tablename__ = "token_verificacion"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    usuario_id: UUID = Field(foreign_key="usuario.id", nullable=False)
    token_hash: str = Field(nullable=False, index=True)
    tipo: str = Field(nullable=False)  # "verificacion_email" | "recuperar_password"

    creado_en: datetime = Field(default_factory=ahora_utc)
    expira_en: datetime = Field(nullable=False)
    usado: bool = Field(default=False)

    @property
    def esta_vencido(self) -> bool:
        expira = self.expira_en
        if expira.tzinfo is None:
            expira = expira.replace(tzinfo=timezone.utc)
        return ahora_utc() > expira
