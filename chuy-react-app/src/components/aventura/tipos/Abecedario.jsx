import React, { useState, useEffect } from 'react';
import './Abecedario.css';
import { sonar, hablar, VOZ_LETRAS } from '../../../utils/sonido';

/**
 * Abecedario — "toca la letra y la escuchas". Exploración pura, sin respuestas correctas
 * ni puntaje: es el teclado sonoro con el que un pre-lector conoce las letras.
 *
 * OJO con la voz: el TTS lee una consonante suelta por su NOMBRE ("eme"), no por su
 * sonido /m/, y NO hay forma de forzarlo — se probó escribir "mmm" y lo deletrea
 * ("M, M, M"), que suena peor. Por eso la letra siempre se dice ligada a su palabra
 * clave ("M de mamá"): el fonema se aprende del contexto. Para decir fonemas de
 * verdad hacen falta audios grabados.
 *
 * mision.letras: [{ mayus, minus, palabra, emoji }]
 */
const LETRAS_DEFAULT = [
  { mayus: 'A', minus: 'a', palabra: 'árbol', emoji: '🌳' },
  { mayus: 'E', minus: 'e', palabra: 'elefante', emoji: '🐘' },
  { mayus: 'I', minus: 'i', palabra: 'isla', emoji: '🏝️' },
  { mayus: 'O', minus: 'o', palabra: 'oso', emoji: '🐻' },
  { mayus: 'U', minus: 'u', palabra: 'uvas', emoji: '🍇' },
];

const INSTRUCCION_DEFAULT = 'Toca una letra para escucharla.';

const Abecedario = ({ mision, onCompletar }) => {
  const letras = (mision && mision.letras && mision.letras.length) ? mision.letras : LETRAS_DEFAULT;
  const instruccion = (mision && mision.instruccion) || INSTRUCCION_DEFAULT;
  const [activa, setActiva] = useState(null);

  // Lee la instruccion al entrar, como el resto de los juegos de peques.
  useEffect(() => {
    hablar(instruccion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decir = (l) => {
    setActiva(l);
    sonar(660);
    hablar(`${l.mayus} de ${l.palabra}`, VOZ_LETRAS);
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
              <button className="abc-voz" onClick={() => decir(activa)} title="Escuchar otra vez">🔊</button>
            </div>
          </>
        ) : (
          <div className="abc-escenario-vacio">
            👆 Toca una letra
            <button className="abc-voz" onClick={() => hablar(instruccion)} title="Escuchar">🔊</button>
          </div>
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
