import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ColeccionBanderasProvider } from '../hooks/useColeccionBanderas';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import MisionRenderer from '../components/aventura/MisionRenderer';
import { ALBUM } from '../data/albumBanderas';
import { estadoBandera, meCuesta, urlEstampa, VOLVER_BANDERAS } from '../utils/coleccionBanderas';
import './Banderas.css';

/**
 * "Repasar las que me cuestan" (Banderas, Fase 3): arma en el momento una misión
 * image-picker (bandera → 4 nombres del mismo grupo) con las banderas que más falla.
 * Se juega dentro del Provider: el repaso también cuenta para el álbum.
 */
const MAX_RETOS = 8;
const MIN_RETOS = 4;

const barajar = (arr) => {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
};

// Primero las que le cuestan (más fallos que aciertos arriba); si son pocas,
// completa con las vistas que aún no se pegan.
const elegirBanderas = (coleccion) => {
  const datos = (b) => coleccion[b.clave];
  const cuestan = ALBUM.filter(b => meCuesta(datos(b)))
    .sort((a, b) => (datos(b).fallos - datos(b).aciertos) - (datos(a).fallos - datos(a).aciertos))
    .slice(0, MAX_RETOS);
  if (cuestan.length >= MIN_RETOS) return cuestan;
  const vistas = barajar(ALBUM.filter(b => estadoBandera(datos(b)) === 'vista' && !cuestan.includes(b)));
  return [...cuestan, ...vistas].slice(0, MAX_RETOS);
};

const armarMision = (banderas) => ({
  id: 'repaso-banderas',
  tipo: 'image-picker',
  titulo: 'Repasa las que te cuestan',
  instruccion: 'Mira la bandera y elige de quién es.',
  retos: banderas.map(b => {
    const mismoGrupo = ALBUM.filter(o => o.grupo === b.grupo && o.clave !== b.clave);
    const otros = mismoGrupo.length >= 3 ? mismoGrupo : ALBUM.filter(o => o.clave !== b.clave);
    const opciones = barajar([b, ...barajar(otros).slice(0, 3)]);
    return {
      imagen_url: urlEstampa(b, 320),
      [b.clave.startsWith('h-') ? 'bandera_id' : 'bandera']: b.clave,
      opciones: opciones.map(o => ({ label: o.nombre })),
      respuesta: opciones.indexOf(b),
      explicacion: `¡Es ${b.nombre}!`,
    };
  }),
});

const RepasoBanderas = () => {
  const navigate = useNavigate();
  const { activeProfile } = useAuth();
  // Se arma una sola vez al entrar: si cambiara a media partida, el juego se reiniciaría.
  const [mision] = useState(() => {
    const banderas = elegirBanderas(activeProfile?.banderasColeccion || {});
    return banderas.length ? armarMision(banderas) : null;
  });

  return (
    <PageWrapper>
      <Header title="🔁 Repaso de banderas" subtitle="Las que más te cuestan" />
      <div className="bn-pagina">
        <div className="bn-barra">
          <button type="button" className="bn-boton bn-boton-sec" onClick={() => navigate('/banderas/album')}>← Volver al álbum</button>
        </div>
        {mision ? (
          <div className="bn-panel">
            <ColeccionBanderasProvider>
              <MisionRenderer mision={mision} onCompletar={() => navigate('/banderas/album')} materia="geografia" />
            </ColeccionBanderasProvider>
          </div>
        ) : (
          <section className="bn-panel bn-vacio-grande">
            <p>🎉 ¡No tienes banderas difíciles!</p>
            <p>Juega aventuras de Banderas para ganar estampas nuevas.</p>
            <button type="button" className="bn-boton" onClick={() => navigate(VOLVER_BANDERAS)}>Ir a Banderas</button>
          </section>
        )}
      </div>
    </PageWrapper>
  );
};

export default RepasoBanderas;
