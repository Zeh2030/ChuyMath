import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfile.jsx';
import { useAventuraDelDia } from '../hooks/useAventuraDelDia.jsx';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { profile, loading: profileLoading } = useProfile(currentUser?.uid);
  const { aventura, loading: aventuraLoading } = useAventuraDelDia();
  const navigate = useNavigate();

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

  return (
    <PageWrapper>
      <Header />

      <div className="dashboard-grid">
        {/* Columna Principal: La Aventura del Día */}
        <main className="main-column">
          <section className="widget aventura-widget">
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
                {misionesCompletadas} / {totalMisiones} aventuras{getMensajeProgreso()}
              </div>
            </div>
          </section>

          {/* Widget de Bóveda */}
          <section className="widget portales-widget">
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

          {/* Widget de Calificaciones */}
          <section className="widget calificaciones-widget">
            <h2 className="widget-title">📝 Mis Notas</h2>
            
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

          {/* Widget de Categorías */}
          <section className="widget categorias-widget">
            <h2 className="widget-title">🎯 Accesos Rápidos</h2>
            
            <div className="categorias-grid">
              <button className="categoria-card geometria" disabled>
                <div className="categoria-icono">🧮</div>
                <span>Geometría</span>
              </button>
              
              <button className="categoria-card constructores" disabled>
                <div className="categoria-icono">🏗️</div>
                <span>Constructores</span>
              </button>
              
              <button className="categoria-card secuencias" disabled>
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

