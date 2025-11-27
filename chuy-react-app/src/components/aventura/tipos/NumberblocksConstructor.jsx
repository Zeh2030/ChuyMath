import React, { useState, useEffect } from 'react';
import './NumberblocksConstructor.css';

const NumberblocksConstructor = ({ mision, onCompletar }) => {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [gridConfig, setGridConfig] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const retos = mision.retos || [];
  const currentChallenge = retos[currentChallengeIndex];

  useEffect(() => {
    setSelectedBlocks([]);
    setGridConfig(null);
    setMessage({ text: '', type: '' });
    setShowConfetti(false);
  }, [currentChallengeIndex]);

  const handleSelectBlock = (number) => {
    if (!currentChallenge || gridConfig) return;
    const maxSelection = currentChallenge.tipo === 'multiply' ? 2 : 1;
    
    setSelectedBlocks(prev => {
      if (prev.length >= maxSelection) {
        return [...prev.slice(0, maxSelection - 1), number];
      } else {
        return [...prev, number];
      }
    });
  };

  const limpiarSeleccion = () => {
    setSelectedBlocks([]);
  };

  const checkAnswer = () => {
    if (!currentChallenge) return;
    let isCorrect = false;
    let rows = 0;
    let cols = 0;

    if (currentChallenge.tipo === 'multiply' && selectedBlocks.length === 2) {
      const product = selectedBlocks[0] * selectedBlocks[1];
      if (product === currentChallenge.target) {
        isCorrect = true;
        rows = selectedBlocks[0];
        cols = selectedBlocks[1];
      }
    } else if (currentChallenge.tipo === 'divide' && selectedBlocks.length === 1) {
      const product = currentChallenge.dado * selectedBlocks[0];
      if (product === currentChallenge.target) {
        isCorrect = true;
        rows = currentChallenge.dado;
        cols = selectedBlocks[0];
      }
    }

    if (isCorrect) {
      setMessage({ text: '¡Fantástico! ¡Rectángulo construido!', type: 'success' });
      setGridConfig({ rows, cols });
      triggerConfetti();
    } else {
      setMessage({ text: 'Oh, oh... Esos bloques no funcionan. ¡Intenta otra vez!', type: 'error' });
    }
  };

  const nextChallenge = () => {
    if (currentChallengeIndex < retos.length - 1) {
      setCurrentChallengeIndex(prev => prev + 1);
    } else {
      setGameCompleted(true);
      if (onCompletar) onCompletar();
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const getNumberblockColor = (num) => {
    const colors = {
      1: '#e53935', 2: '#fb8c00', 3: '#fdd835', 4: '#43a047',
      5: '#1e88e5', 6: '#8e24aa', 7: '#673ab7', 8: '#ec407a',
      9: '#e0e0e0', 10: '#ffffff', 11: '#e53935', 12: '#fb8c00'
    };
    return colors[num] || '#95a5a6';
  };

  // Componente Face - exactamente como el original
  const Face = ({ singleEye = false }) => (
    <div className="face-container">
      <div className="eye"></div>
      {!singleEye && <div className="eye"></div>}
    </div>
  );

  // Renderizado de Numberblock - traducción EXACTA del código original
  const renderNumberblock = (num) => {
    const isSelected = selectedBlocks.includes(num);
    
    if (num === 9) {
      // 9 es un grid 3x3 con grises
      const nineColors = ['--nb-9-3', '--nb-9-2', '--nb-9-1'];
      return (
        <div 
          key={num}
          className={`numberblock has-face nb-9-shape ${isSelected ? 'selected' : ''}`}
          onClick={() => handleSelectBlock(num)}
        >
          {[...Array(9)].map((_, i) => (
            <div 
              key={i} 
              className="block"
              style={{ backgroundColor: `var(${nineColors[Math.floor(i/3)]})` }}
            >
              {i === 8 && <Face />}
            </div>
          ))}
        </div>
      );
    }
    
    if (num === 11) {
      // 11 tiene dos piernas: izquierda 5 bloques, derecha 6 bloques
      return (
        <div 
          key={num}
          className={`numberblock has-face nb-11-shape ${isSelected ? 'selected' : ''}`}
          onClick={() => handleSelectBlock(num)}
        >
          {/* Pierna izquierda: 5 bloques blancos */}
          <div className="stack">
            {[...Array(5)].map((_, i) => (
              <div key={`left-${i}`} className="block white-block">
                {i === 0 && <Face singleEye={true} />}
              </div>
            ))}
          </div>
          {/* Pierna derecha: 5 blancos + 1 rojo */}
          <div className="stack">
            {[...Array(6)].map((_, i) => (
              <div 
                key={`right-${i}`} 
                className={`block ${i === 5 ? 'red-block' : 'white-block'}`}
              >
                {i === 0 && <Face singleEye={true} />}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (num === 12) {
      // 12 es un grid 3x4
      const centralIndices = [4, 7];
      return (
        <div 
          key={num}
          className={`numberblock has-face nb-12-shape ${isSelected ? 'selected' : ''}`}
          onClick={() => handleSelectBlock(num)}
        >
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="block"
              style={{ 
                backgroundColor: centralIndices.includes(i) ? 'var(--nb-12-center)' : 'var(--nb-12-main)',
                borderColor: 'var(--nb-12-border)'
              }}
            >
              {i === 7 && <Face />}
            </div>
          ))}
        </div>
      );
    }
    
    // Números 1-8, 10: apilados verticalmente
    const sevenColors = ['--nb-7-1', '--nb-7-2', '--nb-7-3', '--nb-7-4', '--nb-7-5', '--nb-7-6', '--nb-7-7'];
    
    return (
      <div 
        key={num}
        className={`numberblock has-face ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelectBlock(num)}
      >
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

  if (gameCompleted) {
    return (
      <div className="nb-game-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2 className="nb-title">🎉 ¡Felicidades, Constructor Maestro!</h2>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>Has completado todos los retos de construcción.</p>
        <button className="nb-action-button" onClick={() => window.location.reload()}>
          Jugar de Nuevo
        </button>
      </div>
    );
  }

  if (!currentChallenge) return <div>Cargando reto...</div>;

  return (
    <div className="nb-game-container">
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
              }}
            />
          ))}
        </div>
      )}

      <div className="nb-header">
        <h1 className="nb-title">Reto: El Numberblock {currentChallenge.target}</h1>
      </div>

      <div className="nb-story-bubble">
        <p>{currentChallenge.historia}</p>
      </div>

      <div className="nb-equation-display">
        {currentChallenge.tipo === 'multiply' ? (
          <>
            <span className="nb-placeholder">{selectedBlocks[0] || '?'}</span> 
            {' × '} 
            <span className="nb-placeholder">{selectedBlocks[1] || '?'}</span> 
            {' = '}{currentChallenge.target}
          </>
        ) : (
          <>
            {currentChallenge.dado} 
            {' × '} 
            <span className="nb-placeholder">{selectedBlocks[0] || '?'}</span> 
            {' = '}{currentChallenge.target}
          </>
        )}
      </div>

      <div className="nb-construction-area">
        {gridConfig ? (
          <div 
            className="rectangle-grid"
            style={{ gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)` }}
          >
            {[...Array(gridConfig.rows * gridConfig.cols)].map((_, i) => {
              const colorIndex = i % selectedBlocks.length;
              const blockNumber = selectedBlocks[colorIndex];
              const blockColor = getNumberblockColor(blockNumber);
              
              return (
                <div 
                  key={i} 
                  className="block rectangle-block"
                  style={{ 
                    backgroundColor: blockColor,
                    animationDelay: `${i * 0.02}s`
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div style={{ color: '#999', fontStyle: 'italic' }}>Tu construcción aparecerá aquí...</div>
        )}
      </div>

      <div className="nb-message-area" style={{ color: message.type === 'success' ? '#2ecc71' : '#e74c3c' }}>
        {message.text}
      </div>

      <div className="nb-toolbox-section">
        <div className="nb-toolbox-title">Caja de Herramientas</div>
        <div className="toolbox">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => renderNumberblock(num))}
        </div>
      </div>

      <div className="nb-action-area">
        {!gridConfig ? (
          <>
            {selectedBlocks.length > 0 && (
              <button 
                className="nb-action-button nb-clear-button" 
                onClick={limpiarSeleccion}
                style={{ background: 'linear-gradient(45deg, #95a5a6, #7f8c8d)', boxShadow: '0 4px 0 #5d6d7e' }}
              >
                🔄 Limpiar
              </button>
            )}
            <button 
              className="nb-action-button" 
              onClick={checkAnswer}
              disabled={
                (currentChallenge.tipo === 'multiply' && selectedBlocks.length !== 2) ||
                (currentChallenge.tipo === 'divide' && selectedBlocks.length !== 1)
              }
            >
              Construir
            </button>
          </>
        ) : (
          <button className="nb-action-button next" onClick={nextChallenge}>
            Siguiente Reto
          </button>
        )}
      </div>
    </div>
  );
};

export default NumberblocksConstructor;
