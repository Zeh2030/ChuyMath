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
      // Parsear el JSON
      const data = JSON.parse(jsonInput);

      // Validar que tenga los campos necesarios
      if (!data.id) {
        throw new Error('El JSON debe tener un campo "id"');
      }

      // Migrar según la colección destino
      let resultado;
      if (coleccionDestino === 'aventuras') {
        console.log(`Migrando a colección 'aventuras' (estructura anidada)...`);
        resultado = await migrarAventura(data);
      } else if (coleccionDestino === 'ingles') {
        console.log(`Migrando a colección 'ingles' (estructura anidada)...`);
        resultado = await migrarIngles(data);
      } else {
        console.log(`Migrando a colección 'simulacros' (estructura plana)...`);
        resultado = await migrarSimulacro(data);
      }

      if (resultado.exito) {
        setResultado({
          tipo: 'exito',
          mensaje: `✅ Contenido migrado exitosamente a la colección '${coleccionDestino}'. ID: ${resultado.id}`,
        });
        setJsonInput(''); // Limpiar el input
      } else {
        setResultado({
          tipo: 'error',
          mensaje: `❌ Error al migrar: ${resultado.error}`,
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
            </div>
            <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#7f8c8d', background: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
              {coleccionDestino === 'aventuras'
                ? '🌟 Aventuras: Mantiene la estructura original (misiones > ejercicios). Ideal para juegos del día, Numberblocks, Expediciones.'
                : coleccionDestino === 'ingles'
                ? '🇬🇧 Inglés: Colección separada para contenido de inglés. Misma estructura que Aventuras (misiones > retos).'
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
              : `Migrar a ${coleccionDestino === 'aventuras' ? '🌟 Aventuras' : '🏆 Simulacros'}`}
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
