import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth.jsx';
import MisionRenderer from '../components/aventura/MisionRenderer';
import './Peques.css';

/**
 * Peques — "Modo Peques": lanzador kid-safe para niños de 2-5 años.
 * Tarjetones grandes, sin menús, con candado de adultos para salir.
 * Cada tarjeta es un juego nativo o un "atajo" a una actividad existente.
 */
// Tarjetas por defecto (respaldo si la colección `peques` de Firestore está vacía).
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
    kind: 'atajo', coleccion: 'ciencias', docId: 'C0-11_laboratorio-de-colores' },
  { key: 'pintar', titulo: 'Pintar', emoji: '🎨', color: '#ff8fab',
    kind: 'atajo', coleccion: 'dibujo', docId: 'D0-06_sol-brillante' },
  { key: 'dibujar', titulo: 'Dibujar', emoji: '✏️', color: '#8ecae6',
    kind: 'atajo', coleccion: 'dibujo', docId: 'D0-15_mi-familia' },
];

const Peques = () => {
  const { activeProfile } = useAuth();
  const navigate = useNavigate();
  const [carta, setCarta] = useState(null);
  const [gate, setGate] = useState(null); // null | { a, b, correcto, opciones }
  const [cards, setCards] = useState(null); // null = cargando; luego array de tarjetas

  // Lee las tarjetas de la colección `peques`; si está vacía o falla, usa las nativas.
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

  // Genera el reto del candado en el handler (no durante el render).
  const abrirGate = () => {
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 2 + Math.floor(Math.random() * 6);
    const correcto = a + b;
    const opciones = [correcto, correcto + 2, Math.max(1, correcto - 3)].sort(() => Math.random() - 0.5);
    setGate({ a, b, correcto, opciones });
  };

  return (
    <div className="peques-bg">
      {carta ? (
        <div className="peques-juego">
          <button className="peques-home" onClick={volver} title="Volver">🏠</button>
          {carta.kind === 'nativo' ? (
            <MisionRenderer mision={carta.mision} onCompletar={volver} />
          ) : (
            <AtajoRunner coleccion={carta.coleccion} docId={carta.docId} onCompletar={volver} />
          )}
        </div>
      ) : (
        <>
          <div className="peques-top">
            <h1 className="peques-titulo">
              ¡Hola, {activeProfile?.nombre || 'peque'}! <span>{activeProfile?.avatar || '🙂'}</span>
            </h1>
            {esPeque ? (
              <button className="peques-lock" onClick={abrirGate} title="Salida para adultos">🔒</button>
            ) : (
              <button className="peques-lock" onClick={() => navigate('/dashboard')} title="Salir">🚪</button>
            )}
          </div>

          <div className="peques-grid">
            {cards.map((c) => (
              <button key={c.key} className="peques-card" style={{ background: c.color }} onClick={() => setCarta(c)}>
                <span className="peques-card-emoji">{c.emoji}</span>
                <span className="peques-card-titulo">{c.titulo}</span>
              </button>
            ))}
          </div>

          {gate && (
            <ParentGate reto={gate} onCerrar={() => setGate(null)} onOk={() => navigate('/elegir-perfil')} />
          )}
        </>
      )}
    </div>
  );
};

/** Carga una actividad existente por {coleccion, id} y la renderiza con MisionRenderer. */
const AtajoRunner = ({ coleccion, docId, onCompletar }) => {
  const [mision, setMision] = useState(null);
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error

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
