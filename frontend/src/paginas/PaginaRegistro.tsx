import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../seguridad/useAuth";

export function PaginaRegistro() {
  const { registrar, error, cargando } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [exito, setExito] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await registrar(email, password, nombre || undefined);
      setExito(true);
    } catch {
      // el error ya está en useAuth.error
    }
  }

  if (exito) {
    return (
      <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8 text-center">
        <div className="text-4xl mb-4">&#x2709;</div>
        <h1 className="text-2xl font-bold mb-2">Revisá tu email</h1>
        <p className="text-gray-600 mb-6">
          Te enviamos un link de verificación a <strong>{email}</strong>.
        </p>
        <Link
          to="/login"
          className="text-primario hover:underline"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Crear cuenta</h1>

      {error && (
        <div className="bg-peligro/10 text-peligro text-sm p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primario focus:border-primario text-sm"
            placeholder="Opcional"
          />
        </div>

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

        <div>
          <label className="block font-mono text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">
            Contraseña
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
          {cargando ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="text-primario hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
