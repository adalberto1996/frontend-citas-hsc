"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Calendar, Clock, Edit, Plus, Search, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  createAppointment,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAvailabilityBySpecialty,
} from "@/libs/api";

type AppointmentItem = {
  id: number;
  fecha: string;
  hora: string;
  estado: string;
  nombre_paciente: string;
  numero_documento: string;
  especialidad: string;
  doctor?: string;
  tipo_atencion?: string;
  hora_fin?: string;
  canal_agenda?: string;
  notas?: string;
};

type NuevaCitaForm = {
  documento: string;
  nombre: string;
  telefono: string;
  eps?: string;
  fecha: string;
  hora: string;
  especialidad: string;
  lugar: string;
  doctor?: string;
  observaciones?: string;
};

export default function CitasPage() {
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showRescheduleId, setShowRescheduleId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState<NuevaCitaForm>({
    documento: "",
    nombre: "",
    telefono: "",
    eps: "",
    fecha: "",
    hora: "",
    especialidad: "",
    lugar: "",
    doctor: "",
    observaciones: "",
  });
  const [newFecha, setNewFecha] = useState("");
  const [newHora, setNewHora] = useState("");
  const [estado, setEstado] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(10);
  const [selectedExtraCols, setSelectedExtraCols] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityReschedule, setAvailabilityReschedule] = useState<any[]>([]);
  const [availabilityRescheduleLoading, setAvailabilityRescheduleLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await getAppointments({
        estado: estado || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        per_page: perPage,
        include: "paciente,profesional,horario",
      });
      const data = (resp as any)?.data || [];
      const meta = (resp as any)?.meta || {};
      const mapped = (Array.isArray(data) ? data : []).map((a: any) => ({
        id: a.id ?? a.id_cita ?? a.appointment_id ?? 0,
        fecha: (() => {
          const f = a.fecha ?? a.fecha_cita ?? a.date ?? a.scheduled_date ?? a.horario?.fecha ?? "-";
          if (!f || f === "-") return "-";
          const s = String(f);
          const part = s.includes("T") ? s.split("T")[0] : (s.includes(" ") ? s.split(" ")[0] : s);
          return part;
        })(),
        hora:
          a.hora_inicio ?? a.hora ?? a.hora_cita ?? a.horario?.hora_inicio ?? a.time ?? "-",
        estado: a.estado ?? a.status ?? "-",
        nombre_paciente:
          (
            a.paciente_nombre ??
            a.paciente?.nombre ??
            [
              a.paciente?.primer_nombre,
              a.paciente?.segundo_nombre,
              a.paciente?.primer_apellido,
              a.paciente?.segundo_apellido,
            ].filter(Boolean).join(" ")
          ) || "-",
        numero_documento:
          a.paciente?.numero_identificacion ?? a.numero_documento ?? a.documento ?? a.document ?? "-",
        especialidad:
          a.profesional?.especialidad ?? a.especialidad ?? a.especialidad_nombre ?? a.specialty ?? "-",
        doctor: a.profesional_nombre ?? a.profesional?.nombre ?? "-",
        tipo_atencion: a.tipo_atencion ?? a.horario?.tipo_atencion ?? "-",
        hora_fin: a.hora_fin ?? a.horario?.hora_fin ?? "-",
        canal_agenda: a.canal_agenda ?? "-",
        notas: a.notas ?? "-",
      }));
      
      setItems(mapped);
      setLastPage(meta.last_page ?? 1);
      setTotal(meta.total ?? (Array.isArray(data) ? data.length : 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [estado, fromDate, toDate, page]);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(busqueda), 200);
    return () => clearTimeout(h);
  }, [busqueda]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!form.especialidad || !form.fecha) {
        setAvailability([]);
        return;
      }
      setAvailabilityLoading(true);
      try {
        const resp = await getAvailabilityBySpecialty({ specialty: form.especialidad, date: form.fecha, per_page: 50 });
        const data = (resp as any)?.data ?? [];
        setAvailability(Array.isArray(data) ? data : []);
      } finally {
        setAvailabilityLoading(false);
      }
    };
    fetchAvailability();
  }, [form.especialidad, form.fecha]);

  useEffect(() => {
    const fetchAvailabilityReschedule = async () => {
      const current = items.find((a) => a.id === showRescheduleId);
      const specialty = current?.especialidad;
      if (!specialty || !newFecha) {
        setAvailabilityReschedule([]);
        return;
      }
      setAvailabilityRescheduleLoading(true);
      try {
        const resp = await getAvailabilityBySpecialty({ specialty, date: newFecha, per_page: 50 });
        const data = (resp as any)?.data ?? [];
        setAvailabilityReschedule(Array.isArray(data) ? data : []);
      } finally {
        setAvailabilityRescheduleLoading(false);
      }
    };
    fetchAvailabilityReschedule();
  }, [showRescheduleId, newFecha, items]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.numero_documento.includes(q) ||
        a.nombre_paciente.toLowerCase().includes(q) ||
        (a.doctor || "-").toLowerCase().includes(q) ||
        a.especialidad.toLowerCase().includes(q)
    );
  }, [items, debouncedQuery]);

  const baseCols = [
    { key: "fecha", label: "Fecha", value: (i: AppointmentItem) => i.fecha },
    { key: "hora", label: "Hora", value: (i: AppointmentItem) => i.hora?.slice(0, 5) },
    { key: "nombre_paciente", label: "Paciente", value: (i: AppointmentItem) => i.nombre_paciente },
    { key: "numero_documento", label: "Documento", value: (i: AppointmentItem) => i.numero_documento },
    { key: "especialidad", label: "Especialidad", value: (i: AppointmentItem) => i.especialidad },
    { key: "estado", label: "Estado", value: (i: AppointmentItem) => i.estado },
  ];
  const optionalCols = [
    { key: "doctor", label: "Doctor", value: (i: AppointmentItem) => i.doctor || "-" },
    { key: "tipo_atencion", label: "Tipo Atención", value: (i: AppointmentItem) => i.tipo_atencion || "-" },
    { key: "hora_fin", label: "Hora Fin", value: (i: AppointmentItem) => (i.hora_fin || "-").slice(0, 5) },
    { key: "canal_agenda", label: "Canal", value: (i: AppointmentItem) => i.canal_agenda || "-" },
    { key: "notas", label: "Notas", value: (i: AppointmentItem) => i.notas || "-" },
  ];
  const columns = useMemo(() => {
    return [...baseCols, ...optionalCols.filter((c) => selectedExtraCols.includes(c.key))];
  }, [selectedExtraCols]);

  const onCreate = async () => {
    if (!form.documento || !form.nombre || !form.telefono || !form.fecha || !form.hora || !form.especialidad || !form.lugar) return;
    setCreating(true);
    try {
      await createAppointment({ ...form } as any);
      setShowCreate(false);
      setForm({ documento: "", nombre: "", telefono: "", eps: "", fecha: "", hora: "", especialidad: "", lugar: "", doctor: "", observaciones: "" });
      await cargar();
    } finally {
      setCreating(false);
    }
  };

  const onConfirm = async (id: number) => {
    setBusyId(id);
    try {
      await confirmAppointment(id);
      await cargar();
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = async (id: number) => {
    setBusyId(id);
    try {
      await cancelAppointment(id);
      await cargar();
    } finally {
      setBusyId(null);
    }
  };

  const onReschedule = async () => {
    if (!showRescheduleId || !newFecha || !newHora) return;
    setUpdating(true);
    try {
      await rescheduleAppointment(showRescheduleId, { fecha: newFecha, hora: newHora });
      setShowRescheduleId(null);
      setNewFecha("");
      setNewHora("");
      await cargar();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="h-full flex flex-col bg-gray-100">
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-teal-800">Citas</h1>
              <p className="text-sm text-gray-600">Gestión de citas programadas</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        </div>

        <div className="px-6 pb-4">
          <div className="grid md:grid-cols-4 gap-3 items-center">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por documento, paciente, profesional o especialidad"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-700 focus:border-transparent text-teal-900 placeholder:text-gray-500"
              />
            </div>
            <div>
              <select
                value={estado}
                onChange={(e) => {
                  setPage(1);
                  setEstado(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-teal-900"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
                <option value="reprogramada">Reprogramada</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setPage(1);
                  setFromDate(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-teal-900"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setPage(1);
                  setToDate(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-teal-900"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-teal-200">
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-xs text-teal-900">Columnas extra</span>
                {[
                  { key: "doctor", label: "Doctor" },
                  { key: "tipo_atencion", label: "Tipo Atención" },
                  { key: "hora_fin", label: "Hora Fin" },
                  { key: "canal_agenda", label: "Canal" },
                  { key: "notas", label: "Notas" },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-xs text-teal-900">
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
              <div className="p-6 text-center text-gray-500">No hay citas</div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-teal-50">
                    <tr>
                      {columns.map((c) => (
                        <th key={c.key} className="px-3 py-2 text-left text-teal-900 font-semibold border-b border-teal-200">
                          {c.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right text-teal-900 font-semibold border-b border-teal-200">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr key={a.id} className="border-t border-teal-200">
                        {columns.map((c) => (
                          <td key={c.key} className="px-3 py-2 text-teal-900">
                            {c.value(a)}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => onConfirm(a.id)} disabled={busyId === a.id} className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400">Confirmar</button>
                            <button onClick={() => onCancel(a.id)} disabled={busyId === a.id} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400">Cancelar</button>
                            <button onClick={() => setShowRescheduleId(a.id)} className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600">Reprogramar</button>
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
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage || loading} className="px-3 py-1 border rounded disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-teal-800">Nueva Cita</h3>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Documento</label>
                  <input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Nombre</label>
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Teléfono</label>
                  <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">EPS</label>
                  <input value={form.eps} onChange={(e) => setForm({ ...form, eps: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Fecha</label>
                  <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Hora</label>
                  <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                  {availabilityLoading ? (
                    <p className="text-sm text-gray-500 mt-2">Cargando disponibilidad...</p>
                  ) : (
                    availability.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-2">Disponibles:</p>
                        <div className="flex flex-wrap gap-2">
                          {availability.map((slot, idx) => {
                            const label = slot.hora ?? slot.hora_inicio ?? slot.time ?? slot.inicio ?? slot.start_time ?? "";
                            const display = String(label).slice(0, 5);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setForm({ ...form, hora: display })}
                                className="px-2 py-1 text-sm bg-teal-50 text-teal-900 border border-teal-200 rounded hover:bg-teal-100"
                              >
                                {display}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Especialidad</label>
                  <input value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Lugar</label>
                  <input value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-2">Doctor</label>
                  <input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-2">Observaciones</label>
                  <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="w-full px-3 py-2 border text-teal-900 rounded" rows={3} />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 border text-red-900 rounded">Cancelar</button>
                <button onClick={onCreate} disabled={creating} className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400">Crear</button>
              </div>
            </div>
          </div>
        )}

        {showRescheduleId && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-teal-200">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-teal-800">Reprogramar</h3>
                </div>
                <button onClick={() => setShowRescheduleId(null)} className="p-2 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Nueva Fecha</label>
                  <input type="date" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} className="w-full px-3 py-2 border text-teal-900 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Nueva Hora</label>
                  <input type="time" value={newHora} onChange={(e) => setNewHora(e.target.value)} className="w-full px-3 py-2 border text-teal-900 rounded" />
                  {availabilityRescheduleLoading ? (
                    <p className="text-sm text-gray-500 mt-2">Cargando disponibilidad...</p>
                  ) : (
                    availabilityReschedule.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-2">Disponibles:</p>
                        <div className="flex flex-wrap gap-2">
                          {availabilityReschedule.map((slot, idx) => {
                            const label = slot.hora ?? slot.hora_inicio ?? slot.time ?? slot.inicio ?? slot.start_time ?? "";
                            const display = String(label).slice(0, 5);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setNewHora(display)}
                                className="px-2 py-1 text-sm bg-teal-50 text-teal-900 border border-teal-200 rounded hover:bg-teal-100"
                              >
                                {display}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowRescheduleId(null)} className="px-4 py-2 border text-red-900 rounded">Cancelar</button>
                <button onClick={onReschedule} disabled={updating} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:bg-gray-400">Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}