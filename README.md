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
