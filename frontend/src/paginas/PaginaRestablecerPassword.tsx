import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import * as api from "../seguridad/api";

export function PaginaRestablecerPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (!token) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">&#x274C;</div>
        <h1 className="text-2xl font-bold mb-2">Token no válido</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          No se proporcionó un token de recuperación válido.
        </p>
        <Link to="/solicitar-recuperacion" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Solicitar uno nuevo
        </Link>
      </div>
    );
  }

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await api.restablecerPassword(token!, password);
      setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer la contraseña");
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">&#x2705;</div>
        <h1 className="text-2xl font-bold mb-2">Contraseña actualizada</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Tu contraseña fue restablecida correctamente.
        </p>
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Nueva contraseña</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres</p>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer font-medium"
        >
          {cargando ? "Guardando..." : "Restablecer contraseña"}
        </button>
      </form>
    </div>
  );
}
