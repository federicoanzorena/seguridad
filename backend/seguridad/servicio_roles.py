"""
Módulo de seguridad de usuarios — Gestión de roles y permisos
Lógica de negocio para crear/asignar roles y permisos.
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from .modelos import Permiso, Rol, RolPermiso, Usuario, UsuarioRol


def contar_admins_activos(db: Session) -> int:
    """Cuenta usuarios activos que tienen el rol 'admin'."""
    rol_admin = db.exec(select(Rol).where(Rol.nombre == "admin")).first()
    if not rol_admin:
        return 0
    return sum(1 for u in rol_admin.usuarios if u.esta_activo)


class ServicioRoles:

    @staticmethod
    def listar_roles(db: Session) -> list[Rol]:
        return db.exec(select(Rol)).all()

    @staticmethod
    def listar_permisos(db: Session) -> list[Permiso]:
        return db.exec(select(Permiso)).all()

    @staticmethod
    def crear_rol(db: Session, nombre: str, descripcion: str | None) -> Rol:
        existente = db.exec(select(Rol).where(Rol.nombre == nombre)).first()
        if existente:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un rol con ese nombre")
        rol = Rol(nombre=nombre, descripcion=descripcion)
        db.add(rol)
        db.commit()
        db.refresh(rol)
        return rol

    @staticmethod
    def crear_permiso(db: Session, codigo: str, descripcion: str | None) -> Permiso:
        existente = db.exec(select(Permiso).where(Permiso.codigo == codigo)).first()
        if existente:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe un permiso con ese código")
        permiso = Permiso(codigo=codigo, descripcion=descripcion)
        db.add(permiso)
        db.commit()
        db.refresh(permiso)
        return permiso

    @staticmethod
    def asignar_permiso_a_rol(db: Session, rol_id: UUID, permiso_id: UUID) -> None:
        rol = db.get(Rol, rol_id)
        permiso = db.get(Permiso, permiso_id)
        if not rol or not permiso:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Rol o permiso no encontrado")

        ya_asignado = db.exec(
            select(RolPermiso).where(
                RolPermiso.rol_id == rol_id, RolPermiso.permiso_id == permiso_id
            )
        ).first()
        if not ya_asignado:
            db.add(RolPermiso(rol_id=rol_id, permiso_id=permiso_id))
            db.commit()

    @staticmethod
    def asignar_rol_a_usuario(db: Session, usuario_id: UUID, rol_id: UUID) -> None:
        usuario = db.get(Usuario, usuario_id)
        rol = db.get(Rol, rol_id)
        if not usuario or not rol:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario o rol no encontrado")

        ya_asignado = db.exec(
            select(UsuarioRol).where(
                UsuarioRol.usuario_id == usuario_id, UsuarioRol.rol_id == rol_id
            )
        ).first()
        if not ya_asignado:
            db.add(UsuarioRol(usuario_id=usuario_id, rol_id=rol_id))
            db.commit()

    @staticmethod
    def quitar_rol_de_usuario(db: Session, usuario_id: UUID, rol_id: UUID) -> None:
        rol = db.get(Rol, rol_id)
        if rol and rol.nombre == "admin" and contar_admins_activos(db) <= 1:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "No se puede quitar el rol admin: es el único administrador activo",
            )

        vinculo = db.exec(
            select(UsuarioRol).where(
                UsuarioRol.usuario_id == usuario_id, UsuarioRol.rol_id == rol_id
            )
        ).first()
        if vinculo:
            db.delete(vinculo)
            db.commit()
