import React, { useState, useEffect } from 'react';
import './PalabraDelDia.css';

const PalabraDelDia = ({ 
  mision, 
  onCompletar, 
  modoSimulacro = false, 
  respuestaGuardada = '', 
  onRespuesta = null, 
  mostrarResultado: mostrarResultadoExterno = false 
}) => {
  const [palabraObjetivo, setPalabraObjetivo] = useState('');
  const [letrasBarajadas, setLetrasBarajadas] = useState([]); // Array de objetos {id, letra}
  const [letrasSeleccionadas, setLetrasSeleccionadas] = useState([]); // Array de objetos {id, letra}
  
  const [esCorrecto, setEsCorrecto] = useState(false);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);

  // Inicialización y manejo de estado
  useEffect(() => {
    if (mision) {
      const objetivo = (mision.palabra || mision.respuesta || '').toUpperCase();
      setPalabraObjetivo(objetivo);
      
      // Si estamos en modo simulacro y hay una respuesta guardada (string),
      // o si estamos inicializando el juego normal.
      if (modoSimulacro && respuestaGuardada) {
        // Reconstrucción visual para simulacro (modo lectura)
        // Convertimos el string guardado en "fichas" visuales
        const guardadas = respuestaGuardada.split('').map((l, i) => ({ id: `saved-${i}`, letra: l }));
        setLetrasSeleccionadas(guardadas);
        
        // Las letras que sobran (si la respuesta es más corta o diferente) deberían estar abajo,
        // pero para simplificar en modo revisión, dejaremos la zona de fichas vacía o irrelevante.
        setLetrasBarajadas([]); 

      } else if (!modoSimulacro || !respuestaGuardada) {
        // Modo Juego o Simulacro vacío: Barajar letras iniciales
        // Usamos IDs únicos para permitir letras repetidas
        const letrasArray = objetivo.split('').map((l, i) => ({
          id: i,
          letra: l
        }));
        
        // Algoritmo Fisher-Yates para barajar
        const barajadas = [...letrasArray];
        for (let i = barajadas.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [barajadas[i], barajadas[j]] = [barajadas[j], barajadas[i]];
        }
        
        setLetrasBarajadas(barajadas);
        setLetrasSeleccionadas([]);
      }
    }
  }, [mision, modoSimulacro]); // Quitamos respuestaGuardada de deps para evitar loops, se maneja al montar o cambiar misión

  // Manejar selección de letra (de abajo a arriba)
  const handleSelectLetra = (letraObj) => {
    if (mostrarFeedback || mostrarResultadoExterno) return;

    const nuevasBarajadas = letrasBarajadas.filter(l => l.id !== letraObj.id);
    const nuevasSeleccionadas = [...letrasSeleccionadas, letraObj];

    setLetrasBarajadas(nuevasBarajadas);
    setLetrasSeleccionadas(nuevasSeleccionadas);
    
    // Notificar al padre (Simulacro)
    if (modoSimulacro && onRespuesta) {
      const palabraFormada = nuevasSeleccionadas.map(l => l.letra).join('');
      onRespuesta(palabraFormada);
    }
  };

  // Manejar deselección de letra (de arriba a abajo)
  const handleDeselectLetra = (letraObj) => {
    if (mostrarFeedback || mostrarResultadoExterno) return;

    const nuevasSeleccionadas = letrasSeleccionadas.filter(l => l.id !== letraObj.id);
    const nuevasBarajadas = [...letrasBarajadas, letraObj];

    setLetrasSeleccionadas(nuevasSeleccionadas);
    setLetrasBarajadas(nuevasBarajadas);
    
    // Notificar al padre
    if (modoSimulacro && onRespuesta) {
      const palabraFormada = nuevasSeleccionadas.map(l => l.letra).join('');
      onRespuesta(palabraFormada); // Puede ser string vacío
    }
  };

  const comprobarRespuesta = () => {
    const palabraUsuario = letrasSeleccionadas.map(l => l.letra).join('');
    const correcto = palabraUsuario === palabraObjetivo;
    setEsCorrecto(correcto);
    setMostrarFeedback(true);
    
    if (correcto && onCompletar) {
      setTimeout(() => onCompletar(), 1500);
    }
  };

  const handleReintentar = () => {
    // Restaurar todas las letras y rebarajar
    const objetivo = palabraObjetivo;
    const letrasArray = objetivo.split('').map((l, i) => ({
      id: i,
      letra: l
    }));
    
    const barajadas = [...letrasArray];
    for (let i = barajadas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [barajadas[i], barajadas[j]] = [barajadas[j], barajadas[i]];
    }

    setLetrasBarajadas(barajadas);
    setLetrasSeleccionadas([]);
    setMostrarFeedback(false);
    setEsCorrecto(false);
  };

  const debeMostrarResultado = mostrarFeedback || (modoSimulacro && mostrarResultadoExterno);
  
  // Verificación para estilos finales
  const palabraFinalUsuario = letrasSeleccionadas.map(l => l.letra).join('');
  const esCorrectoCalculado = modoSimulacro 
    ? (palabraFinalUsuario === palabraObjetivo)
    : esCorrecto;

  // Reproducir audio
  const reproducirAudio = () => {
    if (mision.audio_pronunciacion) {
      const audio = new Audio(mision.audio_pronunciacion);
      audio.play().catch(e => console.error("Error reproduciendo audio:", e));
    } else {
      // Fallback: Síntesis de voz del navegador (inglés)
      const utterance = new SpeechSynthesisUtterance(palabraObjetivo);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="palabra-container">
      {/* Cabecera Educativa */}
      <div className="palabra-header">
        <div className="palabra-icono-grande">{mision.icono || '📝'}</div>
        <div className="palabra-info">
          <h2 className="palabra-espanol">{mision.palabra_es || "Palabra del día"}</h2>
          <button className="boton-audio" onClick={reproducirAudio} title="Escuchar pronunciación">
            🔊 Escuchar en Inglés
          </button>
        </div>
      </div>

      <h3 className="palabra-instruccion">{mision.pregunta || "Ordena las letras para escribirla en Inglés:"}</h3>
      
      {mision.pista && <p className="palabra-pista">💡 Pista: {mision.pista}</p>}
      
      {/* Zona de Construcción (Slots) */}
      <div className="zona-construccion">
        {/* Renderizamos tantos slots como letras tenga la palabra OBJETIVO 
            para dar una pista visual de la longitud */}
        {Array.from({ length: palabraObjetivo.length }).map((_, index) => {
           const letraPuesta = letrasSeleccionadas[index];
           return (
             <div 
               key={`slot-${index}`} 
               className={`slot-letra ${letraPuesta ? 'ocupado' : ''} ${debeMostrarResultado ? (esCorrectoCalculado ? 'correcto' : 'incorrecto') : ''}`}
               onClick={() => letraPuesta && handleDeselectLetra(letraPuesta)}
             >
               {letraPuesta ? letraPuesta.letra : ''}
             </div>
           );
        })}
      </div>

      {/* Zona de Fichas Disponibles */}
      <div className="zona-fichas">
        {letrasBarajadas.map((letraObj) => (
          <button
            key={letraObj.id}
            className="ficha-letra animacion-entrada"
            onClick={() => handleSelectLetra(letraObj)}
            disabled={debeMostrarResultado}
          >
            {letraObj.letra}
          </button>
        ))}
      </div>

      {debeMostrarResultado && (
         <div className={`feedback-mensaje ${esCorrectoCalculado ? 'texto-verde' : 'texto-rojo'}`}>
            {esCorrectoCalculado ? (mision.explicacion_correcta || "¡Correcto!") : (mision.explicacion_incorrecta || `La palabra era: ${palabraObjetivo}`)}
         </div>
      )}
      
      {!modoSimulacro && (
        <div className="acciones-container">
          {!mostrarFeedback ? (
            <button 
              className="boton-enviar" 
              onClick={comprobarRespuesta}
              disabled={letrasSeleccionadas.length === 0}
            >
              Comprobar
            </button>
          ) : (
            !esCorrecto && (
              <button className="boton-reintentar" onClick={handleReintentar}>
                Intentar de Nuevo
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PalabraDelDia;

