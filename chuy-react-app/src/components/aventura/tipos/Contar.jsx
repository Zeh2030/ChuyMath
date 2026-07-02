import React, { useState } from 'react';
import './Contar.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * Contar — "¿Cuántos hay?" para peques (3-5 años).
 * Muestra N emojis y 3 números; el niño toca el número correcto. Enseña a contar (1-10).
 * Sin lectura esencial (las opciones son números). Contenido determinista.
 *
 * mision.retos: [{ emoji, cantidad, opciones: [n, n, n] }]
 */
const RETOS_DEFAULT = [
  { emoji: '🍎', cantidad: 2, opciones: [2, 3, 1] },
  { emoji: '⭐', cantidad: 3, opciones: [2, 3, 4] },
  { emoji: '🐶', cantidad: 1, opciones: [1, 2, 3] },
  { emoji: '🎈', cantidad: 4, opciones: [3, 4, 5] },
  { emoji: '🐟', cantidad: 5, opciones: [5, 4, 6] },
  { emoji: '🌸', cantidad: 3, opciones: [4, 3, 2] },
  { emoji: '🚗', cantidad: 2, opciones: [1, 2, 3] },
  { emoji: '🍌', cantidad: 6, opciones: [5, 6, 7] },
];

const Contar = ({ mision, onCompletar }) => {
  const retos = (mision && mision.retos && mision.retos.length) ? mision.retos : RETOS_DEFAULT;
  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState(null);
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];
  const cantidad = Math.max(1, reto.cantidad || 1);
  const opciones = reto.opciones && reto.opciones.length ? reto.opciones : [cantidad, cantidad + 1, cantidad - 1];

  const tocar = (n) => {
    if (ok) return;
    if (n === cantidad) {
      setOk(true);
      sonar(880);
      hablar(String(cantidad));
      window.setTimeout(() => {
        setOk(false);
        if (idx < retos.length - 1) setIdx(idx + 1);
        else setFin(true);
      }, 900);
    } else {
      setMal(n);
      sonar(200);
      window.setTimeout(() => setMal(null), 400);
    }
  };

  if (fin) {
    return (
      <div className="contar-fin">
        <div className="contar-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="contar-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="contar">
      <div className="contar-pregunta">¿Cuántos hay?</div>
      <div className="contar-progreso">{idx + 1} / {retos.length}</div>

      <div className="contar-escena">
        {Array.from({ length: cantidad }).map((_, i) => (
          <span key={i} className="contar-item">{reto.emoji}</span>
        ))}
      </div>

      <div className="contar-opciones">
        {opciones.map((n, i) => (
          <button
            key={i}
            className={`contar-num ${mal === n ? 'mal' : ''} ${ok && n === cantidad ? 'bien' : ''}`}
            onClick={() => tocar(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Contar;
