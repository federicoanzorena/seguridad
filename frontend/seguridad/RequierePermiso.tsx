/**
 * Componente que verifica si el usuario tiene un permiso específico.
 * Si no lo tiene, renderiza el fallback o nada.
 */

import { ReactNode } from "react";
import { useAuth } from "./useAuth";

interface Props {
  permiso: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequierePermiso({ permiso, children, fallback }: Props) {
  const { usuario } = useAuth();

  if (!usuario) {
    return fallback ?? null;
  }

  const tienePermiso = usuario.roles.some((rol) => {
    const permisosPorRol: Record<string, string[]> = {
      admin: [
        "usuarios:ver",
        "usuarios:crear",
        "usuarios:editar",
        "usuarios:eliminar",
      ],
      editor: ["usuarios:ver", "usuarios:editar"],
      usuario: ["usuarios:ver"],
    };
    return permisosPorRol[rol]?.includes(permiso);
  });

  if (!tienePermiso) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
