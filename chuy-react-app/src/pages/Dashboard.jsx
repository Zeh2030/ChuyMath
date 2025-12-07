import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfile.jsx';
import { useAventuraDelDia } from '../hooks/useAventuraDelDia.jsx';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import './Dashboard.css';
import './Dashboard.enhanced.css';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const { profile, loading: profileLoading } = useProfile(currentUser?.uid);
  const { aventura, loading: aventuraLoading } = useAventuraDelDia(currentUser?.uid);
  const navigate = useNavigate();
  const [tabActivo, setTabActivo] = useState('inicio');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [mostrarModalTrofeos, setMostrarModalTrofeos] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Función auxiliar para obtener el icono según el tipo de misión
  const getIconoTema = (tipo) => {
    const iconos = {
      'operaciones': '🔢',
      'secuencia': '🔍',
      'conteo-figuras': '💠',
      'opcion-multiple': '🌍',
      'numberblocks-dibujo': '🎨',
      'criptoaritmetica': '🍇',
      'geometria': '🧮',
      'balanza': '⚖️',
      'desarrollo-cubos': '🧊',
      'navegacion-mapa': '🗺️',
      'tablas-doble-entrada': '📊',
    };
    return iconos[tipo] || '⭐';
  };

  // Calcular el progreso basado en aventuras completadas
  const aventurasProgreso = profile?.aventurasProgreso || {};
  const aventurasCompletadas = Object.values(aventurasProgreso).filter(p => p.status === 'completado').length;
  const misionesCompletadas = aventurasCompletadas;
  const totalMisiones = Math.max(misionesCompletadas, 10); // placeholder seguro
  const porcentajeProgreso = totalMisiones > 0 
    ? Math.min((misionesCompletadas / totalMisiones) * 100, 100) 
    : 0;

  // Obtener últimos simulacros
  const ultimosSimulacros = profile?.simulacros 
    ? [...profile.simulacros].sort((a, b) => b.fecha?.seconds - a.fecha?.seconds).slice(0, 3)
    : [];

  // Obtener solo trofeos (100%)
  const trofeos = profile?.simulacros 
    ? [...profile.simulacros]
        .filter(sim => sim.porcentaje === 100)
        .sort((a, b) => b.fecha?.seconds - a.fecha?.seconds)
    : [];

  // Trofeo destacado (el más reciente)
  const trofeoDestacado = trofeos.length > 0 ? trofeos[0] : null;

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
  const getMensajeProgreso = () => {
    if (porcentajeProgreso === 100) return " 🎉 ¡Completadas todas!";
    if (porcentajeProgreso >= 75) return " 🔥 ¡Casi ahí!";
    if (porcentajeProgreso >= 50) return " 💪 ¡A mitad de camino!";
    return "";
  };

  // Tipos de juegos para accesos rápidos
  const tiposDeJuego = [
    { id: 'aventuras', emoji: '🎯', nombre: 'Aventuras', filtro: 'aventuras', disponible: true },
    { id: 'expediciones', emoji: '🚀', nombre: 'Expediciones', filtro: 'expediciones', disponible: true },
    { id: 'simulacros', emoji: '🏆', nombre: 'Simulacros', filtro: 'simulacros', disponible: true },
    { id: 'numberblocks', emoji: '🧱', nombre: 'Numberblocks', filtro: 'numberblocks-constructor', disponible: true },
    { id: 'kakooma', emoji: '🧠', nombre: 'Kakooma', filtro: 'kakooma', disponible: true },
    { id: 'conteo', emoji: '💠', nombre: 'Conteo', filtro: 'conteo-figuras', disponible: true },
    { id: 'secuencias', emoji: '🔢', nombre: 'Secuencias', filtro: 'secuencias', disponible: true },
    { id: 'detectives', emoji: '🔎', nombre: 'Detectives', filtro: 'tabla-doble-entrada', disponible: true },
    { id: 'operaciones', emoji: '➕', nombre: 'Operaciones', filtro: 'operaciones', disponible: true },
    { id: 'cripto', emoji: '🍇', nombre: 'Cripto', filtro: 'criptoaritmetica', disponible: true },
    { id: 'balanza', emoji: '⚖️', nombre: 'Balanza', filtro: 'balanza-logica', disponible: true },
    { id: 'cubos', emoji: '🧊', nombre: 'Cubos', filtro: 'desarrollo-cubos', disponible: true }
  ];

  if (profileLoading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.5rem' }}>
          Cargando tu perfil...
        </div>
      </PageWrapper>
    );
  }

  // Si no hay perfil (no estaba en whitelist), mostrar acceso denegado
  if (!profile && !profileLoading) {
    return (
      <PageWrapper>
        <Header />
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          maxWidth: '600px', 
          margin: '0 auto',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</h1>
          <h2 style={{ color: '#e74c3c', marginBottom: '15px' }}>Acceso Restringido</h2>
          <p style={{ fontSize: '1.1rem', color: '#7f8c8d', marginBottom: '20px' }}>
            Tu cuenta <strong>{currentUser?.email}</strong> no tiene un perfil activo.
          </p>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '25px' }}>
            <p style={{ margin: 0 }}>
              Para jugar, pide a <strong>jesuscarrillog@gmail.com</strong> que te registre en la lista de acceso.
            </p>
          </div>
          <button 
            className="boton-secundario"
            style={{ margin: '0 auto', justifyContent: 'center' }}
            onClick={() => logout()} 
          >
            Cerrar Sesión
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header title={profile?.nombre ? `Centro de Mando de ${profile.nombre}` : 'Centro de Mando de Chuy'} subtitle={`¡Bienvenido de nuevo, ${profile?.nombre || 'súper explorador'}!`} />

      {/* Tabs móvil */}
      {isMobile && (
        <div className="dashboard-tabs">
          <button 
            className={`dashboard-tab ${tabActivo === 'inicio' ? 'active' : ''}`}
            onClick={() => setTabActivo('inicio')}
          >
            🏠 Inicio
          </button>
          <button 
            className={`dashboard-tab ${tabActivo === 'logros' ? 'active' : ''}`}
            onClick={() => setTabActivo('logros')}
          >
            🏆 Logros
          </button>
          <button 
            className={`dashboard-tab ${tabActivo === 'explorar' ? 'active' : ''}`}
            onClick={() => setTabActivo('explorar')}
          >
            🔍 Explorar
          </button>
        </div>
      )}

      <div className={`dashboard-grid ${isMobile ? 'dashboard-mobile' : ''}`}>
        {/* Columna Principal: Próxima Aventura (Progresión Cronológica) */}
        <main className={`main-column dashboard-section ${!isMobile || tabActivo === 'inicio' ? 'active' : ''}`}>
          <section className="widget aventura-widget" style={{ borderTopColor: getColorDelDia() }}>
            {/* Header personalizado */}
            {profile?.nombre && (
              <div className="aventura-header-personalizado">
                {profile?.avatar ? (
                  <div className="avatar-grande" style={{ 
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem'
                  }}>
                    {profile.avatar}
                  </div>
                ) : (
                  <div className="avatar-grande" style={{ 
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem'
                  }}>
                    {profile.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2>¡Hola, {profile.nombre}! 👋</h2>
                <p className="subtitulo-aventura">Tu próximo desafío:</p>
              </div>
            )}
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
                      <span className="icono-reto">{getIconoTema(mision.tipo)}</span>
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
                    ¡Perfecto momento para explorar la Bóveda o jugar con el Constructor!
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
        <aside className={`sidebar-column dashboard-section ${!isMobile || tabActivo === 'logros' || tabActivo === 'explorar' ? 'active' : ''}`}>
          {/* Widget de Progreso - Visible en inicio y logros */}
          <section className={`widget trofeos-widget ${isMobile && tabActivo !== 'inicio' && tabActivo !== 'logros' ? 'hidden' : ''}`}>
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
                {misionesCompletadas} / {totalMisiones} aventuras{getMensajeProgreso()}
              </div>
            </div>
          </section>

          {/* Widget de Trofeos - Visible en logros */}
          <section className={`widget trofeos-widget-nuevo ${isMobile && tabActivo !== 'logros' ? 'hidden' : ''}`}>
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
                  onClick={() => navigate('/boveda')}
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

          {/* Widget de Exploración - Accesos Rápidos a Tipos de Juegos */}
          <section className={`widget exploracion-widget ${isMobile && tabActivo !== 'explorar' ? 'hidden' : ''}`}>
            <h2 className="widget-title">⚡ Accesos Rápidos</h2>
            <div className="accesos-rapidos-mini-grid">
              {tiposDeJuego.map((tipo) => (
                <button 
                  key={tipo.id}
                  className={`acceso-rapido-mini ${!tipo.disponible ? 'disabled' : ''}`}
                  onClick={() => tipo.disponible && navigate(`/boveda?filtro=${tipo.filtro}`)}
                  disabled={!tipo.disponible}
                  title={tipo.disponible ? `Ver ${tipo.nombre.toLowerCase()}` : 'Próximamente disponible'}
                >
                  <span className="acceso-emoji">{tipo.emoji}</span>
                  <span className="acceso-nombre">{tipo.nombre}</span>
                  {!tipo.disponible && <span className="acceso-candado">🔒</span>}
                </button>
              ))}
            </div>
          </section>

        </aside>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;

