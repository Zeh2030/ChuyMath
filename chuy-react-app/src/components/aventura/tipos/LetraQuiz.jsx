import React, { useState, useEffect } from 'react';
import './LetraQuiz.css';
import { sonar, hablar, VOZ_LETRAS } from '../../../utils/sonido';

/**
 * LetraQuiz — un solo motor para los tres retos de reconocimiento de letras.
 * Todos comparten la misma mecánica ("estímulo + 3 opciones"), como Contar/Formas/Tamanos,
 * así que se parametrizan con `modo` en vez de duplicar tres componentes.
 *
 *   modo 'primera-letra': se ve un dibujo y se elige con qué letra empieza.
 *   modo 'reconoce-letra': se oye una letra y se toca entre varias.
 *   modo 'mayus-minus':   se ve la mayúscula y se busca su minúscula.
 *
 * Sin lectura obligatoria: la consigna siempre se dice en voz alta (TTS es-MX).
 * Como el TTS lee las consonantes por su nombre ("eme"), cada reto acepta un campo
 * `voz` opcional para forzar lo que se pronuncia.
 *
 * mision.retos: [{ emoji?, palabra?, letra?, respuesta, opciones: [...], voz? }]
 */
const RETOS_DEFAULT = {
  'primera-letra': [
    { emoji: '🌳', palabra: 'árbol', respuesta: 'A', opciones: ['A', 'E', 'O'] },
    { emoji: '🐘', palabra: 'elefante', respuesta: 'E', opciones: ['I', 'E', 'U'] },
    { emoji: '🏝️', palabra: 'isla', respuesta: 'I', opciones: ['O', 'A', 'I'] },
    { emoji: '🐻', palabra: 'oso', respuesta: 'O', opciones: ['O', 'U', 'E'] },
    { emoji: '🍇', palabra: 'uvas', respuesta: 'U', opciones: ['A', 'U', 'I'] },
  ],
  'reconoce-letra': [
    { respuesta: 'A', opciones: ['E', 'A', 'I'] },
    { respuesta: 'O', opciones: ['O', 'U', 'A'] },
    { respuesta: 'I', opciones: ['E', 'U', 'I'] },
    { respuesta: 'E', opciones: ['E', 'A', 'O'] },
    { respuesta: 'U', opciones: ['I', 'O', 'U'] },
  ],
  'mayus-minus': [
    { letra: 'A', respuesta: 'a', opciones: ['a', 'e', 'o'] },
    { letra: 'E', respuesta: 'e', opciones: ['i', 'e', 'u'] },
    { letra: 'O', respuesta: 'o', opciones: ['a', 'u', 'o'] },
    { letra: 'I', respuesta: 'i', opciones: ['i', 'o', 'e'] },
    { letra: 'U', respuesta: 'u', opciones: ['e', 'u', 'a'] },
  ],
  'cuenta-silabas': [
    { emoji: '☀️', palabra: 'sol', silabeo: 'sol', respuesta: '1', opciones: ['1', '2', '3'] },
    { emoji: '🌙', palabra: 'luna', silabeo: 'lu-na', respuesta: '2', opciones: ['2', '1', '3'] },
    { emoji: '⚽', palabra: 'pelota', silabeo: 'pe-lo-ta', respuesta: '3', opciones: ['2', '3', '4'] },
    { emoji: '🦋', palabra: 'mariposa', silabeo: 'ma-ri-po-sa', respuesta: '4', opciones: ['3', '4', '5'] },
  ],
  'lee-palabra': [
    { palabra: 'sol', silabeo: 'sol', respuesta: '☀️', opciones: ['☀️', '🐱', '🍐'] },
    { palabra: 'mesa', silabeo: 'me-sa', respuesta: '🪑', opciones: ['🐸', '🪑', '🍲'] },
    { palabra: 'sapo', silabeo: 'sa-po', respuesta: '🐸', opciones: ['🐸', '🗺️', '🔍'] },
    { palabra: 'lupa', silabeo: 'lu-pa', respuesta: '🔍', opciones: ['🍲', '🐻', '🔍'] },
  ],
};

// Con guiones la voz marca los golpes: "ma-ri-po-sa" → "ma, ri, po, sa".
const porSilabas = (r) => (r.silabeo || r.palabra || '').replace(/-/g, ', ');

