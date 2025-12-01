import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], // ← VERIFICA ESTO
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'hotel-mantenimiento';
  
  currentUser: any = null;
  isAdmin: boolean = false;
  isMantenimiento: boolean = false;
  isAmaDeLlaves: boolean = false;
  isJefaAma: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUser();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadUser();
    });
  }

  loadUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual:', this.currentUser); // 🔍 DEBUG
    
    if (this.currentUser) {
      this.isAdmin = this.currentUser.rol === 'admin';
      this.isMantenimiento = this.currentUser.rol === 'mantenimiento';
      this.isAmaDeLlaves = this.currentUser.rol === 'amadellaves';
      
      console.log('isAdmin:', this.isAdmin); // 🔍 DEBUG
      console.log('isMantenimiento:', this.isMantenimiento); // 🔍 DEBUG
      console.log('isAmaDeLlaves:', this.isAmaDeLlaves); // 🔍 DEBUG
      console.log('isJefaAma', this.isJefaAma);
    }
  }

  isLoginPage(): boolean {
    const result = this.router.url === '/login' || this.router.url === '/';
    console.log('isLoginPage:', result, 'URL:', this.router.url); // 🔍 DEBUG
    return result;
  }

logout(): void {
    console.log('Cerrando sesión...'); // 🔍 DEBUG
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // 🔍 MÉTODO TEMPORAL PARA DEBUGGEAR
  testNavigation(path: string): void {
    console.log('🔍 Intentando navegar a:', path);
    this.router.navigate([path]).then(success => {
      console.log('✅ Navegación exitosa:', success);
    }).catch(error => {
      console.log('❌ Error navegando:', error);
    });
  }
}