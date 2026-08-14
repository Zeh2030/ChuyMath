import React, { useState, useEffect, useCallback } from 'react';
import './TapThePairs.css';

// Compartido entre ingles (par.en = ingles) y ciencias/geografia/piano (ambas
// columnas en español, pese al nombre del campo). `esIngles` solo afecta el
// texto de interfaz — los datos de cada `par` se muestran tal cual vienen.
const TapThePairs = ({ mision, onCompletar, materia = null }) => {
  const esIngles = materia === 'ingles';
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [seleccionIzq, setSeleccionIzq] = useState(null);
  const [seleccionDer, setSeleccionDer] = useState(null);
  const [paresEncontrados, setParesEncontrados] = useState([]);
  const [estado, setEstado] = useState('jugando');
  const [mensaje, setMensaje] = useState('');
  const [ordenDer, setOrdenDer] = useState([]);
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
    setOrdenDer(shuffle(reto.pares.map((_, i) => i)));
    setSeleccionIzq(null);
    setSeleccionDer(null);
    setParesEncontrados([]);
    setEstado('jugando');
    setMensaje('');
  }, [retoActual, reto, shuffle]);

  if (completado) {
    return (
      <div className="ttp-container ttp-complete">
        <div className="ttp-complete-icon">🎉</div>
        <h3>{esIngles ? 'Perfect Matching!' : '¡Emparejamiento perfecto!'}</h3>
        <p>
          {esIngles
            ? `You matched all pairs in ${retos.length} rounds!`
            : `¡Encontraste todos los pares en ${retos.length} rondas!`}
        </p>
        <button className="ttp-btn ttp-btn-next" onClick={onCompletar}>
          {esIngles ? 'Continue' : 'Continuar'}
        </button>
      </div>
    );
  }

  if (!reto) return <div>Cargando…</div>;

  const handleSelectIzq = (index) => {
    if (paresEncontrados.includes(index)) return;
    setSeleccionIzq(index);
    setMensaje('');

    if (seleccionDer !== null) {
      checkPair(index, seleccionDer);
    }
  };

  const handleSelectDer = (index) => {
    if (paresEncontrados.includes(index)) return;
    setSeleccionDer(index);
    setMensaje('');

    if (seleccionIzq !== null) {
      checkPair(seleccionIzq, index);
    }
  };

  const checkPair = (izq, der) => {
    if (izq === der) {
      // Match!
      const newPares = [...paresEncontrados, izq];
      setParesEncontrados(newPares);
      setSeleccionIzq(null);
      setSeleccionDer(null);
      setMensaje('');

      if (newPares.length === reto.pares.length) {
        setEstado('correcto');
        setTimeout(() => {
          if (retoActual < retos.length - 1) {
            setRetoActual(prev => prev + 1);
          } else {
            setCompletado(true);
          }
        }, 1200);
      }
    } else {
      setMensaje(esIngles ? 'Try again!' : '¡Intenta de nuevo!');
      setTimeout(() => {
        setSeleccionIzq(null);
        setSeleccionDer(null);
        setMensaje('');
      }, 600);
    }
  };

  return (
    <div className="ttp-container">
      <div className="ttp-progress">
        {retos.map((_, i) => (
          <div key={i} className={`ttp-dot ${i < retoActual ? 'done' : ''} ${i === retoActual ? 'current' : ''}`} />
        ))}
      </div>

      <p className="ttp-instruction">
        {esIngles ? 'Tap one from each column to match!' : '¡Toca uno de cada columna para emparejar!'}
      </p>

      {mensaje && <div className="ttp-message">{mensaje}</div>}

      <div className="ttp-score">
        {paresEncontrados.length} / {reto.pares.length} {esIngles ? 'pairs' : 'pares'}
      </div>

      <div className="ttp-columns">
        {/* Left column (Spanish / source) */}
        <div className="ttp-column">
          {reto.pares.map((par, i) => {
            const found = paresEncontrados.includes(i);
            return (
              <button
                key={i}
                className={`ttp-card ttp-left ${seleccionIzq === i ? 'selected' : ''} ${found ? 'found' : ''}`}
                onClick={() => handleSelectIzq(i)}
                disabled={found}
              >
                {par.es}
              </button>
            );
          })}
        </div>

        {/* Right column (English / target, shuffled) */}
        <div className="ttp-column">
          {ordenDer.map((originalIndex) => {
            const par = reto.pares[originalIndex];
            const found = paresEncontrados.includes(originalIndex);
            return (
              <button
                key={originalIndex}
                className={`ttp-card ttp-right ${seleccionDer === originalIndex ? 'selected' : ''} ${found ? 'found' : ''}`}
                onClick={() => handleSelectDer(originalIndex)}
                disabled={found}
              >
                {par.en}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TapThePairs;
