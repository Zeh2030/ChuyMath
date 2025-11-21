import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Hook personalizado para obtener la aventura del día actual desde Firestore
 * @returns {object} - El objeto de la aventura, estado de carga y error
 */
export const useAventuraDelDia = () => {
  const [aventura, setAventura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarAventuraDelDia = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener la fecha actual en formato YYYY-MM-DD
        const hoy = new Date().toISOString().split('T')[0];
        
        // Intentar leer la aventura del día actual
        const aventuraRef = doc(db, 'aventuras', hoy);
        const aventuraSnap = await getDoc(aventuraRef);

        if (aventuraSnap.exists()) {
          // Si existe la aventura de hoy, usarla
          setAventura({ id: aventuraSnap.id, ...aventuraSnap.data() });
        } else {
          // Si no existe, buscar la aventura más reciente disponible
          console.log('No hay aventura disponible para hoy. Fecha:', hoy);
          console.log('Buscando la aventura más reciente disponible...');
          
          try {
            // Obtener todas las aventuras y ordenarlas por ID (fecha) en JavaScript
            const aventurasRef = collection(db, 'aventuras');
            const querySnapshot = await getDocs(aventurasRef);
            
            if (!querySnapshot.empty) {
              // Convertir a array y ordenar por ID (fecha) de forma descendente
              const aventuras = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              // Ordenar por ID (que es la fecha en formato YYYY-MM-DD)
              aventuras.sort((a, b) => b.id.localeCompare(a.id));
              
              // Tomar la más reciente
              const aventuraMasReciente = aventuras[0];
              setAventura(aventuraMasReciente);
              console.log('Aventura más reciente encontrada:', aventuraMasReciente.id);
            } else {
              setAventura(null);
              console.log('No hay aventuras disponibles en Firestore.');
            }
          } catch (searchError) {
            console.error('Error al buscar aventura más reciente:', searchError);
            setAventura(null);
          }
        }
      } catch (err) {
        console.error('Error al cargar la aventura del día:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarAventuraDelDia();
  }, []); // Solo se ejecuta una vez al montar el componente

  return { aventura, loading, error };
};

