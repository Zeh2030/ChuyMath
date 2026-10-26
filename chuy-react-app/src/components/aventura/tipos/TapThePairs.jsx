import React, { useState, useMemo } from 'react';
import { useRegistrarBandera } from '../../../hooks/useColeccionBanderas';
import './TapThePairs.css';

const shuffle = (arr) => {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
};

// Un lado de la pareja: texto, o imagen si el par trae `es_img`/`en_img`
// (banderas ↔ nombre). key por src: al cambiar de ronda no se queda visible
// la bandera anterior mientras carga. alt vacío: si la imagen falla, el
// navegador escribiría el alt, que sería la respuesta.
const LadoPar = ({ texto, img }) =>
  img ? <img key={img} className="ttp-img" src={img} alt="" /> : texto;

// Compartido entre ingles (par.en = ingles) y ciencias/geografia/piano (ambas
// columnas en español, pese al nombre del campo). `esIngles` solo afecta el
// texto de interfaz — los datos de cada `par` se muestran tal cual vienen.
// `es`/`en` siguen siendo obligatorios aunque haya imagen (describen el par).
const TapThePairs = ({ mision, onCompletar, materia = null }) => {
  const esIngles = materia === 'ingles';
  const retos = mision.retos || [];
  const [retoActual, setRetoActual] = useState(0);
  const [seleccionIzq, setSeleccionIzq] = useState(null);
  const [seleccionDer, setSeleccionDer] = useState(null);
  const [paresEncontrados, setParesEncontrados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [completado, setCompletado] = useState(false);
  // Pares (índice) con los que se equivocó en esta ronda: para el álbum de banderas.
  const [conError, setConError] = useState([]);
  const registrarBandera = useRegistrarBandera();

  const reto = retos[retoActual];

  // El orden de la columna derecha se baraja en el MISMO render que cambia la
  // ronda. Antes salía de un useEffect: el primer render de la ronda nueva aún
  // traía el orden viejo, y si esta ronda tenía menos pares, pares[4] no existía
  // y el juego tronaba (Capitales de África y Oceanía, ronda 3).
  const ordenDer = useMemo(
    () => (reto ? shuffle(reto.pares.map((_, i) => i)) : []),
    [reto]
  );

  const pasarARonda = (siguiente) => {
    setRetoActual(siguiente);
    setSeleccionIzq(null);
    setSeleccionDer(null);
    setParesEncontrados([]);
    setMensaje('');
    setConError([]);
  };

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
      // Match! Álbum: la bandera del par cuenta bien si no se equivocó con ella.
      const par = reto.pares[izq];
      registrarBandera(par.bandera_id ?? par.bandera, !conError.includes(izq));
      const newPares = [...paresEncontrados, izq];
      setParesEncontrados(newPares);
      setSeleccionIzq(null);
      setSeleccionDer(null);
      setMensaje('');

      if (newPares.length === reto.pares.length) {
        setTimeout(() => {
          if (retoActual < retos.length - 1) {
            pasarARonda(retoActual + 1);
          } else {
            setCompletado(true);
          }
        }, 1200);
      }
    } else {
      setConError(prev => [...prev, izq, der]);
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
                className={`ttp-card ttp-left ${par.es_img ? 'ttp-card-img' : ''} ${seleccionIzq === i ? 'selected' : ''} ${found ? 'found' : ''}`}
                onClick={() => handleSelectIzq(i)}
                disabled={found}
              >
                <LadoPar texto={par.es} img={par.es_img} />
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
                className={`ttp-card ttp-right ${par.en_img ? 'ttp-card-img' : ''} ${seleccionDer === originalIndex ? 'selected' : ''} ${found ? 'found' : ''}`}
                onClick={() => handleSelectDer(originalIndex)}
                disabled={found}
              >
                <LadoPar texto={par.en} img={par.en_img} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TapThePairs;
