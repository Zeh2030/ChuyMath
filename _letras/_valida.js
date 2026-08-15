// Valida el contenido de _letras/ contra lo que los motores esperan.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const PUBLIC = path.join(__dirname, '..', 'chuy-react-app', 'public');
const TIPOS_OK = new Set(['abecedario', 'letra-quiz', 'silabas', 'colorear', 'rimas', 'arma-la-palabra']);
const MODOS_OK = new Set(['primera-letra', 'reconoce-letra', 'mayus-minus', 'cuenta-silabas', 'lee-palabra']);

const errores = [];
const ids = new Map();
let docs = 0, misiones = 0;

// L0/L1/L2… y LF (conciencia fonologica, que va fuera de la progresion numerada).
const files = fs.readdirSync(DIR).filter((f) => /^L[\dF]-\d\d_.*\.json$/.test(f)).sort();

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
        if (m.modo === 'cuenta-silabas') {
          // La respuesta tiene que ser el numero de golpes que marca el silabeo.
          const golpes = String((r.silabeo || r.palabra || '').split('-').length);
          if (golpes !== String(r.respuesta)) {
            errores.push(`${et} reto ${i}: "${r.silabeo}" son ${golpes} pedacitos, no ${r.respuesta}`);
          }
          if (quitaAcentos(r.silabeo || '').replace(/-/g, '') !== quitaAcentos(r.palabra || '')) {
            errores.push(`${et} reto ${i}: el silabeo "${r.silabeo}" no forma "${r.palabra}"`);
          }
        }
        if (m.modo === 'lee-palabra') {
          if (!r.palabra) errores.push(`${et} reto ${i}: falta la palabra a leer`);
          // Aqui las opciones son dibujos; la respuesta debe ser uno de ellos (ya validado
          // arriba) y NO debe haber emojis repetidos, o habria dos respuestas validas.
          if (r.silabeo && quitaAcentos(r.silabeo).replace(/-/g, '') !== quitaAcentos(r.palabra)) {
            errores.push(`${et} reto ${i}: el silabeo "${r.silabeo}" no forma "${r.palabra}"`);
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

    if (m.tipo === 'rimas') {
      for (const [i, r] of (m.retos || []).entries()) {
        const palabras = (r.opciones || []).map((o) => o.palabra);
        if (!palabras.includes(r.respuesta)) {
          errores.push(`${et} reto ${i}: la respuesta "${r.respuesta}" no esta entre las opciones`);
        }
        if (new Set(palabras).size !== palabras.length) errores.push(`${et} reto ${i}: opciones repetidas`);
        if ((r.opciones || []).some((o) => !o.palabra || !o.emoji)) {
          errores.push(`${et} reto ${i}: alguna opcion no tiene palabra o emoji`);
        }
        if (r.respuesta === r.palabra) errores.push(`${et} reto ${i}: la respuesta es la misma palabra`);
        // Rimar de verdad = terminar igual. Se exigen 2 letras finales iguales, que es
        // lo minimo que un oido de 4 anos distingue (gato/pato, sol/caracol).
        const fin = (s) => quitaAcentos(s).slice(-2);
        if (fin(r.respuesta) !== fin(r.palabra)) {
          errores.push(`${et} reto ${i}: "${r.respuesta}" no rima con "${r.palabra}"`);
        }
        // Y los distractores NO deben rimar, o habria dos respuestas correctas.
        for (const o of r.opciones || []) {
          if (o.palabra !== r.respuesta && fin(o.palabra) === fin(r.palabra)) {
            errores.push(`${et} reto ${i}: el distractor "${o.palabra}" tambien rima con "${r.palabra}"`);
          }
        }
      }
    }

    if (m.tipo === 'arma-la-palabra') {
      if (m.usar_nombre_perfil) continue; // el reto se genera del perfil, no hay que validarlo
      for (const [i, r] of (m.retos || []).entries()) {
        if (!r.palabra || !r.piezas?.length) { errores.push(`${et} reto ${i}: falta palabra o piezas`); continue; }
        if (quitaAcentos(r.piezas.join('')) !== quitaAcentos(r.palabra)) {
          errores.push(`${et} reto ${i}: las piezas ${JSON.stringify(r.piezas)} no forman "${r.palabra}"`);
        }
        // Un distractor que coincida con una pieza haria imposible saber cual tocar.
        for (const d of r.distractores || []) {
          if (r.piezas.includes(d)) errores.push(`${et} reto ${i}: el distractor "${d}" tambien es una pieza`);
        }
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
