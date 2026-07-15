"""
Módulo de seguridad de usuarios — Lógica de negocio
Registro, login, refresh, verificación de email y recuperación de contraseña.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from .config import configuracion
from .modelos import TokenRefresco, TokenVerificacion, Usuario
from .seguridad import (
    crear_access_token,
    crear_refresh_token,
    crear_token_verificacion,
    decodificar_token,
    hashear_password,
    hashear_token,
    verificar_password,
    verificar_token,
)


# ---------------------------------------------------------------------------
# Modelos de respuesta
# ---------------------------------------------------------------------------

class TokensRespuesta(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RegistroRespuesta(BaseModel):
    usuario_id: str
    email: str
    mensaje: str


# ---------------------------------------------------------------------------
# Servicio de autenticación
# ---------------------------------------------------------------------------

class ServicioAutenticacion:

    @staticmethod
    def registrar_usuario(
        db: Session, email: str, password: str, nombre: str | None = None
    ) -> RegistroRespuesta:
        """Registra un usuario nuevo. Lanza 400 si el email ya existe o la contraseña es muy corta."""
        if len(password) < configuracion.longitud_minima_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La contraseña debe tener al menos {configuracion.longitud_minima_password} caracteres",
            )

        existente = db.exec(select(Usuario).where(Usuario.email == email)).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado",
            )

        usuario = Usuario(
            email=email,
            password_hash=hashear_password(password),
            nombre_completo=nombre,
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        token_plano = crear_token_verificacion(usuario.id, "verificacion_email")
        token_verif = TokenVerificacion(
            usuario_id=usuario.id,
            token_hash=hashear_token(token_plano),
            tipo="verificacion_email",
            expira_en=datetime.now(timezone.utc)
            + timedelta(hours=configuracion.horas_expiracion_token_verificacion),
        )
        db.add(token_verif)
        db.commit()

        return RegistroRespuesta(
            usuario_id=str(usuario.id),
            email=usuario.email,
            mensaje="Usuario registrado. Se envió un email de verificación.",
        )

    @staticmethod
    def login(db: Session, email: str, password: str) -> TokensRespuesta:
        """Login con email y password. Retorna access + refresh tokens."""
        usuario = db.exec(select(Usuario).where(Usuario.email == email)).first()
        if not usuario or not verificar_password(password, usuario.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not usuario.esta_activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario desactivado",
            )

        access = crear_access_token(usuario.id)
        refresh = crear_refresh_token(usuario.id)

        token_refresco = TokenRefresco(
            usuario_id=usuario.id,
            token_hash=hashear_token(refresh),
            expira_en=datetime.now(timezone.utc)
            + timedelta(days=configuracion.dias_expiracion_refresh_token),
        )
        db.add(token_refresco)

        usuario.ultimo_login = datetime.now(timezone.utc)
        db.add(usuario)
        db.commit()

        return TokensRespuesta(access_token=access, refresh_token=refresh)

    @staticmethod
    def refrescar_token(db: Session, token_refresh: str) -> TokensRespuesta:
        """Valida el refresh token, lo revoca (rotación) y retorna tokens nuevos."""
        try:
            payload = decodificar_token(token_refresh)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o vencido",
            )

        if payload.get("tipo") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="El token no es un refresh token",
            )

        usuario_id = UUID(payload.get("sub"))
        tokens = db.exec(
            select(TokenRefresco).where(
                TokenRefresco.usuario_id == usuario_id,
                TokenRefresco.revocado == False,
            )
        ).all()

        token_encontrado = None
        for t in tokens:
            if verificar_token(token_refresh, t.token_hash):
                token_encontrado = t
                break

        if not token_encontrado:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token no encontrado o ya revocado",
            )

        token_encontrado.revocado = True
        db.add(token_encontrado)
        db.commit()

        access = crear_access_token(usuario_id)
        refresh_nuevo = crear_refresh_token(usuario_id)

        nuevo_registro = TokenRefresco(
            usuario_id=usuario_id,
            token_hash=hashear_token(refresh_nuevo),
            expira_en=datetime.now(timezone.utc)
            + timedelta(days=configuracion.dias_expiracion_refresh_token),
        )
        db.add(nuevo_registro)
        db.commit()

        return TokensRespuesta(access_token=access, refresh_token=refresh_nuevo)

    @staticmethod
    def verificar_email(db: Session, token: str) -> dict:
        """Verifica el email del usuario usando el token de verificación."""
        try:
            payload = decodificar_token(token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de verificación inválido o vencido",
            )

        if payload.get("tipo") != "verificacion_email":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de token inválido",
            )

        usuario_id = UUID(payload.get("sub"))
        token_verif = db.exec(
            select(TokenVerificacion).where(
                TokenVerificacion.usuario_id == usuario_id,
                TokenVerificacion.usado == False,
            )
        ).first()

        if not token_verif:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token ya utilizado o no encontrado",
            )

        if token_verif.esta_vencido:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token expirado",
            )

        token_verif.usado = True
        db.add(token_verif)

        usuario = db.get(Usuario, usuario_id)
        usuario.email_verificado = True
        db.add(usuario)
        db.commit()

        return {"message": "Email verificado correctamente"}

    @staticmethod
    def solicitar_recuperacion(db: Session, email: str) -> dict:
        """Envía un token de recuperación si el email existe. Siempre retorna mensaje genérico."""
        usuario = db.exec(select(Usuario).where(Usuario.email == email)).first()
        if not usuario:
            return {"message": "Si el email existe, se envió un enlace de recuperación"}

        token_plano = crear_token_verificacion(usuario.id, "recuperar_password")
        token_rec = TokenVerificacion(
            usuario_id=usuario.id,
            token_hash=hashear_token(token_plano),
            tipo="recuperar_password",
            expira_en=datetime.now(timezone.utc)
            + timedelta(hours=configuracion.horas_expiracion_token_verificacion),
        )
        db.add(token_rec)
        db.commit()

        return {
            "message": "Si el email existe, se envió un enlace de recuperación",
        }

    @staticmethod
    def restablecer_password(db: Session, token: str, nueva_password: str) -> dict:
        """Restablece la contraseña usando el token de recuperación."""
        if len(nueva_password) < configuracion.longitud_minima_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La contraseña debe tener al menos {configuracion.longitud_minima_password} caracteres",
            )

        try:
            payload = decodificar_token(token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token de recuperación inválido o vencido",
            )

        if payload.get("tipo") != "recuperar_password":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de token inválido",
            )

        usuario_id = UUID(payload.get("sub"))
        token_rec = db.exec(
            select(TokenVerificacion).where(
                TokenVerificacion.usuario_id == usuario_id,
                TokenVerificacion.usado == False,
            )
        ).first()

        if not token_rec:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token ya utilizado o no encontrado",
            )

        if token_rec.esta_vencido:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token expirado",
            )

        token_rec.usado = True
        db.add(token_rec)

        usuario = db.get(Usuario, usuario_id)
        usuario.password_hash = hashear_password(nueva_password)
        db.add(usuario)
        db.commit()

        return {"message": "Contraseña restablecida correctamente"}

    @staticmethod
    def cerrar_sesion(db: Session, token_refresh: str) -> dict:
        """Revoca un refresh token específico (logout real)."""
        token_hash = hashear_token(token_refresh)
        token_encontrado = db.exec(
            select(TokenRefresco).where(
                TokenRefresco.token_hash == token_hash,
                TokenRefresco.revocado == False,
            )
        ).first()

        if token_encontrado:
            token_encontrado.revocado = True
            db.add(token_encontrado)
            db.commit()

        return {"message": "Sesión cerrada correctamente"}
