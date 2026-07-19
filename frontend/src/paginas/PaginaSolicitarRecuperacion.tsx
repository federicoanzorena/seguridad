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
      <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8 text-center">
        <div className="text-4xl mb-4">&#x2709;</div>
        <h1 className="text-2xl font-bold mb-2">Email enviado</h1>
        <p className="text-gray-600 mb-6">
          Si existe una cuenta con <strong>{email}</strong>, recibiste un link para restablecer tu contraseña.
        </p>
        <Link to="/login" className="text-primario hover:underline">
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8">
      <h1 className="text-2xl font-bold mb-2 text-center">Recuperar contraseña</h1>
      <p className="text-gray-500 text-sm text-center mb-6">
        Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
      </p>

      {error && (
        <div className="bg-peligro/10 text-peligro text-sm p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primario focus:border-primario text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-primario text-white py-2.5 hover:opacity-90 disabled:opacity-50 cursor-pointer font-medium text-sm"
        >
          {cargando ? "Enviando..." : "Enviar link de recuperación"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link to="/login" className="text-primario hover:underline">
          Volver al login
        </Link>
      </p>
    </div>
  );
}
