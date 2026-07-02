import React, { useState } from 'react';
import './QueSigue.css';
import { sonar } from '../../../utils/sonido';

/**
 * QueSigue — "¿Qué sigue?" (patrones) para peques (3-5 años).
 * Muestra una secuencia de emojis y un hueco; el niño toca la opción que continúa.
 * Enseña patrones y lógica. Sin lectura. Determinista.
 *
 * mision.retos: [{ secuencia: [emoji...], opciones: [emoji...], respuesta: emoji }]
 */
const RETOS_DEFAULT = [
  { secuencia: ['🔴', '🔵', '🔴', '🔵'], opciones: ['🔴', '🟡', '🔵'], respuesta: '🔴' },
  { secuencia: ['🐶', '🐱', '🐶', '🐱'], opciones: ['🐭', '🐶', '🐱'], respuesta: '🐶' },
  { secuencia: ['⭐', '🌙', '⭐', '🌙'], opciones: ['⭐', '☀️', '🌙'], respuesta: '⭐' },
  { secuencia: ['🍎', '🍌', '🍎', '🍌'], opciones: ['🍇', '🍎', '🍌'], respuesta: '🍎' },
  { secuencia: ['🔺', '🟦', '🔺', '🟦'], opciones: ['🔺', '🟩', '🟦'], respuesta: '🔺' },
  { secuencia: ['🐤', '🐤', '🐘', '🐤', '🐤'], opciones: ['🐘', '🐤', '🐱'], respuesta: '🐘' },
];

const QueSigue = ({ mision, onCompletar }) => {
  const retos = (mision && mision.retos && mision.retos.length) ? mision.retos : RETOS_DEFAULT;
  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState(-1);
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];

  const tocar = (op, i) => {
    if (ok) return;
    if (op === reto.respuesta) {
      setOk(true);
      sonar(880);
      window.setTimeout(() => {
        setOk(false);
        if (idx < retos.length - 1) setIdx(idx + 1);
        else setFin(true);
      }, 750);
    } else {
      setMal(i);
      sonar(200);
      window.setTimeout(() => setMal(-1), 400);
    }
  };

  if (fin) {
    return (
      <div className="qs-fin">
        <div className="qs-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="qs-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="qs">
      <div className="qs-pregunta">¿Qué sigue?</div>
      <div className="qs-progreso">{idx + 1} / {retos.length}</div>

      <div className="qs-secuencia">
        {reto.secuencia.map((e, i) => (
          <span key={i} className="qs-item">{e}</span>
        ))}
        <span className="qs-item qs-hueco">❓</span>
      </div>

      <div className="qs-opciones">
        {reto.opciones.map((op, i) => (
          <button
            key={i}
            className={`qs-opcion ${mal === i ? 'mal' : ''} ${ok && op === reto.respuesta ? 'bien' : ''}`}
            onClick={() => tocar(op, i)}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QueSigue;
