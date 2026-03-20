import React, { useState, useEffect, useCallback } from 'react';
import './ImagePicker.css';

const ImagePicker = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [estado, setEstado] = useState('jugando');
  const [opciones, setOpciones] = useState([]);
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
    setOpciones(shuffle(reto.opciones.map((op, i) => ({ ...op, originalIndex: i }))));
    setSeleccion(null);
    setEstado('jugando');
  }, [retoActual, reto, shuffle]);

  if (completado) {
    return (
      <div className="ip-container ip-complete">
        <div className="ip-complete-icon">🎉</div>
        <h3>Great eye!</h3>
        <p>You picked all {retos.length} images correctly!</p>
        <button className="ip-btn ip-btn-next" onClick={onCompletar}>Continue</button>
      </div>
    );
  }

  if (!reto) return <div>Loading...</div>;

  const handleSelect = (opcion) => {
    if (estado === 'correcto') return;
    setSeleccion(opcion.originalIndex);

    if (opcion.originalIndex === reto.respuesta) {
      setEstado('correcto');
    } else {
      setEstado('incorrecto');
      setTimeout(() => {
        setSeleccion(null);
        setEstado('jugando');
      }, 700);
    }
  };

  const handleSiguiente = () => {
    if (retoActual < retos.length - 1) {
      setRetoActual(prev => prev + 1);
    } else {
      setCompletado(true);
    }
  };

  // Play audio if browser supports TTS
  const speakWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(reto.palabra_en);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="ip-container">
      <div className="ip-progress">
        {retos.map((_, i) => (
          <div key={i} className={`ip-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      {/* Question */}
      <div className="ip-question">
        <p className="ip-question-label">Which one is...</p>
        <div className="ip-word">
          <span className="ip-word-text">{reto.palabra_en}</span>
          <button className="ip-sound-btn" onClick={speakWord} title="Listen">
            🔊
          </button>
        </div>
        {reto.palabra_es && <p className="ip-hint">({reto.palabra_es})</p>}
      </div>

      {/* Image grid */}
      <div className={`ip-grid ip-grid-${Math.min(opciones.length, 4)}`}>
        {opciones.map((opcion, i) => {
          let className = 'ip-card';
          if (seleccion === opcion.originalIndex) {
            className += estado === 'correcto' ? ' correct' : ' incorrect';
          }
          if (estado === 'correcto' && opcion.originalIndex === reto.respuesta) {
            className += ' correct';
          }
          return (
            <button
              key={i}
              className={className}
              onClick={() => handleSelect(opcion)}
              disabled={estado === 'correcto'}
            >
              <span className="ip-emoji">{opcion.emoji}</span>
              {estado === 'correcto' && opcion.originalIndex === reto.respuesta && (
                <span className="ip-label">{opcion.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Result */}
      {estado === 'correcto' && (
        <div className="ip-result">
          {reto.explicacion && (
            <div className="ip-explanation">
              <span>💡</span> {reto.explicacion}
            </div>
          )}
          <button className="ip-btn ip-btn-next" onClick={handleSiguiente}>
            {retoActual < retos.length - 1 ? 'Next →' : 'Finish!'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImagePicker;
