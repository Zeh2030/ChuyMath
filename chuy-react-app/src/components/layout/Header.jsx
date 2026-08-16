import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth.jsx';
import LogoutButton from '../ui/LogoutButton';
import { resolveActiveTab } from '../../utils/dashboardTabs';
import { PISTAS } from '../../data/musicaFondo';
import { encender, apagar, useMusicaFondo } from '../../utils/musicaFondo';
import './Header.css';

const Header = ({ title, subtitle }) => {
  const { currentUser, activeProfile, activeProfileId } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const enDashboard = location.pathname === '/dashboard';
  const activeTab = resolveActiveTab(searchParams);
  const esHoy = enDashboard && activeTab === 'hoy';
  const esExplorar = enDashboard && activeTab === 'explorar';
  const esPerfil = location.pathname === '/perfil';

  const musicaActiva = useMusicaFondo();
  const urlMusica = PISTAS[0]?.url;

  // Encender/apagar de forma SÍNCRONA dentro del clic: los navegadores solo
  // desbloquean el audio dentro del gesto del usuario, así que esperar al
  // viaje a Firestore haría que play() se rechazara. La escritura va después,
  // solo para recordar la preferencia.
  const alternarMusica = () => {
    const nuevoValor = !musicaActiva;
    if (nuevoValor) encender(urlMusica);
    else apagar();

    if (activeProfileId) {
      updateDoc(doc(db, 'profiles', activeProfileId), { musicaFondo: nuevoValor })
        .catch((error) => console.error('Error al guardar preferencia de música:', error));
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-text">
          <h1>{title || 'Centro de Mando de Chuy'}</h1>
          <p>
            {subtitle || (currentUser 
              ? `¡Bienvenido de nuevo, ${currentUser.displayName || 'súper explorador'}!`
              : '¡Bienvenido de nuevo, súper explorador!')}
          </p>
        </div>
        <div className="header-actions">
          {activeProfile && (
            <Link
              to="/elegir-perfil"
              className="nav-btn perfil-chip"
              style={{ backgroundColor: '#34495e', fontSize: '0.9rem' }}
              title="Cambiar de jugador"
            >
              <span style={{ fontSize: '1.15rem', marginRight: '4px' }}>{activeProfile.avatar || '🙂'}</span>
              {activeProfile.nombre}
            </Link>
          )}

          {!esHoy && (
            <Link to="/dashboard?tab=hoy" className="nav-btn dashboard-btn">
              🏠 Hoy
            </Link>
          )}

          {!esExplorar && (
            <Link to="/dashboard?tab=explorar" className="nav-btn boveda-btn">
              🔍 Explorar
            </Link>
          )}

          <Link to="/peques" className="nav-btn juegos-btn" style={{ backgroundColor: '#e67e22', fontSize: '0.9rem' }}>
            🧸 Juegos
          </Link>

          {/* Solo si ya hay una pista configurada: un botón que no suena confunde. */}
          {urlMusica && (
            <button
              type="button"
              onClick={alternarMusica}
              className="nav-btn musica-btn"
              title={musicaActiva ? 'Apagar la música' : 'Poner música de fondo'}
              aria-pressed={musicaActiva}
            >
              {musicaActiva ? '🎵 Música' : '🔇 Música'}
            </button>
          )}

          {!esPerfil && (
            <Link to="/perfil" className="nav-btn perfil-btn" style={{ backgroundColor: '#9b59b6', fontSize: '0.9rem' }}>
              👤 Mi Perfil
            </Link>
          )}

          {currentUser?.email === 'jesuscarrillog@gmail.com' && (
            <>
              <Link to="/admin/usuarios" className="nav-btn admin-btn" style={{ backgroundColor: '#3498db', fontSize: '0.9rem' }}>
                👥 Usuarios
              </Link>
              <Link to="/admin/migracion" className="nav-btn admin-btn" style={{ backgroundColor: '#95a5a6', fontSize: '0.9rem' }}>
                ⚙️ Migración
              </Link>
            </>
          )}

          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
