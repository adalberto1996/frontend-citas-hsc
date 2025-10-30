"use client";

import Plantilla from "@/libs/interface";
import axios from "axios";
import { FileText, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function FormulariosPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/mensajes/plantillas`, {
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
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Formularios de Solicitud de Cita
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona urls para la toma de los datos de los pacientes
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          Nueva Plantilla
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Cargando...</div>
      ) : (
        <div className="space-y-6">
          {/* {Object.entries(plantillasPorCategoria).map(([categoria, plantillasCategoria]) => (
            <div key={categoria} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{categoria}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formularios.map((formulario) => (
                  <div
                    key={formulario.id_formulario}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-700">
                        {formulario.nombre}
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          //onClick={() => copiarTexto(plantilla.mensaje)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Copiar mensaje"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          className="text-gray-500 hover:text-gray-700"
                          title="Editar plantilla"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar plantilla"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                      {formulario.mensaje}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}  */}
        </div>
      )}
    </div>
  );
}
