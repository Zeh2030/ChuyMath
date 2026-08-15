// Valida el contenido de _ciencias/ contra lo que los motores esperan.
// Uso: node _ciencias/_valida.js
const fs = require('fs');
const path = require('path');

const DIR = __dirname;

const TIPOS_OK = new Set([
  'experimento-guia', 'mezclador-colores', 'sistema-solar',
  'opcion-multiple', 'true-or-false', 'tap-the-pairs',
  'image-picker', 'fill-the-gap', 'mini-story', 'word-scramble',
]);

// Cuerpos validos del motor sistema-solar (Espacio3D), por escena.
const CUERPOS_POR_ESCENA = {
  planetas: new Set(['sol', 'mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno']),
  'tierra-luna': new Set(['sol', 'tierra', 'luna']),
  estaciones: new Set(['sol', 'tierra']),
  constelaciones: new Set(['tierra', 'osa-mayor', 'orion', 'can-mayor', 'escorpion', 'casiopea']),
  cometa: new Set(['sol', 'tierra', 'cometa']),
  satelite: new Set(['tierra']),
  estrellas: new Set(['tierra', 'sol', 'proxima', 'sirio', 'arcturus', 'aldebaran', 'rigel', 'betelgeuse', 'stephenson']),
  'agujero-negro': new Set(['tierra', 'luna']),
};
const FASES_OK = new Set([
  'nueva', 'creciente', 'cuarto-creciente', 'gibosa-creciente',
  'llena', 'gibosa-menguante', 'cuarto-menguante', 'menguante',
  'eclipse-sol', 'eclipse-luna',
]);
const ESTACIONES_OK = new Set([
  'verano', 'otono', 'invierno', 'primavera',
  'verano-sur', 'otono-sur', 'invierno-sur', 'primavera-sur',
]);
const CONSTELACIONES_OK = new Set(['osa-mayor', 'orion', 'can-mayor', 'escorpion', 'casiopea']);
const ZONAS_COMETA_OK = new Set(['perihelio', 'afelio']);
const LANZAMIENTOS_OK = new Set(['choca', 'orbita', 'escapa']);
const LUZ_OK = new Set(['atrapado', 'escapa']);
const MODOS_OK = new Set(['explorar', 'reto', 'completo']);

const errores = [];
const ids = new Map();
let docs = 0, misiones = 0;

// Recorre tambien las subcarpetas por tipo (sistema-solar/, mini-story/, ...).
const buscarJsons = (dir) => {
  const out = [];
  for (const nombre of fs.readdirSync(dir)) {
    const p = path.join(dir, nombre);
    if (fs.statSync(p).isDirectory()) out.push(...buscarJsons(p));
    else if (/^C\d-\d\d.*\.json$/.test(nombre)) out.push(p);
  }
  return out;
};

for (const ruta of buscarJsons(DIR).sort()) {
  const f = path.relative(DIR, ruta);
  let d;
  try { d = JSON.parse(fs.readFileSync(ruta, 'utf8')); }
  catch (e) { errores.push(`${f}: JSON invalido — ${e.message}`); continue; }
  docs++;

  for (const campo of ['id', 'titulo', 'materia', 'nivel', 'misiones']) {
    if (!d[campo]) errores.push(`${f}: falta "${campo}"`);
  }
  if (d.materia !== 'ciencias') errores.push(`${f}: materia="${d.materia}" (deberia ser "ciencias")`);
  if (d.id !== path.basename(f, '.json')) errores.push(`${f}: el id "${d.id}" no coincide con el nombre del archivo`);
  if (ids.has(d.id)) errores.push(`${f}: id duplicado con ${ids.get(d.id)}`);
  ids.set(d.id, f);

  const idsMision = new Set();
  for (const m of d.misiones || []) {
    misiones++;
    const et = `${f} > ${m.id}`;
    if (!m.id) errores.push(`${f}: mision sin id`);
    else if (idsMision.has(m.id)) errores.push(`${et}: id de mision repetido en el documento`);
    idsMision.add(m.id);

    if (!TIPOS_OK.has(m.tipo)) { errores.push(`${et}: tipo desconocido "${m.tipo}"`); continue; }

    if (m.tipo === 'sistema-solar') validarSistemaSolar(m, et);
    if (m.tipo === 'experimento-guia') validarExperimento(m, et);
    if (m.tipo === 'opcion-multiple') validarOpcionMultiple(m, et);
    if (m.tipo === 'true-or-false') validarTrueOrFalse(m, et);
    if (m.tipo === 'tap-the-pairs') validarTapThePairs(m, et);
    if (m.tipo === 'image-picker') validarImagePicker(m, et);
    if (m.tipo === 'mini-story') validarMiniStory(m, et);
  }
}

