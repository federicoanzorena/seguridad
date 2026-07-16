# seguridad

Módulo de seguridad de usuarios reutilizable, con autenticación JWT (access + refresh),
roles y permisos granulares, verificación de email y recuperación de contraseña.

Diseñado para no depender de ningún dominio de negocio específico: solo conoce
`Usuario`, `Rol`, `Permiso` y tokens. Se integra a cualquier proyecto FastAPI + SQLModel
(backend) y React + TypeScript (frontend) copiando las carpetas correspondientes.

## Estado del desarrollo

- [x] Modelos de datos (`modelos.py`)
- [x] Configuración vía variables de entorno (`config.py`)
- [x] Seguridad: hashing bcrypt + JWT (`seguridad.py`)
- [x] Dependencias FastAPI: `obtener_db`, `obtener_usuario_actual`, `requerir_permiso` (`dependencias.py`)
- [x] Lógica de negocio: registro, login, refresh, verificación, reset, logout (`servicio.py`)
- [x] Gestión de roles y permisos (`servicio_roles.py`)
- [x] Endpoints (`router.py` — 14 rutas)
- [x] Envío de emails (`email/`)
- [x] Datos iniciales: roles/permisos default (`seed.py`)
- [x] Crear primer admin por consola (`crear_admin.py`)
- [x] CORS configurado (`main.py`)
- [x] Frontend: `api.ts`, `authSlice`, `useAuth`, `RutaProtegida`, `RequierePermiso`

## Estructura

```
seguridad/
├── main.py                              # punto de entrada (uvicorn main:app --reload)
├── requirements.txt
├── backend/seguridad/
│   ├── config.py                        # configuración vía variables de entorno
│   ├── modelos.py                       # Usuario, Rol, Permiso, tablas intermedias, tokens
│   ├── seguridad.py                     # hashing bcrypt + creación/verificación de JWT
│   ├── dependencias.py                  # obtener_db(), obtener_usuario_actual(), requerir_permiso(), obtener_enviador_email()
│   ├── servicio.py                      # ServicioAutenticacion: registro, login, refresh, verificación, reset, logout
│   ├── servicio_roles.py                # ServicioRoles: crear/asignar roles y permisos
│   ├── router.py                        # endpoints FastAPI (14 rutas)
│   ├── seed.py                          # roles/permisos iniciales
│   ├── crear_admin.py                   # comando para crear el primer admin
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

# 2. Levantar el server (crea tablas y datos automáticamente)
uvicorn main:app --reload

# 3. Abrir Swagger
# http://localhost:8000/docs
```

## Crear el primer admin

```bash
# Después de levantar el server una vez (para crear tablas y seed):
python -m backend.seguridad.crear_admin admin@ejemplo.com contraseñaSegura123
```

## Cómo integrarlo a un proyecto nuevo

1. Copiar `backend/seguridad/` a la carpeta de módulos del backend
2. Copiar `frontend/seguridad/` a `src/`
3. Configurar variables de entorno con prefijo `SEGURIDAD_` (ver `config.py`)
4. Registrar el router: `app.include_router(router)`
5. El `lifespan` de `main.py` ya crea las tablas y ejecuta `seed.py` automáticamente
6. Correr `crear_admin.py` para crear el primer administrador

## Endpoints

### Autenticación

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/auth/registro` | Público | Registrar usuario nuevo (envía email de verificación) |
| `POST` | `/auth/login` | Público | Login con email + password → access + refresh tokens |
| `POST` | `/auth/refresh` | Público | Renovar access + refresh tokens (rotación) |
| `POST` | `/auth/logout` | Público | Revocar refresh token (logout real) |
| `GET` | `/auth/verificar-email` | Público | Verificar email con token |
| `POST` | `/auth/solicitar-recuperacion` | Público | Enviar email de recuperación de contraseña |
| `POST` | `/auth/restablecer-password` | Público | Cambiar contraseña con token |
| `GET` | `/auth/perfil` | Protegido | Ver datos del usuario logueado |

### Gestión de roles y permisos (requiere `roles:gestionar`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/auth/roles` | Listar roles |
| `POST` | `/auth/roles` | Crear rol nuevo |
| `GET` | `/auth/permisos` | Listar permisos |
| `POST` | `/auth/permisos` | Crear permiso nuevo |
| `POST` | `/auth/usuarios/{id}/roles` | Asignar rol a usuario |
| `DELETE` | `/auth/usuarios/{id}/roles/{id}` | Quitar rol a usuario |

## Variables de entorno

```env
# Seguridad
SEGURIDAD_SECRET_KEY=tu-clave-secreta-aqui
SEGURIDAD_DATABASE_URL=sqlite:///seguridad.db
SEGURIDAD_FRONTEND_URL=http://localhost:5173

# SMTP (opcional, si no se configura usa consola en desarrollo)
SEGURIDAD_SMTP_HOST=smtp.gmail.com
SEGURIDAD_SMTP_PORT=587
SEGURIDAD_SMTP_USUARIO=tu@gmail.com
SEGURIDAD_SMTP_PASSWORD=tu-password
SEGURIDAD_EMAIL_REMITENTE=no-responder@tudominio.com
```

## Roles por defecto

| Rol | Permisos |
|-----|----------|
| `admin` | usuarios:ver, usuarios:crear, usuarios:editar, usuarios:eliminar, roles:gestionar |
| `editor` | usuarios:ver, usuarios:editar |
| `usuario` | usuarios:ver |

## Decisiones de diseño

- **Roles y permisos granulares (N:M)**: un usuario puede tener varios roles, un rol
  agrupa varios permisos. Evita atar el proyecto a un esquema rígido de un-rol-por-usuario.
- **Permisos como `recurso:accion`** (ej. `productos:eliminar`): convención de texto libre,
  genérica para cualquier dominio.
- **Protección del rol admin**: no se puede quitar el rol admin al último administrador activo.
- **Tokens hasheados con SHA-256**: refresh tokens y tokens de verificación se almacenan
  hasheados con SHA-256 (determinístico, sin truncado). Contraseñas con bcrypt.
- **Refresh token persistido**: permite logout real (revocación) y detección de robo,
  no solo JWT stateless.
- **Email automático**: al registrar o solicitar recuperación, se envía un email con el link.
  En desarrollo se imprime en consola; en producción con SMTP.
- **Configuración vía variables de entorno**: cada proyecto define su propio `SECRET_KEY`
  y duraciones de token sin tocar código del módulo (prefijo `SEGURIDAD_`).
- **Database-agnostic**: funciona con SQLite (desarrollo) y PostgreSQL (producción),
  configurable vía `SEGURIDAD_DATABASE_URL`.
- **CORS**: configurado para `localhost:5173` por defecto (ajustar en `main.py`).
