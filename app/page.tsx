/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { consultarCita } from "@/libs/api";
import { formatearFecha, formatearHora } from "@/libs/utils";
import type { Cita } from "@/types";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Phone,
  Search,
  Shield,
  User,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [documento, setDocumento] = useState("");
  const [cita, setCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Limpiar timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const limpiarDatos = () => {
    setDocumento("");
    setCita(null);
    setError("");
  };

  const buscarCita = async () => {
    if (!documento.trim()) {
      setError("Por favor ingrese su número de documento");
      return;
    }

    setLoading(true);
    setError("");
    setCita(null);

    // Cancelar timeout anterior si aún existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      const response = await consultarCita(documento.trim());

      if (response?.success && response?.cita) {
        console.log("✅ Cita encontrada:", response.cita);
        setCita(response.cita);

        // Limpiar los datos automáticamente después de 2 minutos
        timeoutRef.current = setTimeout(() => {
          limpiarDatos();
        }, 2 * 60 * 1000);
      } else {
        setError("No se encontró una cita agendada con este documento");
      }
    } catch (err: any) {
      console.error("❌ Error al consultar cita:", err);

      // Si el backend devolvió 404
      if (err.response?.status === 404) {
        setError("No se encontró una cita agendada con este documento");
      }
      // Si hubo problema de red o timeout
      else if (
        err.code === "ECONNABORTED" ||
        err.message?.includes("timeout")
      ) {
        setError(
          "La conexión con el servidor ha tardado demasiado. Intente nuevamente."
        );
      }
      // Otros errores genéricos
      else {
        setError("Error al consultar la cita. Por favor intente nuevamente.");
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

  const handleLogin = () => {
    // Aquí iría la navegación al login
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo del Hospital */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg">
                <div className="text-white font-bold text-2xl">HSC</div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">
                  Hospital San Cristóbal
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de Gestión de Citas
                </p>
              </div>
            </div>

            {/* Botón de Login */}
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <User size={20} />
              <span className="font-semibold">Acceso Administrativo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Tarjeta de Consulta */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Calendar className="text-blue-600" size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Consulta tu Cita
              </h2>
              <p className="text-gray-600">
                Ingresa tu documento de identidad para verificar tus citas
                programadas
              </p>
            </div>

            <div className="space-y-6">
              {/* Número de Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento
                </label>
                <input
                  type="text"
                  value={documento}
                  onChange={(e) =>
                    setDocumento(e.target.value.replace(/\D/g, ""))
                  }
                  onKeyPress={handleKeyPress}
                  placeholder="Ingresa tu número de documento"
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Botón de Búsqueda */}
              <button
                onClick={buscarCita}
                disabled={loading || !documento}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Consultar Cita
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
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
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
                  <User className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Paciente</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {cita.nombrePaciente}
                    </p>
                    <p className="text-sm text-gray-600">
                      Doc: {cita.documento}
                    </p>
                  </div>
                </div>

                {/* Fecha */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Fecha</p>
                    <p className="text-lg font-semibold text-gray-800 capitalize">
                      {formatearFecha(cita.fecha)}
                    </p>
                  </div>
                </div>

                {/* Hora */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Hora</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatearHora(cita.hora)}
                    </p>
                  </div>
                </div>

                {/* Especialidad */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <User className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
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
                  <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
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
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      Observaciones:
                    </p>
                    <p className="text-sm text-blue-700">
                      {cita.observaciones}
                    </p>
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

          {/* Información de Contacto */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Teléfono
                </h3>
                <p className="text-gray-600 text-sm">+57 311 123 4567</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Horario Solicitud de Citas
                </h3>
                <p className="text-gray-600 text-sm">Lunes - Viernes: </p>
                <p className="text-gray-600 text-sm">7:00 am - 11:00 am</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Ubicación
                </h3>
                <p className="text-gray-600 text-sm">Ciénaga, Magdalena</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            {/* Información del Hospital */}
            <div>
              <h3 className="text-white font-bold text-lg mb-3">
                Hospital San Cristóbal
              </h3>
              <p className="text-sm leading-relaxed">
                Comprometidos con tu salud y bienestar. Brindamos servicios
                médicos de calidad con tecnología de punta.
              </p>
            </div>

            {/* Protección de Datos */}
            <div>
              <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <Shield size={20} />
                Protección de Datos
              </h3>
              <p className="text-sm leading-relaxed mb-2">
                Cumplimos con la Ley 1581 de 2012 y el Decreto 1377 de 2013
                sobre protección de datos personales.
              </p>
              <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                <FileText size={16} />
                Política de Privacidad
              </button>
            </div>

            {/* Desarrollo */}
            <div>
              <h3 className="text-white font-bold text-lg mb-3">
                Desarrollo y Propiedad Intelectual
              </h3>
              <p className="text-sm leading-relaxed mb-2">
                Sistema desarrollado y distribuido exclusivamente por{" "}
                <span className="text-white font-semibold">
                  Adalberto Pedroza
                </span>
                .
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Todos los derechos reservados. Prohibida su reproducción,
                distribución o modificación sin autorización expresa del
                desarrollador.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                © 2025 SchedBot Solutions - Sistema Administracion de Citas
              </p>
            </div>
          </div>

          {/* Nota Legal */}
          <div className="border-t border-gray-800 pt-6">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Los datos personales recolectados son tratados de forma
              confidencial y segura, utilizados únicamente para la gestión de
              citas médicas y servicios hospitalarios. El usuario tiene derecho
              a conocer, actualizar y rectificar sus datos personales según la
              normativa vigente.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
