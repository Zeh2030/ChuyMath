import React from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';

const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <button onClick={logout} style={styles.button}>
      Cerrar Sesión
    </button>
  );
};

const styles = {
  button: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
  },
  buttonHover: {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
};

export default LogoutButton;
