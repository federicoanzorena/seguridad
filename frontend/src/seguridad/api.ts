/**
 * Módulo de seguridad de usuarios — Cliente HTTP
 * Maneja todas las llamadas a la API de auth, incluyendo el refresco
 * automático del access token cuando vence (patrón interceptor).
 */

import { almacen } from "./almacen";
import {
  accessTokenActualizado,
  credencialesEstablecidas,
  sesionCerrada,
  type UsuarioAutenticado,
} from "./autenticacionSlice";

const BASE_URL = import.meta.env.VITE_SEGURIDAD_API_URL ?? "http://localhost:8000";
const CLAVE_REFRESH_TOKEN = "seguridad_refresh_token";

// ---------------------------------------------------------------------------
// Persistencia del refresh token (localStorage)
// ---------------------------------------------------------------------------

function guardarRefreshToken(token: string): void {
  localStorage.setItem(CLAVE_REFRESH_TOKEN, token);
}

function obtenerRefreshTokenGuardado(): string | null {
  return localStorage.getItem(CLAVE_REFRESH_TOKEN);
}

function eliminarRefreshToken(): void {
  localStorage.removeItem(CLAVE_REFRESH_TOKEN);
}

// ---------------------------------------------------------------------------
// Tipos de respuesta (mismo contrato que el backend)
// ---------------------------------------------------------------------------

interface TokensRespuesta {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ---------------------------------------------------------------------------
// Refresh con protección contra llamadas en paralelo
// ---------------------------------------------------------------------------

let promesaRefrescoEnCurso: Promise<string | null> | null = null;

async function refrescarAccessToken(): Promise<string | null> {
  // Si ya hay un refresh en curso, todos esperan el mismo resultado
  // en vez de disparar uno cada uno (evita invalidar tokens entre sí).
  if (promesaRefrescoEnCurso) {
    return promesaRefrescoEnCurso;
  }

  promesaRefrescoEnCurso = (async () => {
    const refreshToken = obtenerRefreshTokenGuardado();
    if (!refreshToken) return null;

    try {
      const respuesta = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!respuesta.ok) {
        eliminarRefreshToken();
        almacen.dispatch(sesionCerrada());
        return null;
      }

      const datos: TokensRespuesta = await respuesta.json();
      guardarRefreshToken(datos.refresh_token); // el backend rota el refresh token
      almacen.dispatch(accessTokenActualizado(datos.access_token));
      return datos.access_token;
    } catch {
      return null;
    }
  })();

  const resultado = await promesaRefrescoEnCurso;
  promesaRefrescoEnCurso = null;
  return resultado;
}

// ---------------------------------------------------------------------------
// Wrapper de fetch con Authorization automático + retry en 401
// ---------------------------------------------------------------------------

async function fetchConAuth(ruta: string, opciones: RequestInit = {}): Promise<Response> {
  const accessToken = almacen.getState().autenticacion.accessToken;

  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...opciones.headers,
    },
  });

  if (respuesta.status !== 401) {
    return respuesta;
  }

  // Access token vencido: intentar refrescar UNA vez y reintentar la request original
  const nuevoToken = await refrescarAccessToken();
  if (!nuevoToken) {
    return respuesta; // no se pudo refrescar, devolvemos el 401 original
  }

  return fetch(`${BASE_URL}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${nuevoToken}`,
      ...opciones.headers,
    },
  });
}

// ---------------------------------------------------------------------------
// Funciones públicas de la API
// ---------------------------------------------------------------------------

