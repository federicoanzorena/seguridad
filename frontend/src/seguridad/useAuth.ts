/**
 * Módulo de seguridad de usuarios — Hook de autenticación
 * Punto de entrada único para que los componentes interactúen con auth,
 * sin tocar Redux ni api.ts directamente.
 */

import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { EstadoRaiz, DespachoApp } from "./almacen";
import * as api from "./api";
import { errorEstablecido, cargandoCambiado } from "./autenticacionSlice";

export function useAuth() {
  const dispatch = useDispatch<DespachoApp>();
  const estado = useSelector((s: EstadoRaiz) => s.autenticacion);

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch(cargandoCambiado(true));
      try {
        await api.login(email, password);
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error al iniciar sesión";
        dispatch(errorEstablecido(mensaje));
        throw err;
      }
    },
    [dispatch]
  );

  const registrar = useCallback(
    async (email: string, password: string, nombre?: string) => {
      dispatch(cargandoCambiado(true));
      try {
        const resultado = await api.registrar(email, password, nombre);
        dispatch(cargandoCambiado(false));
        return resultado;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error al registrar";
        dispatch(errorEstablecido(mensaje));
        throw err;
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await api.cerrarSesion();
  }, []);

  const solicitarRecuperacion = useCallback(async (email: string) => {
    return api.solicitarRecuperacion(email);
  }, []);

  const restablecerPassword = useCallback(async (token: string, nuevaPassword: string) => {
    return api.restablecerPassword(token, nuevaPassword);
  }, []);

  const tienePermiso = useCallback(
    (permiso: string) => estado.usuario?.roles.includes(permiso) ?? false,
    [estado.usuario]
  );

  const tieneRol = useCallback(
    (rol: string) => estado.usuario?.roles.includes(rol) ?? false,
    [estado.usuario]
  );

  return {
    usuario: estado.usuario,
    estaAutenticado: estado.estaAutenticado,
    cargando: estado.cargando,
    error: estado.error,
    login,
    registrar,
    logout,
    solicitarRecuperacion,
    restablecerPassword,
    tieneRol,
    tienePermiso,
  };
}

/**
 * Hook para usar UNA sola vez, en el componente raíz de la app (ej. App.tsx),
 * para restaurar la sesión al recargar la página (el access token vive solo
 * en memoria, así que se pierde en cada refresh del navegador).
 *
 * Uso:
 *   function App() {
 *     useRestaurarSesion();
 *     ...
 *   }
 */

export function useRestaurarSesion() {
  const dispatch = useDispatch<DespachoApp>();

  useEffect(() => {
    api.intentarRestaurarSesion().finally(() => {
      dispatch(cargandoCambiado(false));
    });
  }, [dispatch]);
}
