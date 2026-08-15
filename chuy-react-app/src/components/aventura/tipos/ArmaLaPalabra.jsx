import React, { useState, useEffect, useMemo } from 'react';
import './ArmaLaPalabra.css';
import { useAuth } from '../../../hooks/useAuth.jsx';
import { sonar, hablar, VOZ_LETRAS } from '../../../utils/sonido';

/**
 * ArmaLaPalabra — tocar las piezas en orden para construir una palabra.
 *
 * Las piezas son SILABAS (ma + pa = mapa) o LETRAS, que es la misma mecanica: por eso
 * "arma tu nombre" no necesita motor aparte, solo `usar_nombre_perfil: true` y las
 * piezas salen del nombre del perfil activo. A los 4 anos la propia palabra es la mas
 * motivadora que existe, y sale gratis porque el perfil ya trae el nombre.
 *
 * Tocar en desorden no castiga: suena grave, se sacude y ya. Sin puntaje ni "perdiste".
 *
 * mision: {
 *   usar_nombre_perfil?: boolean,   // ignora `retos` y arma uno con el nombre del perfil
 *   retos: [{ emoji, palabra, piezas: [...], distractores?: [...] }]
 * }
 */
const RETOS_DEFAULT = [
  { emoji: '🗺️', palabra: 'mapa', piezas: ['ma', 'pa'], distractores: ['so'] },
  { emoji: '🍲', palabra: 'sopa', piezas: ['so', 'pa'], distractores: ['me'] },
  { emoji: '🪑', palabra: 'mesa', piezas: ['me', 'sa'], distractores: ['pi'] },
  { emoji: '🐸', palabra: 'sapo', piezas: ['sa', 'po'], distractores: ['lu'] },
  { emoji: '👩', palabra: 'mamá', piezas: ['ma', 'má'], distractores: ['pa'] },
];

// Baraja determinista: la misma palabra siempre se desordena igual, para que el
// juego no cambie bajo los pies del nino si React vuelve a renderizar.
const barajarConSemilla = (items, semilla) => {
  const arr = [...items];
  let s = semilla;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const semillaDe = (texto) => [...texto].reduce((n, c) => n + c.charCodeAt(0), 7);

const ArmaLaPalabra = ({ mision, onCompletar }) => {
  const { activeProfile } = useAuth();

  const retos = useMemo(() => {
    if (mision?.usar_nombre_perfil) {
      const nombre = (activeProfile?.nombre || '').trim();
      // Sin nombre en el perfil no hay reto que armar: se cae al lote normal.
      if (nombre) {
        return [{
          emoji: activeProfile?.avatar || '🙂',
          palabra: nombre,
          piezas: [...nombre],
          distractores: [],
        }];
      }
    }
    return (mision?.retos?.length) ? mision.retos : RETOS_DEFAULT;
  }, [mision, activeProfile]);

  const [idx, setIdx] = useState(0);
  const [puestas, setPuestas] = useState(0);
  const [mal, setMal] = useState(-1);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];
  const listo = puestas >= reto.piezas.length;

  const fichas = useMemo(
    () => barajarConSemilla([...reto.piezas, ...(reto.distractores || [])], semillaDe(reto.palabra)),
    [reto]
  );

  useEffect(() => {
    hablar(`Arma la palabra ${reto.palabra}`, VOZ_LETRAS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const tocar = (ficha, i) => {
    if (listo) return;
    if (ficha === reto.piezas[puestas]) {
      const n = puestas + 1;
      setPuestas(n);
      sonar(660 + n * 60);
      hablar(ficha, VOZ_LETRAS);
      if (n === reto.piezas.length) {
        window.setTimeout(() => {
          sonar(880);
          hablar(`¡${reto.palabra}!`, VOZ_LETRAS);
        }, 450);
        window.setTimeout(() => {
          if (idx < retos.length - 1) { setIdx(idx + 1); setPuestas(0); }
          else setFin(true);
        }, 2000);
      }
    } else {
      setMal(i);
      sonar(200);
      window.setTimeout(() => setMal(-1), 400);
    }
  };

  if (fin) {
    return (
      <div className="arm-fin">
        <div className="arm-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="arm-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="arm">
      <div className="arm-pregunta">
        Arma la palabra
        <button className="arm-voz" onClick={() => hablar(`Arma la palabra ${reto.palabra}`, VOZ_LETRAS)} title="Escuchar">🔊</button>
      </div>
      {retos.length > 1 && <div className="arm-progreso">{idx + 1} / {retos.length}</div>}

      <div className="arm-escenario">
        <span className="arm-escenario-emoji">{reto.emoji}</span>
        <div className="arm-huecos">
          {reto.piezas.map((p, i) => (
            <span key={i} className={`arm-hueco ${i < puestas ? 'lleno' : ''}`} translate="no">
              {i < puestas ? p : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="arm-fichas">
        {fichas.map((f, i) => {
          // Una ficha ya usada se apaga; con piezas repetidas (ma-má) se apaga
          // tantas como se hayan colocado.
          const usadas = reto.piezas.slice(0, puestas).filter((p) => p === f).length;
          const anteriores = fichas.slice(0, i).filter((x) => x === f).length;
          const gastada = anteriores < usadas;
          return (
            <button
              key={`${f}-${i}`}
              className={`arm-ficha ${mal === i ? 'mal' : ''} ${gastada ? 'gastada' : ''}`}
              onClick={() => !gastada && tocar(f, i)}
              disabled={gastada}
              translate="no"
            >
              {f}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ArmaLaPalabra;
