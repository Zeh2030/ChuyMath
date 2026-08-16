import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useProfile } from '../../hooks/useProfile.jsx';
import { PISTAS } from '../../data/musicaFondo';
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

  useEffect(() => {
    if (quiereMusica) encender(PISTAS[0]?.url);
    else apagar();
  }, [quiereMusica]);

  return null;
};

export default MusicaFondo;
