import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth.jsx';
import MisionRenderer from '../components/aventura/MisionRenderer';
import DibujarHub from './DibujarHub';
import './Peques.css';

/**
 * Peques — "Modo Peques": lanzador kid-safe para niños de 2-5 años.
 * Dos niveles: (1) TIPOS de juego; (2) al tocar un tipo, la LISTA visual de sus juegos.
 * Si un tipo tiene un solo juego, se abre directo. Candado de adultos para salir.
 */

// Grupos (tipos de juego) que se muestran en el primer nivel.
const GRUPOS = [
  { id: 'toca', titulo: '¡Toca!', emoji: '✨', color: '#f6c445', orden: 1 },
  { id: 'diferente', titulo: '¿Cuál es diferente?', emoji: '🔎', color: '#c3b1e1', orden: 2 },
  { id: 'memoria', titulo: 'Memoria', emoji: '🧠', color: '#ffd6a5', orden: 3 },
  { id: 'sombras', titulo: 'Sombras', emoji: '🕵️', color: '#bde0fe', orden: 4 },
  { id: 'contar', titulo: 'Contar', emoji: '🔢', color: '#a0c4ff', orden: 5 },
  { id: 'patrones', titulo: '¿Qué sigue?', emoji: '➡️', color: '#b8e0d2', orden: 6 },
  { id: 'tamanos', titulo: 'Grande y pequeño', emoji: '📏', color: '#ffb3c1', orden: 7 },
  { id: 'masmenos', titulo: 'Más o menos', emoji: '⚖️', color: '#ffd8a8', orden: 8 },
  { id: 'formas', titulo: 'Formas', emoji: '🔷', color: '#d0bfff', orden: 9 },
];

const TIPO_GRUPO = {
  'tap-and-celebrate': 'toca',
  'cual-es-diferente': 'diferente',
  'memoria': 'memoria',
  'relaciona-sombras': 'sombras',
  'contar': 'contar',
  'que-sigue': 'patrones',
  'tamanos': 'tamanos',
  'mas-menos': 'masmenos',
  'formas': 'formas',
  'mezclador-colores': 'crear',
  'dibujo-libre': 'crear',
  'colorear': 'crear',
};

const grupoDe = (card) => (card.kind === 'atajo' ? 'crear' : (TIPO_GRUPO[card.mision?.tipo] || 'crear'));

