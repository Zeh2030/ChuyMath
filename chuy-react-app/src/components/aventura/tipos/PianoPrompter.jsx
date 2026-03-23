import React, { useState } from 'react';
import MusicPrompter from './MusicPrompter';

const PianoPrompter = ({ mision, onCompletar }) => {
  const [terminado, setTerminado] = useState(false);

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

  // Construir notación ABC desde los datos estructurados
  let finalAbc;
  if (isMultiVoice) {
    // Procesar notas multi-voz: juntar líneas dentro de cada voz para evitar
    // que abcjs haga salto de sistema en medio de una voz.
    // Solo preservar \n antes de directivas (V:, %%)
    const processedNotas = notas
      .split('\n')
      .reduce((acc, line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('V:') || trimmed.startsWith('%%')) {
          acc.push(trimmed);
        } else if (acc.length > 0) {
          // Agregar a la línea anterior con espacio
          acc[acc.length - 1] += ' ' + trimmed;
        } else {
          acc.push(trimmed);
        }
        return acc;
      }, [])
      .join('\n');

    const header = [
      'X:1',
      `T:${titulo}`,
      `M:${compas}`,
      'L:1/4',
    ].join('\n');

    // Insertar K: antes de V:1 si no está en notas
    const notasWithKey = processedNotas.includes('K:')
      ? processedNotas
      : processedNotas.replace(/(V:1)/, `K:${tonalidad}\n$1`);

    finalAbc = header + '\n' + notasWithKey;
  } else {
    finalAbc = [
      'X:1',
      `T:${titulo}`,
      `M:${compas}`,
      'L:1/4',
      `K:${tonalidad} clef=${clave}`,
      notas,
    ].join('\n');
  }

  const handleTerminar = () => {
    setTerminado(true);
  };

  // Pantalla de completado
  if (terminado) {
    return (
      <div style={styles.completado}>
        <div style={styles.completadoEmoji}>🎶</div>
        <h3 style={styles.completadoTitulo}>¡Canción completada!</h3>
        <p style={styles.completadoTexto}>
          ¡Muy bien practicando "{titulo}"!
        </p>
        {dificultad && (
          <span style={styles.badge}>{dificultad}</span>
        )}
        <button onClick={onCompletar} style={styles.continuarBtn}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <MusicPrompter
      abcNotation={finalAbc}
      bpm={bpm}
      titulo={titulo}
      autor={autor}
      onTerminar={handleTerminar}
      multiVoice={isMultiVoice}
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
  continuarBtn: {
    display: 'block',
    margin: '20px auto 0',
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
