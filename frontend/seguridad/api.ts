/**
 * Cliente HTTP para el módulo de seguridad.
 * Maneja automáticamente los tokens: agrega el access token a cada request
 * y renueva los tokens cuando el access expira.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

let tokens: Tokens | null = null;
let refreshPromise: Promise<Tokens> | null = null;

function guardarTokens(nuevos: Tokens) {
  tokens = nuevos;
  localStorage.setItem("tokens", JSON.stringify(nuevos));
}

export function cargarTokens() {
  const guardados = localStorage.getItem("tokens");
  if (guardados) {
    tokens = JSON.parse(guardados);
  }
  return tokens;
}

export function limpiarTokens() {
  tokens = null;
  localStorage.removeItem("tokens");
}

export function obtenerAccessToken(): string | null {
  return tokens?.access_token ?? null;
}

async function refrescarToken(): Promise<Tokens> {
  if (!tokens?.refresh_token) throw new Error("No hay refresh token");

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });

  if (!res.ok) {
    limpiarTokens();
    throw new Error("Refresh token inválido");
  }

  const nuevos: Tokens = await res.json();
  guardarTokens(nuevos);
  return nuevos;
}

export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.access_token) {
    headers["Authorization"] = `Bearer ${tokens.access_token}`;
  }

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && tokens?.refresh_token) {
    try {
      if (!refreshPromise) {
        refreshPromise = refrescarToken();
      }
      const nuevos = await refreshPromise;
      headers["Authorization"] = `Bearer ${nuevos.access_token}`;
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch {
      limpiarTokens();
    } finally {
      refreshPromise = null;
    }
  }

  return res;
}
