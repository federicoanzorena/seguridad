# seguridad

Módulo de seguridad de usuarios reutilizable, con autenticación JWT (access + refresh),
roles y permisos granulares, verificación de email y recuperación de contraseña.

Diseñado para no depender de ningún dominio de negocio específico: solo conoce
`Usuario`, `Rol`, `Permiso` y tokens. Se integra a cualquier proyecto FastAPI + SQLModel
(backend) y React + TypeScript (frontend) copiando las carpetas correspondientes.

## Estado del desarrollo

- [x] Modelos de datos (`backend/seguridad/modelos.py`)
- [x] Configuración vía variables de entorno (`backend/seguridad/config.py`)
- [x] Seguridad: hashing y JWT (`backend/seguridad/seguridad.py`)
- [x] Dependencias de FastAPI: `obtener_usuario_actual`, `requerir_permiso` (`dependencias.py`)
- [x] Lógica de negocio: registro, login, refresh, verificación, reset (`servicio.py`)
- [x] Endpoints (`router.py`)
- [x] Envío de emails (`email/`)
- [x] Datos iniciales: roles/permisos default (`seed.py`)
- [x] Frontend: `authSlice`, `useAuth`, `RutaProtegida`

## Estructura

```
seguridad/
├── main.py                              # punto de entrada (uvicorn main:app --reload)
├── requirements.txt
├── backend/seguridad/
│   ├── config.py                        # configuración vía variables de entorno
│   ├── modelos.py                       # Usuario, Rol, Permiso, tablas intermedias, tokens
│   ├── seguridad.py                     # hash de contraseñas, creación/verificación de JWT
│   ├── dependencias.py                  # obtener_db(), obtener_usuario_actual(), requerir_permiso()
│   ├── servicio.py                      # ServicioAutenticacion con la lógica de negocio
│   ├── router.py                        # endpoints FastAPI (7 rutas)
│   ├── seed.py                          # roles/permisos iniciales
│   └── email/
│       ├── base.py                      # interfaz EnviadorEmail
│       └── smtp.py                      # implementación SMTP + consola
└── frontend/seguridad/
    ├── api.ts                           # cliente HTTP con auto-refresh de tokens
    ├── store.ts                         # store de Redux
    ├── authSlice.ts                     # estado de autenticación
    ├── useAuth.ts                       # hook para componentes
    ├── RutaProtegida.tsx                # protección de rutas
    └── RequierePermiso.tsx              # verificación de permisos
```

## Cómo levantar el backend

```bash
# 1. Crear entorno virtual e instalar dependencias
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Levantar el server (crea tablas y种子 datos automáticamente)
uvicorn main:app --reload

# 3. Abrir Swagger
# http://localhost:8000/docs
```

## Cómo integrarlo a un proyecto nuevo

1. Copiar `backend/seguridad/` a la carpeta de módulos del backend
2. Copiar `frontend/seguridad/` a `src/`
3. Configurar variables de entorno con prefijo `SEGURIDAD_` (ver `config.py`)
4. Registrar el router: `app.include_router(router)`
5. El `lifespan` de `main.py` ya crea las tablas y ejecuta `seed.py` automáticamente

## Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/auth/registro` | Público | Registrar usuario nuevo |
| `POST` | `/auth/login` | Público | Login con email + password |
| `POST` | `/auth/refresh` | Público | Renovar access + refresh tokens |
| `GET` | `/auth/verificar-email` | Público | Verificar email con token |
| `POST` | `/auth/solicitar-recuperacion` | Público | Pedir token de recuperación |
| `POST` | `/auth/restablecer-password` | Público | Cambiar contraseña con token |
| `GET` | `/auth/perfil` | Protegido | Ver datos del usuario logueado |

## Variables de entorno

```env
# Seguridad
SEGURIDAD_SECRET_KEY=tu-clave-secreta-aqui
SEGURIDAD_DATABASE_URL=sqlite:///seguridad.db

# SMTP (opcional, para envío real de emails)
SEGURIDAD_SMTP_HOST=smtp.gmail.com
SEGURIDAD_SMTP_PORT=587
SEGURIDAD_SMTP_USUARIO=tu@gmail.com
SEGURIDAD_SMTP_PASSWORD=tu-password
SEGURIDAD_EMAIL_REMITENTE=no-responder@tudominio.com
```

## Decisiones de diseño

- **Roles y permisos granulares (N:M)**: un usuario puede tener varios roles, un rol
  agrupa varios permisos. Evita atar el proyecto a un esquema rígido de un-rol-por-usuario.
- **Permisos como `recurso:accion`** (ej. `productos:eliminar`): convención de texto libre,
  genérica para cualquier dominio.
- **Tokens hasheados en base**: tanto refresh tokens como tokens de verificación/reset se
  guardan hasheados, nunca en texto plano.
- **Refresh token persistido**: permite logout real (revocación) y detección de robo,
  no solo JWT stateless.
- **Configuración vía variables de entorno**: cada proyecto define su propio `SECRET_KEY`
  y duraciones de token sin tocar código del módulo (prefijo `SEGURIDAD_`).
- **Database-agnostic**: funciona con SQLite (desarrollo) y PostgreSQL (producción),
  configurable vía `SEGURIDAD_DATABASE_URL`.
