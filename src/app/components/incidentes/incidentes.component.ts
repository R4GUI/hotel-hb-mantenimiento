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
  
  // Roles
  isAdmin: boolean = false;
  isAmaDeLlaves: boolean = false;
  isMantenimiento: boolean = false;
  isJefaAma: boolean = false; // 🆕 NUEVO ROL

  // Usuario actual
  currentUserId: string = '';
  currentUserName: string = '';

  // Modo Editor Secreto
  modoEditor: boolean = false;

  // Modal de alerta
  mostrarAlerta: boolean = false;
  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Historial
  mostrarModalHistorial: boolean = false;
  fechaHistorial: string = '';
  incidentesHistorial: Incidente[] = [];

  // 🆕 FILTROS PARA JEFA DE AMA
  trabajadoresFiltro: any[] = [];
  amasLlavesFiltro: any[] = [];
  trabajadorSeleccionado: string = '';
  amaLlavesSeleccionada: string = '';

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
    this.currentUserId = user?.id || '';
    this.currentUserName = user?.nombre || '';
    
    this.isAdmin = user?.rol === 'admin';
    this.isAmaDeLlaves = user?.rol === 'amadellaves';
    this.isMantenimiento = user?.rol === 'mantenimiento';
    this.isJefaAma = user?.rol === 'jefaama'; // 🆕 NUEVO ROL
  }

  async cargarDatos(): Promise<void> {
    try {
      this.areas = await this.apiService.getAreas();
      await this.cargarIncidentes();
      await this.cargarFiltros();
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  // 🆕 CARGAR FILTROS
  async cargarFiltros(): Promise<void> {
    try {
      if (this.isAdmin || this.isJefaAma) {
        this.trabajadoresFiltro = await this.apiService.getUsuariosByRol('mantenimiento');
        this.amasLlavesFiltro = await this.apiService.getUsuariosByRol('amadellaves');
      }
    } catch (error) {
      console.error('Error cargando filtros:', error);
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

  // async cargarIncidentes(): Promise<void> {
  //   try {
  //     const user = this.authService.getCurrentUser();
      
  //     if (this.isAdmin || this.isJefaAma) {
  //       // Admin y Jefa ven TODOS
  //       this.incidentes = await this.apiService.getIncidentes();
  //     } else if (this.isAmaDeLlaves) {
  //       // Ama de llaves solo ve los suyos
  //       this.incidentes = await this.apiService.getIncidentesByAma(user?.id || '');
  //     } else if (this.isMantenimiento) {
  //       // Mantenimiento ve TODOS los pendientes y los que están en proceso o completados por ellos
  //       const todosIncidentes = await this.apiService.getIncidentes();
  //       this.incidentes = todosIncidentes.filter(inc => 
  //         inc.estado === 'pendiente' || // Todos los pendientes
  //         inc.id_mantenimiento_asignado === user?.id // O los que tomó este usuario
  //       );
  //     }
      
  //     console.log('Incidentes cargados:', this.incidentes.length);
  //   } catch (error) {
  //     console.error('Error cargando incidentes:', error);
  //   }
  // }
// async cargarIncidentes(): Promise<void> {
//     try {
//       const user = this.authService.getCurrentUser();
      
//       if (this.isAdmin || this.isJefaAma) {
//         // Admin y Jefa ven TODOS
//         this.incidentes = await this.apiService.getIncidentes();
//       } else if (this.isAmaDeLlaves) {
//         // Ama de llaves solo ve los suyos
//         this.incidentes = await this.apiService.getIncidentesByAma(user?.id || '');
//       } else if (this.isMantenimiento) {
//         // 🔥 CORREGIDO: Mantenimiento ve:
//         // 1. TODOS los pendientes (sin asignar)
//         // 2. TODOS los que están en proceso (sin importar quién los tomó)
//         // 3. Los completados que ÉL tomó
//         const todosIncidentes = await this.apiService.getIncidentes();
//         this.incidentes = todosIncidentes.filter(inc => {
//           // Mostrar si está pendiente
//           if (inc.estado === 'pendiente') {
//             return true;
//           }
//           // Mostrar si está en proceso (todos, para que vean quién está trabajando)
//           if (inc.estado === 'en_proceso') {
//             return true;
//           }
//           // Mostrar completados solo si YO lo completé
//           if (inc.estado === 'completado' && inc.id_mantenimiento_asignado === user?.id) {
//             return true;
//           }
//           return false;
//         });
//       }
      
//       console.log('✅ Incidentes cargados:', this.incidentes.length);
//     } catch (error) {
//       console.error('❌ Error cargando incidentes:', error);
//     }
//   }

  async cargarIncidentes(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      console.log('🔍 Usuario actual:', user);
      
      if (this.isAdmin || this.isJefaAma) {
        this.incidentes = await this.apiService.getIncidentes();
        console.log('👑 Admin/Jefa ve todos:', this.incidentes.length);
      } else if (this.isAmaDeLlaves) {
        this.incidentes = await this.apiService.getIncidentesByAma(user?.id || '');
        console.log('🧹 Ama de Llaves ve suyos:', this.incidentes.length);
      } else if (this.isMantenimiento) {
        const todosIncidentes = await this.apiService.getIncidentes();
        console.log('🔧 Mantenimiento - Total incidentes en BD:', todosIncidentes.length);
        
        this.incidentes = todosIncidentes.filter(inc => {
          // Pendiente: sin asignar (null o vacío)
          const esPendiente = inc.estado === 'pendiente' && 
                             (!inc.id_mantenimiento_asignado || inc.id_mantenimiento_asignado === '');
          
          // En proceso: con alguien asignado
          const esEnProceso = inc.estado === 'en_proceso';
          
          // Completado: solo los míos
          const esCompletadoPorMi = inc.estado === 'completado' && 
                                   inc.id_mantenimiento_asignado === user?.id;
          
          const mostrar = esPendiente || esEnProceso || esCompletadoPorMi;
          
          console.log(`🔍 "${inc.area}" - Estado: "${inc.estado}" - Asignado: "${inc.id_mantenimiento_asignado}" - Mostrar: ${mostrar}`);
          
          return mostrar;
        });
        
        console.log('✅ Incidentes filtrados para mantenimiento:', this.incidentes.length);
      }
      
      console.log('📊 Total incidentes mostrados:', this.incidentes.length);
    } catch (error) {
      console.error('❌ Error cargando incidentes:', error);
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
        // 🆕 YA NO SE ASIGNA AUTOMÁTICAMENTE
        await this.apiService.createIncidente(this.nuevoIncidente);
        this.mostrarMensaje('✅ Incidente reportado correctamente. Área de Mantenimiento lo verá.', 'success');
      }
      
      await this.cargarIncidentes();
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando incidente:', error);
      this.mostrarMensaje('Error al guardar incidente', 'error');
    }
  }

  // 🆕 MÉTODO PARA "TOMAR" UN INCIDENTE (Mantenimiento)
  async tomarIncidente(incidente: Incidente): Promise<void> {
    if (!incidente.id_incidente) return;
    
    if (!confirm('¿Deseas tomar este incidente y comenzar a trabajar en él?')) return;
    
    try {
      await this.apiService.updateIncidente(incidente.id_incidente, {
        estado: 'en_proceso',
        id_mantenimiento_asignado: this.currentUserId,
        nombre_mantenimiento_asignado: this.currentUserName,
        fecha_inicio: new Date()
      });
      
      this.mostrarMensaje('✅ Incidente tomado. Ahora aparece en tu lista de trabajos.', 'success');
      await this.cargarIncidentes();
    } catch (error) {
      console.error('Error tomando incidente:', error);
      this.mostrarMensaje('Error al tomar incidente', 'error');
    }
  }

// 🆕 VERIFICAR SI PUEDO TOMAR EL INCIDENTE
  puedoTomarIncidente(incidente: Incidente): boolean {
    return this.isMantenimiento && 
           incidente.estado === 'pendiente' && 
           (!incidente.id_mantenimiento_asignado || incidente.id_mantenimiento_asignado === ''); // 🔥 ACEPTAR null O vacío
  }

  // 🆕 VERIFICAR SI YO LO TOMÉ
  yoLoTome(incidente: Incidente): boolean {
    return incidente.id_mantenimiento_asignado === this.currentUserId;
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
        id_mantenimiento_asignado: '',
        nombre_mantenimiento_asignado: '',
        fecha_completado: null,
        fecha_inicio: null,
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
      
      if (this.isAdmin || this.isJefaAma) {
        allIncidentes = await this.apiService.getIncidentes();
      } else if (this.isAmaDeLlaves) {
        allIncidentes = await this.apiService.getIncidentesByAma(user?.id || '');
      } else if (this.isMantenimiento) {
        const todosIncidentes = await this.apiService.getIncidentes();
        allIncidentes = todosIncidentes.filter(inc => 
          inc.id_mantenimiento_asignado === user?.id
        );
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
        inc.nombre_mantenimiento_asignado || 'Sin tomar'
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
    let filtrados = this.incidentes;

    // Filtro por trabajador de mantenimiento
    if (this.trabajadorSeleccionado) {
      filtrados = filtrados.filter(inc => 
        inc.id_mantenimiento_asignado === this.trabajadorSeleccionado
      );
    }

    // Filtro por ama de llaves (solo para jefaama)
    if (this.amaLlavesSeleccionada && this.isJefaAma) {
      filtrados = filtrados.filter(inc => 
        inc.id_ama_llaves === this.amaLlavesSeleccionada
      );
    }

    return filtrados;
  }

  limpiarFiltros(): void {
    this.trabajadorSeleccionado = '';
    this.amaLlavesSeleccionada = '';
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

  getNombreTrabajador(idTrabajador: string): string {
    const trabajador = this.trabajadoresFiltro.find(t => t.id === idTrabajador);
    return trabajador ? trabajador.nombre : 'Desconocido';
  }

  getNombreAmaLlaves(idAma: string): string {
    const ama = this.amasLlavesFiltro.find(a => a.id === idAma);
    return ama ? ama.nombre : 'Desconocido';
  }
}