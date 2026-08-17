import React, { useMemo, useRef, useState } from 'react';
import { NOMBRES } from './espacioDatos';
import { useFullscreenToggle } from '../../../hooks/useFullscreenToggle';
import './SistemaSolar.css';

// three.js solo se descarga cuando el nino llega a una mision de astronomia.
const Espacio3D = React.lazy(() => import('./Espacio3D'));

/**
 * SistemaSolar — wrapper del tipo `sistema-solar` (astronomia, materia ciencias).
 *
 * Mismo patron que MezcladorColores: un motor interactivo (Espacio3D) y encima
 * el flujo de mision. Flujo segun `mision.modo`:
 *   'explorar' : intro → explorar → fin
 *   'reto'     : intro → reto → fin
 *   'completo' : intro → explorar → reto → fin  [default]
 *
 * Campos de la mision:
 *   escena       : 'planetas' (default) | 'tierra-luna' | 'estaciones' | 'constelaciones'
 *   modo         : 'explorar' | 'reto' | 'completo'
 *   leccion      : texto introductorio opcional (portada)
 *   datos        : { idCuerpo: "dato wow" } — tarjeta al tocar un cuerpo
 *   retos        : [{ tipo:'toca', pregunta, respuesta:idCuerpo, pista? },
 *                   { tipo:'fase', pregunta, respuesta:idFase|'eclipse-sol'|'eclipse-luna', pista? },
 *                   { tipo:'estacion', pregunta, respuesta:'verano'|'invierno-sur'|..., pista? },
 *                   { tipo:'vista', pregunta, respuesta:idConstelacion, pista? },
 *                   { tipo:'cometa', pregunta, respuesta:'perihelio'|'afelio', pista? },
 *                   { tipo:'lanzamiento', pregunta, respuesta:'choca'|'orbita'|'escapa', pista? }]
 *   dato_curioso : texto del final
 */
const ESCENAS = ['planetas', 'tierra-luna', 'estaciones', 'constelaciones', 'cometa', 'satelite', 'estrellas', 'exoplanetas', 'asteroides', 'impacto', 'agujero-negro', 'cama-elastica'];

const SistemaSolar = ({ mision, onCompletar }) => {
  const escena = ESCENAS.includes(mision.escena) ? mision.escena : 'planetas';
  const modo = mision.modo || 'completo';
  const datos = useMemo(() => mision.datos || {}, [mision.datos]);
  const retos = useMemo(
    () => (mision.retos || []).filter((r) => r && r.pregunta && r.respuesta),
    [mision.retos]
  );

  const flujo = useMemo(() => {
    if (modo === 'explorar' || retos.length === 0) return ['intro', 'explorar', 'fin'];
    if (modo === 'reto') return ['intro', 'reto', 'fin'];
    return ['intro', 'explorar', 'reto', 'fin'];
  }, [modo, retos.length]);

  const [fase, setFase] = useState('intro');
  const avanzar = () => {
    const i = flujo.indexOf(fase);
    if (i < flujo.length - 1) setFase(flujo[i + 1]);
  };

  return (
    <div className="sisol-container">
      {fase === 'intro' && <Portada mision={mision} escena={escena} onComenzar={avanzar} />}
      {fase === 'explorar' && (
        <Explorar
          escena={escena}
          datos={datos}
          haySiguiente={flujo.includes('reto')}
          onContinuar={avanzar}
        />
      )}
      {fase === 'reto' && <Retos escena={escena} retos={retos} onTerminar={avanzar} />}
      {fase === 'fin' && <Final dato={mision.dato_curioso} onCompletar={onCompletar} />}
    </div>
  );
};

/* ============================ PORTADA ============================ */

// OJO: MisionRenderer ya pinta mision.titulo y mision.instruccion arriba de toda
// mision — repetirlos aqui los mostraba dos veces (mismo error que en cubos).
const EMOJI_ESCENA = { 'tierra-luna': '🌗', estaciones: '🍂', constelaciones: '✨', cometa: '☄️', satelite: '🛰️', estrellas: '⭐', exoplanetas: '🔭', asteroides: '🪨', impacto: '☄️', 'agujero-negro': '🕳️', 'cama-elastica': '🛏️' };

