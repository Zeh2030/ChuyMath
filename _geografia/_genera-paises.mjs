// Genera chuy-react-app/src/data/paises.js: la tabla de países que une el mapa
// (world-atlas, ISO numérico), las banderas (flagcdn, alfa-2) y los nombres en español.
// Uso: node _geografia/_genera-paises.mjs
//
// Fuentes (se descargan a memoria; NO se escribe ningún .json aquí, porque
// _valida.mjs lee todos los .json de _geografia/):
//   - CLDR codeMappings.json: ISO numérico ↔ alfa-2 (misma base que Intl.DisplayNames)
//   - flagcdn /es y /en codes.json: qué códigos tienen bandera; los estados de EE.UU.
// Las correcciones de nombres van en MANUAL: si se regenera, no se pierden.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(DIR, '../chuy-react-app');
const require = createRequire(path.join(APP, 'node_modules', 'x.js'));
const topo = require('topojson-client');
const SALIDA = path.join(APP, 'src/data/paises.js');

const bajar = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
};
const cldr = (await bajar('https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-core/supplemental/codeMappings.json')).supplemental.codeMappings;
const flagEs = await bajar('https://flagcdn.com/es/codes.json');
const flagEn = await bajar('https://flagcdn.com/en/codes.json');
const intl = new Intl.DisplayNames(['es-MX'], { type: 'region' });

// Nombres que Intl da raros para un niño en México.
const MANUAL = {
  ci: 'Costa de Marfil',
  ps: 'Palestina',
  mm: 'Birmania (Myanmar)',
  hk: 'Hong Kong',
  mo: 'Macao',
  cz: 'República Checa',
  sz: 'Esuatini',
  va: 'Vaticano',
  us: 'Estados Unidos',
};

// Los 3 países de world-atlas sin código ISO: se usan los de Natural Earth (la
// fuente del propio mapa). 3 caracteres, así que padStart(3) no los altera.
const SIN_ISO = {
  'Kosovo': { id: 'KOS', a2: 'xk', es: 'Kosovo', continente: 'europa' },
  'N. Cyprus': { id: 'CYN', a2: null, es: 'Chipre del Norte', continente: 'asia' },
  'Somaliland': { id: 'SOL', a2: null, es: 'Somalilandia', continente: 'africa' },
};

// Exónimos de estados de EE.UU. que se usan en español en México.
const EXONIMOS_USA = {
  'New York': 'Nueva York', 'New Mexico': 'Nuevo México', 'New Jersey': 'Nueva Jersey',
  'North Carolina': 'Carolina del Norte', 'South Carolina': 'Carolina del Sur',
  'North Dakota': 'Dakota del Norte', 'South Dakota': 'Dakota del Sur',
  'West Virginia': 'Virginia Occidental', 'Pennsylvania': 'Pensilvania',
  'Hawaii': 'Hawái', 'Louisiana': 'Luisiana', 'District of Columbia': 'Distrito de Columbia',
};

// Nombres viejos o largos del GeoJSON de estados de México (state_code → nombre).
const NOMBRES_MX = {
  9: 'Ciudad de México', 15: 'Estado de México', 16: 'Michoacán', 30: 'Veracruz', 5: 'Coahuila',
};

const nombre = (a2) => MANUAL[a2] || intl.of(a2.toUpperCase()) || flagEs[a2];

// Continente (regiones M49 de la ONU, vía CLDR territoryContainment): agrupa el álbum.
const CONTINENTES = { '019': 'america', '150': 'europa', '142': 'asia', '002': 'africa', '009': 'oceania' };
const contiene = (await bajar('https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-core/supplemental/territoryContainment.json'))
  .supplemental.territoryContainment;
const continenteDe = {};
const expandir = (region, cont) => (contiene[region]?._contains || []).forEach(t => {
  if (/^\d{3}$/.test(t)) expandir(t, cont);
  else continenteDe[t.toLowerCase()] ??= cont;
});
Object.entries(CONTINENTES).forEach(([region, cont]) => expandir(region, cont));

// --- Países: numérico → { a2, es, continente } (solo los que tienen bandera en flagcdn) ---
const paises = {};
for (const [A2, m] of Object.entries(cldr)) {
  const a2 = A2.toLowerCase();
  if (!m._numeric || !flagEs[a2]) continue;
  paises[m._numeric] = { a2, es: nombre(a2), continente: continenteDe[a2] ?? null };
}
for (const s of Object.values(SIN_ISO)) paises[s.id] = { a2: s.a2, es: s.es, continente: s.continente };

