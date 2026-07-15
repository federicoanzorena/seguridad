"""
Comando de consola para crear el primer admin del sistema.
Nunca expuesto por HTTP — se corre una sola vez, manualmente.

Uso: python -m backend.seguridad.crear_admin admin@ejemplo.com contraseñaSegura123
"""

import sys

from sqlmodel import Session, select

from .dependencias import engine
from .modelos import Rol, Usuario, UsuarioRol
from .seguridad import hashear_password


def crear_admin(email: str, password: str) -> None:
    with Session(engine) as db:
        usuario = db.exec(select(Usuario).where(Usuario.email == email)).first()
        if not usuario:
            usuario = Usuario(
                email=email,
                password_hash=hashear_password(password),
                esta_activo=True,
                email_verificado=True,
            )
            db.add(usuario)
            db.commit()
            db.refresh(usuario)
            print(f"✓ Usuario {email} creado")
        else:
            print(f"✓ Usuario {email} ya existía, se le asigna admin")

        rol_admin = db.exec(select(Rol).where(Rol.nombre == "admin")).first()
        if not rol_admin:
            print("✗ Error: el rol 'admin' no existe. Corré primero seed.py")
            return

        ya_tiene = db.exec(
            select(UsuarioRol).where(
                UsuarioRol.usuario_id == usuario.id, UsuarioRol.rol_id == rol_admin.id
            )
        ).first()
        if not ya_tiene:
            db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol_admin.id))
            db.commit()
            print(f"✓ Rol 'admin' asignado a {email}")
        else:
            print(f"✓ {email} ya tenía el rol 'admin'")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python -m backend.seguridad.crear_admin <email> <password>")
        sys.exit(1)
    crear_admin(sys.argv[1], sys.argv[2])
