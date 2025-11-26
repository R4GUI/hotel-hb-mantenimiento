import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { HorarioSemanal, TurnoHorario } from '../../models/interfaces';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.component.html',
  styleUrl: './horarios.component.css'
})
export class HorariosComponent implements OnInit {
  horarios: HorarioSemanal[] = [];
  usuariosMantenimiento: any[] = [];
  
  mostrarModal: boolean = false;
  horarioEditando: HorarioSemanal | null = null;
  
  nuevoHorario: HorarioSemanal = this.getHorarioVacio();

  diasSemana: string[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  isAdmin: boolean = false;
  isMantenimiento: boolean = false;
  miHorario: HorarioSemanal | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    this.cargarDatos();
  }

  verificarRol(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.rol === 'admin';
    this.isMantenimiento = user?.rol === 'mantenimiento';
  }

  getHorarioVacio(): HorarioSemanal {
    return {
      id_usuario: '',
      nombre_usuario: '',
      semana_inicio: new Date(),
      semana_fin: new Date(),
      lunes: { trabaja: true, hora_entrada: '08:00', hora_salida: '16:00' },
      martes: { trabaja: true, hora_entrada: '08:00', hora_salida: '16:00' },
      miercoles: { trabaja: true, hora_entrada: '08:00', hora_salida: '16:00' },
      jueves: { trabaja: true, hora_entrada: '08:00', hora_salida: '16:00' },
      viernes: { trabaja: true, hora_entrada: '08:00', hora_salida: '16:00' },
      sabado: { trabaja: false },
      domingo: { trabaja: false }
    };
  }

  async cargarDatos(): Promise<void> {
    try {
      if (this.isAdmin) {
        this.horarios = await this.apiService.getHorarios();
        this.usuariosMantenimiento = await this.apiService.getUsuariosByRol('mantenimiento');
      } else if (this.isMantenimiento) {
        const user = this.authService.getCurrentUser();
        this.miHorario = await this.apiService.getHorarioByUsuario(user?.id || '');
      }
    } catch (error) {
      console.error('Error cargando horarios:', error);
    }
  }

  abrirModal(horario?: HorarioSemanal): void {
    if (horario) {
      this.horarioEditando = horario;
      this.nuevoHorario = JSON.parse(JSON.stringify(horario)); // Deep copy
    } else {
      this.horarioEditando = null;
      this.nuevoHorario = this.getHorarioVacio();
    }
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.horarioEditando = null;
  }

  onUsuarioChange(): void {
    const usuario = this.usuariosMantenimiento.find(u => u.id === this.nuevoHorario.id_usuario);
    if (usuario) {
      this.nuevoHorario.nombre_usuario = usuario.nombre;
    }
  }

  async guardarHorario(): Promise<void> {
    if (!this.nuevoHorario.id_usuario) {
      alert('Por favor selecciona un usuario');
      return;
    }

    try {
      if (this.horarioEditando && this.horarioEditando.id_horario) {
        await this.apiService.updateHorario(this.horarioEditando.id_horario, this.nuevoHorario);
        alert('Horario actualizado correctamente');
      } else {
        await this.apiService.createHorario(this.nuevoHorario);
        alert('Horario creado correctamente');
      }
      await this.cargarDatos();
      this.cerrarModal();
    } catch (error) {
      console.error('Error guardando horario:', error);
      alert('Error al guardar horario');
    }
  }

  async eliminarHorario(horario: HorarioSemanal): Promise<void> {
    if (!horario.id_horario) return;
    
    if (confirm(`¿Estás seguro de eliminar el horario de ${horario.nombre_usuario}?`)) {
      try {
        await this.apiService.deleteHorario(horario.id_horario);
        alert('Horario eliminado correctamente');
        await this.cargarDatos();
      } catch (error) {
        console.error('Error eliminando horario:', error);
        alert('Error al eliminar horario');
      }
    }
  }

  getTurno(horario: HorarioSemanal, dia: string): TurnoHorario {
    return (horario as any)[dia] as TurnoHorario;
  }

  setTurno(dia: string, turno: TurnoHorario): void {
    (this.nuevoHorario as any)[dia] = turno;
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
}