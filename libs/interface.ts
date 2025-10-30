export default interface Mensaje {
  id_mensaje: number;
  telefono: string;
  mensaje: string;
  tipo: "ENTRADA" | "SALIDA";
  fecha: string;
  leido: boolean;
  nombre_contacto?: string;
}

export  interface Contacto {
  telefono: string;
  nombre_completo?: string;
  ultimo_mensaje: string;
  ultima_fecha: string;
  mensajes_sin_leer: number;
}

export default interface Plantilla {
  id_plantilla: number;
  nombre: string;
  mensaje: string;
  categoria: string;
  activa: boolean;
}

export interface Usuario {
  id_usuario: number;
  username: string;
  nombre_completo: string;
  email?: string;
  rol: string;
  estado: string;
  fecha_creacion: string;
  ultimo_acceso?: string;
}
