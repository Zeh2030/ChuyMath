import React, { useState, useEffect } from 'react';
import './TrueOrFalse.css';

const TrueOrFalse = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [respondido, setRespondido] = useState(false);
  const [respuestaUsuario, setRespuestaUsuario] = useState(null);
  const [completado, setCompletado] = useState(false);

  const reto = retos[retoActual];

  useEffect(() => {
    setRespondido(false);
    setRespuestaUsuario(null);
  }, [retoActual]);

  if (completado) {
    return (
      <div className="tof-container tof-complete">
        <div className="tof-complete-icon">🎉</div>
        <h3>Well done!</h3>
        <p>You evaluated all {retos.length} sentences!</p>
        <button className="tof-btn tof-btn-next" onClick={onCompletar}>
          Continue
        </button>
      </div>
    );
  }

  if (!reto) return <div>Loading...</div>;

  const handleAnswer = (userSaysCorrect) => {
    if (respondido) return;
    setRespondido(true);
    setRespuestaUsuario(userSaysCorrect);
  };

  const acerto = respondido && (respuestaUsuario === reto.correcto);

  const handleSiguiente = () => {
    if (retoActual < retos.length - 1) {
      setRetoActual(prev => prev + 1);
    } else {
      setCompletado(true);
    }
  };

  return (
    <div className="tof-container">
      {/* Progress dots */}
      <div className="tof-progress">
        {retos.map((_, i) => (
          <div key={i} className={`tof-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      {/* Instruction */}
      <p className="tof-instruction">Is this sentence correct?</p>

      {/* English sentence */}
      <div className={`tof-sentence ${respondido ? (reto.correcto ? 'is-correct' : 'is-incorrect') : ''}`}>
        <p className="tof-english">{reto.oracion}</p>
        <p className="tof-spanish">{reto.traduccion}</p>
      </div>

      {/* Answer buttons */}
      {!respondido && (
        <div className="tof-buttons">
          <button className="tof-answer tof-correct" onClick={() => handleAnswer(true)}>
            <span className="tof-answer-icon">✓</span>
            <span>Correct</span>
          </button>
          <button className="tof-answer tof-incorrect" onClick={() => handleAnswer(false)}>
            <span className="tof-answer-icon">✗</span>
            <span>Incorrect</span>
          </button>
        </div>
      )}

      {/* Result */}
      {respondido && (
        <div className={`tof-result ${acerto ? 'success' : 'fail'}`}>
          <div className="tof-result-header">
            {acerto ? '🎉 Right!' : '😬 Not quite...'}
          </div>

          {!reto.correcto && reto.correccion && (
            <div className="tof-correction">
              <span className="tof-correction-label">Correct form:</span>
              <span className="tof-correction-text">{reto.correccion}</span>
            </div>
          )}

          {reto.explicacion && (
            <div className="tof-explanation">
              <span className="tof-explanation-icon">💡</span>
              {reto.explicacion}
            </div>
          )}

          <button className="tof-btn tof-btn-next" onClick={handleSiguiente}>
            {retoActual < retos.length - 1 ? 'Next →' : 'Finish!'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrueOrFalse;
