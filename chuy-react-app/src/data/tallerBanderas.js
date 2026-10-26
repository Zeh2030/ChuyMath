// "Diseña tu bandera" (Banderas, Fase 3): formas, paleta, símbolos y las 5 reglas
// de NAVA (Good Flag, Bad Flag) para niños. La geometría sale de plantillasBandera.js,
// la misma que usa pinta-bandera.
// Un diseño guardado (profiles/{id}.banderasPropias[]):
//   { id, nombre, forma, colores: [hex por región], simbolo: { tipo, color, lugar } | null,
//     significados: { hex: 'texto' }, fecha }
import { geometriaBandera } from './plantillasBandera';

export const FORMAS = [
  { id: 'h2', nombre: '2 franjas acostadas', reto: { plantilla: 'franjas-h' }, regiones: 2 },
  { id: 'h3', nombre: '3 franjas acostadas', reto: { plantilla: 'franjas-h' }, regiones: 3 },
  { id: 'v2', nombre: '2 franjas paradas', reto: { plantilla: 'franjas-v' }, regiones: 2 },
  { id: 'v3', nombre: '3 franjas paradas', reto: { plantilla: 'franjas-v' }, regiones: 3 },
  { id: 'nordica', nombre: 'Cruz nórdica', reto: { plantilla: 'cruz-nordica' }, regiones: 2 },
  { id: 'nordica-borde', nombre: 'Cruz nórdica con borde', reto: { plantilla: 'cruz-nordica', borde: true }, regiones: 3 },
  { id: 'cruz', nombre: 'Cruz en medio', reto: { plantilla: 'cruz-centrada', completa: true, proporcion: 1.5 }, regiones: 2 },
  { id: 'circulo', nombre: 'Círculo', reto: { plantilla: 'circulo' }, regiones: 2 },
  { id: 'triangulo', nombre: 'Triángulo y franjas', reto: { plantilla: 'triangulo-asta' }, regiones: 3 },
];

export const PALETA = [
  { hex: '#d52b1e', nombre: 'rojo' },
  { hex: '#8d1b3d', nombre: 'vino' },
  { hex: '#ff8200', nombre: 'naranja' },
  { hex: '#fcd116', nombre: 'amarillo' },
  { hex: '#009246', nombre: 'verde' },
  { hex: '#6abf4b', nombre: 'verde claro' },
  { hex: '#75aadb', nombre: 'celeste' },
  { hex: '#0055a4', nombre: 'azul' },
  { hex: '#00205b', nombre: 'azul marino' },
  { hex: '#7b3fa0', nombre: 'morado' },
  { hex: '#ffffff', nombre: 'blanco' },
  { hex: '#000000', nombre: 'negro' },
];
const NOMBRE_COLOR = Object.fromEntries(PALETA.map(c => [c.hex, c.nombre]));
export const nombreColor = (hex) => NOMBRE_COLOR[hex] || hex;

// Símbolos propios (SVG-first), dibujados en una caja de 100×100 centrada en (50,50).
export const SIMBOLOS = [
  { id: 'estrella', nombre: 'Estrella', d: 'M50 4 L61 38 L97 38 L68 59 L79 94 L50 72 L21 94 L32 59 L3 38 L39 38 Z' },
  { id: 'sol', nombre: 'Sol', d: 'M50 28 A22 22 0 1 1 49.99 28 Z M47 2 H53 V20 H47 Z M47 80 H53 V98 H47 Z M2 47 H20 V53 H2 Z M80 47 H98 V53 H80 Z M14 18 L18 14 L31 27 L27 31 Z M69 73 L73 69 L86 82 L82 86 Z M14 82 L27 69 L31 73 L18 86 Z M69 27 L82 14 L86 18 L73 31 Z' },
  { id: 'luna', nombre: 'Luna', d: 'M50 6 A44 44 0 0 0 50 94 A60 60 0 0 1 50 6 Z' },
  { id: 'hoja', nombre: 'Hoja', d: 'M50 4 C78 22 84 58 54 82 L54 97 H46 L46 82 C16 58 22 22 50 4 Z' },
  { id: 'corazon', nombre: 'Corazón', d: 'M50 90 C20 68 4 50 4 32 C4 16 16 6 29 6 C39 6 46 12 50 20 C54 12 61 6 71 6 C84 6 96 16 96 32 C96 50 80 68 50 90 Z' },
];
export const LUGARES = [
  { id: 'centro', nombre: 'En medio' },
  { id: 'esquina', nombre: 'En la esquina' },
];

export const formaDe = (id) => FORMAS.find(f => f.id === id) || FORMAS[0];

// Geometría de un diseño: la de pinta-bandera con tantos colores como regiones.
export const geometriaDiseno = (diseno) => {
  const forma = formaDe(diseno.forma);
  return geometriaBandera({ ...forma.reto, colores: Array(forma.regiones).fill('#ffffff') });
};

// Caja del símbolo dentro de la bandera (en unidades del viewBox).
export const cajaSimbolo = (lugar, W, H) => (lugar === 'esquina'
  ? { x: H * 0.1, y: H * 0.1, lado: H * 0.32 }
  : { x: W / 2 - H * 0.24, y: H / 2 - H * 0.24, lado: H * 0.48 });

// Color de la paleta más parecido (para comparar con banderas reales de otros tonos).
const rgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const masParecido = (hex) => {
  const [r, g, b] = rgb(hex);
  return PALETA.reduce((mejor, c) => {
    const [r2, g2, b2] = rgb(c.hex);
    const dist = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    return dist < mejor.dist ? { hex: c.hex, dist } : mejor;
  }, { hex: null, dist: Infinity }).hex;
};

// ¿Es igual a una bandera real del catálogo? (misma forma y mismos colores, sin símbolo)
export const igualA = (diseno, reales) => {
  if (diseno.simbolo) return null;
  const forma = formaDe(diseno.forma);
  const real = reales.find(r => r.plantilla === forma.reto.plantilla
    && !!r.borde === !!forma.reto.borde
    && r.colores.length === diseno.colores.length
    && r.colores.every((c, i) => masParecido(c) === diseno.colores[i]));
  return real?.nombre ?? null;
};

export const coloresUsados = (diseno) =>
  [...new Set([...diseno.colores, diseno.simbolo?.color].filter(Boolean))];

// Las 5 reglas de NAVA para niños, en vivo: [{ id, ok, texto }]
export const reglasNava = (diseno, reales) => {
  const usados = coloresUsados(diseno);
  const igual = igualA(diseno, reales);
  const sinSignificado = usados.filter(c => !diseno.significados?.[c]?.trim());
  return [
    { id: 'sencilla', ok: true, texto: 'Sencilla: la puedes dibujar de memoria' },
    {
      id: 'colores', ok: usados.length >= 2 && usados.length <= 3,
      texto: usados.length < 2 ? 'Usa al menos 2 colores'
        : usados.length > 3 ? `Usas ${usados.length} colores: con 2 o 3 se recuerda mejor`
          : `${usados.length} colores: ¡perfecto!`,
    },
    { id: 'letras', ok: true, texto: 'Sin letras ni escudos difíciles' },
    {
      id: 'significado', ok: !sinSignificado.length,
      texto: sinSignificado.length ? `¿Qué significa el ${nombreColor(sinSignificado[0])}?` : 'Cada color significa algo',
    },
    {
      id: 'distinta', ok: !igual,
      texto: igual ? `¡Es igual a la de ${igual}! Cambia algo` : 'Distinta a las de verdad',
    },
  ];
};

export const MAX_DISENOS = 12;
