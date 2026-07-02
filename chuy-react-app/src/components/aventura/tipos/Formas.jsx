import React, { useState, useEffect } from 'react';
import './Formas.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * Formas — "Toca el ___" para peques (2-4 años).
 * Dice el nombre de una figura (voz) y el niño toca la forma correcta.
 * Enseña vocabulario de formas. Voz (TTS) para pre-lectores. Determinista.
 *
 * mision.retos: [{ nombre, respuesta: emoji, opciones: [emoji...] }]
 */
const RETOS_DEFAULT = [
  { nombre: 'círculo', respuesta: '🔵', opciones: ['🔺', '🔵', '🟨'] },
  { nombre: 'triángulo', respuesta: '🔺', opciones: ['🔺', '🟦', '⭐'] },
  { nombre: 'cuadrado', respuesta: '🟦', opciones: ['🔴', '🟦', '🔺'] },
  { nombre: 'estrella', respuesta: '⭐', opciones: ['❤️', '⭐', '🔷'] },
  { nombre: 'corazón', respuesta: '❤️', opciones: ['⭐', '❤️', '🔵'] },
  { nombre: 'rombo', respuesta: '🔷', opciones: ['🔷', '🟩', '🔺'] },
];

const Formas = ({ mision, onCompletar }) => {
  const retos = (mision && mision.retos && mision.retos.length) ? mision.retos : RETOS_DEFAULT;
  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState(-1);
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];

  useEffect(() => {
    hablar(retos[idx].nombre);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

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
      <div className="fmt-fin">
        <div className="fmt-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="fmt-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="fmt">
      <div className="fmt-pregunta">
        Toca: <strong>{reto.nombre}</strong>
        <button className="fmt-voz" onClick={() => hablar(reto.nombre)} title="Escuchar">🔊</button>
      </div>
      <div className="fmt-progreso">{idx + 1} / {retos.length}</div>

      <div className="fmt-opciones">
        {reto.opciones.map((op, i) => (
          <button
            key={i}
            className={`fmt-opcion ${mal === i ? 'mal' : ''} ${ok && op === reto.respuesta ? 'bien' : ''}`}
            onClick={() => tocar(op, i)}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Formas;
