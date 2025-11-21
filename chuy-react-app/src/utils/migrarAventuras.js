/**
 * Script de utilidad para migrar aventuras desde archivos JSON locales a Firestore
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abre la consola del navegador (F12 > Console)
 * 2. Copia y pega este archivo completo en la consola
 * 3. O mejor aún, importa este archivo en un componente temporal y ejecuta la función
 * 
 * NOTA: Este script está diseñado para ejecutarse una sola vez para migrar todas las aventuras.
 */

import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Migra una aventura desde un objeto JSON a Firestore
 * @param {object} aventuraData - El objeto JSON de la aventura
 */
export const migrarAventura = async (aventuraData) => {
  try {
    const aventuraRef = doc(db, 'aventuras', aventuraData.id);
    await setDoc(aventuraRef, {
      titulo: aventuraData.titulo,
      misiones: aventuraData.misiones || [],
      // Agregar otros campos si existen en el JSON
      ...aventuraData
    });
    console.log(`✅ Aventura "${aventuraData.titulo}" (${aventuraData.id}) migrada exitosamente`);
    return true;
  } catch (error) {
    console.error(`❌ Error al migrar aventura ${aventuraData.id}:`, error);
    return false;
  }
};

/**
 * Migra múltiples aventuras desde un array de objetos JSON
 * @param {array} aventuras - Array de objetos de aventuras
 */
export const migrarAventuras = async (aventuras) => {
  console.log(`🚀 Iniciando migración de ${aventuras.length} aventuras...`);
  
  let exitosas = 0;
  let fallidas = 0;

  for (const aventura of aventuras) {
    const resultado = await migrarAventura(aventura);
    if (resultado) {
      exitosas++;
    } else {
      fallidas++;
    }
    
    // Pequeña pausa para no sobrecargar Firestore
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Resumen de migración:`);
  console.log(`✅ Exitosas: ${exitosas}`);
  console.log(`❌ Fallidas: ${fallidas}`);
  console.log(`📦 Total: ${aventuras.length}`);
};

