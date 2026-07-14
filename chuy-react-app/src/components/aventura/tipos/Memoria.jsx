import React, { useState, useEffect } from 'react';
import './Memoria.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * Memoria — encontrar parejas de cartas iguales (memoria visual) para peques (4-6 años).
 * Sin lectura. El mazo se baraja en un handler (no en render), así que cumple las reglas.
 *
 * mision.emojis: lista de emojis para las parejas. mision.pares: número de parejas (default 4).
 */
const EMOJIS_DEFAULT = ['🐶', '🐱', '🦊', '🐰', '🐻', '🐼'];

const Memoria = ({ mision, onCompletar }) => {
  const emojis = (mision && mision.emojis && mision.emojis.length) ? mision.emojis : EMOJIS_DEFAULT;
  const pares = Math.min(Math.max(2, (mision && mision.pares) || 4), emojis.length);

  const [cartas, setCartas] = useState(null); // null = pantalla de inicio
  const [volteadas, setVolteadas] = useState([]); // índices arriba (sin emparejar)
  const [encontradas, setEncontradas] = useState([]); // índices ya emparejados
  const [bloqueo, setBloqueo] = useState(false);

  // Lee la instrucción en voz alta al entrar (para los que aún no leen).
  useEffect(() => {
    hablar('Encuentra las parejas');
  }, []);

  const iniciar = () => {
    const sel = emojis.slice(0, pares);
    const mazo = [...sel, ...sel]
      .map((e, i) => ({ e, id: i }))
      .sort(() => Math.random() - 0.5);
    setCartas(mazo);
    setVolteadas([]);
    setEncontradas([]);
    setBloqueo(false);
  };

  const tocar = (i) => {
    if (bloqueo || volteadas.includes(i) || encontradas.includes(i)) return;
    const nuevas = [...volteadas, i];
    setVolteadas(nuevas);
    if (nuevas.length === 2) {
      setBloqueo(true);
      const [a, b] = nuevas;
      if (cartas[a].e === cartas[b].e) {
        sonar(880);
        window.setTimeout(() => {
          setEncontradas((prev) => [...prev, a, b]);
          setVolteadas([]);
          setBloqueo(false);
        }, 500);
      } else {
        sonar(200);
        window.setTimeout(() => {
          setVolteadas([]);
          setBloqueo(false);
        }, 900);
      }
    }
  };

  if (!cartas) {
    return (
      <div className="mem-portada">
        <div className="mem-portada-emoji">🧠</div>
        <h2>Encuentra las parejas</h2>
        <button className="mem-voz" onClick={() => hablar('Encuentra las parejas')} title="Escuchar">🔊 Escuchar</button>
        <button className="mem-btn" onClick={iniciar}>▶️ Jugar</button>
      </div>
    );
  }

  if (encontradas.length === cartas.length) {
    return (
      <div className="mem-portada">
        <div className="mem-portada-emoji">🎉</div>
        <h2>¡Todas encontradas!</h2>
        <button className="mem-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="mem">
      <div className="mem-grid" data-cartas={cartas.length}>
        {cartas.map((c, i) => {
          const arriba = volteadas.includes(i) || encontradas.includes(i);
          return (
            <button
              key={c.id}
              className={`mem-carta ${arriba ? 'arriba' : ''} ${encontradas.includes(i) ? 'ok' : ''}`}
              onClick={() => tocar(i)}
            >
              <span className="mem-cara">{arriba ? c.e : '❓'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Memoria;
