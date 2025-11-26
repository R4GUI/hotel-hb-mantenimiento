import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Incidente, Area } from '../../models/interfaces';
import { ModalAlertaComponent } from '../shared/modal-alerta/modal-alerta.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-incidentes',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalAlertaComponent],
  templateUrl: './incidentes.component.html',
  styleUrl: './incidentes.component.css'
})
export class IncidentesComponent implements OnInit {
  incidentes: Incidente[] = [];
  areas: Area[] = [];
  mostrarModal: boolean = false;
  
  nuevoIncidente: Incidente = {
    area: '',
    ubicacion: '',
    es_habitacion: true,
    numero_habitacion: '',
    piso: '',
    descripcion: '',
    prioridad: 'media',
    estado: 'pendiente',
    id_ama_llaves: '',
    nombre_ama_llaves: '',
    fecha_reporte: new Date()
  };
  
  isAdmin: boolean = false;
  isAmaDeLlaves: boolean = false;

  pisos: string[] = ['PB', '1', '2', '3', '4', '5'];

  // Modo Editor Secreto
  modoEditor: boolean = false;

  // Modal de alerta
  mostrarAlerta: boolean = false;
  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Historial por día
  mostrarModalHistorial: boolean = false;
  fechaHistorial: string = '';
  incidentesHistorial: Incidente[] = [];

