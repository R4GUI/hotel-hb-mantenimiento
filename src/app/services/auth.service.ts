import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User } from '../models/interfaces';

// 👇 CORREGIDO: Agregar "type"
export type { User };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private firebaseService: FirebaseService
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  async login(usuario: string, password: string): Promise<any> {
    try {
      const db = this.firebaseService.getDb();
      
      const q = query(
        collection(db, 'usuarios'),
        where('username', '==', usuario),
        where('password', '==', password)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: 'Usuario o contraseña incorrectos' };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const user: User = {
        id: userDoc.id,
        nombre: userData['nombre'],
        usuario: userData['username'] || userData['usuario'],
        rol: userData['rol']
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);

      return { success: true, user };
    } catch (error: any) {
      console.error('Error en login:', error);
      return { success: false, message: error.message };
    }
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

//   isAuthenticated(): boolean {
//   if (this.currentUserSubject.value) {
//     return true;
//   }

//   const userStr = localStorage.getItem('currentUser');
//   if (userStr) {
//     try {
//       const user = JSON.parse(userStr);
//       this.currentUserSubject.next(user);
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   return false;
// }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.rol === 'admin';
  }

  isMantenimiento(): boolean {
    return this.currentUserSubject.value?.rol === 'mantenimiento';
  }

  isAmaDeLlaves(): boolean {
    return this.currentUserSubject.value?.rol === 'amadellaves';
  }
}