const Portada = ({ mision, escena, onComenzar }) => (
  <div className="sisol-portada">
    <div className="sisol-emoji-grande">{mision.emoji || EMOJI_ESCENA[escena] || '🪐'}</div>
    {mision.leccion && (
      <div className="sisol-leccion">
        <span className="sisol-leccion-icono">💡</span>
        <p>{mision.leccion}</p>
      </div>
    )}
    <button className="sisol-btn-principal" onClick={onComenzar}>
      ¡Despegamos! 🚀
    </button>
  </div>
);

/* ============================ CARGANDO ============================ */

const Cargando = () => (
  <div className="sisol-cargando">🚀 Preparando el espacio…</div>
);

/* ============================ EXPLORAR ============================ */

const Explorar = ({ escena, datos, haySiguiente, onContinuar }) => {
  const [seleccion, setSeleccion] = useState(null); // id del cuerpo tocado
  const [comparar, setComparar] = useState(false);
  const [ocultarSol, setOcultarSol] = useState(false); // solo relevante con comparar=true
  const [visitados, setVisitados] = useState([]);
  const motorRef = useRef(null);
  // La pantalla completa vive AQUI (no en Espacio3D): tiene que incluir
  // tambien la tarjeta y los botones, que son hermanos del motor 3D.
  const rootRef = useRef(null);
  const { fullscreen, toggleFullscreen } = useFullscreenToggle(rootRef);

  const elegir = (id) => {
    setSeleccion(id);
    setVisitados((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const alternarComparar = () => {
    setSeleccion(null);
    setComparar((v) => {
      const next = !v;
      // Al salir de comparar se reinicia: si vuelve a entrar mas tarde no se
      // encuentra el Sol ya oculto sin haber tocado nada.
      if (!next) setOcultarSol(false);
      return next;
    });
  };

  const conDatos = Object.keys(datos).length;

  return (
    <div className={`sisol-fase ${fullscreen ? 'sisol-fullscreen' : ''}`} ref={rootRef}>
      {conDatos > 0 && (
        <div className="sisol-progreso-texto">
          {visitados.filter((id) => datos[id]).length >= conDatos
            ? '🎉 ¡Conociste todos los secretos!'
            : `Toca los astros y descubre sus secretos · ${visitados.filter((id) => datos[id]).length}/${conDatos}`}
        </div>
      )}

      <div className="sisol-vista">
        <React.Suspense fallback={<Cargando />}>
          <Espacio3D
            ref={motorRef}
            escena={escena}
            enfocado={comparar ? null : seleccion}
            comparar={comparar}
            ocultarSol={ocultarSol}
            fullscreen={fullscreen}
            seleccionable
            onSeleccion={elegir}
            onVista={elegir}
          />
        </React.Suspense>

        <button
          type="button"
          className="sisol-btn-fs"
          onClick={toggleFullscreen}
          title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {fullscreen ? '✕' : '⛶'}
        </button>

        {seleccion && !comparar && (
          <div className="sisol-tarjeta">
            <button className="sisol-tarjeta-cerrar" onClick={() => setSeleccion(null)} aria-label="Cerrar">
              ✕
            </button>
            <h4>{nombreBonito(seleccion)}</h4>
            {datos[seleccion] && <p>{datos[seleccion]}</p>}
          </div>
        )}
      </div>

      <div className="sisol-acciones">
        {escena === 'planetas' && (
          <button className="sisol-btn-secundario" onClick={alternarComparar}>
            {comparar ? '🪐 Volver a las órbitas' : '🤯 ¿Y en tamaño real?'}
          </button>
        )}
        {escena === 'planetas' && comparar && (
          <button className="sisol-btn-secundario" onClick={() => setOcultarSol((v) => !v)}>
            {ocultarSol ? '☀️ Mostrar el Sol' : '🙈 Ocultar el Sol'}
          </button>
        )}
        <button className="sisol-btn-secundario" onClick={() => motorRef.current?.recentrar()}>
          ↺ Enderezar
        </button>
      </div>

      {comparar && (
        <p className="sisol-nota-comparar">
          Así de grandes son de verdad, uno junto a otro. ¡Busca la Tierra! 🔎
          (Las distancias reales son todavía más locas: no cabrían ni en cien pantallas.)
        </p>
      )}

      <button className="sisol-btn-principal" onClick={onContinuar}>
        {haySiguiente ? 'Ir a los retos 🎯' : 'Terminar ✨'}
      </button>
    </div>
  );
};

/* ============================ RETOS ============================ */

const MENSAJES_LANZAMIENTO = {
  choca: '💥 Se estrelló contra la Tierra. ¡Dale más velocidad!',
  orbita: '🛰️ ¡Quedó en órbita! Pero el reto pedía otra cosa: cambia la velocidad.',
  escapa: '👋 Se escapó al espacio profundo. ¡Un poquito menos de velocidad!',
};

const MENSAJES_LUZ = {
  escapa: '✨ El rayo escapó: todavía no es agujero negro. ¡Aprieta más y vuelve a lanzar!',
  atrapado: '🕳️ Sigue siendo agujero negro. ¡Descomprime más y vuelve a lanzar!',
};

const MENSAJES_CANICA = {
  recta: '➡️ Se fue derechita: el espacio está plano. ¡Ponle peso a la bola!',
  curva: '🌀 Se torció, pero se escapó. Prueba con otro peso.',
  orbita: '🔄 ¡Dio la vuelta completa! Pero el reto pedía otra cosa: cambia el peso.',
  cae: '⬇️ Se cayó al fondo: demasiado peso. ¡Quítale un poco!',
};

const MENSAJES_IMPACTO = {
  desintegra: '✨ Se quemó en el aire. El reto pedía otra cosa: prueba una roca más grande.',
  'explota-aire': '💥 Explotó en el aire sin llegar al suelo. Cambia el tamaño y vuelve a soltarla.',
  crater: '🕳️ Hizo un cráter. El reto pedía otra cosa: cambia el tamaño.',
  catastrofe: '🌑 Esa fue una catástrofe completa. El reto pedía otra cosa: prueba más chica.',
};

const Retos = ({ escena, retos, onTerminar }) => {
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | 'correcto' | { intento }
  const [aciertos, setAciertos] = useState(0);
  const [faseActual, setFaseActual] = useState(null); // info de onFase (tierra-luna)
  const motorRef = useRef(null);
  const rootRef = useRef(null);
  const { fullscreen, toggleFullscreen } = useFullscreenToggle(rootRef);

  const reto = retos[idx];
  const resuelto = feedback === 'correcto';

  const acierto = () => {
    setFeedback('correcto');
    setAciertos((a) => a + 1);
  };

  const alTocar = (id) => {
    if (resuelto || reto.tipo !== 'toca') return;
    if (id === reto.respuesta) acierto();
    else setFeedback({ intento: id });
  };

  // Constelaciones: el acierto llega solo, cuando la figura encaja.
  const alVista = (id) => {
    if (resuelto || reto.tipo !== 'vista') return;
    if (id === reto.respuesta) acierto();
    else setFeedback({ intento: id });
  };

  // Retos de posicion (fase lunar, estacion o zona del cometa): boton "¡Así está bien!".
  const comprobarPosicion = () => {
    if (resuelto || !faseActual) return;
    let ok = false;
    if (reto.tipo === 'fase') {
      ok = reto.respuesta === 'eclipse-sol'
        ? faseActual.eclipseSol
        : reto.respuesta === 'eclipse-luna'
          ? faseActual.eclipseLuna
          : faseActual.fase === reto.respuesta && !faseActual.eclipseSol && !faseActual.eclipseLuna;
    } else if (reto.tipo === 'estacion') {
      ok = reto.respuesta.endsWith('-sur')
        ? faseActual.estacionSur === reto.respuesta.slice(0, -4)
        : faseActual.estacion === reto.respuesta;
    } else if (reto.tipo === 'cometa') {
      ok = faseActual.zona === reto.respuesta;
    }
    if (ok) acierto();
    else setFeedback({ intento: null });
  };

  // Satelite, agujero-negro, cama-elastica e impacto: el desenlace
  // (lanzamiento, rayo de luz, canica o caida) llega solo desde el motor.
  const RETOS_CON_DESENLACE = ['lanzamiento', 'luz', 'canica', 'impacto'];
  const alFase = (info) => {
    setFaseActual(info);
    if (RETOS_CON_DESENLACE.includes(reto.tipo) && info?.resultado && !resuelto) {
      if (info.resultado === reto.respuesta) acierto();
      else setFeedback({ intento: info.resultado });
    }
  };

  const siguiente = () => {
    if (idx < retos.length - 1) {
      setIdx(idx + 1);
      setFeedback(null);
    } else {
      onTerminar();
    }
  };

  return (
    <div className={`sisol-fase ${fullscreen ? 'sisol-fullscreen' : ''}`} ref={rootRef}>
      <div className="sisol-progreso-texto">Reto {idx + 1} de {retos.length}</div>

      <div className="sisol-reto-pregunta">
        <span className="sisol-reto-icono">🎯</span>
        <p>{reto.pregunta}</p>
      </div>

      <div className="sisol-vista">
        <React.Suspense fallback={<Cargando />}>
          <Espacio3D
            ref={motorRef}
            escena={escena}
            seleccionable={reto.tipo === 'toca' && !resuelto}
            fullscreen={fullscreen}
            onSeleccion={alTocar}
            onVista={alVista}
            onFase={alFase}
          />
        </React.Suspense>

        <button
          type="button"
          className="sisol-btn-fs"
          onClick={toggleFullscreen}
          title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {fullscreen ? '✕' : '⛶'}
        </button>
      </div>

      {feedback === 'correcto' && (
        <div className="sisol-feedback correcto">
          ✅ ¡Correcto!{' '}
          {reto.tipo === 'toca'
            ? `Ese es ${nombreBonito(reto.respuesta)}.`
            : reto.tipo === 'vista'
              ? `¡Encajó ${nombreBonito(reto.respuesta)}!`
              : '¡Lo lograste!'}
        </div>
      )}
      {feedback && feedback !== 'correcto' && (
        <div className="sisol-feedback incorrecto">
          {(reto.tipo === 'toca' || reto.tipo === 'vista') && feedback.intento
            ? `Ese es ${nombreBonito(feedback.intento)}. ¡Sigue buscando!`
            : reto.tipo === 'lanzamiento' && feedback.intento
              ? MENSAJES_LANZAMIENTO[feedback.intento] || '¡Prueba con otra velocidad!'
              : reto.tipo === 'luz' && feedback.intento
                ? MENSAJES_LUZ[feedback.intento] || '¡Prueba apretando distinto!'
                : reto.tipo === 'canica' && feedback.intento
                  ? MENSAJES_CANICA[feedback.intento] || '¡Prueba con otro peso!'
                  : reto.tipo === 'impacto' && feedback.intento
                    ? MENSAJES_IMPACTO[feedback.intento] || '¡Prueba con otro tamaño!'
                    : reto.tipo === 'estacion'
                    ? 'Todavía no. Fíjate hacia dónde apunta el eje rojo: ¿le da el sol de frente a nuestra mitad del mundo?'
                    : reto.tipo === 'cometa'
                      ? 'Todavía no. La pista está en la cola: mira dónde crece y dónde casi desaparece.'
                      : 'Todavía no. ¡Mueve el deslizador y fíjate en el recuadro!'}
          {reto.pista && <span className="sisol-pista">💡 {reto.pista}</span>}
        </div>
      )}

      <div className="sisol-acciones">
        {(reto.tipo === 'fase' || reto.tipo === 'estacion' || reto.tipo === 'cometa') && !resuelto && (
          <button className="sisol-btn-principal" onClick={comprobarPosicion}>
            ¡Así está bien! ✅
          </button>
        )}
        {resuelto && (
          <button className="sisol-btn-principal" onClick={siguiente}>
            {idx < retos.length - 1 ? 'Siguiente reto ➡️' : 'Terminar ✨'}
          </button>
        )}
        <button className="sisol-btn-secundario" onClick={() => motorRef.current?.recentrar()}>
          ↺ Enderezar
        </button>
      </div>

      <div className="sisol-score-mini">Aciertos: {aciertos}/{retos.length}</div>
    </div>
  );
};

/* ============================ FINAL ============================ */

const Final = ({ dato, onCompletar }) => (
  <div className="sisol-fin">
    <div className="sisol-fin-emoji">🧑‍🚀</div>
    <h2>¡Misión espacial completada!</h2>
    {dato && (
      <div className="sisol-dato">
        <span className="sisol-dato-icono">🌌</span>
        <p>{dato}</p>
      </div>
    )}
    <button className="sisol-btn-principal" onClick={onCompletar}>
      Continuar
    </button>
  </div>
);

/* ============================ util ============================ */

// "la Tierra" → "La Tierra" para titulos de tarjeta.
const nombreBonito = (id) => {
  const n = NOMBRES[id] || id;
  return n.charAt(0).toUpperCase() + n.slice(1);
};

export default SistemaSolar;
