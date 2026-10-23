// Valida el contenido de _geografia/ contra lo que leen los componentes de la app.
// Uso: node _geografia/_valida.mjs            (errores + avisos)
//      node _geografia/_valida.mjs --red      (además prueba que carguen las imágenes)
//
// Opción múltiple se califica con chuy-react-app/src/utils/calificar.js, la misma
// función que usa la app. Los mapas se revisan contra los mismos datos (world-atlas,
// us-atlas, mexico-estados) y las mismas proyecciones de ExploradorMapa.jsx.
// Ojo: la app lee Firestore; esto valida el disco. Tras corregir, hay que subir el
// JSON desde /admin/migracion (colección Geografía).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { esRespuestaCorrecta, respuestaCorrectaOM, seleccionOM, valorDeOpcion } from '../chuy-react-app/src/utils/calificar.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(DIR, '../chuy-react-app');
const NM = path.join(APP, 'node_modules');
const topo = createRequire(path.join(NM, 'x.js'))('topojson-client');
const d3 = await import(pathToFileURL(path.join(NM, 'd3-geo/src/index.js')).href);
const RED = process.argv.includes('--red');

const errores = [];
const avisos = [];
const err = (f, id, msg) => errores.push(`${f} · ${id}: ${msg}`);
const aviso = (f, id, msg) => avisos.push(`${f} · ${id}: ${msg}`);

// --- Mapas: mismos datos y proyecciones que ExploradorMapa.jsx ---
const src = fs.readFileSync(path.join(APP, 'src/components/aventura/tipos/ExploradorMapa.jsx'), 'utf8');
const bloque = (nombre) => eval('(' + src.match(new RegExp(`const ${nombre} = (\\{[\\s\\S]*?\\n\\});`))[1] + ')');
const REGIONES = bloque('REGIONES');
const PROJECTIONS = bloque('PROJECTIONS');
const leer = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const world = leer(path.join(NM, 'world-atlas/countries-110m.json'));
const usa = leer(path.join(NM, 'us-atlas/states-10m.json'));
const mex = leer(path.join(APP, 'src/components/aventura/tipos/maps/mexico-estados.json'));
const MUNDO = topo.feature(world, world.objects.countries).features;
const USA = topo.feature(usa, usa.objects.states).features;

const datosMapa = (mapa) => {
  if (mapa === 'mexico-estados') return { feats: mex.features, id: f => String(f.properties.state_code) };
  if (mapa === 'usa-estados') return { feats: USA, id: f => String(f.id).padStart(2, '0') };
  const ids = REGIONES[mapa];
  const id = f => String(f.id).padStart(3, '0');
  return { feats: ids ? MUNDO.filter(f => ids.includes(id(f))) : MUNDO, id };
};
const norm = (mapa, v) => {
  const s = String(v ?? '');
  if (mapa === 'mexico-estados') return s.replace(/^0+/, '') || '0';
  if (mapa === 'usa-estados') return s.padStart(2, '0');
  return s.padStart(3, '0');
};
// Encuadre del mapa plano (para avisar de países cortados o diminutos).
const VIEW = [800, 500];
const proyeccion = (mapa, mision) => {
  const c = PROJECTIONS[mapa] || PROJECTIONS.world;
  if (c.proj === 'orthographic') return null;
  const t = [VIEW[0] / 2, VIEW[1] / 2];
  const p = c.proj === 'albersUsa' ? d3.geoAlbersUsa() : c.proj === 'mercator' ? d3.geoMercator() : d3.geoNaturalEarth1();
  const encuadre = mision.encuadre || c.encuadre;
  if (encuadre) {
    const [lon0, lat0, lon1, lat1] = encuadre;
    return p.fitExtent([[8, 8], [VIEW[0] - 8, VIEW[1] - 8]], {
      type: 'Polygon', coordinates: [[[lon0, lat0], [lon0, lat1], [lon1, lat1], [lon1, lat0], [lon0, lat0]]],
    });
  }
  if (c.center) p.center(c.center);
  return p.scale(c.scale).translate(t);
};

