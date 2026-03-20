import React, { useState, useEffect, useCallback } from 'react';
import './WordBank.css';

const WordBank = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [palabrasSeleccionadas, setPalabrasSeleccionadas] = useState([]);
  const [estado, setEstado] = useState('jugando'); // jugando, correcto, incorrecto
  const [mensaje, setMensaje] = useState('');
  const [palabrasDisponibles, setPalabrasDisponibles] = useState([]);
  const [completado, setCompletado] = useState(false);

  const reto = retos[retoActual];

  // Shuffle helper
  const shuffle = useCallback((arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Reset on reto change
  useEffect(() => {
    if (!reto) return;
    const todas = [...reto.palabras, ...(reto.palabras_extra || [])];
    setPalabrasDisponibles(shuffle(todas));
    setPalabrasSeleccionadas([]);
    setEstado('jugando');
    setMensaje('');
  }, [retoActual, reto, shuffle]);

  if (completado) {
    return (
      <div className="wb-container wb-complete">
        <div className="wb-complete-icon">🎉</div>
        <h3>Great job!</h3>
        <p>You completed all {retos.length} sentences!</p>
        <button className="wb-btn wb-btn-next" onClick={onCompletar}>
          Continue
        </button>
      </div>
    );
  }

  if (!reto) return <div>Loading...</div>;

  const handleSelectWord = (palabra, index) => {
    if (estado === 'correcto') return;
    setEstado('jugando');
    setMensaje('');
    setPalabrasSeleccionadas(prev => [...prev, palabra]);
    setPalabrasDisponibles(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleRemoveWord = (index) => {
    if (estado === 'correcto') return;
    const palabra = palabrasSeleccionadas[index];
    setPalabrasSeleccionadas(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setPalabrasDisponibles(prev => [...prev, palabra]);
    setEstado('jugando');
    setMensaje('');
  };

  const handleVerificar = () => {
    const respuesta = reto.respuesta;
    const esCorrecta = palabrasSeleccionadas.length === respuesta.length &&
      palabrasSeleccionadas.every((p, i) => p === respuesta[i]);

    if (esCorrecta) {
      setEstado('correcto');
      setMensaje(reto.explicacion || 'Correct!');
    } else {
      setEstado('incorrecto');
      setMensaje('Not quite right. Try again!');
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
    <div className="wb-container">
      {/* Progress dots */}
      <div className="wb-progress">
        {retos.map((_, i) => (
          <div key={i} className={`wb-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      {/* Spanish sentence (target) */}
      <div className="wb-target">
        <span className="wb-target-label">Translate:</span>
        <p className="wb-target-text">{reto.oracion_es}</p>
      </div>

      {/* Built sentence area */}
      <div className={`wb-sentence ${estado === 'correcto' ? 'correct' : ''} ${estado === 'incorrecto' ? 'incorrect' : ''}`}>
        {palabrasSeleccionadas.length === 0 ? (
          <span className="wb-placeholder">Tap words below to build the sentence...</span>
        ) : (
          palabrasSeleccionadas.map((palabra, i) => (
            <button
              key={i}
              className="wb-word wb-word-placed"
              onClick={() => handleRemoveWord(i)}
            >
              {palabra}
            </button>
          ))
        )}
      </div>

      {/* Word bank */}
      <div className="wb-bank">
        {palabrasDisponibles.map((palabra, i) => (
          <button
            key={`${palabra}-${i}`}
            className="wb-word wb-word-available"
            onClick={() => handleSelectWord(palabra, i)}
            disabled={estado === 'correcto'}
          >
            {palabra}
          </button>
        ))}
      </div>

      {/* Message */}
      {mensaje && (
        <div className={`wb-message ${estado}`}>
          {mensaje}
        </div>
      )}

      {/* Actions */}
      <div className="wb-actions">
        {estado === 'correcto' ? (
          <button className="wb-btn wb-btn-next" onClick={handleSiguiente}>
            {retoActual < retos.length - 1 ? 'Next →' : 'Finish!'}
          </button>
        ) : (
          <button
            className="wb-btn wb-btn-check"
            onClick={handleVerificar}
            disabled={palabrasSeleccionadas.length === 0}
          >
            Check ✓
          </button>
        )}
      </div>
    </div>
  );
};

export default WordBank;
