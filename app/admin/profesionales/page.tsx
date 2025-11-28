"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { listProfessionals, createProfessional, updateProfessional } from "@/libs/api";
import { Edit, Plus, Search, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ProfessionalItem = {
  id?: number;
  nombre?: string;
  especialidad: string;
  activo?: boolean;
};

export default function ProfesionalesPage() {
  const [items, setItems] = useState<ProfessionalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [activoFilter, setActivoFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showEditId, setShowEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ProfessionalItem>({ especialidad: "", activo: true });
  const [form, setForm] = useState<ProfessionalItem>({ nombre: "", especialidad: "", activo: true });

  useEffect(() => {
    cargar();
  }, [activoFilter, page]);

  const cargar = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (activoFilter) params.activo = activoFilter;
      params.page = page;
      const response = await listProfessionals(params);
      const data = (response?.data as any[]) || [];
      const meta = response?.meta || { current_page: 1, last_page: 1, per_page: data.length, total: data.length };
      setItems(data);
      setPage(Number(meta.current_page) || 1);
      setLastPage(Number(meta.last_page) || 1);
      setTotal(Number(meta.total) || data.length);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ especialidad: "", activo: true });
    setShowCreate(true);
  };

  const onCreate = async () => {
    if (!form.especialidad.trim()) return;
    setCreating(true);
    try {
      await createProfessional({ nombre: form.nombre, especialidad: form.especialidad, activo: !!form.activo });
      setShowCreate(false);
      await cargar();
    } finally {
      setCreating(false);
    }
  };

  const filtered = useMemo(() => {
    const q = busqueda.toLowerCase();
    return (items || []).filter((p) => (p.especialidad || "").toLowerCase().includes(q) || (p.nombre || "").toLowerCase().includes(q));
  }, [items, busqueda]);

  const toggleActivo = async (p: ProfessionalItem) => {
    if (!p.id) return;
    setBusyId(p.id);
    try {
      const next = p.activo ? "false" : "true";
      await updateProfessional(p.id, { activo: next });
      await cargar();
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (p: ProfessionalItem) => {
    setEditForm({ nombre: p.nombre, especialidad: p.especialidad, activo: !!p.activo });
    setShowEditId(p.id || null);
  };

  const onUpdate = async () => {
    if (!showEditId) return;
    setBusyId(showEditId);
    try {
      await updateProfessional(showEditId, {
        nombre: editForm.nombre,
        especialidad: editForm.especialidad,
        activo: editForm.activo ? "true" : "false",
      });
      setShowEditId(null);
      await cargar();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col bg-gray-100">
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-teal-800">Profesionales</h1>
              <p className="text-sm text-gray-600">Gestión de profesionales y especialidades</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activoFilter}
              onChange={(e) => setActivoFilter(e.target.value)}
              className="px-3 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus className="w-4 h-4" />
              Nuevo Profesional
            </button>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por especialidad"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-700 focus:border-transparent text-teal-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-6">Cargando...</div>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="bg-teal-50 text-teal-900">
                    <th className="text-left px-4 py-3 border-b">Nombre</th>
                    <th className="text-left px-4 py-3 border-b">Especialidad</th>
                    <th className="text-left px-4 py-3 border-b">Estado</th>
                    <th className="text-left px-4 py-3 border-b">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => (
                    <tr key={`${p.id ?? idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b text-gray-800">{p.nombre || ""}</td>
                      <td className="px-4 py-3 border-b text-gray-800">{p.especialidad}</td>
                      <td className="px-4 py-3 border-b">
                        <span className={`px-2 py-1 rounded text-sm ${p.activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={!p.id || busyId === p.id}
                            onClick={() => toggleActivo(p)}
                            className={`${p.activo ? "bg-teal-800 hover:bg-teal-900" : "bg-teal-600 hover:bg-teal-700"} text-white px-3 py-1 rounded disabled:opacity-50`}
                          >
                            {p.activo ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            disabled={!p.id}
                            onClick={() => openEdit(p)}
                            className="px-3 py-1 rounded disabled:opacity-50 flex items-center gap-1 bg-yellow-500 text-white hover:bg-yellow-600"
                          >
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-gray-500" colSpan={2}>Sin resultados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">Total: {total}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full hover:bg-teal-100 disabled:opacity-50">Anterior</button>
              <span className="text-sm">{page} / {lastPage}</span>
              <button disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))} className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full hover:bg-teal-100 disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-gray-800">Nuevo Profesional</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-sm text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={form.nombre || ""}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Especialidad</label>
                  <input
                    type="text"
                    value={form.especialidad}
                    onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>
              <div className="px-4 py-3 border-t flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={onCreate} disabled={creating} className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50">
                  {creating ? "Creando..." : "Crear"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-semibold text-black">Editar Profesional</h3>
                <button onClick={() => setShowEditId(null)} className="p-1 text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-sm text-black">Nombre</label>
                  <input
                    type="text"
                    value={editForm.nombre || ""}
                    onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded focus:ring-2 focus:ring-teal-700 text-black"
                  />
                </div>
                <div>
                  <label className="text-sm text-black">Especialidad</label>
                  <input
                    type="text"
                    value={editForm.especialidad}
                    onChange={(e) => setEditForm({ ...editForm, especialidad: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded focus:ring-2 focus:ring-teal-700 text-black"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-black">
                  <input
                    type="checkbox"
                    checked={!!editForm.activo}
                    onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>
              <div className="px-4 py-3 border-t flex justify-end gap-2">
                <button onClick={() => setShowEditId(null)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={onUpdate} disabled={busyId !== null} className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-50">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}