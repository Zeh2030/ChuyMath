import React, { useState, useEffect } from 'react';
import './MasMenos.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * MasMenos — "¿Cuál tiene más / menos?" para peques (3-5 años).
 * Muestra dos grupos de emojis; el niño toca el que tiene más (o menos).
 * Enseña comparación de cantidades. Voz (TTS) para pre-lectores. Determinista.
 *
 * mision.retos: [{ emoji, izq, der, pregunta: 'mas'|'menos' }]
 */
const RETOS_DEFAULT = [
  { emoji: '🍎', izq: 2, der: 4, pregunta: 'mas' },
  { emoji: '⭐', izq: 5, der: 3, pregunta: 'mas' },
  { emoji: '🐶', izq: 1, der: 3, pregunta: 'menos' },
  { emoji: '🎈', izq: 4, der: 2, pregunta: 'menos' },
  { emoji: '🐟', izq: 3, der: 6, pregunta: 'mas' },
  { emoji: '🌸', izq: 5, der: 2, pregunta: 'menos' },
];

const textoPregunta = (p) => (p === 'menos' ? '¿Cuál tiene menos?' : '¿Cuál tiene más?');

const MasMenos = ({ mision, onCompletar }) => {
  const retos = (mision && mision.retos && mision.retos.length) ? mision.retos : RETOS_DEFAULT;
  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState('');
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];
  const pregunta = textoPregunta(reto.pregunta);
  const correcto = reto.pregunta === 'menos'
    ? (reto.izq < reto.der ? 'izq' : 'der')
    : (reto.izq > reto.der ? 'izq' : 'der');

  useEffect(() => {
    hablar(textoPregunta(retos[idx].pregunta));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const tocar = (lado) => {
    if (ok) return;
    if (lado === correcto) {
      setOk(true);
      sonar(880);
      window.setTimeout(() => {
        setOk(false);
        if (idx < retos.length - 1) setIdx(idx + 1);
        else setFin(true);
      }, 800);
    } else {
      setMal(lado);
      sonar(200);
      window.setTimeout(() => setMal(''), 400);
    }
  };

  const grupo = (lado, n) => (
    <button
      className={`mm-grupo ${mal === lado ? 'mal' : ''} ${ok && lado === correcto ? 'bien' : ''}`}
      onClick={() => tocar(lado)}
    >
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="mm-item">{reto.emoji}</span>
      ))}
    </button>
  );

  if (fin) {
    return (
      <div className="mm-fin">
        <div className="mm-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="mm-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="mm">
      <div className="mm-pregunta">
        {pregunta}
        <button className="mm-voz" onClick={() => hablar(pregunta)} title="Escuchar">🔊</button>
      </div>
      <div className="mm-progreso">{idx + 1} / {retos.length}</div>

      <div className="mm-grupos">
        {grupo('izq', reto.izq)}
        <span className="mm-vs">o</span>
        {grupo('der', reto.der)}
      </div>
    </div>
  );
};

export default MasMenos;
