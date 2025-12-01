import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { 
  Area, 
  Tipo, 
  Equipo, 
  Mantenimiento, 
  Refaccion,
  Incidente,
  // HorarioSemanal, //eliminar calendario del api service (Que no sea aleatorio los incidentes de las amas de llaves)
  MantenimientoCalendario 
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private db;

  constructor(private firebaseService: FirebaseService) {
    this.db = this.firebaseService.getDb();
  }

  // ============ ÁREAS ============
  async getAreas(): Promise<Area[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'areas'));
      
      const areas = querySnapshot.docs.map(doc => ({
        id_area: doc.id,
        ...doc.data()
      } as Area));

      return areas.sort((a, b) => {
        const nombreA = a.nombre || '';
        const nombreB = b.nombre || '';
        return nombreA.localeCompare(nombreB);
      });
    } catch (error) {
      console.error('Error getting areas:', error);
      return [];
    }
  }

  async createArea(area: Area): Promise<Area> {
    const docRef = await addDoc(collection(this.db, 'areas'), {
      nombre: area.nombre,
      descripcion: area.descripcion || '',
      created_at: Timestamp.now()
    });

    return { id_area: docRef.id, ...area };
  }

  async updateArea(id: string, area: Partial<Area>): Promise<Area> {
    const docRef = doc(this.db, 'areas', id);
    await updateDoc(docRef, { ...area });
    return { id_area: id, ...area } as Area;
  }

  async deleteArea(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'areas', id));
  }

  // ============ TIPOS ============
  async getTipos(): Promise<Tipo[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'tipos'));
      
      const tipos = querySnapshot.docs.map(doc => ({
        id_tipo: doc.id,
        ...doc.data()
      } as Tipo));

      return tipos.sort((a, b) => {
        const nombreA = a.nombre || '';
        const nombreB = b.nombre || '';
        return nombreA.localeCompare(nombreB);
      });
    } catch (error) {
      console.error('Error getting tipos:', error);
      return [];
    }
  }

  async createTipo(tipo: Tipo): Promise<Tipo> {
    const docRef = await addDoc(collection(this.db, 'tipos'), {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      created_at: Timestamp.now()
    });

    return { id_tipo: docRef.id, ...tipo };
  }

  async updateTipo(id: string, tipo: Partial<Tipo>): Promise<Tipo> {
    const docRef = doc(this.db, 'tipos', id);
    await updateDoc(docRef, { ...tipo });
    return { id_tipo: id, ...tipo } as Tipo;
  }

  async deleteTipo(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'tipos', id));
  }

  // ============ EQUIPOS ============
  async getEquipos(): Promise<Equipo[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'equipos'));
      
      const equipos = querySnapshot.docs.map(doc => ({
        id_equipo: doc.id,
        ...doc.data()
      } as Equipo));

      return equipos.sort((a, b) => {
        const nombreA = a.nombre || '';
        const nombreB = b.nombre || '';
        return nombreA.localeCompare(nombreB);
      });
    } catch (error) {
      console.error('Error getting equipos:', error);
      return [];
    }
  }

  async createEquipo(equipo: Equipo): Promise<Equipo> {
    const docRef = await addDoc(collection(this.db, 'equipos'), {
      nombre: equipo.nombre,
      marca: equipo.marca || '',
      modelo: equipo.modelo || '',
      numero_serie: equipo.numero_serie || '',
      id_area: equipo.id_area,
      id_tipo: equipo.id_tipo,
      created_at: Timestamp.now()
    });

    return { id_equipo: docRef.id, ...equipo };
  }

  async updateEquipo(id: string, equipo: Partial<Equipo>): Promise<Equipo> {
    const docRef = doc(this.db, 'equipos', id);
    await updateDoc(docRef, { ...equipo });
    return { id_equipo: id, ...equipo } as Equipo;
  }

  async deleteEquipo(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'equipos', id));
  }

  // ============ MANTENIMIENTOS ============
  async getMantenimientos(): Promise<Mantenimiento[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'mantenimientos'));
      
      return querySnapshot.docs.map(doc => ({
        id_mantenimiento: doc.id,
        ...doc.data()
      } as Mantenimiento));
    } catch (error) {
      console.error('Error getting mantenimientos:', error);
      return [];
    }
  }

  async createMantenimiento(mantenimiento: Mantenimiento): Promise<Mantenimiento> {
    const docRef = await addDoc(collection(this.db, 'mantenimientos'), {
      ...mantenimiento,
      fecha_solicitud: Timestamp.now(),
      created_at: Timestamp.now()
    });

    return { id_mantenimiento: docRef.id, ...mantenimiento };
  }

  async updateMantenimiento(id: string, mantenimiento: Partial<Mantenimiento>): Promise<Mantenimiento> {
    const docRef = doc(this.db, 'mantenimientos', id);
    await updateDoc(docRef, { ...mantenimiento });
    return { id_mantenimiento: id, ...mantenimiento } as Mantenimiento;
  }

  // 🔥 ELIMINAR MANTENIMIENTO Y SUS EVENTOS EN CALENDARIO
  async deleteMantenimiento(id: string): Promise<void> {
    try {
      // 1. Eliminar el mantenimiento
      await deleteDoc(doc(this.db, 'mantenimientos', id));
      
      // 2. BUSCAR Y ELIMINAR EVENTOS RELACIONADOS EN CALENDARIO
      const calendarioQuery = query(
        collection(this.db, 'calendario'),
        where('id_mantenimiento', '==', id)
      );
      
      const calendarioSnapshot = await getDocs(calendarioQuery);
      
      // Eliminar todos los eventos relacionados
      const deletePromises = calendarioSnapshot.docs.map(docSnapshot => 
        deleteDoc(docSnapshot.ref)
      );
      
      await Promise.all(deletePromises);
      
      console.log(`✅ Mantenimiento ${id} y ${calendarioSnapshot.size} evento(s) en calendario eliminados`);
    } catch (error) {
      console.error('Error eliminando mantenimiento:', error);
      throw error;
    }
  }

  // ============ REFACCIONES ============
  async getRefacciones(idMantenimiento: string): Promise<Refaccion[]> {
    try {
      const q = query(
        collection(this.db, 'refacciones'),
        where('id_mantenimiento', '==', idMantenimiento)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id_refaccion: doc.id,
        ...doc.data()
      } as Refaccion));
    } catch (error) {
      console.error('Error getting refacciones:', error);
      return [];
    }
  }

  async createRefaccion(refaccion: Refaccion): Promise<Refaccion> {
    const docRef = await addDoc(collection(this.db, 'refacciones'), {
      ...refaccion,
      created_at: Timestamp.now()
    });

    return { id_refaccion: docRef.id, ...refaccion };
  }

  async deleteRefaccion(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'refacciones', id));
  }

  async getProveedores(): Promise<string[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'refacciones'));
      const proveedores = new Set<string>();
      
      querySnapshot.docs.forEach(doc => {
        const proveedor = doc.data()['proveedor'];
        if (proveedor) {
          proveedores.add(proveedor);
        }
      });

      return Array.from(proveedores);
    } catch (error) {
      console.error('Error getting proveedores:', error);
      return [];
    }
  }

  // ============ INCIDENTES (AMA DE LLAVES) ============
  async getIncidentes(): Promise<Incidente[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'incidentes'));
      
      const incidentes = querySnapshot.docs.map(doc => ({
        id_incidente: doc.id,
        ...doc.data()
      } as Incidente));
      
      return incidentes.sort((a, b) => {
        const fechaA = a.fecha_reporte?.toDate ? a.fecha_reporte.toDate() : new Date(a.fecha_reporte);
        const fechaB = b.fecha_reporte?.toDate ? b.fecha_reporte.toDate() : new Date(b.fecha_reporte);
        return fechaB.getTime() - fechaA.getTime();
      });
    } catch (error) {
      console.error('Error getting incidentes:', error);
      return [];
    }
  }

  async getIncidentesByAma(idAma: string): Promise<Incidente[]> {
    try {
      const q = query(
        collection(this.db, 'incidentes'),
        where('id_ama_llaves', '==', idAma)
      );
      const querySnapshot = await getDocs(q);
      
      const incidentes = querySnapshot.docs.map(doc => ({
        id_incidente: doc.id,
        ...doc.data()
      } as Incidente));
      
      return incidentes.sort((a, b) => {
        const fechaA = a.fecha_reporte?.toDate ? a.fecha_reporte.toDate() : new Date(a.fecha_reporte);
        const fechaB = b.fecha_reporte?.toDate ? b.fecha_reporte.toDate() : new Date(b.fecha_reporte);
        return fechaB.getTime() - fechaA.getTime();
      });
    } catch (error) {
      console.error('Error getting incidentes by ama:', error);
      return [];
    }
  }

  async getIncidentesByMantenimiento(idMant: string): Promise<Incidente[]> {
    try {
      const q = query(
        collection(this.db, 'incidentes'),
        where('id_mantenimiento_asignado', '==', idMant)
      );
      const querySnapshot = await getDocs(q);
      
      const incidentes = querySnapshot.docs.map(doc => ({
        id_incidente: doc.id,
        ...doc.data()
      } as Incidente));
      
      return incidentes.sort((a, b) => {
        const fechaA = a.fecha_reporte?.toDate ? a.fecha_reporte.toDate() : new Date(a.fecha_reporte);
        const fechaB = b.fecha_reporte?.toDate ? b.fecha_reporte.toDate() : new Date(b.fecha_reporte);
        return fechaB.getTime() - fechaA.getTime();
      });
    } catch (error) {
      console.error('Error getting incidentes by mantenimiento:', error);
      return [];
    }
  }

  async getIncidentesPendientes(): Promise<Incidente[]> {
    try {
      const q = query(
        collection(this.db, 'incidentes'),
        where('estado', '==', 'pendiente')
      );
      const querySnapshot = await getDocs(q);
      
      const incidentes = querySnapshot.docs.map(doc => ({
        id_incidente: doc.id,
        ...doc.data()
      } as Incidente));
      
      return incidentes.sort((a, b) => {
        const fechaA = a.fecha_reporte?.toDate ? a.fecha_reporte.toDate() : new Date(a.fecha_reporte);
        const fechaB = b.fecha_reporte?.toDate ? b.fecha_reporte.toDate() : new Date(b.fecha_reporte);
        return fechaB.getTime() - fechaA.getTime();
      });
    } catch (error) {
      console.error('Error getting incidentes pendientes:', error);
      return [];
    }
  }

  // async createIncidente(incidente: Incidente): Promise<Incidente> {
  //   const docRef = await addDoc(collection(this.db, 'incidentes'), {
  //     ...incidente,
  //     fecha_reporte: Timestamp.now(),
  //     created_at: Timestamp.now()
  //   });

  //   return { id_incidente: docRef.id, ...incidente };
  // }


  // async createIncidente(incidente: Incidente): Promise<Incidente> {
  //   const docRef = await addDoc(collection(this.db, 'incidentes'), {
  //     ...incidente,
  //     estado: 'pendiente', // 🆕 Siempre inicia en pendiente
  //     id_mantenimiento_asignado: null, // 🆕 Sin asignar hasta que alguien lo tome
  //     nombre_mantenimiento_asignado: null,
  //     fecha_reporte: Timestamp.now(),
  //     created_at: Timestamp.now()
  //   });

  //   return { id_incidente: docRef.id, ...incidente };
  // }
  async createIncidente(incidente: Incidente): Promise<Incidente> {
    const docRef = await addDoc(collection(this.db, 'incidentes'), {
      area: incidente.area,
      ubicacion: incidente.ubicacion || '',
      es_habitacion: incidente.es_habitacion !== undefined ? incidente.es_habitacion : true,
      numero_habitacion: incidente.numero_habitacion || '',
      piso: incidente.piso || '',
      descripcion: incidente.descripcion,
      prioridad: incidente.prioridad || 'media',
      estado: 'pendiente',
      id_ama_llaves: incidente.id_ama_llaves,
      nombre_ama_llaves: incidente.nombre_ama_llaves,
      // 🔥 NO GUARDAR ESTOS CAMPOS SI ESTÁN VACÍOS (para evitar null)
      ...(incidente.id_mantenimiento_asignado && { id_mantenimiento_asignado: incidente.id_mantenimiento_asignado }),
      ...(incidente.nombre_mantenimiento_asignado && { nombre_mantenimiento_asignado: incidente.nombre_mantenimiento_asignado }),
      fecha_reporte: Timestamp.now(),
      created_at: Timestamp.now()
    });

    return { id_incidente: docRef.id, ...incidente };
  }

  async updateIncidente(id: string, incidente: Partial<Incidente>): Promise<Incidente> {
    const docRef = doc(this.db, 'incidentes', id);
    await updateDoc(docRef, { ...incidente });
    return { id_incidente: id, ...incidente } as Incidente;
  }

  async deleteIncidente(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'incidentes', id));
  }


  // ============ CALENDARIO DE MANTENIMIENTOS ============
  async getCalendario(): Promise<MantenimientoCalendario[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'calendario'));
      
      const eventos = querySnapshot.docs.map(doc => ({
        id_calendario: doc.id,
        ...doc.data()
      } as MantenimientoCalendario));

      return eventos.sort((a, b) => {
        const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
        const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
        return fechaA.getTime() - fechaB.getTime();
      });
    } catch (error) {
      console.error('Error getting calendario:', error);
      return [];
    }
  }

  async createCalendario(calendario: MantenimientoCalendario): Promise<MantenimientoCalendario> {
    try {
      const docRef = await addDoc(collection(this.db, 'calendario'), {
        ...calendario,
        created_at: Timestamp.now()
      });
      return {
        ...calendario,
        id_calendario: docRef.id
      };
    } catch (error) {
      console.error('Error creando evento calendario:', error);
      throw error;
    }
  }

  async updateCalendario(id: string, evento: Partial<MantenimientoCalendario>): Promise<MantenimientoCalendario> {
    const docRef = doc(this.db, 'calendario', id);
    await updateDoc(docRef, { ...evento });
    return { id_calendario: id, ...evento } as MantenimientoCalendario;
  }

  async deleteCalendario(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'calendario', id));
  }

  // ============ OBTENER USUARIOS ============
  async getUsuarios(): Promise<any[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'usuarios'));
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting usuarios:', error);
      return [];
    }
  }

  // ============ OBTENER USUARIOS POR ROL ============
  async getUsuariosByRol(rol: string): Promise<any[]> {
    try {
      const q = query(
        collection(this.db, 'usuarios'),
        where('rol', '==', rol),
        where('activo', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting usuarios by rol:', error);
      return [];
    }
  }

  async getMantenimientoDisponibles(fecha: Date): Promise<any[]> {
    try {
      const usuarios = await this.getUsuariosByRol('mantenimiento');
      return usuarios;
    } catch (error) {
      console.error('Error getting mantenimiento disponibles:', error);
      return [];
    }
  }

  // ============ ASIGNACIÓN EQUITATIVA (SOLO UNO) ============
  async asignarMantenimientoAleatorio(incidente: Incidente): Promise<string | null> {
    try {
      const disponibles = await this.getMantenimientoDisponibles(new Date());
      
      if (disponibles.length === 0) {
        console.warn('No hay personal de mantenimiento disponible');
        return null;
      }

      const incidentesActivos = await this.getIncidentes();
      const incidentesSinCompletar = incidentesActivos.filter(inc => 
        inc.estado === 'pendiente' || inc.estado === 'en_proceso'
      );

      const cargaTrabajo: { [key: string]: number } = {};
      
      disponibles.forEach(trabajador => {
        cargaTrabajo[trabajador.id] = 0;
      });

      incidentesSinCompletar.forEach(inc => {
        if (inc.id_mantenimiento_asignado && cargaTrabajo[inc.id_mantenimiento_asignado] !== undefined) {
          cargaTrabajo[inc.id_mantenimiento_asignado]++;
        }
      });

      let trabajadorSeleccionado = disponibles[0];
      let menorCarga = cargaTrabajo[disponibles[0].id];

      disponibles.forEach(trabajador => {
        if (cargaTrabajo[trabajador.id] < menorCarga) {
          menorCarga = cargaTrabajo[trabajador.id];
          trabajadorSeleccionado = trabajador;
        }
      });

      console.log('📊 Carga de trabajo:', cargaTrabajo);
      console.log('✅ Seleccionado:', trabajadorSeleccionado.nombre, 'con', menorCarga, 'incidentes');

      if (incidente.id_incidente) {
        await this.updateIncidente(incidente.id_incidente, {
          id_mantenimiento_asignado: trabajadorSeleccionado.id,
          nombre_mantenimiento_asignado: trabajadorSeleccionado.nombre
        });
      }

      return trabajadorSeleccionado.id;
    } catch (error) {
      console.error('Error asignando mantenimiento:', error);
      return null;
    }
  }
}