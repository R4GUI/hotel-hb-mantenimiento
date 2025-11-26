export interface Area {
  id_area?: string;
  nombre: string;
  descripcion?: string;
}

export interface Tipo {
  id_tipo?: string;
  nombre: string;
  descripcion?: string;
}

export interface Equipo {
  id_equipo?: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  id_area?: string;
  id_tipo?: string;
}

export interface Mantenimiento {
  id_mantenimiento?: string;
  fecha_solicitud?: any;
  id_area?: string;
  id_tipo?: string;
  id_equipo?: string;
  descripcion?: string;
  prioridad?: string;
  estado?: string; // programado, orden_generada, activo, completado
  fecha_programada?: any;
  fecha_completado?: any;
  fecha_inicio?: any;
  observaciones?: string;
  trabajo_realizado?: string;
  id_usuario_asignado?: string;
  id_usuario_solicitante?: string;
  orden_trabajo_generada?: boolean;
}

export interface Refaccion {
  id_refaccion?: string;
  id_mantenimiento?: string;
  nombre: string;
  cantidad: number;
  precio_unitario?: number;
  proveedor?: string;
}

export interface User {
  id: string;
  nombre: string;
  usuario: string;
  rol: string;
}

export interface Incidente {
  id_incidente?: string;
  area: string;
  ubicacion: string;
  es_habitacion: boolean;
  numero_habitacion?: string;
  piso?: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  id_ama_llaves: string;
  nombre_ama_llaves: string;
  id_mantenimiento_asignado?: string;
  nombre_mantenimiento_asignado?: string;
  fecha_reporte: any;
  fecha_inicio?: any;
  fecha_completado?: any;
  observaciones_ama?: string;
  trabajo_realizado?: string;
  foto_antes?: string;
  foto_despues?: string;
}

export interface HorarioSemanal {
  id_horario?: string;
  id_usuario: string;
  nombre_usuario: string;
  semana_inicio: any;
  semana_fin: any;
  lunes: TurnoHorario;
  martes: TurnoHorario;
  miercoles: TurnoHorario;
  jueves: TurnoHorario;
  viernes: TurnoHorario;
  sabado: TurnoHorario;
  domingo: TurnoHorario;
}

export interface TurnoHorario {
  trabaja: boolean;
  hora_entrada?: string;
  hora_salida?: string;
  notas?: string;
}

export interface MantenimientoCalendario {
  id_calendario?: string;
  titulo: string;
  descripcion?: string;
  id_equipo?: string;
  id_area?: string;
  id_tipo?: string;
  id_mantenimiento?: string;
  fecha: any;
  hora?: string;
  id_responsable?: string;
  nombre_responsable?: string;
  estado: string;
  prioridad: string;
  recurrente: boolean;
  frecuencia?: string;
}

// 🆕 NUEVAS INTERFACES PARA REPORTES
export interface ReporteDiario {
  fecha: Date;
  tipo: 'mantenimiento' | 'incidente';
  items: (Mantenimiento | Incidente)[];
}