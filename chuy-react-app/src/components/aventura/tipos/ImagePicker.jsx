import React, { useState, useMemo } from 'react';
import './ImagePicker.css';

const shuffle = (arr) => {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
};

const ImagePicker = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [estado, setEstado] = useState('jugando');
  const [completado, setCompletado] = useState(false);

  const reto = retos[retoActual];

  const opciones = useMemo(
    () => (reto ? shuffle(reto.opciones.map((op, i) => ({ ...op, originalIndex: i }))) : []),
    [reto]
  );

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
      setSeleccion(null);
      setEstado('jugando');
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

      {/* Question. Sin palabra_en (geografia/ciencias) la pregunta va directo
          en espanol, sin la etiqueta inglesa ni el boton de audio. */}
      <div className="ip-question">
        {/* Foto-estimulo del reto (banderas de geografia, fotos NASA):
            se pregunta SOBRE esta imagen y las opciones son texto. */}
        {reto.imagen_url && (
          <img className="ip-imagen-reto" src={reto.imagen_url} alt="" loading="lazy" />
        )}
        {reto.palabra_en ? (
          <>
            <p className="ip-question-label">Which one is...</p>
            <div className="ip-word">
              <span className="ip-word-text">{reto.palabra_en}</span>
              <button className="ip-sound-btn" onClick={speakWord} title="Listen">
                🔊
              </button>
            </div>
            {reto.palabra_es && <p className="ip-hint">({reto.palabra_es})</p>}
          </>
        ) : (
          <div className="ip-word">
            <span className="ip-word-text ip-word-es">{reto.palabra_es}</span>
          </div>
        )}
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
              {opcion.imagen ? (
                <img className="ip-imagen" src={opcion.imagen} alt={opcion.label || ''} loading="lazy" />
              ) : opcion.emoji ? (
                <span className="ip-emoji">{opcion.emoji}</span>
              ) : (
                // Opcion de solo texto (banderas de geografia, formato viejo):
                // el label ES la opcion, no un secreto que revelar al acertar.
                <span className="ip-opcion-texto">{opcion.label}</span>
              )}
              {(opcion.imagen || opcion.emoji) && estado === 'correcto' && opcion.originalIndex === reto.respuesta && (
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
