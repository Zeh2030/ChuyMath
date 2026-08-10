// Valida el contenido de _letras/ contra lo que los motores esperan.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const PUBLIC = path.join(__dirname, '..', 'chuy-react-app', 'public');
const TIPOS_OK = new Set(['abecedario', 'letra-quiz', 'silabas', 'colorear']);
const MODOS_OK = new Set(['primera-letra', 'reconoce-letra', 'mayus-minus']);

const errores = [];
const ids = new Map();
let docs = 0, misiones = 0;

const files = fs.readdirSync(DIR).filter((f) => /^L\d-\d\d_.*\.json$/.test(f)).sort();

for (const f of files) {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); }
  catch (e) { errores.push(`${f}: JSON invalido — ${e.message}`); continue; }
  docs++;

  for (const campo of ['id', 'titulo', 'tipo', 'materia', 'nivel', 'misiones']) {
    if (!d[campo]) errores.push(`${f}: falta "${campo}"`);
  }
  if (d.materia !== 'letras') errores.push(`${f}: materia="${d.materia}" (deberia ser "letras")`);
  if (d.id !== path.basename(f, '.json')) errores.push(`${f}: el id "${d.id}" no coincide con el nombre del archivo`);
  if (ids.has(d.id)) errores.push(`${f}: id duplicado con ${ids.get(d.id)}`);
  ids.set(d.id, f);

  for (const m of d.misiones || []) {
    misiones++;
    const et = `${f} > ${m.id}`;
    if (!TIPOS_OK.has(m.tipo)) { errores.push(`${et}: tipo desconocido "${m.tipo}"`); continue; }

    if (m.tipo === 'letra-quiz') {
      if (!MODOS_OK.has(m.modo)) errores.push(`${et}: modo desconocido "${m.modo}"`);
      for (const [i, r] of (m.retos || []).entries()) {
        if (!r.opciones || !r.opciones.includes(r.respuesta)) {
          errores.push(`${et} reto ${i}: la respuesta "${r.respuesta}" no esta en las opciones`);
        }
        if (new Set(r.opciones).size !== r.opciones.length) {
          errores.push(`${et} reto ${i}: opciones repetidas`);
        }
        if (m.modo === 'primera-letra') {
          if (!r.emoji || !r.palabra) errores.push(`${et} reto ${i}: falta emoji o palabra`);
          // La respuesta debe ser de verdad el arranque de la palabra.
          else if (!quitaAcentos(r.palabra).startsWith(quitaAcentos(r.respuesta))) {
            errores.push(`${et} reto ${i}: "${r.palabra}" NO empieza con "${r.respuesta}"`);
          }
        }
        if (m.modo === 'mayus-minus') {
          if (r.letra?.toLowerCase() !== r.respuesta?.toLowerCase()) {
            errores.push(`${et} reto ${i}: "${r.letra}" y "${r.respuesta}" no son la misma letra`);
          }
        }
      }
    }

    if (m.tipo === 'abecedario') {
      for (const l of m.letras || []) {
        if (!l.mayus || !l.minus || !l.palabra || !l.emoji) errores.push(`${et}: letra incompleta ${JSON.stringify(l)}`);
        else if (l.mayus.toLowerCase() !== l.minus.toLowerCase()) errores.push(`${et}: "${l.mayus}"/"${l.minus}" no son la misma letra`);
        // La palabra clave tiene que empezar con esa letra, si no la voz ensena mal.
        else if (!quitaAcentos(l.palabra).startsWith(l.minus)) errores.push(`${et}: "${l.palabra}" no empieza con "${l.minus}"`);
      }
    }

    if (m.tipo === 'silabas') {
      if (!m.consonante) errores.push(`${et}: falta consonante`);
      for (const s of m.silabas || []) {
        if (!s.silaba || !s.vocal || !s.palabra || !s.emoji) { errores.push(`${et}: silaba incompleta ${JSON.stringify(s)}`); continue; }
        const esperada = (m.consonante_minus || m.consonante.toLowerCase()) + s.vocal;
        if (s.silaba !== esperada) errores.push(`${et}: la silaba "${s.silaba}" no es "${esperada}"`);
        if (!quitaAcentos(s.palabra).startsWith(s.silaba)) errores.push(`${et}: "${s.palabra}" no empieza con "${s.silaba}"`);
      }
    }

    if (m.tipo === 'colorear') {
      if (!m.imagen_contorno_url) errores.push(`${et}: falta imagen_contorno_url`);
      else if (!fs.existsSync(path.join(PUBLIC, m.imagen_contorno_url))) {
        errores.push(`${et}: no existe el SVG ${m.imagen_contorno_url}`);
      }
    }
  }
}

function quitaAcentos(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

console.log(`${docs} documentos, ${misiones} misiones`);
if (errores.length === 0) console.log('OK — sin errores');
else { console.log(`\n${errores.length} ERROR(ES):`); errores.forEach((e) => console.log('  - ' + e)); process.exit(1); }
