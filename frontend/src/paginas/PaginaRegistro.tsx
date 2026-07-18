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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">&#x2709;</div>
        <h1 className="text-2xl font-bold mb-2">Revisá tu email</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Te enviamos un link de verificación a <strong>{email}</strong>.
        </p>
        <Link
          to="/login"
          className="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Crear cuenta</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={manejarSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Opcional"
          />
        </div>

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
          {cargando ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
