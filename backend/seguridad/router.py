"""
Módulo de seguridad de usuarios — Endpoints FastAPI
Registra el router con todas las rutas de autenticación.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from .dependencias import obtener_db, obtener_usuario_actual, obtener_enviador_email, requerir_permiso
from .email.base import EnviadorEmail
from .modelos import Usuario
from .servicio import ServicioAutenticacion
from .servicio_roles import ServicioRoles

router = APIRouter(prefix="/auth", tags=["autenticacion"])


# ---------------------------------------------------------------------------
# Schemas de request
# ---------------------------------------------------------------------------

class RegistroSolicitud(BaseModel):
    email: str
    password: str
    nombre: str | None = None


class LoginSolicitud(BaseModel):
    email: str
    password: str


class RefreshSolicitud(BaseModel):
    refresh_token: str


class RestablecerPasswordSolicitud(BaseModel):
    token: str
    nueva_password: str


class RolCrearSolicitud(BaseModel):
    nombre: str
    descripcion: str | None = None


class PermisoCrearSolicitud(BaseModel):
    codigo: str
    descripcion: str | None = None


class AsignacionSolicitud(BaseModel):
    rol_id: UUID


class PermisoAsignacionSolicitud(BaseModel):
    permiso_id: UUID


# ---------------------------------------------------------------------------
# Endpoints públicos
# ---------------------------------------------------------------------------

@router.post("/registro")
def registro(
    solicitud: RegistroSolicitud,
    db: Session = Depends(obtener_db),
    enviador: EnviadorEmail = Depends(obtener_enviador_email),
):
    return ServicioAutenticacion.registrar_usuario(
        db, solicitud.email, solicitud.password, enviador, solicitud.nombre
    )


@router.post("/login")
def login(
    solicitud: LoginSolicitud,
    db: Session = Depends(obtener_db),
):
    return ServicioAutenticacion.login(db, solicitud.email, solicitud.password)


@router.post("/refresh")
def refresh(
    solicitud: RefreshSolicitud,
    db: Session = Depends(obtener_db),
):
    return ServicioAutenticacion.refrescar_token(db, solicitud.refresh_token)


@router.get("/verificar-email")
def verificar_email(
    token: str = Query(..., description="Token de verificación enviado por email"),
    db: Session = Depends(obtener_db),
):
    return ServicioAutenticacion.verificar_email(db, token)


@router.post("/solicitar-recuperacion")
def solicitar_recuperacion(
    email: str = Query(..., description="Email del usuario"),
    db: Session = Depends(obtener_db),
    enviador: EnviadorEmail = Depends(obtener_enviador_email),
):
    return ServicioAutenticacion.solicitar_recuperacion(db, email, enviador)


@router.post("/restablecer-password")
def restablecer_password(
    solicitud: RestablecerPasswordSolicitud,
    db: Session = Depends(obtener_db),
):
    return ServicioAutenticacion.restablecer_password(
        db, solicitud.token, solicitud.nueva_password
    )


# ---------------------------------------------------------------------------
# Endpoints protegidos
# ---------------------------------------------------------------------------

@router.get("/perfil")
def perfil(usuario: Usuario = Depends(obtener_usuario_actual)):
    permisos = set()
    for rol in usuario.roles:
        for permiso in rol.permisos:
            permisos.add(permiso.codigo)

    return {
        "id": str(usuario.id),
        "email": usuario.email,
        "nombre_completo": usuario.nombre_completo,
        "email_verificado": usuario.email_verificado,
        "roles": [rol.nombre for rol in usuario.roles],
        "permisos": sorted(permisos),
    }


@router.post("/logout")
def logout(
    solicitud: RefreshSolicitud,
    db: Session = Depends(obtener_db),
):
    return ServicioAutenticacion.cerrar_sesion(db, solicitud.refresh_token)


# ---------------------------------------------------------------------------
# Endpoints de roles y permisos (requieren permiso roles:gestionar)
# ---------------------------------------------------------------------------

@router.get("/roles")
def listar_roles(
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    roles = ServicioRoles.listar_roles(db)
    return [
        {
            "id": str(rol.id),
            "nombre": rol.nombre,
            "descripcion": rol.descripcion,
            "permisos": [str(p.id) for p in rol.permisos],
        }
        for rol in roles
    ]


@router.post("/roles")
def crear_rol(
    solicitud: RolCrearSolicitud,
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    rol = ServicioRoles.crear_rol(db, solicitud.nombre, solicitud.descripcion)
    return {
        "id": str(rol.id),
        "nombre": rol.nombre,
        "descripcion": rol.descripcion,
        "permisos": [],
    }


@router.get("/permisos")
def listar_permisos(
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    return ServicioRoles.listar_permisos(db)


@router.post("/permisos")
def crear_permiso(
    solicitud: PermisoCrearSolicitud,
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    return ServicioRoles.crear_permiso(db, solicitud.codigo, solicitud.descripcion)


@router.post("/usuarios/{usuario_id}/roles")
def asignar_rol(
    usuario_id: UUID,
    solicitud: AsignacionSolicitud,
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    ServicioRoles.asignar_rol_a_usuario(db, usuario_id, solicitud.rol_id)
    return {"message": "Rol asignado correctamente"}


@router.delete("/usuarios/{usuario_id}/roles/{rol_id}")
def quitar_rol(
    usuario_id: UUID,
    rol_id: UUID,
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    ServicioRoles.quitar_rol_de_usuario(db, usuario_id, rol_id)
    return {"message": "Rol removido correctamente"}


@router.get("/usuarios")
def listar_usuarios(
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    usuarios = db.exec(select(Usuario)).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "nombre_completo": u.nombre_completo,
            "esta_activo": u.esta_activo,
            "email_verificado": u.email_verificado,
            "roles": [
                {"id": str(rol.id), "nombre": rol.nombre}
                for rol in u.roles
            ],
        }
        for u in usuarios
    ]


@router.post("/roles/{rol_id}/permisos")
def asignar_permiso_a_rol(
    rol_id: UUID,
    solicitud: PermisoAsignacionSolicitud,
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    ServicioRoles.asignar_permiso_a_rol(db, rol_id, solicitud.permiso_id)
    return {"message": "Permiso asignado al rol correctamente"}


@router.delete("/roles/{rol_id}/permisos/{permiso_id}")
def quitar_permiso_de_rol(
    rol_id: UUID,
    permiso_id: UUID,
    db: Session = Depends(obtener_db),
    _: Usuario = Depends(requerir_permiso("roles:gestionar")),
):
    ServicioRoles.quitar_permiso_de_rol(db, rol_id, permiso_id)
    return {"message": "Permiso removido del rol correctamente"}
