// Genera chuy-react-app/src/data/albumBanderas.js: los huecos del álbum de banderas
// (toda bandera que se puede ganar en _geografia/banderas/) y las banderas reales de
// pinta-bandera (el taller avisa si un diseño es igual a una de verdad).
// Uso: node _geografia/_genera-album.mjs   (después de agregar banderas al contenido)
// _valida.mjs llama a construirAlbum() y marca error si el archivo quedó viejo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(DIR, '../chuy-react-app');
export const SALIDA = path.join(APP, 'src/data/albumBanderas.js');
const { PAISES, ESTADOS_USA, OTRAS_BANDERAS } = await import(pathToFileURL(path.join(APP, 'src/data/paises.js')).href);

export const GRUPOS = [
  { id: 'america', nombre: 'América', emoji: '🌎' },
  { id: 'europa', nombre: 'Europa', emoji: '🏰' },
  { id: 'asia', nombre: 'Asia', emoji: '🏯' },
  { id: 'africa', nombre: 'África', emoji: '🦁' },
  { id: 'oceania', nombre: 'Oceanía', emoji: '🏝️' },
  { id: 'usa', nombre: 'Estados de EE. UU.', emoji: '🗽' },
  { id: 'historicas', nombre: 'Históricas', emoji: '📜' },
];

// Banderas históricas: nombre corto para el álbum, en orden de página (América,
// Europa, Asia). Todo bandera_id del contenido debe estar aquí.
export const HISTORICAS = {
  'h-cruz-borgona': 'Cruz de Borgoña (Nueva España)',
  'h-trigarante': 'Ejército Trigarante (1821)',
  'h-mexico-imperio-1': 'Primer Imperio Mexicano',
  'h-mexico-republica-1823': 'República Mexicana (1823)',
  'h-mexico-imperio-2': 'Segundo Imperio Mexicano',
  'h-gran-colombia': 'Gran Colombia',
  'h-centroamerica': 'República Federal de Centro América',
  'h-brasil-imperio': 'Imperio del Brasil',
  'h-confederacion-1861': 'Estados Confederados (1861)',
  'h-prusia': 'Reino de Prusia',
  'h-imperio-aleman': 'Imperio Alemán',
  'h-alemania-1935': 'Alemania (1935-1945)',
  'h-austria-hungria': 'Austria-Hungría',
  'h-imperio-ruso': 'Imperio Ruso',
  'h-urss': 'Unión Soviética',
  'h-otomano': 'Imperio Otomano',
  'h-italia-reino': 'Reino de Italia',
  'h-japon-1870': 'Japón (1870-1999)',
  'h-sol-naciente': 'Bandera del sol naciente',
  'h-qing': 'Dinastía Qing',
  'h-china-1912': 'República de China (1912)',
  'h-corea-1882': 'Corea (1882-1910)',
};

const porA2 = {};
for (const p of Object.values(PAISES)) if (p.a2) porA2[p.a2] = { nombre: p.es, grupo: p.continente };
for (const e of Object.values(ESTADOS_USA)) if (e.a2) porA2[e.a2] = { nombre: e.es, grupo: 'usa' };
for (const [a2, n] of Object.entries(OTRAS_BANDERAS)) porA2[a2] = { nombre: n, grupo: 'europa' };

const URL_DE = ['bandera_url', 'imagen_url', 'es_img', 'en_img', 'url'];

// Recorre el contenido: cada objeto con bandera/bandera_id es una bandera que se gana,
// salvo las opciones de elige-bandera (distractores).
export function construirAlbum() {
  const dirBanderas = path.join(DIR, 'banderas');
  const codigos = new Set();
  const historicas = new Map(); // id → url
  const pinta = [];
  const problemas = [];
  const visitar = (o, enOpciones) => {
    if (Array.isArray(o)) return o.forEach(x => visitar(x, enOpciones));
    if (!o || typeof o !== 'object') return;
    if (!enOpciones) {
      if (typeof o.bandera === 'string') codigos.add(o.bandera);
      if (typeof o.bandera_id === 'string' && !historicas.has(o.bandera_id)) {
        const url = URL_DE.map(k => o[k]).find(u => typeof u === 'string' && u.includes('wikimedia'));
        if (url) historicas.set(o.bandera_id, url);
      }
    }
    for (const [k, v] of Object.entries(o)) visitar(v, enOpciones || k === 'opciones');
  };
  for (const f of fs.readdirSync(dirBanderas).filter(f => f.endsWith('.json')).sort()) {
    const doc = JSON.parse(fs.readFileSync(path.join(dirBanderas, f), 'utf8'));
    visitar(doc, false);
    for (const m of doc.misiones || []) if (m.tipo === 'pinta-bandera')
      for (const r of m.retos || []) pinta.push({ nombre: r.nombre, plantilla: r.plantilla, borde: !!r.borde, colores: r.colores });
  }
  const album = [];
  for (const c of codigos) {
    const info = porA2[c];
    if (!info?.grupo) { problemas.push(`bandera «${c}» sin nombre o sin continente en paises.js`); continue; }
    album.push({ clave: c, nombre: info.nombre, grupo: info.grupo });
  }
  const orden = Object.fromEntries(GRUPOS.map((g, i) => [g.id, i]));
  album.sort((a, b) => orden[a.grupo] - orden[b.grupo] || a.nombre.localeCompare(b.nombre, 'es'));
  for (const [id, nombre] of Object.entries(HISTORICAS))
    if (historicas.has(id)) album.push({ clave: id, nombre, grupo: 'historicas', url: historicas.get(id) });
  for (const id of historicas.keys()) if (!HISTORICAS[id]) problemas.push(`bandera_id «${id}» falta en HISTORICAS (_genera-album.mjs)`);
  // Una misma bandera pintada en dos aventuras cuenta una vez para el taller.
  const vistas = new Set();
  const reales = pinta.filter(p => { const k = JSON.stringify(p); return !vistas.has(k) && vistas.add(k); });
  return { album, reales, problemas };
}

export function textoAlbum({ album, reales }) {
  return `// GENERADO por _geografia/_genera-album.mjs — no editar a mano.
// Huecos del álbum de banderas: toda bandera que se gana en _geografia/banderas/.
// Las actuales usan flagcdn (banderaUrl de la clave); las históricas traen su url.

export const GRUPOS_ALBUM = ${JSON.stringify(GRUPOS, null, 2)};

export const ALBUM = ${JSON.stringify(album, null, 2)};

// Banderas reales de pinta-bandera: el taller avisa si un diseño es igual a una.
export const BANDERAS_PINTA = ${JSON.stringify(reales, null, 2)};
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const datos = construirAlbum();
  if (datos.problemas.length) { console.error(datos.problemas.join('\n')); process.exit(1); }
  fs.writeFileSync(SALIDA, textoAlbum(datos));
  const porGrupo = GRUPOS.map(g => `${g.nombre} ${datos.album.filter(a => a.grupo === g.id).length}`).join(', ');
  console.log(`${path.relative(process.cwd(), SALIDA)}: ${datos.album.length} banderas (${porGrupo}); ${datos.reales.length} reales para el taller`);
}
