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
    <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Iniciar sesión</h1>

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

        <div>
          <label className="block font-mono text-xs font-medium mb-1 uppercase tracking-wider text-gray-500">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primario focus:border-primario text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-primario text-white py-2.5 hover:opacity-90 disabled:opacity-50 cursor-pointer font-medium text-sm"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm space-y-2">
        <Link to="/solicitar-recuperacion" className="text-primario hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-gray-500">
          ¿No tenés cuenta?{" "}
          <Link to="/registro" className="text-primario hover:underline">
            Registrate
          </Link>
        </p>
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 p-4 text-xs text-gray-600">
        <p className="font-semibold mb-1 text-gray-700">Credenciales de prueba (admin):</p>
        <p>Email: <span className="font-mono">admin@admin.com</span></p>
        <p>Contraseña: <span className="font-mono">admin123</span></p>
      </div>
    </div>
  );
}
