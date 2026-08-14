import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAventuraDelDia } from '../../hooks/useAventuraDelDia.jsx';
import { tiposJuegos } from '../../data/tiposJuegos';
import '../../pages/Dashboard.css';
import '../../pages/Dashboard.enhanced.css';

// Icono de cada misión, reutilizando el mismo catálogo materia+tipo que usa
// Mi Bóveda (así "Hoy" no se queda en la ⭐ genérica fuera de matemáticas).
const getIconoMision = (tipo, materia) => {
  const match = tiposJuegos.find(t => t.tipo === tipo && t.materia === materia)
    || tiposJuegos.find(t => t.tipo === tipo);
  return match?.emoji || '⭐';
};

// Obtener color del día
const getColorDelDia = () => {
  const dia = new Date().getDay();
  const colores = [
    'var(--color-tema-domingo)',
    'var(--color-tema-lunes)',
    'var(--color-tema-martes)',
    'var(--color-tema-miercoles)',
    'var(--color-tema-jueves)',
    'var(--color-tema-viernes)',
    'var(--color-tema-sabado)'
  ];
  return colores[dia];
};

// Formatear fecha relativa
const formatearFechaRelativa = (fechaSeconds) => {
  if (!fechaSeconds) return '';
  const fecha = new Date(fechaSeconds * 1000);
  const hoy = new Date();
  const diferenciaDias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));

  if (diferenciaDias === 0) return 'Hoy';
  if (diferenciaDias === 1) return 'Ayer';
  if (diferenciaDias < 7) return `Hace ${diferenciaDias} días`;
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

// Obtener medalla según posición
const obtenerMedalla = (index) => {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  return '🥉';
};

// Mensaje de progreso motivacional
const getMensajeProgreso = (porcentajeProgreso) => {
  if (porcentajeProgreso === 100) return " 🎉 ¡Completadas todas!";
  if (porcentajeProgreso >= 75) return " 🔥 ¡Casi ahí!";
  if (porcentajeProgreso >= 50) return " 💪 ¡A mitad de camino!";
  return "";
};

