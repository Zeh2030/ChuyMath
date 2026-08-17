import React, { useEffect, useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth.jsx';
import { pistasDisponibles } from '../../data/musicaFondo';
import { encender, apagar, useMusicaFondo } from '../../utils/musicaFondo';
import './MusicaBoton.css';

// Botón de música del Header: abre una lista con las piezas disponibles.
// Se eligió lista y no un botón que va rotando entre piezas porque con varias
// canciones habría que darle N veces solo para apagarla.
const MusicaBoton = () => {
  const { activeProfileId } = useAuth();
  const pistaActual = useMusicaFondo();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const pistas = pistasDisponibles();

  // Cerrar al tocar fuera o con Escape, como cualquier menú.
  useEffect(() => {
    if (!abierto) return;

    const alTocarFuera = (e) => {
      if (!contenedorRef.current?.contains(e.target)) setAbierto(false);
    };
    const alTeclear = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('mousedown', alTocarFuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alTocarFuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  // La preferencia se guarda DESPUÉS de actuar sobre el audio: los navegadores
  // solo desbloquean el sonido dentro del gesto del usuario, así que esperar
  // al viaje a Firestore haría que play() se rechazara.
  const recordar = (campos) => {
    if (!activeProfileId) return;
    updateDoc(doc(db, 'profiles', activeProfileId), campos)
      .catch((error) => console.error('Error al guardar preferencia de música:', error));
  };

  const elegir = (pista) => {
    encender(pista);
    setAbierto(false);
    recordar({ musicaFondo: true, musicaFondoPista: pista.id });
  };

  const alApagar = () => {
    apagar();
    setAbierto(false);
    recordar({ musicaFondo: false });
  };

  // Un botón que no suena confunde: si aún no hay ninguna pista configurada,
  // no se muestra nada.
  if (pistas.length === 0) return null;

  const sonando = pistas.find((p) => p.id === pistaActual);

  return (
    <div className="musica-wrap" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="nav-btn musica-btn"
        title={sonando ? `Sonando: ${sonando.titulo}` : 'Poner música de fondo'}
        aria-expanded={abierto}
        aria-haspopup="menu"
        data-sonando={sonando ? 'si' : 'no'}
      >
        {sonando ? '🎵 Música' : '🔇 Música'}
      </button>

      {abierto && (
        <div className="musica-menu" role="menu">
          {pistas.map((pista) => (
            <button
              key={pista.id}
              type="button"
              role="menuitem"
              className={`musica-opcion ${pista.id === pistaActual ? 'activa' : ''}`}
              onClick={() => elegir(pista)}
            >
              <span className="musica-check">{pista.id === pistaActual ? '🎵' : ''}</span>
              <span className="musica-textos">
                <span className="musica-titulo">{pista.titulo}</span>
                <span className="musica-compositor">{pista.compositor}</span>
              </span>
            </button>
          ))}

          <button
            type="button"
            role="menuitem"
            className="musica-opcion musica-apagar"
            onClick={alApagar}
            disabled={!sonando}
          >
            🔇 Apagar música
          </button>
        </div>
      )}
    </div>
  );
};

export default MusicaBoton;
