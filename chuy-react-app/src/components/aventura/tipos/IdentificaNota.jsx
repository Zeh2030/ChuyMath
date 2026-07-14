import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [terminado, setTerminado] = useState(false);
  const staffRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);

  const retoActual = retos[idx];
  const total = retos.length;

  // Baraja las opciones por reto de forma DETERMINISTA (sembrado por idx): así
  // varía la posición de la respuesta sin usar Math.random en render (regla de
  // pureza) y sin setState en efecto. Un LCG pequeño basta para 3-4 opciones.
  const opciones = useMemo(() => {
    if (!retoActual) return [];
    const arr = [...retoActual.opciones];
    let seed = (idx + 1) * 9301 + 49297;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [retoActual, idx]);

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
    const visual = abcjs.renderAbc(staffRef.current, abc, {
      scale: 2.5,
      paddingtop: 10,
      paddingbottom: 10,
      paddingleft: 20,
      paddingright: 20,
      staffwidth: 250,
      wrap: null,
    });
    visualObjRef.current = visual[0];
  }, [retoActual, clave, tonalidad]);

  // Play current note using abcjs synth (soundfont). Sirve para "escuchar" antes
  // de responder y como refuerzo al contestar.
  const playNote = async () => {
    if (!visualObjRef.current) return;
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const synth = new abcjs.synth.CreateSynth();
      await synth.init({
        visualObj: visualObjRef.current,
        audioContext: audioContextRef.current,
        options: {
          qpm: 60,
          soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
          program: 0,
        },
      });
      await synth.prime();
      synth.start();
    } catch (e) {
      console.warn('Error playing note:', e);
    }
  };

  const handleSeleccion = (opcion) => {
    if (mostrarFeedback) return;
    setSeleccion(opcion);
    setMostrarFeedback(true);

    const correcto = opcion === retoActual.respuesta;
    if (correcto) setAciertos(prev => prev + 1);

    // Play the note's sound — helps pedagogically whether answer was right or wrong
    playNote();

    setTimeout(() => {
      if (idx + 1 >= total) {
        setTerminado(true);
      } else {
        setIdx(prev => prev + 1);
        setSeleccion(null);
        setMostrarFeedback(false);
      }
    }, 1500);
  };

  const reiniciar = () => {
    setIdx(0);
    setSeleccion(null);
    setMostrarFeedback(false);
    setAciertos(0);
    setTerminado(false);
  };

  if (!retoActual) {
    return <div className="idn-error">No hay retos disponibles</div>;
  }

  // Pantalla final con puntaje y estrellas
  if (terminado) {
    const pct = total ? aciertos / total : 0;
    const estrellas = pct === 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;
    const titulo = pct === 1 ? '¡Perfecto!' : pct >= 0.7 ? '¡Muy bien!' : '¡Sigue practicando!';
    return (
      <div className="idn-container idn-fin">
        <div className="idn-fin-emoji">{pct >= 0.7 ? '🎉' : '🎹'}</div>
        <h2 className="idn-fin-titulo">{titulo}</h2>
        <div className="idn-fin-estrellas">
          {[0, 1, 2].map(i => (
            <span key={i} className={i < estrellas ? 'idn-estrella on' : 'idn-estrella'}>
              {i < estrellas ? '⭐' : '☆'}
            </span>
          ))}
        </div>
        <p className="idn-fin-score">Acertaste <b>{aciertos}</b> de <b>{total}</b></p>
        <div className="idn-fin-botones">
          <button className="idn-fin-btn idn-fin-repetir" onClick={reiniciar}>🔁 Otra vez</button>
          <button className="idn-fin-btn idn-fin-continuar" onClick={onCompletar}>Continuar →</button>
        </div>
      </div>
    );
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

      <button className="idn-escuchar" onClick={playNote}>
        🔊 Escuchar la nota
      </button>

      <div className="idn-opciones">
        {opciones.map((opcion) => {
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
