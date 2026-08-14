import React, { useState, useEffect, useCallback } from 'react';
import { hablar } from '../../../utils/sonido';
import './WordScramble.css';

// Compartido entre ingles (reto.respuesta = palabra en ingles) y geografia
// (reto.respuesta = nombre en español, p.ej. una capital). `esIngles` decide
// el idioma del boton de audio y de la interfaz.
const WordScramble = ({ mision, onCompletar, materia = null }) => {
  const esIngles = materia === 'ingles';
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [letrasSeleccionadas, setLetrasSeleccionadas] = useState([]);
  const [letrasDisponibles, setLetrasDisponibles] = useState([]);
  const [estado, setEstado] = useState('jugando');
  const [completado, setCompletado] = useState(false);

  const reto = retos[retoActual];

  const shuffle = useCallback((arr) => {
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  }, []);

  useEffect(() => {
    if (!reto) return;
    const letras = reto.letras_desordenadas
      ? reto.letras_desordenadas.split('')
      : shuffle(reto.respuesta.split(''));
    setLetrasDisponibles(letras.map((l, i) => ({ letra: l, id: i })));
    setLetrasSeleccionadas([]);
    setEstado('jugando');
  }, [retoActual, reto, shuffle]);

  if (completado) {
    return (
      <div className="ws-container ws-complete">
        <div className="ws-complete-icon">🎉</div>
        <h3>{esIngles ? 'Word Master!' : '¡Maestro de las palabras!'}</h3>
        <p>
          {esIngles
            ? `You unscrambled all ${retos.length} words!`
            : `¡Ordenaste las ${retos.length} palabras!`}
        </p>
        <button className="ws-btn ws-btn-next" onClick={onCompletar}>
          {esIngles ? 'Continue' : 'Continuar'}
        </button>
      </div>
    );
  }

  if (!reto) return <div>Cargando…</div>;

  const speakWord = () => {
    if (esIngles) {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(reto.respuesta);
        utterance.lang = 'en-US';
        utterance.rate = 0.75;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      hablar(reto.respuesta, { rate: 0.85 });
    }
  };

  const handleSelectLetra = (item, index) => {
    if (estado === 'correcto') return;
    setEstado('jugando');
    setLetrasSeleccionadas(prev => [...prev, item]);
    setLetrasDisponibles(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleRemoveLetra = (index) => {
    if (estado === 'correcto') return;
    const item = letrasSeleccionadas[index];
    setLetrasSeleccionadas(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setLetrasDisponibles(prev => [...prev, item]);
    setEstado('jugando');
  };

  const handleVerificar = () => {
    const palabra = letrasSeleccionadas.map(l => l.letra).join('');
    if (palabra.toLowerCase() === reto.respuesta.toLowerCase()) {
      setEstado('correcto');
    } else {
      setEstado('incorrecto');
    }
  };

  const handleSiguiente = () => {
    if (retoActual < retos.length - 1) {
      setRetoActual(prev => prev + 1);
    } else {
      setCompletado(true);
    }
  };

  return (
    <div className="ws-container">
      <div className="ws-progress">
        {retos.map((_, i) => (
          <div key={i} className={`ws-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      {/* Hint */}
      <div className="ws-hint">
        <p className="ws-hint-label">{esIngles ? 'Unscramble the word:' : 'Ordena las letras:'}</p>
        {reto.pista_es && <p className="ws-hint-text">{reto.pista_es}</p>}
        {reto.pista_emoji && <span className="ws-hint-emoji">{reto.pista_emoji}</span>}
        <button className="ws-sound-btn" onClick={speakWord} title={esIngles ? 'Listen to the word' : 'Escuchar la palabra'}>🔊</button>
      </div>

      {/* Built word */}
      <div className={`ws-word-area ${estado === 'correcto' ? 'correct' : ''} ${estado === 'incorrecto' ? 'incorrect' : ''}`}>
        {reto.respuesta.split('').map((_, i) => (
          <div key={i} className={`ws-slot ${letrasSeleccionadas[i] ? 'filled' : ''}`}>
            {letrasSeleccionadas[i] ? (
              <button className="ws-letra ws-letra-placed" onClick={() => handleRemoveLetra(i)}>
                {letrasSeleccionadas[i].letra}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Letter bank */}
      <div className="ws-bank">
        {letrasDisponibles.map((item, i) => (
          <button
            key={item.id}
            className="ws-letra ws-letra-available"
            onClick={() => handleSelectLetra(item, i)}
            disabled={estado === 'correcto'}
          >
            {item.letra}
          </button>
        ))}
      </div>

      {/* Message */}
      {estado === 'incorrecto' && (
        <div className="ws-message error">
          {esIngles ? 'Not quite! Try again.' : '¡Casi! Intenta de nuevo.'}
        </div>
      )}

      {estado === 'correcto' && (
        <div className="ws-result">
          <div className="ws-correct-word">{reto.respuesta}</div>
          {reto.explicacion && (
            <div className="ws-explanation"><span>💡</span> {reto.explicacion}</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="ws-actions">
        {estado === 'correcto' ? (
          <button className="ws-btn ws-btn-next" onClick={handleSiguiente}>
            {esIngles
              ? (retoActual < retos.length - 1 ? 'Next →' : 'Finish!')
              : (retoActual < retos.length - 1 ? 'Siguiente →' : '¡Terminar!')}
          </button>
        ) : (
          <button
            className="ws-btn ws-btn-check"
            onClick={handleVerificar}
            disabled={letrasSeleccionadas.length < reto.respuesta.length}
          >
            {esIngles ? 'Check ✓' : 'Comprobar ✓'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WordScramble;
