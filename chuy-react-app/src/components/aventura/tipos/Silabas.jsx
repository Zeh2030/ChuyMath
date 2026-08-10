import React, { useState, useEffect } from 'react';
import './Silabas.css';
import { sonar, hablar, VOZ_LETRAS } from '../../../utils/sonido';

/**
 * Silabas — el corazon del metodo silabico: ver que una consonante MAS una vocal
 * forman una silaba. Toca una vocal y la pantalla arma "M + a = ma" mientras la voz
 * hace la mezcla ("mmm... a... ma") y la ancla a una palabra ("ma de mamá").
 *
 * No hay respuestas correctas ni puntaje: es exploracion, como `abecedario`.
 *
 * OJO con la voz: la consonante sola NO se dice, a proposito. El TTS no sabe emitir
 * un fonema aislado -- "m" lo lee "eme" y el truco de escribir "mmm" lo deletrea
 * ("M, M, M"), que era peor. Asi que la consonante se VE en la ecuacion y lo que se
 * OYE es la vocal y la silaba ya formada: "u... mu. mu de música". La mezcla la hace
 * el ojo con el oido. Para decir fonemas de verdad hacen falta audios grabados.
 *
 * mision: { consonante, consonante_minus, silabas: [{ silaba, vocal, palabra, emoji }] }
 */
const INSTRUCCION_DEFAULT = 'Toca una vocal y mira qué sílaba se forma.';

const DEFAULT = {
  consonante: 'M',
  consonante_minus: 'm',
  silabas: [
    { silaba: 'ma', vocal: 'a', palabra: 'mamá', emoji: '👩' },
    { silaba: 'me', vocal: 'e', palabra: 'melón', emoji: '🍈' },
    { silaba: 'mi', vocal: 'i', palabra: 'miel', emoji: '🍯' },
    { silaba: 'mo', vocal: 'o', palabra: 'moto', emoji: '🏍️' },
    { silaba: 'mu', vocal: 'u', palabra: 'música', emoji: '🎶' },
  ],
};

const Silabas = ({ mision, onCompletar }) => {
  const datos = (mision && mision.silabas && mision.silabas.length) ? mision : DEFAULT;
  const { consonante, consonante_minus: minus } = datos;
  const silabas = datos.silabas;
  const instruccion = (mision && mision.instruccion) || INSTRUCCION_DEFAULT;
  const [activa, setActiva] = useState(null);

  // Lee la instruccion al entrar, como el resto de los juegos de peques.
  useEffect(() => {
    hablar(instruccion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const armar = (s) => {
    setActiva(s);
    sonar(660);
    // La vocal y luego la silaba ya formada; la consonante se ve, no se oye (ver arriba).
    hablar(`${s.vocal}... ${s.silaba}. ${s.silaba} de ${s.palabra}`, VOZ_LETRAS);
  };

  return (
    <div className="sil">
      <div className="sil-escenario">
        <div className="sil-ecuacion">
          {/* La consonante va en minuscula: asi la ecuacion se lee literal ("m + i = mi").
              Con "Mm + i = mi" la suma no cuadraba. La mayuscula se ensena en
              `abecedario` y en la hoja de trazo, que es donde toca. */}
          <span className="sil-parte" translate="no">{minus || consonante.toLowerCase()}</span>
          <span className="sil-signo">+</span>
          <span className="sil-parte" translate="no">{activa ? activa.vocal : '?'}</span>
          <span className="sil-signo">=</span>
          <span className="sil-resultado" translate="no">{activa ? activa.silaba : '?'}</span>
        </div>
        {activa ? (
          <div className="sil-palabra">
            <span className="sil-palabra-emoji">{activa.emoji}</span>
            <span>{activa.palabra}</span>
            <button className="sil-voz" onClick={() => armar(activa)} title="Escuchar otra vez">🔊</button>
          </div>
        ) : (
          <div className="sil-vacio">
            👆 Toca una vocal
            <button className="sil-voz" onClick={() => hablar(instruccion)} title="Escuchar">🔊</button>
          </div>
        )}
      </div>

      <div className="sil-vocales">
        {silabas.map((s) => (
          <button
            key={s.silaba}
            className={`sil-vocal ${activa && activa.silaba === s.silaba ? 'activa' : ''}`}
            onClick={() => armar(s)}
            translate="no"
          >
            {s.vocal}
          </button>
        ))}
      </div>

      <button className="sil-btn" onClick={onCompletar}>Listo ✅</button>
    </div>
  );
};

export default Silabas;
