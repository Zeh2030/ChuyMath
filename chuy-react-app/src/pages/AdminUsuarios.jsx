import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import { useNavigate } from 'react-router-dom';

const AdminUsuarios = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [nombreNino, setNombreNino] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');

  // Solo permitir acceso a jesuscarrillog@gmail.com
  useEffect(() => {
    if (currentUser && currentUser.email !== 'jesuscarrillog@gmail.com') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Cargar lista blanca actual
  const cargarUsuarios = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'whitelist'));
      const lista = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(lista);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.email === 'jesuscarrillog@gmail.com') {
      cargarUsuarios();
    }
  }, [currentUser]);

  const handleAgregarUsuario = async (e) => {
    e.preventDefault();
    if (!email || !nombreNino) return;

    try {
      setLoading(true);
      // Guardar en whitelist usando el email como ID para búsqueda rápida
      await setDoc(doc(db, 'whitelist', email.toLowerCase().trim()), {
        email: email.toLowerCase().trim(),
        nombreNino: nombreNino.trim(),
        fechaRegistro: new Date().toISOString(),
        registradoPor: currentUser.email
      });
      
      setMensaje(`Usuario ${nombreNino} (${email}) autorizado correctamente.`);
      setEmail('');
      setNombreNino('');
      cargarUsuarios(); // Recargar lista
    } catch (error) {
      console.error("Error al agregar usuario:", error);
      setMensaje("Error al agregar usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (emailToDelete) => {
    if (window.confirm(`¿Seguro que quieres revocar acceso a ${emailToDelete}?`)) {
      try {
        await deleteDoc(doc(db, 'whitelist', emailToDelete));
        cargarUsuarios();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  if (loading && usuarios.length === 0) return <div>Cargando panel de admin...</div>;

  return (
    <PageWrapper>
      <Header />
      <div style={styles.container}>
        <h1>🛡️ Panel de Control de Usuarios</h1>
        <p>Solo tú puedes ver esto. Agrega niños permitidos.</p>

        <div style={styles.formCard}>
          <h3>Nuevo Usuario</h3>
          <form onSubmit={handleAgregarUsuario} style={styles.form}>
            <div style={styles.inputGroup}>
              <label>Correo de Google (Papá/Mamá)</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label>Nombre del Niño (para el juego)</label>
              <input 
                type="text" 
                value={nombreNino}
                onChange={(e) => setNombreNino(e.target.value)}
                placeholder="Ej: Chuyito"
                required
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Guardando...' : 'Autorizar Acceso'}
            </button>
          </form>
          {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
        </div>

        <div style={styles.listCard}>
          <h3>Usuarios Autorizados ({usuarios.length})</h3>
          <ul style={styles.list}>
            {usuarios.map(user => (
              <li key={user.id} style={styles.listItem}>
                <div>
                  <strong>{user.nombreNino}</strong>
                  <br/>
                  <small>{user.email}</small>
                </div>
                <button 
                  onClick={() => handleEliminar(user.id)}
                  style={styles.deleteBtn}
                >
                  Revocar
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageWrapper>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    color: '#333'
  },
  formCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px'
  },
  button: {
    padding: '12px',
    background: '#2ecc71',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  mensaje: {
    color: '#27ae60',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  listCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  list: {
    listStyle: 'none',
    padding: 0
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: '1px solid #eee'
  },
  deleteBtn: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer'
  }
};

export default AdminUsuarios;