// Tarjetas por defecto (respaldo si la colección `peques` está vacía o no hay internet).
// Todas NATIVAS = funcionan offline.
const CARDS_FALLBACK = [
  { key: 'celebra', titulo: '¡Toca!', emoji: '✨', color: '#f6c445',
    kind: 'nativo', mision: { id: 'peque-celebra', tipo: 'tap-and-celebrate' } },
  { key: 'diferente', titulo: '¿Cuál es diferente?', emoji: '🔎', color: '#c3b1e1',
    kind: 'nativo', mision: { id: 'peque-diferente', tipo: 'cual-es-diferente' } },
  { key: 'memoria', titulo: 'Memoria', emoji: '🧠', color: '#ffd6a5',
    kind: 'nativo', mision: { id: 'peque-memoria', tipo: 'memoria' } },
  { key: 'sombras', titulo: 'Sombras', emoji: '🕵️', color: '#bde0fe',
    kind: 'nativo', mision: { id: 'peque-sombras', tipo: 'relaciona-sombras' } },
  { key: 'contar', titulo: 'Contar', emoji: '🔢', color: '#a0c4ff',
    kind: 'nativo', mision: { id: 'peque-contar', tipo: 'contar' } },
  { key: 'que-sigue', titulo: '¿Qué sigue?', emoji: '➡️', color: '#b8e0d2',
    kind: 'nativo', mision: { id: 'peque-que-sigue', tipo: 'que-sigue' } },
  { key: 'tamanos', titulo: 'Grande y pequeño', emoji: '📏', color: '#ffb3c1',
    kind: 'nativo', mision: { id: 'peque-tamanos', tipo: 'tamanos' } },
  { key: 'mas-menos', titulo: 'Más o menos', emoji: '⚖️', color: '#ffd8a8',
    kind: 'nativo', mision: { id: 'peque-mas-menos', tipo: 'mas-menos' } },
  { key: 'formas', titulo: 'Formas', emoji: '🔷', color: '#d0bfff',
    kind: 'nativo', mision: { id: 'peque-formas', tipo: 'formas' } },
  { key: 'colores', titulo: 'Colores', emoji: '🌈', color: '#a0e8af',
    kind: 'nativo', mision: { id: 'peque-colores', tipo: 'mezclador-colores', modo: 'explorar', colores_base: ['rojo', 'amarillo', 'azul'], instruccion: 'Toca dos colores y mira qué sale.' } },
  { key: 'dibujar', titulo: 'Dibujar', emoji: '✏️', color: '#8ecae6',
    kind: 'nativo', mision: { id: 'peque-dibujar', tipo: 'dibujo-libre', sugerencias: ['Dibuja lo que quieras'] } },
  { key: 'colorear-sol', titulo: 'Colorear sol', emoji: '☀️', color: '#ffe08a',
    kind: 'nativo', mision: { id: 'peque-colorear-sol', tipo: 'colorear', instruccion: 'Colorea el sol', imagen_contorno_url: '/dibujo/colorear/D0-06_sol-brillante.svg', colores_sugeridos: ['#f1c40f', '#e67e22', '#e74c3c', '#fff200'] } },
  { key: 'colorear-mariposa', titulo: 'Colorear mariposa', emoji: '🦋', color: '#bde0fe',
    kind: 'nativo', mision: { id: 'peque-colorear-mariposa', tipo: 'colorear', instruccion: 'Colorea la mariposa', imagen_contorno_url: '/dibujo/colorear/D0-09_mariposa-bonita.svg', colores_sugeridos: ['#3498db', '#e91e63', '#9b59b6', '#f1c40f'] } },
  { key: 'colorear-flor', titulo: 'Colorear flor', emoji: '🌼', color: '#ffd6a5',
    kind: 'nativo', mision: { id: 'peque-colorear-flor', tipo: 'colorear', instruccion: 'Colorea la flor', imagen_contorno_url: '/dibujo/colorear/D0-07_flor-del-jardin.svg', colores_sugeridos: ['#e91e63', '#f1c40f', '#2ecc71', '#e74c3c'] } },
];

