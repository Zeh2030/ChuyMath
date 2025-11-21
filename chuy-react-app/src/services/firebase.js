// =============================================
// === CONFIGURACIÓN DE FIREBASE ===
// =============================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB6ain-KUCAGh3oZRxRLC66zCIzG9RkvFU",
  authDomain: "chuy-react-app.firebaseapp.com",
  projectId: "chuy-react-app",
  storageBucket: "chuy-react-app.firebasestorage.app",
  messagingSenderId: "613006563732",
  appId: "1:613006563732:web:01848db5cc908c22ccd781"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configurar proveedor de autenticación de Google
export const googleProvider = new GoogleAuthProvider();

export default app;

