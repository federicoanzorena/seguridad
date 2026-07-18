import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import * as api from "../seguridad/api";

export function PaginaVerificarEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [estado, setEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      setMensaje("No se proporcionó un token de verificación.");
      return;
    }

    api
      .verificarEmail(token)
      .then((res) => {
        setEstado("exito");
        setMensaje(res.message ?? "Email verificado correctamente.");
      })
      .catch((err) => {
        setEstado("error");
        setMensaje(err instanceof Error ? err.message : "Error al verificar el email.");
      });
  }, [token]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
      {estado === "cargando" && (
        <>
          <div className="text-4xl mb-4 animate-pulse">&#x23F3;</div>
          <p className="text-gray-600 dark:text-gray-300">Verificando tu email...</p>
        </>
      )}

      {estado === "exito" && (
        <>
          <div className="text-4xl mb-4">&#x2705;</div>
          <h1 className="text-2xl font-bold mb-2">Email verificado</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{mensaje}</p>
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Ir a iniciar sesión
          </Link>
        </>
      )}

      {estado === "error" && (
        <>
          <div className="text-4xl mb-4">&#x274C;</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{mensaje}</p>
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Ir a iniciar sesión
          </Link>
        </>
      )}
    </div>
  );
}
