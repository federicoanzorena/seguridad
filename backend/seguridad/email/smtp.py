"""
Módulo de seguridad de usuarios — Implementación SMTP
Envío de emails usando el servidor SMTP configurado en variables de entorno.
"""

import smtplib
from email.mime.text import MIMEText

from ..config import configuracion
from .base import EnviadorEmail


class EnviadorEmailSMTP(EnviadorEmail):
    """Envía emails reales por SMTP. Configurado con las variables
    SEGURIDAD_SMTP_HOST, SEGURIDAD_SMTP_PORT, etc.
    """

    def enviar(
        self,
        destinatario: str,
        asunto: str,
        cuerpo_html: str,
    ) -> None:
        msg = MIMEText(cuerpo_html, "html", "utf-8")
        msg["Subject"] = asunto
        msg["From"] = configuracion.email_remitente
        msg["To"] = destinatario

        with smtplib.SMTP(configuracion.smtp_host, configuracion.smtp_port) as server:
            if configuracion.smtp_usar_tls:
                server.starttls()
            if configuracion.smtp_usuario and configuracion.smtp_password:
                server.login(configuracion.smtp_usuario, configuracion.smtp_password)
            server.sendmail(
                configuracion.email_remitente,
                destinatario,
                msg.as_string(),
            )


class EnviadorEmailConsola(EnviadorEmail):
    """Imprime el email en consola en vez de enviarlo. Útil para desarrollo."""

    def enviar(
        self,
        destinatario: str,
        asunto: str,
        cuerpo_html: str,
    ) -> None:
        print(f"\n{'='*60}")
        print(f"Para: {destinatario}")
        print(f"Asunto: {asunto}")
        print(f"{'='*60}")
        print(cuerpo_html)
        print(f"{'='*60}\n")