  // 🆕 FILTRO POR TRABAJADOR
  trabajadoresFiltro: any[] = [];
  trabajadorSeleccionado: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarDatos();
    this.nuevoIncidente = this.getIncidenteVacio();
    this.fechaHistorial = new Date().toISOString().split('T')[0];
  }

  verificarRol(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.rol === 'admin';
    this.isAmaDeLlaves = user?.rol === 'amadellaves';
  }

  async cargarDatos(): Promise<void> {
    try {
      this.areas = await this.apiService.getAreas();
      await this.cargarIncidentes();
      await this.cargarTrabajadores();
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  // 🆕 CARGAR TRABAJADORES
  async cargarTrabajadores(): Promise<void> {
    try {
      this.trabajadoresFiltro = await this.apiService.getUsuariosByRol('mantenimiento');
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
    }
  }

  getIncidenteVacio(): Incidente {
    const user = this.authService.getCurrentUser();
    return {
      area: '',
      ubicacion: '',
      es_habitacion: true,
      numero_habitacion: '',
      piso: '',
      descripcion: '',
      prioridad: 'media',
      estado: 'pendiente',
      id_ama_llaves: user?.id || '',
      nombre_ama_llaves: user?.nombre || '',
      fecha_reporte: new Date()
    };
  }

  async cargarIncidentes(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      
      if (this.isAdmin) {
        this.incidentes = await this.apiService.getIncidentes();
      } else if (this.isAmaDeLlaves) {
        this.incidentes = await this.apiService.getIncidentesByAma(user?.id || '');
      }
      
      console.log('Incidentes cargados:', this.incidentes.length);
    } catch (error) {
      console.error('Error cargando incidentes:', error);
    }
  }

  abrirModal(): void {
    this.nuevoIncidente = this.getIncidenteVacio();
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.nuevoIncidente = this.getIncidenteVacio();
  }

  async guardarIncidente(): Promise<void> {
    if (!this.nuevoIncidente.area || !this.nuevoIncidente.descripcion) {
      this.mostrarMensaje('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    // 🔥 Generar ubicación automática desde la descripción
    this.nuevoIncidente.ubicacion = this.nuevoIncidente.area;
    this.nuevoIncidente.es_habitacion = true;
    this.nuevoIncidente.numero_habitacion = '';
    this.nuevoIncidente.piso = '';

    try {
      if (this.nuevoIncidente.id_incidente) {
        await this.apiService.updateIncidente(
          this.nuevoIncidente.id_incidente, 
          this.nuevoIncidente
        );
        this.mostrarMensaje('Incidente actualizado correctamente', 'success');
      } else {
        const incidenteCreado = await this.apiService.createIncidente(this.nuevoIncidente);
        const asignado = await this.apiService.asignarMantenimientoAleatorio(incidenteCreado);
        
        if (asignado) {
          this.mostrarMensaje('✅ Incidente reportado y asignado automáticamente', 'success');
        } else {
          this.mostrarMensaje('⚠️ Incidente reportado. No hay personal disponible en este momento', 'warning');
        }
      }
      
      await this.cargarIncidentes();
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando incidente:', error);
      this.mostrarMensaje('Error al guardar incidente', 'error');
    }
  }

  async agregarObservacion(incidente: Incidente): Promise<void> {
    if (incidente.estado !== 'completado') {
      this.mostrarMensaje('Solo puedes agregar observaciones a incidentes completados', 'warning');
      return;
    }

    const observacion = prompt('Escribe tus observaciones sobre el trabajo realizado:');
    
    if (observacion !== null && incidente.id_incidente) {
      try {
        await this.apiService.updateIncidente(incidente.id_incidente, {
          observaciones_ama: observacion
        });
        this.mostrarMensaje('Observación agregada correctamente', 'success');
        await this.cargarIncidentes();
      } catch (error) {
        console.error('Error agregando observación:', error);
        this.mostrarMensaje('Error al agregar observación', 'error');
      }
    }
  }

  // ============ MÉTODOS ADMIN ============
  async editarIncidente(incidente: Incidente): Promise<void> {
    this.nuevoIncidente = { ...incidente };
    this.mostrarModal = true;
  }

  async iniciarIncidenteAdmin(incidente: Incidente): Promise<void> {
    if (!incidente.id_incidente) return;
    
    try {
      await this.apiService.updateIncidente(incidente.id_incidente, {
        estado: 'en_proceso',
        fecha_inicio: new Date()
      });
      this.mostrarMensaje('Incidente iniciado', 'success');
      await this.cargarIncidentes();
    } catch (error) {
      console.error('Error iniciando incidente:', error);
      this.mostrarMensaje('Error al iniciar incidente', 'error');
    }
  }

  async eliminarIncidente(incidente: Incidente): Promise<void> {
    if (!incidente.id_incidente) return;
    
    if (!confirm(`¿Estás seguro de eliminar este incidente?`)) return;
    
    try {
      await this.apiService.deleteIncidente(incidente.id_incidente);
      this.mostrarMensaje('Incidente eliminado correctamente', 'success');
      await this.cargarIncidentes();
    } catch (error) {
      console.error('Error eliminando incidente:', error);
      this.mostrarMensaje('Error al eliminar incidente', 'error');
    }
  }

  async reabrirIncidente(incidente: Incidente): Promise<void> {
    if (!incidente.id_incidente) return;
    
    try {
      await this.apiService.updateIncidente(incidente.id_incidente, {
        estado: 'pendiente',
        fecha_completado: null,
        trabajo_realizado: '',
        observaciones_ama: ''
      });
      this.mostrarMensaje('Incidente reabierto correctamente', 'success');
      await this.cargarIncidentes();
    } catch (error) {
      console.error('Error reabriendo incidente:', error);
      this.mostrarMensaje('Error al reabrir incidente', 'error');
    }
  }

  // ============ MODO EDITOR SECRETO ============
  activarModoEditor(): void {
    const password = prompt('Ingresa la contraseña de editor:');
    
    if (password === 'hbhotel') {
      this.modoEditor = !this.modoEditor;
      if (this.modoEditor) {
        this.mostrarMensaje('🔓 Modo Editor ACTIVADO', 'warning');
      } else {
        this.mostrarMensaje('🔒 Modo Editor DESACTIVADO', 'info');
      }
    } else if (password !== null) {
      this.mostrarMensaje('❌ Contraseña incorrecta', 'error');
    }
  }

  // ============ HISTORIAL POR DÍA ============
  abrirModalHistorial(): void {
    this.mostrarModalHistorial = true;
    this.cargarHistorial();
  }

  cerrarModalHistorial(): void {
    this.mostrarModalHistorial = false;
  }

  async cargarHistorial(): Promise<void> {
    if (!this.fechaHistorial) return;

    try {
      const user = this.authService.getCurrentUser();
      const fechaSeleccionada = new Date(this.fechaHistorial + 'T00:00:00');
      
      let allIncidentes: Incidente[] = [];
      
      if (this.isAdmin) {
        allIncidentes = await this.apiService.getIncidentes();
      } else if (this.isAmaDeLlaves) {
        allIncidentes = await this.apiService.getIncidentesByAma(user?.id || '');
      }

      this.incidentesHistorial = allIncidentes.filter(inc => {
        if (!inc.fecha_reporte) return false;

        const fechaIncidente = inc.fecha_reporte.toDate ? inc.fecha_reporte.toDate() : new Date(inc.fecha_reporte);
        fechaIncidente.setHours(0, 0, 0, 0);
        fechaSeleccionada.setHours(0, 0, 0, 0);

        return fechaIncidente.getTime() === fechaSeleccionada.getTime();
      });

    } catch (error) {
      console.error('Error cargando historial:', error);
      this.mostrarMensaje('Error al cargar historial', 'error');
    }
  }

  async generarReporteDiario(): Promise<void> {
    if (this.incidentesHistorial.length === 0) {
      this.mostrarMensaje('No hay incidentes para generar reporte', 'warning');
      return;
    }

    try {
      const doc = new jsPDF();
      const user = this.authService.getCurrentUser();

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DIARIO DE INCIDENTES', 105, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reportado por: ${user?.nombre}`, 20, 30);
      doc.text(`Fecha: ${new Date(this.fechaHistorial).toLocaleDateString('es-MX')}`, 20, 38);
      doc.text(`Total de incidentes: ${this.incidentesHistorial.length}`, 20, 46);

      const datos = this.incidentesHistorial.map((inc, index) => [
        (index + 1).toString(),
        inc.area,
        inc.ubicacion,
        inc.descripcion,
        inc.estado || '',
        inc.nombre_mantenimiento_asignado || 'Sin asignar'
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['#', 'Área', 'Ubicación', 'Descripción', 'Estado', 'Asignado a']],
        body: datos,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] },
        styles: { fontSize: 9 }
      });

      doc.save(`reporte-incidentes-${this.fechaHistorial}.pdf`);
      this.mostrarMensaje('Reporte generado correctamente', 'success');
    } catch (error) {
      console.error('Error generando reporte:', error);
      this.mostrarMensaje('Error al generar reporte', 'error');
    }
  }

  // ============ FILTROS ============
  get incidentesFiltrados(): Incidente[] {
    if (!this.trabajadorSeleccionado) {
      return this.incidentes;
    }
    return this.incidentes.filter(inc => 
      inc.id_mantenimiento_asignado === this.trabajadorSeleccionado
    );
  }

  limpiarFiltro(): void {
    this.trabajadorSeleccionado = '';
  }

  // ============ HELPERS ============
  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'bg-warning text-dark';
      case 'en_proceso': return 'bg-info';
      case 'completado': return 'bg-success';
      case 'no_completado': return 'bg-danger';
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
      return date.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
    // 🆕 MÉTODO PARA OBTENER NOMBRE DE TRABAJADOR
  getNombreTrabajador(idTrabajador: string): string {
    const trabajador = this.trabajadoresFiltro.find(t => t.id === idTrabajador);
    return trabajador ? trabajador.nombre : 'Desconocido';
  }
}