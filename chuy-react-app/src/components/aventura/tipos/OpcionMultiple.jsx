import React, { useState } from 'react';
import './OpcionMultiple.css';

/**
 * Componente para misiones de opción múltiple.
 * Muestra una pregunta y varias opciones, permitiendo al usuario seleccionar una respuesta.
 * 
 * @param {Object} mision - El objeto de la misión con pregunta, opciones y respuesta
 * @param {Function} onCompletar - Callback que se ejecuta cuando se responde correctamente
 * @param {Boolean} modoSimulacro - Si está en modo simulacro (sin feedback inmediato)
 * @param {*} respuestaGuardada - Respuesta guardada del usuario (para modo simulacro)
 * @param {Function} onRespuesta - Callback para guardar respuesta en modo simulacro
 * @param {Boolean} mostrarResultado - Si debe mostrar el resultado (modo simulacro calificado)
 */
const OpcionMultiple = ({ 
  mision, 
  onCompletar,
  modoSimulacro = false,
  respuestaGuardada = null,
  onRespuesta = null,
  mostrarResultado: mostrarResultadoExterno = false
}) => {
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(respuestaGuardada);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);

  // Actualizar respuesta seleccionada si cambia desde fuera (modo simulacro)
  React.useEffect(() => {
    if (modoSimulacro) {
      setRespuestaSeleccionada(respuestaGuardada);
    }
  }, [respuestaGuardada, modoSimulacro]);

  // Extraer datos de la misión
  const pregunta = mision.pregunta || mision.pregunta_final || 'Selecciona la respuesta correcta:';
  const opciones = mision.opciones || mision.opciones_finales || [];
  const respuestaCorrecta = mision.respuesta || mision.respuesta_final || '';
  const explicacionCorrecta = mision.explicacion_correcta || '¡Correcto!';
  const explicacionIncorrecta = mision.explicacion_incorrecta || 'Intenta de nuevo.';
  const opcionesSonImagenes = mision.opciones_son_imagenes || false;
  const imagen = mision.imagen || null;

  // DEBUG: Mostrar información de la misión (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OpcionMultiple] ${mision.titulo}:`, {
      respuestaCorrecta,
      tipo: typeof respuestaCorrecta,
      respuestaSeleccionada,
      esModoSimulacro: modoSimulacro
    });
  }

  // Manejar selección de opción
  const handleSeleccion = (opcion, indice) => {
    if (mostrarResultado || mostrarResultadoExterno) return; // No permitir cambiar después de responder
    
    // Determinar si debemos guardar el índice o el valor
    // En modo simulacro, preferimos índices si la respuesta parece un índice
    const esIndice = typeof respuestaCorrecta === 'number' || 
                     (typeof respuestaCorrecta === 'string' && /^\d+$/.test(respuestaCorrecta));
    
    const valorSeleccionado = esIndice ? indice.toString() : opcion;
    
    setRespuestaSeleccionada(valorSeleccionado);
    
    // En modo simulacro, notificar al padre inmediatamente
    if (modoSimulacro && onRespuesta) {
      onRespuesta(valorSeleccionado);
    }
  };

  // Manejar envío de respuesta
  const handleEnviar = () => {
    if (respuestaSeleccionada === null || respuestaSeleccionada === undefined) return;

    // Comparar respuesta (normalizar tipos)
    let correcta = false;
    if (typeof respuestaCorrecta === 'number') {
      // respuestaCorrecta es un número, comparar como números
      correcta = parseInt(respuestaSeleccionada) === respuestaCorrecta;
    } else if (typeof respuestaCorrecta === 'string' && /^\d+$/.test(respuestaCorrecta)) {
      // respuestaCorrecta es un string numérico, comparar como strings
      correcta = respuestaSeleccionada === respuestaCorrecta;
    } else {
      // respuestaCorrecta es un valor no-numérico, comparar directamente
      correcta = respuestaSeleccionada === respuestaCorrecta;
    }

    setEsCorrecta(correcta);
    setMostrarResultado(true);

    // Si es correcta, llamar al callback después de un breve delay
    if (correcta && onCompletar) {
      setTimeout(() => {
        onCompletar();
      }, 2000); // Esperar 2 segundos para que el usuario vea el feedback
    }
  };

  // Reiniciar para intentar de nuevo
  const handleReintentar = () => {
    setRespuestaSeleccionada(null);
    setMostrarResultado(false);
    setEsCorrecta(false);
  };

  // Determinar si una opción está seleccionada
  const estaOpcionSeleccionada = (index) => {
    const esIndice = typeof respuestaCorrecta === 'number' || (typeof respuestaCorrecta === 'string' && /^\d+$/.test(respuestaCorrecta));
    if (esIndice) {
      // Si la respuesta es un índice, comparar índices
      return respuestaSeleccionada === index || respuestaSeleccionada === index.toString();
    } else {
      // Si no, comparar valores
      return respuestaSeleccionada === opciones[index];
    }
  };

  // Determinar si una opción es la correcta
  const esOpcionCorrecta = (index) => {
    if (typeof respuestaCorrecta === 'number') {
      // Si la respuesta es un número, comparar directamente
      return respuestaCorrecta === index;
    } else if (typeof respuestaCorrecta === 'string' && /^\d+$/.test(respuestaCorrecta)) {
      // Si la respuesta es un string numérico, convertir a número y comparar
      return parseInt(respuestaCorrecta) === index;
    } else {
      return opciones[index] === respuestaCorrecta;
    }
  };

  // Determinar si la respuesta es correcta (lógica unificada)
  const verificarRespuesta = (seleccion) => {
    if (seleccion === null || seleccion === undefined) return false;
    
    // Normalizar ambos valores a string para comparación
    const seleccionStr = seleccion.toString();
    const respuestaStr = respuestaCorrecta.toString();
    
    return seleccionStr === respuestaStr;
  };

  // Calcular estado de corrección
  // En modo simulacro, se calcula al vuelo. En modo normal, usa el estado.
  const esCorrectaCalculada = modoSimulacro 
    ? verificarRespuesta(respuestaSeleccionada)
    : esCorrecta;

  // Determinar si mostrar resultado
  const debeMostrarResultado = mostrarResultado || (modoSimulacro && mostrarResultadoExterno);

  return (
    <div className="opcion-multiple-container">
      {/* Pregunta */}
      <div className="pregunta-container">
        <h3 className="pregunta-texto">{pregunta}</h3>
        {imagen && (
          <div 
            className="pregunta-imagen"
            dangerouslySetInnerHTML={{ __html: imagen }}
          />
        )}
      </div>

      {/* Opciones */}
      <div className={`opciones-container ${opcionesSonImagenes ? 'opciones-imagenes' : ''}`}>
        {opciones.map((opcion, index) => {
          const estaSeleccionada = estaOpcionSeleccionada(index);
          // Para resaltar opciones correctas/incorrectas al final
          const esLaCorrecta = esOpcionCorrecta(index);
          
          let claseOpcion = 'opcion-item';
          
          if (debeMostrarResultado) {
            if (esLaCorrecta) {
              claseOpcion += ' opcion-correcta';
            } else if (estaSeleccionada && !esLaCorrecta) {
              claseOpcion += ' opcion-incorrecta';
            }
          } else if (estaSeleccionada) {
            claseOpcion += ' opcion-seleccionada';
          }

          return (
            <button
              key={index}
              className={claseOpcion}
              onClick={() => handleSeleccion(opcion, index)}
              disabled={debeMostrarResultado}
            >
              {opcionesSonImagenes ? (
                <div 
                  className="opcion-imagen"
                  dangerouslySetInnerHTML={{ __html: opcion }}
                />
              ) : (
                opcion
              )}
            </button>
          );
        })}
      </div>

      {/* Botón de Enviar / Reintentar - Solo en modo normal */}
      {!modoSimulacro && (
        <div className="acciones-container">
          {!mostrarResultado ? (
            <button
              className="boton-enviar"
              onClick={handleEnviar}
              disabled={!respuestaSeleccionada}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default OpcionMultiple;

