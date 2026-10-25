import React, { useState } from 'react';
import { sonar } from '../../../utils/sonido';
import './BanderaEscondida.css';

/**
 * BanderaEscondida — la bandera está tapada por una cuadrícula de 4×3; se destapan
 * cuadros poco a poco y hay que adivinar de quién es con las menos pistas posibles.
 * Módulo de Banderas (Geografía).
 *
 * Reto (misma forma que image-picker bandera → nombre):
 *   { imagen_url, opciones: [{ label }], respuesta: <índice>, explicacion?, bandera | bandera_id }
 *
 * Empiezan 2 cuadros destapados. "Destapa otro cuadro" = pista. Un error destapa uno
 * más y deshabilita esa opción. Al acertar: ⭐⭐⭐ con ≤4 cuadros, ⭐⭐ con ≤7, ⭐ con más.
 * Cada reto es un hijo con key={idx}: su estado nace limpio, sin efectos.
 */
const COLS = 4;
const FILAS = 3;
const TOTAL = COLS * FILAS;
const INICIALES = 2;

const barajar = (arr) => {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
};

const estrellasPor = (destapados) => (destapados <= 4 ? 3 : destapados <= 7 ? 2 : 1);

const RetoEscondido = ({ reto, onFin, esUltimo }) => {
  // Orden de destape y opciones barajados una sola vez por reto
  const [orden] = useState(() => barajar([...Array(TOTAL).keys()]));
  const [opciones] = useState(() => barajar((reto.opciones || []).map((o, i) => ({ ...o, i }))));
  const [destapados, setDestapados] = useState(INICIALES);
  const [descartadas, setDescartadas] = useState([]);
  const [acierto, setAcierto] = useState(null); // estrellas al acertar
  const [cargada, setCargada] = useState(false);

  const visibles = new Set(acierto ? orden : orden.slice(0, destapados));

  const pista = () => setDestapados(d => Math.min(TOTAL - 1, d + 1));

  const elegir = (op) => {
    if (acierto || descartadas.includes(op.i)) return;
    if (op.i === reto.respuesta) {
      sonar(880);
      setAcierto(estrellasPor(destapados));
    } else {
      sonar(220);
      setDescartadas(prev => [...prev, op.i]);
      pista();
    }
  };

  return (
    <div className="be-reto">
      <div className="be-marco">
        {/* Hasta que carga la imagen se muestra un hueco 3:2: si no, con internet
            lento se vería la bandera sin tapar o los cuadros se desalinearían. */}
        {!cargada && <div className="be-cargando">Cargando bandera…</div>}
        <img
          key={reto.imagen_url}
          className="be-imagen"
          src={reto.imagen_url}
          alt=""
          style={{ visibility: cargada ? 'visible' : 'hidden' }}
          onLoad={() => setCargada(true)}
          draggable={false}
        />
        {cargada && (
          <div className="be-cuadricula">
            {[...Array(TOTAL).keys()].map(i => (
              <div key={i} className={`be-cuadro ${visibles.has(i) ? 'destapado' : 'tapado'}`} />
            ))}
          </div>
        )}
      </div>

      {!acierto && (
        <>
          <p className="be-pregunta">¿De quién es esta bandera?</p>
          <button type="button" className="be-pista" onClick={pista} disabled={destapados >= TOTAL - 1}>
            🔍 Destapa otro cuadro
          </button>
        </>
      )}

      <div className="be-opciones">
        {opciones.map(op => {
          let cls = 'be-opcion';
          if (descartadas.includes(op.i)) cls += ' be-descartada';
          if (acierto && op.i === reto.respuesta) cls += ' be-correcta';
          return (
            <button key={op.i} type="button" className={cls} disabled={!!acierto || descartadas.includes(op.i)} onClick={() => elegir(op)}>
              {op.label}
            </button>
          );
        })}
      </div>

      {acierto && (
        <div className="be-resultado">
          <p className="be-estrellas" aria-label={`${acierto} estrellas`}>{'⭐'.repeat(acierto)}{'☆'.repeat(3 - acierto)}</p>
          <p className="be-bien">
            {acierto === 3 ? '¡Con muy pocas pistas!' : acierto === 2 ? '¡Bien!' : '¡La encontraste!'} Destapaste {destapados} de {TOTAL} cuadros.
          </p>
          {reto.explicacion && <p className="be-explicacion">💡 {reto.explicacion}</p>}
          <button type="button" className="be-btn be-siguiente" onClick={() => onFin(acierto)}>
            {esUltimo ? '¡Terminar!' : 'Siguiente →'}
          </button>
        </div>
      )}
    </div>
  );
};

const BanderaEscondida = ({ mision, onCompletar }) => {
  const retos = mision.retos || [];
  const [idx, setIdx] = useState(0);
  const [estrellas, setEstrellas] = useState(0);
  const [fin, setFin] = useState(false);

  if (!retos.length) return <div>No hay banderas escondidas.</div>;

  if (fin) {
    return (
      <div className="be-container be-fin">
        <div className="be-fin-emoji">🕵️</div>
        <h3>¡Descubriste {retos.length === 1 ? 'la bandera' : `las ${retos.length} banderas`}!</h3>
        <p className="be-total">⭐ {estrellas} de {retos.length * 3}</p>
        <button type="button" className="be-btn" onClick={onCompletar}>Continuar</button>
      </div>
    );
  }

  return (
    <div className="be-container">
      <div className="be-progreso">
        <span>{idx + 1} / {retos.length}</span>
        <span>⭐ {estrellas}</span>
      </div>
      <RetoEscondido
        key={idx}
        reto={retos[idx]}
        esUltimo={idx === retos.length - 1}
        onFin={(e) => {
          setEstrellas(s => s + e);
          if (idx + 1 < retos.length) setIdx(idx + 1);
          else setFin(true);
        }}
      />
    </div>
  );
};

export default BanderaEscondida;