const Peques = () => {
  const { activeProfile } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState(null); // null = cargando
  const [grupoAbierto, setGrupoAbierto] = useState(null); // id de grupo o null (nivel 1)
  const [carta, setCarta] = useState(null); // juego en curso
  const [gate, setGate] = useState(null);
  const [arteAbierto, setArteAbierto] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'peques'));
        if (!vivo) return;
        if (snap.empty) { setCards(CARDS_FALLBACK); return; }
        const lista = snap.docs
          .map((d) => ({ key: d.id, ...d.data() }))
          .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
        setCards(lista);
      } catch (e) {
        console.warn('No se pudo leer la colección peques; usando juegos nativos:', e);
        if (vivo) setCards(CARDS_FALLBACK);
      }
    })();
    return () => { vivo = false; };
  }, []);

  if (!cards) {
    return (
      <div className="peques-bg">
        <div className="peques-cargando">Cargando… ⏳</div>
      </div>
    );
  }

  const esPeque = activeProfile?.esPeque;
  const volver = () => setCarta(null);

  // Grupos que tienen al menos un juego, con sus cartas.
  const grupos = GRUPOS
    .map((g) => ({ ...g, cartas: cards.filter((c) => grupoDe(c) === g.id) }))
    .filter((g) => g.cartas.length > 0);
  const grupoActual = grupos.find((g) => g.id === grupoAbierto) || null;

  const abrirGrupo = (g) => {
    if (g.cartas.length === 1) setCarta(g.cartas[0]);
    else setGrupoAbierto(g.id);
  };

  const abrirGate = () => {
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 2 + Math.floor(Math.random() * 6);
    const correcto = a + b;
    const opciones = [correcto, correcto + 2, Math.max(1, correcto - 3)].sort(() => Math.random() - 0.5);
    setGate({ a, b, correcto, opciones });
  };

  // === Vista de juego ===
  if (carta) {
    return (
      <div className="peques-bg">
        <div className="peques-juego">
          <button className="peques-home" onClick={volver} title="Volver">🏠</button>
          {carta.kind === 'nativo' ? (
            <MisionRenderer mision={carta.mision} onCompletar={volver} />
          ) : (
            <AtajoRunner coleccion={carta.coleccion} docId={carta.docId} onCompletar={volver} />
          )}
        </div>
      </div>
    );
  }

  // === Sección Arte (hub dinámico de 3 niveles) ===
  if (arteAbierto) {
    return (
      <div className="peques-bg">
        <DibujarHub onSalir={() => setArteAbierto(false)} />
      </div>
    );
  }

  const cartasVisibles = grupoActual ? grupoActual.cartas : null;

  return (
    <div className="peques-bg">
      <div className="peques-top">
        {grupoActual ? (
          <button className="peques-back" onClick={() => setGrupoAbierto(null)} title="Atrás">⬅️</button>
        ) : (
          <h1 className="peques-titulo">
            ¡Hola, {activeProfile?.nombre || 'peque'}! <span>{activeProfile?.avatar || '🙂'}</span>
          </h1>
        )}
        {esPeque ? (
          <button className="peques-lock" onClick={abrirGate} title="Salida para adultos">🔒</button>
        ) : (
          <button className="peques-lock" onClick={() => navigate('/dashboard')} title="Salir">🚪</button>
        )}
      </div>

      {grupoActual && (
        <h2 className="peques-grupo-titulo">{grupoActual.emoji} {grupoActual.titulo}</h2>
      )}

      <div className="peques-grid">
        {cartasVisibles
          ? cartasVisibles.map((c) => (
            <button key={c.key} className="peques-card" style={{ background: c.color }} onClick={() => setCarta(c)}>
              <span className="peques-card-emoji">{c.emoji}</span>
              <span className="peques-card-titulo">{c.titulo}</span>
            </button>
          ))
          : (
            <>
              {grupos.map((g) => (
                <button key={g.id} className="peques-card" style={{ background: g.color }} onClick={() => abrirGrupo(g)}>
                  <span className="peques-card-emoji">{g.emoji}</span>
                  <span className="peques-card-titulo">{g.titulo}</span>
                  {g.cartas.length > 1 && <span className="peques-card-badge">{g.cartas.length}</span>}
                </button>
              ))}
              <button key="arte" className="peques-card" style={{ background: '#a0e8af' }} onClick={() => setArteAbierto(true)}>
                <span className="peques-card-emoji">🎨</span>
                <span className="peques-card-titulo">Arte</span>
              </button>
            </>
          )}
      </div>

      {gate && (
        <ParentGate reto={gate} onCerrar={() => setGate(null)} onOk={() => navigate('/elegir-perfil')} />
      )}
    </div>
  );
};

/** Carga una actividad existente por {coleccion, id} y la renderiza (compat. con atajos). */
const AtajoRunner = ({ coleccion, docId, onCompletar }) => {
  const [mision, setMision] = useState(null);
  const [estado, setEstado] = useState('cargando');

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, coleccion, docId));
        if (!vivo) return;
        const data = snap.exists() ? snap.data() : null;
        if (data && Array.isArray(data.misiones) && data.misiones.length > 0) {
          setMision(data.misiones[0]);
          setEstado('ok');
        } else {
          setEstado('error');
        }
      } catch (e) {
        console.warn('No se pudo cargar el atajo:', e);
        if (vivo) setEstado('error');
      }
    })();
    return () => { vivo = false; };
  }, [coleccion, docId]);

  if (estado === 'cargando') return <div className="peques-cargando">Cargando… ⏳</div>;
  if (estado === 'error') return <div className="peques-cargando">Este juego no está listo todavía. Toca 🏠</div>;
  return <MisionRenderer mision={mision} onCompletar={onCompletar} />;
};

/** Candado de adultos: resolver una suma simple para salir de Modo Peques. */
const ParentGate = ({ reto, onCerrar, onOk }) => {
  const { a, b, correcto, opciones } = reto;
  return (
    <div className="peques-gate-overlay" onClick={onCerrar}>
      <div className="peques-gate" onClick={(e) => e.stopPropagation()}>
        <p className="peques-gate-titulo">🔒 Solo para adultos</p>
        <p className="peques-gate-op">¿Cuánto es {a} + {b}?</p>
        <div className="peques-gate-opciones">
          {opciones.map((o) => (
            <button key={o} onClick={() => (o === correcto ? onOk() : onCerrar())}>{o}</button>
          ))}
        </div>
        <button className="peques-gate-cancelar" onClick={onCerrar}>Cancelar</button>
      </div>
    </div>
  );
};

export default Peques;
