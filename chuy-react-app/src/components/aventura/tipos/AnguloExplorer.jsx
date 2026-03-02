import React, { useState, useEffect } from 'react';
import './AnguloExplorer.css';

const AnguloExplorer = ({ mision, onCompletar }) => {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [phase, setPhase] = useState('ver'); // identificar: 'ver'|'clasificar'|'resultado' | triangulo: 'ver'|'calcular'|'resultado'
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [anguloInput, setAnguloInput] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const retos = mision.retos || [];
  const currentChallenge = retos[currentChallengeIndex];

  useEffect(() => {
    setPhase('ver');
    setSelectedTipo(null);
    setAnguloInput('');
    setWrongAttempts(0);
    setMessage({ text: '', type: '' });
    setShowConfetti(false);
  }, [currentChallengeIndex]);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // ===== SVG Angle rendering =====

  const renderAngleSVG = (angulo, showValue = true, colorClass = null) => {
    const cx = 150, cy = 200;
    const rayLength = 130;
    const arcRadius = 50;
    const angleRad = (angulo * Math.PI) / 180;

    // Ray 1 is horizontal to the right
    const x1 = cx + rayLength;
    const y1 = cy;

    // Ray 2 goes up at the given angle
    const x2 = cx + rayLength * Math.cos(-angleRad);
    const y2 = cy + rayLength * Math.sin(-angleRad);

    // Arc endpoints
    const arcX1 = cx + arcRadius;
    const arcY1 = cy;
    const arcX2 = cx + arcRadius * Math.cos(-angleRad);
    const arcY2 = cy + arcRadius * Math.sin(-angleRad);
    const largeArc = angulo > 180 ? 1 : 0;

    // Label position (midpoint of arc)
    const midAngle = -angleRad / 2;
    const labelDist = arcRadius + 25;
    const labelX = cx + labelDist * Math.cos(midAngle);
    const labelY = cy + labelDist * Math.sin(midAngle);

    // Determine color class
    const tipoAngulo = colorClass || (angulo < 90 ? 'agudo' : angulo === 90 ? 'recto' : 'obtuso');

    return (
      <div className="angulo-visual-container">
        <svg width="320" height="250" viewBox="0 0 320 250" className="angulo-svg">
          {/* Arc */}
          <path
            d={`M ${arcX1} ${arcY1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 0 ${arcX2} ${arcY2}`}
            className={`angulo-arc ${tipoAngulo}`}
          />

          {/* Right angle square indicator */}
          {angulo === 90 && (
            <rect
              x={cx}
              y={cy - 20}
              width="20"
              height="20"
              fill="none"
              stroke="#c62828"
              strokeWidth="2"
            />
          )}

          {/* Rays */}
          <line x1={cx} y1={cy} x2={x1} y2={y1} className="angulo-ray" stroke="#2c3e50" />
          <line x1={cx} y1={cy} x2={x2} y2={y2} className="angulo-ray" stroke="#2c3e50" />

          {/* Vertex dot */}
          <circle cx={cx} cy={cy} r="5" fill="#2c3e50" />

          {/* Angle label */}
          {showValue && (
            <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="angulo-label">
              {angulo}°
            </text>
          )}
        </svg>
      </div>
    );
  };

  // ===== Triangle SVG rendering =====

  const renderTriangleSVG = (angulos, unknownIndex, resolved = false, resolvedValue = null) => {
    // Simple equilateral-ish triangle positioning
    // A at bottom-left, B at bottom-right, C at top
    const points = [
      { x: 60, y: 220 },   // A
      { x: 280, y: 220 },  // B
      { x: 170, y: 50 },   // C
    ];

    const arcRadius = 30;

    const renderAngleArc = (vertex, p1, p2, value, isUnknown, idx) => {
      // Calculate angles from vertex to p1 and p2
      const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
      const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);

      const arcX1 = vertex.x + arcRadius * Math.cos(a1);
      const arcY1 = vertex.y + arcRadius * Math.sin(a1);
      const arcX2 = vertex.x + arcRadius * Math.cos(a2);
      const arcY2 = vertex.y + arcRadius * Math.sin(a2);

      // Label at midpoint
      const midA = (a1 + a2) / 2;
      // Adjust if the arc goes the wrong way
      const labelDist = arcRadius + 20;
      const labelX = vertex.x + labelDist * Math.cos(midA);
      const labelY = vertex.y + labelDist * Math.sin(midA);

      const displayValue = isUnknown && !resolved ? '?' : (isUnknown && resolved ? resolvedValue : value);
      const isResolved = isUnknown && resolved;

      return (
        <g key={idx}>
          <path
            d={`M ${arcX1} ${arcY1} A ${arcRadius} ${arcRadius} 0 0 0 ${arcX2} ${arcY2}`}
            fill={isUnknown ? (resolved ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)') : 'rgba(52,152,219,0.2)'}
            stroke={isUnknown ? (resolved ? '#2ecc71' : '#e74c3c') : '#3498db'}
            strokeWidth="2"
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className={isUnknown && !resolved ? 'angulo-label-unknown' : 'angulo-label'}
            fill={isResolved ? '#2ecc71' : undefined}
          >
            {displayValue}{displayValue !== '?' ? '°' : ''}
          </text>
        </g>
      );
    };

    return (
      <div className="angulo-triangulo-container">
        <svg width="340" height="260" viewBox="0 0 340 260" className="angulo-triangulo-svg">
          {/* Triangle outline */}
          <polygon
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(255,255,255,0.5)"
            stroke="#2c3e50"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Angle arcs: A (bottom-left), B (bottom-right), C (top) */}
          {renderAngleArc(points[0], points[1], points[2], angulos[0], unknownIndex === 0, 0)}
          {renderAngleArc(points[1], points[2], points[0], angulos[1], unknownIndex === 1, 1)}
          {renderAngleArc(points[2], points[0], points[1], angulos[2], unknownIndex === 2, 2)}
        </svg>
      </div>
    );
  };

  // ===== Barra de 180 grados =====

  const renderBarra180 = (angulos, unknownIndex, resolved = false, resolvedValue = null) => {
    return (
      <div>
        <div className="angulo-barra-180">
          {angulos.map((a, i) => {
            const isUnknown = i === unknownIndex;
            const value = isUnknown ? (resolved ? resolvedValue : null) : a;
            const pct = value !== null ? (value / 180) * 100 : ((180 - angulos.filter((v, j) => j !== unknownIndex && v !== null).reduce((s, v) => s + v, 0)) / 180) * 100;

            return (
              <div
                key={i}
                className={`angulo-barra-segmento ${isUnknown ? (resolved ? 'resuelto' : 'desconocido') : 'conocido'}`}
                style={{ width: `${pct}%` }}
              >
                {value !== null ? `${value}°` : '?'}
              </div>
            );
          })}
        </div>
        <div className="angulo-barra-total">Total = 180°</div>
      </div>
    );
  };

  // ===== Handlers para tipo "identificar" =====

  const handleSelectTipo = (tipo) => {
    if (!currentChallenge) return;
    setSelectedTipo(tipo);

    if (tipo === currentChallenge.respuesta) {
      setMessage({ text: '', type: '' });
      setPhase('resultado');
      triggerConfetti();
    } else {
      setWrongAttempts(prev => prev + 1);
      setMessage({ text: 'No es ese tipo. Piensa: es menor, igual o mayor que 90°?', type: 'error' });
      setTimeout(() => setSelectedTipo(null), 1000);
    }
  };

  // ===== Handlers para tipo "triangulo" =====

  const handleAnguloSubmit = () => {
    if (!currentChallenge || !anguloInput) return;
    const answer = parseInt(anguloInput, 10);
    const unknownIndex = currentChallenge.angulos.findIndex(a => a === null);
    const knownSum = currentChallenge.angulos.filter(a => a !== null).reduce((s, v) => s + v, 0);
    const correctAnswer = 180 - knownSum;

    if (answer === correctAnswer) {
      setPhase('resultado');
      setMessage({ text: '', type: '' });
      triggerConfetti();
    } else {
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);
      setAnguloInput('');

      if (newAttempts >= 2) {
        const knownAngles = currentChallenge.angulos.filter(a => a !== null);
        setMessage({ text: `Pista: ${knownAngles.join(' + ')} = ${knownSum}. Cuanto le falta para llegar a 180?`, type: 'hint' });
      } else {
        setMessage({ text: 'Casi... Recuerda que los 3 angulos suman 180°.', type: 'error' });
      }
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

  const advanceFromVer = () => {
    if (!currentChallenge) return;
    if (currentChallenge.tipo === 'identificar') {
      setPhase('clasificar');
    } else {
      setPhase('calcular');
    }
  };

  // ===== Helper: get nombre de tipo =====

  const getNombreTipo = (tipo) => {
    const nombres = { agudo: 'AGUDO', recto: 'RECTO', obtuso: 'OBTUSO' };
    return nombres[tipo] || tipo;
  };

  const getExplicacionTipo = (angulo, tipo) => {
    if (tipo === 'recto') return `${angulo}° es un angulo RECTO: exactamente 90°. Como la esquina de una hoja.`;
    if (tipo === 'agudo') return `${angulo}° es un angulo AGUDO: es menor que 90°. Mas cerrado que la esquina de una hoja.`;
    return `${angulo}° es un angulo OBTUSO: es mayor que 90°. Mas abierto que la esquina de una hoja.`;
  };

  // ===== Renderizado =====

  if (gameCompleted) {
    return (
      <div className="angulo-game-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 className="angulo-title">Felicidades, Maestro de los Angulos!</h2>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Has completado todos los retos de angulos.</p>
        <button className="angulo-action-button" onClick={() => { setCurrentChallengeIndex(0); setGameCompleted(false); }}>
          Jugar de Nuevo
        </button>
      </div>
    );
  }

  if (!currentChallenge) return <div>Cargando reto...</div>;

  const { tipo } = currentChallenge;
  const isIdentificar = tipo === 'identificar';
  const isTriangulo = tipo === 'triangulo';

  // Phase labels
  const phases = isIdentificar
    ? [
        { key: 'ver', label: '1. Ver' },
        { key: 'clasificar', label: '2. Clasificar' },
        { key: 'resultado', label: '3. Resultado' },
      ]
    : [
        { key: 'ver', label: '1. Ver' },
        { key: 'calcular', label: '2. Calcular' },
        { key: 'resultado', label: '3. Resultado' },
      ];

  const phaseOrder = phases.map(p => p.key);
  const currentPhaseIdx = phaseOrder.indexOf(phase);

  // For triangulo type
  let unknownIndex = null;
  let correctAnswer = null;
  if (isTriangulo) {
    unknownIndex = currentChallenge.angulos.findIndex(a => a === null);
    const knownSum = currentChallenge.angulos.filter(a => a !== null).reduce((s, v) => s + v, 0);
    correctAnswer = 180 - knownSum;
  }

  return (
    <div className="angulo-game-container">
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
      <div className="angulo-progress">
        {retos.map((_, i) => (
          <div key={i} className={`angulo-progress-dot ${i < currentChallengeIndex ? 'completed' : ''} ${i === currentChallengeIndex ? 'current' : ''}`} />
        ))}
      </div>

      {/* Indicador de fase */}
      <div className="angulo-phase-indicator">
        {phases.map((p, i) => (
          <div key={p.key} className={`angulo-phase-step ${i === currentPhaseIdx ? 'active' : i < currentPhaseIdx ? 'completed' : ''}`}>
            {p.label}
          </div>
        ))}
      </div>

      {/* Historia */}
      <div className="angulo-story-bubble">
        <p>{currentChallenge.historia}</p>
      </div>

      {/* ===== TIPO IDENTIFICAR ===== */}
      {isIdentificar && (
        <>
          {/* FASE: VER */}
          {phase === 'ver' && (
            <div className="angulo-phase-content" key="ver">
              <div className="angulo-instruction">
                Observa el angulo. Mira cuanto se abren los rayos.
              </div>

              {renderAngleSVG(currentChallenge.angulo)}

              <div className="angulo-referencia">
                Recuerda: la esquina de una hoja de papel mide exactamente 90°
              </div>

              <div className="angulo-action-area">
                <button className="angulo-action-button" onClick={advanceFromVer}>
                  Ya lo vi, clasificar!
                </button>
              </div>
            </div>
          )}

          {/* FASE: CLASIFICAR */}
          {phase === 'clasificar' && (
            <div className="angulo-phase-content" key="clasificar">
              <div className="angulo-instruction">
                Que tipo de angulo es {currentChallenge.angulo}°?
              </div>

              {renderAngleSVG(currentChallenge.angulo)}

              <div className="angulo-clasificacion-grid">
                <div
                  className={`angulo-tipo-card ${selectedTipo === 'agudo' ? (currentChallenge.respuesta === 'agudo' ? 'correct' : 'incorrect') : ''}`}
                  onClick={() => handleSelectTipo('agudo')}
                >
                  <div className="angulo-tipo-icon">
                    <svg width="50" height="50" viewBox="0 0 50 50">
                      <line x1="5" y1="45" x2="45" y2="45" stroke="#1565c0" strokeWidth="3" />
                      <line x1="5" y1="45" x2="35" y2="10" stroke="#1565c0" strokeWidth="3" />
                      <path d="M 15 45 A 10 10 0 0 0 12 38" fill="none" stroke="#42a5f5" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="angulo-tipo-nombre">Agudo</div>
                  <div className="angulo-tipo-desc">Menor que 90°</div>
                </div>

                <div
                  className={`angulo-tipo-card ${selectedTipo === 'recto' ? (currentChallenge.respuesta === 'recto' ? 'correct' : 'incorrect') : ''}`}
                  onClick={() => handleSelectTipo('recto')}
                >
                  <div className="angulo-tipo-icon">
                    <svg width="50" height="50" viewBox="0 0 50 50">
                      <line x1="5" y1="45" x2="45" y2="45" stroke="#c62828" strokeWidth="3" />
                      <line x1="5" y1="45" x2="5" y2="5" stroke="#c62828" strokeWidth="3" />
                      <rect x="5" y="33" width="12" height="12" fill="none" stroke="#ef5350" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="angulo-tipo-nombre">Recto</div>
                  <div className="angulo-tipo-desc">Exactamente 90°</div>
                </div>

                <div
                  className={`angulo-tipo-card ${selectedTipo === 'obtuso' ? (currentChallenge.respuesta === 'obtuso' ? 'correct' : 'incorrect') : ''}`}
                  onClick={() => handleSelectTipo('obtuso')}
                >
                  <div className="angulo-tipo-icon">
                    <svg width="50" height="50" viewBox="0 0 50 50">
                      <line x1="25" y1="45" x2="50" y2="45" stroke="#e65100" strokeWidth="3" />
                      <line x1="25" y1="45" x2="5" y2="10" stroke="#e65100" strokeWidth="3" />
                      <path d="M 35 45 A 10 10 0 0 0 22 38" fill="none" stroke="#ffa726" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="angulo-tipo-nombre">Obtuso</div>
                  <div className="angulo-tipo-desc">Mayor que 90°</div>
                </div>
              </div>

              <div className={`angulo-message ${message.type}`}>{message.text}</div>

              {currentChallenge.pista && wrongAttempts >= 1 && (
                <div className="angulo-referencia">
                  Pista: {currentChallenge.pista}
                </div>
              )}
            </div>
          )}

          {/* FASE: RESULTADO */}
          {phase === 'resultado' && (
            <div className="angulo-phase-content" key="resultado">
              <div className="angulo-instruction">
                Correcto!
              </div>

              {renderAngleSVG(currentChallenge.angulo)}

              <div className="angulo-explicacion">
                {getExplicacionTipo(currentChallenge.angulo, currentChallenge.respuesta)}
              </div>

              <div className="angulo-action-area">
                <button className="angulo-action-button next" onClick={nextChallenge}>
                  {currentChallengeIndex < retos.length - 1 ? 'Siguiente Reto' : 'Terminar!'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== TIPO TRIANGULO ===== */}
      {isTriangulo && (
        <>
          {/* FASE: VER */}
          {phase === 'ver' && (
            <div className="angulo-phase-content" key="ver-triangulo">
              <div className="angulo-instruction">
                Observa el triangulo. Dos angulos ya estan escritos. Falta uno!
              </div>

              {renderTriangleSVG(currentChallenge.angulos, unknownIndex)}
              {renderBarra180(currentChallenge.angulos, unknownIndex)}

              <div className="angulo-referencia">
                Los 3 angulos de un triangulo SIEMPRE suman 180°
              </div>

              <div className="angulo-action-area">
                <button className="angulo-action-button" onClick={advanceFromVer}>
                  Ya entendi, a calcular!
                </button>
              </div>
            </div>
          )}

          {/* FASE: CALCULAR */}
          {phase === 'calcular' && (
            <div className="angulo-phase-content" key="calcular">
              <div className="angulo-instruction">
                Cuanto mide el angulo que falta? Los 3 suman 180°.
              </div>

              {renderTriangleSVG(currentChallenge.angulos, unknownIndex)}
              {renderBarra180(currentChallenge.angulos, unknownIndex)}

              <div className={`angulo-message ${message.type}`}>{message.text}</div>

              <div className="angulo-number-pad">
                <div className="angulo-number-display">{anguloInput || '?'}°</div>
                <div className="angulo-pad-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                    <button
                      key={digit}
                      className="angulo-pad-btn"
                      onClick={() => anguloInput.length < 3 && setAnguloInput(prev => prev + String(digit))}
                    >
                      {digit}
                    </button>
                  ))}
                  <button className="angulo-pad-btn" style={{ background: '#f0f0f0', fontSize: '1.4rem' }} onClick={() => setAnguloInput(prev => prev.slice(0, -1))}>
                    &#9003;
                  </button>
                  <button className="angulo-pad-btn" onClick={() => anguloInput.length > 0 && anguloInput.length < 3 && setAnguloInput(prev => prev + '0')}>
                    0
                  </button>
                  <button className="angulo-pad-btn" style={{ background: '#2ecc71', color: '#fff', fontSize: '1.2rem' }} onClick={handleAnguloSubmit} disabled={!anguloInput}>
                    &#10003;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FASE: RESULTADO */}
          {phase === 'resultado' && (
            <div className="angulo-phase-content" key="resultado-triangulo">
              <div className="angulo-instruction">
                Excelente!
              </div>

              {renderTriangleSVG(currentChallenge.angulos, unknownIndex, true, correctAnswer)}
              {renderBarra180(currentChallenge.angulos, unknownIndex, true, correctAnswer)}

              <div className="angulo-explicacion">
                {currentChallenge.angulos.filter(a => a !== null).join('° + ')}° + {correctAnswer}° = 180°
              </div>

              <div className="angulo-action-area">
                <button className="angulo-action-button next" onClick={nextChallenge}>
                  {currentChallengeIndex < retos.length - 1 ? 'Siguiente Reto' : 'Terminar!'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnguloExplorer;