export async function registrar(email: string, password: string, nombre?: string) {
  const respuesta = await fetch(`${BASE_URL}/auth/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, nombre }),
  });
  if (!respuesta.ok) throw new Error((await respuesta.json()).detail ?? "Error al registrar");
  return respuesta.json();
}

export async function login(email: string, password: string): Promise<UsuarioAutenticado> {
  const respuesta = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!respuesta.ok) throw new Error((await respuesta.json()).detail ?? "Error al iniciar sesión");

  const tokens: TokensRespuesta = await respuesta.json();
  guardarRefreshToken(tokens.refresh_token);
  almacen.dispatch(accessTokenActualizado(tokens.access_token));

  const usuario = await obtenerPerfil();
  almacen.dispatch(credencialesEstablecidas({ usuario, accessToken: tokens.access_token }));
  return usuario;
}

export async function obtenerPerfil(): Promise<UsuarioAutenticado> {
  const respuesta = await fetchConAuth("/auth/perfil");
  if (!respuesta.ok) throw new Error("No se pudo obtener el perfil");
  return respuesta.json();
}

export async function cerrarSesion(): Promise<void> {
  const refreshToken = obtenerRefreshTokenGuardado();
  if (refreshToken) {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {}); // si falla la llamada, igual limpiamos el estado local
  }
  eliminarRefreshToken();
  almacen.dispatch(sesionCerrada());
}

export async function intentarRestaurarSesion(): Promise<UsuarioAutenticado | null> {
  const refreshToken = obtenerRefreshTokenGuardado();
  if (!refreshToken) return null;

  const nuevoToken = await refrescarAccessToken();
  if (!nuevoToken) return null;

  try {
    const usuario = await obtenerPerfil();
    almacen.dispatch(credencialesEstablecidas({ usuario, accessToken: nuevoToken }));
    return usuario;
  } catch {
    return null;
  }
}

export async function solicitarRecuperacion(email: string) {
  const respuesta = await fetch(`${BASE_URL}/auth/solicitar-recuperacion?email=${encodeURIComponent(email)}`, {
    method: "POST",
  });
  return respuesta.json();
}

export async function restablecerPassword(token: string, nuevaPassword: string) {
  const respuesta = await fetch(`${BASE_URL}/auth/restablecer-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, nueva_password: nuevaPassword }),
  });
  if (!respuesta.ok) throw new Error((await respuesta.json()).detail ?? "Error al restablecer contraseña");
  return respuesta.json();
}

export async function verificarEmail(token: string) {
  const respuesta = await fetch(`${BASE_URL}/auth/verificar-email?token=${encodeURIComponent(token)}`);
  if (!respuesta.ok) throw new Error((await respuesta.json()).detail ?? "Error al verificar email");
  return respuesta.json();
}

// ---------------------------------------------------------------------------
// Admin — Roles y permisos
// ---------------------------------------------------------------------------

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
  permisos: string[];
}

export interface Permiso {
  id: string;
  codigo: string;
  descripcion: string | null;
}

export async function listarRoles(): Promise<Rol[]> {
  const respuesta = await fetchConAuth("/auth/roles");
  if (!respuesta.ok) throw new Error("No se pudieron obtener los roles");
  return respuesta.json();
}

export async function crearRol(nombre: string, descripcion?: string): Promise<Rol> {
  const respuesta = await fetchConAuth("/auth/roles", {
    method: "POST",
    body: JSON.stringify({ nombre, descripcion }),
  });
  if (!respuesta.ok) throw new Error("No se pudo crear el rol");
  return respuesta.json();
}

export async function listarPermisos(): Promise<Permiso[]> {
  const respuesta = await fetchConAuth("/auth/permisos");
  if (!respuesta.ok) throw new Error("No se pudieron obtener los permisos");
  return respuesta.json();
}

export async function crearPermiso(codigo: string, descripcion?: string): Promise<Permiso> {
  const respuesta = await fetchConAuth("/auth/permisos", {
    method: "POST",
    body: JSON.stringify({ codigo, descripcion }),
  });
  if (!respuesta.ok) throw new Error("No se pudo crear el permiso");
  return respuesta.json();
}

export async function asignarRol(usuarioId: string, rolId: string): Promise<void> {
  const respuesta = await fetchConAuth(`/auth/usuarios/${usuarioId}/roles`, {
    method: "POST",
    body: JSON.stringify({ rol_id: rolId }),
  });
  if (!respuesta.ok) throw new Error("No se pudo asignar el rol");
}

export async function quitarRol(usuarioId: string, rolId: string): Promise<void> {
  const respuesta = await fetchConAuth(`/auth/usuarios/${usuarioId}/roles/${rolId}`, {
    method: "DELETE",
  });
  if (!respuesta.ok) throw new Error("No se pudo quitar el rol");
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  nombre_completo: string | null;
  esta_activo: boolean;
  email_verificado: boolean;
  roles: { id: string; nombre: string }[];
}

export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const respuesta = await fetchConAuth("/auth/usuarios");
  if (!respuesta.ok) throw new Error("No se pudieron obtener los usuarios");
  return respuesta.json();
}

export async function asignarPermisoARol(rolId: string, permisoId: string): Promise<void> {
  const respuesta = await fetchConAuth(`/auth/roles/${rolId}/permisos`, {
    method: "POST",
    body: JSON.stringify({ permiso_id: permisoId }),
  });
  if (!respuesta.ok) throw new Error("No se pudo asignar el permiso al rol");
}

export async function quitarPermisoDeRol(rolId: string, permisoId: string): Promise<void> {
  const respuesta = await fetchConAuth(`/auth/roles/${rolId}/permisos/${permisoId}`, {
    method: "DELETE",
  });
  if (!respuesta.ok) throw new Error("No se pudo quitar el permiso del rol");
}

export { fetchConAuth };
