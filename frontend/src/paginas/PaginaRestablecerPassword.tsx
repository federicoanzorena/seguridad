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
      <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8 text-center">
        <div className="text-4xl mb-4">&#x274C;</div>
        <h1 className="text-2xl font-bold mb-2">Token no válido</h1>
        <p className="text-gray-600 mb-6">
          No se proporcionó un token de recuperación válido.
        </p>
        <Link to="/solicitar-recuperacion" className="text-primario hover:underline">
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
      <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8 text-center">
        <div className="text-4xl mb-4">&#x2705;</div>
        <h1 className="text-2xl font-bold mb-2">Contraseña actualizada</h1>
        <p className="text-gray-600 mb-6">
          Tu contraseña fue restablecida correctamente.
        </p>
        <Link to="/login" className="text-primario hover:underline">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Nueva contraseña</h1>

      {error && (
        <div className="bg-peligro/10 text-peligro text-sm p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">
            Nueva contraseña
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primario focus:border-primario text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-primario text-white py-2.5 hover:opacity-90 disabled:opacity-50 cursor-pointer font-medium text-sm"
        >
          {cargando ? "Guardando..." : "Restablecer contraseña"}
        </button>
      </form>
    </div>
  );
}