function validarSistemaSolar(m, et) {
  const escena = m.escena || 'planetas';
  const cuerpos = CUERPOS_POR_ESCENA[escena];
  if (!cuerpos) {
    errores.push(`${et}: escena desconocida "${m.escena}"`);
    return;
  }
  if (m.modo && !MODOS_OK.has(m.modo)) errores.push(`${et}: modo desconocido "${m.modo}"`);

  for (const id of Object.keys(m.datos || {})) {
    if (!cuerpos.has(id)) errores.push(`${et}: datos["${id}"] no es un cuerpo de la escena ${escena}`);
  }
  for (const [i, r] of (m.retos || []).entries()) {
    if (!r.pregunta || !r.respuesta) { errores.push(`${et} reto ${i}: falta pregunta o respuesta`); continue; }
    if (r.tipo === 'toca') {
      if (!cuerpos.has(r.respuesta)) errores.push(`${et} reto ${i}: "${r.respuesta}" no es un cuerpo de la escena ${escena}`);
    } else if (r.tipo === 'fase') {
      if (escena !== 'tierra-luna') errores.push(`${et} reto ${i}: los retos de fase solo van en la escena tierra-luna`);
      if (!FASES_OK.has(r.respuesta)) errores.push(`${et} reto ${i}: fase desconocida "${r.respuesta}"`);
    } else if (r.tipo === 'estacion') {
      if (escena !== 'estaciones') errores.push(`${et} reto ${i}: los retos de estacion solo van en la escena estaciones`);
      if (!ESTACIONES_OK.has(r.respuesta)) errores.push(`${et} reto ${i}: estacion desconocida "${r.respuesta}"`);
    } else if (r.tipo === 'vista') {
      if (escena !== 'constelaciones') errores.push(`${et} reto ${i}: los retos de vista solo van en la escena constelaciones`);
      if (!CONSTELACIONES_OK.has(r.respuesta)) errores.push(`${et} reto ${i}: constelacion desconocida "${r.respuesta}"`);
    } else if (r.tipo === 'cometa') {
      if (escena !== 'cometa') errores.push(`${et} reto ${i}: los retos de cometa solo van en la escena cometa`);
      if (!ZONAS_COMETA_OK.has(r.respuesta)) errores.push(`${et} reto ${i}: zona desconocida "${r.respuesta}"`);
    } else if (r.tipo === 'lanzamiento') {
      if (escena !== 'satelite') errores.push(`${et} reto ${i}: los retos de lanzamiento solo van en la escena satelite`);
      if (!LANZAMIENTOS_OK.has(r.respuesta)) errores.push(`${et} reto ${i}: desenlace desconocido "${r.respuesta}"`);
    } else if (r.tipo === 'luz') {
      if (escena !== 'agujero-negro') errores.push(`${et} reto ${i}: los retos de luz solo van en la escena agujero-negro`);
      if (!LUZ_OK.has(r.respuesta)) errores.push(`${et} reto ${i}: desenlace desconocido "${r.respuesta}"`);
    } else {
      errores.push(`${et} reto ${i}: tipo de reto desconocido "${r.tipo}"`);
    }
  }
  if (m.modo === 'reto' && !(m.retos || []).length) {
    errores.push(`${et}: modo "reto" sin retos`);
  }
}

function validarExperimento(m, et) {
  if (!(m.pasos || []).length) errores.push(`${et}: experimento sin pasos`);
  if ((m.materiales || []).length !== (m.materiales_emoji || []).length) {
    errores.push(`${et}: materiales (${(m.materiales || []).length}) y materiales_emoji (${(m.materiales_emoji || []).length}) no coinciden`);
  }
  for (const bloque of ['prediccion', 'observacion']) {
    if (m[bloque] && (!m[bloque].pregunta || !(m[bloque].opciones || []).length)) {
      errores.push(`${et}: ${bloque} incompleta`);
    }
  }
  for (const [i, q] of (m.quiz || []).entries()) {
    if (q.tipo === 'true-or-false') {
      if (typeof q.respuesta !== 'boolean') errores.push(`${et} quiz ${i}: respuesta debe ser true/false`);
    } else if (q.tipo === 'opcion-multiple') {
      // ExperimentoGuia compara la respuesta con el TEXTO de la opcion.
      if (!(q.opciones || []).includes(q.respuesta)) {
        errores.push(`${et} quiz ${i}: la respuesta "${q.respuesta}" no esta en las opciones`);
      }
    } else if (q.tipo !== 'fill-the-gap') {
      errores.push(`${et} quiz ${i}: tipo de pregunta desconocido "${q.tipo}"`);
    }
  }
}

