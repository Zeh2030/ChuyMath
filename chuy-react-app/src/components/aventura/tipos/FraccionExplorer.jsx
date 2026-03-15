import React, { useState, useEffect } from 'react';
import './NumberblocksConstructor.css';
import './FraccionExplorer.css';

const FraccionExplorer = ({ mision, onCompletar }) => {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [phase, setPhase] = useState('ver'); // identificar: 'ver'|'numerador'|'denominador'|'resultado' | construir: 'ver'|'colorear'|'resultado'
  const [selectedNumerador, setSelectedNumerador] = useState(null);
  const [selectedDenominador, setSelectedDenominador] = useState(null);
  const [coloredParts, setColoredParts] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const retos = mision.retos || [];
  const currentChallenge = retos[currentChallengeIndex];

  useEffect(() => {
    setPhase('ver');
    setSelectedNumerador(null);
    setSelectedDenominador(null);
    setColoredParts([]);
    setMessage({ text: '', type: '' });
    setShowConfetti(false);
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

  // ===== SVG Pizza rendering =====

  const renderPizzaSector = (index, total, isColored, color, clickeable, onClick) => {
    const angle = 360 / total;
    const startAngle = index * angle - 90;
    const endAngle = startAngle + angle;
    const radius = 120;
    const cx = 150, cy = 150;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(toRad(startAngle));
    const y1 = cy + radius * Math.sin(toRad(startAngle));
    const x2 = cx + radius * Math.cos(toRad(endAngle));
    const y2 = cy + radius * Math.sin(toRad(endAngle));
    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return (
      <path
        key={index}
        d={path}
        className={`fraccion-sector ${isColored ? 'coloreada' : 'vacia'} ${clickeable ? 'clickeable' : ''}`}
        fill={isColored ? color : '#f5f5f5'}
        onClick={clickeable ? onClick : undefined}
      />
    );
  };

  const renderPizza = (partes, coloreadas, color, clickeable = false, onClickPart = null) => {
    // Determine which parts are colored
    let coloredSet;
    if (Array.isArray(coloreadas)) {
      coloredSet = new Set(coloreadas);
    } else {
      coloredSet = new Set();
      for (let i = 0; i < coloreadas; i++) coloredSet.add(i);
    }

    return (
      <div className="fraccion-visual-container">
        <svg width="300" height="300" viewBox="0 0 300 300" className={`fraccion-pizza-svg ${clickeable ? 'clickeable' : ''}`}>
          {/* Pizza base circle */}
          <circle cx="150" cy="150" r="125" fill="#FFF9C4" stroke="#5d4037" strokeWidth="3" />
          {[...Array(partes)].map((_, i) =>
            renderPizzaSector(i, partes, coloredSet.has(i), color, clickeable, () => onClickPart && onClickPart(i))
          )}
          {/* Center dot */}
          <circle cx="150" cy="150" r="4" fill="#5d4037" />
        </svg>
      </div>
    );
  };

  // ===== Barra (chocolate) rendering =====

  const renderBarra = (partes, coloreadas, color, clickeable = false, onClickPart = null) => {
    let coloredSet;
    if (Array.isArray(coloreadas)) {
      coloredSet = new Set(coloreadas);
    } else {
      coloredSet = new Set();
      for (let i = 0; i < coloreadas; i++) coloredSet.add(i);
    }

    return (
      <div className="fraccion-barra-container">
        {[...Array(partes)].map((_, i) => (
          <div
            key={i}
            className={`fraccion-barra-pieza ${coloredSet.has(i) ? 'coloreada' : 'vacia'} ${clickeable ? 'clickeable' : ''}`}
            style={coloredSet.has(i) ? { backgroundColor: color } : {}}
            onClick={clickeable ? () => onClickPart && onClickPart(i) : undefined}
          />
        ))}
      </div>
    );
  };

  // ===== Fraccion display =====

  const renderFraccionDisplay = (numerador, denominador) => (
    <div className="fraccion-display">
      <div className="fraccion-display-number">{numerador}</div>
      <div className="fraccion-display-line" />
      <div className="fraccion-display-number">{denominador}</div>
    </div>
  );

  const renderFraccionPlaceholder = (numerador, denominador) => (
    <div className="fraccion-display">
      <div className={numerador !== null ? 'fraccion-display-number' : 'fraccion-display-placeholder'}>
        {numerador !== null ? numerador : '?'}
      </div>
      <div className="fraccion-display-line" />
      <div className={denominador !== null ? 'fraccion-display-number' : 'fraccion-display-placeholder'}>
        {denominador !== null ? denominador : '?'}
      </div>
    </div>
  );

  // ===== Numberblock rendering (misma implementacion que AreaConstructor) =====

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

  // ===== Handlers para tipo "identificar" =====

  const handleSelectNumerador = (num) => {
    if (!currentChallenge) return;
    if (num === currentChallenge.coloreadas) {
      setSelectedNumerador(num);
      setMessage({ text: '!Bien! Ahora cuenta en cuantas partes se dividio.', type: 'success' });
      setTimeout(() => {
        setPhase('denominador');
        setMessage({ text: '', type: '' });
      }, 1500);
    } else {
      setMessage({ text: 'Cuenta otra vez las partes coloreadas.', type: 'error' });
    }
  };

  const handleSelectDenominador = (num) => {
    if (!currentChallenge) return;
    if (num === currentChallenge.partes) {
      setSelectedDenominador(num);
      setMessage({ text: '', type: '' });
      setPhase('resultado');
      triggerConfetti();
    } else {
      setMessage({ text: 'Cuenta todas las partes, las coloreadas y las vacias.', type: 'error' });
    }
  };

  // ===== Handlers para tipo "construir" =====

  const handleColorPart = (index) => {
    setColoredParts(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleCheckBuild = () => {
    if (!currentChallenge) return;
    if (coloredParts.length === currentChallenge.coloreadas) {
      setPhase('resultado');
      setMessage({ text: '', type: '' });
      triggerConfetti();
    } else if (coloredParts.length < currentChallenge.coloreadas) {
      setMessage({ text: `Necesitas colorear ${currentChallenge.coloreadas} partes. Te faltan ${currentChallenge.coloreadas - coloredParts.length}.`, type: 'hint' });
    } else {
      setMessage({ text: `Coloreaste de mas. Solo necesitas ${currentChallenge.coloreadas} partes.`, type: 'error' });
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

  // ===== Auto-advance from "ver" phase =====

  const advanceFromVer = () => {
    if (!currentChallenge) return;
    if (currentChallenge.tipo === 'identificar') {
      setPhase('numerador');
    } else {
      setPhase('colorear');
    }
  };

  // ===== Renderizado =====

  if (gameCompleted) {
    return (
      <div className="fraccion-game-container nb-game-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 className="fraccion-title">!Felicidades, Maestro de las Fracciones!</h2>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Has completado todos los retos de fracciones.</p>
        <button className="fraccion-action-button" onClick={() => { setCurrentChallengeIndex(0); setGameCompleted(false); }}>
          Jugar de Nuevo
        </button>
      </div>
    );
  }

  if (!currentChallenge) return <div>Cargando reto...</div>;

  const { tipo, forma, partes, coloreadas, historia, explicacion } = currentChallenge;
  // Colores fijos para pizza (amarillo dorado) y barra (azul) — siempre visibles
  const color = forma === 'circulo' ? '#FBC02D' : '#42A5F5';
  const isIdentificar = tipo === 'identificar';

  // Phase labels for indicator
  const phases = isIdentificar
    ? [
        { key: 'ver', label: '1. Ver' },
        { key: 'numerador', label: '2. Numerador' },
        { key: 'denominador', label: '3. Denominador' },
        { key: 'resultado', label: '4. Resultado' },
      ]
    : [
        { key: 'ver', label: '1. Leer' },
        { key: 'colorear', label: '2. Colorear' },
        { key: 'resultado', label: '3. Resultado' },
      ];

  const phaseOrder = phases.map(p => p.key);
  const currentPhaseIdx = phaseOrder.indexOf(phase);

  return (
    <div className="fraccion-game-container nb-game-container">
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

      {/* Progreso de retos */}
      <div className="fraccion-progress">
        {retos.map((_, i) => (
          <div key={i} className={`fraccion-progress-dot ${i < currentChallengeIndex ? 'completed' : ''} ${i === currentChallengeIndex ? 'current' : ''}`} />
        ))}
      </div>

      {/* Indicador de fase */}
      <div className="fraccion-phase-indicator">
        {phases.map((p, i) => (
          <div key={p.key} className={`fraccion-phase-step ${i === currentPhaseIdx ? 'active' : i < currentPhaseIdx ? 'completed' : ''}`}>
            {p.label}
          </div>
        ))}
      </div>

      {/* Historia */}
      <div className="fraccion-story-bubble">
        <p>{historia}</p>
      </div>

      {/* ===== TIPO IDENTIFICAR ===== */}
      {isIdentificar && (
        <>
          {/* FASE: VER */}
          {phase === 'ver' && (
            <div className="fraccion-phase-content" key="ver">
              <div className="fraccion-instruction">
                Observa la figura. Algunas partes estan coloreadas.
              </div>

              {forma === 'circulo'
                ? renderPizza(partes, coloreadas, color)
                : renderBarra(partes, coloreadas, color)
              }

              <div className="fraccion-action-area">
                <button className="fraccion-action-button" onClick={advanceFromVer}>
                  Ya la vi, !seguir!
                </button>
              </div>
            </div>
          )}

          {/* FASE: NUMERADOR */}
          {phase === 'numerador' && (
            <div className="fraccion-phase-content" key="numerador">
              <div className="fraccion-instruction">
                Cuantas partes estan coloreadas? Elige el Numberblock correcto.
              </div>

              {forma === 'circulo'
                ? renderPizza(partes, coloreadas, color)
                : renderBarra(partes, coloreadas, color)
              }

              {renderFraccionPlaceholder(selectedNumerador, null)}

              <div className={`fraccion-message ${message.type}`}>{message.text}</div>

              <div className="fraccion-toolbox-section">
                <div className="fraccion-toolbox-title">Elige el Numberblock correcto</div>
                <div className="toolbox">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num =>
                    renderNumberblock(num, handleSelectNumerador, [])
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FASE: DENOMINADOR */}
          {phase === 'denominador' && (
            <div className="fraccion-phase-content" key="denominador">
              <div className="fraccion-instruction">
                En cuantas partes iguales se dividio? Elige el Numberblock.
              </div>

              {forma === 'circulo'
                ? renderPizza(partes, coloreadas, color)
                : renderBarra(partes, coloreadas, color)
              }

              {renderFraccionPlaceholder(selectedNumerador, selectedDenominador)}

              <div className={`fraccion-message ${message.type}`}>{message.text}</div>

              <div className="fraccion-toolbox-section">
                <div className="fraccion-toolbox-title">Elige el Numberblock correcto</div>
                <div className="toolbox">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num =>
                    renderNumberblock(num, handleSelectDenominador, [])
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FASE: RESULTADO */}
          {phase === 'resultado' && (
            <div className="fraccion-phase-content" key="resultado">
              <div className="fraccion-instruction">
                !Correcto!
              </div>

              {forma === 'circulo'
                ? renderPizza(partes, coloreadas, color)
                : renderBarra(partes, coloreadas, color)
              }

              {renderFraccionDisplay(coloreadas, partes)}

              {explicacion && (
                <div className="fraccion-explicacion">{explicacion}</div>
              )}

              <div className="fraccion-action-area">
                <button className="fraccion-action-button next" onClick={nextChallenge}>
                  {currentChallengeIndex < retos.length - 1 ? 'Siguiente Reto' : '!Terminar!'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== TIPO CONSTRUIR ===== */}
      {!isIdentificar && (
        <>
          {/* FASE: VER (Leer la fraccion) */}
          {phase === 'ver' && (
            <div className="fraccion-phase-content" key="ver-construir">
              <div className="fraccion-instruction">
                Lee la fraccion y preparate para colorear.
              </div>

              {renderFraccionDisplay(coloreadas, partes)}

              <div className="fraccion-action-area">
                <button className="fraccion-action-button" onClick={advanceFromVer}>
                  !Listo, a colorear!
                </button>
              </div>
            </div>
          )}

          {/* FASE: COLOREAR */}
          {phase === 'colorear' && (
            <div className="fraccion-phase-content" key="colorear">
              <div className="fraccion-instruction">
                Colorea exactamente {coloreadas} de las {partes} partes. Haz clic en las partes.
              </div>

              {renderFraccionDisplay(coloreadas, partes)}

              {forma === 'circulo'
                ? renderPizza(partes, coloredParts, color, true, handleColorPart)
                : renderBarra(partes, coloredParts, color, true, handleColorPart)
              }

              <div className={`fraccion-message ${message.type}`}>{message.text}</div>

              <div className="fraccion-action-area">
                <button className="fraccion-action-button" onClick={handleCheckBuild} disabled={coloredParts.length === 0}>
                  Verificar
                </button>
              </div>
            </div>
          )}

          {/* FASE: RESULTADO */}
          {phase === 'resultado' && (
            <div className="fraccion-phase-content" key="resultado-construir">
              <div className="fraccion-instruction">
                !Excelente! Coloreaste correctamente {coloreadas}/{partes}
              </div>

              {forma === 'circulo'
                ? renderPizza(partes, coloredParts.length > 0 ? coloredParts : coloreadas, color)
                : renderBarra(partes, coloredParts.length > 0 ? coloredParts : coloreadas, color)
              }

              {renderFraccionDisplay(coloreadas, partes)}

              {explicacion && (
                <div className="fraccion-explicacion">{explicacion}</div>
              )}

              <div className="fraccion-action-area">
                <button className="fraccion-action-button next" onClick={nextChallenge}>
                  {currentChallengeIndex < retos.length - 1 ? 'Siguiente Reto' : '!Terminar!'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FraccionExplorer;
