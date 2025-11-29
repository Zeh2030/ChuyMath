import React, { useState, useEffect } from 'react';
import './Kakooma.css';

const Kakooma = ({ mision, onCompletar }) => {
  const [seleccionados, setSeleccionados] = useState([]);
  const [estadoJuego, setEstadoJuego] = useState('jugando'); // jugando, correcto, incorrecto
  const [mensaje, setMensaje] = useState('Toca dos números que sumados den el objetivo');

  // Datos del juego
  // Si no vienen opciones, generamos algunas por defecto (esto es fallback)
  const objetivo = mision.objetivo || 8;
  const numeros = mision.numeros || [2, 6, 3, 4, 1, 5]; 

  useEffect(() => {
    setSeleccionados([]);
    setEstadoJuego('jugando');
    setMensaje('Toca dos números que sumados den el objetivo');
  }, [mision]);

  const handleSeleccion = (numero, index) => {
    if (estadoJuego === 'correcto') return;

    // Si ya está seleccionado, deseleccionar
    if (seleccionados.find(s => s.index === index)) {
      setSeleccionados(prev => prev.filter(s => s.index !== index));
      return;
    }

    // Si hay menos de 2 seleccionados, agregar
    if (seleccionados.length < 2) {
      const nuevaSeleccion = [...seleccionados, { numero, index }];
      setSeleccionados(nuevaSeleccion);

      // Si completamos el par, verificar inmediatamente
      if (nuevaSeleccion.length === 2) {
        verificarPar(nuevaSeleccion);
      }
    }
  };

  const verificarPar = (par) => {
    const suma = par[0].numero + par[1].numero;
    
    if (suma === objetivo) {
      setEstadoJuego('correcto');
      setMensaje(`¡Excelente! ${par[0].numero} + ${par[1].numero} = ${objetivo}`);
      if (onCompletar) {
        // No avanzar automático, dejar que celebren
        // Pero mostrar botón continuar (manejado por padre si detecta estado completado? 
        // No, aquí debo llamar onCompletar y el padre muestra botón)
        // Como eliminamos timeouts, llamamos onCompletar y mostramos botón local
        // Espera, la lógica global es que el padre muestra botón? No, el componente hijo muestra botón.
      }
    } else {
      setEstadoJuego('incorrecto');
      setMensaje(`Ups: ${par[0].numero} + ${par[1].numero} = ${suma}. ¡Intenta otro par!`);
      
      // Resetear selección después de un momento
      setTimeout(() => {
        setSeleccionados([]);
        setEstadoJuego('jugando');
        setMensaje('Intenta de nuevo');
      }, 1500);
    }
  };

  // Posicionar nodos en círculo (radio aprox 120px)
  const radio = 120;
  
  return (
    <div className="kakooma-container">
      <div className="kakooma-feedback">
        <span className={`feedback-msg ${estadoJuego === 'correcto' ? 'success' : estadoJuego === 'incorrecto' ? 'error' : ''}`}>
          {mensaje}
        </span>
      </div>

      <div className="kakooma-tablero">
        {/* Centro (Objetivo) */}
        <div className="kakooma-centro">
          <span>Objetivo</span>
          <strong>{objetivo}</strong>
        </div>

        {/* Nodos Periféricos */}
        {numeros.map((num, idx) => {
          const angle = (idx / numeros.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radio;
          const y = Math.sin(angle) * radio;
          
          const esSeleccionado = seleccionados.find(s => s.index === idx);
          
          let claseExtra = '';
          if (esSeleccionado) {
            claseExtra = 'seleccionado';
            if (estadoJuego === 'correcto') claseExtra += ' correcto';
            if (estadoJuego === 'incorrecto' && seleccionados.length === 2) claseExtra += ' incorrecto';
          }

          return (
            <div
              key={idx}
              className={`kakooma-nodo ${claseExtra}`}
              style={{
                transform: `translate(${x}px, ${y}px)` // Usar translate desde el centro
              }}
              onClick={() => handleSeleccion(num, idx)}
            >
              {num}
            </div>
          );
        })}
      </div>

      {estadoJuego === 'correcto' && (
        <button 
          className="boton-continuar" 
          onClick={() => onCompletar && onCompletar()}
          style={{ marginTop: '20px' }}
        >
          Continuar ➜
        </button>
      )}
    </div>
  );
};

export default Kakooma;

