"use client";

import axios from "axios";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface Estadisticas {
  citasHoy: number;
  citasSemana: number;
  mensajesHoy: number;
  solicitudesPendientes: number;
  totalPacientes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Estadisticas>({
    citasHoy: 0,
    citasSemana: 0,
    mensajesHoy: 0,
    solicitudesPendientes: 0,
    totalPacientes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const token = localStorage.getItem("token");
      const citas = await axios.get(`${API_URL}/citas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mensajes = await axios.get(`${API_URL}/mensajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const solicitudes = await axios.get(`${API_URL}/solicitudes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (
        citas.data.success &&
        mensajes.data.success &&
        solicitudes.data.success
      ) {
        setStats({
          citasHoy: Array.isArray(citas.data.data.hoy)
            ? citas.data.data.hoy.length
            : typeof citas.data.data.hoy === "number"
            ? citas.data.data.hoy
            : 0,
          citasSemana: citas.data.data.semana,
          mensajesHoy: mensajes.data.data.hoy,
          solicitudesPendientes: solicitudes.data.data.pendientes,
          totalPacientes: solicitudes.data.data.total,
        });
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Citas Hoy",
      value: stats.citasHoy,
      icon: Calendar,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Citas Esta Semana",
      value: stats.citasSemana,
      icon: TrendingUp,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
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
