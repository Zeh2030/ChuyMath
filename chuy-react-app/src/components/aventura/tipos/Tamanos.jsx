import React, { useState, useEffect } from 'react';
import './Tamanos.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * Tamanos — "¿Cuál es el más grande/pequeño?" para peques (3-5 años).
 * Muestra el mismo emoji en varios tamaños; el niño toca el más grande o el más pequeño.
 * Enseña comparación de tamaño. Voz (TTS) lee la pregunta para pre-lectores. Determinista.
 *
 * mision.retos: [{ emoji, tamanos: [escala...], pregunta: 'grande'|'pequeno', pos }]
 */
const RETOS_DEFAULT = [
  { emoji: '🐻', tamanos: [1, 1.9], pregunta: 'grande', pos: 1 },
  { emoji: '⭐', tamanos: [2.1, 1.3, 0.9], pregunta: 'grande', pos: 0 },
  { emoji: '🍎', tamanos: [1, 1.8], pregunta: 'grande', pos: 1 },
  { emoji: '🐟', tamanos: [1.6, 0.9], pregunta: 'pequeno', pos: 1 },
  { emoji: '🎈', tamanos: [0.9, 1.5, 2.1], pregunta: 'pequeno', pos: 0 },
  { emoji: '🐶', tamanos: [1.2, 2, 0.8], pregunta: 'grande', pos: 1 },
];

const textoPregunta = (p) => (p === 'pequeno' ? '¿Cuál es el más pequeño?' : '¿Cuál es el más grande?');

const Tamanos = ({ mision, onCompletar }) => {
  const retos = (mision && mision.retos && mision.retos.length) ? mision.retos : RETOS_DEFAULT;
  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState(-1);
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];
  const pregunta = textoPregunta(reto.pregunta);
  const base = reto.base || 2;

  // Lee la pregunta en voz alta al cambiar de reto (ayuda a los pre-lectores).
  useEffect(() => {
    hablar(textoPregunta(retos[idx].pregunta));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const tocar = (i) => {
    if (ok) return;
    if (i === reto.pos) {
      setOk(true);
      sonar(880);
      window.setTimeout(() => {
        setOk(false);
        if (idx < retos.length - 1) setIdx(idx + 1);
        else setFin(true);
      }, 800);
    } else {
      setMal(i);
      sonar(200);
      window.setTimeout(() => setMal(-1), 400);
    }
  };

  if (fin) {
    return (
      <div className="tam-fin">
        <div className="tam-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="tam-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="tam">
      <div className="tam-pregunta">
        {pregunta}
        <button className="tam-voz" onClick={() => hablar(pregunta)} title="Escuchar">🔊</button>
      </div>
      <div className="tam-progreso">{idx + 1} / {retos.length}</div>

      <div className="tam-opciones">
        {reto.tamanos.map((s, i) => (
          <button
            key={i}
            className={`tam-opcion ${mal === i ? 'mal' : ''} ${ok && i === reto.pos ? 'bien' : ''}`}
            onClick={() => tocar(i)}
          >
            <span className="tam-emoji" style={{ fontSize: `${base * s}rem` }}>{reto.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tamanos;
