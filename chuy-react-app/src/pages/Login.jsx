import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { currentUser, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !loading) {
      // Si el usuario ya está autenticado y no estamos cargando, redirige al dashboard
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌟 El Mundo de Chuy 🌟</h1>
      <p style={styles.subtitle}>Inicia sesión para comenzar tu aventura</p>
      <button onClick={signInWithGoogle} style={styles.button}>
        Iniciar Sesión con Google
      </button>
      {loading && <p style={styles.loadingText}>Cargando...</p>}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#667eea', // Gradient background from original
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontFamily: "'Nunito', sans-serif",
  },
  title: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: '2.5rem',
    marginBottom: '20px',
  },
  subtitle: {
    fontSize: '1.2rem',
    marginBottom: '30px',
  },
  button: {
    backgroundColor: '#f1c40f',
    color: '#34495e',
    padding: '15px 30px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
  },
  buttonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
  },
  loadingText: {
    marginTop: '20px',
    fontSize: '1rem',
  },
};

export default Login;
