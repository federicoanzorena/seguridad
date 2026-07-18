import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../seguridad/useAuth";

export function PaginaLogin() {
  const { login, error, cargando } = useAuth();
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const destino = (ubicacion.state as { desde?: { pathname: string } })?.desde?.pathname ?? "/perfil";

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(destino, { replace: true });
    } catch {
      // el error ya está en useAuth.error
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer font-medium"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm space-y-2">
        <Link to="/solicitar-recuperacion" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-gray-500 dark:text-gray-400">
          ¿No tenés cuenta?{" "}
          <Link to="/registro" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
