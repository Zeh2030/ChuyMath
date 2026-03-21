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
        ) : tema === 'elegante' ? (
          <>
            <div className="dust d1"></div>
            <div className="dust d2"></div>
            <div className="dust d3"></div>
            <div className="dust d4"></div>
            <div className="dust d5"></div>
            <div className="dust d6"></div>
            <div className="dust d7"></div>
            <div className="dust d8"></div>
            <div className="dust d9"></div>
            <div className="dust d10"></div>
          </>
        ) : tema === 'pizarron' ? (
          <>
            <div className="chalk ch1">+</div>
            <div className="chalk ch2">÷</div>
            <div className="chalk ch3">π</div>
            <div className="chalk ch4">×</div>
            <div className="chalk ch5">=</div>
            <div className="chalk ch6">∑</div>
            <div className="chalk ch7">√</div>
            <div className="chalk ch8">∞</div>
            <div className="chalk ch9">%</div>
            <div className="chalk ch10">△</div>
            <div className="chalk ch11">∠</div>
            <div className="chalk ch12">½</div>
            <div className="chalk ch13">★</div>
            <div className="chalk ch14">?</div>
          </>
        ) : tema === 'princesa' ? (
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
