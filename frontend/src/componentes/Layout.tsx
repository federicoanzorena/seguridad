import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../seguridad/useAuth";
import { RequierePermiso } from "../seguridad/RequierePermiso";

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, estaAutenticado, cargando, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-fondo text-tinta">
      <header className="sticky top-0 z-50 border-t-[3px] border-t-primario border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to={estaAutenticado ? "/perfil" : "/login"}
            className="font-semibold text-lg text-primario no-underline"
          >
            Seguridad
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {cargando ? null : estaAutenticado ? (
              <>
                <RequierePermiso permiso="roles:gestionar">
                  <Link
                    to="/admin"
                    className="text-gray-600 hover:text-primario no-underline font-mono text-xs uppercase tracking-wider"
                  >
                    Admin
                  </Link>
                </RequierePermiso>

                <Link
                  to="/perfil"
                  className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 bg-fondo no-underline"
                >
                  <span className="text-xs font-mono text-tinta uppercase tracking-wider">
                    {usuario?.email}
                  </span>
                  {usuario?.roles && usuario.roles.length > 0 && (
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                      {usuario.roles.join(" / ")}
                    </span>
                  )}
                  <span className="w-2 h-2 rounded-full bg-exito shrink-0" />
                </Link>

                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-peligro cursor-pointer bg-transparent border-none font-mono text-xs uppercase tracking-wider"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primario no-underline"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="bg-primario text-white px-3 py-1.5 hover:opacity-90 no-underline text-sm"
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
