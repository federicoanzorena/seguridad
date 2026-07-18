import { useAuth } from "../seguridad/useAuth";

export function PaginaPerfil() {
  const { usuario, logout } = useAuth();

  if (!usuario) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Email</dt>
          <dd className="font-medium">{usuario.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Nombre</dt>
          <dd className="font-medium">{usuario.nombre_completo || "-"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Email verificado</dt>
          <dd>
            {usuario.email_verificado ? (
              <span className="text-green-600 dark:text-green-400 font-medium">Sí</span>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">No</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Roles</dt>
          <dd className="font-medium">
            {usuario.roles.length > 0 ? usuario.roles.join(", ") : "-"}
          </dd>
        </div>
      </dl>

      <button
        onClick={logout}
        className="mt-6 w-full bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 cursor-pointer font-medium"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