// Por modo: consigna escrita (la lee el adulto), hablada (la oye la niña) y el
// refuerzo que se dice al acertar.
const MODOS = {
  'primera-letra': (r) => ({
    texto: '¿Con qué empieza?',
    voz: `${r.palabra}. ¿Con qué empieza?`,
    refuerzo: `${r.respuesta} de ${r.palabra}`,
  }),
  'reconoce-letra': (r) => ({
    texto: `Toca la ${r.respuesta}`,
    voz: `Toca la ${r.voz || r.respuesta}`,
    refuerzo: `${r.voz || r.respuesta}`,
  }),
  'mayus-minus': (r) => ({
    texto: `¿Cuál es la ${r.letra} chiquita?`,
    voz: `¿Cuál es la ${r.respuesta} chiquita?`,
    refuerzo: `${r.respuesta}`,
  }),
  // Conciencia fonológica: oír de cuántos golpes está hecha una palabra.
  'cuenta-silabas': (r) => ({
    texto: '¿Cuántos pedacitos tiene?',
    voz: `${porSilabas(r)}. ¿Cuántos pedacitos tiene?`,
    refuerzo: `${porSilabas(r)}. ¡${r.respuesta}!`,
  }),
  // Leer de verdad: se ve la palabra escrita y se elige el dibujo. La consigna NO
  // dice la palabra — si la dijera, no estaría leyendo.
  'lee-palabra': () => ({
    texto: '¿Qué dice aquí?',
    voz: '¿Qué dice aquí? Toca el dibujo.',
    refuerzo: null, // se resuelve abajo: al acertar se dice la palabra
  }),
};

const LetraQuiz = ({ mision, onCompletar }) => {
  const modo = (mision && mision.modo) || 'primera-letra';
  const retos = (mision && mision.retos && mision.retos.length)
    ? mision.retos
    : (RETOS_DEFAULT[modo] || RETOS_DEFAULT['primera-letra']);

  const [idx, setIdx] = useState(0);
  const [mal, setMal] = useState(-1);
  const [ok, setOk] = useState(false);
  const [fin, setFin] = useState(false);

  const reto = retos[idx];
  const consigna = (MODOS[modo] || MODOS['primera-letra'])(reto);
  // En lee-palabra el refuerzo es la palabra: se dice solo DESPUÉS de acertar.
  const refuerzo = consigna.refuerzo ?? reto.palabra ?? reto.respuesta;

  // Dice la consigna al entrar a cada reto (aún no lee).
  useEffect(() => {
    hablar(consigna.voz, VOZ_LETRAS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const tocar = (op, i) => {
    if (ok) return;
    if (op === reto.respuesta) {
      setOk(true);
      sonar(880);
      hablar(refuerzo, VOZ_LETRAS);
      window.setTimeout(() => {
        setOk(false);
        if (idx < retos.length - 1) setIdx(idx + 1);
        else setFin(true);
      }, 1100);
    } else {
      setMal(i);
      sonar(200);
      window.setTimeout(() => setMal(-1), 400);
    }
  };

  if (fin) {
    return (
      <div className="lq-fin">
        <div className="lq-fin-emoji">🎉</div>
        <h2>¡Muy bien!</h2>
        <button className="lq-btn" onClick={onCompletar}>Seguir</button>
      </div>
    );
  }

  return (
    <div className="lq">
      <div className="lq-pregunta">
        {consigna.texto}
        <button className="lq-voz" onClick={() => hablar(consigna.voz)} title="Escuchar">🔊</button>
      </div>
      <div className="lq-progreso">{idx + 1} / {retos.length}</div>

      {/* Estímulo: un dibujo (primera-letra, cuenta-silabas), una letra grande
          (mayus-minus) o la palabra escrita (lee-palabra). En reconoce-letra no hay
          estímulo visible a propósito: se juega de oído.
          En cuenta-silabas la palabra se muestra SIN guiones: los golpes se oyen, no
          se cuentan con los ojos. */}
      {(modo === 'primera-letra' || modo === 'cuenta-silabas') && (
        <div className="lq-estimulo">
          <span className="lq-estimulo-emoji">{reto.emoji}</span>
          <span className="lq-estimulo-palabra">{reto.palabra}</span>
        </div>
      )}
      {modo === 'mayus-minus' && (
        <div className="lq-estimulo">
          {/* translate="no": una letra suelta NUNCA se traduce (ver Abecedario.jsx). */}
          <span className="lq-estimulo-letra" translate="no">{reto.letra}</span>
        </div>
      )}
      {modo === 'reconoce-letra' && (
        <button className="lq-estimulo lq-estimulo-oido" onClick={() => hablar(consigna.voz)}>
          <span className="lq-estimulo-emoji">👂</span>
        </button>
      )}
      {modo === 'lee-palabra' && (
        <div className="lq-estimulo">
          <span className="lq-estimulo-texto" translate="no">{reto.palabra}</span>
          {/* El silabeo es el andamio: ayuda a leer por golpes sin dar la respuesta.
              En palabras de una sola sílaba no aporta nada y saldría repetida ("sol / sol"). */}
          {reto.silabeo?.includes('-') && (
            <span className="lq-estimulo-silabeo" translate="no">{reto.silabeo}</span>
          )}
        </div>
      )}

      <div className="lq-opciones">
        {reto.opciones.map((op, i) => (
          <button
            key={i}
            className={`lq-opcion ${modo === 'lee-palabra' ? 'lq-opcion-dibujo' : ''} ${mal === i ? 'mal' : ''} ${ok && op === reto.respuesta ? 'bien' : ''}`}
            onClick={() => tocar(op, i)}
            translate="no"
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LetraQuiz;
