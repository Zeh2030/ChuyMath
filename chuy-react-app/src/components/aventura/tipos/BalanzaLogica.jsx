import React, { useState, useEffect } from 'react';
import './BalanzaLogica.css';

/**
 * Componente de Balanza Lógica.
 * Muestra una balanza con objetos en ambos lados y pide el valor de uno desconocido.
 */
const BalanzaLogica = ({ 
  mision, 
  onCompletar, 
  modoSimulacro = false, 
  respuestaGuardada = '', 
  onRespuesta = null, 
  mostrarResultado: mostrarResultadoExterno = false 
}) => {
  const [respuestaUsuario, setRespuestaUsuario] = useState(respuestaGuardada || '');
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);

  // Sincronizar en modo simulacro
  useEffect(() => {
    if (modoSimulacro && respuestaGuardada !== undefined) {
      setRespuestaUsuario(respuestaGuardada);
    }
  }, [respuestaGuardada, modoSimulacro]);

  const configuracion = mision.configuracion_balanza || {};
  const ladoIzq = configuracion.lado_izquierdo || [];
  const ladoDer = configuracion.lado_derecho || [];
  const objetoIncognita = configuracion.incognita || '?';

  // Normalizar respuesta para comparación
  const verificarRespuesta = (valor) => {
    if (!valor && valor !== 0) return false;
    const valorStr = String(valor).trim();
    const respuestaStr = String(mision.respuesta).trim();
    return valorStr === respuestaStr;
  };

  const handleInputChange = (e) => {
    if (mostrarFeedback || mostrarResultadoExterno) return;
    
    const valor = e.target.value;
    setRespuestaUsuario(valor);
    
    if (modoSimulacro && onRespuesta) {
      onRespuesta(valor);
    }
  };

  const handleEnviar = () => {
    if (!respuestaUsuario) return;
    
    const correcta = verificarRespuesta(respuestaUsuario);
    setEsCorrecta(correcta);
    setMostrarFeedback(true);
    
    if (correcta && onCompletar) {
      setTimeout(() => onCompletar(), 1500);
    }
  };

  const handleReintentar = () => {
    setRespuestaUsuario('');
    setMostrarFeedback(false);
    setEsCorrecta(false);
  };

  const debeMostrarResultado = mostrarFeedback || (modoSimulacro && mostrarResultadoExterno);
  const esCorrectaCalculada = modoSimulacro ? verificarRespuesta(respuestaUsuario) : esCorrecta;

  // Función para renderizar un grupo de objetos en un platillo
  const renderizarPlatillo = (objetos) => {
    return (
      <div className="platillo-contenido">
        {objetos.map((obj, index) => (
          <div key={index} className="objeto-balanza">
            <span className="icono-objeto" style={{ fontSize: '2.5rem' }}>{obj.icono}</span>
            {obj.cantidad > 1 && <span className="badge-cantidad">x{obj.cantidad}</span>}
            {obj.valor_visible && <span className="etiqueta-valor">{obj.valor_visible}</span>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="balanza-container">
      <h3 className="balanza-pregunta">{mision.pregunta}</h3>

      {/* Representación Visual de la Balanza */}
      <div className="escenario-balanza">
        <div className="eje-central"></div>
        <div className={`barra-balanza ${debeMostrarResultado && !esCorrectaCalculada ? 'desequilibrada' : ''}`}>
          
          {/* Lado Izquierdo */}
          <div className="brazo izquierdo">
            <div className="cuerda"></div>
            <div className="platillo">
              {renderizarPlatillo(ladoIzq)}
            </div>
          </div>

          {/* Lado Derecho */}
          <div className="brazo derecho">
            <div className="cuerda"></div>
            <div className="platillo">
              {renderizarPlatillo(ladoDer)}
            </div>
          </div>
        </div>
        <div className="base-balanza"></div>
      </div>

      {/* Área de Respuesta */}
      <div className="area-respuesta">
        <label>¿Cuánto pesa {objetoIncognita}?</label>
        <input
          type="number"
          className={`input-balanza ${debeMostrarResultado ? (esCorrectaCalculada ? 'correcto' : 'incorrecto') : ''}`}
          value={respuestaUsuario}
          onChange={handleInputChange}
          placeholder="?"
          disabled={debeMostrarResultado}
        />
      </div>

      {/* Acciones (Solo Aventura) */}
      {!modoSimulacro && (
        <div className="acciones-container">
          {!mostrarFeedback ? (
            <button className="boton-enviar" onClick={handleEnviar} disabled={!respuestaUsuario}>
              Comprobar Peso
            </button>
          ) : (
            !esCorrecta && (
              <button className="boton-reintentar" onClick={handleReintentar}>
                Intentar de Nuevo
              </button>
            )
          )}
        </div>
      )}

      {/* Feedback */}
      {debeMostrarResultado && (
        <div className={`feedback-container ${esCorrectaCalculada ? 'feedback-correcto' : 'feedback-incorrecto'}`}>
          <div className="feedback-icono">{esCorrectaCalculada ? '⚖️' : '⚠️'}</div>
          <div className="feedback-texto">
            <p className="feedback-titulo">{esCorrectaCalculada ? '¡Equilibrio Perfecto!' : 'La balanza se inclina...'}</p>
            <p className="feedback-explicacion">
              {esCorrectaCalculada ? mision.explicacion_correcta : mision.explicacion_incorrecta}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanzaLogica;

