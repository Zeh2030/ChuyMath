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

  return (
    <PageWrapper>
      <Header />
      
      <div className="boveda-container">
        <div className="boveda-header">
          <h1 className="titulo-boveda">📚 La Bóveda del Conocimiento</h1>
          <p className="subtitulo-boveda">Explora todas las aventuras y exámenes pasados</p>
        </div>

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
            📝 Simulacros
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

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Abriendo la bóveda...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>❌ {error}</p>
          </div>
        ) : (
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
        )}
      </div>
    </PageWrapper>
  );
};

export default Boveda;


