/**
 * Componente que protege rutas: si no hay usuario logueado, redirige al login.
 */

import { ReactNode, useEffect } from "react";
import { useAuth } from "./useAuth";
import { cargarTokens } from "./api";
import { useDispatch } from "react-redux";
import { cargarPerfil } from "./authSlice";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RutaProtegida({ children, fallback }: Props) {
  const { estaAutenticado, cargando } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    const tokens = cargarTokens();
    if (tokens && !estaAutenticado) {
      dispatch(cargarPerfil());
    }
  }, []);

  if (cargando) {
    return <div>Cargando...</div>;
  }

  if (!estaAutenticado) {
    return fallback ?? <div>No autenticado</div>;
  }

  return <>{children}</>;
}
