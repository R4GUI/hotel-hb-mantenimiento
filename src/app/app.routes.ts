import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';
import { MantenimientoComponent } from './components/mantenimiento/mantenimiento.component';
import { IncidentesComponent } from './components/incidentes/incidentes.component';
import { ParaHoyComponent } from './components/para-hoy/para-hoy.component';
import { HorariosComponent } from './components/horarios/horarios.component';
import { CalendarioComponent } from './components/calendario/calendario.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'configuracion', 
    component: ConfiguracionComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'mantenimiento', 
    component: MantenimientoComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'incidentes', 
    component: IncidentesComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'para-hoy', 
    component: ParaHoyComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'horarios', 
    component: HorariosComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'calendario', 
    component: CalendarioComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];