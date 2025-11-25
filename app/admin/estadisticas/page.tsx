"use client";

import api, { getAppointments, listPatients, obtenerSolicitudesPendientes } from "@/libs/api";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MessageCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";


interface Estadisticas {
  citasHoy: number;
  citasSemana: number;
  citasAtencionHoy: number;
  citasAtencionSemana: number;
  mensajesHoy: number;
  solicitudesPendientes: number;
  totalPacientes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Estadisticas>({
    citasHoy: 0,
    citasSemana: 0,
    citasAtencionHoy: 0,
    citasAtencionSemana: 0,
    mensajesHoy: 0,
    solicitudesPendientes: 0,
    totalPacientes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"todas" | "agendadas" | "atencion">("todas");

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      startOfWeek.setDate(today.getDate() + diffToMonday);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const countAppointmentsByCreated = async (from: Date, to: Date) => {
        try {
          const r = await getAppointments({ created_from: fmt(from), created_to: fmt(to), page: 1, per_page: 1 });
          return (r?.meta?.total ?? (Array.isArray(r?.data) ? r.data.length : 0)) as number;
        } catch {
          try {
            const r2 = await getAppointments({ from: fmt(from), to: fmt(to), page: 1, per_page: 1 });
            return (r2?.meta?.total ?? (Array.isArray(r2?.data) ? r2.data.length : 0)) as number;
          } catch {
            return 0;
          }
        }
      };

      const settled = await Promise.allSettled([
        listPatients({ page: 1, per_page: 1 }),
        api.get(`/mensajes`),
        obtenerSolicitudesPendientes(),
      ]);

      const settledAppointments = await Promise.allSettled([
        getAppointments({ from: fmt(today), to: fmt(today), page: 1, per_page: 1 }),
        getAppointments({ from: fmt(startOfWeek), to: fmt(endOfWeek), page: 1, per_page: 1 }),
      ]);

      const citasHoy = await countAppointmentsByCreated(today, today);
      const citasSemana = await countAppointmentsByCreated(startOfWeek, endOfWeek);
      const citasAtencionHoy = settledAppointments[0].status === "fulfilled"
        ? ((settledAppointments[0].value?.meta?.total ?? (Array.isArray(settledAppointments[0].value?.data) ? settledAppointments[0].value.data.length : 0)) as number)
        : 0;
      const citasAtencionSemana = settledAppointments[1].status === "fulfilled"
        ? ((settledAppointments[1].value?.meta?.total ?? (Array.isArray(settledAppointments[1].value?.data) ? settledAppointments[1].value.data.length : 0)) as number)
        : 0;
      const totalPacientes = settled[0].status === "fulfilled"
        ? ((settled[0].value?.meta?.total ?? (Array.isArray(settled[0].value?.data) ? settled[0].value.data.length : 0)) as number)
        : 0;
      const mensajesHoy = settled[1].status === "fulfilled"
        ? ((settled[1].value?.data?.data?.hoy ?? 0) as number)
        : 0;
      const solicitudesPendientes = settled[2].status === "fulfilled" && Array.isArray(settled[2].value?.solicitudes)
        ? settled[2].value.solicitudes.length
        : 0;

      setStats({ citasHoy, citasSemana, citasAtencionHoy, citasAtencionSemana, mensajesHoy, solicitudesPendientes, totalPacientes });
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const appointmentCardsAll = [
    {
      title: "Citas Hoy",
      value: stats.citasHoy,
      icon: Calendar,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Citas Esta Semana (Agendadas)",
      value: stats.citasSemana,
      icon: TrendingUp,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Atención Hoy (Fecha Cita)",
      value: stats.citasAtencionHoy,
      icon: Calendar,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Atención Semana (Fecha Cita)",
      value: stats.citasAtencionSemana,
      icon: TrendingUp,
      color: "bg-teal-500",
      textColor: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];
  const appointmentCards = viewMode === "todas"
    ? appointmentCardsAll
    : viewMode === "agendadas"
    ? appointmentCardsAll.slice(0, 2)
    : appointmentCardsAll.slice(2);
  const miscCards = [
    {
      title: "Mensajes Hoy",
      value: stats.mensajesHoy,
      icon: MessageCircle,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Solicitudes Pendientes",
      value: stats.solicitudesPendientes,
      icon: Clock,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Total Pacientes",
      value: stats.totalPacientes,
      icon: Users,
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];
  const cards = [...appointmentCards, ...miscCards];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen de actividad del sistema</p>
      </div>

      {/* Filtros de Vista */}
      <div className="flex items-center justify-end mb-4 gap-2">
        <button onClick={() => setViewMode("todas")} className={`px-3 py-1 rounded border ${viewMode === "todas" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}>Todas</button>
        <button onClick={() => setViewMode("agendadas")} className={`px-3 py-1 rounded border ${viewMode === "agendadas" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}>Agendadas</button>
        <button onClick={() => setViewMode("atencion")} className={`px-3 py-1 rounded border ${viewMode === "atencion" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}>Atención</button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {card.title}
              </h3>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => (window.location.href = "/admin/mensajes")}
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Mensajes</p>
              <p className="text-sm text-gray-600">Ver conversaciones</p>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/citas")}
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Calendar className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Citas</p>
              <p className="text-sm text-gray-600">Gestionar citas</p>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/plantillas")}
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <CheckCircle className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Plantillas</p>
              <p className="text-sm text-gray-600">Respuestas rápidas</p>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = "/admin/estadisticas")}
            className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-yellow-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Estadísticas</p>
              <p className="text-sm text-gray-600">Ver reportes</p>
            </div>
          </button>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Actividad Reciente
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                Sistema iniciado correctamente
              </p>
              <p className="text-sm text-gray-600">Hace 2 minutos</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                {stats.solicitudesPendientes} solicitudes pendientes
              </p>
              <p className="text-sm text-gray-600">Requieren atención</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
