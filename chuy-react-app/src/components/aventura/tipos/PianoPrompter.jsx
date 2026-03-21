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

  // Construir notación ABC desde los datos estructurados
  const abcNotation = [
    'X:1',
    `T:${titulo}`,
    `M:${compas}`,
    'L:1/4',
    `K:${tonalidad} clef=${clave}`,
    notas,
  ].join('\n');

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
      abcNotation={abcNotation}
      bpm={bpm}
      titulo={titulo}
      autor={autor}
      onTerminar={handleTerminar}
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
