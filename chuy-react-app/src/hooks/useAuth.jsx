import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para iniciar sesión con Google
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Observador de cambios de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Si el usuario existe, verificar si necesita crear perfil ANTES de actualizar el estado
        const userProfileRef = doc(db, "profiles", user.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (!userProfileSnap.exists()) {
          // 1. Verificar si está en la lista blanca (invitados)
          const email = user.email.toLowerCase();
          // Buscamos el documento en whitelist cuyo ID es el email
          const whitelistRef = doc(db, "whitelist", email);
          const whitelistSnap = await getDoc(whitelistRef);

          console.log(`Verificando whitelist para ${email}...`);
          console.log(`¿Existe en whitelist? ${whitelistSnap.exists()}`);
          console.log(`¿Es admin? ${email === 'jesuscarrillog@gmail.com'}`);

          // Permitir acceso si está en whitelist O es el admin supremo
          if (whitelistSnap.exists() || email === 'jesuscarrillog@gmail.com') {
            // 2. Crear perfil
            const datosInvitacion = whitelistSnap.exists() ? whitelistSnap.data() : { nombreNino: "Admin Jesús" };
            
            try {
              await setDoc(userProfileRef, {
                email: user.email,
                displayName: user.displayName, // Nombre de Google (backup)
                nombre: datosInvitacion.nombreNino, // Nombre del niño (PRIORIDAD)
                esAdmin: email === 'jesuscarrillog@gmail.com', // Flag de admin
                photoURL: user.photoURL,
                createdAt: new Date(),
                racha: 0,
                ultimaVisita: null,
                habilidades: {},
                misionesCompletadas: []
              });
              console.log(`✅ Perfil creado para ${datosInvitacion.nombreNino}`);
            } catch (error) {
              console.error('❌ Error al crear perfil:', error);
            }
          } else {
            console.warn(`⚠️ Usuario ${email} NO está autorizado en whitelist. Acceso restringido.`);
          }
        } else {
          console.log(`Perfil ya existe para ${user.uid}`);
        }
      }

      // Actualizar el estado del usuario DESPUÉS de verificar/crear el perfil
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Limpiar el observador al desmontar el componente
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  return useContext(AuthContext);
};

