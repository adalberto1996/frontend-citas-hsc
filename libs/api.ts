import type {
  ApiResponse,
  CitaProxima,
  NuevaCita,
  Solicitud,
} from "@/types/index";
import axios, { AxiosError } from "axios";

interface ApiErrorResponse {
  mensaje: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//const message = (error.response?.data as ApiErrorResponse)?.mensaje || error.message;
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message =
      (error.response?.data as ApiErrorResponse)?.mensaje || error.message;
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);

// ===== CITAS =====
export const consultarCita = async (documento: string) => {
  const response = await api.post("/citas/consultar", {
    documento,
  });
  console.log(response.data);
  return {
    success: response.data.success,
    cita: response.data.data?.cita || null,
  };
};

export const crearCita = async (data: NuevaCita) => {
  const response = await api.post<ApiResponse>("/citas/crear", data);
  return response.data;
};

export const obtenerCitasProximas = async () => {
  const response = await api.get<{ success: boolean; citas: CitaProxima[] }>(
    "/citas/proximas"
  );
  return response.data;
};

// ===== SOLICITUDES =====
export const obtenerSolicitudesPendientes = async () => {
  const response = await api.get<{
    success: boolean;
    solicitudes: Solicitud[];
  }>("/solicitudes/pendientes");
  return response.data;
};

export const actualizarEstadoSolicitud = async (
  id: number,
  estado: string,
  idCita?: number
) => {
  const response = await api.put<ApiResponse>(`/solicitudes/${id}/estado`, {
    estado,
    id_cita: idCita,
  });
  return response.data;
};

// ===== WHATSAPP =====
export const notificarCitaPorWhatsApp = async (
  telefono: string,
  citaInfo: unknown
) => {
  const response = await api.post<ApiResponse>("/whatsapp/notificar-cita", {
    telefono,
    citaInfo,
  });
  return response.data;
};

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
// ===== HEALTH CHECK =====
export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
