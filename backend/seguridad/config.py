"""
Configuración del módulo de seguridad.
Todos los valores se leen de variables de entorno (o un archivo .env),
para que cada proyecto que integre el módulo defina los suyos sin tocar código.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class ConfiguracionSeguridad(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SEGURIDAD_", env_file=".env", extra="ignore")

    # Clave secreta para firmar los JWT. OBLIGATORIO definirla en producción.
    secret_key: str = "clave-de-desarrollo-cambiar-en-produccion"
    algoritmo_jwt: str = "HS256"

    # Duración de los tokens
    minutos_expiracion_access_token: int = 15
    dias_expiracion_refresh_token: int = 7
    horas_expiracion_token_verificacion: int = 24

    # Reglas de contraseña
    longitud_minima_password: int = 8


configuracion = ConfiguracionSeguridad()
