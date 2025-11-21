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
  const [tipoContenido, setTipoContenido] = useState('aventura'); // 'aventura' o 'simulacro'

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

  // Función para migrar un simulacro
  const migrarSimulacro = async (simulacroData) => {
    try {
      const simulacroRef = doc(db, 'simulacros', simulacroData.id);
      await setDoc(simulacroRef, {
        titulo: simulacroData.titulo,
        descripcion: simulacroData.descripcion || '',
        problemas: simulacroData.problemas || [],
        ...simulacroData
      });
      return { exito: true, id: simulacroData.id, titulo: simulacroData.titulo };
    } catch (error) {
      console.error(`Error al migrar simulacro ${simulacroData.id}:`, error);
      return { exito: false, id: simulacroData.id, error: error.message };
    }
  };

  // Función para procesar y migrar el JSON
  const procesarYMigrar = async () => {
    if (!jsonInput.trim()) {
      alert(`Por favor, pega el contenido JSON de ${tipoContenido === 'aventura' ? 'una aventura' : 'un simulacro'}`);
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

      // Migrar según el tipo
      const resultado = tipoContenido === 'aventura' 
        ? await migrarAventura(data)
        : await migrarSimulacro(data);

      if (resultado.exito) {
        setResultado({
          tipo: 'exito',
          mensaje: `✅ ${tipoContenido === 'aventura' ? 'Aventura' : 'Simulacro'} "${resultado.titulo}" (${resultado.id}) migrado exitosamente`,
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
          
          {/* Selector de tipo de contenido */}
          <div className="tipo-selector">
            <label className="radio-label">
              <input
                type="radio"
                value="aventura"
                checked={tipoContenido === 'aventura'}
                onChange={(e) => setTipoContenido(e.target.value)}
              />
              <span>Aventura</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="simulacro"
                checked={tipoContenido === 'simulacro'}
                onChange={(e) => setTipoContenido(e.target.value)}
              />
              <span>Simulacro</span>
            </label>
          </div>
          
          <div className="instrucciones">
            <p><strong>Instrucciones:</strong></p>
            <ol>
              <li>Selecciona el tipo de contenido (Aventura o Simulacro)</li>
              <li>Abre el archivo JSON correspondiente de la carpeta <code>_contenido/</code></li>
              <li>Copia todo su contenido</li>
              <li>Pégalo en el área de texto de abajo</li>
              <li>Haz clic en "Migrar"</li>
            </ol>
          </div>

          <div className="input-section">
            <label htmlFor="json-input" className="input-label">
              Contenido JSON:
            </label>
            <textarea
              id="json-input"
              className="json-textarea"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`Pega aquí el contenido del archivo JSON de ${tipoContenido === 'aventura' ? 'una aventura' : 'un simulacro'}`}
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
            {migrando ? 'Migrando...' : `Migrar ${tipoContenido === 'aventura' ? 'Aventura' : 'Simulacro'}`}
          </button>

          {resultado && (
            <div className={`resultado ${resultado.tipo}`}>
              {resultado.mensaje}
            </div>
          )}

          <div className="nota-importante">
            <p><strong>⚠️ Nota Importante:</strong></p>
            <p>Este proceso creará o actualizará documentos en la colección <code>{tipoContenido === 'aventura' ? 'aventuras' : 'simulacros'}</code> de Firestore.</p>
            <p>El ID del documento será el campo <code>id</code> del JSON.</p>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
};

export default AdminMigracion;

