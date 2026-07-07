import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Colorear.css';
import { useAuth } from '../../../hooks/useAuth.jsx';
import { loadDibujo, saveDibujo, deleteDibujo } from '../../../utils/dibujoStorage';
import MezcladorLienzo from './MezcladorLienzo';

/**
 * Colorear - Dos capas: (1) un canvas de PINTURA donde el niño pinta; (2) el contorno
 * como imagen ENCIMA con `mix-blend-mode: multiply`, así las líneas negras se quedan
 * siempre visibles (la pintura pasa por debajo) y el borrador solo borra pintura.
 */
const Colorear = ({ mision, onCompletar }) => {
  const { activeProfileId } = useAuth();
  const userId = activeProfileId;
  const misionId = mision?.id;

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  // Flag de dibujo en un ref (no estado): se actualiza al instante, sin esperar
  // el re-render de React. Con estado, los trazos rapidos/cortos se perdian.
  const isDrawingRef = useRef(false);
  const [color, setColor] = useState('#e74c3c');
  const [lineWidth, setLineWidth] = useState(12);
  const [tool, setTool] = useState('brush'); // brush | eraser
  const [tieneGuardado, setTieneGuardado] = useState(false);
  const [coloresMezclados, setColoresMezclados] = useState([]);

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

  // Inicializa el canvas de PINTURA (fondo blanco + trazos guardados si hay).
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const saved = loadDibujo(userId, misionId);
    if (saved) {
      const savedImg = new Image();
      savedImg.onload = () => ctx.drawImage(savedImg, 0, 0, canvas.width, canvas.height);
      savedImg.src = saved;
      setTieneGuardado(true);
    } else {
      setTieneGuardado(false);
    }
  }, [userId, misionId]);

  useEffect(() => {
    const t = setTimeout(initCanvas, 50);
    return () => clearTimeout(t);
  }, [initCanvas]);

  useEffect(() => {
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

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
      // El borrador pinta de BLANCO (no destination-out): así solo tapa la pintura,
      // y el contorno (capa de arriba) nunca se ve afectado.
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = lineWidth * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    // Pinta un punto de inmediato: asi un toque simple (sin arrastrar) tambien marca.
    ctx.lineTo(x + 0.01, y + 0.01);
    ctx.stroke();
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      canvasRef.current.getContext('2d').closePath();
      isDrawingRef.current = false;
    }
  };

  // "Limpiar" descarta la pintura (rellena de blanco). El contorno es una capa
  // aparte encima, así que NO se borra.
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
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

  // Color creado en el mezclador del lienzo: lo activa como pincel y lo guarda
  // en la fila de colores mezclados para reutilizarlo.
  const usarColorMezclado = (hex) => {
    setColor(hex);
    setTool('brush');
    setColoresMezclados(prev => (prev.includes(hex) ? prev : [...prev, hex].slice(-6)));
  };

  return (
    <div className="colorear-container">
      {/* Canvas de pintura + contorno encima (multiply) */}
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
        {mision.imagen_contorno_url && (
          <img
            className="colorear-contorno"
            src={mision.imagen_contorno_url}
            alt=""
            draggable={false}
          />
        )}
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
          {coloresMezclados.map((hex, i) => (
            <button
              key={`mix-${i}`}
              className={`colorear-color-btn ${color === hex && tool === 'brush' ? 'active' : ''}`}
              style={{ backgroundColor: hex }}
              onClick={() => { setColor(hex); setTool('brush'); }}
              title="Color que mezclaste"
            />
          ))}
          <MezcladorLienzo onUsar={usarColorMezclado} />
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

        {tieneGuardado && (
          <button
            className="colorear-borrar-guardado-btn"
            onClick={handleBorrarGuardado}
            title="Borrar el dibujo guardado de esta actividad"
          >
            🧽 Borrar guardado
          </button>
        )}
      </div>

      <button className="colorear-terminar-btn" onClick={handleTerminar}>
        ✨ Termine mi dibujo!
      </button>
    </div>
  );
};

export default Colorear;
