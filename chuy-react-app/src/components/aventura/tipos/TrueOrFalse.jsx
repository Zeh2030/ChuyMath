import React, { useState, useEffect } from 'react';
import './TrueOrFalse.css';

// Compartido entre ingles (reto.oracion = ingles a evaluar, reto.traduccion =
// español) y ciencias/geografia/piano (reto.oracion ya es un dato en español,
// sin traduccion). `esIngles` decide el idioma de toda la interfaz.
const TrueOrFalse = ({ mision, onCompletar, materia = null }) => {
  const esIngles = materia === 'ingles';
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
        <h3>{esIngles ? 'Well done!' : '¡Bien hecho!'}</h3>
        <p>
          {esIngles
            ? `You evaluated all ${retos.length} sentences!`
            : `¡Evaluaste las ${retos.length} afirmaciones!`}
        </p>
        <button className="tof-btn tof-btn-next" onClick={onCompletar}>
          {esIngles ? 'Continue' : 'Continuar'}
        </button>
      </div>
    );
  }

  if (!reto) return <div>Cargando…</div>;

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
      <p className="tof-instruction">
        {esIngles ? 'Is this sentence correct?' : '¿Es verdadero o falso?'}
      </p>

      {/* Statement to evaluate */}
      <div className={`tof-sentence ${respondido ? (reto.correcto ? 'is-correct' : 'is-incorrect') : ''}`}>
        <p className="tof-english">{reto.oracion}</p>
        {reto.traduccion && <p className="tof-spanish">{reto.traduccion}</p>}
      </div>

      {/* Answer buttons */}
      {!respondido && (
        <div className="tof-buttons">
          <button className="tof-answer tof-correct" onClick={() => handleAnswer(true)}>
            <span className="tof-answer-icon">✓</span>
            <span>{esIngles ? 'Correct' : 'Verdadero'}</span>
          </button>
          <button className="tof-answer tof-incorrect" onClick={() => handleAnswer(false)}>
            <span className="tof-answer-icon">✗</span>
            <span>{esIngles ? 'Incorrect' : 'Falso'}</span>
          </button>
        </div>
      )}

      {/* Result */}
      {respondido && (
        <div className={`tof-result ${acerto ? 'success' : 'fail'}`}>
          <div className="tof-result-header">
            {esIngles
              ? (acerto ? '🎉 Right!' : '😬 Not quite...')
              : (acerto ? '🎉 ¡Correcto!' : '😬 No era así...')}
          </div>

          {!reto.correcto && reto.correccion && (
            <div className="tof-correction">
              <span className="tof-correction-label">{esIngles ? 'Correct form:' : 'Lo correcto:'}</span>
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
            {esIngles
              ? (retoActual < retos.length - 1 ? 'Next →' : 'Finish!')
              : (retoActual < retos.length - 1 ? 'Siguiente →' : '¡Terminar!')}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrueOrFalse;
