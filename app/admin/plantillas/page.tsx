"use client";

import api from "@/libs/api";
import Plantilla from "@/libs/interface";
import { ApiResponse } from "@/types";
import { Copy, Edit, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";


export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/mensajes/plantillas`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setPlantillas(response.data.data.plantillas);
      }
    } catch (error) {
      console.error("Error al cargar plantillas:", error);
    } finally {
      setLoading(false);
    }
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
  };

  const plantillasPorCategoria = plantillas.reduce((acc, plantilla) => {
    if (!acc[plantilla.categoria]) {
      acc[plantilla.categoria] = [];
    }
    acc[plantilla.categoria].push(plantilla);
    return acc;
  }, {} as Record<string, Plantilla[]>);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Plantillas de Respuesta
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona respuestas rápidas para WhatsApp
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          <Plus className="w-5 h-5" />
          Nueva Plantilla
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(plantillasPorCategoria).map(
            ([categoria, plantillasCategoria]) => (
              <div
                key={categoria}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {categoria}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plantillasCategoria.map((plantilla) => (
                    <div
                      key={plantilla.id_plantilla}
                      className="border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-700">
                          {plantilla.nombre}
                        </h3>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => copiarTexto(plantilla.mensaje)}
                            className="bg-teal-600 text-white rounded-full p-2 hover:bg-teal-700"
                            title="Copiar mensaje"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                          <button
                            className="bg-yellow-500 text-white rounded-full p-2 hover:bg-yellow-600"
                            title="Editar plantilla"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                            title="Eliminar plantilla"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                        {plantilla.mensaje}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
export const enviarMensajeWhatsApp = async (
  telefono: string,
  mensaje: string
) => {
  const response = await api.post<ApiResponse>("/whatsapp/enviar-mensaje", {
    telefono,
    mensaje,
  });
  return response.data;
};
