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
import LienzoDibujo from './tipos/LienzoDibujo';
import Kakooma from './tipos/Kakooma';
import AreaConstructor from './tipos/AreaConstructor';
import FraccionExplorer from './tipos/FraccionExplorer';
import AnguloExplorer from './tipos/AnguloExplorer';
import FraccionOperaciones from './tipos/FraccionOperaciones';
import WordBank from './tipos/WordBank';
import VerbConjugator from './tipos/VerbConjugator';
import TrueOrFalse from './tipos/TrueOrFalse';
import FillTheGap from './tipos/FillTheGap';
import TapThePairs from './tipos/TapThePairs';
import SentenceTransform from './tipos/SentenceTransform';
import ImagePicker from './tipos/ImagePicker';
import WordScramble from './tipos/WordScramble';
import ListenAndType from './tipos/ListenAndType';
import MiniStory from './tipos/MiniStory';
import ExperimentoGuia from './tipos/ExperimentoGuia';
import Colorear from './tipos/Colorear';
import DibujoGuiado from './tipos/DibujoGuiado';
import DibujoLibre from './tipos/DibujoLibre';
const PianoPrompter = React.lazy(() => import('./tipos/PianoPrompter'));
import IdentificaNota from './tipos/IdentificaNota';
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

      case 'lienzo-dibujo':
        return (
          <LienzoDibujo 
            key={mision.id}
            mision={mision} 
            onCompletar={onCompletar} 
          />
        );

      case 'kakooma':
        return (
          <Kakooma
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'area-constructor':
        return (
          <AreaConstructor
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'fraccion-explorer':
        return (
          <FraccionExplorer
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'angulo-explorer':
        return (
          <AnguloExplorer
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'fraccion-operaciones':
        return (
          <FraccionOperaciones
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      // === English game types ===
      case 'word-bank':
        return (
          <WordBank
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'verb-conjugator':
        return (
          <VerbConjugator
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'true-or-false':
        return (
          <TrueOrFalse
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'fill-the-gap':
        return (
          <FillTheGap
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'tap-the-pairs':
        return (
          <TapThePairs
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'sentence-transform':
        return (
          <SentenceTransform
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'image-picker':
        return (
          <ImagePicker
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'word-scramble':
        return (
          <WordScramble
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'listen-and-type':
        return (
          <ListenAndType
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'mini-story':
        return (
          <MiniStory
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      // === Ciencias ===
      case 'experimento-guia':
        return (
          <ExperimentoGuia
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      // === Dibujo ===
      case 'colorear':
        return (
          <Colorear
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'dibujo-guiado':
        return (
          <DibujoGuiado
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'dibujo-libre':
        return (
          <DibujoLibre
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      // === Piano ===
      case 'identifica-nota':
        return (
          <IdentificaNota
            key={mision.id}
            mision={mision}
            onCompletar={onCompletar}
          />
        );

      case 'piano-prompter':
        return (
          <React.Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Cargando piano...</div>}>
            <PianoPrompter
              key={mision.id}
              mision={mision}
              onCompletar={onCompletar}
            />
          </React.Suspense>
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

