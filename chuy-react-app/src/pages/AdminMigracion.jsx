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
  const [tipoContenido, setTipoContenido] = useState(''); // Para etiquetado y UI (vacío inicialmente)
  const [coleccionDestino, setColeccionDestino] = useState('aventuras'); // 'aventuras' o 'simulacros'

  // Opciones de tipos de contenido por colección
  const tiposPorColeccion = {
    aventuras: [
      { valor: 'operaciones', nombre: '➕ Operaciones', emoji: '➕' },
      { valor: 'tabla-doble-entrada', nombre: '🔎 Tabla Doble Entrada', emoji: '🔎' },
      { valor: 'conteo-figuras', nombre: '💠 Conteo de Figuras', emoji: '💠' },
      { valor: 'secuencia', nombre: '🔢 Secuencias', emoji: '🔢' },
      { valor: 'criptoaritmetica', nombre: '🍇 Criptoaritmetica', emoji: '🍇' },
      { valor: 'balanza-logica', nombre: '⚖️ Balanza Lógica', emoji: '⚖️' },
      { valor: 'desarrollo-cubos', nombre: '🧊 Desarrollo de Cubos', emoji: '🧊' },
      { valor: 'palabra-del-dia', nombre: '📝 Palabra del Día', emoji: '📝' }
    ],
    simulacros: [
      { valor: 'operaciones', nombre: '➕ Operaciones', emoji: '➕' },
      { valor: 'opcion-multiple', nombre: '🎯 Opción Múltiple', emoji: '🎯' },
      { valor: 'tabla-doble-entrada', nombre: '🔎 Tabla Doble Entrada', emoji: '🔎' },
      { valor: 'balanza-logica', nombre: '⚖️ Balanza Lógica', emoji: '⚖️' },
      { valor: 'conteo-figuras', nombre: '💠 Conteo de Figuras', emoji: '💠' }
    ]
  };

  const tiposDisponibles = tiposPorColeccion[coleccionDestino] || [];

  // Al cambiar la colección destino, reiniciar el tipo de contenido
  const manejarCambioColeccion = (coleccion) => {
    setColeccionDestino(coleccion);
    setTipoContenido(''); // Reiniciar
  };

  // Función para migrar una aventura individual
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

  // Función para migrar un simulacro - TODO VA A COLECCIÓN 'simulacros'
  const migrarSimulacro = async (simulacroData, tipoJuego) => {
    try {
      // SIMPLIFICADO: Todo va a 'simulacros', diferenciado por campo 'tipo'
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
          tipo: tipoJuego,
          ...ej
        }));
      }
      
      // Preparar datos a migrar
      const datosAMigrar = {
        titulo: simulacroData.titulo,
        descripcion: simulacroData.descripcion || '',
        tipo: tipoJuego, // Campo tipo para filtrar
        problemas: problemas,
        ...simulacroData
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
      const tipoNombre = tiposDisponibles.find(t => t.valor === tipoContenido)?.nombre || tipoContenido;
      alert(`Por favor, pega el contenido JSON de ${tipoNombre}`);
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
      } else {
        console.log(`Migrando a colección 'simulacros' (estructura plana)...`);
        resultado = await migrarSimulacro(data, tipoContenido);
      }

      if (resultado.exito) {
        const tipoNombre = tiposDisponibles.find(t => t.valor === tipoContenido)?.nombre || tipoContenido;
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

  // Solo permitir acceso a usuarios autenticados (por ahora, todos)
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
              <li>Selecciona la <strong>Colección Destino</strong> (¡Importante! Define cómo se guardan los datos).</li>
              <li>Selecciona el <strong>Tipo de Contenido</strong> (los disponibles cambian según la colección).</li>
              <li>Carga el archivo JSON o pega su contenido.</li>
              <li>Haz clic en "Migrar".</li>
            </ol>
          </div>

          {/* Paso 1: Selector de Colección Destino */}
          <div className="coleccion-selector" style={{ margin: '20px 0', padding: '20px', background: '#e8f6f3', borderRadius: '10px', border: '2px solid #1abc9c' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '15px', color: '#16a085', fontSize: '1.1rem' }}>📂 Paso 1: ¿A dónde quieres subir esto?</p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                <input 
                  type="radio" 
                  name="coleccion" 
                  value="aventuras" 
                  checked={coleccionDestino === 'aventuras'} 
                  onChange={() => manejarCambioColeccion('aventuras')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🌟 Aventuras</strong> (Juegos del día, Expediciones, Numberblocks)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '1rem' }}>
                <input 
                  type="radio" 
                  name="coleccion" 
                  value="simulacros" 
                  checked={coleccionDestino === 'simulacros'} 
                  onChange={() => manejarCambioColeccion('simulacros')}
                  style={{ width: '20px', height: '20px' }}
                />
                <strong>🏆 Simulacros</strong> (Exámenes, Bancos de preguntas)
              </label>
            </div>
            <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#7f8c8d' }}>
              {coleccionDestino === 'aventuras' 
                ? 'ℹ️ Mantiene la estructura original (misiones > ejercicios). Ideal para juegos interactivos.' 
                : 'ℹ️ Aplana la estructura para crear una lista de problemas. Ideal para exámenes.'}
            </p>
          </div>

          {/* Paso 2: Selector de tipo de contenido (dinámico según colección) */}
          {tiposDisponibles.length > 0 && (
            <div className="tipo-selector-grid">
              <p style={{ marginBottom: '15px', fontWeight: 'bold', color: '#333', fontSize: '1.1rem' }}>
                📋 Paso 2: Selecciona el tipo de contenido ({coleccionDestino === 'aventuras' ? 'Aventura' : 'Simulacro'}):
              </p>
              <div className="tipos-grid">
                {tiposDisponibles.map(tipo => (
                  <label key={tipo.valor} className="tipo-card">
                    <input
                      type="radio"
                      value={tipo.valor}
                      checked={tipoContenido === tipo.valor}
                      onChange={(e) => setTipoContenido(e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <div className={`tipo-card-content ${tipoContenido === tipo.valor ? 'selected' : ''}`}>
                      <span className="tipo-emoji">{tipo.emoji}</span>
                      <span className="tipo-nombre">{tipo.nombre.split(' ').slice(1).join(' ')}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="input-section">
            <label htmlFor="json-input" className="input-label">
              📄 Paso 3: Contenido JSON:
            </label>
            <textarea
              id="json-input"
              className="json-textarea"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`Pega aquí el contenido del archivo JSON de ${coleccionDestino === 'aventuras' ? 'una aventura' : 'un simulacro'}`}
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
            disabled={migrando || !jsonInput.trim() || !tipoContenido}
          >
            {migrando 
              ? 'Migrando...' 
              : tipoContenido 
                ? `Migrar a ${coleccionDestino}` 
                : 'Selecciona un tipo de contenido'}
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

