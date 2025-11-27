import React, { useState, useEffect, useRef } from 'react';
import './NumberblocksConstructor.css';

const NumberblocksConstructor = ({ mision, onCompletar }) => {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [gridConfig, setGridConfig] = useState(null); // { rows, cols }
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const retos = mision.retos || [];
  const currentChallenge = retos[currentChallengeIndex];

  // Reiniciar estado al cambiar de reto
  useEffect(() => {
    setSelectedBlocks([]);
    setGridConfig(null);
    setMessage({ text: '', type: '' });
    setShowConfetti(false);
  }, [currentChallengeIndex]);

  const handleSelectBlock = (number) => {
    if (!currentChallenge || gridConfig) return; // Si ya construyó, no dejar seleccionar

    const maxSelection = currentChallenge.tipo === 'multiply' ? 2 : 1;
    
    setSelectedBlocks(prev => {
      // Si ya está seleccionado
      if (prev.includes(number)) {
        // Si es multiplicación y es el único seleccionado y es el mismo número (ej. 6x6), permitir doble selección visual si se quisiera,
        // pero para simplificar la lógica de React: si ya está, lo quitamos, a menos que necesitemos dos iguales.
        // Lógica simplificada: toggle
        return prev.filter(n => n !== number);
      } else {
        if (prev.length < maxSelection) {
          return [...prev, number];
        } else {
          // Reemplazar el último si ya está lleno (experiencia más fluida)
          return [...prev.slice(0, maxSelection - 1), number];
        }
      }
    });
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
      // Pequeña animación de error (shake) podría ir aquí
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

  // Renderizado de un bloque individual (Numberblock)
  const renderNumberblock = (num) => {
    const isSelected = selectedBlocks.includes(num);
    // Lógica visual para formas especiales
    let shapeClass = '';
    let blocks = [];
    
    // Configuración de colores y estructura
    if (num === 9) {
      shapeClass = 'nb-9-shape';
      const nineColors = ['--nb-9-3', '--nb-9-2', '--nb-9-1'];
      for (let i = 0; i < 9; i++) {
        blocks.push(
          <div 
            key={i} 
            className="nb-block" 
            style={{ backgroundColor: `var(${nineColors[Math.floor(i/3)]})` }}
          >
            {i === 8 && <Face />}
          </div>
        );
      }
    } else if (num === 12) {
      shapeClass = 'nb-12-shape';
      for (let i = 0; i < 12; i++) {
        const isCenter = [4, 7].includes(i);
        blocks.push(
          <div 
            key={i} 
            className={`nb-block ${isCenter ? 'c12-center' : 'c12'}`}
            style={{ 
              backgroundColor: isCenter ? 'var(--nb-12-center)' : 'var(--nb-12-main)',
              borderColor: 'var(--nb-12-border)'
            }}
          >
            {i === 7 && <Face />}
          </div>
        );
      }
    } else {
      // Estándar (apilados)
      const sevenColors = ['--nb-7-1', '--nb-7-2', '--nb-7-3', '--nb-7-4', '--nb-7-5', '--nb-7-6', '--nb-7-7'];
      for (let i = 0; i < num; i++) {
        let style = {};
        if (num === 7) style.backgroundColor = `var(${sevenColors[i]})`;
        
        blocks.push(
          <div key={i} className={`nb-block c${num}`} style={style}>
            {i === num - 1 && <Face />}
          </div>
        );
      }
    }

    return (
      <div 
        key={num}
        className={`numberblock ${isSelected ? 'selected' : ''} ${shapeClass}`}
        onClick={() => handleSelectBlock(num)}
      >
        {blocks}
      </div>
    );
  };

  const Face = () => (
    <div className="nb-face-container">
      <div className="nb-eye"></div>
      <div className="nb-eye"></div>
    </div>
  );

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
            className="nb-rectangle-grid"
            style={{ 
              gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
              width: `${gridConfig.cols * 25}px`
            }}
          >
            {[...Array(gridConfig.rows * gridConfig.cols)].map((_, i) => (
              <div 
                key={i} 
                className={`nb-block c${gridConfig.rows * gridConfig.cols}`}
                style={{ animation: `pop-in 0.3s ease-out ${i * 0.01}s forwards`, opacity: 0 }}
              />
            ))}
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
        <div className="nb-toolbox">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map(num => renderNumberblock(num))}
        </div>
      </div>

      <div className="nb-action-area">
        {!gridConfig ? (
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

