"""
Módulo de seguridad de usuarios — Datos iniciales
Crea roles y permisos por defecto. Ejecutar una vez después de crear las tablas.
Uso: python -m backend.seguridad.seed
"""

from sqlmodel import Session, select

from .dependencias import engine
from .modelos import Permiso, Rol, RolPermiso


# ---------------------------------------------------------------------------
# Definición de roles y permisos iniciales
# ---------------------------------------------------------------------------

PERMISOS_POR_DEFECTO = [
    ("usuarios:ver", "Ver listado de usuarios"),
    ("usuarios:crear", "Crear usuarios"),
    ("usuarios:editar", "Editar usuarios"),
    ("usuarios:eliminar", "Eliminar usuarios"),
    ("roles:gestionar", "Crear roles/permisos y asignarlos a usuarios"),
]

ROLES_POR_DEFECTO = {
    "admin": {
        "descripcion": "Administrador con acceso total",
        "permisos": [
            "usuarios:ver",
            "usuarios:crear",
            "usuarios:editar",
            "usuarios:eliminar",
            "roles:gestionar",
        ],
    },
    "editor": {
        "descripcion": "Editor con acceso parcial",
        "permisos": ["usuarios:ver", "usuarios:editar"],
    },
    "usuario": {
        "descripcion": "Usuario estándar",
        "permisos": ["usuarios:ver"],
    },
}


def sembrar_permisos(db: Session) -> dict[str, Permiso]:
    """Crea los permisos que no existan. Devuelve un dict {codigo: Permiso}."""
    permisos_existentes = {
        p.codigo: p for p in db.exec(select(Permiso)).all()
    }

    permisos = {}
    for codigo, descripcion in PERMISOS_POR_DEFECTO:
        if codigo in permisos_existentes:
            permisos[codigo] = permisos_existentes[codigo]
        else:
            permiso = Permiso(codigo=codigo, descripcion=descripcion)
            db.add(permiso)
            permisos[codigo] = permiso

    db.commit()
    return permisos


def sembrar_roles(db: Session, permisos: dict[str, Permiso]) -> None:
    """Crea los roles que no existen y les asigna sus permisos."""
    roles_existentes = {
        r.nombre: r for r in db.exec(select(Rol)).all()
    }

    for nombre, datos in ROLES_POR_DEFECTO.items():
        if nombre in roles_existentes:
            rol = roles_existentes[nombre]
        else:
            rol = Rol(nombre=nombre, descripcion=datos["descripcion"])
            db.add(rol)
            db.flush()

        permisos_existentes_del_rol = {
            rp.permiso_id
            for rp in db.exec(
                select(RolPermiso).where(RolPermiso.rol_id == rol.id)
            ).all()
        }

        for permiso_codigo in datos["permisos"]:
            permiso = permisos[permiso_codigo]
            if permiso.id not in permisos_existentes_del_rol:
                db.add(RolPermiso(rol_id=rol.id, permiso_id=permiso.id))

    db.commit()


def sembrar() -> None:
    """Función principal: crea roles y permisos iniciales."""
    with Session(engine) as db:
        permisos = sembrar_permisos(db)
        sembrar_roles(db, permisos)
        print("✓ Permisos y roles iniciales creados correctamente")


if __name__ == "__main__":
    sembrar()
