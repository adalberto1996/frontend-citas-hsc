"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import {
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
  bulkUploadPatients,
} from "@/libs/api";
import { Edit, Plus, Search, Upload, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PatientItem = {
  id: number;
  tipo_identificacion?: string;
  numero_identificacion: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  nombre_completo: string;
  eps?: string;
  sexo?: string;
  celularpal?: string;
  celularsec?: string;
  fecha_nacimiento?: string;
  direccion?: string;
  nombre_barrio?: string;
  departamento?: string;
  ciudad?: string;
  edad?: number;
  grupo_etario?: string;
  curso_de_vida?: string;
  regimen?: string;
  tipo_afiliado?: string;
  created_at?: string;
};

type PatientForm = {
  tipo_identificacion: string;
  numero_identificacion: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  eps?: string;
  sexo?: string;
  celularpal?: string;
  celularsec?: string;
};

export default function PacientesPage() {
  const [items, setItems] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(10);
  const [selectedExtraCols, setSelectedExtraCols] = useState<string[]>(["regimen", "tipo_afiliado"]);

  const [showCreate, setShowCreate] = useState(false);
  const [showEditId, setShowEditId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [form, setForm] = useState<PatientForm>({
    tipo_identificacion: "CC",
    numero_identificacion: "",
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    eps: "",
    sexo: "",
    celularpal: "",
    celularsec: "",
  });

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await listPatients({ page, per_page: perPage });
      const data = (resp as any)?.data || [];
      const meta = (resp as any)?.meta || {};
      const mapped = (Array.isArray(data) ? data : []).map((p: any) => {
        const nombre_completo =
          [
            p.primer_nombre,
            p.segundo_nombre,
            p.primer_apellido,
            p.segundo_apellido,
          ]
            .filter(Boolean)
            .join(" ") || p.nombre || p.paciente_nombre || "-";
        return {
          id: p.id ?? p.paciente_id ?? 0,
          tipo_identificacion: p.tipo_identificacion ?? "",
          numero_identificacion:
            p.numero_identificacion ?? p.documento ?? p.numero_documento ?? "-",
          primer_nombre: p.primer_nombre ?? "",
          segundo_nombre: p.segundo_nombre ?? "",
          primer_apellido: p.primer_apellido ?? "",
          segundo_apellido: p.segundo_apellido ?? "",
          nombre_completo,
          eps: p.eps ?? "",
          sexo: p.sexo ?? "",
          celularpal: p.celularpal ?? p.telefono ?? "",
          celularsec: p.celularsec ?? "",
          fecha_nacimiento: (p.fecha_nacimiento || "").split("T")[0] || "",
          direccion: p.direccion ?? "",
          nombre_barrio: p.nombre_barrio ?? "",
          departamento: p.departamento ?? "",
          ciudad: p.ciudad ?? "",
          edad: p.edad ?? undefined,
          grupo_etario: p.grupo_etario ?? "",
          curso_de_vida: p.curso_de_vida ?? "",
          regimen: p.regimen ?? "",
          tipo_afiliado: p.tipo_afiliado ?? "",
          created_at: p.created_at ?? "",
        } as PatientItem;
      });
      setItems(mapped);
      setLastPage(meta.last_page ?? 1);
      setTotal(meta.total ?? (Array.isArray(data) ? data.length : 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [page]);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(busqueda), 200);
    return () => clearTimeout(h);
  }, [busqueda]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.numero_identificacion.toLowerCase().includes(q) ||
        p.nombre_completo.toLowerCase().includes(q) ||
        (p.eps || "").toLowerCase().includes(q)
    );
  }, [items, debouncedQuery]);

  const openCreate = () => {
    setForm({
      tipo_identificacion: "CC",
      numero_identificacion: "",
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      eps: "",
      sexo: "",
      celularpal: "",
      celularsec: "",
    });
    setShowCreate(true);
  };

  const openEdit = (p: PatientItem) => {
    setForm({
      tipo_identificacion: p.tipo_identificacion || "CC",
      numero_identificacion: p.numero_identificacion || "",
      primer_nombre: p.primer_nombre || "",
      segundo_nombre: p.segundo_nombre || "",
      primer_apellido: p.primer_apellido || "",
      segundo_apellido: p.segundo_apellido || "",
      eps: p.eps || "",
      sexo: p.sexo || "",
      celularpal: p.celularpal || "",
      celularsec: p.celularsec || "",
    });
    setShowEditId(p.id);
  };

  const onCreate = async () => {
    if (
      !form.tipo_identificacion ||
      !form.numero_identificacion ||
      !form.primer_nombre ||
      !form.primer_apellido
    )
      return;
    setCreating(true);
    try {
      await createPatient({ ...form });
      setShowCreate(false);
      await cargar();
    } finally {
      setCreating(false);
    }
  };

  const onUpdate = async () => {
    if (!showEditId) return;
    setBusyId(showEditId);
    try {
      await updatePatient(showEditId, { ...form });
      setShowEditId(null);
      await cargar();
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar este paciente?")) return;
    setBusyId(id);
    try {
      await deletePatient(id);
      await cargar();
    } finally {
      setBusyId(null);
    }
  };

  const onUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      await bulkUploadPatients(uploadFile);
      setUploadFile(null);
      setShowUpload(false);
      await cargar();
    } finally {
      setUploading(false);
    }
  };

  const baseCols = [
    { key: "numero_identificacion", label: "Documento", value: (p: PatientItem) => p.numero_identificacion },
    { key: "nombre_completo", label: "Nombre", value: (p: PatientItem) => p.nombre_completo },
    { key: "eps", label: "EPS", value: (p: PatientItem) => p.eps || "-" },
    { key: "sexo", label: "Sexo", value: (p: PatientItem) => p.sexo || "-" },
    { key: "celularpal", label: "Celular", value: (p: PatientItem) => p.celularpal || "-" },
  ];
  const optionalCols = [
    { key: "tipo_identificacion", label: "Tipo ID", value: (p: PatientItem) => p.tipo_identificacion || "-" },
    { key: "fecha_nacimiento", label: "Nacimiento", value: (p: PatientItem) => p.fecha_nacimiento || "-" },
    { key: "direccion", label: "Dirección", value: (p: PatientItem) => p.direccion || "-" },
    { key: "nombre_barrio", label: "Barrio", value: (p: PatientItem) => p.nombre_barrio || "-" },
    { key: "departamento", label: "Departamento", value: (p: PatientItem) => p.departamento || "-" },
    { key: "ciudad", label: "Ciudad", value: (p: PatientItem) => p.ciudad || "-" },
    { key: "edad", label: "Edad", value: (p: PatientItem) => String(p.edad ?? "-") },
    { key: "grupo_etario", label: "Grupo Etario", value: (p: PatientItem) => p.grupo_etario || "-" },
    { key: "curso_de_vida", label: "Curso de Vida", value: (p: PatientItem) => p.curso_de_vida || "-" },
    { key: "regimen", label: "Regimen", value: (p: PatientItem) => p.regimen || "-" },
    { key: "tipo_afiliado", label: "Tipo Afiliado", value: (p: PatientItem) => p.tipo_afiliado || "-" },
  ];
  const columns = useMemo(() => {
    return [...baseCols, ...optionalCols.filter((c) => selectedExtraCols.includes(c.key))];
  }, [selectedExtraCols]);

  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col bg-gray-100">
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Pacientes</h1>
              <p className="text-sm text-gray-600">Gestión de pacientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <Upload className="w-4 h-4" />
              Cargar Lista
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Nuevo Paciente
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
              placeholder="Buscar por documento, nombre o EPS"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-blue-200">
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-xs text-blue-900">Columnas extra</span>
                {[
                  { key: "tipo_identificacion", label: "Tipo ID" },
                  { key: "fecha_nacimiento", label: "Nacimiento" },
                  { key: "direccion", label: "Dirección" },
                  { key: "nombre_barrio", label: "Barrio" },
                  { key: "departamento", label: "Departamento" },
                  { key: "ciudad", label: "Ciudad" },
                  { key: "edad", label: "Edad" },
                  { key: "grupo_etario", label: "Grupo Etario" },
                  { key: "curso_de_vida", label: "Curso de Vida" },
                  { key: "regimen", label: "Regimen" },
                  { key: "tipo_afiliado", label: "Tipo Afiliado" },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-xs text-blue-900">
                    <input
                      type="checkbox"
                      checked={selectedExtraCols.includes(opt.key)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedExtraCols((prev) =>
                          checked ? [...prev, opt.key] : prev.filter((k) => k !== opt.key)
                        );
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-500">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No hay pacientes</div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-blue-50">
                    <tr>
                      {columns.map((c) => (
                        <th key={c.key} className="px-3 py-2 text-left text-blue-900 font-semibold border-b border-blue-200">
                          {c.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right text-blue-900 font-semibold border-b border-blue-200">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-t border-blue-200">
                        {columns.map((c) => (
                          <td key={c.key} className="px-3 py-2 text-blue-900">
                            {c.value(p)}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(p)} className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600">
                              Editar
                            </button>
                            <button onClick={() => onDelete(p.id)} disabled={busyId === p.id} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400">
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Página {page} de {lastPage} • Total: {total}</div>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="px-3 py-1 border rounded disabled:opacity-50">
                Anterior
              </button>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className="px-3 py-1 border rounded disabled:opacity-50">
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Nuevo Paciente</h3>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tipo ID</label>
                  <input value={form.tipo_identificacion} onChange={(e) => setForm({ ...form, tipo_identificacion: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Documento</label>
                  <input value={form.numero_identificacion} onChange={(e) => setForm({ ...form, numero_identificacion: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Primer Nombre</label>
                  <input value={form.primer_nombre} onChange={(e) => setForm({ ...form, primer_nombre: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Segundo Nombre</label>
                  <input value={form.segundo_nombre} onChange={(e) => setForm({ ...form, segundo_nombre: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Primer Apellido</label>
                  <input value={form.primer_apellido} onChange={(e) => setForm({ ...form, primer_apellido: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Segundo Apellido</label>
                  <input value={form.segundo_apellido} onChange={(e) => setForm({ ...form, segundo_apellido: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">EPS</label>
                  <input value={form.eps} onChange={(e) => setForm({ ...form, eps: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Sexo</label>
                  <input value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Celular Principal</label>
                  <input value={form.celularpal} onChange={(e) => setForm({ ...form, celularpal: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Celular Secundario</label>
                  <input value={form.celularsec} onChange={(e) => setForm({ ...form, celularsec: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={onCreate} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">Crear</button>
              </div>
            </div>
          </div>
        )}

        {showEditId && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-blue-800">Editar Paciente</h3>
                </div>
                <button onClick={() => setShowEditId(null)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tipo ID</label>
                  <input value={form.tipo_identificacion} onChange={(e) => setForm({ ...form, tipo_identificacion: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Documento</label>
                  <input value={form.numero_identificacion} onChange={(e) => setForm({ ...form, numero_identificacion: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Primer Nombre</label>
                  <input value={form.primer_nombre} onChange={(e) => setForm({ ...form, primer_nombre: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Segundo Nombre</label>
                  <input value={form.segundo_nombre} onChange={(e) => setForm({ ...form, segundo_nombre: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Primer Apellido</label>
                  <input value={form.primer_apellido} onChange={(e) => setForm({ ...form, primer_apellido: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Segundo Apellido</label>
                  <input value={form.segundo_apellido} onChange={(e) => setForm({ ...form, segundo_apellido: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">EPS</label>
                  <input value={form.eps} onChange={(e) => setForm({ ...form, eps: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Sexo</label>
                  <input value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Celular Principal</label>
                  <input value={form.celularpal} onChange={(e) => setForm({ ...form, celularpal: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Celular Secundario</label>
                  <input value={form.celularsec} onChange={(e) => setForm({ ...form, celularsec: e.target.value })} className="w-full px-3 py-2 border text-blue-900 rounded" />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowEditId(null)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={onUpdate} disabled={busyId === showEditId} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-gray-400">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {showUpload && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Cargar Lista de Pacientes</h3>
                </div>
                <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <input type="file" accept=".csv,.xlsx" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="w-full" />
                <p className="text-xs text-gray-600">Formatos soportados: CSV, XLSX. Columnas recomendadas: documento, nombres, apellidos, EPS, sexo, celulares.</p>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowUpload(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={onUpload} disabled={uploading || !uploadFile} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">Subir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}