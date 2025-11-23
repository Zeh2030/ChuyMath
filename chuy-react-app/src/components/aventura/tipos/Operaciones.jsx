import React, { useState, useEffect } from 'react';
import './Operaciones.css';

/**
 * Componente para misiones de operaciones matemáticas (suma, resta, multiplicación, división).
 * Permite al usuario ingresar una respuesta numérica.
 * 
 * @param {Object} mision - El objeto de la misión con pregunta, respuesta y explicaciones
 * @param {Function} onCompletar - Callback que se ejecuta cuando se responde correctamente (modo aventura)
 * @param {Boolean} modoSimulacro - Si está en modo simulacro (sin feedback inmediato)
 * @param {*} respuestaGuardada - Respuesta guardada del usuario (para modo simulacro)
 * @param {Function} onRespuesta - Callback para guardar respuesta en modo simulacro
 * @param {Boolean} mostrarResultado - Si debe mostrar el resultado (modo simulacro calificado)
 */
const Operaciones = ({ 
  mision, 
  onCompletar, 
  modoSimulacro = false, 
  respuestaGuardada = '', 
  onRespuesta = null, 
  mostrarResultado: mostrarResultadoExterno = false 
}) => {
  const [respuestaUsuario, setRespuestaUsuario] = useState(respuestaGuardada || '');
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);

  // Actualizar respuesta local si cambia desde fuera (modo simulacro)
  useEffect(() => {
    if (modoSimulacro && respuestaGuardada !== undefined) {
      setRespuestaUsuario(respuestaGuardada || '');
    }
  }, [respuestaGuardada, modoSimulacro]);

  // Extraer datos de la misión
  const pregunta = mision.pregunta || 'Resuelve la operación:';
  const respuestaEsperada = mision.respuesta;
  const explicacionCorrecta = mision.explicacion_correcta || '¡Correcto!';
  const explicacionIncorrecta = mision.explicacion_incorrecta || 'Intenta de nuevo.';

  // Determinar si mostrar resultado (interno o externo)
  const debeMostrarResultado = mostrarFeedback || (modoSimulacro && mostrarResultadoExterno);

  // Función auxiliar para verificar si la respuesta es correcta
  const verificarRespuesta = (valor) => {
    if (!valor && valor !== 0) return false;
    
    // Normalizar a string y eliminar espacios para comparar
    const valorStr = String(valor).trim();
    const esperadaStr = String(respuestaEsperada).trim();
    
    return valorStr === esperadaStr;
  };

  // Manejar cambios en el input
  const handleInputChange = (e) => {
    if (debeMostrarResultado && !modoSimulacro) return; // Bloquear si ya mostró resultado en aventura
    if (modoSimulacro && mostrarResultadoExterno) return; // Bloquear si ya calificó simulacro

    const nuevoValor = e.target.value;
    setRespuestaUsuario(nuevoValor);

    if (modoSimulacro && onRespuesta) {
      onRespuesta(nuevoValor);
    }
  };

  // Manejar envío de respuesta (Modo Aventura)
  const handleEnviar = () => {
    if (!respuestaUsuario && respuestaUsuario !== 0) return;

    const correcta = verificarRespuesta(respuestaUsuario);
    setEsCorrecta(correcta);
    setMostrarFeedback(true);

    if (correcta && onCompletar) {
      setTimeout(() => {
        onCompletar();
      }, 1500);
    }
  };

  // Reiniciar (Modo Aventura)
  const handleReintentar = () => {
    setRespuestaUsuario('');
    setMostrarFeedback(false);
    setEsCorrecta(false);
  };

  // Calcular estado de corrección para mostrar (al vuelo en simulacro, o estado en aventura)
  const esCorrectaCalculada = modoSimulacro 
    ? verificarRespuesta(respuestaUsuario)
    : esCorrecta;

  return (
    <div className="operaciones-container">
      <h3 className="operacion-pregunta">{pregunta}</h3>
      
             <div className="operacion-input-area">
               <input
                 type="text"
                 inputMode="numeric"
                 pattern="[0-9]*"
                 className={`operacion-input ${debeMostrarResultado ? (esCorrectaCalculada ? 'input-correcto' : 'input-incorrecto') : ''}`}
                 value={respuestaUsuario}
                 onChange={handleInputChange}
                 placeholder="?"
                 disabled={debeMostrarResultado} 
                 autoComplete="off"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !modoSimulacro && !debeMostrarResultado) {
                     handleEnviar();
                   }
                 }}
               />
             </div>

      {!modoSimulacro && (
        <div className="acciones-container">
          {!mostrarFeedback ? (
            <button 
              className="boton-enviar" 
              onClick={handleEnviar}
              disabled={!respuestaUsuario && respuestaUsuario !== 0}
            >
              Enviar Respuesta
            </button>
          ) : (
            !esCorrecta && (
              <button className="boton-reintentar" onClick={handleReintentar}>
                Intentar de Nuevo
              </button>
            )
          )}
        </div>
      )}

      {debeMostrarResultado && (
        <div className={`feedback-container ${esCorrectaCalculada ? 'feedback-correcto' : 'feedback-incorrecto'}`}>
          <div className="feedback-icono">
            {esCorrectaCalculada ? '✅' : '❌'}
          </div>
          <div className="feedback-texto">
            <p className="feedback-titulo">
              {esCorrectaCalculada ? '¡Excelente!' : 'No es correcto'}
            </p>
            <p className="feedback-explicacion">
              {esCorrectaCalculada ? explicacionCorrecta : explicacionIncorrecta}
            </p>
            {!esCorrectaCalculada && modoSimulacro && mostrarResultadoExterno && (
               <p className="feedback-solucion">Respuesta correcta: {respuestaEsperada}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Operaciones;

