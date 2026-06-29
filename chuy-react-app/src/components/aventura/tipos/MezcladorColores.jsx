import React, { useMemo, useState } from 'react';
import './MezcladorColores.css';
import {
  COLORES, PRIMARIOS, RUEDA, getColor, mezclar, descubriblesDesde,
} from '../../../utils/colorMix';

/**
 * MezcladorColores — "Laboratorio de Colores".
 *
 * Juego de mezcla de colores primarios (modelo RYB, pintura). Agnóstico de materia:
 * se usa en Ciencias (descubrimiento del fenómeno) y en Dibujo (teoría del color).
 *
 * Flujo según `mision.modo`:
 *   'explorar' : intro → explorar → fin   (caja de arena, descubre los secretos)
 *   'reto'     : intro → reto → fin       (haz el color objetivo)
 *   'completo' : intro → explorar → reto → fin  (explora y luego retos) [default]
 *
 * Campos de la misión (todos opcionales salvo título):
 *   modo            : 'explorar' | 'reto' | 'completo'
 *   colores_base    : array de ids a mostrar en la paleta (default primarios RYB)
 *   retos           : array de ids objetivo, o de { objetivo, pista }
 *   mostrar_rueda   : bool — muestra la rueda de color que se va llenando
 *   leccion         : texto introductorio (se muestra en la portada)
 *   dato_curioso    : texto que aparece al terminar
 */
const MezcladorColores = ({ mision, onCompletar }) => {
  const modo = mision.modo || 'completo';
  const mostrarRueda = mision.mostrar_rueda || false;

  // Paleta base (ids válidos del catálogo). Default: primarios RYB.
  const base = useMemo(() => {
    const ids = (mision.colores_base || PRIMARIOS).filter((id) => COLORES[id]);
    return ids.length ? ids : PRIMARIOS;
  }, [mision.colores_base]);

  // Colores "secretos" descubribles mezclando la base (meta del modo explorar).
  const metaDescubrir = useMemo(() => descubriblesDesde(base), [base]);

  // Lista de retos normalizada a { objetivo, pista }.
  const retos = useMemo(() => {
    const raw = mision.retos && mision.retos.length
      ? mision.retos
      : metaDescubrir.map((id) => ({ objetivo: id }));
    return raw
      .map((r) => (typeof r === 'string' ? { objetivo: r } : r))
      .filter((r) => COLORES[r.objetivo]);
  }, [mision.retos, metaDescubrir]);

  const flujo = useMemo(() => {
    if (modo === 'explorar') return ['intro', 'explorar', 'fin'];
    if (modo === 'reto') return ['intro', 'reto', 'fin'];
    return ['intro', 'explorar', 'reto', 'fin'];
  }, [modo]);

  const [fase, setFase] = useState('intro');

  const avanzar = () => {
    const i = flujo.indexOf(fase);
    if (i < flujo.length - 1) setFase(flujo[i + 1]);
  };

  return (
    <div className="mezcla-container">
      {fase === 'intro' && (
        <Portada mision={mision} base={base} onComenzar={avanzar} />
      )}
      {fase === 'explorar' && (
        <Explorar
          base={base}
          metaDescubrir={metaDescubrir}
          mostrarRueda={mostrarRueda}
          haySiguiente={flujo.indexOf('reto') > -1}
          onContinuar={avanzar}
        />
      )}
      {fase === 'reto' && (
        <Reto base={base} retos={retos} onTerminar={avanzar} />
      )}
      {fase === 'fin' && (
        <Final dato={mision.dato_curioso} onCompletar={onCompletar} />
      )}
    </div>
  );
};

/* ============================ PORTADA ============================ */

const Portada = ({ mision, base, onComenzar }) => (
  <div className="mezcla-portada">
    <div className="mezcla-emoji-grande">{mision.emoji || '🎨'}</div>
    <h2 className="mezcla-titulo">{mision.titulo}</h2>
    {mision.instruccion && <p className="mezcla-instruccion">{mision.instruccion}</p>}
    {mision.leccion && (
      <div className="mezcla-leccion">
        <span className="mezcla-leccion-icono">💡</span>
        <p>{mision.leccion}</p>
      </div>
    )}
    <div className="mezcla-base-preview">
      {base.map((id) => {
        const c = getColor(id);
        return (
          <span key={id} className="mezcla-base-chip" title={c.nombre}>
            <span className="mezcla-base-bola" style={{ background: c.hex }} />
            {c.nombre}
          </span>
        );
      })}
    </div>
    <button className="mezcla-btn-principal" onClick={onComenzar}>
      ¡Comenzar! 🧪
    </button>
  </div>
);

/* ============================ EXPLORAR ============================ */

