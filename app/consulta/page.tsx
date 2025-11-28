/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/app/consulta/page.tsx
"use client";

import { consultarCita } from "@/libs/api";
import { formatearFecha, formatearHora } from "@/libs/utils";
import type { Cita } from "@/types";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  User,
} from "lucide-react";
import { useState } from "react";

export default function ConsultaPage() {
  const [documento, setDocumento] = useState("");
  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buscarCita = async () => {
    if (!documento.trim()) {
      setError("Por favor ingrese su número de documento");
      return;
    }

    setLoading(true);
    setError("");
    setCita(null);

    try {
      const response = await consultarCita(documento.trim());
      if (response.success && response.cita) {
        setCita(response.cita);
      } else {
        setError("No se encontró una cita agendada con este documento");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("No se encontró una cita agendada con este documento");
      } else {
        setError("Error al consultar la cita. Por favor intente nuevamente");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      buscarCita();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-teal-600 p-3 rounded-full">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Consulta tu Cita Médica
          </h1>
          <p className="text-center text-gray-600">
            Ingresa tu número de documento para verificar tu cita asignada
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Número de Documento
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: 1234567890"
              className="flex-1 px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700 text-lg"
            />
            <button
              onClick={buscarCita}
              disabled={loading}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Resultado de la cita */}
        {cita && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-white" />
              <div className="text-white">
                <h2 className="text-xl font-bold">¡Cita Encontrada!</h2>
                <p className="text-green-100">
                  Tu cita ha sido agendada exitosamente
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Paciente */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <User className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Paciente</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {cita.nombrePaciente}
                  </p>
                  <p className="text-sm text-gray-600">Doc: {cita.documento}</p>
                </div>
              </div>

              {/* Fecha */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Fecha</p>
                  <p className="text-lg font-semibold text-gray-800 capitalize">
                    {formatearFecha(cita.fecha)}
                  </p>
                </div>
              </div>

              {/* Hora */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Hora</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formatearHora(cita.hora)}
                  </p>
                </div>
              </div>

              {/* Especialidad */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <User className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Especialidad</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {cita.especialidad}
                  </p>
                  {cita.doctor && (
                    <p className="text-sm text-gray-600 mt-1">
                      Dr(a). {cita.doctor}
                    </p>
                  )}
                </div>
              </div>

              {/* Lugar */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <MapPin className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Lugar</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {cita.lugar}
                  </p>
                  {cita.consultorio && (
                    <p className="text-sm text-gray-600 mt-1">
                      Consultorio: {cita.consultorio}
                    </p>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              {cita.observaciones && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm font-semibold text-teal-800 mb-1">
                    Observaciones:
                  </p>
                  <p className="text-sm text-teal-700">{cita.observaciones}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 border-t">
              <p className="text-sm text-gray-600 text-center">
                Por favor llega 15 minutos antes de tu cita
              </p>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">
            Información Importante
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>Las citas se actualizan en el transcurso del día</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>
                Si no encuentras tu cita, por favor comunícate con nosotros
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>
                Recuerda llevar tu documento de identidad y carnet de EPS
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
