import React, { useState } from 'react';
import './Silabas.css';
import { sonar, hablar } from '../../../utils/sonido';

/**
 * Silabas — el corazon del metodo silabico: ver que una consonante MAS una vocal
 * forman una silaba. Toca una vocal y la pantalla arma "M + a = ma" mientras la voz
 * hace la mezcla ("mmm... a... ma") y la ancla a una palabra ("ma de mamá").
 *
 * No hay respuestas correctas ni puntaje: es exploracion, como `abecedario`.
 *
 * El campo `sonido` es el que hace que esto funcione: sin el, el TTS diria "eme"
 * en vez de /mmm/ y la mezcla no se oiria. Para las oclusivas (p, t) no hay un
 * sonido sostenible, asi que se deja sin `sonido` y la palabra clave hace el trabajo.
 *
 * mision: { consonante, consonante_minus, sonido?, silabas: [{ silaba, vocal, palabra, emoji }] }
 */
const DEFAULT = {
  consonante: 'M',
  consonante_minus: 'm',
  sonido: 'mmm',
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
  const { consonante, consonante_minus: minus, sonido } = datos;
  const silabas = datos.silabas;
  const [activa, setActiva] = useState(null);

  const armar = (s) => {
    setActiva(s);
    sonar(660);
    // La mezcla: sonido de la consonante, la vocal, la silaba, y la palabra que la ancla.
    hablar(`${sonido || consonante}... ${s.vocal}... ${s.silaba}. ${s.silaba} de ${s.palabra}`);
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
          </div>
        ) : (
          <div className="sil-vacio">👆 Toca una vocal</div>
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
