import { useAuth } from "../seguridad/useAuth";

export function PaginaPerfil() {
  const { usuario, logout } = useAuth();

  if (!usuario) return null;

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 border-t-[3px] border-t-primario p-8">
      <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium">{usuario.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Nombre</dt>
          <dd className="font-medium">{usuario.nombre_completo || "-"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Email verificado</dt>
          <dd>
            {usuario.email_verificado ? (
              <span className="text-exito font-medium">Sí</span>
            ) : (
              <span className="text-acento font-medium">No</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Roles</dt>
          <dd className="font-medium">
            {usuario.roles.length > 0 ? usuario.roles.join(", ") : "-"}
          </dd>
        </div>
      </dl>

      <button
        onClick={logout}
        className="mt-6 w-full bg-peligro text-white py-2.5 hover:opacity-90 cursor-pointer font-medium text-sm"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
