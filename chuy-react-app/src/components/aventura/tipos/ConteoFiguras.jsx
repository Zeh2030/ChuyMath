import React, { useState, useRef } from 'react';
import './ConteoFiguras.css';

/**
 * Componente para misiones de conteo de figuras.
 * Muestra una imagen y permite al usuario:
 * 1. Hacer clic en la imagen para poner marcadores (ayuda visual para contar).
 * 2. Ingresar el número total de figuras encontradas.
 * 
 * @param {Object} mision - Datos de la misión (imagen, respuesta correcta, etc.)
 * @param {Function} onCompletar - Callback al terminar
 */
const ConteoFiguras = ({ mision, onCompletar }) => {
  const [marcadores, setMarcadores] = useState([]); // Lista de {x, y} para los puntos
  const [respuestaUsuario, setRespuestaUsuario] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [esCorrecto, setEsCorrecto] = useState(false);
  const imagenRef = useRef(null);

  // Extraer datos - manejar tanto misiones con ejercicios como ejercicios directos
  const ejercicio = mision.ejercicios?.[0] || mision; // Si es una misión con ejercicios, tomar el primero
  const imagenUrl = ejercicio.figura_svg || ejercicio.imagen || ejercicio.imagen_url; // Soporte para todos los nombres
  const respuestaCorrecta = parseInt(ejercicio.respuesta || ejercicio.cantidad_correcta);
  const pregunta = ejercicio.pregunta || "¿Cuántas figuras ves?";

  // DEBUG: Ver qué respuesta espera el sistema
  console.log('Misión Conteo:', {
    titulo: ejercicio.titulo || mision.titulo,
    respuestaEsperada: respuestaCorrecta,
    respuestaRaw: ejercicio.respuesta || ejercicio.cantidad_correcta
  });

  // SVG por defecto para Triángulos (si no viene imagen)
  const svgTriangulos = `
    <svg viewBox="0 0 400 300" style="background-color: #f0f8ff;">
      <!-- Triángulos grandes -->
      <polygon points="200,20 100,200 300,200" fill="#3498db" stroke="#2980b9" stroke-width="3"/>
      <polygon points="100,200 50,280 150,280" fill="#e74c3c" stroke="#c0392b" stroke-width="3"/>
      <polygon points="300,200 250,280 350,280" fill="#2ecc71" stroke="#27ae60" stroke-width="3"/>
      
      <!-- Triángulos pequeños/escondidos -->
      <polygon points="200,50 180,90 220,90" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
      <polygon points="200,120 150,200 250,200" fill="none" stroke="white" stroke-width="2" stroke-dasharray="5,5"/>
    </svg>
  `;

  // Manejar clic en la imagen para agregar/quitar marcadores
  const handleImagenClick = (e) => {
    if (esCorrecto) return; // No editar si ya ganó

    const rect = imagenRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Porcentaje X
    const y = ((e.clientY - rect.top) / rect.height) * 100; // Porcentaje Y

    // Agregar nuevo marcador con el número siguiente
    const nuevoMarcador = {
      id: Date.now(),
      numero: marcadores.length + 1,
      x,
      y
    };

    setMarcadores([...marcadores, nuevoMarcador]);
  };

  // Borrar el último marcador (deshacer)
  const deshacerUltimo = () => {
    if (marcadores.length === 0) return;
    setMarcadores(marcadores.slice(0, -1));
  };

  // Borrar todos
  const borrarTodos = () => {
    setMarcadores([]);
  };

  // Verificar respuesta
  const verificarRespuesta = () => {
    const valor = parseInt(respuestaUsuario);
    
    if (isNaN(valor)) {
      setMensaje({ tipo: 'error', texto: 'Por favor escribe un número.' });
      return;
    }

    if (valor === respuestaCorrecta) {
      setEsCorrecto(true);
      setMensaje({ tipo: 'exito', texto: '¡Correcto! Has encontrado todas las figuras.' });
      setTimeout(onCompletar, 2000);
    } else {
      // Feedback específico
      if (valor < respuestaCorrecta) {
        setMensaje({ tipo: 'error', texto: 'Te faltan algunas. ¡Sigue buscando!' });
      } else {
        setMensaje({ tipo: 'error', texto: 'Te pasaste. Cuenta con cuidado.' });
      }
    }
  };

  // Determinar qué imagen mostrar
  let contenidoImagen = null;
  if (imagenUrl && !imagenUrl.startsWith('<svg')) {
    contenidoImagen = <img src={imagenUrl} alt="Figura para contar" className="imagen-conteo" />;
  } else {
    // Si es SVG o no hay imagen
    let svgHtml = imagenUrl;
    if (!svgHtml) {
      // Si no hay imagen, tratamos de inferir por el título
      if (pregunta.toLowerCase().includes('triángulo') || (mision.titulo || '').toLowerCase().includes('triángulo')) {
        svgHtml = svgTriangulos;
      } else {
        svgHtml = '<svg viewBox="0 0 200 200"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">Sin Imagen</text></svg>';
      }
    }
    contenidoImagen = <div className="svg-contenedor" dangerouslySetInnerHTML={{ __html: svgHtml }} />;
  }

  return (
    <div className="conteo-figuras-container">
      <div className="conteo-instrucciones">
        <h3>{pregunta}</h3>
        <p className="tip-ayuda">💡 Tip: Haz clic sobre las figuras para marcarlas y contarlas.</p>
      </div>

      {/* Área de Imagen Interactiva */}
      <div className="imagen-area-wrapper">
        <div className="imagen-contenedor" ref={imagenRef} onClick={handleImagenClick}>
            {contenidoImagen}

            {/* Marcadores superpuestos */}
            {marcadores.map((m) => (
                <div 
                key={m.id}
                className="marcador-conteo"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                >
                {m.numero}
                </div>
            ))}
        </div>
      </div>

      {/* Controles de Marcadores */}
      <div className="controles-marcadores">
        <button className="btn-mini" onClick={deshacerUltimo} disabled={marcadores.length === 0}>
          ↩ Deshacer
        </button>
        <button className="btn-mini" onClick={borrarTodos} disabled={marcadores.length === 0}>
          🗑️ Borrar marcas
        </button>
      </div>

      {/* Área de Respuesta */}
      <div className="respuesta-area">
        <label>Hay en total:</label>
        <div className="input-grupo">
            <input 
                type="number" 
                value={respuestaUsuario}
                onChange={(e) => setRespuestaUsuario(e.target.value)}
                placeholder="0"
                className="input-conteo"
                disabled={esCorrecto}
                onKeyDown={(e) => e.key === 'Enter' && verificarRespuesta()}
            />
            <button 
                className="btn-verificar"
                onClick={verificarRespuesta}
                disabled={esCorrecto || respuestaUsuario === ''}
            >
                Comprobar
            </button>
        </div>
      </div>

      {/* Mensajes de Feedback */}
      {mensaje && (
        <div className={`mensaje-feedback ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}
    </div>
  );
};

export default ConteoFiguras;
