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
import { PAISES, ESTADOS_USA, OTRAS_BANDERAS, idPaisMundo, banderaUrl } from '../chuy-react-app/src/data/paises.js';

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
// La tabla de países debe cubrir todo el mapa y todas las regiones (detecta errores de dedo).
for (const f of MUNDO) if (!PAISES[idPaisMundo(f)]) errores.push(`data/paises.js · ${f.properties.name} (${idPaisMundo(f)}): sin entrada; regenerar con _genera-paises.mjs`);
for (const [region, lista] of Object.entries(REGIONES))
  for (const id of lista || []) if (!PAISES[id]) errores.push(`ExploradorMapa REGIONES.${region} · «${id}» no existe en data/paises.js`);

const datosMapa = (mapa) => {
  if (mapa === 'mexico-estados') return { feats: mex.features, id: f => String(f.properties.state_code) };
  if (mapa === 'usa-estados') return { feats: USA, id: f => String(f.id).padStart(2, '0') };
  const ids = REGIONES[mapa];
  const id = idPaisMundo; // la misma función que ExploradorMapa (KOS/CYN/SOL para los sin ISO)
  return { feats: ids ? MUNDO.filter(f => ids.includes(id(f))) : MUNDO, id };
};

// --- Banderas: códigos válidos (los de data/paises.js, que existen en flagcdn) ---
const CODIGOS_BANDERA = new Set([
  ...Object.values(PAISES).map(p => p.a2),
  ...Object.values(ESTADOS_USA).map(e => e.a2),
  ...Object.keys(OTRAS_BANDERAS),
].filter(Boolean));
const codigoDeUrlFlagcdn = (u) => String(u ?? '').match(/^https:\/\/flagcdn\.com\/w\d+\/([a-z]{2}(?:-[a-z]{2,3})?)\.png$/)?.[1];
const revisarCodigo = (f, d, c) => {
  if (!/^[a-z]{2}(-[a-z]{2,3})?$/.test(c)) return err(f, d, `bandera «${c}»: debe ser alfa-2 en minúsculas (o subdivisión, p.ej. us-tx)`), false;
  if (!CODIGOS_BANDERA.has(c)) return err(f, d, `bandera «${c}» no existe en flagcdn (data/paises.js)`), false;
  return true;
};
// Banderas históricas: URL original de Wikimedia Commons; el mismo id siempre con la misma URL.
const RE_WIKIMEDIA = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+$/;
const historicas = new Map(); // bandera_id → { url, donde }
const revisarHistorica = (f, d, idH, url) => {
  if (url && !RE_WIKIMEDIA.test(url)) err(f, d, `bandera_url debe ser un original de upload.wikimedia.org (sin /thumb/): ${url}`);
  if (url) addUrl(url, `${f} · ${d}`);
  if (idH === undefined) return;
  if (!/^h-[a-z0-9-]+$/.test(idH)) return err(f, d, `bandera_id «${idH}» debe ser h-minusculas-con-guiones`);
  if (!url) return err(f, d, `bandera_id «${idH}» sin bandera_url`);
  const previa = historicas.get(idH);
  if (previa && previa.url !== url) err(f, d, `bandera_id «${idH}» apunta a otra URL que en ${previa.donde}`);
  else historicas.set(idH, { url, donde: `${f} · ${d}` });
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
  'opcion-multiple', 'word-scramble', 'mini-story', 'explorador-mapa', 'colorear']);

