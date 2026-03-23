import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Colorear.css';

/**
 * Colorear - Canvas con imagen de contorno como fondo.
 * El niño pinta encima con dedo/mouse.
 */
const Colorear = ({ mision, onCompletar }) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#e74c3c');
  const [lineWidth, setLineWidth] = useState(12);
  const [tool, setTool] = useState('brush'); // brush | eraser
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgError, setBgError] = useState(false);
  const bgImageRef = useRef(null);

  const coloresSugeridos = mision.colores_sugeridos || null;

  const coloresDefault = [
    { hex: '#e74c3c', name: 'Rojo' },
    { hex: '#e67e22', name: 'Naranja' },
    { hex: '#f1c40f', name: 'Amarillo' },
    { hex: '#2ecc71', name: 'Verde' },
    { hex: '#3498db', name: 'Azul' },
    { hex: '#9b59b6', name: 'Morado' },
    { hex: '#e91e63', name: 'Rosa' },
    { hex: '#795548', name: 'Cafe' },
    { hex: '#2c3e50', name: 'Negro' },
  ];

  const colores = coloresSugeridos
    ? coloresSugeridos.map(hex => ({ hex, name: '' }))
    : coloresDefault;

  const grosores = [
    { value: 6, label: 'Fino' },
    { value: 12, label: 'Medio' },
    { value: 24, label: 'Grueso' },
  ];

  // Load background image
  useEffect(() => {
    if (mision.imagen_contorno_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        bgImageRef.current = img;
        setBgLoaded(true);
      };
      img.onerror = () => setBgError(true);
      img.src = mision.imagen_contorno_url;
    } else {
      setBgLoaded(true); // No background needed
    }
  }, [mision.imagen_contorno_url]);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;

    const ctx = canvas.getContext('2d');

    // Draw background image if available
    if (bgImageRef.current) {
      const img = bgImageRef.current;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (bgLoaded) {
      initCanvas();
    }
  }, [bgLoaded, initCanvas]);

  useEffect(() => {
    const handleResize = () => {
      if (bgLoaded) initCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bgLoaded, initCanvas]);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 2;
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

  const clearCanvas = () => {
    initCanvas(); // Redraws background
  };

  if (!bgLoaded && !bgError) {
    return (
      <div className="colorear-container">
        <div className="colorear-loading">Cargando imagen...</div>
      </div>
    );
  }

  return (
    <div className="colorear-container">
      {/* Canvas */}
      <div className="colorear-canvas-wrapper" ref={wrapperRef}>
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

      {/* Toolbar */}
      <div className="colorear-toolbar">
        <div className="colorear-colores">
          {colores.map((c, i) => (
            <button
              key={i}
              className={`colorear-color-btn ${color === c.hex && tool === 'brush' ? 'active' : ''}`}
              style={{ backgroundColor: c.hex }}
              onClick={() => { setColor(c.hex); setTool('brush'); }}
              title={c.name}
            />
          ))}
          <button
            className={`colorear-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool(tool === 'eraser' ? 'brush' : 'eraser')}
            title="Borrador"
          >
            🧹
          </button>
        </div>

        <div className="colorear-grosores">
          {grosores.map((g) => (
            <button
              key={g.value}
              className={`colorear-grosor-btn ${lineWidth === g.value ? 'active' : ''}`}
              onClick={() => setLineWidth(g.value)}
            >
              <span className="colorear-grosor-dot" style={{ width: g.value, height: g.value }} />
            </button>
          ))}
        </div>

        <button className="colorear-limpiar-btn" onClick={clearCanvas}>
          🗑️ Limpiar
        </button>
      </div>

      <button className="colorear-terminar-btn" onClick={onCompletar}>
        ✨ Termine mi dibujo!
      </button>
    </div>
  );
};

export default Colorear;
