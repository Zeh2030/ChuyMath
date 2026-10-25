import React, { useState, useEffect, useId } from 'react';
import { geometriaBandera, GROSOR_MINIMO } from '../../../data/plantillasBandera';
import { sonar, hablar } from '../../../utils/sonido';
import './PintaBandera.css';

/**
 * PintaBandera — pinta una bandera de memoria (o copiando el modelo) y se comprueba
 * región por región. Módulo de Banderas (Geografía).
 *
 * Reto: {
 *   nombre, plantilla, colores: [hex por región], paleta: [hex],
 *   imagen_url,                 — la bandera real (flagcdn o Wikimedia): premio al acertar / modelo
 *   bandera | bandera_id,       — código para el álbum
 *   pesos?, proporcion?, borde?, completa?, circulo_x?, radio?, triangulo_largo?  (ver data/plantillasBandera.js)
 *   emblema?: { url, x, y, ancho },  — imagen fija encima, NO se pinta (escudo de México)
 *   mostrar_modelo?: true,      — enseña la bandera de muestra (para los más chicos)
 *   explicacion?
 * }
 * Misión: { retos, leer_en_voz?: true }
 *
 * Cada reto es un hijo con key={idx}: al cambiar de reto su estado nace limpio,
 * sin efectos que reinicien estado (regla del proyecto).
 */

