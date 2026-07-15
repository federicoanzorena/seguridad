# seguridad

Módulo de seguridad de usuarios reutilizable, con autenticación JWT (access + refresh),
roles y permisos granulares, verificación de email y recuperación de contraseña.

Diseñado para no depender de ningún dominio de negocio específico: solo conoce
`Usuario`, `Rol`, `Permiso` y tokens. Se integra a cualquier proyecto FastAPI + SQLModel
(backend) y React + TypeScript (frontend) copiando las carpetas correspondientes.

## Estado del desarrollo

- [x] Modelos de datos (`backend/seguridad/modelos.py`)
- [x] Configuración vía variables de entorno (`backend/seguridad/config.py`)
- [ ] Seguridad: hashing y JWT (`backend/seguridad/seguridad.py`)
- [ ] Dependencias de FastAPI: `obtener_usuario_actual`, `requerir_permiso` (`dependencias.py`)
- [ ] Lógica de negocio: registro, login, refresh, verificación, reset (`servicio.py`)
- [ ] Endpoints (`router.py`)
- [ ] Envío de emails (`email/`)
- [ ] Datos iniciales: roles/permisos default (`seed.py`)
- [ ] Frontend: `authSlice`, `useAuth`, `RutaProtegida`

## Estructura

backend/seguridad/
├── modelos.py # Usuario, Rol, Permiso, tablas intermedias, tokens
├── config.py # configuración vía variables de entorno
├── seguridad.py # hash de contraseñas, creación/verificación de JWT
├── dependencias.py # obtener_usuario_actual(), requerir_permiso()
├── servicio.py # ServicioAutenticacion con la lógica de negocio
├── router.py # endpoints FastAPI
├── seed.py # roles/permisos iniciales
└── email/
├── base.py # interfaz EnviadorEmail
└── smtp.py # implementación SMTP
frontend/seguridad/
├── api.ts
├── authSlice.ts
├── useAuth.ts
├── RutaProtegida.tsx
└── RequierePermiso.tsx

## Cómo integrarlo a un proyecto nuevo

1. Copiar `backend/seguridad/` a la carpeta de módulos del backend
2. Copiar `frontend/seguridad/` a `src/`
3. Configurar variables de entorno con prefijo `SEGURIDAD_` (ver `config.py`)
4. Correr las migraciones de las tablas del módulo
5. Registrar el router: `app.include_router(router_seguridad)`
6. Correr `seed.py` para crear los roles/permisos iniciales del proyecto

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
