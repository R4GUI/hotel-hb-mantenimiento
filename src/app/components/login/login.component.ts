import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async login(): Promise<void> {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const result = await this.authService.login(this.username, this.password);
      
      if (result.success) {
        // Redirigir según el rol
        const user = result.user;
        
        if (user.rol === 'amadellaves') {
          this.router.navigate(['/incidentes']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.errorMessage = result.message || 'Error al iniciar sesión';
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      this.errorMessage = 'Error al iniciar sesión';
    } finally {
      this.loading = false;
    }
  }
}