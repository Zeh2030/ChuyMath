import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import './AdminMigracion.css';

const AdminMigracion = () => {
  const { currentUser } = useAuth();
  const [migrando, setMigrando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [coleccionDestino, setColeccionDestino] = useState('aventuras'); // 'aventuras', 'simulacros', o 'ingles'

  // Función para migrar una aventura individual (mantiene estructura original)
  const migrarAventura = async (aventuraData) => {
    try {
      const aventuraRef = doc(db, 'aventuras', aventuraData.id);
      await setDoc(aventuraRef, {
        titulo: aventuraData.titulo,
        misiones: aventuraData.misiones || [],
        ...aventuraData
      });
      return { exito: true, id: aventuraData.id, titulo: aventuraData.titulo };
    } catch (error) {
      console.error(`Error al migrar aventura ${aventuraData.id}:`, error);
      return { exito: false, id: aventuraData.id, error: error.message };
    }
  };

  // Función para migrar contenido de inglés (misma estructura que aventura, colección separada)
  const migrarIngles = async (inglesData) => {
    try {
      const inglesRef = doc(db, 'ingles', inglesData.id);
      await setDoc(inglesRef, {
        titulo: inglesData.titulo,
        misiones: inglesData.misiones || [],
        ...inglesData,
        materia: 'ingles' // Asegurar que siempre tenga materia
      });
      return { exito: true, id: inglesData.id, titulo: inglesData.titulo };
    } catch (error) {
      console.error(`Error al migrar inglés ${inglesData.id}:`, error);
      return { exito: false, id: inglesData.id, error: error.message };
    }
  };

  // Función para migrar contenido de dibujo (misma estructura que aventura, colección separada)
  const migrarDibujo = async (dibujoData) => {
    try {
      const dibujoRef = doc(db, 'dibujo', dibujoData.id);
      await setDoc(dibujoRef, {
        titulo: dibujoData.titulo,
        misiones: dibujoData.misiones || [],
        ...dibujoData,
        materia: 'dibujo'
      });
      return { exito: true, id: dibujoData.id, titulo: dibujoData.titulo };
    } catch (error) {
      console.error(`Error al migrar dibujo ${dibujoData.id}:`, error);
      return { exito: false, id: dibujoData.id, error: error.message };
    }
  };

  // Función para migrar contenido de ciencias (misma estructura que aventura, colección separada)
  const migrarCiencias = async (cienciasData) => {
    try {
      const cienciasRef = doc(db, 'ciencias', cienciasData.id);
      await setDoc(cienciasRef, {
        titulo: cienciasData.titulo,
        misiones: cienciasData.misiones || [],
        ...cienciasData,
        materia: 'ciencias'
      });
      return { exito: true, id: cienciasData.id, titulo: cienciasData.titulo };
    } catch (error) {
      console.error(`Error al migrar ciencias ${cienciasData.id}:`, error);
      return { exito: false, id: cienciasData.id, error: error.message };
    }
  };

  // Función para migrar contenido de piano (misma estructura que aventura, colección separada)
  const migrarPiano = async (pianoData) => {
    try {
      const pianoRef = doc(db, 'piano', pianoData.id);
      await setDoc(pianoRef, {
        titulo: pianoData.titulo,
        misiones: pianoData.misiones || [],
        ...pianoData,
        materia: 'piano'
      });
      return { exito: true, id: pianoData.id, titulo: pianoData.titulo };
    } catch (error) {
      console.error(`Error al migrar piano ${pianoData.id}:`, error);
      return { exito: false, id: pianoData.id, error: error.message };
    }
  };

  // Función para migrar contenido de geografia (misma estructura que aventura, colección separada)
  const migrarGeografia = async (geografiaData) => {
    try {
      const geografiaRef = doc(db, 'geografia', geografiaData.id);
      await setDoc(geografiaRef, {
        titulo: geografiaData.titulo,
        misiones: geografiaData.misiones || [],
        ...geografiaData,
        materia: 'geografia'
      });
      return { exito: true, id: geografiaData.id, titulo: geografiaData.titulo };
    } catch (error) {
      console.error(`Error al migrar geografia ${geografiaData.id}:`, error);
      return { exito: false, id: geografiaData.id, error: error.message };
    }
  };

  // Función para migrar una tarjeta de Modo Peques (estructura plana de tarjeta, no misiones)
  const migrarPeques = async (pequeData) => {
    try {
      const pequeRef = doc(db, 'peques', pequeData.id);
      await setDoc(pequeRef, {
        ...pequeData,
        materia: 'peques',
      });
      return { exito: true, id: pequeData.id, titulo: pequeData.titulo };
    } catch (error) {
      console.error(`Error al migrar peques ${pequeData.id}:`, error);
      return { exito: false, id: pequeData.id, error: error.message };
    }
  };

  // Función para migrar un simulacro (aplana estructura para lista de problemas)
  const migrarSimulacro = async (simulacroData) => {
    try {
      const simulacroRef = doc(db, 'simulacros', simulacroData.id);
      
      // Aplanar la estructura: si hay misiones con ejercicios dentro, convertir a problemas planos
      let problemas = simulacroData.problemas || [];
      
      if (simulacroData.misiones && simulacroData.misiones.length > 0) {
        // Convertir misiones con ejercicios a problemas planos
        problemas = simulacroData.misiones.flatMap((mision) => {
          if (mision.ejercicios && mision.ejercicios.length > 0) {
            // Cada ejercicio se convierte en un problema independiente
            return mision.ejercicios.map((ejercicio, idx) => ({
              id: `${mision.id}-ejercicio-${idx}`,
              tipo: mision.tipo,
              titulo: mision.titulo,
              ...ejercicio
            }));
          } else {
            // Si la misión no tiene ejercicios, tomarla como problema
            return [{
              id: mision.id,
              tipo: mision.tipo,
              ...mision
            }];
          }
        });
      } else if (simulacroData.ejercicios) {
        // Si solo hay ejercicios sin misiones
        problemas = simulacroData.ejercicios.map((ej, idx) => ({
          id: `problema-${idx}`,
          tipo: 'ejercicio',
          ...ej
        }));
      }
      
      // Preparar datos a migrar (sin spread que sobreescriba problemas)
      const datosAMigrar = {
        id: simulacroData.id,
        titulo: simulacroData.titulo,
        descripcion: simulacroData.descripcion || '',
        problemas: problemas
      };

      await setDoc(simulacroRef, datosAMigrar);
      return { exito: true, id: simulacroData.id, titulo: simulacroData.titulo };
    } catch (error) {
      console.error(`Error al migrar a simulacros:`, error);
      return { exito: false, id: simulacroData.id, error: error.message };
    }
  };

  // Función para procesar y migrar el JSON
  const procesarYMigrar = async () => {
    if (!jsonInput.trim()) {
      alert('Por favor, pega el contenido JSON o carga un archivo.');
      return;
    }

    setMigrando(true);
    setResultado(null);

    try {
      // Parsear el JSON (acepta un objeto o un ARRAY de objetos para carga en lote)
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      if (items.some((it) => !it || !it.id)) {
        throw new Error('Cada elemento del JSON debe tener un campo "id"');
      }

      // Elige la función de migración según la colección destino.
      const migrarUno = (item) => {
        if (coleccionDestino === 'aventuras') return migrarAventura(item);
        if (coleccionDestino === 'ingles') return migrarIngles(item);
        if (coleccionDestino === 'piano') return migrarPiano(item);
        if (coleccionDestino === 'ciencias') return migrarCiencias(item);
        if (coleccionDestino === 'dibujo') return migrarDibujo(item);
        if (coleccionDestino === 'geografia') return migrarGeografia(item);
        if (coleccionDestino === 'peques') return migrarPeques(item);
        return migrarSimulacro(item);
      };

      const resultados = [];
      for (const item of items) {
        resultados.push(await migrarUno(item));
      }
      const fallos = resultados.filter((r) => !r.exito);

      if (fallos.length === 0) {
        setResultado({
          tipo: 'exito',
          mensaje: `✅ ${resultados.length} elemento(s) migrado(s) a la colección '${coleccionDestino}'.`,
        });
        setJsonInput(''); // Limpiar el input
      } else {
        setResultado({
          tipo: 'error',
          mensaje: `⚠️ ${resultados.length - fallos.length} migrado(s), ${fallos.length} con error: ${fallos.map((f) => f.id).join(', ')}`,
        });
      }
    } catch (error) {
      setResultado({
        tipo: 'error',
        mensaje: `❌ Error al procesar JSON: ${error.message}`,
      });
    } finally {
      setMigrando(false);
    }
  };

  // Función para cargar un archivo JSON
  const manejarArchivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setJsonInput(e.target.result);
    };
    reader.onerror = () => {
      alert('Error al leer el archivo');
    };
    reader.readAsText(file);
  };

  // Solo permitir acceso a usuarios autenticados
  if (!currentUser) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Acceso Restringido</h2>
          <p>Debes iniciar sesión para acceder a esta página.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header title="🔧 Administración: Migración de Contenido" />
      
      <div className="admin-container">
        <section className="widget admin-widget">
          <h2 className="widget-title">Migrar Contenido a Firestore</h2>
          
          <div className="instrucciones">
            <p><strong>Instrucciones:</strong></p>
            <ol>
              <li>Selecciona la <strong>Colección Destino</strong> (define cómo se guardan los datos).</li>
              <li>Carga el archivo JSON o pega su contenido.</li>
              <li>Haz clic en "Migrar".</li>
            </ol>
          </div>

          {/* Paso 1: Selector de Colección Destino */}
          <div className="coleccion-selector" style={{ margin: '20px 0', padding: '20px', background: '#e8f6f3', borderRadius: '10px', border: '2px solid #1abc9c' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '15px', color: '#16a085', fontSize: '1.1rem' }}>📂 Paso 1: ¿A dónde quieres subir esto?</p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: '10px 15px', background: coleccionDestino === 'aventuras' ? '#d5f5e3' : '#fff', borderRadius: '8px', border: coleccionDestino === 'aventuras' ? '2px solid #27ae60' : '1px solid #ddd' }}>
                <input 
                  type="radio" 
                  name="coleccion" 
                  value="aventuras" 
                  checked={coleccionDestino === 'aventuras'} 
                  onChange={() => setColeccionDestino('aventuras')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🌟 Aventuras</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: '10px 15px', background: coleccionDestino === 'simulacros' ? '#fdebd0' : '#fff', borderRadius: '8px', border: coleccionDestino === 'simulacros' ? '2px solid #f39c12' : '1px solid #ddd' }}>
                <input
                  type="radio"
                  name="coleccion"
                  value="simulacros"
                  checked={coleccionDestino === 'simulacros'}
                  onChange={() => setColeccionDestino('simulacros')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🏆 Simulacros</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: '10px 15px', background: coleccionDestino === 'ingles' ? '#e0f2f1' : '#fff', borderRadius: '8px', border: coleccionDestino === 'ingles' ? '2px solid #00897b' : '1px solid #ddd' }}>
                <input
                  type="radio"
                  name="coleccion"
                  value="ingles"
                  checked={coleccionDestino === 'ingles'}
                  onChange={() => setColeccionDestino('ingles')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🇬🇧 Inglés</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: '10px 15px', background: coleccionDestino === 'piano' ? '#ede7f6' : '#fff', borderRadius: '8px', border: coleccionDestino === 'piano' ? '2px solid #7e57c2' : '1px solid #ddd' }}>
                <input
                  type="radio"
                  name="coleccion"
                  value="piano"
                  checked={coleccionDestino === 'piano'}
                  onChange={() => setColeccionDestino('piano')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🎹 Piano</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: '10px 15px', background: coleccionDestino === 'ciencias' ? '#e8f5e9' : '#fff', borderRadius: '8px', border: coleccionDestino === 'ciencias' ? '2px solid #43a047' : '1px solid #ddd' }}>
                <input
                  type="radio"
                  name="coleccion"
                  value="ciencias"
                  checked={coleccionDestino === 'ciencias'}
                  onChange={() => setColeccionDestino('ciencias')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🔬 Ciencias</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: '10px 15px', background: coleccionDestino === 'dibujo' ? '#fff3e0' : '#fff', borderRadius: '8px', border: coleccionDestino === 'dibujo' ? '2px solid #e67e22' : '1px solid #ddd' }}>
                <input
                  type="radio"
                  name="coleccion"
                  value="dibujo"
                  checked={coleccionDestino === 'dibujo'}
                  onChange={() => setColeccionDestino('dibujo')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🎨 Dibujo</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: '10px 15px', background: coleccionDestino === 'geografia' ? '#e3f2fd' : '#fff', borderRadius: '8px', border: coleccionDestino === 'geografia' ? '2px solid #1e88e5' : '1px solid #ddd' }}>
                <input
                  type="radio"
                  name="coleccion"
                  value="geografia"
                  checked={coleccionDestino === 'geografia'}
                  onChange={() => setColeccionDestino('geografia')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🌍 Geografia</strong>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem', padding: '10px 15px', background: coleccionDestino === 'peques' ? '#f4ecf7' : '#fff', borderRadius: '8px', border: coleccionDestino === 'peques' ? '2px solid #8e44ad' : '1px solid #ddd' }}>
                <input
                  type="radio"
                  name="coleccion"
                  value="peques"
                  checked={coleccionDestino === 'peques'}
                  onChange={() => setColeccionDestino('peques')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🧸 Peques</strong>
              </label>
            </div>
            <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#7f8c8d', background: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
              {coleccionDestino === 'aventuras'
                ? '🌟 Aventuras: Mantiene la estructura original (misiones > ejercicios). Ideal para juegos del día, Numberblocks, Expediciones.'
                : coleccionDestino === 'ingles'
                ? '🇬🇧 Inglés: Colección separada para contenido de inglés. Misma estructura que Aventuras (misiones > retos).'
                : coleccionDestino === 'piano'
                ? '🎹 Piano: Colección para partituras. Misma estructura anidada (misiones con tipo piano-prompter).'
                : coleccionDestino === 'ciencias'
                ? '🔬 Ciencias: Colección para experimentos. Misma estructura anidada (misiones con tipo experimento-guia).'
                : coleccionDestino === 'dibujo'
                ? '🎨 Dibujo: Colección para actividades de arte. Tipos: colorear, dibujo-guiado, dibujo-libre.'
                : coleccionDestino === 'geografia'
                ? '🌍 Geografia: Colección para contenido geográfico. Incluye tipos: explorador-mapa, image-picker, tap-the-pairs, fill-the-gap, true-or-false, opcion-multiple, word-scramble, mini-story.'
                : coleccionDestino === 'peques'
                ? '🧸 Peques: Tarjetas del Modo Peques (juegos 2-5 años). Estructura plana de TARJETA (no misiones): kind "nativo" (con mision.tipo + contenido) o "atajo" (coleccion + docId). Campo "orden" para el orden en el lanzador.'
                : '🏆 Simulacros: Aplana la estructura para crear una lista de problemas. Ideal para exámenes y bancos de preguntas.'}
            </p>
          </div>

          {/* Paso 2: Contenido JSON */}
          <div className="input-section">
            <label htmlFor="json-input" className="input-label" style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>
              📄 Paso 2: Contenido JSON
            </label>
            <textarea
              id="json-input"
              className="json-textarea"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`Pega aquí el contenido del archivo JSON...`}
              rows={15}
            />
          </div>

          <div className="file-upload-section">
            <label htmlFor="file-input" className="file-label">
              O carga un archivo JSON:
            </label>
            <input
              id="file-input"
              type="file"
              accept=".json"
              onChange={manejarArchivo}
              className="file-input"
            />
          </div>

          <button
            className="boton-migrar"
            onClick={procesarYMigrar}
            disabled={migrando || !jsonInput.trim()}
          >
            {migrando
              ? 'Migrando...'
              : `Migrar a ${coleccionDestino === 'aventuras' ? '🌟 Aventuras' : coleccionDestino === 'ingles' ? '🇬🇧 Inglés' : coleccionDestino === 'piano' ? '🎹 Piano' : coleccionDestino === 'ciencias' ? '🔬 Ciencias' : coleccionDestino === 'dibujo' ? '🎨 Dibujo' : coleccionDestino === 'geografia' ? '🌍 Geografia' : coleccionDestino === 'peques' ? '🧸 Peques' : '🏆 Simulacros'}`}
          </button>

          {resultado && (
            <div className={`resultado ${resultado.tipo}`}>
              {resultado.mensaje}
            </div>
          )}

          <div className="nota-importante">
            <p><strong>⚠️ Nota Importante:</strong></p>
            <p>Este proceso creará o actualizará documentos en la colección <code>{coleccionDestino}</code> de Firestore.</p>
            <p>El ID del documento será el campo <code>id</code> del JSON.</p>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
};

export default AdminMigracion;
