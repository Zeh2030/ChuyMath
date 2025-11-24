import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import './Boveda.css';

const Boveda = () => {
  const { currentUser } = useAuth();
  const { profile } = useProfile(currentUser?.uid);
  const [aventuras, setAventuras] = useState([]);
  const [simulacros, setSimulacros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'aventuras', 'simulacros'
  const [tabActivo, setTabActivo] = useState('accesos'); // 'accesos' o 'boveda'

  // Definir tipos de juegos disponibles
  const tiposJuegos = [
    { id: 'aventuras', emoji: '🎯', nombre: 'Aventuras Diarias', tipo: 'aventura', descripcion: 'Aventuras diarias' },
    { id: 'simulacros', emoji: '🏆', nombre: 'Simulacros', tipo: 'simulacro', descripcion: 'Exámenes completos' },
    { id: 'secuencias', emoji: '🔍', nombre: 'Secuencias', tipo: 'secuencia', descripcion: 'Patrones y secuencias' },
    { id: 'operaciones', emoji: '🔢', nombre: 'Operaciones', tipo: 'operaciones', descripcion: 'Matemáticas' },
    { id: 'criptoaritmetica', emoji: '🍇', nombre: 'Criptoaritmetica', tipo: 'criptoaritmetica', descripcion: 'Acertijos matemáticos' },
    { id: 'balanza', emoji: '⚖️', nombre: 'Balanza Lógica', tipo: 'balanza-logica', descripcion: 'Lógica y equilibrio' },
    { id: 'cubos', emoji: '🧊', nombre: 'Desarrollo de Cubos', tipo: 'desarrollo-cubos', descripcion: 'Espacios 3D' },
    { id: 'palabras', emoji: '📝', nombre: 'Palabra del Día', tipo: 'palabra-del-dia', descripcion: 'Vocabulario' }
  ];

  useEffect(() => {
    const cargarContenido = async () => {
      try {
        setLoading(true);
        
        // Cargar Aventuras
        const aventurasRef = collection(db, 'aventuras');
        // Intentar ordenar por fecha (ID) descendente si es posible, sino traer todo
        const aventurasSnapshot = await getDocs(aventurasRef);
        const listaAventuras = aventurasSnapshot.docs.map(doc => ({
          id: doc.id,
          tipo: 'aventura',
          ...doc.data()
        })).sort((a, b) => b.id.localeCompare(a.id)); // Ordenar por fecha descendente

        // Cargar Simulacros
        const simulacrosRef = collection(db, 'simulacros');
        const simulacrosSnapshot = await getDocs(simulacrosRef);
        const listaSimulacros = simulacrosSnapshot.docs.map(doc => ({
          id: doc.id,
          tipo: 'simulacro',
          ...doc.data()
        }));

        setAventuras(listaAventuras);
        setSimulacros(listaSimulacros);
      } catch (err) {
        console.error("Error cargando la bóveda:", err);
        setError("No se pudo cargar el contenido de la bóveda.");
      } finally {
        setLoading(false);
      }
    };

    cargarContenido();
  }, []);

  // Formatear fecha para que sea legible
  const formatearFecha = (id) => {
    // Intentar parsear si es fecha ISO
    const fecha = new Date(id);
    
    if (isNaN(fecha.getTime())) {
      // Si no es fecha válida (ej: "simulador-matematicas-1"), retornar el ID limpio
      return id.replace(/-/g, ' ').replace('simulador', '').trim();
    }

    const dias = Math.floor((Date.now() - fecha.getTime()) / (1000*60*60*24));
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };

  // Obtener progreso del usuario para un item
  const getProgreso = (id, tipo) => {
    if (!profile) return null;
    
    if (tipo === 'simulacro' && profile.simulacros) {
      const resultados = profile.simulacros.filter(s => s.simulacroId === id);
      if (resultados.length === 0) return null;
      // Retornar el mejor puntaje
      return resultados.reduce((prev, current) => (prev.porcentaje > current.porcentaje) ? prev : current);
    }
    
    // Para aventuras (si tuviéramos lógica de completado, iría aquí)
    // Por ahora solo simulacros tienen score
    return null;
  };

  // Filtrar contenido
  const contenidoMostrar = () => {
    let items = [];
    if (filtro === 'todos' || filtro === 'aventuras') {
      items = [...items, ...aventuras];
    }
    if (filtro === 'todos' || filtro === 'simulacros') {
      items = [...items, ...simulacros];
    }
    return items;
  };

  // Obtener simulacros por tipo
  const simulacrosPorTipo = (tipo) => {
    if (tipo === 'simulacro') {
      return simulacros.filter(s => !s.tipo || s.tipo === 'simulacro');
    }
    return simulacros.filter(s => s.tipo === tipo);
  };

  // Contar contenido disponible
  const contarPorTipo = (tipoId) => {
    const tipoData = tiposJuegos.find(t => t.id === tipoId);
    if (!tipoData) return 0;
    
    if (tipoData.tipo === 'aventura') return aventuras.length;
    if (tipoData.tipo === 'simulacro') return simulacros.filter(s => !s.tipo || s.tipo === 'simulacro').length;
    return simulacros.filter(s => s.tipo === tipoData.tipo).length;
  };

  return (
    <PageWrapper>
      <Header title={profile?.nombre ? `Centro de Exploración de ${profile.nombre}` : 'Centro de Exploración'} 
              subtitle={`¡Bienvenido al mundo del aprendizaje, ${profile?.nombre || 'súper explorador'}!`} />
      
      <div className="boveda-container">
        {/* Header Personalizado */}
        {profile && (
          <div className="boveda-header-personalizado">
            <div className="boveda-avatar">
              {profile.avatar || '😁'}
            </div>
            <div className="boveda-info">
              <h1>{profile.nombre}</h1>
              <p>Explora y domina todos los tipos de desafíos</p>
            </div>
          </div>
        )}

        {/* Tabs para móvil */}
        <div className="boveda-tabs">
          <button 
            className={`tab-btn ${tabActivo === 'accesos' ? 'active' : ''}`}
            onClick={() => setTabActivo('accesos')}
          >
            ⚡ Accesos Rápidos
          </button>
          <button 
            className={`tab-btn ${tabActivo === 'boveda' ? 'active' : ''}`}
            onClick={() => setTabActivo('boveda')}
          >
            📚 Mi Bóveda
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Abriendo el centro de exploración...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>❌ {error}</p>
          </div>
        ) : (
          <>
            {/* SECCIÓN 1: ACCESOS RÁPIDOS */}
            {tabActivo === 'accesos' && (
              <section className="accesos-rapidos-section">
                <h2 className="section-title">⚡ Accesos Rápidos</h2>
                <div className="tipos-juegos-grid">
                  {tiposJuegos.map(tipo => {
                    const count = contarPorTipo(tipo.id);
                    return (
                      <button
                        key={tipo.id}
                        className={`tipo-juego-card ${count === 0 ? 'sin-contenido' : ''}`}
                        disabled={count === 0}
                        title={count === 0 ? 'No hay contenido disponible' : tipo.descripcion}
                        onClick={() => {
                          if (count > 0) {
                            setTabActivo('boveda');
                            setFiltro(tipo.id === 'aventuras' ? 'aventuras' : 'simulacros');
                          }
                        }}
                      >
                        <div className="tipo-emoji">{tipo.emoji}</div>
                        <div className="tipo-nombre">{tipo.nombre}</div>
                        {count > 0 && <div className="tipo-count">{count}</div>}
                        {count === 0 && <div className="tipo-bloqueado">🔒</div>}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECCIÓN 2: MI BÓVEDA (Histórico) */}
            {tabActivo === 'boveda' && (
              <section className="mi-boveda-section">
                <h2 className="section-title">📚 Mi Bóveda</h2>
                
                {/* Filtros */}
                <div className="filtros-container">
                  <button 
                    className={`filtro-btn ${filtro === 'todos' ? 'activo' : ''}`}
                    onClick={() => setFiltro('todos')}
                  >
                    Todo 
                    <span className="filtro-badge">{aventuras.length + simulacros.length}</span>
                  </button>
                  <button 
                    className={`filtro-btn ${filtro === 'simulacros' ? 'activo' : ''}`}
                    onClick={() => setFiltro('simulacros')}
                  >
                    🏆 Simulacros
                    <span className="filtro-badge">{simulacros.length}</span>
                  </button>
                  <button 
                    className={`filtro-btn ${filtro === 'aventuras' ? 'activo' : ''}`}
                    onClick={() => setFiltro('aventuras')}
                  >
                    🌟 Aventuras
                    <span className="filtro-badge">{aventuras.length}</span>
                  </button>
                </div>

                {/* Contenido */}
                <div className="contenido-grid">
                  {contenidoMostrar().length === 0 ? (
                    <div className="vacio-mensaje">
                      <p>📭 No se encontró contenido en esta sección.</p>
                      {filtro !== 'todos' && (
                        <button className="btn-recomendacion" onClick={() => setFiltro('todos')}>
                          ✨ Ver todo el contenido disponible
                        </button>
                      )}
                    </div>
                  ) : (
                    contenidoMostrar().map((item) => {
                      const progreso = getProgreso(item.id, item.tipo);
                      
                      return (
                        <Link 
                          to={item.tipo === 'simulacro' ? `/simulacro/${item.id}` : `/aventura/${item.id}`} 
                          key={item.id} 
                          className={`tarjeta-contenido tipo-${item.tipo}`}
                        >
                          <div className="tarjeta-icono">
                            {item.tipo === 'simulacro' ? '🎓' : '🗺️'}
                          </div>
                          <div className="tarjeta-info">
                            <span className="tarjeta-tipo">
                              {item.tipo === 'simulacro' ? 'Simulacro' : 'Aventura'}
                            </span>
                            <h3 className="tarjeta-titulo">{item.titulo}</h3>
                            {item.descripcion && <p className="tarjeta-desc">{item.descripcion}</p>}
                            <span className="tarjeta-fecha">{formatearFecha(item.id)}</span>
                            
                            {/* Progreso Visual */}
                            {progreso && (
                              <div className="tarjeta-progreso">
                                <span className={`badge-status ${progreso.porcentaje >= 70 ? 'bien' : ''}`}>
                                  {progreso.porcentaje >= 70 ? '✅ Completado' : '🔄 En progreso'}
                                </span>
                                <span className="score-badge">{progreso.porcentaje}%</span>
                              </div>
                            )}
                          </div>
                          <div className="tarjeta-accion">
                            <span className="btn-abrir">Abrir →</span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
};

export default Boveda;


