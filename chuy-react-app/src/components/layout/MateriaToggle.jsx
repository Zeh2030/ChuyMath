import React from 'react';
import './MateriaToggle.css';

const materias = [
  { id: 'matematicas', emoji: '🔢', label: 'Mates', className: 'materia-mates' },
  { id: 'ingles', emoji: '🇬🇧', label: 'English', className: 'materia-english' },
  { id: 'piano', emoji: '🎹', label: 'Piano', className: 'materia-piano' },
  { id: 'ciencias', emoji: '🔬', label: 'Ciencias', className: 'materia-ciencias' },
  { id: 'dibujo', emoji: '🎨', label: 'Arte', className: 'materia-dibujo' },
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
          <span className="materia-emoji">{m.emoji}</span>
          <span className="materia-label">{m.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MateriaToggle;
