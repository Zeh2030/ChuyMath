import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '../services/firebase';

const AuthContext = createContext();

const ACTIVE_KEY = 'chuymath_active_profile';
const ADMIN_EMAIL = 'jesuscarrillog@gmail.com';

// Campos por defecto de un perfil de hijo nuevo.
const perfilPorDefecto = (ownerUid, datos = {}) => ({
  ownerUid,
  nombre: (datos.nombre || 'Nuevo jugador').trim(),
  avatar: datos.avatar || '🦸',
  tema: datos.tema || 'aventurero',
  racha: 0,
  ultimaVisita: null,
  habilidades: {},
  misionesCompletadas: [],
  aventurasProgreso: {},
  simulacros: [],
  createdAt: new Date(),
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cuentaAutorizada, setCuentaAutorizada] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [activeProfileId, setActiveProfileId] = useState(null);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // 1) Observador de auth: valida autorización, crea la cuenta del adulto (accounts/{uid})
  //    y migra un perfil legacy (profiles/{uid} sin ownerUid) para adoptarlo como hijo.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = (user.email || '').toLowerCase();
        const esAdmin = email === ADMIN_EMAIL;

        // Autorización: whitelist o admin
        let autorizado = esAdmin;
        try {
          if (!autorizado) {
            const wl = await getDoc(doc(db, 'whitelist', email));
            autorizado = wl.exists();
          }
        } catch (e) {
          console.warn('No se pudo verificar whitelist:', e);
        }
        setCuentaAutorizada(autorizado);

        if (autorizado) {
          try {
            // Cuenta del adulto (una por cuenta de Google)
            const accRef = doc(db, 'accounts', user.uid);
            const accSnap = await getDoc(accRef);
            if (!accSnap.exists()) {
              await setDoc(accRef, {
                email: user.email,
                displayName: user.displayName || null,
                photoURL: user.photoURL || null,
                esAdmin,
                createdAt: new Date(),
              });
            }

            // Migración automática: perfil legacy en profiles/{uid} sin ownerUid → adoptarlo.
            const legacyRef = doc(db, 'profiles', user.uid);
            const legacySnap = await getDoc(legacyRef);
            if (legacySnap.exists() && !legacySnap.data().ownerUid) {
              await updateDoc(legacyRef, { ownerUid: user.uid });
            }
          } catch (e) {
            console.error('Error en bootstrap/migración de cuenta:', e);
          }
        }
      } else {
        setCuentaAutorizada(false);
      }

      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 2) Suscripción en tiempo real a los perfiles (hijos) de la cuenta activa.
  useEffect(() => {
    if (!currentUser) {
      setProfiles([]);
      setProfilesLoading(false);
      setActiveProfileId(null);
      return;
    }

    setProfilesLoading(true);
    const q = query(collection(db, 'profiles'), where('ownerUid', '==', currentUser.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProfiles(lista);
        setProfilesLoading(false);

        // Resolver perfil activo sin perder el ya elegido
        setActiveProfileId((prev) => {
          if (prev && lista.some((p) => p.id === prev)) return prev;
          const guardado = localStorage.getItem(ACTIVE_KEY);
          if (guardado && lista.some((p) => p.id === guardado)) return guardado;
          if (lista.length > 0) {
            // preferir el perfil migrado (id == uid) si existe
            const legacy = lista.find((p) => p.id === currentUser.uid);
            return (legacy || lista[0]).id;
          }
          return null;
        });
      },
      (err) => {
        console.error('Error al leer perfiles:', err);
        setProfilesLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Persistir el perfil activo (por dispositivo)
  useEffect(() => {
    if (activeProfileId) localStorage.setItem(ACTIVE_KEY, activeProfileId);
  }, [activeProfileId]);

  const switchProfile = useCallback((id) => setActiveProfileId(id), []);

  const crearPerfilHijo = useCallback(async (datos) => {
    if (!currentUser) return null;
    const ref = await addDoc(collection(db, 'profiles'), perfilPorDefecto(currentUser.uid, datos));
    setActiveProfileId(ref.id);
    return ref.id;
  }, [currentUser]);

  const borrarPerfil = useCallback(async (id) => {
    await deleteDoc(doc(db, 'profiles', id));
    setActiveProfileId((prev) => {
      if (prev !== id) return prev;
      const restantes = profiles.filter((p) => p.id !== id);
      return restantes.length ? restantes[0].id : null;
    });
  }, [profiles]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;

  const value = {
    currentUser,
    loading,
    cuentaAutorizada,
    profiles,
    profilesLoading,
    activeProfileId,
    activeProfile,
    switchProfile,
    crearPerfilHijo,
    borrarPerfil,
    signInWithGoogle,
    logout,
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
