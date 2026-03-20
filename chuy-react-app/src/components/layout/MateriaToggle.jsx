import React from 'react';
import './MateriaToggle.css';

const MateriaToggle = ({ materia, onChange }) => {
  return (
    <div className="materia-toggle">
      <button
        className={`materia-btn materia-mates ${materia === 'matematicas' ? 'active' : ''}`}
        onClick={() => onChange('matematicas')}
      >
        <span className="materia-emoji">🔢</span>
        <span className="materia-label">Mates</span>
      </button>
      <button
        className={`materia-btn materia-english ${materia === 'ingles' ? 'active' : ''}`}
        onClick={() => onChange('ingles')}
      >
        <span className="materia-emoji">🇬🇧</span>
        <span className="materia-label">English</span>
      </button>
    </div>
  );
};

export default MateriaToggle;
