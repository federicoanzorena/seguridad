/**
 * Módulo de seguridad de usuarios — Gate de UI por permiso o rol
 * Muestra sus children solo si el usuario tiene el permiso/rol indicado.
 * No redirige: es para ocultar botones, secciones, etc. dentro de una página
 * ya accesible (para bloquear rutas enteras, usar RutaProtegida).
 */

import type { ReactNode } from "react";
import { useAuth } from "./useAuth";

interface Props {
  children: ReactNode;
  permiso?: string;
  rol?: string;
  alternativa?: ReactNode;
}

export function RequierePermiso({ children, permiso, rol, alternativa = null }: Props) {
  const { tienePermiso, tieneRol } = useAuth();

  const tieneAcceso =
    (permiso ? tienePermiso(permiso) : true) && (rol ? tieneRol(rol) : true);

  if (!permiso && !rol) {
    console.warn("RequierePermiso: no se especificó ni 'permiso' ni 'rol'");
  }

  return tieneAcceso ? <>{children}</> : <>{alternativa}</>;
}
