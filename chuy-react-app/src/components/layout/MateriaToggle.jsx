import React from 'react';
import './MateriaToggle.css';

// Para English usamos imagen de bandera (no emoji) porque Windows no soporta
// flag emojis nativamente. flagcdn.com sirve banderas reales gratis y publicas.
const materias = [
  { id: 'matematicas', emoji: '🔢', label: 'Mates', className: 'materia-mates' },
  { id: 'ingles', imagen: 'https://flagcdn.com/w40/gb.png', label: 'English', className: 'materia-english' },
  { id: 'piano', emoji: '🎹', label: 'Piano', className: 'materia-piano' },
  { id: 'ciencias', emoji: '🔬', label: 'Ciencias', className: 'materia-ciencias' },
  { id: 'dibujo', emoji: '🎨', label: 'Arte', className: 'materia-dibujo' },
  { id: 'geografia', emoji: '🌍', label: 'Geo', className: 'materia-geografia' },
];

const MateriaToggle = ({ materia, onChange }) => {
  return (
    <div className="materia-toggle">
      {materias.map(m => (
        <button
          key={m.id}
          className={`materia-btn ${m.className} ${materia === m.id ? 'active' : ''}`}
          onClick={() => onChange(m.id)}
        >
          {m.imagen ? (
            <img src={m.imagen} alt={m.label} className="materia-imagen" />
          ) : (
            <span className="materia-emoji">{m.emoji}</span>
          )}
          <span className="materia-label">{m.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MateriaToggle;
