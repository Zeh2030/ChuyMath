import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import MisionRenderer from '../components/aventura/MisionRenderer';
import './Peques.css';

/**
 * LetrasHub — sección "Letras" dentro de Modo Peques (mismo patrón que DibujarHub).
 * Nivel 1 (Peques) = tile Letras → Nivel 2 = subsecciones → Nivel 3 = actividades
 * jaladas de la colección `letras` (una sola fuente de verdad con el módulo normal).
 *
 * Dos diferencias a propósito respecto de DibujarHub:
 *  1. Aplana las misiones: cada misión de un documento es su propia tarjeta. Así los
 *     5 trazos de "Traza las vocales" son 5 tarjetas y no un wizard de 5 pasos, que es
 *     mucho pedir a los 4 años.
 *  2. Las nativas son respaldo PURO (solo si la colección está vacía o no hay internet),
 *     no se mezclan con las dinámicas: si no, cada vocal aparecería duplicada.
 */

// La subsección de un juego. `letra-quiz` se parte por `modo` porque cada modo es,
// para la niña, un juego distinto aunque compartan motor.
const claveDe = (mision) =>
  mision?.tipo === 'letra-quiz' ? `letra-quiz:${mision.modo || 'primera-letra'}` : mision?.tipo;

const SUBSECCIONES = [
  { clave: 'abecedario', titulo: 'Conoce las letras', emoji: '🔤', color: '#ffd6a5' },
  { clave: 'letra-quiz:primera-letra', titulo: 'Con que empieza?', emoji: '🔎', color: '#bde0fe' },
  { clave: 'letra-quiz:reconoce-letra', titulo: 'Toca la letra', emoji: '👂', color: '#b8e0d2' },
  { clave: 'letra-quiz:mayus-minus', titulo: 'Grande y chiquita', emoji: '🔠', color: '#c3b1e1' },
  { clave: 'colorear', titulo: 'Traza', emoji: '✏️', color: '#ffb3c1' },
];

// Respaldo offline: los motores traen su propio contenido de vocales por defecto y los
// SVG de trazo son archivos locales, así que todo esto funciona sin internet.
const TRAZOS_NATIVOS = [
  { letra: 'A', emoji: '🌳', archivo: 'L0-A_vocal-a' },
  { letra: 'E', emoji: '🐘', archivo: 'L0-E_vocal-e' },
  { letra: 'I', emoji: '🏝️', archivo: 'L0-I_vocal-i' },
  { letra: 'O', emoji: '🐻', archivo: 'L0-O_vocal-o' },
  { letra: 'U', emoji: '🍇', archivo: 'L0-U_vocal-u' },
];

const NATIVAS = [
  { id: 'letras-abecedario', titulo: 'Las vocales', emoji: '🔤',
    mision: { id: 'letras-abecedario', tipo: 'abecedario' } },
  { id: 'letras-primera-letra', titulo: 'Con que empieza?', emoji: '🔎',
    mision: { id: 'letras-primera-letra', tipo: 'letra-quiz', modo: 'primera-letra' } },
  { id: 'letras-reconoce', titulo: 'Toca la vocal', emoji: '👂',
    mision: { id: 'letras-reconoce', tipo: 'letra-quiz', modo: 'reconoce-letra' } },
  { id: 'letras-mayus-minus', titulo: 'Grande y chiquita', emoji: '🔠',
    mision: { id: 'letras-mayus-minus', tipo: 'letra-quiz', modo: 'mayus-minus' } },
  ...TRAZOS_NATIVOS.map((t) => ({
    id: `letras-traza-${t.letra}`,
    titulo: `La ${t.letra}`,
    emoji: t.emoji,
    mision: {
      id: `letras-traza-${t.letra}`,
      tipo: 'colorear',
      instruccion: 'Sigue los puntitos: del punto verde al rojo.',
      imagen_contorno_url: `/letras/trazos/${t.archivo}.svg`,
      colores_sugeridos: ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6'],
    },
  })),
].map((a) => ({ ...a, clave: claveDe(a.mision) }));

const LetrasHub = ({ onSalir }) => {
  const [actividades, setActividades] = useState(null); // null = cargando
  const [subseccion, setSubseccion] = useState(null); // clave | null
  const [actividad, setActividad] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'letras'));
        if (!vivo) return;
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => Array.isArray(d.misiones) && d.misiones.length > 0)
          .sort((a, b) => String(a.nivel || a.id).localeCompare(String(b.nivel || b.id)))
          .flatMap((d) =>
            d.misiones.map((m, i) => ({
              id: `${d.id}#${i}`,
              clave: claveDe(m),
              titulo: m.titulo || d.titulo,
              emoji: m.emoji || '🔤',
              mision: { ...m, id: m.id || `${d.id}-${i}` },
            }))
          );
        setActividades(lista.length ? lista : NATIVAS);
      } catch (e) {
        console.warn('No se pudo leer `letras`; usando el respaldo offline:', e);
        if (vivo) setActividades(NATIVAS);
      }
    })();
    return () => { vivo = false; };
  }, []);

  if (!actividades) {
    return <div className="peques-cargando">Cargando letras… ⏳</div>;
  }

  const subseccionesConContenido = SUBSECCIONES
    .map((s) => ({ ...s, actividades: actividades.filter((a) => a.clave === s.clave) }))
    .filter((s) => s.actividades.length > 0);

  // === Jugando una actividad (render normal) ===
  if (actividad) {
    return (
      <div className="peques-juego">
        <button className="peques-home" onClick={() => setActividad(null)} title="Volver">🏠</button>
        <MisionRenderer mision={actividad.mision} onCompletar={() => setActividad(null)} />
      </div>
    );
  }

  // === Nivel 3: actividades de una subsección ===
  if (subseccion) {
    const sub = subseccionesConContenido.find((s) => s.clave === subseccion);
    if (!sub) { setSubseccion(null); return null; }
    return (
      <>
        <div className="peques-top">
          <button className="peques-back" onClick={() => setSubseccion(null)} title="Atrás">⬅️</button>
        </div>
        <h2 className="peques-grupo-titulo">{sub.emoji} {sub.titulo}</h2>
        <div className="peques-grid">
          {sub.actividades.map((a) => (
            <button key={a.id} className="peques-card" style={{ background: sub.color }} onClick={() => setActividad(a)}>
              <span className="peques-card-emoji">{a.emoji}</span>
              <span className="peques-card-titulo">{a.titulo}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  // === Nivel 2: subsecciones ===
  return (
    <>
      <div className="peques-top">
        <button className="peques-back" onClick={onSalir} title="Atrás">⬅️</button>
      </div>
      <h2 className="peques-grupo-titulo">📖 Letras</h2>
      <div className="peques-grid">
        {subseccionesConContenido.map((s) => {
          // Una sola actividad: abrir directo, sin pantalla intermedia (como en Peques).
          const abrir = () => (s.actividades.length === 1 ? setActividad(s.actividades[0]) : setSubseccion(s.clave));
          return (
            <button key={s.clave} className="peques-card" style={{ background: s.color }} onClick={abrir}>
              <span className="peques-card-emoji">{s.emoji}</span>
              <span className="peques-card-titulo">{s.titulo}</span>
              {s.actividades.length > 1 && <span className="peques-card-badge">{s.actividades.length}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default LetrasHub;
