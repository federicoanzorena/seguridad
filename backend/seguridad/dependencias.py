"""
Módulo de seguridad de usuarios — Dependencias de FastAPI
obtener_db(), obtener_usuario_actual() y requerir_permiso().
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlmodel import Session, create_engine

from .config import configuracion
from .email.base import EnviadorEmail
from .email.smtp import EnviadorEmailConsola, EnviadorEmailSMTP
from .modelos import Usuario
from .seguridad import decodificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

engine = create_engine(configuracion.database_url)


def obtener_db():
    """Generador de sesión de base de datos. Se usa como Depends(obtener_db)."""
    with Session(engine) as session:
        yield session


def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(obtener_db),
) -> Usuario:
    """Extrae el usuario del JWT. Si es inválido o no existe → 401."""
    credenciales_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decodificar_token(token)
        usuario_id: str = payload.get("sub")
        if usuario_id is None:
            raise credenciales_exception
    except JWTError:
        raise credenciales_exception

    usuario = db.get(Usuario, UUID(usuario_id))
    if usuario is None:
        raise credenciales_exception
    if not usuario.esta_activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado",
        )
    return usuario


def requerir_permiso(codigo: str):
    """Devuelve una dependencia que verifica si el usuario tiene un permiso.
    Uso: usuario = Depends(requerir_permiso("productos:eliminar"))
    """
    def _verificar(usuario: Usuario = Depends(obtener_usuario_actual)) -> Usuario:
        permisos_usuario = set()
        for rol in usuario.roles:
            for permiso in rol.permisos:
                permisos_usuario.add(permiso.codigo)
        if codigo not in permisos_usuario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permiso requerido: {codigo}",
            )
        return usuario
    return _verificar


def obtener_enviador_email() -> EnviadorEmail:
    """Usa SMTP si hay credenciales configuradas, sino imprime en consola (desarrollo)."""
    if configuracion.smtp_usuario and configuracion.smtp_password:
        return EnviadorEmailSMTP()
    return EnviadorEmailConsola()
