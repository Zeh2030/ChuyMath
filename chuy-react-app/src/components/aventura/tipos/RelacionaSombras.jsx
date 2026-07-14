import React, { useState, useEffect } from 'react';
import './RelacionaSombras.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * RelacionaSombras — emparejar un objeto con su sombra (silueta) para peques (4-6 años).
 * El objeto se muestra a color; las opciones son siluetas (mismo emoji en negro por CSS).
 * Sin lectura, sin arte externo. La opción correcta es la que coincide con el objeto
 * (determinista, sin Math.random en render).
 *
 * mision.retos: [{ objeto, opciones: [emoji, ...] }] (una opción === objeto)
 */
const RETOS_DEFAULT = [
  { objeto: '🦋', opciones: ['🐟', '🦋', '⭐'] },
  { objeto: '🐘', opciones: ['🐘', '🐢', '🐦'] },
  { objeto: '🚗', opciones: ['✈️', '🚲', '🚗'] },
  { objeto: '🌳', opciones: ['🌳', '🍄', '🌸'] },
  { objeto: '🐠', opciones: ['🦀', '🐠', '🐙'] },
];

const RelacionaSombras = ({ mision, onCompletar }) => {
  const retos = (mision && mision.retos && mision.retos.length) ? mision.retos : RETOS_DEFAULT;
  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState(-1);
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];

  // Lee la instrucción en voz alta para los que aún no leen (cada reto nuevo).
  useEffect(() => {
    hablar('¿De quién es la sombra?');
  }, [idx]);

  const tocar = (opcion, i) => {
    if (ok) return;
    if (opcion === reto.objeto) {
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
      <div className="rs-fin">
        <div className="rs-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="rs-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="rs">
      <div className="rs-pregunta">
        ¿De quién es la sombra?
        <button className="rs-voz" onClick={() => hablar('¿De quién es la sombra?')} title="Escuchar">🔊</button>
      </div>
      <div className="rs-progreso">{idx + 1} / {retos.length}</div>
      <div className="rs-objeto">{reto.objeto}</div>
      <div className="rs-flecha">⬇️</div>
      <div className="rs-opciones">
        {reto.opciones.map((o, i) => (
          <button
            key={i}
            className={`rs-sombra ${mal === i ? 'mal' : ''} ${ok && o === reto.objeto ? 'bien' : ''}`}
            onClick={() => tocar(o, i)}
          >
            <span className="rs-silueta">{o}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelacionaSombras;
