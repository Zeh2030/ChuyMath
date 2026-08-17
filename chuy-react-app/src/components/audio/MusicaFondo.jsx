import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useProfile } from '../../hooks/useProfile.jsx';
import { buscarPista, pistasDisponibles } from '../../data/musicaFondo';
import { encender, apagar } from '../../utils/musicaFondo';

// Sincroniza la preferencia `musicaFondo` del perfil activo con el reproductor.
// No renderiza nada: el elemento <audio> vive en el singleton de utils/musicaFondo,
// no en el árbol de React, para que sobreviva los cambios de ruta.
//
// Se monta en App.jsx como hermano de <Routes> (dentro de <Router>): es el único
// punto que persiste entre navegaciones y tiene acceso a useAuth.
const MusicaFondo = () => {
  const { activeProfileId } = useAuth();
  const { profile } = useProfile(activeProfileId);
  const quiereMusica = profile?.musicaFondo || false;
  const pistaGuardada = profile?.musicaFondoPista || null;

  useEffect(() => {
    if (!quiereMusica) {
      apagar();
      return;
    }
    // Si la pista guardada ya no existe (o el perfil es viejo y no la tiene),
    // cae a la primera disponible en vez de quedarse en silencio.
    encender(buscarPista(pistaGuardada) || pistasDisponibles()[0]);
  }, [quiereMusica, pistaGuardada]);

  return null;
};

export default MusicaFondo;
