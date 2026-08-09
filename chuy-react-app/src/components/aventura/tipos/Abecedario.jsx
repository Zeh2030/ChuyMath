import React, { useState } from 'react';
import './Abecedario.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * Abecedario — "toca la letra y la escuchas". Exploración pura, sin respuestas correctas
 * ni puntaje: es el teclado sonoro con el que un pre-lector conoce las letras.
 *
 * OJO con la voz: el TTS del sistema lee una consonante suelta por su NOMBRE ("eme"),
 * no por su sonido /m/. Por eso cada letra se dice con una palabra clave
 * ("A... A de árbol") y existe el campo opcional `sonido` para forzar el fonema
 * cuando lleguen las consonantes (ej. "mmm" para la M).
 *
 * mision.letras: [{ mayus, minus, palabra, emoji, sonido? }]
 */
const LETRAS_DEFAULT = [
  { mayus: 'A', minus: 'a', palabra: 'árbol', emoji: '🌳' },
  { mayus: 'E', minus: 'e', palabra: 'elefante', emoji: '🐘' },
  { mayus: 'I', minus: 'i', palabra: 'isla', emoji: '🏝️' },
  { mayus: 'O', minus: 'o', palabra: 'oso', emoji: '🐻' },
  { mayus: 'U', minus: 'u', palabra: 'uvas', emoji: '🍇' },
];

const Abecedario = ({ mision, onCompletar }) => {
  const letras = (mision && mision.letras && mision.letras.length) ? mision.letras : LETRAS_DEFAULT;
  const [activa, setActiva] = useState(null);

  const decir = (l) => {
    setActiva(l);
    sonar(660);
    hablar(`${l.sonido || l.mayus}. ${l.mayus} de ${l.palabra}`);
  };

  return (
    <div className="abc">
      <div className="abc-escenario">
        {activa ? (
          <>
            {/* translate="no": una letra suelta NUNCA se traduce. Sin esto, un
                traductor de pagina convierte la "U" en "tu" y la "E" en "mi". */}
            <div className="abc-escenario-letra" translate="no">{activa.mayus} {activa.minus}</div>
            <div className="abc-escenario-palabra">
              <span className="abc-escenario-emoji">{activa.emoji}</span>
              <span>{activa.palabra}</span>
            </div>
          </>
        ) : (
          <div className="abc-escenario-vacio">👆 Toca una letra</div>
        )}
      </div>

      <div className="abc-teclado">
        {letras.map((l) => (
          <button
            key={l.mayus}
            className={`abc-tecla ${activa && activa.mayus === l.mayus ? 'activa' : ''}`}
            onClick={() => decir(l)}
          >
            <span className="abc-tecla-mayus" translate="no">{l.mayus}</span>
            <span className="abc-tecla-minus" translate="no">{l.minus}</span>
          </button>
        ))}
      </div>

      <button className="abc-btn" onClick={onCompletar}>Listo ✅</button>
    </div>
  );
};

export default Abecedario;
