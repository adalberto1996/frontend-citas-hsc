"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/libs/api";
import { Clock, MessageCircle, Phone, Search, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "";

interface Mensaje {
  id_mensaje: number;
  telefono: string;
  mensaje: string;
  tipo: "ENTRADA" | "SALIDA";
  fecha: string;
  leido: boolean;
  nombre_contacto?: string;
}

interface Contacto {
  telefono: string;
  nombre_completo?: string;
  ultimo_mensaje: string;
  ultima_fecha: string;
  mensajes_sin_leer: number;
}

export default function MensajesPage() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [contactoSeleccionado, setContactoSeleccionado] = useState<
    string | null
  >(null);
  const [telefonoSeleccionado, setTelefonoSeleccionado] = useState<string | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!WS_URL) {
      cargarContactos();
      return;
    }
    const token = localStorage.getItem("token");
    const newSocket = io(WS_URL, { auth: { token } });

    newSocket.on("connect", () => {
      console.log("✅ WebSocket conectado");
    });

    newSocket.on("nuevo-mensaje", (mensaje: Mensaje) => {
      console.log("📩 Nuevo mensaje recibido:", mensaje);
      if ((mensaje as any).conversation_id === contactoSeleccionado || mensaje.telefono === telefonoSeleccionado) {
        setMensajes((prev) => [...prev, mensaje]);
      }
      cargarContactos();
    });

    setSocket(newSocket);
    cargarContactos();

    return () => {
      newSocket.disconnect();
    };
  }, [contactoSeleccionado, telefonoSeleccionado]);

  useEffect(() => {
    // Scroll automático al último mensaje
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const cargarContactos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/mensajes/contactos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setContactos(response.data.data.contactos);
      }
    } catch (error) {
      console.error("Error al cargar contactos:", error);
    }
  };

  const cargarConversacion = async (telefono: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(
        `/mensajes/conversacion/${telefono}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setMensajes(response.data.mensajes);
        setContactoSeleccionado(telefono);
        setTelefonoSeleccionado(telefono);
      }
    } catch (error) {
      console.error("Error al cargar conversación:", error);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !contactoSeleccionado) return;

    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/whatsapp/enviar-mensaje`,
        {
          telefono: contactoSeleccionado,
          mensaje: nuevoMensaje,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Agregar mensaje a la conversación
      const nuevoMensajeObj: Mensaje = {
        id_mensaje: Date.now(),
        telefono: contactoSeleccionado,
        mensaje: nuevoMensaje,
        tipo: "SALIDA",
        fecha: new Date().toISOString(),
        leido: true,
      };

      setMensajes((prev) => [...prev, nuevoMensajeObj]);
      setNuevoMensaje("");
      cargarContactos();
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;

    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const contactosFiltrados = (contactos ?? []).filter(
    (contacto) =>
      contacto.telefono.includes(busqueda) ||
      contacto.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const contactoActual = (contactos ?? []).find(
    (c) => c.telefono === contactoSeleccionado
  );

  return (
    <ProtectedRoute>
      <div className="h-screen flex bg-gray-100">
        {/* Lista de contactos */}
        <div className="w-96 bg-white border-r flex flex-col">
          {/* Header */}
          <div className="p-4 bg-teal-600 text-white">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              Mensajes WhatsApp
            </h1>
          </div>

          {/* Buscador */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar contacto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-700 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lista de contactos */}
          <div className="flex-1 overflow-y-auto">
            {contactosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay mensajes</p>
              </div>
            ) : (
              contactosFiltrados.map((contacto) => (
                <div
                  key={contacto.telefono}
                  onClick={() => cargarConversacion(contacto.telefono)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    contactoSeleccionado === contacto.telefono
                      ? "bg-teal-50"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {contacto.nombre_completo?.[0] || contacto.telefono[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {contacto.nombre_completo || contacto.telefono}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatearFecha(contacto.ultima_fecha)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 truncate">
                          {contacto.ultimo_mensaje}
                        </p>
                        {contacto.mensajes_sin_leer > 0 && (
                          <span className="ml-2 bg-teal-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            {contacto.mensajes_sin_leer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Área de conversación */}
        <div className="flex-1 flex flex-col">
          {contactoSeleccionado ? (
            <>
              {/* Header de conversación */}
              <div className="bg-white border-b p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {contactoActual?.nombre_completo?.[0] ||
                    contactoSeleccionado[0]}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {contactoActual?.nombre_completo || "Sin nombre"}
                  </h2>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="w-3 h-3" />
                    {contactoSeleccionado}
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {mensajes.map((mensaje) => (
                  <div
                    key={mensaje.id_mensaje}
                    className={`mb-4 flex ${
                      mensaje.tipo === "SALIDA"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        mensaje.tipo === "SALIDA"
                          ? "bg-teal-600 text-white"
                          : "bg-white text-gray-800 border"
                      }`}
                    >
                      <p className="break-words">{mensaje.mensaje}</p>
                      <div
                        className={`text-xs mt-1 flex items-center gap-1 ${
                          mensaje.tipo === "SALIDA"
                            ? "text-teal-100"
                            : "text-gray-500"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatearHora(mensaje.fecha)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="bg-white border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && enviarMensaje()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                  />
                  <button
                    onClick={enviarMensaje}
                    disabled={!nuevoMensaje.trim()}
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Enviar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">
                  Selecciona una conversación
                </h3>
                <p>Elige un contacto para ver los mensajes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
