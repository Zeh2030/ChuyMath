import React, { useState, useEffect } from 'react';
import './VerbConjugator.css';

const VerbConjugator = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [estado, setEstado] = useState('jugando'); // jugando, correcto, incorrecto
  const [completado, setCompletado] = useState(false);

  const reto = retos[retoActual];

  useEffect(() => {
    setSeleccion(null);
    setEstado('jugando');
  }, [retoActual]);

  if (completado) {
    return (
      <div className="vc-container vc-complete">
        <div className="vc-complete-icon">🎉</div>
        <h3>Excellent!</h3>
        <p>You conjugated all {retos.length} verbs correctly!</p>
        <button className="vc-btn vc-btn-next" onClick={onCompletar}>
          Continue
        </button>
      </div>
    );
  }

  if (!reto) return <div>Loading...</div>;

  const handleSelect = (index) => {
    if (estado === 'correcto') return;

    setSeleccion(index);

    if (index === reto.respuesta) {
      setEstado('correcto');
    } else {
      setEstado('incorrecto');
      // Reset after shake
      setTimeout(() => {
        setSeleccion(null);
        setEstado('jugando');
      }, 800);
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
    <div className="vc-container">
      {/* Progress dots */}
      <div className="vc-progress">
        {retos.map((_, i) => (
          <div key={i} className={`vc-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      {/* Prompt */}
      <div className="vc-prompt">
        <span className="vc-pronoun">{reto.pronombre}</span>
        <span className="vc-blank">___</span>
        <span className="vc-verb-base">({reto.verbo_base})</span>
      </div>

      {/* Options */}
      <div className="vc-options">
        {reto.opciones.map((opcion, i) => {
          let className = 'vc-option';
          if (seleccion === i) {
            className += estado === 'correcto' ? ' correct' : ' incorrect';
          }
          if (estado === 'correcto' && i === reto.respuesta) {
            className += ' correct';
          }
          return (
            <button
              key={i}
              className={className}
              onClick={() => handleSelect(i)}
              disabled={estado === 'correcto'}
            >
              {opcion}
            </button>
          );
        })}
      </div>

      {/* Result info (shown on correct) */}
      {estado === 'correcto' && (
        <div className="vc-result">
          <div className="vc-sentence">
            {reto.oracion_completa}
          </div>
          <div className="vc-translation">
            {reto.traduccion}
          </div>
          {reto.regla && (
            <div className="vc-rule">
              <span className="vc-rule-icon">💡</span>
              {reto.regla}
            </div>
          )}
          <button className="vc-btn vc-btn-next" onClick={handleSiguiente}>
            {retoActual < retos.length - 1 ? 'Next →' : 'Finish!'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VerbConjugator;
