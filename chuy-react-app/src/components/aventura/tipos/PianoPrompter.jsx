import React, { useState } from 'react';
import MusicPrompter from './MusicPrompter';
import './PianoPrompter.css';

/**
 * Voces de cada mano, leídas de `%%staves`: cada grupo es un pentagrama (el
 * primero, la derecha) y lo que va entre paréntesis comparte pentagrama.
 *   `{1 2}` → [['1'], ['2']]   ·   `{(1 2) (3 4)}` → [['1','2'], ['3','4']]
 * Sin `%%staves` pero con voces, cada V: es su propia mano (contenido antiguo).
 * Sin voces: una sola mano.
 */
const gruposPorMano = (notas) => {
  const staves = notas.match(/^%%staves\s+(.*)$/m);
  if (staves) {
    const grupos = [...staves[1].matchAll(/\(([^)]*)\)|(\d+)/g)]
      .map((m) => (m[1] !== undefined ? m[1].trim().split(/\s+/).filter(Boolean) : [m[2]]))
      .filter((g) => g.length);
    if (grupos.length) return grupos;
  }
  const ids = [...new Set([...notas.matchAll(/^V:\s*(\d+)/gm)].map((m) => m[1]))];
  return ids.length ? ids.map((id) => [id]) : [['1']];
};

/**
 * Extrae una mano de un ABC a dos manos. Robusto a que una voz ocupe varias
 * líneas o traiga atributos (clef=, stem=) en su declaración.
 * - Mano de UNA voz: { notas, clave } para una pieza de un solo pentagrama.
 * - Mano de DOS voces: las dos en un pentagrama (`%%staves (a b)` con sus V:),
 *   y `conVoces` para que se arme como ABC con voces.
 */
const extraerMano = (notas, grupo) => {
  const lines = notas.split('\n').map(l => l.trim()).filter(Boolean);
  const buckets = {};
  const cabeceras = {};
  let current = null;
  for (const line of lines) {
    if (line.startsWith('%%')) continue; // %%staves y otras directivas globales
    const vm = line.match(/^V:\s*(\d+)(.*)$/);
    if (vm) {
      current = vm[1];
      if (!buckets[current]) buckets[current] = [];
      // Atributos (clef=bass stem=up) aparte; lo demás en la línea son notas (raro, pero por si acaso).
      const tokens = vm[2].trim().split(/\s+/).filter(Boolean);
      const atributos = tokens.filter((t) => /^\w+=/.test(t));
      cabeceras[current] = atributos;
      const resto = tokens.filter((t) => !/^\w+=/.test(t)).join(' ');
      if (resto) buckets[current].push(resto);
      continue;
    }
    if (current) buckets[current].push(line);
  }
  const claveDe = (id) => {
    const c = (cabeceras[id] || []).find((a) => a.startsWith('clef='));
    return c ? c.slice(5) : null;
  };
  const clave = claveDe(grupo[0]) || (grupo[0] === '1' ? 'treble' : 'bass');

  if (grupo.length === 1) {
    return { notas: (buckets[grupo[0]] || []).join(' '), clave, conVoces: false };
  }
  const cuerpo = grupo.flatMap((id) => [
    ['V:' + id, ...(cabeceras[id] || [])].join(' '),
    (buckets[id] || []).join(' '),
  ]);
  return { notas: [`%%staves (${grupo.join(' ')})`, ...cuerpo].join('\n'), clave, conVoces: true };
};

/**
 * Avance de la pieza. Lo marca el alumno: que la pieza haya terminado de sonar
 * no dice nada de si ya la domina (puede haberla escuchado sin tocar, o
 * practicado solo un compás con el bucle). "Ya la domino" es la completada.
 */
const ESTADOS_PIEZA = [
  { id: 'iniciado', emoji: '🔄', texto: 'Practicando' },
  { id: 'casi', emoji: '🟡', texto: 'Casi la tengo' },
  { id: 'completado', emoji: '✅', texto: 'Ya la domino' },
];

const EstadoPieza = ({ estado, onCambiar, pregunta }) => (
  <div className="pp-estado" role="group" aria-label={pregunta}>
    <span className="pp-estado-pregunta">{pregunta}</span>
    <div className="pp-estado-opciones">
      {ESTADOS_PIEZA.map((e) => (
        <button
          key={e.id}
          type="button"
          className={`pp-estado-btn pp-estado-${e.id}${estado === e.id ? ' activo' : ''}`}
          aria-pressed={estado === e.id}
          onClick={() => onCambiar(e.id)}
        >
          <span aria-hidden="true">{e.emoji}</span> {e.texto}
        </button>
      ))}
    </div>
  </div>
);

