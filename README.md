# 🏨 Sistema de Mantenimiento - Hotel HB

Sistema completo de gestión de mantenimiento hotelero desarrollado con Angular y Firebase.

## 🚀 Características

- ✅ **Gestión de Mantenimientos**: Programación, asignación y seguimiento completo
- 🔧 **Gestión de Equipos**: Inventario por áreas y tipos
- 📋 **Reportes de Incidentes**: Sistema para amas de llaves con asignación automática equitativa
- 📅 **Calendario Responsivo**: Vista de mantenimientos programados (mobile-friendly)
- 🕐 **Gestión de Horarios**: Control de personal de mantenimiento
- 📊 **Reportes en PDF**: Generación automática de órdenes de trabajo y reportes
- 🔄 **Sincronización**: Calendario sincronizado automáticamente con mantenimientos

## 🛠️ Tecnologías

- **Frontend**: Angular 19 (Standalone Components)
- **Backend**: Firebase/Firestore
- **Autenticación**: Firebase Authentication
- **UI**: Bootstrap 5 + Bootstrap Icons
- **PDF**: jsPDF + jsPDF-AutoTable

## 📦 Instalación
```bash
# Clonar repositorio
git clone https://github.com/R4GUI/hotel-hb-mantenimiento.git

# Instalar dependencias
cd hotel-hb-mantenimiento
npm install

# Configurar Firebase
# Editar src/app/services/firebase.service.ts con tus credenciales

# Ejecutar en desarrollo
ng serve
```

## 👥 Roles de Usuario

- **Admin**: Acceso completo al sistema
- **Mantenimiento**: Gestión de mantenimientos e incidentes asignados
- **Ama de Llaves**: Reporte y seguimiento de incidentes

## 🔐 Credenciales de Prueba
```
Usuario: admin
Contraseña: hbhotel
Rol: Administrador
```

## 📋 Funcionalidades Principales

### Admin
- Configuración de áreas, tipos de equipos y equipos
- Gestión completa de mantenimientos
- Asignación manual de personal
- Calendario de mantenimientos
- Reportes y estadísticas
- Gestión de horarios de personal

### Mantenimiento
- Ver mantenimientos asignados
- Iniciar y completar trabajos
- Registrar refacciones utilizadas
- Generar reportes PDF
- Gestionar incidentes asignados

### Ama de Llaves
- Reportar incidentes
- Seguimiento de incidentes reportados
- Agregar observaciones sobre trabajos completados
- Historial de reportes

## 🎨 Características Técnicas

- Componentes standalone de Angular 19
- Diseño responsivo (Desktop, Tablet, Mobile)
- Sincronización automática con Firebase
- Asignación equitativa de incidentes
- Sistema de filtros inteligentes bidireccionales
- Generación automática de nombres de equipos
- Modo editor secreto para acciones administrativas

## 📱 Responsive Design

El sistema está optimizado para:
- 📱 Móviles (320px - 767px)
- 📱 Tablets (768px - 991px)
- 💻 Desktop (992px+)

## 📝 Estructura del Proyecto
```
src/
├── app/
│   ├── components/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── configuracion/
│   │   ├── mantenimiento/
│   │   ├── incidentes/
│   │   ├── calendario/
│   │   ├── horarios/
│   │   └── shared/
│   ├── services/
│   │   ├── firebase.service.ts
│   │   ├── api.service.ts
│   │   └── auth.service.ts
│   ├── models/
│   │   └── interfaces.ts
│   └── guards/
│       └── auth.guard.ts
└── assets/
```

## 🔒 Seguridad

- Autenticación con Firebase
- Guards de ruta por rol
- Validación de permisos en cada acción
- Protección contra acceso no autorizado

## 📄 Licencia

Proyecto privado - Hotel HB

## 👨‍💻 Desarrollador

Desarrollado por RAGUI para Hotel HB, Córdoba, Veracruz

## 🆕 Últimas Actualizaciones

- ✅ Sistema de asignación equitativa de incidentes
- ✅ Calendario responsivo con indicadores visuales
- ✅ Filtros inteligentes bidireccionales
- ✅ Sincronización automática calendario-mantenimiento
- ✅ Generación automática de nombres de equipos
- ✅ Formulario simplificado para amas de llaves