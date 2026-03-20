import React, { useState, useEffect, useRef } from 'react';
import './ListenAndType.css';

const ListenAndType = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [input, setInput] = useState('');
  const [estado, setEstado] = useState('jugando');
  const [intentos, setIntentos] = useState(0);
  const [completado, setCompletado] = useState(false);
  const inputRef = useRef(null);

  const reto = retos[retoActual];

  useEffect(() => {
    setInput('');
    setEstado('jugando');
    setIntentos(0);
  }, [retoActual]);

  // Auto-play on new reto
  useEffect(() => {
    if (reto) {
      const timer = setTimeout(() => speak(reto.texto_en, 0.8), 500);
      return () => clearTimeout(timer);
    }
  }, [retoActual]);

  const speak = (text, rate = 0.8) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (completado) {
    return (
      <div className="lat-container lat-complete">
        <div className="lat-complete-icon">🎉</div>
        <h3>Amazing listening!</h3>
        <p>You typed all {retos.length} sentences correctly!</p>
        <button className="lat-btn lat-btn-next" onClick={onCompletar}>Continue</button>
      </div>
    );
  }

  if (!reto) return <div>Loading...</div>;

  const normalize = (str) => str.toLowerCase().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ').trim();

  const handleVerificar = () => {
    const userNorm = normalize(input);
    const correctNorm = normalize(reto.texto_en);

    if (userNorm === correctNorm) {
      setEstado('correcto');
    } else {
      setEstado('incorrecto');
      setIntentos(prev => prev + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      handleVerificar();
    }
  };

  const handleSiguiente = () => {
    if (retoActual < retos.length - 1) {
      setRetoActual(prev => prev + 1);
    } else {
      setCompletado(true);
    }
  };

  // Show hint after 2 failed attempts
  const showHint = intentos >= 2;

  return (
    <div className="lat-container">
      <div className="lat-progress">
        {retos.map((_, i) => (
          <div key={i} className={`lat-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      <p className="lat-instruction">Listen and type what you hear!</p>

      {/* Audio buttons */}
      <div className="lat-audio-controls">
        <button className="lat-play-btn lat-play-normal" onClick={() => speak(reto.texto_en, 0.8)}>
          🔊 Play
        </button>
        <button className="lat-play-btn lat-play-slow" onClick={() => speak(reto.texto_en, 0.5)}>
          🐢 Slow
        </button>
      </div>

      {/* Translation hint */}
      {reto.traduccion && (
        <p className="lat-translation">({reto.traduccion})</p>
      )}

      {/* Input */}
      <div className={`lat-input-area ${estado === 'correcto' ? 'correct' : ''} ${estado === 'incorrecto' ? 'incorrect' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          className="lat-input"
          value={input}
          onChange={(e) => { setInput(e.target.value); setEstado('jugando'); }}
          onKeyDown={handleKeyDown}
          placeholder="Type what you hear..."
          disabled={estado === 'correcto'}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>

      {/* Hint after 2 fails */}
      {showHint && estado !== 'correcto' && reto.pista && (
        <div className="lat-hint">
          <span>💡</span> Hint: {reto.pista}
        </div>
      )}

      {/* Incorrect message */}
      {estado === 'incorrecto' && (
        <div className="lat-message error">
          Not quite. {intentos >= 2 ? 'Listen carefully and try once more!' : 'Try again!'}
        </div>
      )}

      {/* Correct result */}
      {estado === 'correcto' && (
        <div className="lat-result">
          <div className="lat-correct-text">{reto.texto_en}</div>
          {reto.explicacion && (
            <div className="lat-explanation"><span>💡</span> {reto.explicacion}</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="lat-actions">
        {estado === 'correcto' ? (
          <button className="lat-btn lat-btn-next" onClick={handleSiguiente}>
            {retoActual < retos.length - 1 ? 'Next →' : 'Finish!'}
          </button>
        ) : (
          <button
            className="lat-btn lat-btn-check"
            onClick={handleVerificar}
            disabled={!input.trim()}
          >
            Check ✓
          </button>
        )}
      </div>
    </div>
  );
};

export default ListenAndType;
