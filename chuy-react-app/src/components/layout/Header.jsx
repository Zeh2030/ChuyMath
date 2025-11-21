import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import LogoutButton from '../ui/LogoutButton';
import './Header.css';

const Header = ({ title, subtitle }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const esDashboard = location.pathname === '/dashboard';
  const esBoveda = location.pathname === '/boveda';

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
          {!esDashboard && (
            <Link to="/dashboard" className="nav-btn dashboard-btn">
              🏠 Dashboard
            </Link>
          )}
          
          {!esBoveda && (
            <Link to="/boveda" className="nav-btn boveda-btn">
              📚 Bóveda
            </Link>
          )}

          <Link to="/admin/migracion" className="nav-btn admin-btn" style={{ backgroundColor: '#95a5a6', fontSize: '0.9rem' }}>
            ⚙️ Admin
          </Link>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
