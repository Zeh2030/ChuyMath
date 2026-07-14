import React, { useState } from 'react';
import MusicPrompter from './MusicPrompter';
import './PianoPrompter.css';

/**
 * Extrae las líneas de notas de una voz (V:1 / V:2) de un ABC multi-voz.
 * Robusto a que una voz ocupe varias líneas o traiga la clef en su declaración.
 * Devuelve { notas, clave } para armar una pieza de UN solo pentagrama.
 */
const extraerVoz = (notas, vozNum) => {
  const lines = notas.split('\n').map(l => l.trim()).filter(Boolean);
  const buckets = {};
  const claves = {};
  let current = null;
  for (const line of lines) {
    if (line.startsWith('%%')) continue; // %%staves y otras directivas globales
    const vm = line.match(/^V:\s*(\d+)(.*)$/);
    if (vm) {
      current = vm[1];
      if (!buckets[current]) buckets[current] = [];
      const clefMatch = vm[2].match(/clef=(\S+)/);
      if (clefMatch) claves[current] = clefMatch[1];
      // Notas en la misma línea después del "V:x clef=..." (raro, pero por si acaso)
      const resto = vm[2].replace(/clef=\S+/, '').trim();
      if (resto) buckets[current].push(resto);
      continue;
    }
    if (current) buckets[current].push(line);
  }
  return {
    notas: (buckets[vozNum] || []).join(' '),
    clave: claves[vozNum] || (vozNum === '2' ? 'bass' : 'treble'),
  };
};

const PianoPrompter = ({ mision, onCompletar }) => {
  // Extraer datos de la misión
  const {
    titulo = 'Sin título',
    autor = '',
    bpm = 80,
    dificultad = '',
    configuracion = {},
    notas = '',
  } = mision;

  const { compas = '4/4', tonalidad = 'C', clave = 'treble' } = configuracion;

  // Detectar si es multi-voz (contiene V: o %%staves)
  const isMultiVoice = notas.includes('V:') || notas.includes('%%staves');

  // Mano a practicar. En piezas de una sola voz no hay selector (directo).
  const [mano, setMano] = useState(isMultiVoice ? null : 'ambas');
  const [terminado, setTerminado] = useState(false);

  // Construye el ABC final para una voz (single-staff) o el grand staff completo.
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
      const header = ['X:1', `T:${titulo}`, `M:${compas}`, 'L:1/4'].join('\n');
      const notasWithKey = processedNotas.includes('K:')
        ? processedNotas
        : processedNotas.replace(/(V:1)/, `K:${tonalidad}\n$1`);
      return header + '\n' + notasWithKey;
    }
    return [
      'X:1',
      `T:${titulo}`,
      `M:${compas}`,
      'L:1/4',
      `K:${tonalidad} clef=${claveStr}`,
      notasStr,
    ].join('\n');
  };

  // Selecciona la voz según la mano elegida y arma el ABC.
  const armarParaMano = () => {
    if (mano === 'ambas' || !isMultiVoice) {
      return { abc: construirAbc(notas, clave, isMultiVoice), multi: isMultiVoice };
    }
    const voz = mano === 'derecha' ? extraerVoz(notas, '1') : extraerVoz(notas, '2');
    return { abc: construirAbc(voz.notas, voz.clave, false), multi: false };
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
        <h3 style={styles.completadoTitulo}>¡Canción completada!</h3>
        <p style={styles.completadoTexto}>
          ¡Muy bien practicando "{titulo}"{etiquetaMano ? ` con la ${etiquetaMano}` : ''}!
        </p>
        {dificultad && (
          <span style={styles.badge}>{dificultad}</span>
        )}
        {isMultiVoice && (
          <button onClick={volverAlSelector} style={styles.otraManoBtn}>
            🔄 Practicar otra mano
          </button>
        )}
        <button onClick={onCompletar} style={styles.continuarBtn}>
          Continuar
        </button>
      </div>
    );
  }

  // ─── Teleprompter ───
  const { abc, multi } = armarParaMano();
  return (
    <MusicPrompter
      key={mano}
      abcNotation={abc}
      bpm={bpm}
      titulo={titulo}
      autor={autor}
      onTerminar={handleTerminar}
      multiVoice={multi}
    />
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