// --- Utilidades de texto ---
const llano = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const urls = new Map();
const addUrl = (u, donde) => { if (!urls.has(u)) urls.set(u, []); urls.get(u).push(donde); };
const recorrerTextos = (o, fn) => {
  if (typeof o === 'string') fn(o);
  else if (Array.isArray(o)) o.forEach(x => recorrerTextos(x, fn));
  else if (o && typeof o === 'object') Object.values(o).forEach(x => recorrerTextos(x, fn));
};

const TIPOS_OK = new Set(['image-picker', 'tap-the-pairs', 'fill-the-gap', 'true-or-false',
  'opcion-multiple', 'word-scramble', 'mini-story', 'explorador-mapa']);

// --- Validación por tipo ---
function imagePicker(f, mid, m) {
  const retos = m.retos || [];
  if (!retos.length) err(f, mid, 'sin retos');
  retos.forEach((r, k) => {
    const ops = r.opciones || [];
    if (ops.length < 2) return err(f, mid, `reto ${k + 1}: menos de 2 opciones`);
    if (typeof r.respuesta !== 'number' || r.respuesta < 0 || r.respuesta >= ops.length)
      err(f, mid, `reto ${k + 1}: respuesta ${JSON.stringify(r.respuesta)} debe ser un índice numérico válido`);
    const soloTexto = ops.every(o => !o.imagen && !o.emoji);
    // palabra_es se pinta en grande encima de las opciones
    if (r.palabra_es && soloTexto && ops.some(o => llano(o.label) === llano(r.palabra_es)))
      err(f, mid, `reto ${k + 1}: palabra_es «${r.palabra_es}» es una de las opciones → regala la respuesta`);
    if (!r.imagen_url && soloTexto && !r.palabra_es) err(f, mid, `reto ${k + 1}: sin imagen_url ni palabra_es: no hay pregunta`);
    // Con emoji, la opción muestra SOLO el emoji; el nombre aparece hasta acertar.
    // Emojis repetidos = tarjetas idénticas (Océanos con 4 🌊).
    const emojis = ops.filter(o => o.emoji && !o.imagen).map(o => o.emoji);
    if (new Set(emojis).size !== emojis.length)
      err(f, mid, `reto ${k + 1}: emojis repetidos (${emojis.join(' ')}): el nombre no se ve hasta acertar, las opciones son idénticas`);
    const labels = ops.map(o => llano(o.label));
    if (new Set(labels).size !== labels.length) err(f, mid, `reto ${k + 1}: opciones repetidas`);
    if (r.imagen_url) addUrl(r.imagen_url, `${f} · ${mid} #${k + 1}`);
    ops.forEach(o => o.imagen && addUrl(o.imagen, `${f} · ${mid} #${k + 1}`));
  });
}

