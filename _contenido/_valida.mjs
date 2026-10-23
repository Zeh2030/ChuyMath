// Valida el contenido de matemáticas (_contenido/) contra la calificación REAL de la app.
// Uso: node _contenido/_valida.mjs
//
// Importa chuy-react-app/src/utils/calificar.js, la misma función que usa Simulacro.jsx,
// y prueba cada opción de cada pregunta: exactamente una debe contar como acierto.
// Ojo: la app lee los simulacros de Firestore; esto valida el disco. Tras corregir
// aquí, hay que volver a subir el JSON desde /admin/migracion.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TIPOS_CALIFICABLES, esRespuestaCorrecta, respuestaCorrectaOM, respuestaEsIndice,
  seleccionOM, valorDeOpcion,
} from '../chuy-react-app/src/utils/calificar.js';
import { TIPOS_IMPRIMIBLES } from '../chuy-react-app/src/utils/imprimir.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const errores = [];
const avisos = [];
let docs = 0, preguntas = 0;

const err = (f, id, msg) => errores.push(`${f} · ${id}: ${msg}`);
const aviso = (f, id, msg) => avisos.push(`${f} · ${id}: ${msg}`);

const buscarJsons = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? (e.name === 'docs' ? [] : buscarJsons(path.join(dir, e.name)))
    : e.name.endsWith('.json') && e.name !== 'manifest.json' ? [path.join(dir, e.name)] : []);

// --- Opción múltiple: vale tanto en simulacros como dentro de aventuras ---
function validarOpcionMultiple(f, p) {
  const opciones = p.opciones || p.opciones_finales;
  if (!Array.isArray(opciones) || opciones.length < 2) return err(f, p.id, 'menos de 2 opciones');
  const resp = respuestaCorrectaOM(p);
  if (resp === '') return err(f, p.id, 'sin respuesta');
  const valores = opciones.map(o => String(valorDeOpcion(o)));
  if (new Set(valores).size !== valores.length) err(f, p.id, 'opciones repetidas');
  if (respuestaEsIndice(p)) {
    if (Number(resp) >= opciones.length) err(f, p.id, `respuesta ${resp} fuera de rango (${opciones.length} opciones)`);
  } else if (!valores.includes(String(resp))) {
    err(f, p.id, `respuesta «${resp}» no está entre las opciones`);
  }
  // Toca cada opción como lo haría el niño y califica con la lógica de la app.
  const misionOM = { ...p, tipo: 'opcion-multiple' };
  const aciertos = opciones
    .map((o, i) => esRespuestaCorrecta(misionOM, seleccionOM(misionOM, o, i)) ? i : -1)
    .filter(i => i >= 0);
  if (aciertos.length !== 1) {
    err(f, p.id, `${aciertos.length} opciones cuentan como acierto (índices ${aciertos.join(',') || 'ninguno'})`);
  }
}

// --- Mapa: la ruta escrita debe terminar justo en el lugar de la respuesta ---
const PASO = { norte: [-1, 0], sur: [1, 0], este: [0, 1], oeste: [0, -1] };
function validarMapa(f, p) {
  const c = p.configuracion_mapa;
  if (!c) return err(f, p.id, 'sin configuracion_mapa');
  let { fila, columna } = c.punto_inicio;
  for (const m of c.movimientos || []) {
    const d = PASO[m];
    if (!d) return err(f, p.id, `movimiento desconocido «${m}»`);
    fila += d[0]; columna += d[1];
    if (fila < 0 || columna < 0 || fila >= c.filas || columna >= c.columnas) {
      return err(f, p.id, `la ruta se sale del mapa en (${fila},${columna})`);
    }
  }
  const nombres = c.puntos_interes.map(x => x.nombre);
  if (!nombres.includes(c.respuesta_correcta)) err(f, p.id, `respuesta «${c.respuesta_correcta}» no es un lugar del mapa`);
  const llega = c.puntos_interes.find(x => x.fila === fila && x.columna === columna);
  if (!llega) err(f, p.id, `la ruta termina en (${fila},${columna}), donde no hay ningún lugar`);
  else if (llega.nombre !== c.respuesta_correcta) err(f, p.id, `la ruta llega a «${llega.nombre}», no a «${c.respuesta_correcta}»`);
  for (const x of [c.punto_inicio, ...c.puntos_interes]) {
    if (/[a-z]{3,}/i.test(x.icono || '')) err(f, p.id, `ícono «${x.icono}» es texto, no emoji`);
  }
}

// --- Criptoaritmética: formato del componente y la solución debe cumplir la suma/resta ---
// El componente Criptoaritmetica solo entiende operacion { linea1, linea2, resultado }
// y solucion [{ figura, valor }]; con otro formato truena («Algo se rompió aquí»).
function validarCripto(f, p) {
  const op = p.operacion;
  if (!op || typeof op !== 'object' || !op.linea1 || !op.linea2 || !op.resultado) {
    return err(f, p.id, 'operacion debe ser { linea1, linea2, resultado } (el componente no entiende otro formato)');
  }
  if (!Array.isArray(p.solucion)) return err(f, p.id, 'solucion debe ser una lista [{ figura, valor }]');
  const sol = Object.fromEntries(p.solucion.map(({ figura, valor }) => [figura, String(valor)]));
  const digitos = Object.values(sol);
  if (new Set(digitos).size !== digitos.length) err(f, p.id, 'dos figuras distintas valen lo mismo');

  // Igual que el componente: toda figura que no sea espacio, +, - o dígito es una incógnita.
  const figuras = new Set([op.linea1, op.linea2, op.resultado].flatMap(l => Array.from(l)).filter(c => !/[\s+\-0-9]/.test(c)));
  for (const c of figuras) if (sol[c] === undefined) err(f, p.id, `la figura ${c} no tiene valor en la solución`);
  if ([...figuras].some(c => sol[c] === undefined)) return;

  const num = l => Number(Array.from(l.replace(/^\s*[+\-]/, '')).filter(c => !/\s/.test(c)).map(c => sol[c] ?? c).join(''));
  const resta = op.linea2.trim().startsWith('-');
  const calc = resta ? num(op.linea1) - num(op.linea2) : num(op.linea1) + num(op.linea2);
  const total = num(op.resultado);
  if (Number.isNaN(calc) || Number.isNaN(total)) aviso(f, p.id, 'operación no verificable');
  else if (calc !== total) err(f, p.id, `con la solución, ${num(op.linea1)} ${resta ? '−' : '+'} ${num(op.linea2)} = ${calc}, no ${total}`);
}

