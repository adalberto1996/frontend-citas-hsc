export interface Cita {
  idCita: number;
  documento: string;
  nombrePaciente: string;
  fecha: string;
  hora: string;
  especialidad: string;
  doctor: string;
  lugar: string;
  direccion?: string;
  consultorio?: string;
  observaciones?: string;
  estado: string;
}

export interface CitaProxima {
  id_cita: number;
  fecha: string;
  hora: string;
  estado: string;
  nombre_paciente: string;
  numero_documento: string;
  especialidad: string;
  doctor: string;
  lugar: string;
}

export interface Solicitud {
  id_solicitud: number;
  telefono: string;
  mensaje: string;
  fecha_solicitud: string;
  estado: string;
}

export interface NuevaCita {
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
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  mensaje?: string;
  data?: T;
}
