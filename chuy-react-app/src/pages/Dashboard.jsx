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
  const { aventura, loading: aventuraLoading } = useAventuraDelDia();
  const navigate = useNavigate();
  const [tabActivo, setTabActivo] = useState('inicio');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

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

  // Calcular el progreso basado en misiones completadas
  const misionesCompletadas = profile?.misionesCompletadas?.length || 0;
  const totalMisiones = 10; // Por ahora un número fijo, luego lo calcularemos dinámicamente
  const porcentajeProgreso = totalMisiones > 0 
    ? Math.min((misionesCompletadas / totalMisiones) * 100, 100) 
    : 0;

  // Obtener últimos simulacros
  const ultimosSimulacros = profile?.simulacros 
    ? [...profile.simulacros].sort((a, b) => b.fecha?.seconds - a.fecha?.seconds).slice(0, 3)
    : [];

  // Mensaje de progreso motivacional
  const getMensajeProgreso = () => {
    if (porcentajeProgreso === 100) return " 🎉 ¡Completadas todas!";
    if (porcentajeProgreso >= 75) return " 🔥 ¡Casi ahí!";
    if (porcentajeProgreso >= 50) return " 💪 ¡A mitad de camino!";
    return "";
  };

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
        {/* Columna Principal: La Aventura del Día */}
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
                <p className="subtitulo-aventura">Tu aventura de hoy:</p>
              </div>
            )}
            <h2 className="widget-title">
              {aventura ? `🌟 ${aventura.titulo}` : '🌟 ¡La Aventura de Hoy te espera!'}
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

          {/* Widget de Calificaciones - Visible en logros */}
          <section className={`widget calificaciones-widget ${isMobile && tabActivo !== 'logros' ? 'hidden' : ''}`}>
            <h2 className="widget-title">🏆 Mis Logros</h2>
            
            {ultimosSimulacros.length > 0 ? (
              <ul className="calificaciones-lista">
                {ultimosSimulacros.map((sim, index) => (
                  <li key={index} className="calificacion-item">
                    <div className="calificacion-info">
                      <span className="calificacion-titulo">{sim.titulo}</span>
                      <span className="calificacion-fecha">
                        {new Date(sim.fecha?.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`calificacion-nota ${
                      sim.porcentaje >= 90 ? 'nota-excelente' : 
                      sim.porcentaje >= 70 ? 'nota-buena' : 'nota-regular'
                    }`}>
                      {sim.porcentaje}%
                      {sim.porcentaje === 100 && <span className="medalla-oro">🥇</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="sin-calificaciones">
                <p>¡Aún no has hecho simulacros!</p>
                <button 
                  className="boton-secundario" 
                  style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate('/boveda')}
                >
                  Ir a practicar 🚀
                </button>
              </div>
            )}
          </section>

          {/* Widget de Bóveda - Visible en explorar */}
          <section className={`widget portales-widget ${isMobile && tabActivo !== 'explorar' ? 'hidden' : ''}`}>
            <h2 className="widget-title">📚 Bóveda de Misiones</h2>
            <div className="grupo-botones">
              <button 
                className="boton-secundario" 
                onClick={() => navigate('/boveda')}
              >
                <span className="icono-portal">📅</span>
                <span>Aventuras Diarias</span>
              </button>
              <button 
                className="boton-secundario" 
                onClick={() => navigate('/boveda')}
              >
                <span className="icono-portal">📝</span>
                <span>Ver Simulacros</span>
              </button>
            </div>
          </section>

          {/* Widget de Categorías - Visible en explorar */}
          <section className={`widget categorias-widget ${isMobile && tabActivo !== 'explorar' ? 'hidden' : ''}`}>
            <h2 className="widget-title">🎯 Accesos Rápidos</h2>
            
            <div className="categorias-grid">
              <button 
                className="categoria-card geometria disabled" 
                disabled
                data-state="🔒 Nivel 5"
                title="Se desbloquea en Nivel 5"
              >
                <div className="categoria-icono">🧮</div>
                <span>Geometría</span>
              </button>
              
              <button 
                className="categoria-card constructores disabled" 
                disabled
                data-state="🔒 Nivel 5"
                title="Se desbloquea en Nivel 5"
              >
                <div className="categoria-icono">🏗️</div>
                <span>Constructores</span>
              </button>
              
              <button 
                className="categoria-card secuencias disabled" 
                disabled
                data-state="🔒 Nivel 5"
                title="Se desbloquea en Nivel 5"
              >
                <div className="categoria-icono">🔍</div>
                <span>Secuencias</span>
              </button>
              
              <button 
                className="categoria-card aventuras" 
                onClick={() => navigate('/boveda')}
              >
                <div className="categoria-icono">🌟</div>
                <span>Aventuras</span>
              </button>
              
              <button 
                className="categoria-card simulacros" 
                onClick={() => navigate('/boveda')}
              >
                <div className="categoria-icono">🏆</div>
                <span>Simulacros</span>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;

