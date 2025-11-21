import React, { useState } from 'react';
import './Secuencia.css';

/**
 * Componente para misiones de secuencias.
 * Muestra una secuencia de elementos y permite al usuario completarla.
 * 
 * @param {Object} mision - El objeto de la misión con ejercicios de secuencia
 * @param {Function} onCompletar - Callback que se ejecuta cuando se completa la misión
 */
const Secuencia = ({ mision, onCompletar }) => {
  const [ejercicioActual, setEjercicioActual] = useState(0);
  const [respuestaActual, setRespuestaActual] = useState('');
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);
  const [ejerciciosCompletados, setEjerciciosCompletados] = useState(0);

  const ejercicios = mision.ejercicios || [];
  const ejercicio = ejercicios[ejercicioActual];

  if (!ejercicio) {
    return <div>No hay ejercicios disponibles</div>;
  }

  const elementos = ejercicio.elementos || [];
  const respuestaCorrecta = ejercicio.respuesta || '';
  const opciones = ejercicio.opciones || null; // Si hay opciones, es de selección múltiple
  const pista = ejercicio.pista || '';
  const explicacionCorrecta = ejercicio.explicacion_correcta || '¡Correcto!';
  const explicacionIncorrecta = ejercicio.explicacion_incorrecta || 'Intenta de nuevo.';

  // Manejar cambio de respuesta (input de texto o selección)
  const handleCambioRespuesta = (valor) => {
    if (mostrarResultado) return;
    setRespuestaActual(valor);
  };

  // Manejar envío de respuesta
  const handleEnviar = () => {
    if (!respuestaActual) return;

    const correcta = respuestaActual.trim() === respuestaCorrecta.trim();
    setEsCorrecta(correcta);
    setMostrarResultado(true);

    if (correcta) {
      const nuevosCompletados = ejerciciosCompletados + 1;
      setEjerciciosCompletados(nuevosCompletados);

      // Si completó todos los ejercicios, llamar al callback
      if (nuevosCompletados >= ejercicios.length && onCompletar) {
        setTimeout(() => {
          onCompletar();
        }, 2000);
      }
    }
  };

  // Avanzar al siguiente ejercicio
  const siguienteEjercicio = () => {
    if (ejercicioActual < ejercicios.length - 1) {
      setEjercicioActual(ejercicioActual + 1);
      setRespuestaActual('');
      setMostrarResultado(false);
      setEsCorrecta(false);
    }
  };

  // Reiniciar ejercicio actual
  const handleReintentar = () => {
    setRespuestaActual('');
    setMostrarResultado(false);
    setEsCorrecta(false);
  };

  // Mostrar pista
  const [mostrarPista, setMostrarPista] = useState(false);

  return (
    <div className="secuencia-container">
      {/* Progreso de ejercicios */}
      <div className="secuencia-progreso">
        <span>Ejercicio {ejercicioActual + 1} de {ejercicios.length}</span>
        <div className="progreso-mini-barra">
          <div 
            className="progreso-mini-fill" 
            style={{ width: `${((ejercicioActual + 1) / ejercicios.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Secuencia de elementos */}
      <div className="secuencia-elementos">
        {elementos.map((elemento, index) => (
          <div 
            key={index} 
            className={`elemento-secuencia ${elemento === '?' ? 'elemento-pregunta' : ''}`}
          >
            {elemento}
          </div>
        ))}
      </div>

      {/* Área de respuesta */}
      <div className="secuencia-respuesta">
        {opciones ? (
          // Si hay opciones, mostrar botones de selección
          <div className="opciones-secuencia">
            {opciones.map((opcion, index) => {
              const estaSeleccionada = respuestaActual === opcion;
              let claseOpcion = 'opcion-secuencia';
              
              if (mostrarResultado) {
                if (opcion === respuestaCorrecta) {
                  claseOpcion += ' opcion-correcta';
                } else if (estaSeleccionada && !esCorrecta) {
                  claseOpcion += ' opcion-incorrecta';
                }
              } else if (estaSeleccionada) {
                claseOpcion += ' opcion-seleccionada';
              }

              return (
                <button
                  key={index}
                  className={claseOpcion}
                  onClick={() => handleCambioRespuesta(opcion)}
                  disabled={mostrarResultado}
                >
                  {opcion}
                </button>
              );
            })}
          </div>
        ) : (
          // Si no hay opciones, mostrar input de texto
          <div className="input-secuencia">
            <input
              type="text"
              value={respuestaActual}
              onChange={(e) => handleCambioRespuesta(e.target.value)}
              placeholder="Escribe tu respuesta"
              disabled={mostrarResultado}
              className="input-respuesta"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && respuestaActual) {
                  handleEnviar();
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="secuencia-acciones">
        {!mostrarResultado ? (
          <>
            <button
              className="boton-pista"
              onClick={() => setMostrarPista(!mostrarPista)}
            >
              {mostrarPista ? 'Ocultar' : 'Mostrar'} Pista 💡
            </button>
            <button
              className="boton-enviar-secuencia"
              onClick={handleEnviar}
              disabled={!respuestaActual}
            >
              Enviar Respuesta
            </button>
          </>
        ) : (
          <>
            <button
              className="boton-reintentar-secuencia"
              onClick={handleReintentar}
            >
              Intentar de Nuevo
            </button>
            {esCorrecta && ejercicioActual < ejercicios.length - 1 && (
              <button
                className="boton-siguiente-secuencia"
                onClick={siguienteEjercicio}
              >
                Siguiente Ejercicio →
              </button>
            )}
          </>
        )}
      </div>

      {/* Pista */}
      {mostrarPista && pista && (
        <div className="pista-container">
          <div className="pista-icono">💡</div>
          <div className="pista-texto">{pista}</div>
        </div>
      )}

      {/* Feedback */}
      {mostrarResultado && (
        <div className={`feedback-secuencia ${esCorrecta ? 'feedback-correcto' : 'feedback-incorrecto'}`}>
          <div className="feedback-icono">
            {esCorrecta ? '✅' : '❌'}
          </div>
          <div className="feedback-texto">
            <p className="feedback-titulo">
              {esCorrecta ? '¡Excelente!' : 'No es correcto'}
            </p>
            <p className="feedback-explicacion">
              {esCorrecta ? explicacionCorrecta : explicacionIncorrecta}
            </p>
            {esCorrecta && ejerciciosCompletados >= ejercicios.length && (
              <p className="feedback-completo">
              🎉 ¡Has completado todos los ejercicios de esta secuencia!
            </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Secuencia;

