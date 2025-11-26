import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Mantenimiento } from '../../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  mantenimientos: Mantenimiento[] = [];
  
  totalMantenimientos: number = 0;
  programados: number = 0;
  enProceso: number = 0;
  completados: number = 0;

  isAdmin: boolean = false;
  isMantenimiento: boolean = false;
  isAmaDeLlaves: boolean = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificarRol();
    
    // Si es ama de llaves, redirigir a incidentes
    if (this.isAmaDeLlaves) {
      this.router.navigate(['/incidentes']);
      return;
    }
    
    this.cargarDatos();
  }

  verificarRol(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.rol === 'admin';
    this.isMantenimiento = user?.rol === 'mantenimiento';
    this.isAmaDeLlaves = user?.rol === 'amadellaves';
  }

  async cargarDatos(): Promise<void> {
    try {
      const user = this.authService.getCurrentUser();
      const allMantenimientos = await this.apiService.getMantenimientos();

      if (this.isAdmin) {
        this.mantenimientos = allMantenimientos;
      } else if (this.isMantenimiento) {
        this.mantenimientos = allMantenimientos.filter(m => 
          m.id_usuario_asignado === user?.id
        );
      }

      this.calcularEstadisticas();
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  calcularEstadisticas(): void {
    this.totalMantenimientos = this.mantenimientos.length;
    this.programados = this.mantenimientos.filter(m => m.estado === 'programado').length;
    this.enProceso = this.mantenimientos.filter(m => m.estado === 'activo').length;
    this.completados = this.mantenimientos.filter(m => m.estado === 'completado').length;
  }
}