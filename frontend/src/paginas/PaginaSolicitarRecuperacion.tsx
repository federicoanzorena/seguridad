import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as api from "../seguridad/api";

export function PaginaSolicitarRecuperacion() {
  const [email, setEmail] = useState("");
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await api.solicitarRecuperacion(email);
      setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al solicitar recuperación");
    } finally {
      setCargando(false);
    }
  }

  if (exito) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">&#x2709;</div>
        <h1 className="text-2xl font-bold mb-2">Email enviado</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Si existe una cuenta con <strong>{email}</strong>, recibiste un link para restablecer tu contraseña.
        </p>
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-2 text-center">Recuperar contraseña</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">
        Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
      </p>

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

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer font-medium"
        >
          {cargando ? "Enviando..." : "Enviar link de recuperación"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Volver al login
        </Link>
      </p>
    </div>
  );
}
