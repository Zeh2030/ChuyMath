import React, { useState, useEffect } from 'react';
import './NumberblocksConstructor.css';
import './FraccionOperaciones.css';

const FraccionOperaciones = ({ mision, onCompletar }) => {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [phase, setPhase] = useState('ver');
  const [numeradorInput, setNumeradorInput] = useState('');
  const [denominadorInput, setDenominadorInput] = useState('');
  const [resultNumerador, setResultNumerador] = useState('');
  const [resultDenominador, setResultDenominador] = useState('');
  const [denominadorComun, setDenominadorComun] = useState(null);
  const [convertedNums, setConvertedNums] = useState([null, null]);
  const [invertedFrac, setInvertedFrac] = useState([null, null]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  const retos = mision.retos || [];
  const currentChallenge = retos[currentChallengeIndex];

  useEffect(() => {
    setPhase('ver');
    setNumeradorInput('');
    setDenominadorInput('');
    setResultNumerador('');
    setResultDenominador('');
    setDenominadorComun(null);
    setConvertedNums([null, null]);
    setInvertedFrac([null, null]);
    setMessage({ text: '', type: '' });
    setShowConfetti(false);
    setWrongAttempts(0);
  }, [currentChallengeIndex]);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const getNumberblockColor = (num) => {
    const colors = {
      1: '#e53935', 2: '#fb8c00', 3: '#fdd835', 4: '#43a047',
      5: '#1e88e5', 6: '#8e24aa', 7: '#673ab7', 8: '#ec407a',
      9: '#e0e0e0', 10: '#ffffff', 11: '#e53935', 12: '#fb8c00',
      13: '#fdd835', 14: '#4caf50', 15: '#00bcd4'
    };
    return colors[num] || '#95a5a6';
  };

  const Face = ({ singleEye = false }) => (
    <div className="face-container">
      <div className="eye"></div>
      {!singleEye && <div className="eye"></div>}
    </div>
  );

  // ===== Helpers =====

  const getOperatorSymbol = (tipo) => {
    switch (tipo) {
      case 'sumar': return '+';
      case 'restar': return '−';
      case 'multiplicar': return '×';
      case 'dividir': return '÷';
      default: return '?';
    }
  };

  const sameDenominator = (ch) => {
    if (!ch.fraccion1 || !ch.fraccion2) return false;
    return ch.fraccion1[1] === ch.fraccion2[1];
  };

  const mcm = (a, b) => {
    const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
    return (a * b) / gcd(a, b);
  };

  // ===== Phase definitions per type =====

  const getPhases = (ch) => {
    if (!ch) return [];
    const tipo = ch.tipo;

    if (tipo === 'verbal') {
      return [
        { key: 'ver', label: '1. Leer' },
        { key: 'fraccion', label: '2. Fraccion' },
        { key: 'resultado', label: '3. Resultado' },
      ];
    }

    if (tipo === 'sumar' || tipo === 'restar') {
      if (sameDenominator(ch)) {
        return [
          { key: 'ver', label: '1. Ver' },
          { key: 'operar', label: '2. Operar' },
          { key: 'resultado', label: '3. Resultado' },
        ];
      }
      return [
        { key: 'ver', label: '1. Ver' },
        { key: 'denominador', label: '2. Denominador' },
        { key: 'convertir', label: '3. Convertir' },
        { key: 'operar', label: '4. Operar' },
        { key: 'resultado', label: '5. Resultado' },
      ];
    }

    if (tipo === 'multiplicar') {
      return [
        { key: 'ver', label: '1. Ver' },
        { key: 'numeradores', label: '2. Numeradores' },
        { key: 'denominadores', label: '3. Denominadores' },
        { key: 'resultado', label: '4. Resultado' },
      ];
    }

    if (tipo === 'dividir') {
      return [
        { key: 'ver', label: '1. Ver' },
        { key: 'invertir', label: '2. Invertir' },
        { key: 'multiplicar', label: '3. Multiplicar' },
        { key: 'resultado', label: '4. Resultado' },
      ];
    }

    return [];
  };

  // ===== Pizza rendering (simplified for operation display) =====

  const renderMiniPizza = (partes, coloreadas, size = 120) => {
    const radius = size / 2 - 5;
    const cx = size / 2, cy = size / 2;
    const color = getNumberblockColor(coloreadas);

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="frac-op-mini-pizza">
        <circle cx={cx} cy={cy} r={radius + 2} fill="#FFF9C4" stroke="#5d4037" strokeWidth="2" />
        {[...Array(partes)].map((_, i) => {
          const angle = 360 / partes;
          const startAngle = i * angle - 90;
          const endAngle = startAngle + angle;
          const toRad = (deg) => (deg * Math.PI) / 180;
          const x1 = cx + radius * Math.cos(toRad(startAngle));
          const y1 = cy + radius * Math.sin(toRad(startAngle));
          const x2 = cx + radius * Math.cos(toRad(endAngle));
          const y2 = cy + radius * Math.sin(toRad(endAngle));
          const largeArc = angle > 180 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          const isColored = i < coloreadas;
          return (
            <path key={i} d={path} fill={isColored ? color : '#f5f5f5'} stroke="#5d4037" strokeWidth="1.5" />
          );
        })}
        <circle cx={cx} cy={cy} r="2" fill="#5d4037" />
      </svg>
    );
  };

  // ===== Fraccion display =====

  const renderFraccion = (num, den, highlight = false) => (
    <div className={`frac-op-fraction ${highlight ? 'highlight' : ''}`}>
      <div className="frac-op-num">{num}</div>
      <div className="frac-op-line" />
      <div className="frac-op-den">{den}</div>
    </div>
  );

  const renderFraccionInput = (numVal, denVal, onNumChange, onDenChange, numEditable = true, denEditable = true) => (
    <div className="frac-op-fraction input">
      <div className={`frac-op-num ${numEditable ? 'editable' : ''}`}>
        {numEditable ? (numVal || '?') : numVal}
      </div>
      <div className="frac-op-line" />
      <div className={`frac-op-den ${denEditable ? 'editable' : ''}`}>
        {denEditable ? (denVal || '?') : denVal}
      </div>
    </div>
  );

  // ===== Number pad =====

  const renderNumPad = (value, setValue, onSubmit, maxDigits = 3) => (
    <div className="frac-op-numpad">
      <div className="frac-op-numpad-display">{value || '?'}</div>
      <div className="frac-op-pad-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
          <button key={digit} className="frac-op-pad-btn"
            onClick={() => value.length < maxDigits && setValue(prev => prev + String(digit))}>
            {digit}
          </button>
        ))}
        <button className="frac-op-pad-btn frac-op-pad-delete"
          onClick={() => setValue(prev => prev.slice(0, -1))}>&#9003;</button>
        <button className="frac-op-pad-btn"
          onClick={() => value.length > 0 && value.length < maxDigits && setValue(prev => prev + '0')}>0</button>
        <button className="frac-op-pad-btn frac-op-pad-check"
          onClick={onSubmit} disabled={!value}>&#10003;</button>
      </div>
    </div>
  );

  // ===== Numberblock rendering =====

  const renderNumberblock = (num, onClick, selectedList = []) => {
    const isSelected = selectedList.includes(num);
    const nineColors = ['--nb-9-3', '--nb-9-2', '--nb-9-1'];
    const sevenColors = ['--nb-7-1', '--nb-7-2', '--nb-7-3', '--nb-7-4', '--nb-7-5', '--nb-7-6', '--nb-7-7'];

    if (num === 9) {
      return (
        <div key={num} className={`numberblock has-face ${isSelected ? 'selected' : ''}`} onClick={() => onClick(num)}>
          <div className="stack">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="block c9" style={{ backgroundColor: `var(${nineColors[Math.floor(i / 3)]})` }}>
                {i === 8 && <Face />}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (num === 11) {
      return (
        <div key={num} className={`numberblock has-face nb-11-shape ${isSelected ? 'selected' : ''}`} onClick={() => onClick(num)}>
          <div className="stack">
            {[...Array(5)].map((_, i) => (
              <div key={`left-${i}`} className="block white-block">
                {i === 0 && <Face singleEye={true} />}
              </div>
            ))}
          </div>
          <div className="stack">
            {[...Array(6)].map((_, i) => (
              <div key={`right-${i}`} className={`block ${i === 5 ? 'red-block' : 'white-block'}`}>
                {i === 0 && <Face singleEye={true} />}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (num === 12) {
      const centralIndices = [4, 7];
      return (
        <div key={num} className={`numberblock has-face nb-12-shape ${isSelected ? 'selected' : ''}`} onClick={() => onClick(num)}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="block" style={{
              backgroundColor: centralIndices.includes(i) ? 'var(--nb-12-center)' : 'var(--nb-12-main)',
              borderColor: 'var(--nb-12-border)'
            }}>
              {i === 7 && <Face />}
            </div>
          ))}
        </div>
      );
    }

    if (num === 13) {
      const blocks13 = [
        { row: 1, col: 2, type: 'yellow' },
        { row: 1, col: 3, type: 'yellow' },
        { row: 2, col: 3, type: 'yellow' },
        { row: 2, col: 1, type: 'white' },
        { row: 2, col: 2, type: 'white' },
        { row: 3, col: 1, type: 'white' },
        { row: 3, col: 2, type: 'white' },
        { row: 4, col: 1, type: 'white' },
        { row: 4, col: 2, type: 'white' },
        { row: 5, col: 1, type: 'white' },
        { row: 5, col: 2, type: 'white' },
        { row: 6, col: 1, type: 'white', face: true },
        { row: 6, col: 2, type: 'white' },
      ];
      return (
        <div key={num} className={`numberblock has-face nb-13-shape ${isSelected ? 'selected' : ''}`} onClick={() => onClick(num)}>
          {blocks13.map((b, i) => (
            <div key={i} className="block" style={{
              gridRow: b.row,
              gridColumn: b.col,
              backgroundColor: b.type === 'yellow' ? 'var(--nb-13)' : '#fff',
              border: b.type === 'yellow' ? '2px solid rgba(0,0,0,0.15)' : '2px solid var(--nb-1)',
            }}>
              {b.face && <Face />}
            </div>
          ))}
        </div>
      );
    }

    if (num === 14) {
      return (
        <div key={num} className={`numberblock has-face nb-14-shape ${isSelected ? 'selected' : ''}`} onClick={() => onClick(num)}>
          {[...Array(14)].map((_, i) => {
            const isGreen = i < 4;
            return (
              <div key={i} className="block" style={{
                backgroundColor: isGreen ? 'var(--nb-14)' : '#fff',
                border: isGreen ? '2px solid rgba(0,0,0,0.15)' : '2px solid var(--nb-1)'
              }}>
                {i === 7 && <Face />}
              </div>
            );
          })}
        </div>
      );
    }

    if (num === 15) {
      const stairHeights = [1, 2, 3, 4, 5];
      return (
        <div key={num} className={`numberblock has-face nb-15-shape ${isSelected ? 'selected' : ''}`} onClick={() => onClick(num)}>
          {stairHeights.map((height, colIdx) => (
            <div key={colIdx} className="stack">
              {[...Array(height)].map((_, rowIdx) => {
                const isCyan = colIdx === 4;
                return (
                  <div key={rowIdx} className="block" style={{
                    backgroundColor: isCyan ? 'var(--nb-15)' : '#fff',
                    border: isCyan ? '2px solid rgba(0,0,0,0.15)' : '2px solid var(--nb-1)'
                  }}>
                    {colIdx === 4 && rowIdx === height - 1 && <Face />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div key={num} className={`numberblock has-face ${isSelected ? 'selected' : ''}`} onClick={() => onClick(num)}>
        <div className="stack">
          {[...Array(num)].map((_, i) => {
            let className = 'block';
            let style = {};
            if (num === 7) {
              style.backgroundColor = `var(${sevenColors[i]})`;
            } else {
              className += ` c${num}`;
            }
            return (
              <div key={i} className={className} style={style}>
                {i === num - 1 && <Face singleEye={num === 1} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ===== Handlers =====

  const advanceFromVer = () => {
    if (!currentChallenge) return;
    const { tipo } = currentChallenge;

    if (tipo === 'verbal') {
      setPhase('fraccion');
    } else if (tipo === 'sumar' || tipo === 'restar') {
      if (sameDenominator(currentChallenge)) {
        setPhase('operar');
      } else {
        setPhase('denominador');
      }
    } else if (tipo === 'multiplicar') {
      setPhase('numeradores');
    } else if (tipo === 'dividir') {
      setPhase('invertir');
    }
  };

  // Denominador comun handler (sumar/restar diferente denominador)
  const handleDenominadorComun = (num) => {
    if (!currentChallenge) return;
    const expected = mcm(currentChallenge.fraccion1[1], currentChallenge.fraccion2[1]);
    if (num === expected) {
      setDenominadorComun(num);
      setMessage({ text: `!Correcto! Las dos fracciones se convierten a ${num} partes.`, type: 'success' });
      setTimeout(() => {
        setPhase('convertir');
        setMessage({ text: '', type: '' });
      }, 1500);
    } else {
      setWrongAttempts(prev => prev + 1);
      const hint = wrongAttempts >= 1
        ? ` Pista: busca un numero donde quepan ${currentChallenge.fraccion1[1]} y ${currentChallenge.fraccion2[1]}.`
        : '';
      setMessage({ text: `Ese denominador no funciona para ambas fracciones.${hint}`, type: 'error' });
    }
  };

  // Convertir numeradores handler
  const handleConvertSubmit = () => {
    if (!currentChallenge || !denominadorComun) return;
    const [n1, d1] = currentChallenge.fraccion1;
    const [n2, d2] = currentChallenge.fraccion2;
    const expectedN1 = n1 * (denominadorComun / d1);
    const expectedN2 = n2 * (denominadorComun / d2);

    const inputN1 = parseInt(numeradorInput);
    const inputN2 = parseInt(denominadorInput);

    if (inputN1 === expectedN1 && inputN2 === expectedN2) {
      setConvertedNums([expectedN1, expectedN2]);
      setNumeradorInput('');
      setDenominadorInput('');
      setMessage({ text: '!Perfecto! Ahora tienen el mismo denominador.', type: 'success' });
      setTimeout(() => {
        setPhase('operar');
        setMessage({ text: '', type: '' });
      }, 1500);
    } else {
      setMessage({ text: `Revisa: ${n1}/${d1} con denominador ${denominadorComun}... multiplica arriba y abajo por lo mismo.`, type: 'error' });
    }
  };

  // Operar handler (sumar/restar — ya con mismo denominador)
  const handleOperarSubmit = () => {
    if (!currentChallenge) return;
    const expected = currentChallenge.resultado[0];
    const input = parseInt(resultNumerador);

    if (input === expected) {
      setMessage({ text: '', type: '' });
      setPhase('resultado');
      triggerConfetti();
    } else {
      setWrongAttempts(prev => prev + 1);
      const op = currentChallenge.tipo === 'sumar' ? 'suma' : 'resta';
      setMessage({ text: `Revisa la ${op} de los numeradores.`, type: 'error' });
    }
  };

  // Multiplicar numeradores handler
  const handleMultNumeradores = () => {
    if (!currentChallenge) return;
    const expected = currentChallenge.resultado[0];
    const input = parseInt(resultNumerador);

    if (input === expected) {
      setMessage({ text: '!Bien! Ahora multiplica los denominadores.', type: 'success' });
      setTimeout(() => {
        setPhase('denominadores');
        setMessage({ text: '', type: '' });
      }, 1500);
    } else {
      setMessage({ text: `${currentChallenge.fraccion1[0]} x ${currentChallenge.fraccion2[0]} = ?`, type: 'error' });
    }
  };

  // Multiplicar denominadores handler
  const handleMultDenominadores = () => {
    if (!currentChallenge) return;
    const expected = currentChallenge.resultado[1];
    const input = parseInt(resultDenominador);

    if (input === expected) {
      setMessage({ text: '', type: '' });
      setPhase('resultado');
      triggerConfetti();
    } else {
      setMessage({ text: `${currentChallenge.fraccion1[1]} x ${currentChallenge.fraccion2[1]} = ?`, type: 'error' });
    }
  };

  // Dividir — invertir handler
  const handleInvertSubmit = () => {
    if (!currentChallenge) return;
    const [n2, d2] = currentChallenge.fraccion2;
    const inputN = parseInt(numeradorInput);
    const inputD = parseInt(denominadorInput);

    if (inputN === d2 && inputD === n2) {
      setInvertedFrac([d2, n2]);
      setNumeradorInput('');
      setDenominadorInput('');
      setMessage({ text: '!Correcto! Ahora multiplica.', type: 'success' });
      setTimeout(() => {
        setPhase('multiplicar');
        setMessage({ text: '', type: '' });
      }, 1500);
    } else {
      setMessage({ text: `Invierte ${n2}/${d2}: el numerador baja y el denominador sube.`, type: 'error' });
    }
  };

  // Dividir — multiplicar after invert
  const handleDivMultSubmit = () => {
    if (!currentChallenge) return;
    const expected = currentChallenge.resultado;
    const inputN = parseInt(resultNumerador);
    const inputD = parseInt(resultDenominador);

    if (inputN === expected[0] && inputD === expected[1]) {
      setMessage({ text: '', type: '' });
      setPhase('resultado');
      triggerConfetti();
    } else {
      setMessage({ text: 'Multiplica: numerador x numerador y denominador x denominador.', type: 'error' });
    }
  };

  // Verbal handler
  const handleVerbalSubmit = () => {
    if (!currentChallenge) return;
    const expected = currentChallenge.resultado;
    const inputN = parseInt(numeradorInput);
    const inputD = parseInt(denominadorInput);

    if (inputN === expected[0] && inputD === expected[1]) {
      setMessage({ text: '', type: '' });
      setPhase('resultado');
      triggerConfetti();
    } else {
      setWrongAttempts(prev => prev + 1);
      const hint = wrongAttempts >= 1 && currentChallenge.pista ? ` Pista: ${currentChallenge.pista}` : '';
      setMessage({ text: `Esa fraccion no es correcta.${hint}`, type: 'error' });
    }
  };

  // ===== Navegacion =====

  const nextChallenge = () => {
    if (currentChallengeIndex < retos.length - 1) {
      setCurrentChallengeIndex(prev => prev + 1);
    } else {
      setGameCompleted(true);
      if (onCompletar) onCompletar();
    }
  };

  // ===== Render =====

  if (gameCompleted) {
    return (
      <div className="frac-op-game-container nb-game-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 className="frac-op-title">!Felicidades, Maestro de las Operaciones!</h2>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Has completado todos los retos de operaciones con fracciones.</p>
        <button className="frac-op-action-button" onClick={() => { setCurrentChallengeIndex(0); setGameCompleted(false); }}>
          Jugar de Nuevo
        </button>
      </div>
    );
  }

  if (!currentChallenge) return <div>Cargando reto...</div>;

  const { tipo, fraccion1, fraccion2, resultado, historia, explicacion } = currentChallenge;
  const phases = getPhases(currentChallenge);
  const phaseOrder = phases.map(p => p.key);
  const currentPhaseIdx = phaseOrder.indexOf(phase);

  return (
    <div className="frac-op-game-container nb-game-container">
      {/* Confetti */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="confetti" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
            }} />
          ))}
        </div>
      )}

      {/* Progreso */}
      <div className="frac-op-progress">
        {retos.map((_, i) => (
          <div key={i} className={`frac-op-progress-dot ${i < currentChallengeIndex ? 'completed' : ''} ${i === currentChallengeIndex ? 'current' : ''}`} />
        ))}
      </div>

      {/* Indicador de fase */}
      <div className="frac-op-phase-indicator">
        {phases.map((p, i) => (
          <div key={p.key} className={`frac-op-phase-step ${i === currentPhaseIdx ? 'active' : i < currentPhaseIdx ? 'completed' : ''}`}>
            {p.label}
          </div>
        ))}
      </div>

      {/* Historia */}
      {historia && (
        <div className="frac-op-story-bubble">
          <p>{historia}</p>
        </div>
      )}

      {/* ===== FASE: VER ===== */}
      {phase === 'ver' && tipo !== 'verbal' && (
        <div className="frac-op-phase-content" key="ver">
          <div className="frac-op-instruction">Observa la operacion:</div>

          <div className="frac-op-equation-visual">
            {renderFraccion(fraccion1[0], fraccion1[1])}
            <div className="frac-op-operator">{getOperatorSymbol(tipo)}</div>
            {renderFraccion(fraccion2[0], fraccion2[1])}
            <div className="frac-op-operator">=</div>
            {renderFraccion('?', '?')}
          </div>

          {/* Mini pizzas */}
          <div className="frac-op-visual-row">
            {renderMiniPizza(fraccion1[1], fraccion1[0])}
            <span className="frac-op-visual-operator">{getOperatorSymbol(tipo)}</span>
            {renderMiniPizza(fraccion2[1], fraccion2[0])}
          </div>

          <div className="frac-op-action-area">
            <button className="frac-op-action-button" onClick={advanceFromVer}>
              !Vamos a resolverla!
            </button>
          </div>
        </div>
      )}

      {/* ===== FASE: VER (verbal) ===== */}
      {phase === 'ver' && tipo === 'verbal' && (
        <div className="frac-op-phase-content" key="ver-verbal">
          <div className="frac-op-instruction">Lee el problema con atencion:</div>
          <div className="frac-op-action-area">
            <button className="frac-op-action-button" onClick={advanceFromVer}>
              Ya lo lei, !seguir!
            </button>
          </div>
        </div>
      )}

      {/* ===== FASE: DENOMINADOR COMUN (sumar/restar diferente denom) ===== */}
      {phase === 'denominador' && (
        <div className="frac-op-phase-content" key="denominador">
          <div className="frac-op-instruction">
            Los denominadores son diferentes ({fraccion1[1]} y {fraccion2[1]}). Necesitamos un denominador comun. En cuantas partes iguales cortamos ambas?
          </div>

          <div className="frac-op-equation-visual">
            {renderFraccion(fraccion1[0], fraccion1[1])}
            <div className="frac-op-operator">{getOperatorSymbol(tipo)}</div>
            {renderFraccion(fraccion2[0], fraccion2[1])}
          </div>

          <div className={`frac-op-message ${message.type}`}>{message.text}</div>

          <div className="frac-op-toolbox-section">
            <div className="frac-op-toolbox-title">Elige el denominador comun</div>
            <div className="toolbox">
              {[2, 3, 4, 5, 6, 8, 9, 10, 12, 15].map(num =>
                renderNumberblock(num, handleDenominadorComun, denominadorComun ? [denominadorComun] : [])
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== FASE: CONVERTIR (sumar/restar diferente denom) ===== */}
      {phase === 'convertir' && denominadorComun && (
        <div className="frac-op-phase-content" key="convertir">
          <div className="frac-op-instruction">
            Convierte las fracciones al denominador {denominadorComun}. Escribe los nuevos numeradores:
          </div>

          <div className="frac-op-convert-row">
            <div className="frac-op-convert-item">
              <div className="frac-op-convert-original">{fraccion1[0]}/{fraccion1[1]}</div>
              <div className="frac-op-convert-arrow">→</div>
              {renderFraccionInput(numeradorInput, denominadorComun, null, null, true, false)}
              <div className="frac-op-convert-hint">
                {fraccion1[0]} x {denominadorComun / fraccion1[1]} = ?
              </div>
            </div>

            <div className="frac-op-convert-item">
              <div className="frac-op-convert-original">{fraccion2[0]}/{fraccion2[1]}</div>
              <div className="frac-op-convert-arrow">→</div>
              {renderFraccionInput(denominadorInput, denominadorComun, null, null, true, false)}
              <div className="frac-op-convert-hint">
                {fraccion2[0]} x {denominadorComun / fraccion2[1]} = ?
              </div>
            </div>
          </div>

          <div className={`frac-op-message ${message.type}`}>{message.text}</div>

          <div className="frac-op-dual-input">
            <div className="frac-op-input-group">
              <label>Nuevo numerador de {fraccion1[0]}/{fraccion1[1]}:</label>
              {renderNumPad(numeradorInput, setNumeradorInput, () => {}, 2)}
            </div>
            <div className="frac-op-input-group">
              <label>Nuevo numerador de {fraccion2[0]}/{fraccion2[1]}:</label>
              {renderNumPad(denominadorInput, setDenominadorInput, () => {}, 2)}
            </div>
          </div>

          <div className="frac-op-action-area">
            <button className="frac-op-action-button" onClick={handleConvertSubmit}
              disabled={!numeradorInput || !denominadorInput}>
              Verificar
            </button>
          </div>
        </div>
      )}

      {/* ===== FASE: OPERAR (sumar/restar) ===== */}
      {phase === 'operar' && (
        <div className="frac-op-phase-content" key="operar">
          {(() => {
            const den = sameDenominator(currentChallenge) ? fraccion1[1] : denominadorComun;
            const n1 = sameDenominator(currentChallenge) ? fraccion1[0] : convertedNums[0];
            const n2 = sameDenominator(currentChallenge) ? fraccion2[0] : convertedNums[1];
            const opWord = tipo === 'sumar' ? 'Suma' : 'Resta';
            const opSymbol = getOperatorSymbol(tipo);

            return (
              <>
                <div className="frac-op-instruction">
                  {opWord} los numeradores. El denominador se queda igual:
                </div>

                <div className="frac-op-equation-visual">
                  {renderFraccion(n1, den)}
                  <div className="frac-op-operator">{opSymbol}</div>
                  {renderFraccion(n2, den)}
                  <div className="frac-op-operator">=</div>
                  {renderFraccion(resultNumerador || '?', den)}
                </div>

                <div className="frac-op-calc-hint">
                  {n1} {opSymbol} {n2} = ?
                </div>

                <div className={`frac-op-message ${message.type}`}>{message.text}</div>

                {renderNumPad(resultNumerador, setResultNumerador, handleOperarSubmit, 2)}
              </>
            );
          })()}
        </div>
      )}

      {/* ===== FASE: NUMERADORES (multiplicar) ===== */}
      {phase === 'numeradores' && (
        <div className="frac-op-phase-content" key="numeradores">
          <div className="frac-op-instruction">
            Multiplica los numeradores:
          </div>

          <div className="frac-op-equation-visual">
            {renderFraccion(fraccion1[0], fraccion1[1])}
            <div className="frac-op-operator">×</div>
            {renderFraccion(fraccion2[0], fraccion2[1])}
            <div className="frac-op-operator">=</div>
            {renderFraccion(resultNumerador || '?', '?')}
          </div>

          <div className="frac-op-calc-hint">
            {fraccion1[0]} × {fraccion2[0]} = ?
          </div>

          <div className={`frac-op-message ${message.type}`}>{message.text}</div>

          {renderNumPad(resultNumerador, setResultNumerador, handleMultNumeradores, 3)}
        </div>
      )}

      {/* ===== FASE: DENOMINADORES (multiplicar) ===== */}
      {phase === 'denominadores' && (
        <div className="frac-op-phase-content" key="denominadores">
          <div className="frac-op-instruction">
            Ahora multiplica los denominadores:
          </div>

          <div className="frac-op-equation-visual">
            {renderFraccion(fraccion1[0], fraccion1[1])}
            <div className="frac-op-operator">×</div>
            {renderFraccion(fraccion2[0], fraccion2[1])}
            <div className="frac-op-operator">=</div>
            {renderFraccion(resultado[0], resultDenominador || '?')}
          </div>

          <div className="frac-op-calc-hint">
            {fraccion1[1]} × {fraccion2[1]} = ?
          </div>

          <div className={`frac-op-message ${message.type}`}>{message.text}</div>

          {renderNumPad(resultDenominador, setResultDenominador, handleMultDenominadores, 3)}
        </div>
      )}

      {/* ===== FASE: INVERTIR (dividir) ===== */}
      {phase === 'invertir' && (
        <div className="frac-op-phase-content" key="invertir">
          <div className="frac-op-instruction">
            Para dividir fracciones, invertimos la segunda fraccion. Escribe {fraccion2[0]}/{fraccion2[1]} al reves:
          </div>

          <div className="frac-op-equation-visual">
            {renderFraccion(fraccion2[0], fraccion2[1])}
            <div className="frac-op-operator">→</div>
            {renderFraccion(numeradorInput || '?', denominadorInput || '?', true)}
          </div>

          <div className={`frac-op-message ${message.type}`}>{message.text}</div>

          <div className="frac-op-dual-input">
            <div className="frac-op-input-group">
              <label>Nuevo numerador:</label>
              {renderNumPad(numeradorInput, setNumeradorInput, () => {}, 2)}
            </div>
            <div className="frac-op-input-group">
              <label>Nuevo denominador:</label>
              {renderNumPad(denominadorInput, setDenominadorInput, () => {}, 2)}
            </div>
          </div>

          <div className="frac-op-action-area">
            <button className="frac-op-action-button" onClick={handleInvertSubmit}
              disabled={!numeradorInput || !denominadorInput}>
              Verificar
            </button>
          </div>
        </div>
      )}

      {/* ===== FASE: MULTIPLICAR (dividir — after invert) ===== */}
      {phase === 'multiplicar' && tipo === 'dividir' && (
        <div className="frac-op-phase-content" key="mult-div">
          <div className="frac-op-instruction">
            Ahora multiplica {fraccion1[0]}/{fraccion1[1]} × {invertedFrac[0]}/{invertedFrac[1]}:
          </div>

          <div className="frac-op-equation-visual">
            {renderFraccion(fraccion1[0], fraccion1[1])}
            <div className="frac-op-operator">×</div>
            {renderFraccion(invertedFrac[0], invertedFrac[1])}
            <div className="frac-op-operator">=</div>
            {renderFraccion(resultNumerador || '?', resultDenominador || '?')}
          </div>

          <div className={`frac-op-message ${message.type}`}>{message.text}</div>

          <div className="frac-op-dual-input">
            <div className="frac-op-input-group">
              <label>Numerador: {fraccion1[0]} × {invertedFrac[0]} =</label>
              {renderNumPad(resultNumerador, setResultNumerador, () => {}, 3)}
            </div>
            <div className="frac-op-input-group">
              <label>Denominador: {fraccion1[1]} × {invertedFrac[1]} =</label>
              {renderNumPad(resultDenominador, setResultDenominador, () => {}, 3)}
            </div>
          </div>

          <div className="frac-op-action-area">
            <button className="frac-op-action-button" onClick={handleDivMultSubmit}
              disabled={!resultNumerador || !resultDenominador}>
              Verificar
            </button>
          </div>
        </div>
      )}

      {/* ===== FASE: FRACCION (verbal) ===== */}
      {phase === 'fraccion' && tipo === 'verbal' && (
        <div className="frac-op-phase-content" key="verbal-frac">
          <div className="frac-op-instruction">
            Escribe la fraccion que responde al problema:
          </div>

          <div className="frac-op-equation-visual">
            {renderFraccion(numeradorInput || '?', denominadorInput || '?', true)}
          </div>

          <div className={`frac-op-message ${message.type}`}>{message.text}</div>

          <div className="frac-op-dual-input">
            <div className="frac-op-input-group">
              <label>Numerador (arriba):</label>
              {renderNumPad(numeradorInput, setNumeradorInput, () => {}, 2)}
            </div>
            <div className="frac-op-input-group">
              <label>Denominador (abajo):</label>
              {renderNumPad(denominadorInput, setDenominadorInput, () => {}, 2)}
            </div>
          </div>

          <div className="frac-op-action-area">
            <button className="frac-op-action-button" onClick={handleVerbalSubmit}
              disabled={!numeradorInput || !denominadorInput}>
              Verificar
            </button>
          </div>
        </div>
      )}

      {/* ===== FASE: RESULTADO ===== */}
      {phase === 'resultado' && (
        <div className="frac-op-phase-content" key="resultado">
          <div className="frac-op-instruction">!Correcto!</div>

          <div className="frac-op-equation-visual">
            {tipo !== 'verbal' && (
              <>
                {renderFraccion(fraccion1[0], fraccion1[1])}
                <div className="frac-op-operator">{getOperatorSymbol(tipo)}</div>
                {renderFraccion(fraccion2[0], fraccion2[1])}
                <div className="frac-op-operator">=</div>
              </>
            )}
            {renderFraccion(resultado[0], resultado[1], true)}
          </div>

          {tipo !== 'verbal' && (
            <div className="frac-op-visual-row">
              {renderMiniPizza(resultado[1], resultado[0], 150)}
            </div>
          )}

          {explicacion && (
            <div className="frac-op-explicacion">{explicacion}</div>
          )}

          <div className="frac-op-action-area">
            <button className="frac-op-action-button next" onClick={nextChallenge}>
              {currentChallengeIndex < retos.length - 1 ? 'Siguiente Reto' : '!Terminar!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FraccionOperaciones;
