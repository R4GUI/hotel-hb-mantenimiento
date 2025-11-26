import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Incidente, Mantenimiento } from '../../models/interfaces';

@Component({
  selector: 'app-para-hoy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './para-hoy.component.html',
  styleUrl: './para-hoy.component.css'
})
export class ParaHoyComponent implements OnInit {
  incidentesHoy: Incidente[] = [];
  mantenimientosHoy: Mantenimiento[] = [];
  
  incidenteSeleccionado: Incidente | null = null;
  mostrarModalFinalizar: boolean = false;
  trabajoRealizado: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarTareasHoy();
  }

  async cargarTareasHoy(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      
      // Cargar incidentes asignados a este usuario
      this.incidentesHoy = await this.apiService.getIncidentesByMantenimiento(user?.id || '');
      
      // Filtrar solo los de hoy que estén pendientes o en proceso
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      this.incidentesHoy = this.incidentesHoy.filter(inc => {
        if (inc.estado === 'completado' || inc.estado === 'no_completado') {
          return false;
        }
        
        const fechaReporte = inc.fecha_reporte.toDate ? inc.fecha_reporte.toDate() : new Date(inc.fecha_reporte);
        fechaReporte.setHours(0, 0, 0, 0);
        
        return fechaReporte.getTime() === hoy.getTime();
      });

      // Cargar mantenimientos programados para hoy
      const allMantenimientos = await this.apiService.getMantenimientos();
      this.mantenimientosHoy = allMantenimientos.filter(m => {
        if (!m.fecha_programada || m.estado === 'completado') return false;
        
        const fechaProgramada = m.fecha_programada.toDate ? m.fecha_programada.toDate() : new Date(m.fecha_programada);
        fechaProgramada.setHours(0, 0, 0, 0);
        
        return fechaProgramada.getTime() === hoy.getTime() && m.id_usuario_asignado === user?.id;
      });
      
    } catch (error) {
      console.error('Error cargando tareas de hoy:', error);
    }
  }

  async iniciarIncidente(incidente: Incidente): Promise<void> {
    if (!incidente.id_incidente) return;
    
    try {
      await this.apiService.updateIncidente(incidente.id_incidente, {
        estado: 'en_proceso',
        fecha_inicio: new Date()
      });
      alert('Incidente iniciado');
      await this.cargarTareasHoy();
    } catch (error) {
      console.error('Error iniciando incidente:', error);
      alert('Error al iniciar incidente');
    }
  }

  abrirModalFinalizar(incidente: Incidente): void {
    this.incidenteSeleccionado = incidente;
    this.trabajoRealizado = '';
    this.mostrarModalFinalizar = true;
  }

  cerrarModalFinalizar(): void {
    this.mostrarModalFinalizar = false;
    this.incidenteSeleccionado = null;
    this.trabajoRealizado = '';
  }

  async finalizarIncidente(): Promise<void> {
    if (!this.incidenteSeleccionado?.id_incidente) return;
    
    if (!this.trabajoRealizado.trim()) {
      alert('Por favor describe el trabajo realizado');
      return;
    }
    
    try {
      await this.apiService.updateIncidente(this.incidenteSeleccionado.id_incidente, {
        estado: 'completado',
        fecha_completado: new Date(),
        trabajo_realizado: this.trabajoRealizado
      });
      alert('Incidente finalizado correctamente');
      await this.cargarTareasHoy();
      this.cerrarModalFinalizar();
    } catch (error) {
      console.error('Error finalizando incidente:', error);
      alert('Error al finalizar incidente');
    }
  }

  async iniciarMantenimiento(mantenimiento: Mantenimiento): Promise<void> {
    if (!mantenimiento.id_mantenimiento) return;
    
    try {
      await this.apiService.updateMantenimiento(mantenimiento.id_mantenimiento, {
        estado: 'activo'
      });
      alert('Mantenimiento iniciado');
      await this.cargarTareasHoy();
    } catch (error) {
      console.error('Error iniciando mantenimiento:', error);
      alert('Error al iniciar mantenimiento');
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'bg-warning text-dark';
      case 'en_proceso': return 'bg-info';
      case 'completado': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getPrioridadBadgeClass(prioridad: string): string {
    switch (prioridad) {
      case 'baja': return 'bg-secondary';
      case 'media': return 'bg-primary';
      case 'alta': return 'bg-warning text-dark';
      case 'urgente': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return '-';
    
    try {
      const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return date.toLocaleString('es-MX');
    } catch (error) {
      return '-';
    }
  }
}