function validarOpcionMultiple(m, et) {
  const n = (m.opciones || []).length;
  if (!n) { errores.push(`${et}: sin opciones`); return; }
  // OpcionMultiple acepta dos formatos de respuesta: indice en string ("0", "1", ...)
  // o el texto exacto de la opcion. Validamos el que venga.
  if (typeof m.respuesta === 'string' && /^\d+$/.test(m.respuesta)) {
    const idx = Number(m.respuesta);
    if (idx < 0 || idx >= n) errores.push(`${et}: respuesta "${m.respuesta}" fuera de rango (0..${n - 1})`);
  } else if (!(m.opciones || []).includes(m.respuesta)) {
    errores.push(`${et}: la respuesta "${m.respuesta}" no es indice ni esta en las opciones`);
  }
}

function validarTrueOrFalse(m, et) {
  for (const [i, r] of (m.retos || []).entries()) {
    if (typeof r.correcto !== 'boolean') errores.push(`${et} reto ${i}: "correcto" debe ser true/false`);
    if (r.correcto === false && !r.correccion) errores.push(`${et} reto ${i}: una afirmacion falsa necesita "correccion"`);
  }
}

function validarTapThePairs(m, et) {
  for (const [i, r] of (m.retos || []).entries()) {
    for (const p of r.pares || []) {
      if (!p.es || !p.en) errores.push(`${et} reto ${i}: par incompleto ${JSON.stringify(p)}`);
    }
    if (!(r.pares || []).length) errores.push(`${et} reto ${i}: sin pares`);
  }
}

function validarImagePicker(m, et) {
  for (const [i, r] of (m.retos || []).entries()) {
    const n = (r.opciones || []).length;
    if (!n) { errores.push(`${et} reto ${i}: sin opciones`); continue; }
    if (!Number.isInteger(r.respuesta) || r.respuesta < 0 || r.respuesta >= n) {
      errores.push(`${et} reto ${i}: respuesta ${r.respuesta} fuera de rango (0..${n - 1})`);
    }
    for (const [j, o] of r.opciones.entries()) {
      if (!o.imagen && !o.emoji && !o.label) errores.push(`${et} reto ${i} opcion ${j}: sin imagen, emoji ni label`);
    }
  }
}

function validarMiniStory(m, et) {
  if (!(m.parrafos || []).length) { errores.push(`${et}: mini-story sin parrafos`); return; }
  for (const [i, p] of m.parrafos.entries()) {
    if (!p.texto) errores.push(`${et} parrafo ${i}: sin texto`);
    for (const [j, q] of (p.preguntas || []).entries()) {
      if (q.tipo === 'fill-the-gap') {
        const n = (q.opciones || []).length;
        if (!Number.isInteger(q.respuesta) || q.respuesta < 0 || q.respuesta >= n) {
          errores.push(`${et} parrafo ${i} pregunta ${j}: respuesta ${q.respuesta} fuera de rango (0..${n - 1})`);
        }
        if (q.oracion && !q.oracion.includes('___')) {
          errores.push(`${et} parrafo ${i} pregunta ${j}: la oracion no tiene hueco "___"`);
        }
      } else if (q.tipo === 'true-or-false') {
        if (typeof q.correcto !== 'boolean') errores.push(`${et} parrafo ${i} pregunta ${j}: "correcto" debe ser true/false`);
        if (q.correcto === false && !q.correccion) errores.push(`${et} parrafo ${i} pregunta ${j}: afirmacion falsa sin "correccion"`);
      } else {
        errores.push(`${et} parrafo ${i} pregunta ${j}: tipo desconocido "${q.tipo}"`);
      }
    }
  }
}

console.log(`${docs} documentos, ${misiones} misiones`);
if (errores.length === 0) console.log('OK — sin errores');
else { console.log(`\n${errores.length} ERROR(ES):`); errores.forEach((e) => console.log('  - ' + e)); process.exit(1); }