// Todo país del mapa debe tener entrada.
const world = require('world-atlas/countries-110m.json');
const faltan = topo.feature(world, world.objects.countries).features
  .map(f => f.id !== undefined ? String(f.id).padStart(3, '0') : SIN_ISO[f.properties.name]?.id)
  .filter(id => !id || !paises[id]);
if (faltan.length) throw new Error(`Países del mapa sin entrada: ${faltan.join(', ')}`);

// --- Estados de EE.UU.: FIPS → { a2: 'us-tx', es } ---
const porNombreEn = Object.fromEntries(Object.entries(flagEn).filter(([c]) => c.startsWith('us-')).map(([c, n]) => [n, c]));
const usa = require('us-atlas/states-10m.json');
const estados = {};
for (const f of topo.feature(usa, usa.objects.states).features) {
  const fips = String(f.id).padStart(2, '0');
  if (Number(fips) > 56) continue; // territorios (Puerto Rico, Guam…) no son estados
  const en = f.properties.name;
  estados[fips] = { a2: porNombreEn[en] || null, es: EXONIMOS_USA[en] || en };
}
const sinBandera = Object.values(estados).filter(e => !e.a2).map(e => e.es);
if (sinBandera.some(n => n !== 'Distrito de Columbia')) throw new Error(`Estados sin bandera: ${sinBandera.join(', ')}`);

// --- Otras banderas útiles (Mundial: Inglaterra, Escocia, Gales, Irlanda del Norte) ---
const otras = Object.fromEntries(['gb-eng', 'gb-sct', 'gb-wls', 'gb-nir'].map(c => [c, flagEs[c]]));

const ordenar = (o) => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));
const js = `// GENERADO por _geografia/_genera-paises.mjs — no editar a mano (las correcciones
// van en MANUAL dentro del script). Une el mapa (world-atlas, ISO numérico), las
// banderas (flagcdn, alfa-2) y los nombres en español.
// Se importa solo desde ExploradorMapa (carga lazy) y el validador: no engordar el
// paquete principal; los demás motores leen URLs del JSON.

// ISO 3166-1 numérico (o KOS/CYN/SOL de Natural Earth) → { a2, es, continente }
// (continente: america | europa | asia | africa | oceania | null, p.ej. la Antártida)
export const PAISES = ${JSON.stringify(ordenar(paises), null, 2)};

// FIPS → { a2: 'us-tx', es }
export const ESTADOS_USA = ${JSON.stringify(ordenar(estados), null, 2)};

// state_code del GeoJSON de México → nombre corregido
export const NOMBRES_MX = ${JSON.stringify(NOMBRES_MX, null, 2)};

// Banderas que no son países ISO
export const OTRAS_BANDERAS = ${JSON.stringify(otras, null, 2)};

// Ids de Natural Earth para los países de world-atlas sin código ISO
const SIN_ISO = ${JSON.stringify(Object.fromEntries(Object.entries(SIN_ISO).map(([n, s]) => [n, s.id])))};

// Id de un país de world-atlas: ISO numérico de 3 dígitos, o KOS/CYN/SOL.
// (Antes los 3 sin código compartían la clave 'undefined'.)
export const idPaisMundo = (f) =>
  f.id !== undefined && f.id !== null ? String(f.id).padStart(3, '0') : (SIN_ISO[f.properties?.name] || 'SIN');

// flagcdn solo sirve ciertos anchos (w100 da 404): se redondea al válido más cercano.
const ANCHOS = [20, 40, 80, 160, 320, 640, 1280];
export const banderaUrl = (codigo, ancho = 160) => {
  const w = ANCHOS.reduce((a, b) => (Math.abs(b - ancho) < Math.abs(a - ancho) ? b : a));
  return \`https://flagcdn.com/w\${w}/\${codigo}.png\`;
};
`;
fs.writeFileSync(SALIDA, js);
console.log(`${path.relative(process.cwd(), SALIDA)}: ${Object.keys(paises).length} países, ${Object.keys(estados).length} estados de EE.UU., ${Object.keys(otras).length} otras`);
