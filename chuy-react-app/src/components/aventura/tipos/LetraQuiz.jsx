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
};

// Consigna escrita (la lee el adulto que acompaña) y hablada (la oye el niño).
const consignas = {
  'primera-letra': (r) => ({ texto: '¿Con qué empieza?', voz: `${r.palabra}. ¿Con qué empieza?` }),
  'reconoce-letra': (r) => ({ texto: `Toca la ${r.respuesta}`, voz: `Toca la ${r.voz || r.respuesta}` }),
  'mayus-minus': (r) => ({ texto: `¿Cuál es la ${r.letra} chiquita?`, voz: `¿Cuál es la ${r.respuesta} chiquita?` }),
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
  const consigna = (consignas[modo] || consignas['primera-letra'])(reto);

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
      // Refuerzo: al acertar se vuelve a oír la letra ligada a su palabra clave.
      hablar(reto.palabra ? `${reto.respuesta} de ${reto.palabra}` : (reto.voz || reto.respuesta), VOZ_LETRAS);
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

      {/* Estímulo: un dibujo (primera-letra) o una letra grande (mayus-minus).
          En reconoce-letra no hay estímulo visible a propósito: se juega de oído. */}
      {modo === 'primera-letra' && (
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

      <div className="lq-opciones">
        {reto.opciones.map((op, i) => (
          <button
            key={i}
            className={`lq-opcion ${mal === i ? 'mal' : ''} ${ok && op === reto.respuesta ? 'bien' : ''}`}
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
