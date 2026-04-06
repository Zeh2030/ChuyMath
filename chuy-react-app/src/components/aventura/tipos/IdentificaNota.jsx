import React, { useState, useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import './IdentificaNota.css';

/**
 * IdentificaNota — juego de lectura de notas en el pentagrama.
 *
 * Formato JSON:
 * {
 *   "tipo": "identifica-nota",
 *   "clave": "treble" | "bass",   // clave opcional, default "treble"
 *   "tonalidad": "C",              // tonalidad opcional, default "C"
 *   "retos": [
 *     { "nota_abc": "C", "respuesta": "Do", "opciones": ["Do","Re","Mi","Fa"] },
 *     ...
 *   ]
 * }
 */
const IdentificaNota = ({ mision, onCompletar }) => {
  const {
    clave = 'treble',
    tonalidad = 'C',
    retos = [],
  } = mision;

  const [idx, setIdx] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [aciertos, setAciertos] = useState(0);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const staffRef = useRef(null);

  const retoActual = retos[idx];
  const total = retos.length;

  // Render single note on staff
  useEffect(() => {
    if (!staffRef.current || !retoActual) return;

    const abc = [
      'X:1',
      'M:4/4',
      'L:1/4',
      `K:${tonalidad} clef=${clave}`,
      `${retoActual.nota_abc}4 |]`,
    ].join('\n');

    staffRef.current.innerHTML = '';
    abcjs.renderAbc(staffRef.current, abc, {
      scale: 2.5,
      paddingtop: 10,
      paddingbottom: 10,
      paddingleft: 20,
      paddingright: 20,
      staffwidth: 250,
      wrap: null,
    });
  }, [idx, retoActual, clave, tonalidad]);

  const handleSeleccion = (opcion) => {
    if (mostrarFeedback) return;
    setSeleccion(opcion);
    setMostrarFeedback(true);

    const correcto = opcion === retoActual.respuesta;
    if (correcto) setAciertos(prev => prev + 1);

    setTimeout(() => {
      if (idx + 1 >= total) {
        if (onCompletar) onCompletar();
      } else {
        setIdx(prev => prev + 1);
        setSeleccion(null);
        setMostrarFeedback(false);
      }
    }, 1500);
  };

  if (!retoActual) {
    return <div className="idn-error">No hay retos disponibles</div>;
  }

  return (
    <div className="idn-container">
      <div className="idn-progreso">
        <span className="idn-contador">{idx + 1} / {total}</span>
        <span className="idn-racha">🔥 {aciertos}</span>
      </div>

      <p className="idn-pregunta">¿Qué nota es esta?</p>

      <div className="idn-staff-wrapper">
        <div className="idn-staff" ref={staffRef}></div>
      </div>

      <div className="idn-opciones">
        {retoActual.opciones.map((opcion) => {
          let className = 'idn-opcion';
          if (mostrarFeedback) {
            if (opcion === retoActual.respuesta) className += ' correcto';
            else if (opcion === seleccion) className += ' incorrecto';
          }
          return (
            <button
              key={opcion}
              className={className}
              onClick={() => handleSeleccion(opcion)}
              disabled={mostrarFeedback}
            >
              {opcion}
            </button>
          );
        })}
      </div>

      {mostrarFeedback && (
        <div className={`idn-feedback ${seleccion === retoActual.respuesta ? 'correcto' : 'incorrecto'}`}>
          {seleccion === retoActual.respuesta ? '¡Correcto! 🎉' : `La respuesta era: ${retoActual.respuesta}`}
        </div>
      )}
    </div>
  );
};

export default IdentificaNota;
