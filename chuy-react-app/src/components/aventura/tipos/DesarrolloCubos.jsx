import React, { useState, useEffect } from 'react';
import './DesarrolloCubos.css';

const DesarrolloCubos = ({ 
  mision, 
  onCompletar, 
  modoSimulacro = false, 
  respuestaGuardada = '', 
  onRespuesta = null, 
  mostrarResultado: mostrarResultadoExterno = false 
}) => {
  const [seleccion, setSeleccion] = useState(respuestaGuardada || '');
  const [esCorrecto, setEsCorrecto] = useState(false);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);

  useEffect(() => {
    if (modoSimulacro && respuestaGuardada) {
      setSeleccion(respuestaGuardada);
    }
  }, [respuestaGuardada, modoSimulacro]);

  const caras = mision.datos_cubo.caras || [];
  const pregunta = mision.pregunta;

  // Tamaño de la celda en el SVG
  const CELL_SIZE = 80;
  const PADDING = 10;
  
  // Calcular dimensiones del SVG dinámicamente
  const maxFil = Math.max(...caras.map(c => c.fila)) + 1;
  const maxCol = Math.max(...caras.map(c => c.columna)) + 1;
  const width = maxCol * CELL_SIZE + (maxCol + 1) * PADDING;
  const height = maxFil * CELL_SIZE + (maxFil + 1) * PADDING;

  const handleSeleccion = (idCara) => {
    if (mostrarFeedback || mostrarResultadoExterno) return;
    setSeleccion(idCara);
    if (modoSimulacro && onRespuesta) {
      onRespuesta(idCara);
    }
  };

  const comprobarRespuesta = () => {
    if (!seleccion) return;
    const correcto = seleccion === mision.respuesta;
    setEsCorrecto(correcto);
    setMostrarFeedback(true);
    if (correcto && onCompletar) {
      setTimeout(() => onCompletar(), 1500);
    }
  };

  const handleReintentar = () => {
    setSeleccion('');
    setMostrarFeedback(false);
    setEsCorrecto(false);
  };

  const debeMostrarResultado = mostrarFeedback || (modoSimulacro && mostrarResultadoExterno);
  
  // En simulacro, verificar contra la respuesta guardada
  const esCorrectoCalculado = modoSimulacro 
    ? (seleccion === mision.respuesta)
    : esCorrecto;

  return (
    <div className="cubos-container">
      <h3 className="cubos-pregunta">{pregunta}</h3>

      <div className="svg-wrapper">
        <svg 
          width="100%" 
          viewBox={`0 0 ${width} ${height}`} 
          className="cubo-svg"
        >
          <defs>
            {/* Filtro para sombra suave (Clase Mundial) */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="2" dy="4" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {caras.map((cara) => {
            const x = cara.columna * (CELL_SIZE + PADDING) + PADDING;
            const y = cara.fila * (CELL_SIZE + PADDING) + PADDING;
            const isSelected = seleccion === cara.id;
            const isCorrect = debeMostrarResultado && cara.id === mision.respuesta;
            const isWrong = debeMostrarResultado && isSelected && !esCorrectoCalculado;

            // Estilo dinámico según estado
            let strokeColor = "white";
            let strokeWidth = "3";
            
            if (isSelected) {
              strokeColor = "#3498db"; // Azul selección
              strokeWidth = "6";
            }
            if (isCorrect) {
              strokeColor = "#2ecc71"; // Verde correcto
              strokeWidth = "8";
            }
            if (isWrong) {
              strokeColor = "#e74c3c"; // Rojo error
              strokeWidth = "8";
            }

            return (
              <g 
                key={cara.id} 
                onClick={() => handleSeleccion(cara.id)}
                style={{ cursor: debeMostrarResultado ? 'default' : 'pointer' }}
                className="cara-grupo"
              >
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx="12" // Bordes redondeados amigables
                  fill={cara.color}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  filter="url(#shadow)"
                  className="cara-rect"
                />
                <text
                  x={x + CELL_SIZE / 2}
                  y={y + CELL_SIZE / 2}
                  dy=".35em"
                  textAnchor="middle"
                  fontSize="40"
                  className="cara-icono"
                  style={{ pointerEvents: 'none', userSelect: 'none' }} 
                >
                  {cara.contenido}
                </text>
                
                {/* Indicador de selección (Check pequeño visual) */}
                {isSelected && !debeMostrarResultado && (
                  <circle cx={x + CELL_SIZE - 12} cy={y + 12} r="8" fill="#3498db" stroke="white" strokeWidth="2" />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="instruccion-seleccion">
        {debeMostrarResultado ? (
           <p className={`mensaje-resultado ${esCorrectoCalculado ? 'texto-verde' : 'texto-rojo'}`}>
             {esCorrectoCalculado ? mision.explicacion_correcta : mision.explicacion_incorrecta}
           </p>
        ) : (
           <p>👆 Toca la cara correcta en el dibujo</p>
        )}
      </div>

      {!modoSimulacro && (
        <div className="acciones-container">
          {!mostrarFeedback ? (
            <button 
              className="boton-enviar" 
              onClick={comprobarRespuesta}
              disabled={!seleccion}
            >
              Confirmar
            </button>
          ) : (
            !esCorrecto && (
              <button className="boton-reintentar" onClick={handleReintentar}>
                Intentar de Nuevo
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default DesarrolloCubos;

