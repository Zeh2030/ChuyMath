import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook personalizado para leer el perfil de un usuario desde Firestore en tiempo real
 * @param {string} userId - El UID del usuario
 * @returns {object} - El objeto del perfil del usuario y el estado de carga
 */
export const useProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Referencia al documento del perfil en Firestore
    const profileRef = doc(db, 'profiles', userId);

    // Suscripción en tiempo real a los cambios del perfil
    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile({ id: snapshot.id, ...snapshot.data() });
          setError(null);
        } else {
          setProfile(null);
          setError('Perfil no encontrado');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error al leer el perfil:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Limpiar la suscripción cuando el componente se desmonte o cambie el userId
    return () => unsubscribe();
  }, [userId]);

  return { profile, loading, error };
};