function opcionMultiple(f, mid, m) {
  const ops = m.opciones || m.opciones_finales || [];
  if (ops.length < 2) return err(f, mid, 'menos de 2 opciones');
  if (!m.pregunta) aviso(f, mid, 'sin pregunta (sale "Selecciona la respuesta correcta:")');
  const resp = respuestaCorrectaOM(m);
  if (resp === '') return err(f, mid, 'sin respuesta');
  if (ops.some(o => typeof o === 'object' && o !== null && (o.valor === undefined || !o.texto)))
    err(f, mid, 'opción objeto sin "texto" o sin "valor"');
  // Toca cada opción como el niño y califica con la lógica de la app.
  const mm = { ...m, tipo: 'opcion-multiple' };
  const aciertos = ops.map((o, i) => esRespuestaCorrecta(mm, seleccionOM(mm, o, i)) ? i : -1).filter(i => i >= 0);
  if (aciertos.length !== 1)
    return err(f, mid, `${aciertos.length} opciones cuentan como acierto (${aciertos.join(',') || 'ninguna'}) → misión imposible o regalada`);
  // Si la respuesta coincide con el valor de una opción, ESA debe ser la aceptada.
  const porValor = ops.findIndex(o => typeof o === 'object' && o !== null && String(valorDeOpcion(o)) === String(resp));
  if (porValor !== -1 && aciertos[0] !== porValor)
    err(f, mid, `la respuesta «${resp}» es el valor de la opción ${porValor + 1}, pero la app acepta la ${aciertos[0] + 1}`);
  if (m.imagen) [...String(m.imagen).matchAll(/src=["']([^"']+)/g)].forEach(x => addUrl(x[1], `${f} · ${mid}`));
}

function trueOrFalse(f, mid, retos) {
  if (!retos.length) err(f, mid, 'sin retos');
  retos.forEach((r, k) => {
    if (!r.oracion) err(f, mid, `reto ${k + 1}: sin oracion`);
    if (typeof r.correcto !== 'boolean') err(f, mid, `reto ${k + 1}: "correcto" debe ser true/false`);
  });
  const v = retos.filter(r => r.correcto === true).length;
  if (retos.length >= 3 && (v === 0 || v === retos.length)) aviso(f, mid, `las ${retos.length} afirmaciones son ${v ? 'verdaderas' : 'falsas'}`);
}

function hueco(f, d, q) {
  const n = (String(q.oracion ?? '').match(/___/g) || []).length;
  if (n !== 1) err(f, d, `la oración debe tener exactamente un "___" (tiene ${n})`);
  const ops = q.opciones || [];
  if (typeof q.respuesta !== 'number' || q.respuesta < 0 || q.respuesta >= ops.length)
    err(f, d, `respuesta ${JSON.stringify(q.respuesta)} debe ser un índice numérico válido`);
  if (new Set(ops.map(llano)).size !== ops.length) err(f, d, 'opciones repetidas');
}

function tapThePairs(f, mid, m) {
  const retos = m.retos || [];
  if (!retos.length) err(f, mid, 'sin retos');
  retos.forEach((r, k) => {
    const pares = r.pares || [];
    if (pares.length < 2) err(f, mid, `ronda ${k + 1}: menos de 2 pares`);
    if (pares.some(p => !p.es || !p.en)) err(f, mid, `ronda ${k + 1}: par sin "es" o "en"`);
    for (const lado of ['es', 'en']) {
      const v = pares.map(p => llano(p[lado]));
      const dup = [...new Set(v.filter((x, i) => v.indexOf(x) !== i))];
      // El juego empareja por posición: con dos tarjetas iguales, tocar "la otra" es error.
      if (dup.length) err(f, mid, `ronda ${k + 1}: texto repetido en la columna "${lado}" (${dup.join(', ')})`);
    }
  });
}

function wordScramble(f, mid, m) {
  const retos = m.retos || [];
  if (!retos.length) err(f, mid, 'sin retos');
  retos.forEach((r, k) => {
    if (!r.respuesta) err(f, mid, `reto ${k + 1}: sin "respuesta" (el componente no lee "palabra")`);
    else if (/\s/.test(r.respuesta)) aviso(f, mid, `reto ${k + 1}: «${r.respuesta}» tiene espacios (ficha en blanco)`);
    if (!r.pista_es && !r.pista_emoji) err(f, mid, `reto ${k + 1}: sin pista visible (el componente lee "pista_es", no "pista")`);
  });
}

function miniStory(f, mid, m) {
  const ps = m.parrafos || [];
  if (!ps.length) err(f, mid, 'sin parrafos');
  ps.forEach((p, k) => {
    if (!p.texto) err(f, mid, `párrafo ${k + 1}: sin texto`);
    (p.preguntas || []).forEach((q, j) => {
      const d = `${mid} párrafo ${k + 1} pregunta ${j + 1}`;
      if (q.tipo === 'fill-the-gap') hueco(f, d, q);
      else if (q.tipo === 'true-or-false') { if (typeof q.correcto !== 'boolean') err(f, d, '"correcto" debe ser true/false'); }
      else err(f, d, `tipo «${q.tipo}» no lo dibuja MiniStory → la historia se atora`);
    });
  });
}

function exploradorMapa(f, mid, m) {
  const mapa = m.mapa || 'world';
  const modo = m.modo || 'quiz';
  if (!PROJECTIONS[mapa]) err(f, mid, `mapa «${mapa}» no existe`);
  const retos = m.retos || [];
  if (modo === 'quiz' && !retos.length) err(f, mid, 'quiz sin retos');
  if (m.encuadre !== undefined) {
    const e = m.encuadre;
    if (!Array.isArray(e) || e.length !== 4 || e.some(v => typeof v !== 'number') || e[0] >= e[2] || e[1] >= e[3])
      err(f, mid, `encuadre debe ser [oeste, sur, este, norte] (números, oeste<este, sur<norte): ${JSON.stringify(e)}`);
  }
  const { feats, id } = datosMapa(mapa);
  const proj = proyeccion(mapa, m);
  const geo = proj && d3.geoPath(proj);
  const vistos = new Set();
  retos.forEach((r, k) => {
    const d = `${mid} reto ${k + 1} (${r.nombre ?? r.id})`;
    if (r.pais && !r.id) return err(f, d, 'usa "pais"; el componente lee "id"');
    const nid = norm(mapa, r.id);
    if (vistos.has(nid)) aviso(f, d, 'reto repetido');
    vistos.add(nid);
    const ft = feats.find(x => norm(mapa, id(x)) === nid);
    if (!ft) return err(f, d, `id «${r.id}» no está en el mapa «${mapa}» (imposible de tocar)`);
    if (modo === 'quiz' && !r.nombre) err(f, d, 'sin "nombre" (el feedback diría "Es undefined")');
    if (modo === 'quiz' && !r.pregunta) err(f, d, 'sin pregunta');
    if (geo) {
      const [[x0, y0], [x1, y1]] = geo.bounds(ft);
      if (x1 < 0 || x0 > VIEW[0] || y1 < 0 || y0 > VIEW[1]) err(f, d, 'queda fuera del mapa');
      const area = geo.area(ft);
      if (area < 60) aviso(f, d, `objetivo diminuto (${area.toFixed(0)} u² de 800×500; se apoya en el zoom/halo)`);
    }
    if (r.bandera) {
      if (!/^[a-z]{2}$/.test(r.bandera)) err(f, d, `bandera «${r.bandera}» debe ser ISO alfa-2 en minúsculas`);
      else addUrl(`https://flagcdn.com/w80/${r.bandera}.png`, `${f} · ${d}`);
    }
    if ((r.ruta || r.marcar) && mapa !== 'globo') err(f, d, 'ruta/marcar solo se dibujan en el globo');
    for (const p of [...(r.marcar || []).map(x => [x.lon, x.lat]), ...(r.ruta ? [r.ruta.desde, r.ruta.hasta] : [])])
      if (!Array.isArray(p) || typeof p[0] !== 'number' || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90)
        err(f, d, `coordenada inválida ${JSON.stringify(p)}`);
  });
}

function validarMision(f, m, i) {
  const mid = m.id || `#${i + 1}`;
  if (!m.id) err(f, mid, 'misión sin id');
  if (!TIPOS_OK.has(m.tipo)) return err(f, mid, `tipo «${m.tipo}» no soportado en geografía`);
  recorrerTextos(m, s => { if (/upload\.wikimedia\.org\/[^"' ]*\/thumb\//.test(s)) err(f, mid, 'URL de Wikimedia con /thumb/ (da 400)'); });
  switch (m.tipo) {
    case 'image-picker': return imagePicker(f, mid, m);
    case 'opcion-multiple': return opcionMultiple(f, mid, m);
    case 'true-or-false': return trueOrFalse(f, mid, m.retos || []);
    case 'fill-the-gap': {
      const retos = m.retos || [];
      if (!retos.length) err(f, mid, 'sin retos');
      retos.forEach((r, k) => {
        hueco(f, `${mid} reto ${k + 1}`, r);
        if (r.traduccion) err(f, mid, `reto ${k + 1}: "traduccion" muestra el rótulo inglés "Meaning:"`);
      });
      return;
    }
    case 'tap-the-pairs': return tapThePairs(f, mid, m);
    case 'word-scramble': return wordScramble(f, mid, m);
    case 'mini-story': return miniStory(f, mid, m);
    case 'explorador-mapa': return exploradorMapa(f, mid, m);
  }
}

// --- Recorrido ---
const buscar = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? buscar(path.join(d, e.name)) : e.name.endsWith('.json') ? [path.join(d, e.name)] : []);
const archivos = buscar(DIR);
const ids = new Map();
for (const ruta of archivos) {
  const f = path.relative(DIR, ruta).replace(/\\/g, '/');
  let doc;
  try { doc = leer(ruta); } catch (e) { err(f, '-', `JSON inválido: ${e.message}`); continue; }
  if (doc.id !== path.basename(ruta, '.json')) err(f, '-', `id «${doc.id}» ≠ nombre del archivo`);
  if (ids.has(doc.id)) err(f, '-', `id repetido con ${ids.get(doc.id)}`);
  ids.set(doc.id, f);
  if (doc.materia !== 'geografia') err(f, '-', 'materia debe ser "geografia"');
  // Firestore rechaza arreglos directamente dentro de arreglos ([[1,2],[3,4]]).
  const anidado = (o, ruta) => {
    if (Array.isArray(o)) {
      if (o.some(Array.isArray)) return ruta;
      for (const [i, x] of o.entries()) { const r = anidado(x, `${ruta}[${i}]`); if (r) return r; }
    } else if (o && typeof o === 'object') {
      for (const [k, x] of Object.entries(o)) { const r = anidado(x, `${ruta}.${k}`); if (r) return r; }
    }
    return null;
  };
  const rutaAnidada = anidado(doc, '$');
  if (rutaAnidada) err(f, '-', `arreglo dentro de arreglo en ${rutaAnidada}: Firestore no lo acepta y la migración falla`);
  if (!doc.titulo) err(f, '-', 'sin título');
  if (!Array.isArray(doc.misiones) || !doc.misiones.length) { err(f, '-', 'sin misiones'); continue; }
  const mids = doc.misiones.map(m => m.id);
  if (new Set(mids).size !== mids.length) err(f, '-', 'ids de misión repetidos');
  doc.misiones.forEach((m, i) => validarMision(f, m, i));
}

if (RED) {
  const lista = [...urls.keys()];
  for (let i = 0; i < lista.length; i += 6) {
    await Promise.all(lista.slice(i, i + 6).map(async u => {
      let st;
      try {
        const r = await fetch(u, { headers: { 'User-Agent': 'ChuyMathValida/1.0', Range: 'bytes=0-0' } });
        st = (r.status === 200 || r.status === 206) && /image/.test(r.headers.get('content-type') || '') ? null : r.status;
      } catch (e) { st = e.message; }
      if (st !== null) urls.get(u).forEach(d => err(d.split(' · ')[0], d.split(' · ').slice(1).join(' · '), `imagen no carga (${st}): ${u}`));
    }));
  }
}

console.log(`Geografía: ${archivos.length} archivos${RED ? `, ${urls.size} imágenes probadas` : ''}`);
if (avisos.length) console.log(`\nAvisos (${avisos.length}):\n  ` + avisos.join('\n  '));
if (errores.length) {
  console.log(`\nErrores (${errores.length}):\n  ` + errores.join('\n  '));
  process.exit(1);
}
console.log('\n✓ Sin errores');