const PianoPrompter = ({ mision, onCompletar, estadoPieza = null, onEstadoPieza = null }) => {
  // Extraer datos de la misión
  const {
    titulo = 'Sin título',
    autor = '',
    bpm = 80,
    dificultad = '',
    configuracion = {},
    notas = '',
  } = mision;

  // `unidad` = L: de ABC (duración por defecto de una nota sin número).
  // 1/4 sirve para 4/4 y 3/4; en compases de corchea (6/8, 9/8) conviene 1/8
  // para no tener que escribir "/2" en cada nota.
  const { compas = '4/4', tonalidad = 'C', clave = 'treble', unidad = '1/4' } = configuracion;

  // ¿Trae voces (V:) y cuántas manos? Una mano puede tener dos voces (bajo
  // sostenido + arpegio), así que "a dos manos" se decide por pentagramas.
  const conVoces = /^V:/m.test(notas) || notas.includes('%%staves');
  const grupos = gruposPorMano(notas);
  const isMultiVoice = conVoces && grupos.length > 1;

  // Mano a practicar. En piezas de una sola mano no hay selector (directo).
  const [mano, setMano] = useState(isMultiVoice ? null : 'ambas');
  const [terminado, setTerminado] = useState(false);

  // Construye el ABC final: un pentagrama sin voces, o con voces (grand staff,
  // o una mano de dos voces).
  const construirAbc = (notasStr, claveStr, multi) => {
    if (multi) {
      // Multi-voz: juntar líneas de notas dentro de cada voz para evitar que
      // abcjs haga salto de sistema. Preservar \n antes de directivas (V:, %%).
      const lines = notasStr.split('\n').map(l => l.trim()).filter(l => l);
      const processed = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isDirective = line.startsWith('V:') || line.startsWith('%%');
        const prevIsDirective = i > 0 && (lines[i - 1].startsWith('V:') || lines[i - 1].startsWith('%%'));
        if (isDirective || prevIsDirective || processed.length === 0) {
          processed.push(line);
        } else {
          processed[processed.length - 1] += ' ' + line;
        }
      }
      const processedNotas = processed.join('\n');
      const header = ['X:1', `T:${titulo}`, `M:${compas}`, `L:${unidad}`].join('\n');
      // Solo cuenta un campo K: en su propia línea. Un cambio de clave en línea
      // (`[K:clef=treble]`) también contiene "K:", y con `includes` se dejaba de
      // insertar la tonalidad: en una pieza en Sol se perdía el Fa# de la armadura.
      // El K: va antes de la PRIMERA voz: la mano izquierda sola empieza en V:2 (o V:3).
      const notasWithKey = /^K:/m.test(processedNotas)
        ? processedNotas
        : processedNotas.replace(/^V:/m, `K:${tonalidad}\nV:`);
      return header + '\n' + notasWithKey;
    }
    return [
      'X:1',
      `T:${titulo}`,
      `M:${compas}`,
      `L:${unidad}`,
      `K:${tonalidad} clef=${claveStr}`,
      notasStr,
    ].join('\n');
  };

  // Selecciona la mano elegida y arma el ABC. `multi` = dos pentagramas (layout
  // de grand staff); una mano sola es un pentagrama aunque traiga dos voces.
  const armarParaMano = () => {
    if (mano === 'ambas' || !isMultiVoice) {
      return { abc: construirAbc(notas, clave, conVoces), multi: isMultiVoice };
    }
    const m = extraerMano(notas, grupos[mano === 'derecha' ? 0 : 1]);
    return { abc: construirAbc(m.notas, m.clave, m.conVoces), multi: false };
  };

  const handleTerminar = () => setTerminado(true);
  const volverAlSelector = () => { setTerminado(false); setMano(null); };

  // ─── Selector de manos (solo piezas a dos manos, antes de tocar) ───
  if (isMultiVoice && mano === null) {
    return (
      <div className="pp-selector">
        <div className="pp-selector-header">
          <h3>🎹 {titulo}</h3>
          {autor && <p className="pp-selector-autor">{autor}</p>}
        </div>
        <p className="pp-selector-pregunta">¿Cómo quieres practicar?</p>
        <div className="pp-selector-botones">
          <button className="pp-mano-btn pp-mano-der" onClick={() => setMano('derecha')}>
            <span className="pp-mano-emoji">🎼</span>
            <span className="pp-mano-titulo">Mano derecha</span>
            <span className="pp-mano-sub">clave de Sol</span>
          </button>
          <button className="pp-mano-btn pp-mano-izq" onClick={() => setMano('izquierda')}>
            <span className="pp-mano-emoji">🎵</span>
            <span className="pp-mano-titulo">Mano izquierda</span>
            <span className="pp-mano-sub">clave de Fa</span>
          </button>
          <button className="pp-mano-btn pp-mano-ambas" onClick={() => setMano('ambas')}>
            <span className="pp-mano-emoji">🙌</span>
            <span className="pp-mano-titulo">Dos manos</span>
            <span className="pp-mano-sub">juntas</span>
          </button>
        </div>
        {onEstadoPieza && (
          <EstadoPieza estado={estadoPieza} onCambiar={onEstadoPieza} pregunta="Mi avance en esta pieza" />
        )}
      </div>
    );
  }

  // ─── Pantalla de completado ───
  if (terminado) {
    const etiquetaMano = mano === 'derecha' ? 'mano derecha'
      : mano === 'izquierda' ? 'mano izquierda' : null;
    return (
      <div style={styles.completado}>
        <div style={styles.completadoEmoji}>🎶</div>
        <h3 style={styles.completadoTitulo}>
          {onEstadoPieza ? '¡Llegaste al final!' : '¡Canción completada!'}
        </h3>
        <p style={styles.completadoTexto}>
          ¡Muy bien practicando "{titulo}"{etiquetaMano ? ` con la ${etiquetaMano}` : ''}!
        </p>
        {dificultad && (
          <span style={styles.badge}>{dificultad}</span>
        )}
        {onEstadoPieza ? (
          <>
            <EstadoPieza estado={estadoPieza} onCambiar={onEstadoPieza} pregunta="¿Cómo vas con esta pieza?" />
            {estadoPieza === 'completado' && <p className="pp-estado-festejo">🎉 ¡Pieza dominada!</p>}
            <button onClick={() => setTerminado(false)} style={styles.otraManoBtn}>
              🔁 Tocar otra vez
            </button>
            {isMultiVoice && (
              <button onClick={volverAlSelector} style={styles.otraManoBtn}>
                🔄 Practicar otra mano
              </button>
            )}
          </>
        ) : (
          <>
            {isMultiVoice && (
              <button onClick={volverAlSelector} style={styles.otraManoBtn}>
                🔄 Practicar otra mano
              </button>
            )}
            <button onClick={onCompletar} style={styles.continuarBtn}>
              Continuar
            </button>
          </>
        )}
      </div>
    );
  }

  // ─── Teleprompter ───
  const { abc, multi } = armarParaMano();
  return (
    <>
      <MusicPrompter
        key={mano}
        abcNotation={abc}
        bpm={bpm}
        titulo={titulo}
        autor={autor}
        onTerminar={handleTerminar}
        multiVoice={multi}
        mano={mano || 'ambas'}
      />
      {onEstadoPieza && (
        <EstadoPieza estado={estadoPieza} onCambiar={onEstadoPieza} pregunta="Mi avance" />
      )}
    </>
  );
};

const styles = {
  completado: {
    textAlign: 'center',
    padding: '50px 20px',
  },
  completadoEmoji: {
    fontSize: '4rem',
    marginBottom: '12px',
  },
  completadoTitulo: {
    color: '#27ae60',
    fontSize: '1.5rem',
    marginBottom: '8px',
  },
  completadoTexto: {
    color: '#555',
    marginBottom: '20px',
    fontSize: '1.1rem',
  },
  badge: {
    display: 'inline-block',
    background: '#e8f4fd',
    color: '#2980b9',
    padding: '4px 14px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '700',
    marginBottom: '20px',
  },
  otraManoBtn: {
    display: 'block',
    margin: '0 auto 12px',
    padding: '12px 32px',
    border: '2px solid #8e44ad',
    borderRadius: '14px',
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    background: '#f4ecf7',
    color: '#6c3483',
  },
  continuarBtn: {
    display: 'block',
    margin: '0 auto',
    padding: '14px 40px',
    border: 'none',
    borderRadius: '14px',
    fontSize: '1.15rem',
    fontWeight: 700,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    color: '#fff',
    boxShadow: '0 4px 0 #1e8449',
    transition: 'all 0.15s',
  },
};

export default PianoPrompter;
