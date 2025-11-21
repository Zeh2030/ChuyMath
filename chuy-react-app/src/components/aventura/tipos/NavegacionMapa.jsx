import React, { useState, useEffect } from 'react';
import './NavegacionMapa.css';

/**
 * Componente para misiones de navegación en mapa.
 * Muestra un mapa con punto de inicio y destinos, y el usuario debe seguir las instrucciones.
 * 
 * @param {Object} mision - El objeto de la misión con configuración del mapa
 * @param {Function} onCompletar - Callback que se ejecuta cuando se responde correctamente
 * @param {Boolean} modoSimulacro - Si está en modo simulacro (sin feedback inmediato)
 * @param {*} respuestaGuardada - Respuesta guardada del usuario (para modo simulacro)
 * @param {Function} onRespuesta - Callback para guardar respuesta en modo simulacro
 * @param {Boolean} mostrarResultado - Si debe mostrar el resultado (modo simulacro calificado)
 */
const NavegacionMapa = ({ 
  mision, 
  onCompletar,
  modoSimulacro = false,
  respuestaGuardada = null,
  onRespuesta = null,
  mostrarResultado: mostrarResultadoExterno = false
}) => {
  const [lugarSeleccionado, setLugarSeleccionado] = useState(respuestaGuardada);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);
  const [mostrarCamino, setMostrarCamino] = useState(false);
  
  // Estado para la posición del personaje
  const config = mision.configuracion_mapa;
  const [posicionPersonaje, setPosicionPersonaje] = useState({ ...config.punto_inicio });
  const [caminoRecorrido, setCaminoRecorrido] = useState([]);

  // Actualizar lugar seleccionado si cambia desde fuera (modo simulacro)
  useEffect(() => {
    if (modoSimulacro) {
      setLugarSeleccionado(respuestaGuardada);
    }
  }, [respuestaGuardada, modoSimulacro]);

  const pregunta = mision.pregunta || '¿A qué lugar llega?';

  // Manejar selección de lugar (click directo o al llegar)
  const handleSeleccion = (nombreLugar) => {
    if (mostrarResultado || mostrarResultadoExterno) return;
    
    setLugarSeleccionado(nombreLugar);
    
    // En modo simulacro, notificar al padre inmediatamente
    if (modoSimulacro && onRespuesta) {
      onRespuesta(nombreLugar);
    }
  };

  // Manejar movimiento del personaje
  const moverPersonaje = (direccion) => {
    if (mostrarResultado || mostrarResultadoExterno) return;

    setPosicionPersonaje((prevPos) => {
      const nuevaPos = { ...prevPos };
      let movio = false;

      switch (direccion) {
        case 'norte':
          if (nuevaPos.fila > 0) { nuevaPos.fila--; movio = true; }
          break;
        case 'sur':
          if (nuevaPos.fila < config.filas - 1) { nuevaPos.fila++; movio = true; }
          break;
        case 'este':
          if (nuevaPos.columna < config.columnas - 1) { nuevaPos.columna++; movio = true; }
          break;
        case 'oeste':
          if (nuevaPos.columna > 0) { nuevaPos.columna--; movio = true; }
          break;
        default:
          break;
      }

      if (movio) {
        // Agregar al historial de camino para dibujar rastro
        setCaminoRecorrido(prev => [...prev, { ...prevPos }]);

        // Verificar si llegó a un punto de interés
        const puntoInteres = config.puntos_interes.find(
          p => p.fila === nuevaPos.fila && p.columna === nuevaPos.columna
        );

        if (puntoInteres) {
          handleSeleccion(puntoInteres.nombre);
        } else {
          // Si se mueve fuera de un punto, deseleccionar (opcional, mejor mantener selección)
          // setLugarSeleccionado(null); 
        }
      }

      return nuevaPos;
    });
  };

  // Reiniciar posición
  const resetearPosicion = () => {
    if (mostrarResultado || mostrarResultadoExterno) return;
    setPosicionPersonaje({ ...config.punto_inicio });
    setCaminoRecorrido([]);
    setLugarSeleccionado(null);
    if (modoSimulacro && onRespuesta) onRespuesta(null);
  };

  // Manejar envío de respuesta (Solo modo normal)
  const handleEnviar = () => {
    if (!lugarSeleccionado) return;

    const correcta = lugarSeleccionado === config.respuesta_correcta;
    setEsCorrecta(correcta);
    setMostrarResultado(true);
    setMostrarCamino(true);

    // Si es correcta, llamar al callback después de un breve delay
    if (correcta && onCompletar) {
      setTimeout(() => {
        onCompletar();
      }, 2000);
    }
  };

  // Reintentar (Solo modo normal)
  const handleReintentar = () => {
    setLugarSeleccionado(null);
    setMostrarResultado(false);
    setEsCorrecta(false);
    setMostrarCamino(false);
    setPosicionPersonaje({ ...config.punto_inicio });
    setCaminoRecorrido([]);
  };

  // Calcular posición de un punto en el mapa
  const calcularPosicion = (fila, columna) => {
    const cellSize = 100 / Math.max(config.columnas, config.filas);
    return {
      top: `${fila * cellSize}%`,
      left: `${columna * cellSize}%`,
      width: `${cellSize}%`,
      height: `${cellSize}%`
    };
  };

  // Generar el camino visual (Solución correcta)
  const generarCaminoSolucion = () => {
    if (!mostrarCamino && !mostrarResultadoExterno) return null;

    const cellSize = 100 / Math.max(config.columnas, config.filas);
    let posicionActual = { ...config.punto_inicio };
    const puntos = [{ ...posicionActual }];

    config.movimientos.forEach(movimiento => {
      switch (movimiento.toLowerCase()) {
        case 'norte': posicionActual.fila--; break;
        case 'sur': posicionActual.fila++; break;
        case 'este': posicionActual.columna++; break;
        case 'oeste': posicionActual.columna--; break;
        default: break;
      }
      puntos.push({ ...posicionActual });
    });

    return puntos.map((punto, index) => {
      if (index === 0) return null;
      const esUltimo = index === puntos.length - 1;
      
      return (
        <div
          key={`sol-${index}`}
          className={`camino-punto solucion ${esUltimo ? 'camino-final' : ''}`}
          style={{
            top: `${(punto.fila + 0.5) * cellSize}%`,
            left: `${(punto.columna + 0.5) * cellSize}%`
          }}
        >
          {index}
        </div>
      );
    });
  };

  // Renderizar rastro del usuario
  const renderizarRastroUsuario = () => {
    const cellSize = 100 / Math.max(config.columnas, config.filas);
    return caminoRecorrido.map((punto, index) => (
      <div
        key={`rastro-${index}`}
        className="rastro-punto"
        style={{
          top: `${(punto.fila + 0.5) * cellSize}%`,
          left: `${(punto.columna + 0.5) * cellSize}%`
        }}
      />
    ));
  };

  return (
    <div className="navegacion-mapa-container">
      {/* Pregunta */}
      <div className="pregunta-container">
        <h3 className="pregunta-texto">{pregunta}</h3>
      </div>

      <div className="mapa-area">
        {/* Mapa Grid */}
        <div className="mapa-grid-container">
          <div 
            className="mapa-grid"
            style={{
              gridTemplateColumns: `repeat(${config.columnas}, 1fr)`,
              gridTemplateRows: `repeat(${config.filas}, 1fr)`
            }}
          >
            {/* Celdas */}
            {Array.from({ length: config.filas * config.columnas }).map((_, index) => (
              <div key={index} className="mapa-celda"></div>
            ))}

            {/* Rastro del Usuario */}
            {renderizarRastroUsuario()}

            {/* Camino Solución (se muestra al final) */}
            {generarCaminoSolucion()}

            {/* Puntos de interés */}
            {config.puntos_interes.map((punto, index) => {
              const estaSeleccionado = lugarSeleccionado === punto.nombre;
              const esRespuestaCorrecta = punto.nombre === config.respuesta_correcta;
              
              let claseExtra = '';
              if (mostrarResultado || mostrarResultadoExterno) {
                if (esRespuestaCorrecta) claseExtra = 'punto-correcto';
                else if (estaSeleccionado) claseExtra = 'punto-incorrecto';
              } else if (estaSeleccionado) {
                claseExtra = 'punto-seleccionado';
              }

              return (
                <div
                  key={index}
                  className={`mapa-punto punto-interes ${claseExtra}`}
                  style={calcularPosicion(punto.fila, punto.columna)}
                  onClick={() => handleSeleccion(punto.nombre)}
                  title={punto.nombre}
                >
                  <span className="punto-icono">{punto.icono}</span>
                </div>
              );
            })}

            {/* Personaje Jugable */}
            <div 
              className="mapa-punto personaje"
              style={calcularPosicion(posicionPersonaje.fila, posicionPersonaje.columna)}
            >
              <span className="personaje-icono">🏃</span>
            </div>
          </div>
        </div>

        {/* Panel de Control e Instrucciones */}
        <div className="panel-control">
          {/* Instrucciones de Movimiento */}
          <div className="instrucciones-movimiento">
            <h4>Sigue la ruta:</h4>
            <ol className="lista-pasos">
              {config.movimientos.map((mov, index) => (
                <li key={index} className="paso-item">
                  {mov === 'norte' && '⬆️'}
                  {mov === 'sur' && '⬇️'}
                  {mov === 'este' && '➡️'}
                  {mov === 'oeste' && '⬅️'}
                  <span className="texto-paso">{mov}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Controles D-Pad */}
          <div className="controles-dpad">
            <div className="dpad-fila">
              <button className="btn-dpad" onClick={() => moverPersonaje('norte')}>⬆️</button>
            </div>
            <div className="dpad-fila">
              <button className="btn-dpad" onClick={() => moverPersonaje('oeste')}>⬅️</button>
              <button className="btn-dpad centro" onClick={resetearPosicion}>🔄</button>
              <button className="btn-dpad" onClick={() => moverPersonaje('este')}>➡️</button>
            </div>
            <div className="dpad-fila">
              <button className="btn-dpad" onClick={() => moverPersonaje('sur')}>⬇️</button>
            </div>
            <p className="hint-control">Usa las flechas para moverte</p>
          </div>
        </div>
      </div>

      {/* Selección Actual */}
      <div className="seleccion-actual">
        Lugar seleccionado: <strong>{lugarSeleccionado || 'Ninguno'}</strong>
      </div>

      {/* Botones de Acción (Solo modo normal) */}
      {!modoSimulacro && (
        <div className="acciones-container">
          {!mostrarResultado ? (
            <button
              className="boton-enviar"
              onClick={handleEnviar}
              disabled={!lugarSeleccionado}
            >
              Enviar Respuesta
            </button>
          ) : (
            <button
              className="boton-reintentar"
              onClick={handleReintentar}
            >
              Intentar de Nuevo
            </button>
          )}
        </div>
      )}

      {/* Feedback */}
      {(mostrarResultado || (modoSimulacro && mostrarResultadoExterno)) && (
        <div className={`feedback-container ${esCorrecta ? 'feedback-correcto' : 'feedback-incorrecto'}`}>
          <div className="feedback-icono">
            {esCorrecta ? '✅' : '❌'}
          </div>
          <div className="feedback-texto">
            <p className="feedback-titulo">
              {esCorrecta ? '¡Excelente!' : 'No es correcto'}
            </p>
            <p className="feedback-explicacion">
              {esCorrecta 
                ? `¡Correcto! El lugar es ${config.respuesta_correcta}.` 
                : `La respuesta correcta era ${config.respuesta_correcta}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavegacionMapa;
