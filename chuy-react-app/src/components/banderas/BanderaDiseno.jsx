import React from 'react';
import { Region } from '../aventura/tipos/PintaBandera';
import { geometriaDiseno, SIMBOLOS, cajaSimbolo } from '../../data/tallerBanderas';

/**
 * Dibuja una bandera del taller "Diseña tu bandera". Con onTocar, cada región se
 * puede pintar (taller); sin él, solo se muestra (álbum).
 */
const BanderaDiseno = ({ diseno, onTocar, className = '' }) => {
  const { W, H, regiones } = geometriaDiseno(diseno);
  const simbolo = diseno.simbolo && SIMBOLOS.find(s => s.id === diseno.simbolo.tipo);
  const caja = simbolo && cajaSimbolo(diseno.simbolo.lugar, W, H);
  return (
    <svg className={`bd-svg ${className}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={diseno.nombre || 'Mi bandera'}>
      {regiones.map((r, i) => (
        <Region key={i} r={r} i={i} fill={diseno.colores[i] || '#f1f2f6'} pintada={!!diseno.colores[i]} onTocar={onTocar || (() => {})} />
      ))}
      {simbolo && (
        <path
          d={simbolo.d}
          fill={diseno.simbolo.color}
          transform={`translate(${caja.x} ${caja.y}) scale(${caja.lado / 100})`}
          pointerEvents="none"
        />
      )}
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke="rgba(0,0,0,0.25)" pointerEvents="none" />
    </svg>
  );
};

export default BanderaDiseno;
