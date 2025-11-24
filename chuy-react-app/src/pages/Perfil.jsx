import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import { useNavigate } from 'react-router-dom';

const Perfil = () => {
  const { currentUser } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfile(currentUser?.uid);
  const navigate = useNavigate();

  const [nombreEditado, setNombreEditado] = useState('');
  const [avatarSeleccionado, setAvatarSeleccionado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Sincronizar estado local con el perfil cargado
  useEffect(() => {
    if (profile) {
      setNombreEditado(profile.nombre || currentUser.displayName || '');
      setAvatarSeleccionado(profile.avatar || ''); // Emoji por defecto
    }
  }, [profile, currentUser]);

  // Manejar el guardado del perfil
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!currentUser || !profile) return;

    try {
      setGuardando(true);
      setMensaje('');

      const profileRef = doc(db, 'profiles', currentUser.uid);
      await updateDoc(profileRef, {
        nombre: nombreEditado.trim(),
        avatar: avatarSeleccionado,
      });

      setMensaje('¡Perfil actualizado con éxito!');
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      setMensaje('Error al actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  // Lista de avatares (emojis)
  const avatares = ['😁', '🚀', '🌟', '🤓', '🦸', '🦉', '🦊', '🐻', '🐯', '🦄'];

  if (profileLoading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.5rem' }}>
          Cargando tu perfil...
        </div>
      </PageWrapper>
    );
  }

  // Si no hay perfil, redirigir o mostrar mensaje de error
  if (!profile || profileError) {
    return (
      <PageWrapper>
        <Header />
        <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
          <p>No se pudo cargar tu perfil. Asegúrate de estar logueado.</p>
          <button onClick={() => navigate('/dashboard')} style={{ marginTop: '20px' }}>
            Volver al Dashboard
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header />
      <div style={styles.container}>
        <h1> Mi Perfil</h1>
        <p style={styles.subtitle}>Personaliza tu aventura, {profile.nombre || 'súper explorador'}!</p>

        <form onSubmit={handleGuardarPerfil} style={styles.form}>
          <div style={styles.card}>
            <h3>Información Básica</h3>
            <div style={styles.inputGroup}>
              <label htmlFor="email">Correo</label>
              <input
                id="email"
                type="email"
                value={currentUser?.email || ''}
                disabled
                style={styles.inputDisabled}
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="nombre">Mi Nombre de Héroe</label>
              <input
                id="nombre"
                type="text"
                value={nombreEditado}
                onChange={(e) => setNombreEditado(e.target.value)}
                placeholder="Ej: Capitán Chuy"
                required
                style={styles.input}
                maxLength="20"
              />
            </div>
          </div>

          <div style={styles.card}>
            <h3>Mi Avatar</h3>
            <div style={styles.avatarGrid}>
              {avatares.map((avatar, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setAvatarSeleccionado(avatar)}
                  style={{
                    ...styles.avatarButton,
                    ...(avatarSeleccionado === avatar ? styles.avatarSelected : {}),
                  }}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
          
          <button type="submit" style={styles.saveButton} disabled={guardando}>
            {guardando ? 'Guardando...' : ' Guardar Cambios'}
          </button>
          {mensaje && <p style={styles.successMessage}>{mensaje}</p>}
        </form>
      </div>
    </PageWrapper>
  );
};

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '20px',
    color: '#333'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '1.1rem',
    color: '#555',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },
  card: {
    background: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '15px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },
  inputDisabled: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #eee',
    backgroundColor: '#f8f8f8',
    color: '#888',
    fontSize: '16px',
    cursor: 'not-allowed',
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '15px',
    marginTop: '15px',
  },
  avatarButton: {
    background: '#f0f4f8',
    border: '2px solid #ddd',
    borderRadius: '12px',
    padding: '20px',
    fontSize: '3rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    lineHeight: '1',
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    borderColor: '#3498db',
    boxShadow: '0 0 0 3px #3498db',
    transform: 'scale(1.1)',
  },
  saveButton: {
    padding: '15px 30px',
    background: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    marginTop: '20px',
    boxShadow: '0 4px 10px rgba(46, 204, 113, 0.3)',
    transition: 'all 0.2s ease',
  },
  saveButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 15px rgba(46, 204, 113, 0.4)',
  },
  successMessage: {
    textAlign: 'center',
    color: '#27ae60',
    fontWeight: 'bold',
    marginTop: '15px',
  },
};

export default Perfil;
