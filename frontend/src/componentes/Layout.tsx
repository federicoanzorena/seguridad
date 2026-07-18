import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../seguridad/useAuth";
import { RequierePermiso } from "../seguridad/RequierePermiso";

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, estaAutenticado, cargando, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to={estaAutenticado ? "/perfil" : "/login"}
            className="font-semibold text-lg text-indigo-600 dark:text-indigo-400 no-underline"
          >
            Seguridad
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {cargando ? null : estaAutenticado ? (
              <>
                <RequierePermiso permiso="roles:gestionar">
                  <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 no-underline">
                    Admin
                  </Link>
                </RequierePermiso>
                <Link to="/perfil" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 no-underline">
                  {usuario?.email}
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer bg-transparent border-none"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 no-underline">
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 no-underline text-sm"
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
