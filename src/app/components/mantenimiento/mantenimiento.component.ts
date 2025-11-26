import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Area, Tipo, Equipo, Mantenimiento, Refaccion } from '../../models/interfaces';
import { ModalAlertaComponent } from '../shared/modal-alerta/modal-alerta.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalAlertaComponent],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.css'
})
export class MantenimientoComponent implements OnInit {
  // Arrays de datos
  areas: Area[] = [];
  tipos: Tipo[] = [];
  equipos: Equipo[] = [];
  mantenimientos: Mantenimiento[] = [];

  // Modales
  mostrarModal: boolean = false;
  mostrarModalRefacciones: boolean = false;
  mostrarModalReporte: boolean = false;
  
  modoEdicion: boolean = false;
  mantenimientoEditando: Mantenimiento | null = null;
  mantenimientoParaRefacciones: Mantenimiento | null = null;
  mantenimientoParaReporte: Mantenimiento | null = null;

  // Formulario
  nuevoMantenimiento: Mantenimiento = {
    descripcion: '',
    prioridad: 'media',
    estado: 'programado',
    id_area: '',
    id_tipo: '',
    id_equipo: '',
    id_usuario_solicitante: '',
    orden_trabajo_generada: false
  };

  // Refacciones
  refacciones: Refaccion[] = [];
  nuevaRefaccion: Refaccion = {
    nombre: '',
    cantidad: 1,
    precio_unitario: 0,
    proveedor: ''
  };
  
  proveedores: string[] = [];
  proveedorSeleccionado: string = '';
  mostrarInputProveedor: boolean = false;

  // Reporte de finalización
  trabajoRealizado: string = '';
  observacionesFinal: string = '';

  // Roles
  isAdmin: boolean = false;
  isMantenimiento: boolean = false;

  // Modo Editor Secreto
  modoEditor: boolean = false;

  // Modal de alerta
  mostrarAlerta: boolean = false;
  mensajeAlerta: string = '';
  tipoAlerta: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Historial por día
  mostrarModalHistorial: boolean = false;
  fechaHistorial: string = '';
  mantenimientosHistorial: Mantenimiento[] = [];

  constructor(
    private apiService: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarDatos();
    this.nuevoMantenimiento = this.getMantenimientoVacio();
    this.fechaHistorial = new Date().toISOString().split('T')[0];
  }

  verificarRol(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.rol === 'admin';
    this.isMantenimiento = user?.rol === 'mantenimiento';
  }

  getMantenimientoVacio(): Mantenimiento {
    const user = this.authService.getCurrentUser();
    return {
      descripcion: '',
      prioridad: 'media',
      estado: 'programado',
      id_area: '',
      id_tipo: '',
      id_equipo: '',
      id_usuario_solicitante: user?.id || '',
      orden_trabajo_generada: false
    };
  }

  getRefaccionVacia(): Refaccion {
    return {
      nombre: '',
      cantidad: 1,
      precio_unitario: 0,
      proveedor: ''
    };
  }

  async cargarDatos(): Promise<void> {
    try {
      this.areas = await this.apiService.getAreas();
      this.tipos = await this.apiService.getTipos();
      this.equipos = await this.apiService.getEquipos();
      await this.cargarMantenimientos();
      await this.cargarProveedores();
    } catch (error) {
      console.error('Error cargando datos:', error);
      this.mostrarMensaje('Error al cargar datos', 'error');
    }
  }

  async cargarMantenimientos(): Promise<void> {
    try {
      const allMantenimientos = await this.apiService.getMantenimientos();
      const user = this.authService.getCurrentUser();
      
      if (this.isAdmin) {
        this.mantenimientos = allMantenimientos;
      } else {
        this.mantenimientos = allMantenimientos.filter(m => 
          m.id_usuario_asignado === user?.id
        );
      }
    } catch (error) {
      console.error('Error cargando mantenimientos:', error);
    }
  }

