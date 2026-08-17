import React, { useMemo, useRef, useImperativeHandle } from 'react';
import './Teclado.css';
import { esNegra, nombreDeMidi } from '../../utils/musica';

/**
 * Teclado — teclado de piano visual que ilumina teclas por mano.
 * Reutilizable: lo usa el teleprompter y podrá usarlo la variante
 * "Nota → Tecla" de identifica-nota (PROGRAMA_PIANO).
 *
 * API imperativa (via ref):
 *   setActivas(derecha, izquierda)  — colecciones de números MIDI
 *   limpiar()
 *
 * Alterna clases directamente en el DOM (sin estado de React): el bucle de
 * animación del teleprompter corre a 60fps y este componente jamás debe
 * provocar re-renders ni lecturas de layout. Solo escribe classList.
 */
const Teclado = ({ midiMin = 60, midiMax = 83, mostrarNombres = false, ref }) => {
  const teclasRef = useRef(new Map());     // midi → elemento DOM
  const encendidasRef = useRef(new Map()); // midi → 'der' | 'izq' | 'ambas'

  const { blancas, negras, nBlancas } = useMemo(() => {
    const b = [];
    for (let m = midiMin; m <= midiMax; m++) if (!esNegra(m)) b.push(m);
    const ancho = 100 / (b.length || 1);
    const n = [];
    for (let m = midiMin; m <= midiMax; m++) {
      if (!esNegra(m)) continue;
      let k = 0;
      for (const w of b) if (w < m) k++;
      // Centrada en la frontera entre sus dos blancas vecinas.
      n.push({ midi: m, left: k * ancho - ancho * 0.31 });
    }
    return { blancas: b, negras: n, nBlancas: b.length || 1 };
  }, [midiMin, midiMax]);

  const refTecla = (midi) => (el) => {
    teclasRef.current.set(midi, el);
    return () => { teclasRef.current.delete(midi); };
  };

  useImperativeHandle(ref, () => {
    const apagar = (m) => {
      const el = teclasRef.current.get(m);
      if (el) el.classList.remove('tcl-der', 'tcl-izq', 'tcl-ambas');
    };
    return {
      // Solo se llama cuando el conjunto activo CAMBIA (no cada frame), así que
      // puede permitirse construir el diff con un Map pequeño.
      setActivas(derecha, izquierda) {
        const nuevas = new Map();
        if (derecha) derecha.forEach((m) => nuevas.set(m, 'der'));
        if (izquierda) izquierda.forEach((m) => nuevas.set(m, nuevas.has(m) ? 'ambas' : 'izq'));
        encendidasRef.current.forEach((mano, m) => {
          if (nuevas.get(m) !== mano) apagar(m);
        });
        nuevas.forEach((mano, m) => {
          if (encendidasRef.current.get(m) !== mano) {
            const el = teclasRef.current.get(m);
            if (el) {
              el.classList.add(mano === 'der' ? 'tcl-der' : mano === 'izq' ? 'tcl-izq' : 'tcl-ambas');
            }
          }
        });
        encendidasRef.current = nuevas;
      },
      limpiar() {
        encendidasRef.current.forEach((mano, m) => apagar(m));
        encendidasRef.current = new Map();
      },
    };
  }, []);

  return (
    <div className="tcl" role="img" aria-label="Teclado de piano">
      {blancas.map((m) => (
        <div
          key={m}
          ref={refTecla(m)}
          className="tcl-tecla tcl-blanca"
          style={{ width: `${100 / nBlancas}%` }}
        >
          {(mostrarNombres || m === 60) && (
            <span className="tcl-nombre">{nombreDeMidi(m).nombre}</span>
          )}
        </div>
      ))}
      {negras.map((n) => (
        <div
          key={n.midi}
          ref={refTecla(n.midi)}
          className="tcl-tecla tcl-negra"
          style={{ left: `${n.left}%`, width: `${(100 / nBlancas) * 0.62}%` }}
        />
      ))}
    </div>
  );
};

export default React.memo(Teclado);
