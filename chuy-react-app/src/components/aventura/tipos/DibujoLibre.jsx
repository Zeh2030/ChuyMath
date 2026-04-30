import React, { useRef, useState, useEffect, useCallback } from 'react';
import './DibujoLibre.css';
import { useAuth } from '../../../hooks/useAuth.jsx';
import { loadDibujo, saveDibujo, deleteDibujo } from '../../../utils/dibujoStorage';

/**
 * DibujoLibre - Canvas libre con imagen de referencia opcional y sugerencias.
 * Extiende la funcionalidad de LienzoDibujo con referencia visual.
 */
const DibujoLibre = ({ mision, onCompletar }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  const misionId = mision?.id;

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#2c3e50');
  const [lineWidth, setLineWidth] = useState(4);
  const [tool, setTool] = useState('brush');
  const [showRef, setShowRef] = useState(true);
  const [tieneGuardado, setTieneGuardado] = useState(false);

  const { imagen_referencia_url, sugerencias = [] } = mision;

  const colores = [
    { hex: '#2c3e50' }, { hex: '#e74c3c' }, { hex: '#e67e22' },
    { hex: '#f1c40f' }, { hex: '#2ecc71' }, { hex: '#3498db' },
    { hex: '#9b59b6' }, { hex: '#e91e63' }, { hex: '#795548' },
    { hex: '#ffffff' },
  ];

  const grosores = [
    { value: 2 }, { value: 5 }, { value: 10 },
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

    const saved = loadDibujo(userId, misionId);
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = saved;
      setTieneGuardado(true);
    } else {
      setTieneGuardado(false);
    }
  }, [userId, misionId]);

  useEffect(() => {
    const t = setTimeout(initCanvas, 50);
    return () => clearTimeout(t);
  }, [initCanvas]);

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

  // "Limpiar" descarta los trazos en pantalla pero conserva el dibujo guardado.
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleTerminar = () => {
    try {
      const dataURL = canvasRef.current?.toDataURL('image/png');
      if (dataURL) {
        const ok = saveDibujo(userId, misionId, dataURL);
        if (ok) setTieneGuardado(true);
      }
    } catch (e) {
      console.warn('No se pudo guardar el dibujo:', e);
    }
    onCompletar();
  };

  const handleBorrarGuardado = () => {
    deleteDibujo(userId, misionId);
    setTieneGuardado(false);
    clearCanvas();
  };

  return (
    <div className="dlibre-container">
      {/* Suggestions */}
      {sugerencias.length > 0 && (
        <div className="dlibre-sugerencias">
          {sugerencias.map((s, i) => (
            <span key={i} className="dlibre-sugerencia">💡 {s}</span>
          ))}
        </div>
      )}

      <div className="dlibre-workspace">
        {/* Reference image (collapsible) */}
        {imagen_referencia_url && (
          <div className={`dlibre-referencia ${showRef ? '' : 'collapsed'}`}>
            <button className="dlibre-ref-toggle" onClick={() => setShowRef(!showRef)}>
              {showRef ? '◀ Ocultar' : '▶ Ver referencia'}
            </button>
            {showRef && (
              <img src={imagen_referencia_url} alt="Referencia" className="dlibre-ref-img" />
            )}
          </div>
        )}

        {/* Canvas */}
        <div className="dlibre-canvas-area">
          <div className="dlibre-canvas-wrapper" ref={wrapperRef}>
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

      {/* Toolbar */}
      <div className="dlibre-toolbar">
        <div className="dlibre-colores">
          {colores.map((c, i) => (
            <button
              key={i}
              className={`dlibre-color-btn ${color === c.hex && tool === 'brush' ? 'active' : ''}`}
              style={{ backgroundColor: c.hex, border: c.hex === '#ffffff' ? '2px solid #ccc' : '2px solid white' }}
              onClick={() => { setColor(c.hex); setTool('brush'); }}
            />
          ))}
          <button
            className={`dlibre-eraser-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'eraser' ? 'brush' : 'eraser')}
          >
            🧹
          </button>
        </div>
        <div className="dlibre-grosores">
          {grosores.map((g) => (
            <button
              key={g.value}
              className={`dlibre-grosor-btn ${lineWidth === g.value ? 'active' : ''}`}
              onClick={() => setLineWidth(g.value)}
            >
              <span className="dlibre-grosor-dot" style={{ width: g.value * 2, height: g.value * 2 }} />
            </button>
          ))}
        </div>
        <button className="dlibre-limpiar-btn" onClick={clearCanvas}>🗑️ Limpiar</button>
        {tieneGuardado && (
          <button
            className="dlibre-borrar-guardado-btn"
            onClick={handleBorrarGuardado}
            title="Borrar el dibujo guardado de esta actividad"
          >
            🧽 Borrar guardado
          </button>
        )}
      </div>

      <button className="dlibre-terminar-btn" onClick={handleTerminar}>
        ✨ Termine mi dibujo!
      </button>
    </div>
  );
};

export default DibujoLibre;
