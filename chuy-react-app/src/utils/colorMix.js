/**
 * colorMix.js — Lógica compartida de mezcla de colores en modelo RYB (pintura).
 *
 * Pensado para niños: usa el modelo Rojo-Amarillo-Azul (como témperas y crayones),
 * NO el RGB de pantalla. Los resultados de cada mezcla son colores curados a mano
 * (no el promedio matemático de RGB, que daría tonos sucios para amarillo+azul).
 *
 * Lo usan:
 *  - MezcladorColores.jsx (el juego "Laboratorio de Colores")
 *  - Colorear.jsx / DibujoLibre.jsx (mezclar tu propio color para pintar)
 */

// Catálogo de colores. Cada uno: id, nombre, hex, emoji, tipo y temperatura.
export const COLORES = {
  rojo:     { id: 'rojo',     nombre: 'Rojo',     hex: '#e74c3c', emoji: '🔴', tipo: 'primario',  temp: 'calido' },
  amarillo: { id: 'amarillo', nombre: 'Amarillo', hex: '#f1c40f', emoji: '🟡', tipo: 'primario',  temp: 'calido' },
  azul:     { id: 'azul',     nombre: 'Azul',     hex: '#3498db', emoji: '🔵', tipo: 'primario',  temp: 'frio'   },

  naranja:  { id: 'naranja',  nombre: 'Naranja',  hex: '#e67e22', emoji: '🟠', tipo: 'secundario', temp: 'calido' },
  verde:    { id: 'verde',    nombre: 'Verde',    hex: '#2ecc71', emoji: '🟢', tipo: 'secundario', temp: 'frio'   },
  morado:   { id: 'morado',   nombre: 'Morado',   hex: '#9b59b6', emoji: '🟣', tipo: 'secundario', temp: 'frio'   },

  'rojo-naranja':     { id: 'rojo-naranja',     nombre: 'Rojo anaranjado',    hex: '#e8551f', emoji: '🟧', tipo: 'terciario', temp: 'calido' },
  'amarillo-naranja': { id: 'amarillo-naranja', nombre: 'Amarillo anaranjado', hex: '#f39c12', emoji: '🟧', tipo: 'terciario', temp: 'calido' },
  'amarillo-verde':   { id: 'amarillo-verde',   nombre: 'Amarillo verdoso',   hex: '#a3cb38', emoji: '🟢', tipo: 'terciario', temp: 'frio'   },
  'azul-verde':       { id: 'azul-verde',       nombre: 'Azul verdoso',       hex: '#1abc9c', emoji: '🟦', tipo: 'terciario', temp: 'frio'   },
  'azul-morado':      { id: 'azul-morado',      nombre: 'Azul violáceo',      hex: '#6c5ce7', emoji: '🟣', tipo: 'terciario', temp: 'frio'   },
  'rojo-morado':      { id: 'rojo-morado',      nombre: 'Rojo violáceo',      hex: '#e84393', emoji: '🟪', tipo: 'terciario', temp: 'calido' },

  cafe: { id: 'cafe', nombre: 'Café', hex: '#8d6e63', emoji: '🟤', tipo: 'neutro', temp: 'neutro' },
};

export const PRIMARIOS = ['rojo', 'amarillo', 'azul'];
export const SECUNDARIOS = ['naranja', 'verde', 'morado'];
export const TERCIARIOS = [
  'rojo-naranja', 'amarillo-naranja', 'amarillo-verde',
  'azul-verde', 'azul-morado', 'rojo-morado',
];

// Rueda de color de 12 posiciones (sentido horario empezando arriba).
export const RUEDA = [
  'rojo', 'rojo-naranja', 'naranja', 'amarillo-naranja',
  'amarillo', 'amarillo-verde', 'verde', 'azul-verde',
  'azul', 'azul-morado', 'morado', 'rojo-morado',
];

// Pares complementarios (opuestos en la rueda). Al mezclarlos sale café/neutro.
export const COMPLEMENTARIOS = {
  rojo: 'verde', verde: 'rojo',
  azul: 'naranja', naranja: 'azul',
  amarillo: 'morado', morado: 'amarillo',
};

// Tabla de mezclas. Clave = par de ids ordenado alfabéticamente y unido con "+".
const MEZCLAS = {
  // primario + primario → secundario
  'amarillo+rojo':  'naranja',
  'amarillo+azul':  'verde',
  'azul+rojo':      'morado',

  // primario + secundario adyacente → terciario
  'naranja+rojo':       'rojo-naranja',
  'amarillo+naranja':   'amarillo-naranja',
  'amarillo+verde':     'amarillo-verde',
  'azul+verde':         'azul-verde',
  'azul+morado':        'azul-morado',
  'morado+rojo':        'rojo-morado',

  // complementarios → café (momento de enseñanza: opuestos = neutro)
  'rojo+verde':      'cafe',
  'azul+naranja':    'cafe',
  'amarillo+morado': 'cafe',
};

function clave(a, b) {
  return [a, b].sort().join('+');
}

/**
 * Mezcla dos colores por id y devuelve el objeto color resultante (o null).
 * - Mismo color consigo mismo → el mismo color.
 * - Combinación definida → su resultado curado.
 * - Cualquier otra combinación de colores reales → café (las pinturas mezcladas
 *   sin orden tienden al café/gris; es el resultado real y enseña a no "ensuciar").
 */
export function mezclar(idA, idB) {
  if (!idA || !idB) return null;
  if (idA === idB) return COLORES[idA] || null;
  const definida = MEZCLAS[clave(idA, idB)];
  if (definida) return COLORES[definida];
  // Ambos son colores conocidos pero la combinación no es "limpia" → café.
  if (COLORES[idA] && COLORES[idB]) return COLORES.cafe;
  return null;
}

/** Devuelve el objeto color por id (o null). */
export function getColor(id) {
  return COLORES[id] || null;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * Aclara u oscurece un color (tinte/sombra).
 * factor > 0 mezcla hacia blanco (aclara); factor < 0 hacia negro (oscurece).
 * factor en [-1, 1]. Usa interpolación RGB, que SÍ es correcta para luminosidad.
 */
export function ajustarLuz(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const t = Math.max(-1, Math.min(1, factor));
  if (t >= 0) {
    return rgbToHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
  }
  const k = 1 + t; // t negativo → k en [0,1)
  return rgbToHex(r * k, g * k, b * k);
}

/**
 * Dado un conjunto de colores base (ids), calcula los colores "secretos" que se
 * pueden descubrir mezclándolos por pares. Excluye los base, el café y duplicados.
 * Sirve para fijar la meta de descubrimiento en el modo Explorar.
 */
export function descubriblesDesde(base) {
  const meta = new Set();
  for (let i = 0; i < base.length; i++) {
    for (let j = i + 1; j < base.length; j++) {
      const r = mezclar(base[i], base[j]);
      if (r && r.id !== 'cafe' && !base.includes(r.id)) meta.add(r.id);
    }
  }
  return [...meta];
}