const norm = (c) => String(c || '').toLowerCase();
const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Contorno solo mientras está sin pintar: en las cruces (dos rectángulos en un
// mismo path) el contorno dibujaría líneas por dentro.
const Region = ({ r, i, fill, pintada, onTocar }) => {
  const comun = {
    'data-region': i,
    'data-ancla': `${r.ancla[0]} ${r.ancla[1]}`,
    className: `pb-region ${pintada ? '' : 'pb-sin-pintar'}`,
    fill,
    onClick: () => onTocar(i),
  };
  if (r.forma === 'rect') return <rect {...comun} {...r.attrs} />;
  if (r.forma === 'circle') return <circle {...comun} {...r.attrs} />;
  if (r.forma === 'polygon') return <polygon {...comun} {...r.attrs} />;
  return <path {...comun} {...r.attrs} />;
};

const RetoPinta = ({ reto, leerEnVoz, onListo, esUltimo }) => {
  const idRayas = `pb-rayas-${useId().replace(/:/g, '')}`;
  const { W, H, regiones } = geometriaBandera(reto);
  const [pintado, setPintado] = useState(() => regiones.map(() => null));
  const [colorSel, setColorSel] = useState(null);
  const [mal, setMal] = useState([]);
  const [aviso, setAviso] = useState('');
  const [correcto, setCorrecto] = useState(false);
  const [parpadeo, setParpadeo] = useState(false);

  // Solo voz (sin setState): lee la consigna para quien todavía no lee.
  useEffect(() => {
    if (leerEnVoz) hablar(`Pinta la bandera de ${reto.nombre}`);
  }, [leerEnVoz, reto.nombre]);

  const pintar = (i) => {
    if (correcto) return;
    if (!colorSel) {
      setAviso('Primero elige un color 🎨');
      setParpadeo(true);
      window.setTimeout(() => setParpadeo(false), 600);
      return;
    }
    setPintado(prev => prev.map((c, k) => (k === i ? colorSel : c)));
    setMal(prev => prev.filter(k => k !== i));
    setAviso('');
  };

  const comprobar = () => {
    const errores = regiones.map((_, i) => i).filter(i => norm(pintado[i]) !== norm(reto.colores[i]));
    if (!errores.length) {
      setCorrecto(true);
      setMal([]);
      setAviso('');
      sonar(880);
      return;
    }
    setMal(errores);
    setAviso(`${mayus(regiones[errores[0]].nombre)} no va de ese color. ¡Inténtalo otra vez!`);
    sonar(220);
  };

  const todoPintado = pintado.every(Boolean);
  const angostas = regiones.map((r, i) => ({ r, i })).filter(({ r }) => r.grosor < GROSOR_MINIMO);
  const em = reto.emblema;
  const emAncho = em ? W * (em.ancho ?? 0.27) : 0;

  return (
    <div className="pb-reto">
      <p className="pb-consigna">Pinta la bandera de <strong>{reto.nombre}</strong></p>

      {reto.mostrar_modelo && reto.imagen_url && (
        <div className="pb-modelo">
          <span>Así es:</span>
          <img key={reto.imagen_url} src={reto.imagen_url} alt="" />
        </div>
      )}

      <svg
        className={`pb-svg ${correcto ? 'pb-correcto' : ''}`}
        viewBox={`0 0 ${W} ${H}`}
        style={{ aspectRatio: `${W} / ${H}` }}
        role="img"
        aria-label={`Bandera para pintar: ${reto.nombre}`}
      >
        <defs>
          {/* Sin pintar = rayitas: así no se confunde con el blanco de verdad */}
          <pattern id={idRayas} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="#f4f6f8" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#d5dbe1" strokeWidth="4" />
          </pattern>
        </defs>
        {regiones.map((r, i) => (
          <Region key={i} r={r} i={i} fill={pintado[i] || `url(#${idRayas})`} pintada={!!pintado[i]} onTocar={pintar} />
        ))}
        {/* El emblema no se pinta: pointer-events none para que no se trague los toques */}
        {em && (
          <image
            href={em.url}
            x={W * (em.x ?? 0.5) - emAncho / 2}
            y={H * (em.y ?? 0.5) - emAncho / 2}
            width={emAncho}
            height={emAncho}
            preserveAspectRatio="xMidYMid meet"
            pointerEvents="none"
          />
        )}
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" className="pb-marco" pointerEvents="none" />
        {mal.map(i => (
          <text key={`mal-${i}`} className="pb-mal" x={regiones[i].ancla[0]} y={regiones[i].ancla[1]} textAnchor="middle" dominantBaseline="central" pointerEvents="none">❗</text>
        ))}
      </svg>

      {/* Regiones angostas (el borde de la cruz de Noruega): también con botón */}
      {angostas.length > 0 && !correcto && (
        <div className="pb-angostas">
          {angostas.map(({ r, i }) => (
            <button key={i} type="button" className="pb-region-btn" data-region={i} onClick={() => pintar(i)}>
              <span className="pb-muestra" style={{ background: pintado[i] || undefined }} />
              {mayus(r.nombre)}
            </button>
          ))}
        </div>
      )}

      {!correcto && (
        <div className={`pb-paleta ${parpadeo ? 'pb-parpadeo' : ''}`}>
          {reto.paleta.map((c) => (
            <button
              key={c}
              type="button"
              className={`pb-color ${norm(colorSel) === norm(c) ? 'pb-color-sel' : ''}`}
              style={{ background: c }}
              data-color={c}
              aria-label={`Color ${c}`}
              onClick={() => { setColorSel(c); setAviso(''); }}
            />
          ))}
        </div>
      )}

      {aviso && <p className="pb-aviso">{aviso}</p>}

      {!correcto && (
        <button type="button" className="pb-btn pb-comprobar" disabled={!todoPintado} onClick={comprobar}>
          ¿Quedó bien? ✓
        </button>
      )}

      {correcto && (
        <div className="pb-resultado">
          <p className="pb-bien">🎉 ¡Así es la bandera de {reto.nombre}!</p>
          {reto.imagen_url && <img key={reto.imagen_url} className="pb-real" src={reto.imagen_url} alt="" />}
          {reto.explicacion && <p className="pb-explicacion">💡 {reto.explicacion}</p>}
          <button type="button" className="pb-btn pb-siguiente" onClick={onListo}>
            {esUltimo ? '¡Terminar!' : 'Siguiente →'}
          </button>
        </div>
      )}
    </div>
  );
};

const PintaBandera = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [idx, setIdx] = useState(0);
  const [fin, setFin] = useState(false);

  if (!retos.length) return <div>No hay banderas para pintar.</div>;

  if (fin) {
    return (
      <div className="pb-container pb-fin">
        <div className="pb-fin-emoji">🎨</div>
        <h3>¡Pintaste {retos.length === 1 ? 'la bandera' : `las ${retos.length} banderas`}!</h3>
        <button type="button" className="pb-btn pb-siguiente" onClick={onCompletar}>Continuar</button>
      </div>
    );
  }

  return (
    <div className="pb-container">
      <div className="pb-progreso">
        {retos.map((_, i) => (
          <span key={i} className={`pb-punto ${i < idx ? 'hecho' : ''} ${i === idx ? 'actual' : ''}`} />
        ))}
      </div>
      <RetoPinta
        key={idx}
        reto={retos[idx]}
        leerEnVoz={!!mision.leer_en_voz}
        esUltimo={idx === retos.length - 1}
        onListo={() => (idx + 1 < retos.length ? setIdx(idx + 1) : setFin(true))}
      />
    </div>
  );
};

export default PintaBandera;
