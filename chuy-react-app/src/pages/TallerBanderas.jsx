import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import BanderaDiseno from '../components/banderas/BanderaDiseno';
import { BANDERAS_PINTA } from '../data/albumBanderas';
import {
  FORMAS, PALETA, SIMBOLOS, LUGARES, MAX_DISENOS,
  formaDe, nombreColor, coloresUsados, reglasNava,
} from '../data/tallerBanderas';
import { sonar } from '../utils/sonido';
import './Banderas.css';

/**
 * Taller "Diseña tu bandera" (Banderas, Fase 3): elige una forma, píntala, ponle un
 * símbolo y di qué significa cada color. Las 5 reglas de NAVA se revisan en vivo.
 * Se guarda en profiles/{id}.banderasPropias y se ve en el álbum.
 */
const MUESTRA = ['#0055a4', '#ffffff', '#d52b1e'];
const nuevoDiseno = (forma = 'h3') => ({
  forma, colores: Array(formaDe(forma).regiones).fill(null), simbolo: null, nombre: '', significados: {},
});

const TallerBanderas = () => {
  const navigate = useNavigate();
  const { activeProfile, activeProfileId } = useAuth();
  const propias = activeProfile?.banderasPropias || [];
  const [diseno, setDiseno] = useState(() => nuevoDiseno());
  const [colorSel, setColorSel] = useState(null);
  const [aviso, setAviso] = useState('');
  const [guardada, setGuardada] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (cambios) => setDiseno(d => ({ ...d, ...cambios }));
  const elegirForma = (forma) => cambiar({ forma, colores: Array(formaDe(forma).regiones).fill(null) });
  const pintar = (i) => {
    if (!colorSel) { setAviso('Primero elige un color 🎨'); return; }
    setAviso('');
    setDiseno(d => ({ ...d, colores: d.colores.map((c, k) => (k === i ? colorSel : c)) }));
  };
  const elegirSimbolo = (tipo) => {
    if (!tipo) return cambiar({ simbolo: null });
    // Toma el color elegido; si no hay, blanco (se nota sobre casi todo)
    cambiar({ simbolo: { tipo, color: colorSel || '#ffffff', lugar: diseno.simbolo?.lugar || 'centro' } });
  };

  const completa = diseno.colores.every(Boolean);
  const reglas = reglasNava({ ...diseno, colores: diseno.colores.map(c => c || '') }, BANDERAS_PINTA);
  const usados = coloresUsados(diseno);
  const lleno = propias.length >= MAX_DISENOS;

  const guardar = async () => {
    if (!completa || lleno || guardando) return;
    setGuardando(true);
    const nueva = { ...diseno, nombre: diseno.nombre.trim(), id: Date.now().toString(36), fecha: new Date().toISOString() };
    try {
      await updateDoc(doc(db, 'profiles', activeProfileId), { banderasPropias: [...propias, nueva] });
      sonar(880);
      setGuardada(true);
    } catch (err) {
      console.error('Error al guardar la bandera:', err);
      setAviso('No se pudo guardar. ¿Hay internet?');
    }
    setGuardando(false);
  };

  if (guardada) {
    return (
      <PageWrapper>
        <Header title="🎨 Diseña tu bandera" subtitle="¡Quedó guardada en tu álbum!" />
        <div className="bn-pagina">
          <section className="bn-panel bn-vacio-grande">
            <BanderaDiseno diseno={diseno} className="bn-taller-final" />
            <p>🎉 ¡{diseno.nombre.trim() || 'Tu bandera'} ya está en tu álbum!</p>
            <div className="bn-acciones">
              <button type="button" className="bn-boton" onClick={() => navigate('/banderas/album')}>📒 Ver mi álbum</button>
              <button type="button" className="bn-boton bn-boton-sec" onClick={() => { setDiseno(nuevoDiseno()); setColorSel(null); setGuardada(false); }}>Hacer otra</button>
            </div>
          </section>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header title="🎨 Diseña tu bandera" subtitle="Crea la bandera de tu país inventado o de tu equipo" />
      <div className="bn-pagina">
        <div className="bn-barra">
          <button type="button" className="bn-boton bn-boton-sec" onClick={() => navigate('/banderas/album')}>← Volver al álbum</button>
        </div>

        <section className="bn-panel">
          <h2 className="bn-subtitulo">1. Elige la forma</h2>
          <div className="bn-formas">
            {FORMAS.map(f => (
              <button key={f.id} type="button" className={`bn-forma ${diseno.forma === f.id ? 'activa' : ''}`}
                data-forma={f.id} onClick={() => elegirForma(f.id)} title={f.nombre} aria-label={f.nombre}>
                <BanderaDiseno diseno={{ forma: f.id, colores: MUESTRA.slice(0, f.regiones), simbolo: null }} />
              </button>
            ))}
          </div>
        </section>

        <section className="bn-panel bn-taller">
          <h2 className="bn-subtitulo">2. Píntala: elige un color y toca cada parte</h2>
          <BanderaDiseno diseno={diseno} onTocar={pintar} className="bn-taller-lienzo" />
          {aviso && <p className="bn-aviso">{aviso}</p>}
          <div className="bn-paleta">
            {PALETA.map(c => (
              <button key={c.hex} type="button" className={`bn-color ${colorSel === c.hex ? 'activo' : ''}`}
                style={{ background: c.hex }} data-color={c.hex} onClick={() => { setColorSel(c.hex); setAviso(''); }}
                title={c.nombre} aria-label={c.nombre} />
            ))}
          </div>

          <h2 className="bn-subtitulo">3. ¿Le pones un símbolo?</h2>
          <div className="bn-simbolos">
            <button type="button" className={`bn-simbolo ${!diseno.simbolo ? 'activo' : ''}`} onClick={() => elegirSimbolo(null)}>Ninguno</button>
            {SIMBOLOS.map(s => (
              <button key={s.id} type="button" className={`bn-simbolo ${diseno.simbolo?.tipo === s.id ? 'activo' : ''}`}
                data-simbolo={s.id} onClick={() => elegirSimbolo(s.id)} title={s.nombre} aria-label={s.nombre}>
                <svg viewBox="0 0 100 100"><path d={s.d} fill={colorSel || '#2d3436'} /></svg>
              </button>
            ))}
          </div>
          {diseno.simbolo && (
            <div className="bn-lugares">
              {LUGARES.map(l => (
                <button key={l.id} type="button" className={`bn-simbolo ${diseno.simbolo.lugar === l.id ? 'activo' : ''}`}
                  onClick={() => cambiar({ simbolo: { ...diseno.simbolo, lugar: l.id } })}>{l.nombre}</button>
              ))}
              <span className="bn-detalle">Para cambiarle el color: elige otro color y toca otra vez el símbolo.</span>
            </div>
          )}
        </section>

        <section className="bn-panel">
          <h2 className="bn-subtitulo">4. Ponle nombre y di qué significa</h2>
          <label className="bn-campo">
            <span>¿De qué país o equipo es?</span>
            <input type="text" maxLength={40} value={diseno.nombre} onChange={e => cambiar({ nombre: e.target.value })} placeholder="Por ejemplo: República de los Dinosaurios" />
          </label>
          {usados.map(c => (
            <label key={c} className="bn-campo bn-campo-color">
              <span><span className="bn-muestra" style={{ background: c }} /> El {nombreColor(c)} significa…</span>
              <input type="text" maxLength={60} value={diseno.significados[c] || ''}
                onChange={e => cambiar({ significados: { ...diseno.significados, [c]: e.target.value } })} />
            </label>
          ))}
        </section>

        <section className="bn-panel">
          <h2 className="bn-subtitulo">Las reglas de una buena bandera</h2>
          <ul className="bn-reglas">
            {reglas.map(r => (
              <li key={r.id} className={r.ok ? 'ok' : 'falta'} data-regla={r.id}>{r.ok ? '✅' : '💡'} {r.texto}</li>
            ))}
          </ul>
          <div className="bn-acciones">
            <button type="button" className="bn-boton bn-guardar" onClick={guardar} disabled={!completa || lleno || guardando}>
              {guardando ? 'Guardando…' : '💾 Guardar en mi álbum'}
            </button>
          </div>
          {!completa && <p className="bn-detalle">Pinta todas las partes para poder guardarla.</p>}
          {lleno && <p className="bn-detalle">Ya tienes {MAX_DISENOS} banderas. Borra una en tu álbum para hacer otra.</p>}
        </section>
      </div>
    </PageWrapper>
  );
};

export default TallerBanderas;
