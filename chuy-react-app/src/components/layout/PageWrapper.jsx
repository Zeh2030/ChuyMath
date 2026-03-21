import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import './PageWrapper.css';

const PageWrapper = ({ children }) => {
  const { currentUser } = useAuth();
  const { profile } = useProfile(currentUser?.uid);
  const tema = profile?.tema || 'aventurero';

  return (
    <div data-theme={tema}>
      {/* Fondo animado */}
      <div className={`background-sky bg-${tema}`}>
        {tema === 'princesa' ? (
          <>
            <div className="sparkle s1"></div>
            <div className="sparkle s2"></div>
            <div className="sparkle s3"></div>
            <div className="sparkle s4"></div>
            <div className="sparkle s5"></div>
            <div className="sparkle s6"></div>
          </>
        ) : (
          <>
            <div className="cloud c1"></div>
            <div className="cloud c2"></div>
            <div className="cloud c3"></div>
          </>
        )}
      </div>

      {/* Contenedor principal */}
      <div className="main-container">
        {children}
      </div>
    </div>
  );
};

export default PageWrapper;
