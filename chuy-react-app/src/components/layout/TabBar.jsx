import React from 'react';
import './TabBar.css';

// Selector de pestañas genérico y reutilizable. Antes Dashboard y Bóveda
// reimplementaban cada una su propio switcher de pestañas por separado.
const TabBar = ({ tabs, active, onChange }) => {
  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
