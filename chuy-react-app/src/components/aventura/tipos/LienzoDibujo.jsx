import React, { useRef, useState, useEffect } from 'react';
import './LienzoDibujo.css';

const LienzoDibujo = ({ mision, onCompletar }) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#e74c3c'); // Rojo por defecto
  const [lineWidth, setLineWidth] = useState(5);

  // Colores disponibles
  const colores = [
    { id: 'red', hex: '#e74c3c' },
    { id: 'blue', hex: '#3498db' },
    { id: 'yellow', hex: '#f1c40f' },
    { id: 'green', hex: '#2ecc71' },
    { id: 'purple', hex: '#9b59b6' },
    { id: 'black', hex: '#2c3e50' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Función para ajustar tamaño
    const resizeCanvas = () => {
      if (wrapperRef.current && canvas) {
        // Guardar contenido actual antes de redimensionar
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        // Redimensionar
        canvas.width = wrapperRef.current.clientWidth;
        canvas.height = wrapperRef.current.clientHeight;
        
        // Restaurar contexto
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        // Restaurar contenido (opcional, puede deformarse, pero mejor que borrar)
        // Por simplicidad, al redimensionar (girar pantalla) se limpia o se mantiene.
        // Aquí re-aplicamos estilos de dibujo
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Inicializar estilos
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Actualizar contexto cuando cambia color
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevenir scroll en móviles
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { offsetX, offsetY } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { offsetX, offsetY } = getCoordinates(e);
    
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleTerminar = () => {
    // Aquí podríamos guardar la imagen con canvas.toDataURL() si quisiéramos
    if(onCompletar) onCompletar();
  };

  return (
    <div className="lienzo-container">
      <h3 className="instruccion-dibujo">
        {mision.instruccion || "Dibuja para resolver el reto"}
      </h3>
      {mision.operacion_texto && (
        <h2 style={{ fontSize: '2rem', margin: '0 0 15px 0', fontFamily: 'Fredoka, sans-serif' }}>
          {mision.operacion_texto}
        </h2>
      )}
      
      <div className="canvas-wrapper" ref={wrapperRef}>
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

      <div className="herramientas-dibujo">
        {colores.map((c) => (
          <div
            key={c.id}
            className={`color-btn bg-${c.id} ${color === c.hex ? 'activo' : ''}`}
            onClick={() => setColor(c.hex)}
            title={c.id}
          />
        ))}
        
        <div style={{ width: '1px', height: '30px', background: '#ecf0f1', margin: '0 10px' }}></div>

        <button className="accion-btn limpiar-btn" onClick={clearCanvas}>
          🗑️ Limpiar
        </button>
      </div>

      <button className="accion-btn terminar-btn" onClick={handleTerminar}>
        ✨ ¡Terminé mi Dibujo!
      </button>
    </div>
  );
};

export default LienzoDibujo;

