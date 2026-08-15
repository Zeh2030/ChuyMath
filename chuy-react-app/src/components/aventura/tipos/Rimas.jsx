import React, { useState, useEffect } from 'react';
import './Rimas.css';
import { sonar, hablar, VOZ_LETRAS } from '../../../utils/sonido';

/**
 * Rimas — "¿cuál rima con sol?" → caracol.
 *
 * Es conciencia fonologica pura: oir que dos palabras terminan igual. Se juega
 * SIN saber ninguna letra, y por eso vive fuera de la progresion L0/L1/L2 y sirve
 * desde antes de empezar con el abecedario (tambien al hermano de 2-3 anos).
 *
 * Todo es de oido: cada opcion se pronuncia al tocarla, y la consigna se repite con
 * el boton. Las opciones llevan dibujo + palabra porque a esta edad el dibujo es lo
 * que se "lee".
 *
 * mision.retos: [{ emoji, palabra, respuesta, opciones: [{ palabra, emoji }] }]
 */
const INSTRUCCION_DEFAULT = 'Escucha bien y toca la palabra que suena parecido al final.';

const RETOS_DEFAULT = [
  { emoji: '🐱', palabra: 'gato', respuesta: 'pato',
    opciones: [{ palabra: 'pato', emoji: '🦆' }, { palabra: 'sol', emoji: '☀️' }, { palabra: 'flor', emoji: '🌸' }] },
  { emoji: '☀️', palabra: 'sol', respuesta: 'caracol',
    opciones: [{ palabra: 'gato', emoji: '🐱' }, { palabra: 'caracol', emoji: '🐌' }, { palabra: 'pera', emoji: '🍐' }] },
  { emoji: '🐭', palabra: 'ratón', respuesta: 'limón',
    opciones: [{ palabra: 'limón', emoji: '🍋' }, { palabra: 'pato', emoji: '🦆' }, { palabra: 'luna', emoji: '🌙' }] },
  { emoji: '⚽', palabra: 'pelota', respuesta: 'bota',
    opciones: [{ palabra: 'perro', emoji: '🐕' }, { palabra: 'bota', emoji: '👢' }, { palabra: 'luna', emoji: '🌙' }] },
  { emoji: '🐰', palabra: 'conejo', respuesta: 'espejo',
    opciones: [{ palabra: 'espejo', emoji: '🪞' }, { palabra: 'gato', emoji: '🐱' }, { palabra: 'sol', emoji: '☀️' }] },
];

const Rimas = ({ mision, onCompletar }) => {
  const retos = (mision && mision.retos && mision.retos.length) ? mision.retos : RETOS_DEFAULT;
  const instruccion = (mision && mision.instruccion) || INSTRUCCION_DEFAULT;

  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState(-1);
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];
  const consigna = `¿Cuál rima con ${reto.palabra}?`;

  useEffect(() => {
    hablar(idx === 0 ? `${instruccion} ${consigna}` : consigna, VOZ_LETRAS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const tocar = (op, i) => {
    if (ok) return;
    if (op.palabra === reto.respuesta) {
      setOk(true);
      sonar(880);
      // El refuerzo es oir las dos juntas: ahi esta la rima.
      hablar(`${reto.palabra}... ${op.palabra}. ¡Riman!`, VOZ_LETRAS);
      window.setTimeout(() => {
        setOk(false);
        if (idx < retos.length - 1) setIdx(idx + 1);
        else setFin(true);
      }, 1600);
    } else {
      setMal(i);
      sonar(200);
      // Aun fallando se oye la palabra: explorar tocando tambien ensena.
      hablar(op.palabra, VOZ_LETRAS);
      window.setTimeout(() => setMal(-1), 400);
    }
  };

  if (fin) {
    return (
      <div className="rim-fin">
        <div className="rim-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="rim-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="rim">
      <div className="rim-pregunta">
        {consigna}
        <button className="rim-voz" onClick={() => hablar(consigna, VOZ_LETRAS)} title="Escuchar">🔊</button>
      </div>
      <div className="rim-progreso">{idx + 1} / {retos.length}</div>

      <div className="rim-estimulo">
        <span className="rim-estimulo-emoji">{reto.emoji}</span>
        <span className="rim-estimulo-palabra">{reto.palabra}</span>
      </div>

      <div className="rim-opciones">
        {reto.opciones.map((op, i) => (
          <button
            key={op.palabra}
            className={`rim-opcion ${mal === i ? 'mal' : ''} ${ok && op.palabra === reto.respuesta ? 'bien' : ''}`}
            onClick={() => tocar(op, i)}
          >
            <span className="rim-opcion-emoji">{op.emoji}</span>
            <span className="rim-opcion-palabra">{op.palabra}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Rimas;
