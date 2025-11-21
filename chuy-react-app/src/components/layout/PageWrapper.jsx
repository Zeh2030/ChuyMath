import React from 'react';
import './PageWrapper.css';

const PageWrapper = ({ children }) => {
  return (
    <>
      {/* Fondo animado con nubes */}
      <div className="background-sky">
        <div className="cloud c1"></div>
        <div className="cloud c2"></div>
        <div className="cloud c3"></div>
      </div>

      {/* Contenedor principal */}
      <div className="main-container">
        {children}
      </div>
    </>
  );
};

export default PageWrapper;

