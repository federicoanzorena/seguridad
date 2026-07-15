/**
 * Hook personalizado para usar la autenticación en componentes.
 * Envuelve las acciones de Redux y expone una API simple.
 */

import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "./store";
import {
  login as loginAction,
  logout as logoutAction,
  cargarPerfil,
  limpiarError,
  registrar as registrarAction,
} from "./authSlice";

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { usuario, cargando, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = useCallback(
    (email: string, password: string) => {
      return dispatch(loginAction({ email, password })).unwrap();
    },
    [dispatch]
  );

  const registrar = useCallback(
    (email: string, password: string, nombre?: string) => {
      return dispatch(registrarAction({ email, password, nombre })).unwrap();
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const refrescarPerfil = useCallback(() => {
    dispatch(cargarPerfil());
  }, [dispatch]);

  const borrarError = useCallback(() => {
    dispatch(limpiarError());
  }, [dispatch]);

  return {
    usuario,
    cargando,
    error,
    login,
    registrar,
    logout,
    refrescarPerfil,
    borrarError,
    estaAutenticado: !!usuario,
  };
}
