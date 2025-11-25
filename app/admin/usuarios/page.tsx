"use client";

import { Usuario } from "@/libs/interface";
import { listUsers, createUser, updateUser, deleteUser } from "@/libs/api";
import { Edit, Plus, Search, Shield, Trash2, User, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [showEditId, setShowEditId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "operador" });
  const [editForm, setEditForm] = useState<{ name: string; email: string; password?: string; role: string }>({ name: "", email: "", password: "", role: "operador" });
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    cargarUsuarios();
  }, [roleFilter, page]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const resp = await listUsers({ role: roleFilter || undefined, page, per_page: perPage });
      const data = (resp as any)?.data || [];
      const meta = (resp as any)?.meta || {};
      const mapped = (Array.isArray(data) ? data : []).map((u: any) => ({
        id_usuario: u.id ?? u.user_id ?? 0,
        username: u.username ?? u.email ?? "",
        nombre_completo: u.nombre_completo ?? u.name ?? "",
        rol: (u.rol ?? u.role ?? "").toUpperCase(),
        estado: u.estado ?? (u.active === false ? "INACTIVO" : "ACTIVO"),
        ultimo_acceso: u.ultimo_acceso ?? u.last_login ?? null,
      }));
      setUsuarios(mapped as any);
      setLastPage(meta.last_page ?? 1);
      setTotal(meta.total ?? mapped.length);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.role) return;
    setCreating(true);
    try {
      await createUser({ name: createForm.name, email: createForm.email, password: createForm.password, role: createForm.role });
      setMostrarModal(false);
      setCreateForm({ name: "", email: "", password: "", role: "operador" });
      await cargarUsuarios();
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: Usuario) => {
    setEditForm({ name: u.nombre_completo || "", email: u.email || u.username || "", password: "", role: (u.rol || "").toLowerCase() || "operador" });
    setShowEditId(u.id_usuario);
  };

  const onUpdate = async () => {
    if (!showEditId) return;
    setBusyId(showEditId);
    try {
      const payload: Partial<{ name: string; email: string; password: string; role: string }> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.password) payload.password = editForm.password;
      await updateUser(showEditId, payload);
      setShowEditId(null);
      await cargarUsuarios();
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    setBusyId(id);
    try {
      await deleteUser(id);
      await cargarUsuarios();
    } finally {
      setBusyId(null);
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (usuario) =>
      usuario.username.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="w-8 h-8" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid md:grid-cols-3 gap-3 items-center">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setPage(1);
                setRoleFilter(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos</option>
              <option value="admin">Admin</option>
              <option value="operador">Operador</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último Acceso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {usuario.nombre_completo}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{usuario.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.rol === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        usuario.estado === "ACTIVO"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {usuario.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.ultimo_acceso
                      ? new Date(usuario.ultimo_acceso).toLocaleDateString(
                          "es-CO"
                        )
                      : "Nunca"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => openEdit(usuario)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDelete(usuario.id_usuario)} disabled={busyId === usuario.id_usuario} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Página {page} de {lastPage} • Total: {total}</div>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
          <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-800">
                {usuarios.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-gray-800">
                {usuarios.filter((u) => u.rol === "ADMIN").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Operadores</p>
              <p className="text-2xl font-bold text-gray-800">
                {usuarios.filter((u) => u.rol === "OPERADOR").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Nuevo Usuario</h3>
              </div>
              <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Nombre</label>
                <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Correo</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Contraseña</label>
                <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Rol</label>
                <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded">
                  <option value="operador">Operador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setMostrarModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
              <button onClick={onCreate} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">Crear</button>
            </div>
          </div>
        </div>
      )}

      {showEditId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-blue-800">Editar Usuario</h3>
              </div>
              <button onClick={() => setShowEditId(null)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Nombre</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Correo</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Nueva Contraseña</label>
                <input type="password" value={editForm.password || ""} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Rol</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded">
                  <option value="operador">Operador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setShowEditId(null)} className="px-4 py-2 border rounded">Cancelar</button>
              <button onClick={onUpdate} disabled={busyId === showEditId} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-gray-400">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
