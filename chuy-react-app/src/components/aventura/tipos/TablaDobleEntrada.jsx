import React, { useState, useEffect } from 'react';
import './TablaDobleEntrada.css';

const TablaDobleEntrada = ({ 
  mision, 
  onCompletar, 
  modoSimulacro = false, 
  respuestaGuardada = '', 
  onRespuesta = null, 
  mostrarResultado: mostrarResultadoExterno = false 
}) => {
  const [respuestaUsuario, setRespuestaUsuario] = useState('');
  const [tabla, setTabla] = useState({});
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);

  useEffect(() => {
    if (mision) {
      // Inicializar tabla vacía
      const tablaInicial = {};
      if (mision.encabezados_fila) {
        mision.encabezados_fila.forEach(fila => {
          tablaInicial[fila] = {};
          if (mision.encabezados_columna) {
            mision.encabezados_columna.forEach(col => {
              tablaInicial[fila][col] = false;
            });
          }
        });
      }
      setTabla(tablaInicial);

      // Si es modo simulacro con respuesta guardada
      if (modoSimulacro && respuestaGuardada) {
        setRespuestaUsuario(respuestaGuardada);
      }
    }
  }, [mision, modoSimulacro, respuestaGuardada]);

  const handleToggleCelda = (fila, columna) => {
    if (mostrarResultado || mostrarResultadoExterno) return;

    setTabla(prev => ({
      ...prev,
      [fila]: {
        ...prev[fila],
        [columna]: !prev[fila][columna]
      }
    }));
  };

  const handleSelectOpcion = (opcion) => {
    if (mostrarResultado || mostrarResultadoExterno) return;

    setRespuestaUsuario(opcion);
    
    if (modoSimulacro && onRespuesta) {
      onRespuesta(opcion);
    }
  };

  const comprobarRespuesta = () => {
    const correcto = respuestaUsuario === mision.respuesta_final;
    setEsCorrecta(correcto);
    setMostrarResultado(true);
    
    if (correcto && onCompletar) {
      setTimeout(() => onCompletar(), 1500);
    }
  };

  const debeMostrarResultado = mostrarResultado || (modoSimulacro && mostrarResultadoExterno);
  const esCorrectoCalculado = respuestaUsuario === mision.respuesta_final;

  return (
    <div className="tabla-doble-entrada-container">
      <h3 className="tabla-titulo">{mision.titulo}</h3>
      
      {mision.instruccion && (
        <div className="tabla-instruccion">
          <p>{mision.instruccion}</p>
        </div>
      )}

      {/* Pistas */}
      {mision.pistas && mision.pistas.length > 0 && (
        <div className="tabla-pistas">
          <h4>🔍 Pistas del Detective</h4>
          {mision.pistas.map((pista, idx) => (
            <div key={idx} className="pista-item">
              <p>{pista}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla Interactiva */}
      {mision.encabezados_fila && mision.encabezados_columna && (
        <div className="tabla-grid">
          <div className="tabla-header-container">
            <div className="tabla-corner"></div>
            {mision.encabezados_columna.map((col, idx) => (
              <div key={idx} className="tabla-header-col">
                {col}
              </div>
            ))}
          </div>

          {mision.encabezados_fila.map((fila, filaIdx) => (
            <div key={filaIdx} className="tabla-row">
              <div className="tabla-header-row">
                {fila}
              </div>
              {mision.encabezados_columna.map((col, colIdx) => (
                <div
                  key={`${filaIdx}-${colIdx}`}
                  className={`tabla-celda ${
                    tabla[fila] && tabla[fila][col] ? 'marcada' : ''
                  } ${debeMostrarResultado ? 'deshabilitada' : ''}`}
                  onClick={() => handleToggleCelda(fila, col)}
                >
                  {tabla[fila] && tabla[fila][col] && <span className="marca">✓</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Pregunta Final */}
      {mision.pregunta_final && (
        <div className="tabla-pregunta-final">
          <h4>{mision.pregunta_final}</h4>
          
          {/* Opciones */}
          {mision.opciones_finales && (
            <div className="tabla-opciones">
              {mision.opciones_finales.map((opcion, idx) => (
                <button
                  key={idx}
                  className={`tabla-opcion ${
                    respuestaUsuario === opcion ? 'seleccionada' : ''
                  } ${debeMostrarResultado ? 'deshabilitada' : ''}`}
                  onClick={() => handleSelectOpcion(opcion)}
                  disabled={debeMostrarResultado}
                >
                  {opcion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultado */}
      {debeMostrarResultado && (
        <div className={`tabla-feedback ${esCorrectoCalculado ? 'correcto' : 'incorrecto'}`}>
          <p className={`tabla-feedback-texto ${esCorrectoCalculado ? 'verde' : 'rojo'}`}>
            {esCorrectoCalculado
              ? mision.explicacion_correcta || '¡Correcto!'
              : mision.explicacion_incorrecta || 'Intenta de nuevo'}
          </p>
        </div>
      )}

      {/* Botón Verificar (solo en modo no-simulacro) */}
      {!modoSimulacro && !mostrarResultado && (
        <button 
          className="boton-verificar"
          onClick={comprobarRespuesta}
          disabled={!respuestaUsuario}
        >
          Verificar Misterio
        </button>
      )}
    </div>
  );
};

export default TablaDobleEntrada;
