import React, { useState, useEffect } from 'react';
import './TablaDobleEntrada.css';

/**
 * Componente para misiones de tabla de doble entrada (lógica).
 * Permite al usuario marcar celdas en una matriz para resolver un puzzle lógico.
 * 
 * @param {Object} mision - El objeto de la misión con configuración de la tabla y pistas
 * @param {Function} onCompletar - Callback que se ejecuta cuando se responde correctamente
 */
const TablaDobleEntrada = ({ mision, onCompletar }) => {
  // Estado de la matriz de respuestas: un objeto donde las claves son "fila-columna" y los valores el estado
  // Estados posibles: null (vacío), true (marcado/check), false (tachado/cruz)
  const [matrizRespuestas, setMatrizRespuestas] = useState({});
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);

  const filas = mision.filas || [];
  const columnas = mision.columnas || [];
  const pistas = mision.pistas || [];
  const solucion = mision.solucion || {}; 

  // Manejar clic en una celda
  const handleCeldaClick = (filaIndex, colIndex) => {
    if (mostrarResultado) return;

    const key = `${filaIndex}-${colIndex}`;
    setMatrizRespuestas(prev => {
      const valorActual = prev[key];
      let nuevoValor;
      
      // Ciclo de estados: null -> true (✅) -> false (❌) -> null
      if (valorActual === true) nuevoValor = false;
      else if (valorActual === false) nuevoValor = null;
      else nuevoValor = true;

      return {
        ...prev,
        [key]: nuevoValor
      };
    });
  };

  // Verificar solución
  const handleVerificar = () => {
    let correcto = true;
    
    // Verificar que todas las celdas verdaderas en la solución estén marcadas como true
    // y que no haya celdas marcadas como true que no estén en la solución
    for (let f = 0; f < filas.length; f++) {
      for (let c = 0; c < columnas.length; c++) {
        const key = `${f}-${c}`;
        const debeSerVerdadero = solucion[key] === true;
        const esVerdadero = matrizRespuestas[key] === true;

        // Solo nos importa si marcó correctamente las casillas VERDADERAS (los checks)
        // Las cruces (false) son ayudas visuales para el usuario, pero no estrictamente requeridas para validar
        // A MENOS que la lógica estricta lo pida. Por simplicidad, validamos los aciertos.
        if (debeSerVerdadero !== esVerdadero) {
          correcto = false;
          break;
        }
      }
      if (!correcto) break;
    }

    setEsCorrecta(correcto);
    setMostrarResultado(true);

    if (correcto) {
      setTimeout(() => {
        onCompletar();
      }, 2000);
    }
  };

  const handleReintentar = () => {
    setMostrarResultado(false);
    setEsCorrecta(false);
    // Opcional: limpiar tabla o dejarla como estaba
  };

  return (
    <div className="tabla-doble-entrada-container">
      <div className="instrucciones-panel">
        <h3>Pistas del Detective 🕵️‍♂️</h3>
        <ul className="lista-pistas">
          {pistas.map((pista, index) => (
            <li key={index}>{pista}</li>
          ))}
        </ul>
      </div>

      <div className="tabla-area">
        <table className="tabla-logica">
          <thead>
            <tr>
              <th className="celda-vacia"></th>
              {columnas.map((col, index) => (
                <th key={index} className="encabezado-columna">
                  {col.imagen ? <img src={col.imagen} alt={col.texto} className="header-img"/> : null}
                  <span>{col.texto || col}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, filaIndex) => (
              <tr key={filaIndex}>
                <th className="encabezado-fila">
                   {fila.imagen ? <img src={fila.imagen} alt={fila.texto} className="header-img"/> : null}
                   <span>{fila.texto || fila}</span>
                </th>
                {columnas.map((_, colIndex) => {
                  const key = `${filaIndex}-${colIndex}`;
                  const estado = matrizRespuestas[key];
                  return (
                    <td 
                      key={colIndex} 
                      className={`celda-interactiva ${estado === true ? 'marcada-ok' : ''} ${estado === false ? 'marcada-no' : ''}`}
                      onClick={() => handleCeldaClick(filaIndex, colIndex)}
                    >
                      {estado === true && '✅'}
                      {estado === false && '❌'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="acciones-area">
        {!mostrarResultado && (
          <button className="btn-verificar" onClick={handleVerificar}>
            🔍 Verificar Misterio
          </button>
        )}

        {mostrarResultado && (
          <div className={`feedback-mensaje ${esCorrecta ? 'correcto' : 'incorrecto'}`}>
            {esCorrecta ? (
              <>
                <h4>¡Caso Resuelto! 🎉</h4>
                <p>Has conectado todas las pistas correctamente.</p>
              </>
            ) : (
              <>
                <h4>Algo no cuadra... 🤔</h4>
                <p>Revisa las pistas de nuevo. ¡Tú puedes!</p>
                <button className="btn-reintentar" onClick={handleReintentar}>
                  Intentar de nuevo
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TablaDobleEntrada;


