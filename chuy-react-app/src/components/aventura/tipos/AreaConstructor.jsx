import React, { useState, useEffect } from 'react';
import './NumberblocksConstructor.css';
import './AreaConstructor.css';

const AreaConstructor = ({ mision, onCompletar }) => {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [phase, setPhase] = useState('medir'); // 'medir' | 'calcular' | 'construir'
  const [measureStep, setMeasureStep] = useState('horizontal'); // 'horizontal' | 'vertical'
  const [selectedWidth, setSelectedWidth] = useState(null);
  const [selectedHeight, setSelectedHeight] = useState(null);
  const [areaInput, setAreaInput] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintRowIndex, setHintRowIndex] = useState(-1);
  const [buildBlocks, setBuildBlocks] = useState([]);
  const [gridConfig, setGridConfig] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAreaLabel, setShowAreaLabel] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const retos = mision.retos || [];
  const currentChallenge = retos[currentChallengeIndex];

  useEffect(() => {
    setPhase('medir');
    setMeasureStep('horizontal');
    setSelectedWidth(null);
    setSelectedHeight(null);
    setAreaInput('');
    setWrongAttempts(0);
    setShowHint(false);
    setHintRowIndex(-1);
    setBuildBlocks([]);
    setGridConfig(null);
    setMessage({ text: '', type: '' });
    setShowConfetti(false);
    setShowAreaLabel(false);
  }, [currentChallengeIndex]);

  // ===== Numberblocks helpers (reutilizados de NumberblocksConstructor) =====

  const getNumberblockColor = (num) => {
    const colors = {
      1: '#e53935', 2: '#fb8c00', 3: '#fdd835', 4: '#43a047',
      5: '#1e88e5', 6: '#8e24aa', 7: '#673ab7', 8: '#ec407a',
      9: '#e0e0e0', 10: '#ffffff', 11: '#e53935', 12: '#fb8c00'
    };
    return colors[num] || '#95a5a6';
  };

  const Face = ({ singleEye = false }) => (
    <div className="face-container">
      <div className="eye"></div>
      {!singleEye && <div className="eye"></div>}
    </div>
  );

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const renderNumberblock = (num, onSelect, selectedList = []) => {
    const isSelected = selectedList.includes(num);

    const nineColors = ['--nb-9-3', '--nb-9-2', '--nb-9-1'];
    const sevenColors = ['--nb-7-1', '--nb-7-2', '--nb-7-3', '--nb-7-4', '--nb-7-5', '--nb-7-6', '--nb-7-7'];

    if (num === 9) {
      return (
        <div key={num} className={`numberblock has-face ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(num)}>
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
        <div key={num} className={`numberblock has-face nb-11-shape ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(num)}>
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
        <div key={num} className={`numberblock has-face nb-12-shape ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(num)}>
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

    return (
      <div key={num} className={`numberblock has-face ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(num)}>
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

  // ===== Handlers de Fase 1: Medir =====

  const handleMeasureSelect = (num) => {
    if (!currentChallenge) return;

    if (currentChallenge.esSquare) {
      // Para cuadrados, solo necesita medir un lado
      if (num === currentChallenge.columnas) {
        setSelectedWidth(num);
        setSelectedHeight(num);
        setMessage({ text: '¡Correcto! Los dos lados miden lo mismo.', type: 'success' });
        setTimeout(() => {
          setPhase('calcular');
          setMessage({ text: '', type: '' });
        }, 1500);
      } else {
        setMessage({ text: 'Cuenta otra vez los cuadritos de un lado.', type: 'error' });
      }
      return;
    }

    if (measureStep === 'horizontal') {
      if (num === currentChallenge.columnas) {
        setSelectedWidth(num);
        setMeasureStep('vertical');
        setMessage({ text: '¡Bien! Ahora cuenta de arriba a abajo.', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 1500);
      } else {
        setMessage({ text: 'Cuenta otra vez los cuadritos a lo ancho.', type: 'error' });
      }
    } else {
      if (num === currentChallenge.filas) {
        setSelectedHeight(num);
        setMessage({ text: '¡Perfecto! Ahora calcula el total.', type: 'success' });
        setTimeout(() => {
          setPhase('calcular');
          setMessage({ text: '', type: '' });
        }, 1500);
      } else {
        setMessage({ text: 'Cuenta otra vez los cuadritos de arriba a abajo.', type: 'error' });
      }
    }
  };

  // ===== Handlers de Fase 2: Calcular =====

  const handleAreaSubmit = () => {
    if (!currentChallenge || !areaInput) return;
    const answer = parseInt(areaInput, 10);

    if (answer === currentChallenge.target) {
      setShowAreaLabel(true);
      setMessage({ text: `¡Excelente! El area es ${currentChallenge.target} ${currentChallenge.unidad || 'cuadritos'}.`, type: 'success' });
      triggerConfetti();
    } else {
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);
      setAreaInput('');

      if (newAttempts >= 2) {
        setMessage({ text: 'Vamos a contar fila por fila...', type: 'hint' });
        setShowHint(true);
        animateHintRows();
      } else {
        setMessage({ text: 'Casi... vuelve a intentar.', type: 'error' });
      }
    }
  };

  const animateHintRows = () => {
    if (!currentChallenge) return;
    const { filas } = currentChallenge;
    let row = 0;
    const interval = setInterval(() => {
      setHintRowIndex(row);
      row++;
      if (row >= filas) {
        clearInterval(interval);
      }
    }, 800);
  };

  // ===== Handlers de Fase 3: Construir =====

  const handleBuildSelect = (num) => {
    if (gridConfig) return;
    setBuildBlocks(prev => {
      if (prev.length >= 2) {
        return [prev[1], num];
      }
      return [...prev, num];
    });
  };

  const handleBuildCheck = () => {
    if (buildBlocks.length !== 2 || !currentChallenge) return;
    const product = buildBlocks[0] * buildBlocks[1];

    if (product === currentChallenge.target) {
      setGridConfig({ rows: buildBlocks[0], cols: buildBlocks[1] });
      setMessage({ text: '¡Increible! Lo construiste perfecto.', type: 'success' });
      triggerConfetti();
    } else {
      setMessage({ text: `${buildBlocks[0]} x ${buildBlocks[1]} = ${product}, no es ${currentChallenge.target}. Intenta otra vez.`, type: 'error' });
      setBuildBlocks([]);
    }
  };

  const handleBuildClear = () => {
    setBuildBlocks([]);
    setMessage({ text: '', type: '' });
  };

  // ===== Navegación =====

  const goToPhase3 = () => {
    setPhase('construir');
    setMessage({ text: '', type: '' });
  };

  const nextChallenge = () => {
    if (currentChallengeIndex < retos.length - 1) {
      setCurrentChallengeIndex(prev => prev + 1);
    } else {
      setGameCompleted(true);
      if (onCompletar) onCompletar();
    }
  };

  // ===== Renderizado =====

  if (gameCompleted) {
    return (
      <div className="area-game-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 className="area-title">¡Felicidades, Maestro del Area!</h2>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Has completado todos los retos de area.</p>
        <button className="area-action-button" onClick={() => { setCurrentChallengeIndex(0); setGameCompleted(false); }}>
          Jugar de Nuevo
        </button>
      </div>
    );
  }

  if (!currentChallenge) return <div>Cargando reto...</div>;

  const { filas, columnas, target, esSquare, historia, unidad = 'cuadritos' } = currentChallenge;
  const blockColor = getNumberblockColor(columnas);

  return (
    <div className="area-game-container nb-game-container">
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

      {/* Indicador de fase */}
      <div className="area-phase-indicator">
        <div className={`area-phase-step ${phase === 'medir' ? 'active' : phase !== 'medir' ? 'completed' : ''}`}>
          1. Medir
        </div>
        <div className={`area-phase-step ${phase === 'calcular' ? 'active' : phase === 'construir' ? 'completed' : ''}`}>
          2. Calcular
        </div>
        <div className={`area-phase-step ${phase === 'construir' ? 'active' : ''}`}>
          3. Construir
        </div>
      </div>

      {/* Título */}
      <h1 className="area-title">
        Reto: Area de {target} {unidad}
        {esSquare && <span className="area-square-badge">Cuadrado</span>}
      </h1>

      {/* Historia */}
      <div className="area-story-bubble">
        <p>{historia}</p>
      </div>

      {/* ===== FASE 1: MEDIR ===== */}
      {phase === 'medir' && (
        <div className="area-phase-content" key="medir">
          <div className="area-instruction">
            {esSquare
              ? 'Cuenta los cuadritos de un lado y elige el Numberblock correcto'
              : measureStep === 'horizontal'
                ? '¿Cuantos cuadritos hay a lo ancho? Elige el Numberblock correcto'
                : '¿Cuantos cuadritos hay de arriba a abajo? Elige el Numberblock'
            }
          </div>

          {/* Grid con dimensiones */}
          <div className="area-grid-wrapper">
            <div className="area-grid-with-dims">
              {/* Flecha horizontal */}
              <div className="area-dim-horizontal">
                <span>&#8596;</span>
                <span className={`area-dim-value ${selectedWidth ? 'revealed' : ''}`}>
                  {selectedWidth || '?'}
                </span>
              </div>

              <div className="area-grid-row">
                {/* Flecha vertical */}
                <div className="area-dim-vertical">
                  <span>&#8597;</span>
                  <span className={`area-dim-value ${selectedHeight ? 'revealed' : ''}`}>
                    {selectedHeight || '?'}
                  </span>
                </div>

                {/* Grid */}
                <div className="area-predrawn-grid" style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
                  {[...Array(filas * columnas)].map((_, i) => (
                    <div key={i} className="area-grid-block" style={{ backgroundColor: blockColor }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje */}
          <div className={`area-message ${message.type}`}>{message.text}</div>

          {/* Toolbox */}
          <div className="nb-toolbox-section">
            <div className="nb-toolbox-title">Elige el Numberblock correcto</div>
            <div className="toolbox">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num =>
                renderNumberblock(num, handleMeasureSelect, [])
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== FASE 2: CALCULAR ===== */}
      {phase === 'calcular' && (
        <div className="area-phase-content" key="calcular">
          {/* Grid con dimensiones reveladas */}
          <div className="area-grid-wrapper">
            <div className="area-grid-with-dims">
              <div className="area-dim-horizontal">
                <span>&#8596;</span>
                <span className="area-dim-value revealed">{columnas}</span>
              </div>

              <div className="area-grid-row">
                <div className="area-dim-vertical">
                  <span>&#8597;</span>
                  <span className="area-dim-value revealed">{filas}</span>
                </div>

                {/* Grid con posible pista visual */}
                {showHint ? (
                  <div>
                    {[...Array(filas)].map((_, rowIdx) => (
                      <div key={rowIdx} className="area-hint-row">
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {[...Array(columnas)].map((_, colIdx) => (
                            <div
                              key={colIdx}
                              className={`area-grid-block ${rowIdx <= hintRowIndex ? 'area-highlight' : ''}`}
                              style={{ backgroundColor: blockColor }}
                            />
                          ))}
                        </div>
                        {rowIdx <= hintRowIndex && (
                          <span
                            className="area-hint-count"
                            style={{ animationDelay: `${rowIdx * 0.8}s` }}
                          >
                            {rowIdx === 0 ? columnas : `+ ${columnas} = ${columnas * (rowIdx + 1)}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="area-predrawn-grid" style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
                    {[...Array(filas * columnas)].map((_, i) => (
                      <div key={i} className="area-grid-block" style={{ backgroundColor: blockColor }} />
                    ))}
                  </div>
                )}
              </div>

              {showAreaLabel && (
                <div className="area-label-overlay">
                  Area = {target} {unidad}
                </div>
              )}
            </div>
          </div>

          {/* Ecuación */}
          <div className="area-equation-display">
            {esSquare ? (
              <>{columnas} <span style={{ color: '#e74c3c' }}>x</span> {columnas} <span style={{ color: '#e74c3c' }}>=</span> <span className="area-equation-blank">{areaInput || '?'}</span></>
            ) : (
              <>{columnas} <span style={{ color: '#e74c3c' }}>x</span> {filas} <span style={{ color: '#e74c3c' }}>=</span> <span className="area-equation-blank">{areaInput || '?'}</span></>
            )}
          </div>

          {/* Mensaje */}
          <div className={`area-message ${message.type}`}>{message.text}</div>

          {/* Teclado numérico o botón siguiente */}
          {!showAreaLabel ? (
            <div className="area-number-pad">
              <div className="area-number-display">{areaInput || '?'}</div>
              <div className="area-pad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                  <button
                    key={digit}
                    className="area-pad-btn"
                    onClick={() => areaInput.length < 3 && setAreaInput(prev => prev + String(digit))}
                  >
                    {digit}
                  </button>
                ))}
                <button className="area-pad-btn area-pad-delete" onClick={() => setAreaInput(prev => prev.slice(0, -1))}>
                  &#9003;
                </button>
                <button className="area-pad-btn area-pad-zero" onClick={() => areaInput.length > 0 && areaInput.length < 3 && setAreaInput(prev => prev + '0')}>
                  0
                </button>
                <button className="area-pad-btn" style={{ background: '#2ecc71', color: '#fff', fontSize: '1.2rem' }} onClick={handleAreaSubmit} disabled={!areaInput}>
                  &#10003;
                </button>
              </div>
            </div>
          ) : (
            <div className="area-action-area">
              <button className="area-action-button next" onClick={goToPhase3}>
                ¡Ahora Construyelo!
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== FASE 3: CONSTRUIR ===== */}
      {phase === 'construir' && (
        <div className="area-phase-content" key="construir">
          <div className="area-instruction">
            Elige 2 Numberblocks para construir un rectangulo de {target} {unidad}
          </div>

          {/* Ecuación */}
          <div className="area-equation-display">
            <span className="area-equation-blank">{buildBlocks[0] || '?'}</span>
            {' '}x{' '}
            <span className="area-equation-blank">{buildBlocks[1] || '?'}</span>
            {' '}={' '}{target}
          </div>

          {/* Zona de construcción */}
          <div className="area-construction-area">
            {gridConfig ? (
              <div className="rectangle-grid" style={{ gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)` }}>
                {[...Array(gridConfig.rows * gridConfig.cols)].map((_, i) => {
                  const colorIndex = i % buildBlocks.length;
                  const blockNumber = buildBlocks[colorIndex];
                  return (
                    <div
                      key={i}
                      className="block rectangle-block"
                      style={{
                        backgroundColor: getNumberblockColor(blockNumber),
                        animationDelay: `${i * 0.02}s`
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div style={{ color: '#999', fontStyle: 'italic' }}>Tu construccion aparecera aqui...</div>
            )}
          </div>

          {/* Mensaje */}
          <div className={`area-message ${message.type}`}>{message.text}</div>

          {/* Toolbox */}
          {!gridConfig && (
            <div className="nb-toolbox-section">
              <div className="nb-toolbox-title">Caja de Herramientas</div>
              <div className="toolbox">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num =>
                  renderNumberblock(num, handleBuildSelect, buildBlocks)
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="area-action-area">
            {!gridConfig ? (
              <>
                {buildBlocks.length > 0 && (
                  <button className="area-action-button" onClick={handleBuildClear}
                    style={{ background: 'linear-gradient(45deg, #95a5a6, #7f8c8d)', boxShadow: '0 4px 0 #5d6d7e' }}>
                    Limpiar
                  </button>
                )}
                <button className="area-action-button" onClick={handleBuildCheck} disabled={buildBlocks.length !== 2}>
                  Construir
                </button>
              </>
            ) : (
              <button className="area-action-button next" onClick={nextChallenge}>
                {currentChallengeIndex < retos.length - 1 ? 'Siguiente Reto' : '¡Terminar!'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaConstructor;
