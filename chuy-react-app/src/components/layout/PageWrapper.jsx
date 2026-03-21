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
        ) : tema === 'oceano' ? (
          <>
            <div className="bubble b1"></div>
            <div className="bubble b2"></div>
            <div className="bubble b3"></div>
            <div className="bubble b4"></div>
            <div className="bubble b5"></div>
            <div className="bubble b6"></div>
            <div className="bubble b7"></div>
          </>
        ) : tema === 'espacial' ? (
          <>
            <div className="star st1"></div>
            <div className="star st2"></div>
            <div className="star st3"></div>
            <div className="star st4"></div>
            <div className="star st5"></div>
            <div className="star st6"></div>
            <div className="star st7"></div>
            <div className="star st8"></div>
            <div className="star st9"></div>
            <div className="star st10"></div>
            <div className="planet"></div>
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
