import React, { useRef, useState } from 'react';
import './TapAndCelebrate.css';
import { sonar, NOTAS } from '../../../utils/sonido';

/**
 * TapAndCelebrate — juguete de causa-efecto para los más pequeños (2-3 años).
 * Tocar la pantalla lanza emojis que vuelan + un sonido alegre. Sin lectura, sin objetivo.
 */
const EMOJIS_DEFAULT = ['⭐', '🎈', '✨', '🎉', '💫', '🌈', '❤️', '🐱', '🦄', '🌟'];

const TapAndCelebrate = ({ mision }) => {
  const emojis = (mision && mision.emojis) || EMOJIS_DEFAULT;
  const [particulas, setParticulas] = useState([]);
  const idRef = useRef(0);

  const celebrar = (e) => {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;
    const cuantas = 7;
    const nuevas = [];
    for (let k = 0; k < cuantas; k++) {
      const id = ++idRef.current;
      const ang = (k / cuantas) * 2 * Math.PI;
      const dist = 60 + Math.random() * 90;
      nuevas.push({
        id,
        x,
        y,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist - 40,
      });
    }
    setParticulas((prev) => [...prev, ...nuevas]);
    sonar(NOTAS[Math.floor(Math.random() * NOTAS.length)]);
    const ids = nuevas.map((p) => p.id);
    window.setTimeout(() => {
      setParticulas((prev) => prev.filter((p) => !ids.includes(p.id)));
    }, 1000);
  };

  return (
    <div className="tapcel" onPointerDown={celebrar}>
      <div className="tapcel-hint">👆 ¡Toca la pantalla!</div>
      {particulas.map((p) => (
        <span
          key={p.id}
          className="tapcel-particula"
          style={{ left: p.x, top: p.y, '--dx': `${p.dx}px`, '--dy': `${p.dy}px` }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};

export default TapAndCelebrate;
