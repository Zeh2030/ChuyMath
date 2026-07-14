import React, { useState, useEffect } from 'react';
import './CualEsDiferente.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * CualEsDiferente — "¿Cuál es diferente?" (odd-one-out) para peques (3-6 años).
 * Muestra varios emojis iguales y uno distinto; el niño toca el diferente.
 * Sin lectura, sin arte externo. Posición del intruso definida por dato (`pos`),
 * así que es determinista (sin Math.random en render).
 *
 * mision.retos: [{ iguales, diferente, total, pos }]
 */
const RETOS_DEFAULT = [
  { iguales: '🐶', diferente: '🐱', total: 4, pos: 2 },
  { iguales: '🍎', diferente: '🍌', total: 5, pos: 0 },
  { iguales: '🔵', diferente: '🔴', total: 5, pos: 3 },
  { iguales: '⭐', diferente: '❤️', total: 6, pos: 4 },
  { iguales: '🐟', diferente: '🐙', total: 6, pos: 1 },
  { iguales: '🌻', diferente: '🐝', total: 6, pos: 5 },
];

const CualEsDiferente = ({ mision, onCompletar }) => {
  const retos = (mision && mision.retos && mision.retos.length) ? mision.retos : RETOS_DEFAULT;
  const [idx, setIdx] = useState(0);
  const [sacudir, setSacudir] = useState(-1);
  const [acierto, setAcierto] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];
  const total = Math.max(2, reto.total || 4);
  const pos = Math.min(reto.pos ?? 0, total - 1);

  // Lee la instrucción en voz alta para los que aún no leen (cada reto nuevo).
  useEffect(() => {
    hablar('¿Cuál es diferente?');
  }, [idx]);

  const tocar = (i) => {
    if (acierto) return;
    if (i === pos) {
      setAcierto(true);
      sonar(880);
      window.setTimeout(() => {
        setAcierto(false);
        if (idx < retos.length - 1) setIdx(idx + 1);
        else setFin(true);
      }, 750);
    } else {
      setSacudir(i);
      sonar(200);
      window.setTimeout(() => setSacudir(-1), 400);
    }
  };

  if (fin) {
    return (
      <div className="cued-fin">
        <div className="cued-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="cued-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="cued">
      <div className="cued-pregunta">
        ¿Cuál es diferente?
        <button className="cued-voz" onClick={() => hablar('¿Cuál es diferente?')} title="Escuchar">🔊</button>
      </div>
      <div className="cued-progreso">{idx + 1} / {retos.length}</div>
      <div className="cued-grid" data-total={total}>
        {Array.from({ length: total }).map((_, i) => {
          const esDif = i === pos;
          return (
            <button
              key={i}
              className={`cued-item ${sacudir === i ? 'mal' : ''} ${acierto && esDif ? 'bien' : ''}`}
              onClick={() => tocar(i)}
            >
              {esDif ? reto.diferente : reto.iguales}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CualEsDiferente;
