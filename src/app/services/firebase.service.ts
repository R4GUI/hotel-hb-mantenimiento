import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db;

  constructor() {
    // 🔥 CAMBIA ESTAS CREDENCIALES POR LAS TUYAS
    const firebaseConfig = {
      apiKey: "AIzaSyB5MtFVjrKX5mVdqgKNMEWUTNyMQZZWbAs",
      authDomain: "hotel-mantenimiento-32194.firebaseapp.com",
      projectId: "hotel-mantenimiento-32194",
      storageBucket: "hotel-mantenimiento-32194.firebasestorage.app",
      messagingSenderId: "875926612609",
      appId: "1:875926612609:web:3ae00b23b5f598ae6dbb80"
    };

    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  getDb() {
    return this.db;
  }
}