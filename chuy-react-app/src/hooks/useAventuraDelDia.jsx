import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MATERIA_COLECCIONES, matchesMateria } from '../utils/materiaContent';

/**
 * Hook personalizado para obtener la próxima aventura según progresión, para
 * cualquier materia (no solo matemáticas).
 * Lógica: Muestra la más antigua SIN completar de esa materia (progresión garantizada).
 * El orden se da por `nivel` (o `misiones[0].nivel` si no hay nivel a nivel raíz,
 * caso de las canciones de piano) y si no hay ninguno, por el id del documento
 * (las aventuras de matemáticas usan una fecha como id). Si hay múltiples con la
 * misma clave de orden → selecciona aleatoriamente.
 * @param {string} userId - El UID del usuario para verificar aventuras completadas
 * @param {string} materia - La materia activa (matematicas, ingles, piano, ciencias, dibujo, geografia, letras)
 * @returns {object} - El objeto de la aventura, estado de carga y error
 */
export const useAventuraDelDia = (userId, materia) => {
  const [aventura, setAventura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarProximaAventura = async () => {
      try {
        setLoading(true);
        setError(null);

        // 0. Resolver la colección de la materia activa (con fallback defensivo)
        const materiaResuelta = MATERIA_COLECCIONES[materia] ? materia : 'matematicas';
        const coleccion = MATERIA_COLECCIONES[materiaResuelta];

        // 1. Obtener todas las aventuras disponibles de esa materia
        const aventurasRef = collection(db, coleccion);
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

        // 4. Filtrar aventuras de la materia activa que NO estén completadas
        const aventurasSinCompletar = todasLasAventuras
          .filter(av => matchesMateria(av, materiaResuelta))
          .filter(av => !aventurasCompletadasIds.includes(av.id));

        if (aventurasSinCompletar.length === 0) {
          // Todas completadas
          setAventura(null);
          console.log('¡Todas las aventuras están completadas!');
          setLoading(false);
          return;
        }

        // 5. Ordenar por nivel (o id si no hay nivel) de forma ASCENDENTE (más antigua/temprana primero)
        const obtenerClaveOrden = (item) => item.nivel || item?.misiones?.[0]?.nivel || item.id;
        aventurasSinCompletar.sort((a, b) => obtenerClaveOrden(a).localeCompare(obtenerClaveOrden(b)));

        // 6. Encontrar la clave más antigua/temprana
        const claveMasAntigua = obtenerClaveOrden(aventurasSinCompletar[0]);

        // 7. Filtrar aventuras con esa misma clave
        const aventurasMismaFecha = aventurasSinCompletar.filter(
          av => obtenerClaveOrden(av) === claveMasAntigua
        );

        // 8. Si hay múltiples con la misma clave, elegir aleatoriamente
        let aventuraSeleccionada;
        if (aventurasMismaFecha.length === 1) {
          aventuraSeleccionada = aventurasMismaFecha[0];
        } else {
          // Selección aleatoria entre las de la misma clave
          const indiceAleatorio = Math.floor(Math.random() * aventurasMismaFecha.length);
          aventuraSeleccionada = aventurasMismaFecha[indiceAleatorio];
          console.log(`Múltiples aventuras con clave ${claveMasAntigua}, seleccionada aleatoriamente:`, aventuraSeleccionada.id);
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
  }, [userId, materia]); // Se ejecuta cuando cambia el userId o la materia activa

  return { aventura, loading, error };
};

