import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import MisionRenderer from '../components/aventura/MisionRenderer';
import './Peques.css';

/**
 * DibujarHub — sección "Arte" dentro de Modo Peques.
 * Nivel 1 (Peques) = tile Arte → Nivel 2 = subsecciones (Colorear, Dibujar, Línea guía,
 * Mezclar) → Nivel 3 = actividades jaladas DINÁMICAMENTE de la colección `dibujo`
 * (una sola fuente de verdad) + unas nativas de respaldo offline. Al abrir una actividad
 * se renderiza normal (MisionRenderer), como en el módulo de Arte.
 */
const SUBSECCIONES = [
  { tipo: 'colorear', titulo: 'Colorear', emoji: '🖍️', color: '#ffd6a5' },
  { tipo: 'dibujo-libre', titulo: 'Dibujar', emoji: '✏️', color: '#8ecae6' },
  { tipo: 'dibujo-guiado', titulo: 'Línea guía', emoji: '📝', color: '#b8e0d2' },
  { tipo: 'mezclador-colores', titulo: 'Mezclar colores', emoji: '🌈', color: '#a0e8af' },
];

// Actividades nativas de respaldo: funcionan OFFLINE (sin leer de Firebase).
const NATIVAS = [
  { id: 'peque-colorear-sol', tipo: 'colorear', titulo: 'Sol', emoji: '☀️',
    mision: { id: 'peque-colorear-sol', tipo: 'colorear', instruccion: 'Colorea el sol', imagen_contorno_url: '/dibujo/colorear/D0-06_sol-brillante.svg', colores_sugeridos: ['#f1c40f', '#e67e22', '#e74c3c', '#fff200'] } },
  { id: 'peque-colorear-mariposa', tipo: 'colorear', titulo: 'Mariposa', emoji: '🦋',
    mision: { id: 'peque-colorear-mariposa', tipo: 'colorear', instruccion: 'Colorea la mariposa', imagen_contorno_url: '/dibujo/colorear/D0-09_mariposa-bonita.svg', colores_sugeridos: ['#3498db', '#e91e63', '#9b59b6', '#f1c40f'] } },
  { id: 'peque-colorear-flor', tipo: 'colorear', titulo: 'Flor', emoji: '🌼',
    mision: { id: 'peque-colorear-flor', tipo: 'colorear', instruccion: 'Colorea la flor', imagen_contorno_url: '/dibujo/colorear/D0-07_flor-del-jardin.svg', colores_sugeridos: ['#e91e63', '#f1c40f', '#2ecc71', '#e74c3c'] } },
  { id: 'peque-dibujar-libre', tipo: 'dibujo-libre', titulo: 'Lienzo libre', emoji: '🎨',
    mision: { id: 'peque-dibujar-libre', tipo: 'dibujo-libre', sugerencias: ['Dibuja lo que quieras'] } },
  { id: 'peque-mezclar', tipo: 'mezclador-colores', titulo: 'Mezclar', emoji: '🌈',
    mision: { id: 'peque-mezclar', tipo: 'mezclador-colores', modo: 'explorar', colores_base: ['rojo', 'amarillo', 'azul'], instruccion: 'Toca dos colores y mira qué sale.' } },
];

const DibujarHub = ({ onSalir }) => {
  const [docs, setDocs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subseccion, setSubseccion] = useState(null); // tipo | null
  const [actividad, setActividad] = useState(null); // { mision } | null

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'dibujo'));
        if (!vivo) return;
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((x) => Array.isArray(x.misiones) && x.misiones.length > 0);
        setDocs(lista);
      } catch (e) {
        console.warn('No se pudo leer `dibujo`; solo respaldo offline:', e);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  // Actividades de un tipo: nativas (respaldo) + las de `dibujo`, ordenadas por nivel.
  const actividadesDe = (tipo) => {
    const nativas = NATIVAS.filter((n) => n.tipo === tipo);
    const dinamicas = docs
      .filter((d) => (d.misiones[0]?.tipo || d.tipo) === tipo)
      .sort((a, b) => String(a.nivel || a.id).localeCompare(String(b.nivel || b.id)))
      .map((d) => ({
        id: d.id,
        tipo,
        titulo: d.titulo || 'Dibujo',
        emoji: d.misiones[0]?.emoji || '🎨',
        mision: d.misiones[0],
      }));
    return [...nativas, ...dinamicas];
  };

  const subseccionesConContenido = SUBSECCIONES
    .map((s) => ({ ...s, actividades: actividadesDe(s.tipo) }))
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
    const sub = subseccionesConContenido.find((s) => s.tipo === subseccion);
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
      <h2 className="peques-grupo-titulo">🎨 Arte</h2>
      {cargando && <div className="peques-cargando">Cargando dibujos… ⏳</div>}
      <div className="peques-grid">
        {subseccionesConContenido.map((s) => (
          <button key={s.tipo} className="peques-card" style={{ background: s.color }} onClick={() => setSubseccion(s.tipo)}>
            <span className="peques-card-emoji">{s.emoji}</span>
            <span className="peques-card-titulo">{s.titulo}</span>
            <span className="peques-card-badge">{s.actividades.length}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default DibujarHub;
