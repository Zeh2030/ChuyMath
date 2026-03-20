import React, { useState, useEffect, useCallback } from 'react';
import './SentenceTransform.css';

const SentenceTransform = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [palabrasSeleccionadas, setPalabrasSeleccionadas] = useState([]);
  const [palabrasDisponibles, setPalabrasDisponibles] = useState([]);
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
    const todas = [...reto.palabras, ...(reto.palabras_extra || [])];
    setPalabrasDisponibles(shuffle(todas));
    setPalabrasSeleccionadas([]);
    setEstado('jugando');
  }, [retoActual, reto, shuffle]);

  if (completado) {
    return (
      <div className="st-container st-complete">
        <div className="st-complete-icon">🎉</div>
        <h3>Sentence Master!</h3>
        <p>You transformed all {retos.length} sentences!</p>
        <button className="st-btn st-btn-next" onClick={onCompletar}>Continue</button>
      </div>
    );
  }

  if (!reto) return <div>Loading...</div>;

  const modoLabel = {
    'negativo': '➖ Make it NEGATIVE',
    'interrogativo': '❓ Make it a QUESTION',
    'afirmativo': '✅ Make it AFFIRMATIVE',
  };

  const modoColor = {
    'negativo': '#f44336',
    'interrogativo': '#1976d2',
    'afirmativo': '#4caf50',
  };

  const handleSelectWord = (palabra, index) => {
    if (estado === 'correcto') return;
    setEstado('jugando');
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
  };

  const handleVerificar = () => {
    const esCorrecta = palabrasSeleccionadas.length === reto.respuesta.length &&
      palabrasSeleccionadas.every((p, i) => p.toLowerCase() === reto.respuesta[i].toLowerCase());

    if (esCorrecta) {
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
    <div className="st-container">
      <div className="st-progress">
        {retos.map((_, i) => (
          <div key={i} className={`st-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      {/* Mode badge */}
      <div className="st-mode" style={{ backgroundColor: modoColor[reto.modo] || '#888' }}>
        {modoLabel[reto.modo] || reto.modo}
      </div>

      {/* Original sentence */}
      <div className="st-original">
        <span className="st-original-label">Original:</span>
        <p className="st-original-text">{reto.oracion_original}</p>
        {reto.traduccion && <p className="st-original-trad">{reto.traduccion}</p>}
      </div>

      {/* Built sentence area */}
      <div className={`st-sentence ${estado === 'correcto' ? 'correct' : ''} ${estado === 'incorrecto' ? 'incorrect' : ''}`}>
        {palabrasSeleccionadas.length === 0 ? (
          <span className="st-placeholder">Build the transformed sentence...</span>
        ) : (
          palabrasSeleccionadas.map((palabra, i) => (
            <button key={i} className="st-word st-word-placed" onClick={() => handleRemoveWord(i)}>
              {palabra}
            </button>
          ))
        )}
      </div>

      {/* Word bank */}
      <div className="st-bank">
        {palabrasDisponibles.map((palabra, i) => (
          <button
            key={`${palabra}-${i}`}
            className="st-word st-word-available"
            onClick={() => handleSelectWord(palabra, i)}
            disabled={estado === 'correcto'}
          >
            {palabra}
          </button>
        ))}
      </div>

      {/* Message */}
      {estado === 'incorrecto' && (
        <div className="st-message error">Not quite right. Try rearranging!</div>
      )}

      {estado === 'correcto' && reto.explicacion && (
        <div className="st-explanation">
          <span className="st-explanation-icon">💡</span>
          {reto.explicacion}
        </div>
      )}

      {/* Actions */}
      <div className="st-actions">
        {estado === 'correcto' ? (
          <button className="st-btn st-btn-next" onClick={handleSiguiente}>
            {retoActual < retos.length - 1 ? 'Next →' : 'Finish!'}
          </button>
        ) : (
          <button
            className="st-btn st-btn-check"
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

export default SentenceTransform;
