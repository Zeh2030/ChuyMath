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
        {tema === 'explorador' ? (
          <>
            <div className="leaf l1">🍃</div>
            <div className="leaf l2">🍂</div>
            <div className="leaf l3">🍃</div>
            <div className="leaf l4">🍂</div>
            <div className="leaf l5">🍃</div>
          </>
        ) : tema === 'selva' ? (
          <>
            <div className="butterfly bf1">🦋</div>
            <div className="butterfly bf2">🦋</div>
            <div className="butterfly bf3">🦋</div>
            <div className="butterfly bf4">🦋</div>
            <div className="butterfly bf5">🦋</div>
          </>
        ) : tema === 'arcoiris' ? (
          <>
            <div className="rainbow-bubble rb1"></div>
            <div className="rainbow-bubble rb2"></div>
            <div className="rainbow-bubble rb3"></div>
            <div className="rainbow-bubble rb4"></div>
            <div className="rainbow-bubble rb5"></div>
            <div className="rainbow-bubble rb6"></div>
          </>
        ) : tema === 'neutro' ? null
        : tema === 'princesa' ? (
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
            <div className="bubble b8"></div>
            <div className="bubble b9"></div>
            <div className="bubble b10"></div>
            <div className="bubble b11"></div>
            <div className="bubble b12"></div>
            <div className="bubble b13"></div>
            <div className="bubble b14"></div>
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
