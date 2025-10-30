export const formatearFecha1 = (fecha: string | Date): string => {
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(fecha).toLocaleDateString("es-CO", opciones);
};
export const formatearFecha = (fecha: string | Date): string => {
  // Validar que la fecha existe
  if (!fecha) {
    console.error("No se proporcionó una fecha");
    return "Fecha no disponible";
  }

  if (typeof fecha === "string") {
    const soloFecha = fecha.split("T")[0]; // "2025-10-20"
    const [año, mes, dia] = soloFecha.split("-");

    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const fechaObj = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));

    return fechaObj.toLocaleDateString("es-CO", opciones);
  }
  const opciones: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return fecha.toLocaleDateString("es-CO", opciones);
};
export const formatearHora = (hora: string): string => {
  if (!hora) return "";

  const [horas, minutos] = hora.split(":").map(Number);
  const tiempoEnMinutos = horas * 60 + minutos;

  // 11:30 = 690 minutos, 14:00 = 840 minutos
  const inicioRango = 11 * 60 + 30; // 690 (11:30 AM)
  const finRango = 13 * 60; // 780 (1:00 PM)

  // Si está en el rango de 11:30 AM a 2:00 PM, mostrar 11:10
  if (tiempoEnMinutos >= inicioRango && tiempoEnMinutos < finRango) {
    return "11:10";
  }

  // Para otras horas, devolver el formato original
  return hora.substring(0, 5);
};

export const capitalizarPrimeraLetra = (texto: string): string => {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

export const formatearTelefono = (telefono: string): string => {
  // Remover espacios y caracteres especiales
  const limpio = telefono.replace(/\D/g, "");

  // Formatear como +57 300 123 4567
  if (limpio.length === 10) {
    return `+57 ${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6)}`;
  }

  return telefono;
};

export const validarDocumento = (documento: string): boolean => {
  // Validar que sea solo números y tenga entre 6 y 12 dígitos
  const regex = /^\d{6,12}$/;
  return regex.test(documento);
};

export const validarTelefono = (telefono: string): boolean => {
  // Validar teléfono colombiano (10 dígitos)
  const regex = /^3\d{9}$/;
  const limpio = telefono.replace(/\D/g, "");
  return regex.test(limpio);
};
