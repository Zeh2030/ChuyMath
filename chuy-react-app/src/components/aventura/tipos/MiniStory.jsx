import React, { useState, useEffect } from 'react';
import './MiniStory.css';

const MiniStory = ({ mision, onCompletar }) => {
  const parrafos = mision.parrafos || [];
  const [parrafoActual, setParrafoActual] = useState(0);
  const [fase, setFase] = useState('leer'); // 'leer', 'preguntar', 'completado'
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [seleccion, setSeleccion] = useState(null);
  const [estadoPregunta, setEstadoPregunta] = useState('jugando');
  const [mostrarTraduccion, setMostrarTraduccion] = useState(false);
  const [completado, setCompletado] = useState(false);

  const parrafo = parrafos[parrafoActual];
  const pregunta = parrafo?.preguntas?.[preguntaActual];

  useEffect(() => {
    setFase('leer');
    setPreguntaActual(0);
    setSeleccion(null);
    setEstadoPregunta('jugando');
    setMostrarTraduccion(false);
  }, [parrafoActual]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.75;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (completado) {
    return (
      <div className="ms-container ms-complete">
        <div className="ms-complete-icon">🎉</div>
        <h3>Story Complete!</h3>
        <div className="ms-summary">
          {parrafos.map((p, i) => (
            <p key={i} className="ms-summary-text">
              {p.emoji && <span>{p.emoji} </span>}
              {p.texto}
            </p>
          ))}
        </div>
        <button className="ms-btn ms-btn-next" onClick={onCompletar}>Continue</button>
      </div>
    );
  }

  if (!parrafo) return <div>Loading...</div>;

  const handleContinueToQuestions = () => {
    if (parrafo.preguntas && parrafo.preguntas.length > 0) {
      setFase('preguntar');
    } else {
      advanceParrafo();
    }
  };

  const advanceParrafo = () => {
    if (parrafoActual < parrafos.length - 1) {
      setParrafoActual(prev => prev + 1);
    } else {
      setCompletado(true);
    }
  };

  const advancePregunta = () => {
    if (preguntaActual < parrafo.preguntas.length - 1) {
      setPreguntaActual(prev => prev + 1);
      setSeleccion(null);
      setEstadoPregunta('jugando');
    } else {
      advanceParrafo();
    }
  };

  // Handle fill-the-gap answer
  const handleFillGapSelect = (index) => {
    if (estadoPregunta === 'correcto') return;
    setSeleccion(index);
    if (index === pregunta.respuesta) {
      setEstadoPregunta('correcto');
    } else {
      setEstadoPregunta('incorrecto');
      setTimeout(() => {
        setSeleccion(null);
        setEstadoPregunta('jugando');
      }, 700);
    }
  };

  // Handle true-or-false answer
  const handleTofSelect = (userSaysCorrect) => {
    if (estadoPregunta === 'correcto') return;
    setSeleccion(userSaysCorrect);
    if (userSaysCorrect === pregunta.correcto) {
      setEstadoPregunta('correcto');
    } else {
      setEstadoPregunta('incorrecto');
      setTimeout(() => {
        setSeleccion(null);
        setEstadoPregunta('jugando');
      }, 700);
    }
  };

  // Render embedded question
  const renderPregunta = () => {
    if (!pregunta) return null;

    if (pregunta.tipo === 'fill-the-gap') {
      const partes = pregunta.oracion.split('___');
      return (
        <div className="ms-question">
          <p className="ms-question-label">Complete the sentence:</p>
          <div className="ms-gap-sentence">
            <span>{partes[0]}</span>
            <span className={`ms-gap ${estadoPregunta === 'correcto' ? 'filled' : ''}`}>
              {estadoPregunta === 'correcto' ? pregunta.opciones[pregunta.respuesta] : '___'}
            </span>
            <span>{partes[1] || ''}</span>
          </div>
          <div className="ms-options">
            {pregunta.opciones.map((op, i) => {
              let cls = 'ms-option';
              if (seleccion === i) cls += estadoPregunta === 'correcto' ? ' correct' : ' incorrect';
              if (estadoPregunta === 'correcto' && i === pregunta.respuesta) cls += ' correct';
              return (
                <button key={i} className={cls} onClick={() => handleFillGapSelect(i)}
                  disabled={estadoPregunta === 'correcto'}>{op}</button>
              );
            })}
          </div>
        </div>
      );
    }

    if (pregunta.tipo === 'true-or-false') {
      return (
        <div className="ms-question">
          <p className="ms-question-label">Is this correct?</p>
          <div className="ms-tof-sentence">{pregunta.oracion}</div>
          {estadoPregunta !== 'correcto' && (
            <div className="ms-tof-buttons">
              <button className="ms-tof-btn ms-tof-correct" onClick={() => handleTofSelect(true)}>✓ Yes</button>
              <button className="ms-tof-btn ms-tof-incorrect" onClick={() => handleTofSelect(false)}>✗ No</button>
            </div>
          )}
          {estadoPregunta === 'correcto' && !pregunta.correcto && pregunta.correccion && (
            <div className="ms-correction">Correct: {pregunta.correccion}</div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="ms-container">
      {/* Progress bar */}
      <div className="ms-progress-bar">
        {parrafos.map((_, i) => (
          <div key={i} className={`ms-progress-segment ${i < parrafoActual ? 'done' : ''} ${i === parrafoActual ? 'current' : ''}`} />
        ))}
      </div>

      {/* Story paragraph */}
      <div className="ms-paragraph">
        {parrafo.emoji && <div className="ms-emoji">{parrafo.emoji}</div>}

        <div className="ms-text-area">
          <p className="ms-text">{parrafo.texto}</p>
          <button className="ms-speak-btn" onClick={() => speak(parrafo.texto)} title="Listen">🔊</button>
        </div>

        {/* Translation toggle */}
        {parrafo.traduccion && (
          <div className="ms-translation-area">
            <button className="ms-translate-toggle" onClick={() => setMostrarTraduccion(!mostrarTraduccion)}>
              {mostrarTraduccion ? '🙈 Hide translation' : '👀 Show translation'}
            </button>
            {mostrarTraduccion && <p className="ms-translation">{parrafo.traduccion}</p>}
          </div>
        )}
      </div>

      {/* Phase: Reading → Continue to questions */}
      {fase === 'leer' && (
        <button className="ms-btn ms-btn-continue" onClick={handleContinueToQuestions}>
          I read it! Next →
        </button>
      )}

      {/* Phase: Questions */}
      {fase === 'preguntar' && (
        <div className="ms-question-area">
          {renderPregunta()}
          {estadoPregunta === 'correcto' && (
            <button className="ms-btn ms-btn-next" onClick={advancePregunta}>
              {preguntaActual < parrafo.preguntas.length - 1 ? 'Next question →'
                : parrafoActual < parrafos.length - 1 ? 'Continue reading →'
                : 'Finish story!'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MiniStory;
