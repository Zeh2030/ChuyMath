import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook personalizado para obtener la próxima aventura según progresión cronológica
 * Lógica: Muestra la aventura más antigua SIN completar (progresión garantizada)
 * Si hay múltiples con misma fecha → selecciona aleatoriamente
 * @param {string} userId - El UID del usuario para verificar aventuras completadas
 * @returns {object} - El objeto de la aventura, estado de carga y error
 */
export const useAventuraDelDia = (userId) => {
  const [aventura, setAventura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarProximaAventura = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener todas las aventuras disponibles
        const aventurasRef = collection(db, 'aventuras');
        const querySnapshot = await getDocs(aventurasRef);
        
        if (querySnapshot.empty) {
          setAventura(null);
          console.log('No hay aventuras disponibles en Firestore.');
          setLoading(false);
          return;
        }

        // 2. Convertir a array
        const todasLasAventuras = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 3. Si hay userId, obtener aventuras completadas del perfil
        let aventurasCompletadasIds = [];
        if (userId) {
          try {
            const profileRef = doc(db, 'profiles', userId);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const misionesCompletadas = profileSnap.data().misionesCompletadas || [];
              aventurasCompletadasIds = misionesCompletadas.map(m => m.aventuraId);
            }
          } catch (profileError) {
            console.warn('Error al obtener perfil, continuando sin filtrar:', profileError);
          }
        }

        // 4. Filtrar aventuras NO completadas
        const aventurasSinCompletar = todasLasAventuras.filter(
          av => !aventurasCompletadasIds.includes(av.id)
        );

        if (aventurasSinCompletar.length === 0) {
          // Todas completadas
          setAventura(null);
          console.log('¡Todas las aventuras están completadas!');
          setLoading(false);
          return;
        }

        // 5. Ordenar por fecha (ID) de forma ASCENDENTE (más antigua primero)
        aventurasSinCompletar.sort((a, b) => a.id.localeCompare(b.id));

        // 6. Encontrar la fecha más antigua
        const fechaMasAntigua = aventurasSinCompletar[0].id;

        // 7. Filtrar aventuras con esa fecha
        const aventurasMismaFecha = aventurasSinCompletar.filter(
          av => av.id === fechaMasAntigua
        );

        // 8. Si hay múltiples con misma fecha, elegir aleatoriamente
        let aventuraSeleccionada;
        if (aventurasMismaFecha.length === 1) {
          aventuraSeleccionada = aventurasMismaFecha[0];
        } else {
          // Selección aleatoria entre las de la misma fecha
          const indiceAleatorio = Math.floor(Math.random() * aventurasMismaFecha.length);
          aventuraSeleccionada = aventurasMismaFecha[indiceAleatorio];
          console.log(`Múltiples aventuras con fecha ${fechaMasAntigua}, seleccionada aleatoriamente:`, aventuraSeleccionada.id);
        }

        setAventura(aventuraSeleccionada);
        console.log('Próxima aventura (más antigua sin completar):', aventuraSeleccionada.id);
      } catch (err) {
        console.error('Error al cargar la próxima aventura:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarProximaAventura();
  }, [userId]); // Se ejecuta cuando cambia el userId

  return { aventura, loading, error };
};

