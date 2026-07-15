"""
Módulo de seguridad de usuarios — Interfaz de envío de emails
Clase abstracta que cada proyecto puede implementar a su medida.
"""

from abc import ABC, abstractmethod


class EnviadorEmail(ABC):
    """Interfaz para el envío de emails. El módulo de seguridad solo conoce
    esta interfaz — la implementación concreta (SMTP, SendGrid, etc.)
    la define el proyecto que integra el módulo.
    """

    @abstractmethod
    def enviar(
        self,
        destinatario: str,
        asunto: str,
        cuerpo_html: str,
    ) -> None:
        ...
