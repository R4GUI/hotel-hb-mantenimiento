import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Area, Tipo, Equipo } from '../../models/interfaces';
import { ModalAlertaComponent } from '../shared/modal-alerta/modal-alerta.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalAlertaComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  // Arrays de datos
  areas: Area[] = [];
  tipos: Tipo[] = [];
  equipos: Equipo[] = [];

  // Tabs
  tabActiva: string = 'areas';

  // Modales
  mostrarModal: boolean = false;
  tipoModal: string = ''; // 'area', 'tipo', 'equipo'

  // Entidades en edición
  areaEditando: Area | null = null;
  tipoEditando: Tipo | null = null;
  equipoEditando: Equipo | null = null;

  // Formularios
  nuevaArea: Area = { nombre: '', descripcion: '' };
  nuevoTipo: Tipo = { nombre: '', descripcion: '' };
  nuevoEquipo: Equipo = { 
    nombre: '', // Se genera automáticamente
    marca: '', 
    modelo: '', 
    numero_serie: '', 
    id_area: '',
    id_tipo: '' // 🆕 NUEVO CAMPO
  };

  // Modal de confirmación
  mostrarModalConfirmacion: boolean = false;
  mensajeConfirmacion: string = '';
  tipoConfirmacion: 'success' | 'error' | 'warning' = 'success';

  // 🆕 FILTROS
  areaFiltro: string = '';
  tipoFiltro: string = ''; // 🆕 FILTRO POR TIPO

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    await this.cargarAreas();
    await this.cargarTipos();
    await this.cargarEquipos();
  }

  // ============ ÁREAS ============
  async cargarAreas(): Promise<void> {
    try {
      this.areas = await this.apiService.getAreas();
    } catch (error) {
      console.error('Error cargando áreas:', error);
    }
  }

  abrirModalArea(area?: Area): void {
    this.tipoModal = 'area';
    if (area) {
      this.areaEditando = area;
      this.nuevaArea = { ...area };
    } else {
      this.areaEditando = null;
      this.nuevaArea = { nombre: '', descripcion: '' };
    }
    this.mostrarModal = true;
  }

  async guardarArea(): Promise<void> {
    if (!this.nuevaArea.nombre || !this.nuevaArea.nombre.trim()) {
      this.mostrarAlerta('Por favor ingresa el nombre del área', 'warning');
      return;
    }

    try {
      if (this.areaEditando && this.areaEditando.id_area) {
        await this.apiService.updateArea(this.areaEditando.id_area, this.nuevaArea);
        this.mostrarAlerta('Área actualizada correctamente', 'success');
      } else {
        await this.apiService.createArea(this.nuevaArea);
        this.mostrarAlerta('Área creada correctamente', 'success');
      }
      await this.cargarAreas();
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando área:', error);
      this.mostrarAlerta('Error al guardar área', 'error');
    }
  }

  async eliminarArea(area: Area): Promise<void> {
    if (!area.id_area) return;
    
    if (confirm(`¿Estás seguro de eliminar el área "${area.nombre}"?`)) {
      try {
        await this.apiService.deleteArea(area.id_area);
        this.mostrarAlerta('Área eliminada correctamente', 'success');
        await this.cargarAreas();
      } catch (error) {
        console.error('Error eliminando área:', error);
        this.mostrarAlerta('Error al eliminar área', 'error');
      }
    }
  }

  // ============ TIPOS ============
  async cargarTipos(): Promise<void> {
    try {
      this.tipos = await this.apiService.getTipos();
    } catch (error) {
      console.error('Error cargando tipos:', error);
    }
  }

  abrirModalTipo(tipo?: Tipo): void {
    this.tipoModal = 'tipo';
    if (tipo) {
      this.tipoEditando = tipo;
      this.nuevoTipo = { ...tipo };
    } else {
      this.tipoEditando = null;
      this.nuevoTipo = { nombre: '', descripcion: '' };
    }
    this.mostrarModal = true;
  }

  async guardarTipo(): Promise<void> {
    if (!this.nuevoTipo.nombre || !this.nuevoTipo.nombre.trim()) {
      this.mostrarAlerta('Por favor ingresa el nombre del tipo', 'warning');
      return;
    }

    try {
      if (this.tipoEditando && this.tipoEditando.id_tipo) {
        await this.apiService.updateTipo(this.tipoEditando.id_tipo, this.nuevoTipo);
        this.mostrarAlerta('Tipo actualizado correctamente', 'success');
      } else {
        await this.apiService.createTipo(this.nuevoTipo);
        this.mostrarAlerta('Tipo creado correctamente', 'success');
      }
      await this.cargarTipos();
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando tipo:', error);
      this.mostrarAlerta('Error al guardar tipo', 'error');
    }
  }

  async eliminarTipo(tipo: Tipo): Promise<void> {
    if (!tipo.id_tipo) return;
    
    if (confirm(`¿Estás seguro de eliminar el tipo "${tipo.nombre}"?`)) {
      try {
        await this.apiService.deleteTipo(tipo.id_tipo);
        this.mostrarAlerta('Tipo eliminado correctamente', 'success');
        await this.cargarTipos();
      } catch (error) {
        console.error('Error eliminando tipo:', error);
        this.mostrarAlerta('Error al eliminar tipo', 'error');
      }
    }
  }

  // ============ EQUIPOS ============
  async cargarEquipos(): Promise<void> {
    try {
      this.equipos = await this.apiService.getEquipos();
    } catch (error) {
      console.error('Error cargando equipos:', error);
    }
  }

  abrirModalEquipo(equipo?: Equipo): void {
    this.tipoModal = 'equipo';
    if (equipo) {
      this.equipoEditando = equipo;
      this.nuevoEquipo = { ...equipo };
    } else {
      this.equipoEditando = null;
      this.nuevoEquipo = { 
        nombre: '', 
        marca: '', 
        modelo: '', 
        numero_serie: '', 
        id_area: '',
        id_tipo: ''
      };
    }
    this.mostrarModal = true;
  }

  async guardarEquipo(): Promise<void> {
    // Validaciones
    if (!this.nuevoEquipo.id_tipo) {
      this.mostrarAlerta('Por favor selecciona el tipo de equipo', 'warning');
      return;
    }

    if (!this.nuevoEquipo.id_area) {
      this.mostrarAlerta('Por favor selecciona un área', 'warning');
      return;
    }

    // 🔥 GENERAR NOMBRE AUTOMÁTICAMENTE
    const tipo = this.tipos.find(t => t.id_tipo === this.nuevoEquipo.id_tipo);
    const area = this.areas.find(a => a.id_area === this.nuevoEquipo.id_area);
    
    // Contar cuántos equipos de este tipo ya existen en esta área
    const equiposDelMismoTipo = this.equipos.filter(e => 
      e.id_tipo === this.nuevoEquipo.id_tipo && 
      e.id_area === this.nuevoEquipo.id_area
    ).length;
    
    const numeroConsecutivo = equiposDelMismoTipo + 1;
    
    // Nombre: "Tipo - Área - #Consecutivo"
    // Ejemplo: "Aire Acondicionado - Recepción - #1"
    this.nuevoEquipo.nombre = `${tipo?.nombre || 'Equipo'} - ${area?.nombre || 'Sin área'} - #${numeroConsecutivo}`;

    try {
      if (this.equipoEditando && this.equipoEditando.id_equipo) {
        await this.apiService.updateEquipo(this.equipoEditando.id_equipo, this.nuevoEquipo);
        this.mostrarAlerta('Equipo actualizado correctamente', 'success');
      } else {
        await this.apiService.createEquipo(this.nuevoEquipo);
        this.mostrarAlerta('Equipo creado correctamente', 'success');
      }
      await this.cargarEquipos();
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando equipo:', error);
      this.mostrarAlerta('Error al guardar equipo', 'error');
    }
  }

  async eliminarEquipo(equipo: Equipo): Promise<void> {
    if (!equipo.id_equipo) return;
    
    if (confirm(`¿Estás seguro de eliminar el equipo "${equipo.nombre}"?`)) {
      try {
        await this.apiService.deleteEquipo(equipo.id_equipo);
        this.mostrarAlerta('Equipo eliminado correctamente', 'success');
        await this.cargarEquipos();
      } catch (error) {
        console.error('Error eliminando equipo:', error);
        this.mostrarAlerta('Error al eliminar equipo', 'error');
      }
    }
  }

  // ============ FILTROS ============
  get equiposFiltrados(): Equipo[] {
    let equiposFiltrados = this.equipos;

    // Filtrar por área
    if (this.areaFiltro) {
      equiposFiltrados = equiposFiltrados.filter(e => e.id_area === this.areaFiltro);
    }

    // 🆕 Filtrar por tipo
    if (this.tipoFiltro) {
      equiposFiltrados = equiposFiltrados.filter(e => e.id_tipo === this.tipoFiltro);
    }

    return equiposFiltrados;
  }

  limpiarFiltros(): void {
    this.areaFiltro = '';
    this.tipoFiltro = '';
  }

  // ============ HELPERS ============
  cambiarTab(tab: string): void {
    this.tabActiva = tab;
    console.log('Tab cambiada a:', tab); // Para debug
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.tipoModal = '';
    this.areaEditando = null;
    this.tipoEditando = null;
    this.equipoEditando = null;
  }

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

  // Modal de confirmación
  mostrarAlerta(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.mensajeConfirmacion = mensaje;
    this.tipoConfirmacion = tipo;
    this.mostrarModalConfirmacion = true;

    setTimeout(() => {
      this.mostrarModalConfirmacion = false;
    }, 3000);
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
  }

  // ============ CONTADORES ============
  contarEquiposPorArea(idArea?: string): number {
    if (!idArea) return 0;
    return this.equipos.filter(e => e.id_area === idArea).length;
  }

  contarEquiposPorTipo(idTipo?: string): number {
    if (!idTipo) return 0;
    return this.equipos.filter(e => e.id_tipo === idTipo).length;
  }
}