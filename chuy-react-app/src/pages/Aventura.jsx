import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import MisionRenderer from '../components/aventura/MisionRenderer';
import './Aventura.css';

const Aventura = () => {
  const { fecha } = useParams(); // Obtener el parámetro de la URL
  const navigate = useNavigate();
  const [aventura, setAventura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [misionActual, setMisionActual] = useState(0); // Índice de la misión actual

  // Cargar la aventura desde Firestore
  React.useEffect(() => {
    const cargarAventura = async () => {
      try {
        setLoading(true);
        setError(null);

        const aventuraRef = doc(db, 'aventuras', fecha);
        const aventuraSnap = await getDoc(aventuraRef);

        if (aventuraSnap.exists()) {
          setAventura({ id: aventuraSnap.id, ...aventuraSnap.data() });
        } else {
          setError(`No se encontró la aventura con fecha ${fecha}`);
        }
      } catch (err) {
        console.error('Error al cargar la aventura:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (fecha) {
      cargarAventura();
    }
  }, [fecha]);

  // Función para avanzar a la siguiente misión
  const siguienteMision = () => {
    if (aventura && misionActual < aventura.misiones.length - 1) {
      setMisionActual(misionActual + 1);
    }
  };

  // Función para retroceder a la misión anterior
  const anteriorMision = () => {
    if (misionActual > 0) {
      setMisionActual(misionActual - 1);
    }
  };

  // Función para volver al dashboard
  const volverAlDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.5rem' }}>
          Cargando aventura...
        </div>
      </PageWrapper>
    );
  }

  if (error || !aventura) {
    return (
      <PageWrapper>
        <Header />
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>❌ Error</h2>
          <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>{error || 'No se pudo cargar la aventura'}</p>
          <button onClick={volverAlDashboard} className="boton-principal">
            Volver al Dashboard
          </button>
        </div>
      </PageWrapper>
    );
  }

  const mision = aventura.misiones[misionActual];
  const totalMisiones = aventura.misiones.length;
  const esUltimaMision = misionActual === totalMisiones - 1;
  const esPrimeraMision = misionActual === 0;

  return (
    <PageWrapper>
      <Header />
      
      <div className="aventura-container">
        {/* Encabezado de la Aventura */}
        <div className="aventura-header">
          <h1 className="aventura-titulo">🌟 {aventura.titulo}</h1>
          <div className="aventura-progreso">
            <span>Misión {misionActual + 1} de {totalMisiones}</span>
            <div className="progreso-barra">
              <div 
                className="progreso-barra-fill" 
                style={{ width: `${((misionActual + 1) / totalMisiones) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Renderizar la Misión Actual */}
        {mision && (
          <div className="mision-container">
            <MisionRenderer 
              mision={mision} 
              onCompletar={siguienteMision}
            />
          </div>
        )}

        {/* Navegación entre Misiones */}
        <div className="aventura-navegacion">
          <button
            onClick={anteriorMision}
            disabled={esPrimeraMision}
            className="boton-navegacion"
          >
            ← Anterior
          </button>
          
          <button
            onClick={volverAlDashboard}
            className="boton-navegacion boton-secundario"
          >
            🏠 Dashboard
          </button>

          {!esUltimaMision && (
            <button
              onClick={siguienteMision}
              className="boton-navegacion"
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Aventura;