const Explorar = ({ base, metaDescubrir, mostrarRueda, haySiguiente, onContinuar }) => {
  const [slotA, setSlotA] = useState(null);
  const [slotB, setSlotB] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [animar, setAnimar] = useState(false);
  const [descubiertos, setDescubiertos] = useState([]); // ids de mezclas no-base halladas

  const elegir = (id) => {
    if (resultado) return; // hay que vaciar antes de mezclar de nuevo
    if (!slotA) { setSlotA(id); return; }
    if (!slotB) {
      setSlotB(id);
      const res = mezclar(slotA, id);
      setResultado(res);
      setAnimar(true);
      if (res && !base.includes(res.id) && !descubiertos.includes(res.id)) {
        setDescubiertos((prev) => [...prev, res.id]);
      }
      window.setTimeout(() => setAnimar(false), 700);
    }
  };

  const vaciar = () => {
    setSlotA(null);
    setSlotB(null);
    setResultado(null);
  };

  const faltan = metaDescubrir.filter((id) => !descubiertos.includes(id)).length;
  const todosHallados = metaDescubrir.length > 0 && faltan === 0;

  return (
    <div className="mezcla-fase">
      <div className="mezcla-progreso-texto">
        {todosHallados
          ? '🎉 ¡Descubriste todos los colores secretos!'
          : `Descubre los colores secretos · ${descubiertos.filter((d) => metaDescubrir.includes(d)).length}/${metaDescubrir.length}`}
      </div>

      <Probeta slotA={slotA} slotB={slotB} resultado={resultado} animar={animar} />

      {resultado && (
        <div className="mezcla-ecuacion">
          <Bola color={getColor(slotA)} />
          <span className="mezcla-signo">+</span>
          <Bola color={getColor(slotB)} />
          <span className="mezcla-signo">=</span>
          <Bola color={resultado} grande />
          <span className="mezcla-resultado-nombre">{resultado.nombre}</span>
        </div>
      )}

      <Paleta base={base} slotA={slotA} slotB={slotB} disabled={!!resultado} onElegir={elegir} />

      <div className="mezcla-acciones">
        {(slotA || resultado) && (
          <button className="mezcla-btn-secundario" onClick={vaciar}>
            🫗 Vaciar
          </button>
        )}
      </div>

      {mostrarRueda && <RuedaColor conocidos={[...base, ...descubiertos]} />}

      {!mostrarRueda && descubiertos.length > 0 && (
        <ColeccionDescubiertos ids={descubiertos} />
      )}

      <button
        className={`mezcla-btn-principal ${todosHallados ? 'pulso' : ''}`}
        onClick={onContinuar}
      >
        {haySiguiente ? 'Ir a los retos 🎯' : 'Terminar ✨'}
      </button>
    </div>
  );
};

/* ============================ RETO ============================ */

const Reto = ({ base, retos, onTerminar }) => {
  const [idx, setIdx] = useState(0);
  const [slotA, setSlotA] = useState(null);
  const [slotB, setSlotB] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | 'correcto' | { intento }
  const [aciertos, setAciertos] = useState(0);
  const [resueltoActual, setResueltoActual] = useState(false);

  const retoActual = retos[idx];
  const objetivo = getColor(retoActual.objetivo);

  const elegir = (id) => {
    if (resueltoActual) return;
    if (!slotA) { setSlotA(id); return; }
    if (!slotB && id !== slotA) { setSlotB(id); return; }
    // si ya hay A y se toca de nuevo el mismo, no hacer nada
  };

  const mezclarReto = () => {
    const res = mezclar(slotA, slotB);
    if (res && res.id === objetivo.id) {
      setFeedback('correcto');
      setResueltoActual(true);
      setAciertos((a) => a + 1);
    } else {
      setFeedback({ intento: res });
    }
  };

  const reintentar = () => {
    setSlotA(null);
    setSlotB(null);
    setFeedback(null);
  };

  const siguiente = () => {
    if (idx < retos.length - 1) {
      setIdx(idx + 1);
      setSlotA(null);
      setSlotB(null);
      setFeedback(null);
      setResueltoActual(false);
    } else {
      onTerminar();
    }
  };

  return (
    <div className="mezcla-fase">
      <div className="mezcla-progreso-texto">Reto {idx + 1} de {retos.length}</div>

      <div className="mezcla-objetivo">
        <span className="mezcla-objetivo-label">¿Cómo haces este color?</span>
        <div className="mezcla-objetivo-bola" style={{ background: objetivo.hex }}>
          <span className="mezcla-objetivo-nombre">{objetivo.nombre}</span>
        </div>
        {retoActual.pista && <p className="mezcla-pista">💡 {retoActual.pista}</p>}
      </div>

      <div className="mezcla-slots">
        <SlotReto color={getColor(slotA)} onClear={() => !resueltoActual && setSlotA(null)} />
        <span className="mezcla-signo">+</span>
        <SlotReto color={getColor(slotB)} onClear={() => !resueltoActual && setSlotB(null)} />
      </div>

      <Paleta base={base} slotA={slotA} slotB={slotB} disabled={resueltoActual} onElegir={elegir} />

      {feedback === 'correcto' && (
        <div className="mezcla-feedback correcto">
          ✅ ¡Correcto! {getColor(slotA).nombre} + {getColor(slotB).nombre} = {objetivo.nombre}
        </div>
      )}
      {feedback && feedback !== 'correcto' && (
        <div className="mezcla-feedback incorrecto">
          {feedback.intento
            ? `Esa mezcla hace ${feedback.intento.nombre}. ¡Casi! Prueba otra combinación.`
            : 'Intenta con otra combinación.'}
        </div>
      )}

      <div className="mezcla-acciones">
        {!feedback && (
          <button
            className="mezcla-btn-principal"
            disabled={!slotA || !slotB}
            onClick={mezclarReto}
          >
            Mezclar 🧪
          </button>
        )}
        {feedback === 'correcto' && (
          <button className="mezcla-btn-principal" onClick={siguiente}>
            {idx < retos.length - 1 ? 'Siguiente reto ➡️' : 'Terminar ✨'}
          </button>
        )}
        {feedback && feedback !== 'correcto' && (
          <button className="mezcla-btn-secundario" onClick={reintentar}>
            🔄 Intentar de nuevo
          </button>
        )}
      </div>

      <div className="mezcla-score-mini">Aciertos: {aciertos}/{retos.length}</div>
    </div>
  );
};

