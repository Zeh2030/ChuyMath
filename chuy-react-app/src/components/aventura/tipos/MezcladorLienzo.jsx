import React, { useState } from 'react';
import './MezcladorLienzo.css';
import { getColor, mezclar, ajustarLuz, PRIMARIOS, SECUNDARIOS } from '../../../utils/colorMix';

/**
 * MezcladorLienzo — Mini-mezclador para usar DENTRO del lienzo (Colorear / DibujoLibre).
 *
 * El niño elige dos colores, los mezcla (modelo RYB) y puede aclarar/oscurecer el
 * resultado para crear su propio color, que luego usa como pincel.
 *
 * Props:
 *   onUsar(hex) : se llama con el color final cuando el niño pulsa "Usar este color".
 */
const BASE = [...PRIMARIOS, ...SECUNDARIOS];

const MezcladorLienzo = ({ onUsar }) => {
  const [abierto, setAbierto] = useState(false);
  const [slotA, setSlotA] = useState(null);
  const [slotB, setSlotB] = useState(null);
  const [luz, setLuz] = useState(0);

  // Color de tono resultante (sin ajuste de luz).
  let tono = null;
  if (slotA && slotB) tono = mezclar(slotA, slotB);
  else if (slotA) tono = getColor(slotA);

  const finalHex = tono ? ajustarLuz(tono.hex, luz) : '#ffffff';

  const elegir = (id) => {
    setLuz(0);
    if (!slotA) { setSlotA(id); return; }
    if (!slotB) { setSlotB(id); return; }
    // ya hay dos: reinicia con el nuevo como primero
    setSlotA(id);
    setSlotB(null);
  };

  const reiniciar = () => { setSlotA(null); setSlotB(null); setLuz(0); };

  const usar = () => {
    if (!tono) return;
    onUsar(finalHex);
    setAbierto(false);
    reiniciar();
  };

  return (
    <div className="mezlienzo">
      <button
        className={`mezlienzo-trigger ${abierto ? 'activo' : ''}`}
        onClick={() => setAbierto((v) => !v)}
        title="Crea tu propio color"
      >
        🧪
      </button>

      {abierto && (
        <div className="mezlienzo-panel">
          <div className="mezlienzo-titulo">Crea tu color</div>

          <div className="mezlienzo-colores">
            {BASE.map((id) => {
              const c = getColor(id);
              const usado = id === slotA || id === slotB;
              return (
                <button
                  key={id}
                  className={`mezlienzo-chip ${usado ? 'usado' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => elegir(id)}
                  title={c.nombre}
                />
              );
            })}
          </div>

          <div className="mezlienzo-preview">
            <span className="mezlienzo-swatch" style={{ background: finalHex }} />
            <span className="mezlienzo-nombre">
              {tono ? (luz !== 0 ? `${tono.nombre} ${luz > 0 ? '(claro)' : '(oscuro)'}` : tono.nombre) : 'Elige 2 colores'}
            </span>
          </div>

          <div className="mezlienzo-luz">
            <button
              className="mezlienzo-luz-btn"
              disabled={!tono}
              onClick={() => setLuz((v) => Math.max(-0.6, +(v - 0.2).toFixed(1)))}
              title="Oscurecer"
            >🖤</button>
            <span className="mezlienzo-luz-label">luz</span>
            <button
              className="mezlienzo-luz-btn"
              disabled={!tono}
              onClick={() => setLuz((v) => Math.min(0.6, +(v + 0.2).toFixed(1)))}
              title="Aclarar"
            >🤍</button>
          </div>

          <div className="mezlienzo-acciones">
            <button className="mezlienzo-reiniciar" onClick={reiniciar}>🔄</button>
            <button className="mezlienzo-usar" disabled={!tono} onClick={usar}>
              Usar este color 🖌️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MezcladorLienzo;
