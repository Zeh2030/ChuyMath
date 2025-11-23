import React from 'react';
import OpcionMultiple from './tipos/OpcionMultiple';
import Secuencia from './tipos/Secuencia';
import NavegacionMapa from './tipos/NavegacionMapa';
import TablaDobleEntrada from './tipos/TablaDobleEntrada';
import ConteoFiguras from './tipos/ConteoFiguras';
import Operaciones from './tipos/Operaciones';
import './MisionRenderer.css';

/**
 * Componente que renderiza diferentes tipos de misiones según su tipo.
 * Actúa como un "router" de componentes de juego.
 * 
 * @param {Object} mision - El objeto de la misión con todos sus datos
 * @param {Function} onCompletar - Callback que se ejecuta cuando la misión se completa
 * @param {Boolean} modoSimulacro - Si está en modo simulacro (sin feedback inmediato)
 * @param {*} respuestaGuardada - Respuesta guardada del usuario (para modo simulacro)
 * @param {Function} onRespuesta - Callback para guardar respuesta en modo simulacro
 * @param {Boolean} mostrarResultado - Si debe mostrar el resultado (modo simulacro calificado)
 */
const MisionRenderer = ({ 
  mision, 
  onCompletar, 
  modoSimulacro = false,
  respuestaGuardada = null,
  onRespuesta = null,
  mostrarResultado = false
}) => {
  if (!mision) {
    return <div>No hay misión disponible</div>;
  }

  // Mapeo de tipos de misión a sus componentes correspondientes
  const renderizarMision = () => {
    switch (mision.tipo) {
      case 'opcion-multiple':
        return (
          <OpcionMultiple 
            key={mision.id}
            mision={mision} 
            onCompletar={onCompletar}
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
      case 'tabla-doble-entrada':
        return (
          <TablaDobleEntrada 
            key={mision.id}
            mision={mision} 
            onCompletar={onCompletar} 
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
      case 'secuencia':
        return (
          <Secuencia 
            key={mision.id} 
            mision={mision} 
            onCompletar={onCompletar} 
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
      case 'conteo-figuras':
        return (
          <ConteoFiguras 
            key={mision.id} 
            mision={mision} 
            onCompletar={onCompletar} 
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
      case 'operaciones':
        return (
          <Operaciones 
            key={mision.id} 
            mision={mision} 
            onCompletar={onCompletar} 
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
      case 'criptoaritmetica':
        // TODO: Implementar en Fase 4
        return <div>Componente Criptoaritmetica - Por implementar</div>;
      
      case 'balanza-logica':
        // TODO: Implementar en Fase 4
        return <div>Componente BalanzaLogica - Por implementar</div>;
      
      case 'desarrollo-cubos':
        // TODO: Implementar en Fase 4
        return <div>Componente DesarrolloCubos - Por implementar</div>;
      
      case 'navegacion-mapa':
        return (
          <NavegacionMapa 
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
      case 'palabra-del-dia':
        // TODO: Implementar en Fase 4
        return <div>Componente PalabraDelDia - Por implementar</div>;
      
      default:
        return (
          <div style={{ padding: '20px', textAlign: 'center', color: '#e74c3c' }}>
            <p>⚠️ Tipo de misión no reconocido: <strong>{mision.tipo}</strong></p>
            <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '10px' }}>
              Este tipo de misión aún no está implementado.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="mision-renderer">
      <h2 className="mision-titulo">{mision.titulo}</h2>
      {mision.instruccion && (
        <p className="mision-instruccion">{mision.instruccion}</p>
      )}
      {renderizarMision()}
    </div>
  );
};

export default MisionRenderer;

