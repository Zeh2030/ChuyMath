import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSybDncXq7XcAu2qO9MEZh5Q5qlrw978k",
  authDomain: "dopaminedrive-c8c59.firebaseapp.com",
  projectId: "dopaminedrive-c8c59",
  storageBucket: "dopaminedrive-c8c59.firebasestorage.app",
  messagingSenderId: "806322874823",
  appId: "1:806322874823:web:c11a1c61eac28f914c11e2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;

