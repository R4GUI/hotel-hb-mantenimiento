import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { MantenimientoCalendario, Area, Tipo, Equipo } from '../../models/interfaces';
import { ModalAlertaComponent } from '../shared/modal-alerta/modal-alerta.component';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalAlertaComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit {
  eventos: MantenimientoCalendario[] = [];
  areas: Area[] = [];
  tipos: Tipo[] = [];
  equipos: Equipo[] = [];
  usuarios: any[] = [];

  // Vista del calendario
  mesActual: Date = new Date();
  diasCalendario: any[] = [];
  nombreMes: string = '';
  
  // Modal de alerta
  mostrarAlerta: boolean = false;
  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Día seleccionado
  diaSeleccionado: Date | null = null;
  eventosDelDia: MantenimientoCalendario[] = [];
  mostrarEventosDelDia: boolean = false;

  // Roles
  isAdmin: boolean = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarDatos();
    this.generarCalendario();
  }

  verificarRol(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.rol === 'admin';
  }

  async cargarDatos(): Promise<void> {
    try {
      this.eventos = await this.apiService.getCalendario();
      this.areas = await this.apiService.getAreas();
      this.tipos = await this.apiService.getTipos();
      this.equipos = await this.apiService.getEquipos();
      this.usuarios = await this.apiService.getUsuariosByRol('mantenimiento');
      this.generarCalendario();
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.mostrarMensaje('Error al cargar datos del calendario', 'error');
    }
  }

  // ============ GENERACIÓN DEL CALENDARIO ============
  generarCalendario(): void {
    const primerDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1);
    const ultimoDia = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0);
    
    this.nombreMes = primerDia.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    
    const diasMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    
    this.diasCalendario = [];
    
    for (let i = 0; i < primerDiaSemana; i++) {
      this.diasCalendario.push({ dia: null, eventos: [] });
    }
    
    for (let dia = 1; dia <= diasMes; dia++) {
      const fecha = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), dia);
      const eventosDelDia = this.getEventosPorDia(fecha);
      
      this.diasCalendario.push({
        dia: dia,
        fecha: fecha,
        esHoy: this.esHoy(fecha),
        eventos: eventosDelDia
      });
    }
  }

  getEventosPorDia(fecha: Date): MantenimientoCalendario[] {
    return this.eventos.filter(evento => {
      if (!evento.fecha) return false;
      
      let fechaEvento: Date;
      
      if (evento.fecha.toDate) {
        fechaEvento = evento.fecha.toDate();
      } else if (typeof evento.fecha === 'string') {
        const partes = evento.fecha.split('-');
        fechaEvento = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
      } else {
        fechaEvento = new Date(evento.fecha);
      }
      
      return fechaEvento.getFullYear() === fecha.getFullYear() &&
             fechaEvento.getMonth() === fecha.getMonth() &&
             fechaEvento.getDate() === fecha.getDate();
    });
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.generarCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.generarCalendario();
  }

  hoyClick(): void {
    this.mesActual = new Date();
    this.generarCalendario();
  }

  // ============ EVENTOS DEL DÍA ============
  verEventosDelDia(dia: any): void {
    if (!dia.dia) return;
    
    this.diaSeleccionado = dia.fecha;
    this.eventosDelDia = dia.eventos;
    this.mostrarEventosDelDia = true;
  }

  cerrarEventosDelDia(): void {
    this.mostrarEventosDelDia = false;
    this.diaSeleccionado = null;
    this.eventosDelDia = [];
  }

// 🧹 MÉTODO MEJORADO PARA LIMPIAR EVENTOS HUÉRFANOS
  async limpiarEventosHuerfanos(): Promise<void> {
    if (!confirm('¿Estás seguro de limpiar eventos huérfanos? Esta acción eliminará:\n\n1. Eventos sin mantenimiento asociado\n2. Eventos cuyo mantenimiento fue eliminado')) {
      return;
    }

    try {
      console.log('🧹 Iniciando limpieza de eventos huérfanos...');
      
      const eventos = await this.apiService.getCalendario();
      const mantenimientos = await this.apiService.getMantenimientos();
      
      const idsMantenimientos = mantenimientos.map(m => m.id_mantenimiento);
      
      let eliminados = 0;
      
      for (const evento of eventos) {
        let debeEliminar = false;
        
        // CASO 1: Evento sin id_mantenimiento (creado antes de la actualización)
        if (!evento.id_mantenimiento) {
          console.log(`⚠️ Evento sin id_mantenimiento: ${evento.titulo}`);
          debeEliminar = true;
        }
        // CASO 2: Evento con id_mantenimiento que ya no existe
        else if (!idsMantenimientos.includes(evento.id_mantenimiento)) {
          console.log(`⚠️ Evento huérfano (mantenimiento eliminado): ${evento.titulo}`);
          debeEliminar = true;
        }
        
        if (debeEliminar && evento.id_calendario) {
          await this.apiService.deleteCalendario(evento.id_calendario);
          eliminados++;
          console.log(`❌ Eliminado: ${evento.titulo}`);
        }
      }
      
      console.log(`✅ Limpieza completada. Eliminados ${eliminados} eventos.`);
      this.mostrarMensaje(`✅ Limpieza completada: ${eliminados} evento(s) eliminado(s)`, 'success');
      
      await this.cargarDatos();
    } catch (error) {
      console.error('Error limpiando eventos:', error);
      this.mostrarMensaje('❌ Error al limpiar eventos', 'error');
    }
  }

  // ============ HELPERS ============
  getNombreArea(idArea?: string): string {
    if (!idArea) return '';
    const area = this.areas.find(a => a.id_area === idArea);
    return area ? area.nombre : '';
  }

  getNombreTipo(idTipo?: string): string {
    if (!idTipo) return '';
    const tipo = this.tipos.find(t => t.id_tipo === idTipo);
    return tipo ? tipo.nombre : '';
  }

  getNombreEquipo(idEquipo?: string): string {
    if (!idEquipo) return '';
    const equipo = this.equipos.find(e => e.id_equipo === idEquipo);
    return equipo ? equipo.nombre : '';
  }

  getColorEvento(prioridad?: string): string {
    switch (prioridad) {
      case 'urgente': return '#e74c3c';
      case 'alta': return '#f39c12';
      case 'media': return '#3498db';
      case 'baja': return '#95a5a6';
      default: return '#3498db';
    }
  }

  getPrioridadBadgeClass(prioridad?: string): string {
    switch (prioridad) {
      case 'baja': return 'bg-secondary';
      case 'media': return 'bg-primary';
      case 'alta': return 'bg-warning text-dark';
      case 'urgente': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getEstadoBadgeClass(estado?: string): string {
    switch (estado) {
      case 'programado': return 'bg-info';
      case 'en_proceso': return 'bg-warning text-dark';
      case 'completado': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '-';
    try {
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleDateString('es-MX');
    } catch (error) {
      return '-';
    }
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
  }

  cerrarAlerta(): void {
    this.mostrarAlerta = false;
  }
}