function validarProblema(f, p, esSimulacro) {
  preguntas++;
  if (esSimulacro && !TIPOS_CALIFICABLES.includes(p.tipo)) err(f, p.id, `tipo «${p.tipo}» no se califica (siempre cuenta 0)`);
  if (esSimulacro && !TIPOS_IMPRIMIBLES.includes(p.tipo)) err(f, p.id, `tipo «${p.tipo}» no tiene versión impresa (utils/imprimir.js)`);
  // Los mapas arman su propio texto («La respuesta correcta era…»); no usan explicacion_correcta.
  if (esSimulacro && p.tipo !== 'navegacion-mapa' && !p.explicacion_correcta) {
    err(f, p.id, 'sin explicacion_correcta (el niño no ve por qué)');
  }
  switch (p.tipo) {
    case 'opcion-multiple': return validarOpcionMultiple(f, p);
    case 'navegacion-mapa': return validarMapa(f, p);
    case 'criptoaritmetica': return validarCripto(f, p);
    case 'palabra-del-dia':
      // El impreso revuelve las letras: con menos de 2 distintas no hay cómo esconderla
      if (new Set(String(p.palabra || p.respuesta || '')).size < 2) err(f, p.id, 'palabra vacía o de una sola letra');
      return;
    case 'desarrollo-cubos': {
      if (!esSimulacro) return;
      // En papel cada cara lleva una letra y la clave es la cara cuyo id es la respuesta
      const caras = p.datos_cubo?.caras;
      if (!Array.isArray(caras) || caras.length < 2 || caras.length > 6) return err(f, p.id, 'datos_cubo.caras debe tener de 2 a 6 caras');
      if (!caras.some(c => c.id === p.respuesta)) err(f, p.id, `respuesta «${p.respuesta}» no es el id de ninguna cara`);
      const posiciones = new Set(caras.map(c => `${c.fila},${c.columna}`));
      if (posiciones.size !== caras.length) err(f, p.id, 'dos caras en la misma fila/columna');
      return;
    }
    case 'tabla-doble-entrada':
      if (esSimulacro && p.respuesta_final === undefined) err(f, p.id, 'sin respuesta_final');
      return;
    default:
      if (esSimulacro && (p.respuesta === undefined || p.respuesta === '')) err(f, p.id, 'sin respuesta');
  }
}

// --- Simulacros ---
const dirSim = path.join(DIR, 'simulacros');
const idsDoc = new Map();
for (const ruta of buscarJsons(dirSim)) {
  const f = path.relative(DIR, ruta);
  let d;
  try { d = JSON.parse(fs.readFileSync(ruta, 'utf8')); } catch (e) { err(f, '-', `JSON inválido: ${e.message}`); continue; }
  docs++;
  if (d.id !== path.basename(ruta, '.json')) err(f, '-', `id «${d.id}» distinto al nombre del archivo (en Firestore el id es el del documento)`);
  if (idsDoc.has(d.id)) err(f, '-', `id repetido con ${idsDoc.get(d.id)}`);
  idsDoc.set(d.id, f);
  if (!d.titulo) err(f, '-', 'sin título');
  const items = d.problemas || d.misiones || [];
  if (items.length === 0) err(f, '-', 'sin problemas');
  const ids = new Set();
  for (const p of items) {
    if (!p.id) err(f, '?', 'problema sin id');
    else if (ids.has(p.id)) err(f, p.id, 'id de problema repetido (las respuestas se pisan)');
    ids.add(p.id);
    validarProblema(f, p, true);
  }
}

// --- Resto del contenido (aventuras, expediciones...): opción múltiple y mapas anidados ---
function recorrer(f, o) {
  if (Array.isArray(o)) return o.forEach(x => recorrer(f, x));
  if (!o || typeof o !== 'object') return;
  if (o.tipo === 'opcion-multiple' && (o.opciones || o.opciones_finales)) { preguntas++; validarOpcionMultiple(f, o); }
  else if (o.tipo === 'navegacion-mapa' && o.configuracion_mapa) { preguntas++; validarMapa(f, o); }
  for (const v of Object.values(o)) recorrer(f, v);
}
for (const ruta of buscarJsons(DIR).filter(r => !r.startsWith(dirSim))) {
  const f = path.relative(DIR, ruta);
  try { docs++; recorrer(f, JSON.parse(fs.readFileSync(ruta, 'utf8'))); } catch (e) { err(f, '-', `JSON inválido: ${e.message}`); }
}

console.log(`${docs} archivos, ${preguntas} preguntas revisadas`);
if (avisos.length) console.log(`\n⚠ ${avisos.length} avisos:\n  ` + avisos.join('\n  '));
if (errores.length) {
  console.log(`\n✗ ${errores.length} errores:\n  ` + errores.join('\n  '));
  process.exit(1);
}
console.log('✓ sin errores');