const HoyTab = ({ profile, materia, activeProfileId, onGoToExplorar }) => {
  const { aventura, loading: aventuraLoading } = useAventuraDelDia(activeProfileId, materia);
  const navigate = useNavigate();
  const [mostrarModalTrofeos, setMostrarModalTrofeos] = useState(false);

  // Calcular el progreso basado en aventuras completadas
  const aventurasProgreso = profile?.aventurasProgreso || {};
  const aventurasCompletadas = Object.values(aventurasProgreso).filter(p => p.status === 'completado').length;
  const misionesCompletadas = aventurasCompletadas;
  const totalMisiones = Math.max(misionesCompletadas, 10); // placeholder seguro
  const porcentajeProgreso = totalMisiones > 0
    ? Math.min((misionesCompletadas / totalMisiones) * 100, 100)
    : 0;

  // Obtener solo trofeos (100%)
  const trofeos = profile?.simulacros
    ? [...profile.simulacros]
        .filter(sim => sim.porcentaje === 100)
        .sort((a, b) => b.fecha?.seconds - a.fecha?.seconds)
    : [];

  // Trofeo destacado (el más reciente)
  const trofeoDestacado = trofeos.length > 0 ? trofeos[0] : null;

  return (
    <div className={`dashboard-grid`}>
      {/* Columna Principal: Próxima Aventura (Progresión Cronológica) */}
      <main className="main-column">
        <section className="widget aventura-widget" style={{ borderTopColor: getColorDelDia() }}>
          <h2 className="widget-title">
            {aventura ? `🌟 ${aventura.titulo}` : '🌟 ¡Tu próximo desafío te espera!'}
          </h2>

          {aventuraLoading ? (
            <div className="aventura-content">
              <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1.1rem' }}>
                Cargando aventura...
              </p>
            </div>
          ) : aventura ? (
            <>
              <ul className="lista-retos">
                {aventura.misiones?.map((mision) => (
                  <li key={mision.id}>
                    <span className="icono-reto">{getIconoMision(mision.tipo, materia)}</span>
                    <div className="detalles-reto">
                      <span className="titulo-reto">{mision.titulo}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                className="boton-principal"
                onClick={() => navigate(`/aventura/${aventura.id}`)}
              >
                ¡Empezar Aventura!
              </button>
            </>
          ) : (
            <>
              <div className="aventura-content">
                <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '1.1rem' }}>
                  No hay aventura disponible para hoy
                </p>
                <p style={{ textAlign: 'center', color: '#95a5a6', fontSize: '0.9rem', marginTop: '10px' }}>
                  ¡Perfecto momento para explorar la Bóveda!
                </p>
              </div>
              <button className="boton-principal" disabled>
                ¡Empezar Aventura!
              </button>
            </>
          )}
        </section>
      </main>

      {/* Columna Secundaria: Progreso y Portales */}
      <aside className="sidebar-column">
        {/* Widget de Progreso */}
        <section className="widget trofeos-widget">
          <h2 className="widget-title">🏆 Mi Rincón de Trofeos</h2>

          <div className="contador-racha">
            <div className="icono-racha">✨</div>
            <div className="texto-racha">
              <div className="numero-racha">{profile?.racha || 0}</div>
              <span>días de aventura seguidos</span>
            </div>
          </div>

          <div className="progreso-tesoro">
            <p>Progreso para el próximo tesoro:</p>
            <div className="barra-progreso">
              <div
                className="barra-progreso-fill"
                style={{ width: `${porcentajeProgreso}%` }}
              ></div>
            </div>
            <div className="progreso-texto">
              {misionesCompletadas} / {totalMisiones} aventuras{getMensajeProgreso(porcentajeProgreso)}
            </div>
          </div>
        </section>

        {/* Widget de Trofeos */}
        <section className="widget trofeos-widget-nuevo">
          <h2 className="widget-title">🏆 Mis Logros</h2>

          {trofeoDestacado ? (
            <>
              <div className="trofeo-destacado">
                <div className="trofeo-medalla-grande">🥇</div>
                <div className="trofeo-badge-100">100% COMPLETADO</div>
                <h3 className="trofeo-titulo">{trofeoDestacado.titulo}</h3>
                <p className="trofeo-fecha">{formatearFechaRelativa(trofeoDestacado.fecha?.seconds)}</p>
                <div className="trofeo-estrellas">⭐⭐⭐⭐⭐</div>
              </div>
              {trofeos.length > 1 && (
                <button
                  className="boton-ver-todos-trofeos"
                  onClick={() => setMostrarModalTrofeos(true)}
                >
                  Ver todos los Trofeos ({trofeos.length}) →
                </button>
              )}
            </>
          ) : (
            <div className="sin-trofeos">
              <div className="sin-trofeos-icono">🏆</div>
              <p>¡Aún no tienes trofeos!</p>
              <p className="sin-trofeos-subtitulo">Completa un simulacro al 100% para ganar tu primer trofeo</p>
              <button
                className="boton-secundario"
                style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}
                onClick={() => onGoToExplorar()}
              >
                Ir a practicar 🚀
              </button>
            </div>
          )}
        </section>

        {/* Modal de Trofeos */}
        {mostrarModalTrofeos && (
          <div className="modal-overlay" onClick={() => setMostrarModalTrofeos(false)}>
            <div className="modal-trofeos" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🏆 Mis Trofeos ({trofeos.length})</h2>
                <button
                  className="modal-cerrar"
                  onClick={() => setMostrarModalTrofeos(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-trofeos-grid">
                {trofeos.map((trofeo, index) => (
                  <div key={index} className="trofeo-card-modal">
                    <div className="trofeo-medalla-modal">{obtenerMedalla(index)}</div>
                    <div className="trofeo-badge-modal">100%</div>
                    <h4 className="trofeo-titulo-modal">{trofeo.titulo}</h4>
                    <p className="trofeo-fecha-modal">{formatearFechaRelativa(trofeo.fecha?.seconds)}</p>
                    <div className="trofeo-estrellas-modal">⭐⭐⭐⭐⭐</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default HoyTab;
