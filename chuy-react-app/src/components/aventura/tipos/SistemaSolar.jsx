import React, { useMemo, useRef, useState } from 'react';
import { NOMBRES } from './espacioDatos';
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
 *                   { tipo:'vista', pregunta, respuesta:idConstelacion, pista? }]
 *   dato_curioso : texto del final
 */
const ESCENAS = ['planetas', 'tierra-luna', 'estaciones', 'constelaciones'];

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
const EMOJI_ESCENA = { 'tierra-luna': '🌗', estaciones: '🍂', constelaciones: '✨' };

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
  const [visitados, setVisitados] = useState([]);
  const motorRef = useRef(null);

  const elegir = (id) => {
    setSeleccion(id);
    setVisitados((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const alternarComparar = () => {
    setSeleccion(null);
    setComparar((v) => !v);
  };

  const conDatos = Object.keys(datos).length;

  return (
    <div className="sisol-fase">
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
            seleccionable
            onSeleccion={elegir}
            onVista={elegir}
          />
        </React.Suspense>

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

const Retos = ({ escena, retos, onTerminar }) => {
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | 'correcto' | { intento }
  const [aciertos, setAciertos] = useState(0);
  const [faseActual, setFaseActual] = useState(null); // info de onFase (tierra-luna)
  const motorRef = useRef(null);

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

  // Retos de posicion (fase lunar o estacion del ano): boton "¡Así está bien!".
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
    }
    if (ok) acierto();
    else setFeedback({ intento: null });
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
    <div className="sisol-fase">
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
            onSeleccion={alTocar}
            onVista={alVista}
            onFase={setFaseActual}
          />
        </React.Suspense>
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
            : reto.tipo === 'estacion'
              ? 'Todavía no. Fíjate hacia dónde apunta el eje rojo: ¿le da el sol de frente a nuestra mitad del mundo?'
              : 'Todavía no. ¡Mueve el deslizador y fíjate en el recuadro!'}
          {reto.pista && <span className="sisol-pista">💡 {reto.pista}</span>}
        </div>
      )}

      <div className="sisol-acciones">
        {(reto.tipo === 'fase' || reto.tipo === 'estacion') && !resuelto && (
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