// colorear (motor de Dibujo): contorno SVG propio en chuy-react-app/public/.
function colorear(f, mid, m) {
  const u = m.imagen_contorno_url;
  if (!u || !u.startsWith('/')) return err(f, mid, 'colorear sin "imagen_contorno_url" local (p.ej. /geografia/banderas/mexico-contorno.svg)');
  if (!fs.existsSync(path.join(APP, 'public', u))) err(f, mid, `no existe chuy-react-app/public${u}`);
  const cs = m.colores_sugeridos;
  if (cs !== undefined && (!Array.isArray(cs) || cs.some(c => !/^#[0-9a-f]{6}$/i.test(c)))) err(f, mid, 'colores_sugeridos debe ser una lista de colores #rrggbb');
}

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

    // Banderas: opciones de flagcdn sin opciones_bandera se ven recortadas (cover).
    if (ops.some(o => codigoDeUrlFlagcdn(o.imagen)) && !m.opciones_bandera)
      err(f, mid, `reto ${k + 1}: opciones con bandera de flagcdn requieren "opciones_bandera": true en la misión`);
    const imgs = ops.map(o => o.imagen).filter(Boolean);
    if (new Set(imgs).size !== imgs.length) err(f, mid, `reto ${k + 1}: imágenes repetidas en las opciones`);
    // Código de la bandera del reto (para el álbum): debe ser la de la respuesta.
    const imgRespuesta = r.imagen_url ?? ops[r.respuesta]?.imagen;
    if (r.bandera !== undefined && revisarCodigo(f, `${mid} reto ${k + 1}`, r.bandera)) {
      const enUrl = codigoDeUrlFlagcdn(imgRespuesta);
      if (enUrl && enUrl !== r.bandera) err(f, mid, `reto ${k + 1}: bandera «${r.bandera}» pero la imagen de la respuesta es «${enUrl}»`);
    }
    if (r.bandera_id !== undefined || (imgRespuesta && /wikimedia/.test(imgRespuesta) && /flag/i.test(imgRespuesta)))
      revisarHistorica(f, `${mid} reto ${k + 1}`, r.bandera_id, r.bandera_url ?? imgRespuesta);
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
      const imgs = pares.map(p => p[`${lado}_img`]).filter(Boolean);
      if (new Set(imgs).size !== imgs.length) err(f, mid, `ronda ${k + 1}: imagen repetida en la columna "${lado}"`);
      imgs.forEach(u => addUrl(u, `${f} · ${mid} ronda ${k + 1}`));
    }
    pares.forEach((p, j) => {
      const d = `${mid} ronda ${k + 1} par ${j + 1}`;
      const img = p.es_img || p.en_img;
      if (p.bandera !== undefined && revisarCodigo(f, d, p.bandera)) {
        const enUrl = codigoDeUrlFlagcdn(img);
        if (enUrl && enUrl !== p.bandera) err(f, d, `bandera «${p.bandera}» pero la imagen es «${enUrl}»`);
      }
      if (p.bandera_id !== undefined) revisarHistorica(f, d, p.bandera_id, img);
      else if (img && /wikimedia/.test(img)) revisarHistorica(f, d, undefined, img);
    });
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
    if (r.bandera && revisarCodigo(f, d, r.bandera)) {
      // La bandera tiene que ser la del país/estado del reto.
      const esperado = mapa === 'usa-estados' ? ESTADOS_USA[nid]?.a2 : mapa === 'mexico-estados' ? undefined : PAISES[nid]?.a2;
      if (esperado !== undefined && esperado !== r.bandera) err(f, d, `bandera «${r.bandera}» pero el lugar del reto es «${esperado}»`);
      addUrl(banderaUrl(r.bandera, 80), `${f} · ${d}`);
    }
    const preguntaBandera = r.pregunta_bandera ?? m.pregunta_bandera;
    if (preguntaBandera) {
      if (modo !== 'quiz') err(f, d, 'pregunta_bandera solo funciona en modo quiz');
      if (!r.bandera && !r.bandera_url) err(f, d, 'pregunta_bandera sin "bandera" ni "bandera_url": no hay qué mostrar');
      if (r.nombre && r.pregunta && llano(r.pregunta).includes(llano(r.nombre)))
        err(f, d, `la pregunta dice «${r.nombre}»: con pregunta_bandera la bandera es la pregunta, no se nombra el lugar`);
    }
    if (r.bandera_url || r.bandera_id) revisarHistorica(f, d, r.bandera_id, r.bandera_url);
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
    case 'colorear': return colorear(f, mid, m);
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
  // Sub-sección Banderas: carpeta banderas/ ⇔ tipo "banderas", nivel GB0-3 o GBH.
  const enBanderas = f.startsWith('banderas/');
  if (enBanderas !== (doc.tipo === 'banderas'))
    err(f, '-', enBanderas ? 'en banderas/ el tipo raíz debe ser "banderas"' : 'tipo "banderas" solo en la carpeta banderas/');
  if (enBanderas) {
    if (!/^GB([0-3]|H)-\d{2}$/.test(doc.nivel || '')) err(f, '-', `nivel «${doc.nivel}» debe ser GB0..GB3 o GBH + "-NN" (p.ej. GB1-02, GBH-01)`);
    else if (!doc.id.startsWith(doc.nivel + '_')) err(f, '-', `el id debe empezar con el nivel «${doc.nivel}_»`);
  }
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
  // Wikimedia limita las peticiones (429): sus URLs van una por una, con pausa y
  // reintentos; el User-Agent con contacto es lo que pide su política.
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const probar = async (u) => {
    const wiki = u.includes('wikimedia.org');
    for (let intento = 0; intento < (wiki ? 4 : 1); intento++) {
      try {
        const r = await fetch(u, { headers: { 'User-Agent': 'ChuyMathValida/1.0 (contacto@carrillocm.mx)', Range: 'bytes=0-0' } });
        if (r.status === 429) { await espera(3000 * (intento + 1)); continue; }
        return (r.status === 200 || r.status === 206) && /image/.test(r.headers.get('content-type') || '') ? null : r.status;
      } catch (e) { return e.message; }
    }
    return '429 (límite de Wikimedia; reintentar más tarde)';
  };
  const reportar = (u, st) => { if (st !== null) urls.get(u).forEach(d => err(d.split(' · ')[0], d.split(' · ').slice(1).join(' · '), `imagen no carga (${st}): ${u}`)); };
  const lista = [...urls.keys()];
  const otras = lista.filter(u => !u.includes('wikimedia.org'));
  for (let i = 0; i < otras.length; i += 6) await Promise.all(otras.slice(i, i + 6).map(async u => reportar(u, await probar(u))));
  for (const u of lista.filter(u => u.includes('wikimedia.org'))) { reportar(u, await probar(u)); await espera(400); }
}

console.log(`Geografía: ${archivos.length} archivos${RED ? `, ${urls.size} imágenes probadas` : ''}`);
if (avisos.length) console.log(`\nAvisos (${avisos.length}):\n  ` + avisos.join('\n  '));
if (errores.length) {
  console.log(`\nErrores (${errores.length}):\n  ` + errores.join('\n  '));
  process.exit(1);
}
console.log('\n✓ Sin errores');
