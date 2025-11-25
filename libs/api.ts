import type {
  ApiResponse,
  CitaProxima,
  NuevaCita,
  Solicitud,
} from "@/types/index";
import axios, { AxiosError } from "axios";

interface ApiErrorResponse {
  mensaje?: string;
  message?: string;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
    const payload = error.response?.data as ApiErrorResponse | undefined;
    const message = payload?.message || payload?.mensaje || payload?.error || error.message;
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



// ===== BACKOFFICE: CITAS =====
export const getAppointments = async (params?: Record<string, unknown>) => {
  const response = await api.get("/backoffice/appointments", { params });
  return response.data;
};
export const createAppointment = async (data: NuevaCita) => {
  const response = await api.post<ApiResponse>("/backoffice/appointments", data);
  return response.data;
};
export const getAppointment = async (id: number) => {
  const response = await api.get(`/backoffice/appointments/${id}`);
  return response.data;
};
export const cancelAppointment = async (id: number) => {
  const response = await api.post(`/backoffice/appointments/${id}/cancel`);
  return response.data;
};
export const confirmAppointment = async (id: number) => {
  const response = await api.post(`/backoffice/appointments/${id}/confirm`);
  return response.data;
};
export const rescheduleAppointment = async (
  id: number,
  payload: Record<string, unknown>
) => {
  const response = await api.post(`/backoffice/appointments/${id}/reschedule`, payload);
  return response.data;
};

// ===== BACKOFFICE: MENSAJES =====
export const listConversations = async (params?: Record<string, unknown>) => {
  const response = await api.get("/backoffice/conversations", { params });
  return response.data;
};
export const getConversationMessages = async (
  conversationId: number,
  params?: Record<string, unknown>
) => {
  const response = await api.get(`/backoffice/conversations/${conversationId}/messages`, { params });
  return response.data;
};
export const createMessage = async (data: { conversation_id: number; mensaje: string }) => {
  const response = await api.post("/backoffice/messages", data);
  return response.data;
};

// ===== BACKOFFICE: PACIENTES =====
export const listPatients = async (params?: Record<string, unknown>) => {
  const response = await api.get("/backoffice/patients", { params });
  return response.data;
};
export const createPatient = async (data: Record<string, unknown>) => {
  const response = await api.post("/backoffice/patients", data);
  return response.data;
};
export const updatePatient = async (id: number, data: Record<string, unknown>) => {
  const response = await api.put(`/backoffice/patients/${id}`, data);
  return response.data;
};
export const deletePatient = async (id: number) => {
  const response = await api.delete(`/backoffice/patients/${id}`);
  return response.data;
};
export const bulkUploadPatients = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const response = await api.post("/backoffice/patients/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// ===== BACKOFFICE: PACIENTES =====
export const getPatient = async (id: number) => {
  const response = await api.get(`/backoffice/patients/${id}`);
  return response.data;
};

// ===== BACKOFFICE: USERS =====
export const listUsers = async (params?: Record<string, unknown>) => {
  const response = await api.get("/backoffice/users", { params });
  return response.data;
};
export const createUser = async (data: { name: string; email: string; password: string; role: string }) => {
  const response = await api.post("/backoffice/users", data);
  return response.data;
};
export const updateUser = async (id: number, data: Partial<{ name: string; email: string; password: string; role: string }>) => {
  const response = await api.put(`/backoffice/users/${id}`, data);
  return response.data;
};
export const deleteUser = async (id: number) => {
  const response = await api.delete(`/backoffice/users/${id}`);
  return response.data;
};

// ===== HEALTH CHECK =====
export const checkHealth = async () => {
  const response = await api.get("/docs/api");
  return response.data;
};

export default api;
