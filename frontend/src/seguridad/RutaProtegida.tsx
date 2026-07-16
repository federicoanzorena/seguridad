/**
 * Módulo de seguridad de usuarios — Protección de rutas
 * Envuelve una ruta y redirige a /login si el usuario no está autenticado.
 * Requiere react-router-dom instalado en el proyecto que integra el módulo.
 */

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

interface Props {
  children: ReactNode;
  rutaLogin?: string;
}

export function RutaProtegida({ children, rutaLogin = "/login" }: Props) {
  const { estaAutenticado, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return null; // o un spinner, según el diseño del proyecto que integra el módulo
  }

  if (!estaAutenticado) {
    return <Navigate to={rutaLogin} state={{ desde: ubicacion }} replace />;
  }

  return <>{children}</>;
}
