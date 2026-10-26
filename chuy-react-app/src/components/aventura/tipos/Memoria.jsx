import React, { useState, useEffect } from 'react';
import './Memoria.css';
import { sonar, hablar } from '../../../utils/sonido';
import { useRegistrarBandera } from '../../../hooks/useColeccionBanderas';

/**
 * Memoria — encontrar parejas de cartas.
 *
 * Dos formatos:
 *  - Peques (4-6 años, sin lectura): mision.emojis + mision.pares → parejas de emojis IGUALES.
 *  - Banderas y otros: mision.parejas = [{ a: {imagen|texto|emoji}, b?: {...}, bandera? }]
 *    → cada pareja son DOS cartas distintas (bandera ↔ nombre); sin `b`, las dos iguales
 *    (memorama de banderas iguales para la hija). Se empareja por pareja, no por contenido.
 *    mision.pares (opcional): cuántas parejas usar, al azar (máx. 8).
 *  - mision.voz: lo que se lee al entrar (default "Encuentra las parejas"; false = sin voz).
 *
 * El mazo se baraja en un handler (iniciar), no en render, así que cumple las reglas.
 */
const EMOJIS_DEFAULT = ['🐶', '🐱', '🦊', '🐰', '🐻', '🐼'];
const MAX_PAREJAS = 8;

const barajar = (arr) => {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
};

// Lo que se ve en la cara de una carta
const Cara = ({ cara }) => {
  if (cara.imagen) return <img className="mem-img" src={cara.imagen} alt="" draggable={false} />;
  if (cara.texto) return <span className="mem-texto">{cara.texto}</span>;
  return <span className="mem-cara">{cara.emoji}</span>;
};

const Memoria = ({ mision, onCompletar }) => {
  const conParejas = Array.isArray(mision?.parejas) && mision.parejas.length >= 2;
  const emojis = (mision && mision.emojis && mision.emojis.length) ? mision.emojis : EMOJIS_DEFAULT;
  const pares = Math.min(Math.max(2, (mision && mision.pares) || 4), emojis.length);
  const voz = mision?.voz === false ? null : (mision?.voz || 'Encuentra las parejas');

  const [cartas, setCartas] = useState(null); // null = pantalla de inicio
  const [volteadas, setVolteadas] = useState([]); // índices arriba (sin emparejar)
  const [encontradas, setEncontradas] = useState([]); // índices ya emparejados
  const [bloqueo, setBloqueo] = useState(false);
  const registrarBandera = useRegistrarBandera();

  // Lee la instrucción en voz alta al entrar (para los que aún no leen). Solo voz.
  useEffect(() => {
    if (voz) hablar(voz);
  }, [voz]);

  const iniciar = () => {
    let parejas;
    if (conParejas) {
      const todas = mision.parejas.map((p, k) => ({ par: k, a: p.a, b: p.b ?? p.a }));
      const n = Math.min(MAX_PAREJAS, mision.pares ? Math.max(2, mision.pares) : todas.length, todas.length);
      parejas = n < todas.length ? barajar(todas).slice(0, n) : todas;
    } else {
      // Peques: exactamente como antes (los primeros `pares` emojis, en pares iguales)
      parejas = emojis.slice(0, pares).map((e, k) => ({ par: k, a: { emoji: e }, b: { emoji: e } }));
    }
    // Precarga: sin esto la carta se voltea vacía en el celular mientras baja la imagen
    parejas.forEach(p => [p.a, p.b].forEach(c => { if (c?.imagen) new Image().src = c.imagen; }));
    const mazo = barajar(parejas.flatMap(p => [{ par: p.par, cara: p.a }, { par: p.par, cara: p.b }]))
      .map((c, i) => ({ ...c, id: i }));
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
      if (cartas[a].par === cartas[b].par) {
        sonar(880);
        // Álbum: solo parejas distintas (bandera ↔ nombre) y solo aciertos: en el
        // memorama fallar es cuestión de memoria, no de no saber la bandera.
        const pareja = conParejas ? mision.parejas[cartas[a].par] : null;
        if (pareja?.b) registrarBandera(pareja.bandera_id ?? pareja.bandera, true);
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
        <h2>{voz || 'Encuentra las parejas'}</h2>
        {voz && <button className="mem-voz" onClick={() => hablar(voz)} title="Escuchar">🔊 Escuchar</button>}
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
              data-par={c.par}
              className={`mem-carta ${arriba ? 'arriba' : ''} ${encontradas.includes(i) ? 'ok' : ''}`}
              onClick={() => tocar(i)}
            >
              {arriba ? <Cara cara={c.cara} /> : <span className="mem-cara">❓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Memoria;
