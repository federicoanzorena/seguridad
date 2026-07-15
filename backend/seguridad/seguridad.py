"""
Módulo de seguridad de usuarios — Hashing y JWT
Funciones para hashing de contraseñas (bcrypt) y creación/verificación de JWT.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import configuracion

# ---------------------------------------------------------------------------
# Hashing de contraseñas
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hashear_password(password: str) -> str:
    """Convierte la contraseña a hash con bcrypt. Nunca se puede revertir."""
    return pwd_context.hash(password)


def verificar_password(password: str, password_hash: str) -> bool:
    """Compara una contraseña intento contra el hash guardado."""
    return pwd_context.verify(password, password_hash)


# ---------------------------------------------------------------------------
# JWT — creación
# ---------------------------------------------------------------------------

def crear_access_token(usuario_id: UUID) -> str:
    """Access token de corta vida (15 min por defecto)."""
    expiracion = datetime.now(timezone.utc) + timedelta(
        minutes=configuracion.minutos_expiracion_access_token
    )
    payload = {"sub": str(usuario_id), "exp": expiracion, "tipo": "access"}
    return jwt.encode(payload, configuracion.secret_key, algorithm=configuracion.algoritmo_jwt)


def crear_refresh_token(usuario_id: UUID) -> str:
    """Refresh token de larga vida (7 días por defecto)."""
    expiracion = datetime.now(timezone.utc) + timedelta(
        days=configuracion.dias_expiracion_refresh_token
    )
    payload = {"sub": str(usuario_id), "exp": expiracion, "tipo": "refresh"}
    return jwt.encode(payload, configuracion.secret_key, algorithm=configuracion.algoritmo_jwt)


def crear_token_verificacion(usuario_id: UUID, tipo: str) -> str:
    """Token para verificación de email o recuperación de contraseña.
    tipo: 'verificacion_email' o 'recuperar_password'
    """
    expiracion = datetime.now(timezone.utc) + timedelta(
        hours=configuracion.horas_expiracion_token_verificacion
    )
    payload = {"sub": str(usuario_id), "exp": expiracion, "tipo": tipo}
    return jwt.encode(payload, configuracion.secret_key, algorithm=configuracion.algoritmo_jwt)


# ---------------------------------------------------------------------------
# JWT — decodificación
# ---------------------------------------------------------------------------

def decodificar_token(token: str) -> dict:
    """Decodifica y valida un JWT. Lanza JWTError si está vencido o inválido."""
    return jwt.decode(token, configuracion.secret_key, algorithms=[configuracion.algoritmo_jwt])


# ---------------------------------------------------------------------------
# Hash de tokens para persistencia en BD
# ---------------------------------------------------------------------------

def hashear_token(token: str) -> str:
    """Hashea un token para guardarlo en BD (refresh tokens y tokens de
    verificación se almacenan hasheados, nunca en texto plano).
    """
    return pwd_context.hash(token)


def verificar_token(token: str, token_hash: str) -> bool:
    """Verifica un token contra su hash guardado en BD."""
    return pwd_context.verify(token, token_hash)