/* ============================ FINAL ============================ */

const Final = ({ dato, onCompletar }) => (
  <div className="mezcla-fin">
    <div className="mezcla-fin-emoji">🎉</div>
    <h2>¡Eres un artista del color!</h2>
    {dato && (
      <div className="mezcla-dato">
        <span className="mezcla-dato-icono">🌈</span>
        <p>{dato}</p>
      </div>
    )}
    <button className="mezcla-btn-principal" onClick={onCompletar}>
      Continuar
    </button>
  </div>
);

/* ============================ SUB-COMPONENTES ============================ */

// Probeta visual: se llena con color A (izq), color B (der) y al mezclar todo el resultado.
const Probeta = ({ slotA, slotB, resultado, animar }) => {
  const a = getColor(slotA);
  const b = getColor(slotB);
  let fill = null;
  if (resultado) fill = resultado.hex;

  return (
    <div className={`mezcla-probeta ${animar ? 'animar' : ''}`}>
      <div className="mezcla-probeta-vidrio">
        {!resultado && a && (
          <div className="mezcla-probeta-mitad izq" style={{ background: a.hex }} />
        )}
        {!resultado && b && (
          <div className="mezcla-probeta-mitad der" style={{ background: b.hex }} />
        )}
        {resultado && (
          <div className="mezcla-probeta-lleno" style={{ background: fill }} />
        )}
        {!a && !b && !resultado && (
          <span className="mezcla-probeta-hint">Elige 2 colores 👇</span>
        )}
      </div>
      <div className="mezcla-probeta-base" />
    </div>
  );
};

// Paleta de colores base seleccionables.
const Paleta = ({ base, slotA, slotB, disabled, onElegir }) => (
  <div className="mezcla-paleta">
    {base.map((id) => {
      const c = getColor(id);
      const usado = id === slotA || id === slotB;
      return (
        <button
          key={id}
          className={`mezcla-gota ${usado ? 'usado' : ''}`}
          style={{ background: c.hex }}
          disabled={disabled}
          onClick={() => onElegir(id)}
          title={c.nombre}
        >
          <span className="mezcla-gota-nombre">{c.nombre}</span>
        </button>
      );
    })}
  </div>
);

const Bola = ({ color, grande }) => {
  if (!color) return <span className="mezcla-bola vacia" />;
  return (
    <span
      className={`mezcla-bola ${grande ? 'grande' : ''}`}
      style={{ background: color.hex }}
      title={color.nombre}
    />
  );
};

const SlotReto = ({ color, onClear }) => (
  <button
    className={`mezcla-slot-reto ${color ? 'lleno' : ''}`}
    style={color ? { background: color.hex } : undefined}
    onClick={color ? onClear : undefined}
    title={color ? `${color.nombre} (toca para quitar)` : 'Vacío'}
  >
    {!color && <span className="mezcla-slot-vacio">?</span>}
  </button>
);

// Colección simple de colores hallados (modo explorar sin rueda).
const ColeccionDescubiertos = ({ ids }) => (
  <div className="mezcla-coleccion">
    {ids.map((id) => {
      const c = getColor(id);
      return (
        <span key={id} className="mezcla-coleccion-item">
          <span className="mezcla-coleccion-bola" style={{ background: c.hex }} />
          {c.nombre}
        </span>
      );
    })}
  </div>
);

// Rueda de color de 12 posiciones que se va llenando con los colores conocidos.
const RuedaColor = ({ conocidos }) => {
  const size = 230;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 26;
  return (
    <div className="mezcla-rueda" style={{ width: size, height: size }}>
      <div className="mezcla-rueda-centro">Rueda<br />de color</div>
      {RUEDA.map((id, i) => {
        const ang = (i / RUEDA.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        const c = getColor(id);
        const visible = conocidos.includes(id);
        return (
          <div
            key={id}
            className={`mezcla-rueda-spoke ${visible ? 'on' : 'off'}`}
            style={{
              left: x, top: y,
              background: visible ? c.hex : '#e8e8e8',
            }}
            title={visible ? c.nombre : '¿?'}
          >
            {!visible && '?'}
          </div>
        );
      })}
    </div>
  );
};

export default MezcladorColores;
