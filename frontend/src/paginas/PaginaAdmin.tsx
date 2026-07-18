import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useAuth } from "../seguridad/useAuth";
import * as api from "../seguridad/api";

const NUEVO = "__nuevo__";

export function PaginaAdmin() {
  const { tienePermiso } = useAuth();

  if (!tienePermiso("roles:gestionar")) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">&#x1F512;</div>
        <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
        <p className="text-gray-600 dark:text-gray-300">
          No tenés permiso para acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Administración</h1>
      <GuiaAdmin />
      <SeccionRoles />
      <SeccionUsuarios />
    </div>
  );
}

function GuiaAdmin() {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer bg-transparent border-none"
      >
        <span>&#x2139;&#xFE0F; Cómo usar el panel de administración</span>
        <span className={`transition-transform ${abierto ? "rotate-180" : ""}`}>&#x25BC;</span>
      </button>

      {abierto && (
        <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-300 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          <div>
            <p className="font-medium mb-1">Roles y permisos</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-500 dark:text-gray-400">
              <li>Elegí un rol del desplegable para ver sus permisos actuales.</li>
              <li>Tildá o destildá un checkbox para asignar o quitar un permiso al instante.</li>
              <li>Para crear un rol nuevo, seleccioná "+ Crear nuevo rol..." y completá los campos.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Usuarios</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-500 dark:text-gray-400">
              <li>Junto a cada usuario verás sus roles actuales como badges.</li>
              <li>Hacé click en la <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded text-xs">&times;</code> de un badge para quitarle ese rol.</li>
              <li>Usá el desplegable "+ Asignar rol..." para darle un rol nuevo.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roles + Permisos
// ---------------------------------------------------------------------------

function SeccionRoles() {
  const [roles, setRoles] = useState<api.Rol[]>([]);
  const [permisos, setPermisos] = useState<api.Permiso[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<string>("");
  const [permisosDelRol, setPermisosDelRol] = useState<Set<string>>(new Set());
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    const [r, p] = await Promise.all([api.listarRoles(), api.listarPermisos()]);
    setRoles(r);
    setPermisos(p);
  }, []);

  useEffect(() => {
    cargarDatos().finally(() => setCargando(false));
  }, [cargarDatos]);

  useEffect(() => {
    if (!rolSeleccionado || rolSeleccionado === NUEVO) {
      setPermisosDelRol(new Set());
      return;
    }
    const rol = roles.find((r) => r.id === rolSeleccionado);
    setPermisosDelRol(new Set(rol?.permisos ?? []));
  }, [rolSeleccionado, roles]);

  function seleccionCambiada(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setRolSeleccionado(id);
    setNuevoNombre("");
    setNuevaDescripcion("");
  }

  async function togglePermiso(permisoId: string) {
    if (!rolSeleccionado || rolSeleccionado === NUEVO) return;
    const tenia = permisosDelRol.has(permisoId);
    try {
      if (tenia) {
        await api.quitarPermisoDeRol(rolSeleccionado, permisoId);
        setPermisosDelRol((prev) => {
          const next = new Set(prev);
          next.delete(permisoId);
          return next;
        });
        setRoles((prev) =>
          prev.map((r) =>
            r.id === rolSeleccionado
              ? { ...r, permisos: r.permisos.filter((p) => p !== permisoId) }
              : r,
          ),
        );
      } else {
        await api.asignarPermisoARol(rolSeleccionado, permisoId);
        setPermisosDelRol((prev) => new Set(prev).add(permisoId));
        setRoles((prev) =>
          prev.map((r) =>
            r.id === rolSeleccionado
              ? { ...r, permisos: [...r.permisos, permisoId] }
              : r,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al modificar permiso");
    }
  }

  async function crearRol(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const rol = await api.crearRol(nuevoNombre, nuevaDescripcion || undefined);
      setRoles([...roles, rol]);
      setRolSeleccionado(rol.id);
      setNuevoNombre("");
      setNuevaDescripcion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear rol");
    }
  }

  const esNuevo = rolSeleccionado === NUEVO;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Roles y permisos</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          <select
            value={rolSeleccionado}
            onChange={seleccionCambiada}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4"
          >
            <option value={NUEVO}>+ Crear nuevo rol...</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}{rol.descripcion ? ` — ${rol.descripcion}` : ""}
              </option>
            ))}
          </select>

          {esNuevo ? (
            <form onSubmit={crearRol} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Nombre del rol"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer text-sm font-medium whitespace-nowrap"
              >
                Crear
              </button>
            </form>
          ) : (
            <div>
              <p className="text-sm font-medium mb-2">Permisos de este rol:</p>
              {permisos.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay permisos creados.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permisos.map((permiso) => (
                    <label
                      key={permiso.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={permisosDelRol.has(permiso.id)}
                        onChange={() => togglePermiso(permiso.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>
                        <code className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-xs">
                          {permiso.codigo}
                        </code>
                        {permiso.descripcion && (
                          <span className="text-gray-400 ml-1.5">{permiso.descripcion}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

function SeccionUsuarios() {
  const [usuarios, setUsuarios] = useState<api.UsuarioAdmin[]>([]);
  const [roles, setRoles] = useState<api.Rol[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([api.listarUsuarios(), api.listarRoles()])
      .then(([u, r]) => { setUsuarios(u); setRoles(r); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  async function asignar(usuarioId: string, rolId: string) {
    setError(null);
    try {
      await api.asignarRol(usuarioId, rolId);
      setUsuarios((prev) =>
        prev.map((u) => {
          if (u.id !== usuarioId) return u;
          if (u.roles.some((r) => r.id === rolId)) return u;
          const rol = roles.find((r) => r.id === rolId);
          return { ...u, roles: [...u.roles, { id: rolId, nombre: rol?.nombre ?? "?" }] };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar rol");
    }
  }

  async function quitar(usuarioId: string, rolId: string) {
    setError(null);
    try {
      await api.quitarRol(usuarioId, rolId);
      setUsuarios((prev) =>
        prev.map((u) => {
          if (u.id !== usuarioId) return u;
          return { ...u, roles: u.roles.filter((r) => r.id !== rolId) };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al quitar rol");
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Usuarios</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {cargando ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : usuarios.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay usuarios.</p>
      ) : (
        <div className="space-y-3">
          {usuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-sm">{usuario.email}</span>
                  {usuario.nombre_completo && (
                    <span className="text-gray-400 text-sm ml-2">({usuario.nombre_completo})</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {usuario.roles.map((rol) => (
                    <span
                      key={rol.id}
                      className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full"
                    >
                      {rol.nombre}
                      <button
                        onClick={() => quitar(usuario.id, rol.id)}
                        className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-100 cursor-pointer bg-transparent border-none text-xs leading-none"
                        title={`Quitar rol ${rol.nombre}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) asignar(usuario.id, e.target.value);
                  e.target.value = "";
                }}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">+ Asignar rol...</option>
                {roles
                  .filter((rol) => !usuario.roles.some((ur) => ur.id === rol.id))
                  .map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
