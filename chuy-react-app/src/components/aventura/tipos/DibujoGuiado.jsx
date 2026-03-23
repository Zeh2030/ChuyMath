import React, { useRef, useState, useEffect, useCallback } from 'react';
import './DibujoGuiado.css';

/**
 * DibujoGuiado - Tutorial paso a paso con imagen de referencia + canvas para dibujar.
 * Wizard: Intro → Paso 1..N (imagen + canvas) → Resultado final
 */
const DibujoGuiado = ({ mision, onCompletar }) => {
  const [fase, setFase] = useState('intro'); // intro | pasos | fin
  const [pasoActual, setPasoActual] = useState(0);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#2c3e50');
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState('brush');

  const { pasos = [], imagen_final_url } = mision;

  const colores = [
    { hex: '#2c3e50', name: 'Negro' },
    { hex: '#e74c3c', name: 'Rojo' },
    { hex: '#e67e22', name: 'Naranja' },
    { hex: '#f1c40f', name: 'Amarillo' },
    { hex: '#2ecc71', name: 'Verde' },
    { hex: '#3498db', name: 'Azul' },
    { hex: '#9b59b6', name: 'Morado' },
    { hex: '#795548', name: 'Cafe' },
  ];

  const grosores = [
    { value: 2, label: 'Fino' },
    { value: 4, label: 'Medio' },
    { value: 8, label: 'Grueso' },
  ];

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (fase === 'pasos') {
      // Small delay to let DOM render
      const t = setTimeout(initCanvas, 50);
      return () => clearTimeout(t);
    }
  }, [fase, initCanvas]);

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.changedTouches?.[0];
    return {
      x: (touch ? touch.clientX : e.clientX) - rect.left,
      y: (touch ? touch.clientY : e.clientY) - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      canvasRef.current.getContext('2d').closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => initCanvas();

  // === INTRO ===
  if (fase === 'intro') {
    return (
      <div className="dguiado-container">
        <div className="dguiado-intro">
          <div className="dguiado-intro-emoji">{mision.emoji || '🎨'}</div>
          <h2>{mision.titulo}</h2>
          <p className="dguiado-intro-desc">{mision.instruccion}</p>
          {imagen_final_url && (
            <div className="dguiado-preview">
              <p className="dguiado-preview-label">Asi se vera al final:</p>
              <img src={imagen_final_url} alt="Resultado final" className="dguiado-preview-img" />
            </div>
          )}
          <p className="dguiado-intro-pasos">{pasos.length} pasos para completar</p>
          <button className="dguiado-btn-principal" onClick={() => setFase('pasos')}>
            Empezar a dibujar!
          </button>
        </div>
      </div>
    );
  }

  // === FIN ===
  if (fase === 'fin') {
    return (
      <div className="dguiado-container">
        <div className="dguiado-fin">
          <div className="dguiado-fin-emoji">🎉</div>
          <h2>Dibujo terminado!</h2>
          {imagen_final_url && (
            <div className="dguiado-comparar">
              <div className="dguiado-comparar-item">
                <p>Modelo</p>
                <img src={imagen_final_url} alt="Modelo" />
              </div>
            </div>
          )}
          <button className="dguiado-btn-principal" onClick={onCompletar}>
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // === PASOS ===
  const paso = pasos[pasoActual];

  return (
    <div className="dguiado-container">
      {/* Step header */}
      <div className="dguiado-step-header">
        <span className="dguiado-step-num">Paso {pasoActual + 1} de {pasos.length}</span>
        <p className="dguiado-step-instruccion">{paso.instruccion}</p>
      </div>

      {/* Main area: reference + canvas */}
      <div className="dguiado-workspace">
        {/* Reference image */}
        {paso.imagen_url && (
          <div className="dguiado-referencia">
            <img src={paso.imagen_url} alt={`Paso ${pasoActual + 1}`} />
          </div>
        )}

        {/* Canvas */}
        <div className="dguiado-canvas-area">
          <div className="dguiado-canvas-wrapper" ref={wrapperRef}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="dguiado-toolbar">
        <div className="dguiado-colores">
          {colores.map((c, i) => (
            <button
              key={i}
              className={`dguiado-color-btn ${color === c.hex && tool === 'brush' ? 'active' : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => { setColor(c.hex); setTool('brush'); }}
            />
          ))}
          <button
            className={`dguiado-eraser-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'eraser' ? 'brush' : 'eraser')}
          >
            🧹
          </button>
        </div>
        <div className="dguiado-grosores">
          {grosores.map((g) => (
            <button
              key={g.value}
              className={`dguiado-grosor-btn ${lineWidth === g.value ? 'active' : ''}`}
              onClick={() => setLineWidth(g.value)}
            >
              <span className="dguiado-grosor-dot" style={{ width: g.value * 2, height: g.value * 2 }} />
            </button>
          ))}
        </div>
        <button className="dguiado-limpiar-btn" onClick={clearCanvas}>🗑️</button>
      </div>

      {/* Navigation */}
      <div className="dguiado-nav">
        <button
          className="dguiado-nav-btn"
          disabled={pasoActual === 0}
          onClick={() => setPasoActual(pasoActual - 1)}
        >
          ← Anterior
        </button>
        {pasoActual < pasos.length - 1 ? (
          <button
            className="dguiado-nav-btn dguiado-nav-next"
            onClick={() => setPasoActual(pasoActual + 1)}
          >
            Siguiente →
          </button>
        ) : (
          <button
            className="dguiado-btn-principal"
            onClick={() => setFase('fin')}
          >
            Termine!
          </button>
        )}
      </div>
    </div>
  );
};

export default DibujoGuiado;
