import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import BanderaDiseno from '../components/banderas/BanderaDiseno';
import { ALBUM, GRUPOS_ALBUM } from '../data/albumBanderas';
import { estadoBandera, meCuesta, urlEstampa, VOLVER_BANDERAS } from '../utils/coleccionBanderas';
import { nombreColor, coloresUsados } from '../data/tallerBanderas';
import './Banderas.css';

/**
 * Álbum de banderas (Banderas, Fase 3): un hueco por cada bandera que se gana en las
 * aventuras, por páginas (continentes, estados de EE. UU., históricas). Se llena con
 * banderasColeccion del perfil (ver utils/coleccionBanderas.js). Página lazy.
 */

const TEXTO_ESTADO = {
  nueva: 'Todavía no la ganas. Búscala en las aventuras de Banderas.',
  vista: 'La acertaste un día. ¡Acértala otro día y se pega!',
  pegada: '¡Pegada! Acértala un día más, sin fallar, y se vuelve dorada.',
  dorada: '¡Estampa dorada! La sabes muy bien.',
};

const AlbumBanderas = () => {
  const navigate = useNavigate();
  const { activeProfile, activeProfileId } = useAuth();
  const coleccion = activeProfile?.banderasColeccion || {};
  const propias = activeProfile?.banderasPropias || [];
  const [grupo, setGrupo] = useState(GRUPOS_ALBUM[0].id);
  const [abierta, setAbierta] = useState(null); // estampa en grande
  const [disenoAbierto, setDisenoAbierto] = useState(null);

  const estado = (b) => estadoBandera(coleccion[b.clave]);
  const pegadas = ALBUM.filter(b => ['pegada', 'dorada'].includes(estado(b)));
  const doradas = ALBUM.filter(b => estado(b) === 'dorada').length;
  const vistas = ALBUM.filter(b => estado(b) === 'vista').length;
  const dificiles = ALBUM.filter(b => meCuesta(coleccion[b.clave])).length;
  const delGrupo = ALBUM.filter(b => b.grupo === grupo);

  const borrarDiseno = async (id) => {
    if (!window.confirm('¿Borrar esta bandera?')) return;
    setDisenoAbierto(null);
    try {
      await updateDoc(doc(db, 'profiles', activeProfileId), { banderasPropias: propias.filter(d => d.id !== id) });
    } catch (err) {
      console.error('Error al borrar el diseño:', err);
    }
  };

  return (
    <PageWrapper>
      <Header title="📒 Mi álbum de banderas" subtitle="Acierta una bandera en 2 días distintos y se pega" />
      <div className="bn-pagina">
        <div className="bn-barra">
          <button type="button" className="bn-boton bn-boton-sec" onClick={() => navigate(VOLVER_BANDERAS)}>← Volver a Banderas</button>
        </div>

        <section className="bn-panel bn-resumen">
          <p className="bn-contador"><strong>{pegadas.length}</strong> de {ALBUM.length} estampas</p>
          <div className="bn-barra-avance" aria-hidden="true">
            <div style={{ width: `${(pegadas.length / ALBUM.length) * 100}%` }} />
          </div>
          <p className="bn-detalle">⭐ {doradas} doradas · 👀 {vistas} vistas, falta pegarlas</p>
          <div className="bn-acciones">
            <button type="button" className="bn-boton" onClick={() => navigate('/banderas/repaso')}>
              🔁 Repasar las que me cuestan{dificiles ? ` (${dificiles})` : ''}
            </button>
            <button type="button" className="bn-boton" onClick={() => navigate('/banderas/taller')}>🎨 Diseña tu bandera</button>
          </div>
        </section>

        <div className="bn-pestanas" role="tablist">
          {GRUPOS_ALBUM.map(g => {
            const total = ALBUM.filter(b => b.grupo === g.id);
            if (!total.length) return null;
            const listas = total.filter(b => ['pegada', 'dorada'].includes(estado(b))).length;
            return (
              <button key={g.id} type="button" role="tab" aria-selected={grupo === g.id}
                className={`bn-pestana ${grupo === g.id ? 'activa' : ''}`} onClick={() => setGrupo(g.id)}>
                {g.emoji} {g.nombre} <span>{listas}/{total.length}</span>
              </button>
            );
          })}
        </div>

        <section className="bn-panel">
          <div className="bn-rejilla">
            {delGrupo.map(b => {
              const e = estado(b);
              return (
                <button key={b.clave} type="button" className={`bn-hueco bn-${e}`} data-clave={b.clave} data-estado={e} onClick={() => setAbierta(b)}>
                  <span className="bn-marco">
                    {e === 'nueva'
                      ? <span className="bn-silueta">?</span>
                      : <img src={urlEstampa(b)} alt="" loading="lazy" />}
                    {e === 'dorada' && <span className="bn-estrella">⭐</span>}
                  </span>
                  <span className="bn-nombre">{b.nombre}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bn-panel">
          <h2 className="bn-subtitulo">🎨 Mis banderas</h2>
          {propias.length ? (
            <div className="bn-rejilla bn-rejilla-propias">
              {propias.map(d => (
                <button key={d.id} type="button" className="bn-hueco bn-propia" onClick={() => setDisenoAbierto(d)}>
                  <span className="bn-marco"><BanderaDiseno diseno={d} /></span>
                  <span className="bn-nombre">{d.nombre || 'Mi bandera'}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="bn-vacio">Todavía no diseñas ninguna. <button type="button" className="bn-enlace" onClick={() => navigate('/banderas/taller')}>¡Haz la tuya!</button></p>
          )}
        </section>
      </div>

      {abierta && (
        <div className="bn-modal" role="dialog" onClick={() => setAbierta(null)}>
          <div className="bn-modal-caja" onClick={e => e.stopPropagation()}>
            {estado(abierta) === 'nueva'
              ? <div className="bn-modal-silueta">?</div>
              : <img className={`bn-modal-img bn-${estado(abierta)}`} src={urlEstampa(abierta, 640)} alt="" />}
            <h3>{abierta.nombre}</h3>
            <p>{TEXTO_ESTADO[estado(abierta)]}</p>
            {coleccion[abierta.clave]?.dias?.length > 1 && <p className="bn-detalle">Acertada {coleccion[abierta.clave].dias.length} días.</p>}
            <button type="button" className="bn-boton" onClick={() => setAbierta(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {disenoAbierto && (
        <div className="bn-modal" role="dialog" onClick={() => setDisenoAbierto(null)}>
          <div className="bn-modal-caja" onClick={e => e.stopPropagation()}>
            <BanderaDiseno diseno={disenoAbierto} className="bn-modal-diseno" />
            <h3>{disenoAbierto.nombre || 'Mi bandera'}</h3>
            <ul className="bn-significados">
              {coloresUsados(disenoAbierto).filter(c => disenoAbierto.significados?.[c]).map(c => (
                <li key={c}><span className="bn-muestra" style={{ background: c }} /> El {nombreColor(c)}: {disenoAbierto.significados[c]}</li>
              ))}
            </ul>
            <div className="bn-acciones">
              <button type="button" className="bn-boton" onClick={() => setDisenoAbierto(null)}>Cerrar</button>
              <button type="button" className="bn-boton bn-boton-sec" onClick={() => borrarDiseno(disenoAbierto.id)}>🗑️ Borrar</button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default AlbumBanderas;
