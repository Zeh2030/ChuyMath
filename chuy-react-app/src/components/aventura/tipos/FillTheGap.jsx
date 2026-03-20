import React, { useState, useEffect } from 'react';
import './FillTheGap.css';

const FillTheGap = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [estado, setEstado] = useState('jugando');
  const [completado, setCompletado] = useState(false);

  const reto = retos[retoActual];

  useEffect(() => {
    setSeleccion(null);
    setEstado('jugando');
  }, [retoActual]);

  if (completado) {
    return (
      <div className="ftg-container ftg-complete">
        <div className="ftg-complete-icon">🎉</div>
        <h3>Amazing!</h3>
        <p>You filled all {retos.length} gaps correctly!</p>
        <button className="ftg-btn ftg-btn-next" onClick={onCompletar}>Continue</button>
      </div>
    );
  }

  if (!reto) return <div>Loading...</div>;

  // Build sentence parts around the gap
  const partes = reto.oracion.split('___');

  const handleSelect = (index) => {
    if (estado === 'correcto') return;
    setSeleccion(index);

    if (index === reto.respuesta) {
      setEstado('correcto');
    } else {
      setEstado('incorrecto');
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
    <div className="ftg-container">
      <div className="ftg-progress">
        {retos.map((_, i) => (
          <div key={i} className={`ftg-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      {/* Translation hint */}
      {reto.traduccion && (
        <div className="ftg-translation">
          <span className="ftg-translation-label">Meaning:</span>
          <span>{reto.traduccion}</span>
        </div>
      )}

      {/* Sentence with gap */}
      <div className="ftg-sentence">
        <span>{partes[0]}</span>
        <span className={`ftg-gap ${estado === 'correcto' ? 'filled' : ''}`}>
          {estado === 'correcto' ? reto.opciones[reto.respuesta] : '______'}
        </span>
        <span>{partes[1] || ''}</span>
      </div>

      {/* Options */}
      <div className="ftg-options">
        {reto.opciones.map((opcion, i) => {
          let className = 'ftg-option';
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

      {/* Explanation */}
      {estado === 'correcto' && (
        <div className="ftg-result">
          <div className="ftg-complete-sentence">{reto.oracion.replace('___', reto.opciones[reto.respuesta])}</div>
          {reto.explicacion && (
            <div className="ftg-explanation">
              <span className="ftg-explanation-icon">💡</span>
              {reto.explicacion}
            </div>
          )}
          <button className="ftg-btn ftg-btn-next" onClick={handleSiguiente}>
            {retoActual < retos.length - 1 ? 'Next →' : 'Finish!'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FillTheGap;
