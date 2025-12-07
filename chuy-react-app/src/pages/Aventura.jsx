import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import MisionRenderer from '../components/aventura/MisionRenderer';
import './Aventura.css';

const Aventura = () => {
  const { fecha } = useParams(); // Obtener el parámetro de la URL
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [aventura, setAventura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [misionActual, setMisionActual] = useState(0); // Índice de la misión actual
  const [aventuraCompletada, setAventuraCompletada] = useState(false);

  // Cargar la aventura desde Firestore - SIMPLIFICADO: solo 'aventuras'
  React.useEffect(() => {
    const cargarAventura = async () => {
      try {
        setLoading(true);
        setError(null);

        const aventuraRef = doc(db, 'aventuras', fecha);
        const aventuraSnap = await getDoc(aventuraRef);

        if (aventuraSnap.exists()) {
          setAventura({ 
            id: aventuraSnap.id, 
            ...aventuraSnap.data() 
          });
        } else {
          setError(`No se encontró la aventura con ID ${fecha}`);
        }
      } catch (err) {
        console.error('Error al cargar aventura:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (fecha) {
      cargarAventura();
    }
  }, [fecha]);

  // Marcar la aventura como iniciada cuando se carga
  React.useEffect(() => {
    if (aventura) {
      marcarAventuraIniciada();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aventura?.id]);

  // Función auxiliar para calcular la racha
  const calcularRacha = (ultimaVisita, rachaActual) => {
    if (!ultimaVisita) {
      return 1;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ultimaVisitaDate = ultimaVisita.toDate ? ultimaVisita.toDate() : new Date(ultimaVisita);
    ultimaVisitaDate.setHours(0, 0, 0, 0);

    const diferenciaDias = Math.floor((hoy - ultimaVisitaDate) / (1000 * 60 * 60 * 24));

    if (diferenciaDias === 1) {
      return rachaActual + 1;
    } else if (diferenciaDias === 0) {
      return rachaActual;
    } else {
      return 1;
    }
  };

  // Marcar aventura iniciada (sin fecha)
  const marcarAventuraIniciada = async () => {
    if (!currentUser || !aventura) return;

    try {
      const userRef = doc(db, 'profiles', currentUser.uid);
      const profileSnap = await getDoc(userRef);
      const progreso = profileSnap.data()?.aventurasProgreso || {};
      const actual = progreso[aventura.id];

      if (actual?.status === 'iniciado' || actual?.status === 'completado') return;

      await updateDoc(userRef, {
        [`aventurasProgreso.${aventura.id}`]: {
          status: 'iniciado',
          vecesCompletado: actual?.vecesCompletado || 0
        }
      });
    } catch (error) {
      console.error('Error al marcar aventura iniciada:', error);
    }
  };

  // Función para guardar que completó la aventura
  const marcarAventuraCompletada = async () => {
    if (!currentUser || !aventura) return;

    try {
      const userRef = doc(db, 'profiles', currentUser.uid);
      
      // Obtener el perfil actual para calcular la racha
      const profileSnap = await getDoc(userRef);
      const profileData = profileSnap.data();
      const rachaActual = profileData?.racha || 0;
      const ultimaVisita = profileData?.ultimaVisita;

      const nuevaRacha = calcularRacha(ultimaVisita, rachaActual);

      const aventuraCompletadaData = {
        aventuraId: aventura.id,
        titulo: aventura.titulo,
        fecha: Timestamp.now()
      };

      const progreso = profileData?.aventurasProgreso || {};
      const actual = progreso[aventura.id];
      const vecesCompletado = (actual?.vecesCompletado || 0) + 1;

      await updateDoc(userRef, {
        misionesCompletadas: arrayUnion(aventuraCompletadaData),
        racha: nuevaRacha,
        ultimaVisita: Timestamp.now(),
        [`aventurasProgreso.${aventura.id}`]: {
          status: 'completado',
          vecesCompletado
        }
      });
      console.log(`Aventura completada. Nueva racha: ${nuevaRacha}`);
    } catch (error) {
      console.error('Error al guardar la aventura completada:', error);
    }
  };

  // Función para avanzar a la siguiente misión
  const siguienteMision = async () => {
    if (aventura && misionActual < aventura.misiones.length - 1) {
      setMisionActual(misionActual + 1);
    } else if (aventura && misionActual === aventura.misiones.length - 1) {
      // Última misión completada
      setAventuraCompletada(true);
      await marcarAventuraCompletada();
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

  if (aventuraCompletada) {
    return (
      <PageWrapper>
        <Header />
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</h1>
          <h2 style={{ fontSize: '2rem', color: '#27ae60', marginBottom: '15px' }}>¡Aventura Completada!</h2>
          <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '30px' }}>
            ¡Excelente trabajo! Has completado todas las misiones de la aventura.
          </p>
          <button 
            onClick={volverAlDashboard}
            className="boton-principal"
            style={{ fontSize: '1.1rem', padding: '15px 30px' }}
          >
            🏠 Volver al Dashboard
          </button>
        </div>
      </PageWrapper>
    );
  }

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

