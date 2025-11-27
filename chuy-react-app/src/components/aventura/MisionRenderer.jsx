import React from 'react';
import OpcionMultiple from './tipos/OpcionMultiple';
import Secuencia from './tipos/Secuencia';
import NavegacionMapa from './tipos/NavegacionMapa';
import TablaDobleEntrada from './tipos/TablaDobleEntrada';
import ConteoFiguras from './tipos/ConteoFiguras';
import Operaciones from './tipos/Operaciones';
import Criptoaritmetica from './tipos/Criptoaritmetica';
import BalanzaLogica from './tipos/BalanzaLogica';
import DesarrolloCubos from './tipos/DesarrolloCubos';
import PalabraDelDia from './tipos/PalabraDelDia';
import NumberblocksConstructor from './tipos/NumberblocksConstructor';
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
        return (
          <Criptoaritmetica 
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
      case 'balanza-logica':
        return (
          <BalanzaLogica 
            key={mision.id}
            mision={mision} 
            onCompletar={onCompletar} 
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
      case 'desarrollo-cubos':
        return (
          <DesarrolloCubos 
            key={mision.id}
            mision={mision} 
            onCompletar={onCompletar} 
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );
      
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
        return (
          <PalabraDelDia 
            key={mision.id}
            mision={mision} 
            onCompletar={onCompletar} 
            modoSimulacro={modoSimulacro}
            respuestaGuardada={respuestaGuardada}
            onRespuesta={onRespuesta}
            mostrarResultado={mostrarResultado}
          />
        );

      case 'numberblocks-constructor':
        return (
          <NumberblocksConstructor 
            key={mision.id}
            mision={mision} 
            onCompletar={onCompletar}
          />
        );
      
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

