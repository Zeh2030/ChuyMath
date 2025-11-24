import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import MisionRenderer from '../components/aventura/MisionRenderer';
import './Simulacro.css';

const Simulacro = () => {
  const { id } = useParams(); // Obtener el ID del simulacro
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [simulacro, setSimulacro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respuestas, setRespuestas] = useState({}); // { problemaId: respuesta }
  const [calificado, setCalificado] = useState(false);
  const [puntaje, setPuntaje] = useState(0);

  // Cargar el simulacro desde Firestore - SIMPLIFICADO: solo 'simulacros'
  useEffect(() => {
    const cargarSimulacro = async () => {
      try {
        setLoading(true);
        setError(null);

        const simulacroRef = doc(db, 'simulacros', id);
        const simulacroSnap = await getDoc(simulacroRef);

        if (simulacroSnap.exists()) {
          const data = { 
            id: simulacroSnap.id, 
            ...simulacroSnap.data() 
          };
          setSimulacro(data);
          
          // Inicializar respuestas vacías (usar problemas o misiones)
          const respuestasIniciales = {};
          const items = data.problemas || data.misiones || [];
          items.forEach(item => {
            respuestasIniciales[item.id] = null;
          });
          setRespuestas(respuestasIniciales);
        } else {
          setError(`No se encontró el simulacro con ID ${id}`);
        }
      } catch (err) {
        console.error('Error al cargar simulacro:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarSimulacro();
    }
  }, [id]);

  // Guardar la respuesta de un problema
  const handleRespuesta = (problemaId, respuesta) => {
    if (calificado) return; // No permitir cambios después de calificar
    
    setRespuestas(prev => ({
      ...prev,
      [problemaId]: respuesta
    }));
  };

  // Función unificada para verificar si una respuesta es correcta
  const esRespuestaCorrecta = (problema, respuestaUsuario) => {
    if (problema.tipo === 'navegacion-mapa') {
      return respuestaUsuario === problema.configuracion_mapa.respuesta_correcta;
    } 
    
    if (problema.tipo === 'opcion-multiple') {
      // La respuesta puede ser un índice o un valor
      if (typeof problema.respuesta === 'string' && /^\d+$/.test(problema.respuesta)) {
        return respuestaUsuario === problema.respuesta;
      } else {
        return respuestaUsuario === problema.respuesta;
      }
    }
    
    if (problema.tipo === 'operaciones' || problema.tipo === 'balanza-logica' || problema.tipo === 'desarrollo-cubos' || problema.tipo === 'palabra-del-dia' || problema.tipo === 'conteo-figuras') {
      const respuestaUsuarioStr = String(respuestaUsuario || '').trim().toUpperCase();
      const respuestaCorrectaStr = String(problema.respuesta || problema.palabra).trim().toUpperCase();
      return respuestaUsuarioStr === respuestaCorrectaStr;
    }
    
    if (problema.tipo === 'criptoaritmetica') {
      const usuario = respuestaUsuario || {};
      const solucion = problema.solucion || {};
      const letrasSolucion = Object.keys(solucion);
      
      if (Object.keys(usuario).length === 0) return false;
      
      return letrasSolucion.every(letra => 
        String(usuario[letra]) === String(solucion[letra])
      );
    }

    return false;
  };

  // Función auxiliar para calcular la racha
  const calcularRacha = (ultimaVisita, rachaActual) => {
    if (!ultimaVisita) {
      // Primera visita
      return 1;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Convertir Timestamp de Firestore a Date
    const ultimaVisitaDate = ultimaVisita.toDate ? ultimaVisita.toDate() : new Date(ultimaVisita);
    ultimaVisitaDate.setHours(0, 0, 0, 0);

    const diferenciaDias = Math.floor((hoy - ultimaVisitaDate) / (1000 * 60 * 60 * 24));

    if (diferenciaDias === 1) {
      // Visitó ayer, incrementar racha
      return rachaActual + 1;
    } else if (diferenciaDias === 0) {
      // Visitó hoy, mantener racha
      return rachaActual;
    } else {
      // No visitó ayer, reiniciar racha
      return 1;
    }
  };

  // Calificar el examen
  const calificarExamen = async () => {
    let aciertos = 0;
    const items = simulacro.problemas || simulacro.misiones || [];
    
    items.forEach(item => {
      if (esRespuestaCorrecta(item, respuestas[item.id])) {
        aciertos++;
      }
    });
    
    setPuntaje(aciertos);
    setCalificado(true);
    
    // Guardar resultado en Firestore
    if (currentUser) {
      try {
        const porcentaje = Math.round((aciertos / items.length) * 100);
        const userRef = doc(db, 'profiles', currentUser.uid);
        
        // Obtener el perfil actual para calcular la racha
        const profileSnap = await getDoc(userRef);
        const profileData = profileSnap.data();
        const rachaActual = profileData?.racha || 0;
        const ultimaVisita = profileData?.ultimaVisita;

        const nuevaRacha = calcularRacha(ultimaVisita, rachaActual);
        
        const nuevoResultado = {
          simulacroId: id,
          titulo: simulacro.titulo,
          aciertos: aciertos,
          total: items.length,
          porcentaje: porcentaje,
          fecha: Timestamp.now()
        };

        await updateDoc(userRef, {
          simulacros: arrayUnion(nuevoResultado),
          racha: nuevaRacha,
          ultimaVisita: Timestamp.now()
        });
        console.log(`Resultado guardado con éxito. Nueva racha: ${nuevaRacha}`);
      } catch (error) {
        console.error('Error al guardar el resultado:', error);
      }
    }

    // Hacer scroll hacia arriba para ver los resultados
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reiniciar el simulacro
  const reiniciarSimulacro = () => {
    const respuestasIniciales = {};
    const itemsParaReiniciar = simulacro.problemas || simulacro.misiones || [];
    itemsParaReiniciar.forEach(problema => {
      respuestasIniciales[problema.id] = null;
    });
    setRespuestas(respuestasIniciales);
    setCalificado(false);
    setPuntaje(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Volver al dashboard
  const volverAlDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.5rem' }}>
          Cargando simulacro...
        </div>
      </PageWrapper>
    );
  }

  if (error || !simulacro) {
    return (
      <PageWrapper>
        <Header />
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>❌ Error</h2>
          <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>{error || 'No se pudo cargar el simulacro'}</p>
          <button onClick={volverAlDashboard} className="boton-principal">
            Volver al Dashboard
          </button>
        </div>
      </PageWrapper>
    );
  }

  const items = simulacro.problemas || simulacro.misiones || [];
  const totalProblemas = items.length;
  const porcentaje = calificado ? Math.round((puntaje / totalProblemas) * 100) : 0;

  return (
    <PageWrapper>
      <Header />
      
      <div className="simulacro-container">
        {/* Encabezado del Simulacro */}
        <div className="simulacro-header">
          <h1 className="simulacro-titulo">📝 {simulacro.titulo}</h1>
          {simulacro.descripcion && (
            <p className="simulacro-descripcion">{simulacro.descripcion}</p>
          )}
          
          {/* Mostrar resultado si está calificado */}
          {calificado && (
            <div className={`resultado-final ${porcentaje >= 70 ? 'aprobado' : 'reprobado'}`}>
              <div className="resultado-icono">
                {porcentaje >= 70 ? '🎉' : '💪'}
              </div>
              <div className="resultado-info">
                <h2>Resultado: {puntaje} de {totalProblemas}</h2>
                <p className="resultado-porcentaje">{porcentaje}%</p>
                <p className="resultado-mensaje">
                  {porcentaje >= 90 ? '¡Excelente trabajo!' :
                   porcentaje >= 70 ? '¡Buen trabajo!' :
                   '¡Sigue practicando, vas muy bien!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Problemas */}
        <div className="problemas-lista">
          {items.map((problema, index) => {
            const respuestaUsuario = respuestas[problema.id];
            const esCorrecta = calificado ? esRespuestaCorrecta(problema, respuestaUsuario) : false;

            return (
              <div 
                key={problema.id} 
                className={`problema-card ${calificado ? (esCorrecta ? 'correcto' : 'incorrecto') : ''}`}
              >
                <div className="problema-header">
                  <h3>Problema {index + 1}</h3>
                  {calificado && (
                    <span className="problema-resultado-icono">
                      {esCorrecta ? '✅' : '❌'}
                    </span>
                  )}
                </div>
                
                <div className="problema-content">
                  <MisionRenderer 
                    mision={problema}
                    modoSimulacro={true}
                    respuestaGuardada={respuestaUsuario}
                    onRespuesta={(respuesta) => handleRespuesta(problema.id, respuesta)}
                    mostrarResultado={calificado}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Botones de Acción */}
        <div className="simulacro-acciones">
          <button
            onClick={volverAlDashboard}
            className="boton-secundario"
          >
            🏠 Volver al Dashboard
          </button>

          {!calificado ? (
            <button
              onClick={calificarExamen}
              className="boton-calificar"
            >
              📊 Calificar Examen
            </button>
          ) : (
            <button
              onClick={reiniciarSimulacro}
              className="boton-reintentar"
            >
              🔄 Intentar de Nuevo
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Simulacro;