  async cargarProveedores(): Promise<void> {
    try {
      this.proveedores = await this.apiService.getProveedores();
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  }

  // ============ MODALES ============
  abrirModal(mantenimiento?: Mantenimiento): void {
    if (mantenimiento) {
      this.modoEdicion = true;
      this.mantenimientoEditando = mantenimiento;
      this.nuevoMantenimiento = { ...mantenimiento };
    } else {
      this.modoEdicion = false;
      this.mantenimientoEditando = null;
      this.nuevoMantenimiento = this.getMantenimientoVacio();
    }
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.mantenimientoEditando = null;
  }

  abrirModalRefacciones(mantenimiento: Mantenimiento): void {
    this.mantenimientoParaRefacciones = mantenimiento;
    this.mostrarModalRefacciones = true;
    this.cargarRefacciones(mantenimiento.id_mantenimiento!);
  }

  cerrarModalRefacciones(): void {
    this.mostrarModalRefacciones = false;
    this.mantenimientoParaRefacciones = null;
    this.refacciones = [];
    this.nuevaRefaccion = this.getRefaccionVacia();
    this.proveedorSeleccionado = '';
    this.mostrarInputProveedor = false;
  }

  abrirModalReporte(mantenimiento: Mantenimiento): void {
    this.mantenimientoParaReporte = mantenimiento;
    this.trabajoRealizado = '';
    this.observacionesFinal = '';
    this.mostrarModalReporte = true;
  }

  cerrarModalReporte(): void {
    this.mostrarModalReporte = false;
    this.mantenimientoParaReporte = null;
    this.trabajoRealizado = '';
    this.observacionesFinal = '';
  }

  // ============ FILTROS INTELIGENTES ============
  get equiposFiltrados(): Equipo[] {
    if (!this.nuevoMantenimiento.id_area) {
      return this.equipos;
    }
    return this.equipos.filter(e => e.id_area === this.nuevoMantenimiento.id_area);
  }

  onAreaChange(): void {
    // Al cambiar área, limpiar equipo si ya no pertenece a esa área
    if (this.nuevoMantenimiento.id_equipo) {
      const equipoSeleccionado = this.equipos.find(e => e.id_equipo === this.nuevoMantenimiento.id_equipo);
      if (equipoSeleccionado && equipoSeleccionado.id_area !== this.nuevoMantenimiento.id_area) {
        this.nuevoMantenimiento.id_equipo = '';
      }
    }
  }

  onEquipoChange(): void {
    // Al seleccionar equipo, llenar área automáticamente
    const equipoSeleccionado = this.equipos.find(e => e.id_equipo === this.nuevoMantenimiento.id_equipo);
    if (equipoSeleccionado && equipoSeleccionado.id_area) {
      this.nuevoMantenimiento.id_area = equipoSeleccionado.id_area;
    }
  }

  // ============ ORDEN DE TRABAJO ============
  async generarOrdenTrabajo(mantenimiento: Mantenimiento): Promise<void> {
    if (!mantenimiento.id_mantenimiento) return;

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDEN DE TRABAJO', 105, 20, { align: 'center' });

      // Info del mantenimiento
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let y = 40;

      doc.text(`Folio: ${mantenimiento.id_mantenimiento}`, 20, y);
      y += 10;
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 20, y);
      y += 10;
      doc.text(`Prioridad: ${mantenimiento.prioridad?.toUpperCase()}`, 20, y);
      y += 15;

      // Detalles del equipo
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DEL EQUIPO:', 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(`Equipo: ${this.getNombreEquipo(mantenimiento.id_equipo)}`, 20, y);
      y += 8;
      doc.text(`Área: ${this.getNombreArea(mantenimiento.id_area)}`, 20, y);
      y += 8;
      doc.text(`Tipo: ${this.getNombreTipo(mantenimiento.id_tipo)}`, 20, y);
      y += 15;

      // Descripción del trabajo
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPCIÓN DEL TRABAJO:', 20, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      
      const descripcion = mantenimiento.descripcion || 'Sin descripción';
      const lineasDescripcion = doc.splitTextToSize(descripcion, 170);
      doc.text(lineasDescripcion, 20, y);
      y += (lineasDescripcion.length * 7) + 15;

      // Espacios para firmas
      y = 220;
      doc.setFont('helvetica', 'bold');
      doc.line(20, y, 80, y);
      doc.text('Recibió', 50, y + 7, { align: 'center' });

      doc.line(120, y, 180, y);
      doc.text('Autorizó', 150, y + 7, { align: 'center' });

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Hotel HB - Sistema de Gestión de Mantenimiento', 105, 280, { align: 'center' });

      // Guardar y actualizar estado
      doc.save(`orden-trabajo-${mantenimiento.id_mantenimiento}.pdf`);

      // Actualizar estado a orden_generada
      await this.apiService.updateMantenimiento(mantenimiento.id_mantenimiento, {
        estado: 'orden_generada',
        orden_trabajo_generada: true
      });

      this.mostrarMensaje('Orden de trabajo generada correctamente', 'success');
      await this.cargarMantenimientos();
    } catch (error) {
      console.error('Error generando orden de trabajo:', error);
      this.mostrarMensaje('Error al generar orden de trabajo', 'error');
    }
  }

  // ============ MANTENIMIENTOS ============
  async guardarMantenimiento(): Promise<void> {
    if (!this.nuevoMantenimiento.id_equipo || !this.nuevoMantenimiento.id_area || !this.nuevoMantenimiento.id_tipo) {
      this.mostrarMensaje('Por favor completa todos los campos requeridos', 'warning');
      return;
    }
    
    try {
      if (this.modoEdicion && this.mantenimientoEditando?.id_mantenimiento) {
        await this.apiService.updateMantenimiento(
          this.mantenimientoEditando.id_mantenimiento,
          this.nuevoMantenimiento
        );
        this.mostrarMensaje('Mantenimiento actualizado correctamente', 'success');
      } else {
        // Crear mantenimiento
        const mantCreado = await this.apiService.createMantenimiento(this.nuevoMantenimiento);
        
        // 🔥 SINCRONIZAR CON CALENDARIO
        if (this.nuevoMantenimiento.fecha_programada) {
          const equipo = this.equipos.find(e => e.id_equipo === this.nuevoMantenimiento.id_equipo);
          await this.apiService.createCalendario({
            titulo: `Mantenimiento: ${equipo?.nombre || 'Equipo'}`,
            descripcion: this.nuevoMantenimiento.descripcion || '',
            id_equipo: this.nuevoMantenimiento.id_equipo,
            id_area: this.nuevoMantenimiento.id_area,
            id_tipo: this.nuevoMantenimiento.id_tipo,
            fecha: this.nuevoMantenimiento.fecha_programada,
            hora: '09:00',
            estado: 'programado',
            prioridad: this.nuevoMantenimiento.prioridad || 'media',
            recurrente: false
          });
        }
        
        this.mostrarMensaje('Mantenimiento creado y agregado al calendario', 'success');
      }
      await this.cargarMantenimientos();
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando mantenimiento:', error);
      this.mostrarMensaje('Error al guardar mantenimiento', 'error');
    }
  }

  async eliminarMantenimiento(id: string): Promise<void> {
    try {
      await this.apiService.deleteMantenimiento(id);
      this.mostrarMensaje('Mantenimiento eliminado correctamente', 'success');
      await this.cargarMantenimientos();
    } catch (error) {
      console.error('Error eliminando mantenimiento:', error);
      this.mostrarMensaje('Error al eliminar mantenimiento', 'error');
    }
  }

  async iniciarMantenimiento(mantenimiento: Mantenimiento): Promise<void> {
    if (!mantenimiento.id_mantenimiento) return;
    
    try {
      await this.apiService.updateMantenimiento(mantenimiento.id_mantenimiento, {
        estado: 'activo',
        fecha_inicio: new Date()
      });
      this.mostrarMensaje('Mantenimiento iniciado', 'success');
      await this.cargarMantenimientos();
    } catch (error) {
      console.error('Error iniciando mantenimiento:', error);
      this.mostrarMensaje('Error al iniciar mantenimiento', 'error');
    }
  }

  async finalizarMantenimiento(): Promise<void> {
    if (!this.mantenimientoParaReporte?.id_mantenimiento) return;
    
    if (!this.trabajoRealizado.trim()) {
      this.mostrarMensaje('Por favor describe el trabajo realizado', 'warning');
      return;
    }
    
    try {
      await this.apiService.updateMantenimiento(this.mantenimientoParaReporte.id_mantenimiento, {
        estado: 'completado',
        fecha_completado: new Date(),
        trabajo_realizado: this.trabajoRealizado,
        observaciones: this.observacionesFinal
      });
      
      this.mostrarMensaje('Mantenimiento finalizado correctamente', 'success');
      await this.cargarMantenimientos();
      this.cerrarModalReporte();
    } catch (error) {
      console.error('Error finalizando mantenimiento:', error);
      this.mostrarMensaje('Error al finalizar mantenimiento', 'error');
    }
  }

  // ============ REFACCIONES ============
  async cargarRefacciones(idMantenimiento: string): Promise<void> {
    try {
      this.refacciones = await this.apiService.getRefacciones(idMantenimiento);
    } catch (error) {
      console.error('Error cargando refacciones:', error);
    }
  }

  onProveedorChange(): void {
    if (this.proveedorSeleccionado === 'nuevo') {
      this.mostrarInputProveedor = true;
      this.nuevaRefaccion.proveedor = '';
    } else {
      this.mostrarInputProveedor = false;
      this.nuevaRefaccion.proveedor = this.proveedorSeleccionado;
    }
  }

  async agregarRefaccion(): Promise<void> {
    if (!this.mantenimientoParaRefacciones?.id_mantenimiento) return;
    if (!this.nuevaRefaccion.nombre) {
      this.mostrarMensaje('Por favor ingresa el nombre de la refacción', 'warning');
      return;
    }

    this.nuevaRefaccion.id_mantenimiento = this.mantenimientoParaRefacciones.id_mantenimiento;

    try {
      await this.apiService.createRefaccion(this.nuevaRefaccion);
      await this.cargarRefacciones(this.mantenimientoParaRefacciones.id_mantenimiento);
      await this.cargarProveedores();
      this.nuevaRefaccion = this.getRefaccionVacia();
      this.proveedorSeleccionado = '';
      this.mostrarInputProveedor = false;
      this.mostrarMensaje('Refacción agregada correctamente', 'success');
    } catch (error) {
      console.error('Error agregando refacción:', error);
      this.mostrarMensaje('Error al agregar refacción', 'error');
    }
  }

  async eliminarRefaccion(refaccion: Refaccion): Promise<void> {
    if (!refaccion.id_refaccion) return;
    
    try {
      await this.apiService.deleteRefaccion(refaccion.id_refaccion);
      await this.cargarRefacciones(this.mantenimientoParaRefacciones!.id_mantenimiento!);
      this.mostrarMensaje('Refacción eliminada', 'success');
    } catch (error) {
      console.error('Error eliminando refacción:', error);
      this.mostrarMensaje('Error al eliminar refacción', 'error');
    }
  }

  getTotalRefacciones(): number {
    return this.refacciones.reduce((total, ref) => {
      return total + (ref.cantidad * (ref.precio_unitario || 0));
    }, 0);
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
      
      const allMantenimientos = await this.apiService.getMantenimientos();
      
      let mantenimientosFiltrados = allMantenimientos;
      
      if (!this.isAdmin) {
        mantenimientosFiltrados = allMantenimientos.filter(m => 
          m.id_usuario_asignado === user?.id
        );
      }

      this.mantenimientosHistorial = mantenimientosFiltrados.filter(m => {
        if (!m.fecha_inicio && !m.fecha_completado) return false;
        
        const fecha = m.fecha_completado || m.fecha_inicio;
        if (!fecha) return false;

        const fechaMantenimiento = fecha.toDate ? fecha.toDate() : new Date(fecha);
        fechaMantenimiento.setHours(0, 0, 0, 0);
        fechaSeleccionada.setHours(0, 0, 0, 0);

        return fechaMantenimiento.getTime() === fechaSeleccionada.getTime();
      });

    } catch (error) {
      console.error('Error cargando historial:', error);
      this.mostrarMensaje('Error al cargar historial', 'error');
    }
  }

  async generarReporteDiario(): Promise<void> {
    if (this.mantenimientosHistorial.length === 0) {
      this.mostrarMensaje('No hay mantenimientos para generar reporte', 'warning');
      return;
    }

    try {
      const doc = new jsPDF();
      const user = this.authService.getCurrentUser();

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DIARIO DE MANTENIMIENTOS', 105, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Técnico: ${user?.nombre}`, 20, 30);
      doc.text(`Fecha: ${new Date(this.fechaHistorial).toLocaleDateString('es-MX')}`, 20, 38);
      doc.text(`Total de trabajos: ${this.mantenimientosHistorial.length}`, 20, 46);

      const datos = this.mantenimientosHistorial.map((m, index) => [
        (index + 1).toString(),
        this.getNombreEquipo(m.id_equipo),
        this.getNombreArea(m.id_area),
        m.estado || '',
        m.trabajo_realizado ? 'Sí' : 'No'
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['#', 'Equipo', 'Área', 'Estado', 'Completado']],
        body: datos,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });

      doc.save(`reporte-diario-${this.fechaHistorial}.pdf`);
      this.mostrarMensaje('Reporte generado correctamente', 'success');
    } catch (error) {
      console.error('Error generando reporte:', error);
      this.mostrarMensaje('Error al generar reporte', 'error');
    }
  }

  // ============ GENERAR PDF COMPLETO ============
  async generarPDFCompleto(mantenimiento: Mantenimiento): Promise<void> {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Mantenimiento', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    let y = 30;
    
    doc.text(`ID: ${mantenimiento.id_mantenimiento}`, 20, y);
    y += 10;
    doc.text(`Equipo: ${this.getNombreEquipo(mantenimiento.id_equipo)}`, 20, y);
    y += 10;
    doc.text(`Área: ${this.getNombreArea(mantenimiento.id_area)}`, 20, y);
    y += 10;
    doc.text(`Tipo: ${this.getNombreTipo(mantenimiento.id_tipo)}`, 20, y);
    y += 10;
    doc.text(`Descripción: ${mantenimiento.descripcion || 'N/A'}`, 20, y);
    y += 10;
    doc.text(`Prioridad: ${mantenimiento.prioridad}`, 20, y);
    y += 10;
    doc.text(`Estado: ${mantenimiento.estado}`, 20, y);
    y += 10;

    if (mantenimiento.trabajo_realizado) {
      doc.text(`Trabajo Realizado: ${mantenimiento.trabajo_realizado}`, 20, y);
      y += 10;
    }

    y += 5;

    try {
      const refacciones = await this.apiService.getRefacciones(mantenimiento.id_mantenimiento!);

      if (refacciones.length > 0) {
        doc.text('Refacciones:', 20, y);
        y += 10;

        const refaccionesData = refacciones.map(r => [
          r.nombre,
          r.cantidad.toString(),
          `$${r.precio_unitario?.toFixed(2) || '0.00'}`,
          `$${((r.cantidad * (r.precio_unitario || 0))).toFixed(2)}`,
          r.proveedor || 'N/A'
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Refacción', 'Cantidad', 'Precio Unit.', 'Total', 'Proveedor']],
          body: refaccionesData,
        });

        const total = refacciones.reduce((sum, r) => sum + (r.cantidad * (r.precio_unitario || 0)), 0);
        y = (doc as any).lastAutoTable.finalY + 10;
        doc.text(`Total: $${total.toFixed(2)}`, 20, y);
      }
    } catch (error) {
      console.error('Error cargando refacciones para PDF:', error);
    }

    doc.save(`mantenimiento-${mantenimiento.id_mantenimiento}.pdf`);
  }

  // ============ HELPERS ============
  getNombreArea(idArea?: string): string {
    if (!idArea) return 'Sin área';
    const area = this.areas.find(a => a.id_area === idArea);
    return area ? area.nombre : 'Sin área';
  }

  getNombreTipo(idTipo?: string): string {
    if (!idTipo) return 'Sin tipo';
    const tipo = this.tipos.find(t => t.id_tipo === idTipo);
    return tipo ? tipo.nombre : 'Sin tipo';
  }

  getNombreEquipo(idEquipo?: string): string {
    if (!idEquipo) return 'Sin equipo';
    const equipo = this.equipos.find(e => e.id_equipo === idEquipo);
    return equipo ? equipo.nombre : 'Sin equipo';
  }

  getBadgeClass(estado?: string): string {
    switch (estado) {
      case 'programado': return 'bg-secondary';
      case 'orden_generada': return 'bg-info';
      case 'activo': return 'bg-warning text-dark';
      case 'completado': return 'bg-success';
      default: return 'bg-secondary';
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

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info'): void {
    this.mensajeAlerta = mensaje;
    this.tipoAlerta = tipo;
    this.mostrarAlerta = true;
  }

  cerrarAlerta(): void {
    this.mostrarAlerta = false;
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