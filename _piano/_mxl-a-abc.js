// Convierte un MusicXML (.mxl comprimido o .xml suelto) a un JSON de
// piano-prompter, PRESERVANDO LA DIGITACION (<fingering> -> !N! de ABC).
//
// Nace para la Fase 1 de digitacion (ver PROGRAMA_PIANO.md). El conversor
// anterior vivio en un scratchpad y se perdio; este va en el repo a proposito.
//
// Uso tipico (sin argumentos imprime todas las opciones):
//   node _piano/_mxl-a-abc.js Fur_Elise_fingered.mxl --forma "0-8" --bpm 42 \
//        --titulo "Für Elise · El tema" --nivel PA1-01 \
//        --salida _piano/prompter/PA1-01_fur-elise-tema.json
//
// QUE TRADUCE
// - Repeticiones y casillas (1a/2a): las DESPLIEGA, porque un teleprompter se
//   lee de corrido. Por defecto sigue las marcas de la partitura; con --forma se
//   da el orden de compases a mano (extractos que cierran en la tonica).
//   En cada salto del orden se dibuja doble barra `||` como pista visual.
// - Cambios de clave a media pieza, en su posicion real (`[K:clef=...]`).
// - Digitacion: ARRIBA de las notas en ambas manos (la izquierda queda entre los
//   dos pentagramas; abajo, abcjs la encimaba sobre las plicas). En acordes los
//   numeros se apilan en el orden de las notas.
// - Anacrusa: se reconoce por implicit="yes" (la marca de MusicXML), no se adivina.
// - Alteraciones: se simula la regla de notacion (valen por octava hasta la
//   barra) y se escribe un accidente solo donde hace falta.
//
// FILOSOFIA: falla RUIDOSAMENTE. Un conversor que se traga en silencio un
// tresillo o una nota de adorno produce una partitura que miente, y eso es peor
// que no tener conversor. Lo que no sabe traducir lo aborta con el compas exacto.
//
// VERIFICACION (no escribe el JSON si falla): toca el ABC generado con el mismo
// abcjs de la app y compara nota por nota (altura + instante) contra el MusicXML.
// Si las repeticiones se despliegan automaticamente, ademas genera la version
// ESCRITA con signos de repeticion, deja que abcjs la despliegue por su cuenta y
// exige que ambos despliegues suenen identico.
//
// Sin dependencias propias: el .mxl se descomprime leyendo el ZIP a mano con zlib;
// abcjs se toma de chuy-react-app/node_modules.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ─────────────────────────────────────────────────────────────
// Lectura del .mxl (ZIP) sin dependencias
// ─────────────────────────────────────────────────────────────

/**
 * Extrae los archivos de un ZIP recorriendo el directorio central. Solo soporta
 * los dos metodos que usa un .mxl: 0 (sin comprimir) y 8 (deflate).
 */
function leerZip(buf) {
  // Firma del "end of central directory": PK\x05\x06
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('No parece un ZIP valido (falta el end-of-central-directory)');

  const nEntradas = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const archivos = {};

  for (let i = 0; i < nEntradas; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Entrada de ZIP corrupta');
    const metodo = buf.readUInt16LE(p + 10);
    const tamComp = buf.readUInt32LE(p + 20);
    const lenNombre = buf.readUInt16LE(p + 28);
    const lenExtra = buf.readUInt16LE(p + 30);
    const lenCom = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const nombre = buf.toString('utf8', p + 46, p + 46 + lenNombre);

    // Cabecera local: el tamaño de sus campos variables puede diferir del central.
    const lenNombreL = buf.readUInt16LE(offset + 26);
    const lenExtraL = buf.readUInt16LE(offset + 28);
    const ini = offset + 30 + lenNombreL + lenExtraL;
    const crudo = buf.subarray(ini, ini + tamComp);

    if (!nombre.endsWith('/')) {
      if (metodo !== 0 && metodo !== 8) throw new Error(`ZIP con compresion no soportada (metodo ${metodo})`);
      archivos[nombre] = metodo === 0 ? crudo : zlib.inflateRawSync(crudo);
    }
    p += 46 + lenNombre + lenExtra + lenCom;
  }
  return archivos;
}

/** Devuelve el XML de la partitura, venga de .mxl o de un .xml suelto. */
function cargarXml(archivo) {
  const buf = fs.readFileSync(archivo);
  if (!archivo.toLowerCase().endsWith('.mxl')) return buf.toString('utf8');

  const zip = leerZip(buf);
  // El container.xml dice cual es la partitura principal; si falta, se busca.
  const cont = zip['META-INF/container.xml'];
  if (cont) {
    const m = cont.toString('utf8').match(/full-path="([^"]+)"/);
    if (m && zip[m[1]]) return zip[m[1]].toString('utf8');
  }
  const nombre = Object.keys(zip).find((n) => !n.startsWith('META-INF') && /\.(xml|musicxml)$/i.test(n));
  if (!nombre) throw new Error('El .mxl no contiene ninguna partitura XML');
  return zip[nombre].toString('utf8');
}

// ─────────────────────────────────────────────────────────────
// Utilidades musicales
// ─────────────────────────────────────────────────────────────

const PASO = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const CLAVES = { G: 'treble', F: 'bass', C: 'alto' };
const SIMBOLO = { '-2': '__', '-1': '_', 0: '=', 1: '^', 2: '^^' };
const MAYORES = { '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F', 0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#' };
const MENORES = { '-7': 'Abm', '-6': 'Ebm', '-5': 'Bbm', '-4': 'Fm', '-3': 'Cm', '-2': 'Gm', '-1': 'Dm', 0: 'Am', 1: 'Em', 2: 'Bm', 3: 'F#m', 4: 'C#m', 5: 'G#m', 6: 'D#m', 7: 'A#m' };

// Contenido de la primera <etiqueta>, tenga o no atributos.
const valor = (xml, nombre) => {
  const m = xml.match(new RegExp(`<${nombre}(?:\\s[^>]*)?>([^<]*)</${nombre}>`));
  return m ? m[1].trim() : null;
};
// Atributo de una etiqueta de apertura ya aislada.
const atributo = (etiqueta, nombre) => {
  const m = ` ${etiqueta}`.match(new RegExp(`\\s${nombre}="([^"]*)"`));
  return m ? m[1] : null;
};

/** Alteracion que la armadura da a una nota (1 sostenido, -1 bemol, 0 nada). */
const deArmadura = (step, fifths) => {
  if (fifths > 0) return 'FCGDAEB'.slice(0, fifths).includes(step) ? 1 : 0;
  if (fifths < 0) return 'BEADGCF'.slice(0, -fifths).includes(step) ? -1 : 0;
  return 0;
};

/**
 * Letra + marcas de octava en ABC. Do central (C4) es `C`; la octava de arriba
 * va en minuscula; cada octava mas agrega `'` y cada una menos agrega `,`.
 */
function letraAbc(step, octava) {
  if (octava >= 5) return step.toLowerCase() + "'".repeat(octava - 5);
  return step + ','.repeat(4 - octava);
}

// ─────────────────────────────────────────────────────────────
// MusicXML → modelo (un objeto por compas)
// ─────────────────────────────────────────────────────────────

/**
 * Lee la partitura completa. Cada compas queda como:
 *   { numero, implicito, largo, divisiones, compas, fifths,
 *     clavesAlInicio: {1, 2}, eventos: {1: [...], 2: [...]},
 *     repiteInicio, repiteFin, vecesRepite, casilla: [n...] | null, casillaInicia }
 * Un evento es { tipo: 'clave', clave } o
 *   { tipo: 'nota', dur, esSilencio, notas: [{ abc, midi, dedos, liga, ligaFin }] }.
 */
function leerPartitura(xml) {
  if (/<score-timewise\b/.test(xml)) throw new Error('partitura "timewise": este conversor solo lee "partwise" (lo normal)');
  const partes = [...xml.matchAll(/<part\s[^>]*>([\s\S]*?)<\/part>/g)];
  if (partes.length !== 1) {
    throw new Error(`la partitura tiene ${partes.length} partes (<part>); se espera exactamente una: el piano`);
  }

  const estado = { divisiones: null, compas: null, fifths: 0, modo: null, pentagramas: 1, claves: { 1: 'treble', 2: 'bass' } };
  const compases = [];
  let casilla = null;

  for (const mc of partes[0][1].matchAll(/<measure\s([^>]*)>([\s\S]*?)<\/measure>/g)) {
    const numero = atributo(mc[1], 'number');
    const c = {
      numero,
      xml: mc[2], // crudo: lo relee el verificador independiente
      implicito: atributo(mc[1], 'implicit') === 'yes',
      clavesAlInicio: { ...estado.claves },
      eventos: { 1: [], 2: [] },
      repiteInicio: false,
      repiteFin: false,
      vecesRepite: 2,
      casilla: null,
      casillaInicia: false,
      // Lo que este conversor no sabe traducir NO aborta aqui: se anota y solo
      // truena si el compas entra en lo que se pidio convertir. Asi un adorno en
      // el compas 25 no impide sacar los compases 0-24. Pero la armadura, claves y
      // repeticiones de este compas se siguen leyendo: el resto depende de ellas.
      problema: null,
    };
    const problema = (msg) => { if (!c.problema) c.problema = `compas ${numero}: ${msg}`; };
    const voces = { 1: new Set(), 2: new Set() };
    // Alteraciones vigentes en ESTE compas, por mano y por nota+octava.
    const vigentes = { 1: new Map(), 2: new Map() };
    let terminaCasilla = false;

    const tokens = mc[2].matchAll(
      /<attributes>[\s\S]*?<\/attributes>|<note[\s>][\s\S]*?<\/note>|<backup>[\s\S]*?<\/backup>|<forward>[\s\S]*?<\/forward>|<barline\b[^>]*\/>|<barline\b[^>]*>[\s\S]*?<\/barline>/g,
    );
    for (const t of tokens) {
      const tok = t[0];

      if (tok.startsWith('<attributes')) {
        const div = valor(tok, 'divisions');
        if (div) estado.divisiones = parseInt(div, 10);
        const beats = valor(tok, 'beats');
        const tipo = valor(tok, 'beat-type');
        if (beats && tipo) estado.compas = `${beats}/${tipo}`;
        const fifths = valor(tok, 'fifths');
        if (fifths !== null) estado.fifths = parseInt(fifths, 10);
        const modo = valor(tok, 'mode');
        if (modo) estado.modo = modo;
        const staves = valor(tok, 'staves');
        if (staves) estado.pentagramas = parseInt(staves, 10);
        if (estado.pentagramas > 2) throw new Error(`compas ${numero}: ${estado.pentagramas} pentagramas; se esperan 1 o 2`);

        for (const cl of tok.matchAll(/<clef\b([^>]*)>([\s\S]*?)<\/clef>/g)) {
          const st = atributo(cl[1], 'number') || '1';
          const signo = valor(cl[2], 'sign');
          const clave = CLAVES[signo];
          if (!clave) { problema(`clave "${signo}" no soportada`); continue; }
          if (clave !== estado.claves[st]) {
            estado.claves[st] = clave;
            c.eventos[st].push({ tipo: 'clave', clave });
          }
        }
        continue;
      }

      if (tok.startsWith('<barline')) {
        const rep = tok.match(/<repeat\b[^>]*>/);
        if (rep) {
          const dir = atributo(rep[0], 'direction');
          if (dir === 'forward') c.repiteInicio = true;
          if (dir === 'backward') {
            c.repiteFin = true;
            const veces = atributo(rep[0], 'times');
            if (veces) c.vecesRepite = parseInt(veces, 10);
          }
        }
        const fin = tok.match(/<ending\b[^>]*>/);
        if (fin) {
          if (atributo(fin[0], 'type') === 'start') {
            casilla = (atributo(fin[0], 'number') || '').split(/[,\s]+/).filter(Boolean).map(Number);
            c.casillaInicia = true;
          } else {
            terminaCasilla = true; // stop | discontinue
          }
        }
        continue;
      }

      // Con una voz por mano, la mano la dice <staff>; el cursor de <backup> sobra.
      if (tok.startsWith('<backup')) continue;
      if (tok.startsWith('<forward')) { problema('hay un <forward> (hueco invisible), que este conversor todavia no traduce'); continue; }

      // ── <note> ──
      if (/<grace\b/.test(tok)) { problema('hay NOTAS DE ADORNO (<grace>), que este conversor todavia no traduce'); continue; }
      if (/<time-modification>|<tuplet\b/.test(tok)) { problema('hay TRESILLOS (<tuplet>), que este conversor todavia no traduce'); continue; }
      if (/<cue\s*\/>/.test(tok)) { problema('hay notas guia (<cue>), que no se tocan; este conversor no las traduce'); continue; }

      const st = valor(tok, 'staff') || '1';
      if (st !== '1' && st !== '2') { problema(`pentagrama ${st} inesperado`); continue; }
      voces[st].add(valor(tok, 'voice') || '1');

      const dur = parseInt(valor(tok, 'duration'), 10);
      if (Number.isNaN(dur)) { problema('nota sin <duration>'); continue; }
      const esSilencio = /<rest\b/.test(tok);
      const enAcorde = /<chord\s*\/>/.test(tok);

      // Digitacion. Si hay alguna etiqueta que no es un dedo simple (p. ej. "4-3",
      // cambio de dedo), se marca: perderla en silencio seria mentir.
      const totalDedos = (tok.match(/<fingering\b/g) || []).length;
      const dedos = [...tok.matchAll(/<fingering\b[^>]*>\s*([0-5])\s*<\/fingering>/g)].map((f) => f[1]);
      if (dedos.length !== totalDedos) { problema('digitacion con formato no soportado (solo 0-5)'); continue; }

      let nota = null;
      if (!esSilencio) {
        const step = valor(tok, 'step');
        const octava = parseInt(valor(tok, 'octave'), 10);
        const alter = parseFloat(valor(tok, 'alter') || '0');
        if (!(step in PASO) || Number.isNaN(octava)) { problema('nota sin altura legible (¿percusion?)'); continue; }
        if (!Number.isInteger(alter) || Math.abs(alter) > 2) { problema('alteracion microtonal no soportada'); continue; }

        // Regla de notacion (la misma de abcjs, verificada): una alteracion vale
        // para esa nota EN ESA OCTAVA hasta la barra. Se escribe accidente si la
        // partitura lo muestra o si sin el sonaria otra cosa (p. ej. una ligadura
        // que cruza la barra con un sostenido).
        const clave = step + octava;
        const implicita = vigentes[st].has(clave) ? vigentes[st].get(clave) : deArmadura(step, estado.fifths);
        let signo = '';
        if (/<accidental\b/.test(tok) || alter !== implicita) {
          signo = SIMBOLO[alter];
          vigentes[st].set(clave, alter);
        }
        nota = {
          abc: signo + letraAbc(step, octava),
          midi: PASO[step] + alter + (octava + 1) * 12,
          dedos,
          liga: /<tie\s+type="start"/.test(tok),
          ligaFin: /<tie\s+type="stop"/.test(tok),
        };
      }

      const lista = c.eventos[st];
      if (enAcorde) {
        const prev = lista[lista.length - 1];
        if (!prev || prev.tipo !== 'nota' || prev.esSilencio || esSilencio) { problema('acorde mal formado'); continue; }
        prev.notas.push(nota);
      } else {
        lista.push({ tipo: 'nota', dur, esSilencio, notas: esSilencio ? [] : [nota] });
      }
    }

    for (const st of ['1', '2']) {
      if (voces[st].size > 1) {
        problema(`la mano ${st === '1' ? 'derecha' : 'izquierda'} tiene ${voces[st].size} voces simultaneas; este conversor espera una voz por mano`);
      }
    }

    c.divisiones = estado.divisiones;
    c.compas = estado.compas;
    c.fifths = estado.fifths;

    if (!estado.divisiones || !estado.compas) {
      problema('faltan <divisions> o <time> antes de las notas');
    } else {
      // ── Duracion del compas: tiene que cuadrar, o la partitura no es confiable ──
      const [num, den] = estado.compas.split('/').map(Number);
      const completo = (estado.divisiones * 4 * num) / den;
      const manos = estado.pentagramas > 1 ? ['1', '2'] : ['1'];
      const suma = (st) => c.eventos[st].reduce((a, e) => a + (e.tipo === 'nota' ? e.dur : 0), 0);
      const sumas = manos.map(suma).filter((s) => s > 0);
      c.largo = completo;

      if (!c.problema) { // con notas descartadas la suma ya no significa nada
        if (c.implicito) {
          // Anacrusa (o compas final incompleto): valido, pero ambas manos deben medir igual.
          if (!sumas.length) problema('compas incompleto y vacio');
          else if (sumas.some((s) => s !== sumas[0])) problema(`las dos manos no miden lo mismo (${sumas.join(' vs ')})`);
          else c.largo = sumas[0];
        } else if (sumas.some((s) => s !== completo)) {
          problema(`dura ${sumas.find((s) => s !== completo)} divisiones y el compas ${estado.compas} pide ${completo}`);
        }
      }
      // Mano sin notas en este compas: silencio, o las voces se desalinean.
      for (const st of manos) {
        if (suma(st) === 0) c.eventos[st].push({ tipo: 'nota', dur: c.largo, esSilencio: true, notas: [] });
      }
    }

    c.casilla = casilla;
    if (terminaCasilla) casilla = null;
    compases.push(c);
  }

  if (!compases.length) throw new Error('No se encontro ningun <measure>');
  return { compases, pentagramas: estado.pentagramas, modo: estado.modo };
}

// ─────────────────────────────────────────────────────────────
// Orden de ejecucion: despliegue de repeticiones o forma explicita
// ─────────────────────────────────────────────────────────────

/** "0-8,0-7,9" → indices de compas en ese orden. */
function parsearForma(texto, compases) {
  const indice = new Map(compases.map((c, i) => [c.numero, i]));
  const secuencia = [];
  for (const trozo of texto.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = trozo.match(/^([^-\s]+)(?:-([^-\s]+))?$/);
    if (!m) throw new Error(`--forma: "${trozo}" no es un compas ni un rango (ej. "0-8")`);
    const a = indice.get(m[1]);
    const b = indice.get(m[2] ?? m[1]);
    if (a === undefined) throw new Error(`--forma: el compas "${m[1]}" no existe`);
    if (b === undefined) throw new Error(`--forma: el compas "${m[2]}" no existe`);
    if (b < a) throw new Error(`--forma: el rango "${trozo}" va hacia atras`);
    for (let i = a; i <= b; i++) secuencia.push(i);
  }
  if (!secuencia.length) throw new Error('--forma vacia');
  return secuencia;
}

/**
 * Despliega repeticiones y casillas entre los indices `desde` y `hasta`, con la
 * semantica de MuseScore: un `:|` sin `|:` previo regresa al inicio del tramo; la
 * casilla N se toca en la pasada N; una repeticion ya agotada abre seccion nueva.
 */
function desplegar(compases, desde, hasta) {
  const secuencia = [];
  const saltos = new Map(); // indice del :| → veces que ya se salto
  let inicio = desde;
  let pasada = 1;
  let i = desde;
  let guardia = 0;

  while (i <= hasta) {
    if (++guardia > 100000) throw new Error('las repeticiones no terminan (¿marcas mal formadas?)');
    const c = compases[i];
    if (c.repiteInicio && i !== inicio) { inicio = i; pasada = 1; }
    if (c.casilla && !c.casilla.includes(pasada)) { i++; continue; }

    secuencia.push(i);
    if (c.repiteFin) {
      const hechos = saltos.get(i) || 0;
      if (hechos < c.vecesRepite - 1) {
        saltos.set(i, hechos + 1);
        pasada++;
        i = inicio;
        continue;
      }
      inicio = i + 1;
      pasada = 1;
    }
    i++;
  }
  return secuencia;
}

/** Indices → "0-8,0-7,9-23" (lo que se guarda en el JSON como registro). */
function describirSecuencia(secuencia, compases) {
  const trozos = [];
  let a = secuencia[0];
  for (let j = 1; j <= secuencia.length; j++) {
    if (j < secuencia.length && secuencia[j] === secuencia[j - 1] + 1) continue;
    const b = secuencia[j - 1];
    trozos.push(a === b ? compases[a].numero : `${compases[a].numero}-${compases[b].numero}`);
    a = secuencia[j];
  }
  return trozos.join(',');
}

// ─────────────────────────────────────────────────────────────
// Modelo → ABC
// ─────────────────────────────────────────────────────────────

/**
 * La figura mas grande que divide exactamente todas las duraciones, para que el
 * ABC quede legible (`L:1/16` si hay semicorcheas, `L:1/8` si solo corcheas...).
 */
function elegirUnidad(duraciones, divisiones) {
  for (const l of [4, 8, 16, 32, 64]) {
    const u = (4 * divisiones) / l;
    if (!Number.isInteger(u)) break;
    if (duraciones.every((d) => d % u === 0)) return { l, u };
  }
  throw new Error('hay duraciones que no caben en figuras normales (¿tresillos o puntillos raros?)');
}

/** ABC de un compas para una mano. `clave` es { actual } y se va actualizando. */
function compasAbc(c, st, unidad, clave) {
  const eventos = c.eventos[st];
  const piezas = [];
  const cambiarClave = (nueva) => {
    if (nueva === clave.actual) return;
    piezas.push(`[K:clef=${nueva}]`); // conserva la armadura (verificado en abcjs)
    clave.actual = nueva;
  };

  // Clave efectiva al entrar al compas: la de su inicio, con los cambios que
  // ocurren antes de la primera nota. Tras un salto de repeticion puede diferir
  // de la que traia el compas anterior en el orden desplegado.
  let k = 0;
  let entrada = c.clavesAlInicio[st];
  while (k < eventos.length && eventos[k].tipo === 'clave') entrada = eventos[k++].clave;
  cambiarClave(entrada);

  for (; k < eventos.length; k++) {
    const e = eventos[k];
    if (e.tipo === 'clave') { cambiarClave(e.clave); continue; }

    const n = e.dur / unidad;
    const dur = n === 1 ? '' : String(n);
    if (e.esSilencio) { piezas.push(`z${dur}`); continue; }

    // Los dedos van arriba en ambas manos y abcjs apila el primero junto a la
    // nota: se ordenan de grave a agudo para que el de arriba sea la nota de arriba.
    const dedos = [...e.notas].sort((a, b) => a.midi - b.midi)
      .flatMap((x) => x.dedos).map((d) => `!${d}!`).join('');
    if (e.notas.length === 1) {
      const x = e.notas[0];
      piezas.push(`${dedos}${x.abc}${dur}${x.liga ? '-' : ''}`);
    } else {
      const todas = e.notas.every((x) => x.liga);
      const cuerpo = e.notas.map((x) => x.abc + (x.liga && !todas ? '-' : '')).join('');
      piezas.push(`${dedos}[${cuerpo}]${dur}${todas ? '-' : ''}`);
    }
  }
  return piezas.join(' ');
}

/** Primer compas de la secuencia: con que clave arranca cada mano. */
function claveInicial(c, st) {
  let clave = c.clavesAlInicio[st];
  for (const e of c.eventos[st]) {
    if (e.tipo !== 'clave') break;
    clave = e.clave;
  }
  return clave;
}

/** Linea de una mano siguiendo el orden de ejecucion (desplegado). */
function lineaDesplegada(compases, secuencia, st, unidad) {
  const clave = { actual: claveInicial(compases[secuencia[0]], st) };
  let s = '';
  secuencia.forEach((i, j) => {
    if (j > 0) s += i === secuencia[j - 1] + 1 ? ' | ' : ' || ';
    s += compasAbc(compases[i], st, unidad, clave);
  });
  return s + ' |]';
}

/** Linea de una mano tal como esta ESCRITA, con signos de repeticion y casillas. */
function lineaEscrita(compases, desde, hasta, st, unidad) {
  const clave = { actual: claveInicial(compases[desde], st) };
  let s = '';
  for (let i = desde; i <= hasta; i++) {
    const c = compases[i];
    const prev = i > desde ? compases[i - 1] : null;
    let barra = '';
    if (prev) barra = prev.repiteFin ? (c.repiteInicio ? ':||:' : ':|') : (c.repiteInicio ? '|:' : '|');
    else if (c.repiteInicio) barra = '|:';
    if (c.casillaInicia) barra += `[${c.casilla.join(',')}`;
    s += (barra ? `${barra} ` : '') + compasAbc(c, st, unidad, clave) + ' ';
  }
  return s + (compases[hasta].repiteFin ? ':|' : '|]');
}

/** Arma el campo `notas` en el formato que espera PianoPrompter. */
function armarNotas(lineas, tonalidad, clavesIniciales) {
  if (lineas.length === 1) return lineas[0];
  return [
    '%%staves {1 2}',
    // K: explicito: PianoPrompter no inserta el suyo si las notas ya traen uno,
    // y las claves en linea ([K:clef=...]) contienen "K:".
    `K:${tonalidad}`,
    `V:1 clef=${clavesIniciales[0]}`,
    lineas[0],
    `V:2 clef=${clavesIniciales[1]}`,
    // Digitacion izquierda ARRIBA de sus notas (entre pentagramas), a proposito:
    // con `%%ornament below` abcjs pega los numeros a cabezas y plicas y se
    // vuelven ilegibles (comparado con capturas de Chrome, 2026-09-16).
    lineas[1],
  ].join('\n');
}

/** ABC completo tal como lo armaria PianoPrompter (para verificar). */
function abcCompleto(notas, config) {
  const cab = ['X:1', 'T:verificacion', `M:${config.compas}`, `L:${config.unidad}`];
  if (!notas.includes('%%staves')) cab.push(`K:${config.tonalidad} clef=${config.clave}`);
  return `${cab.join('\n')}\n${notas}`;
}

// ─────────────────────────────────────────────────────────────
// Verificacion con abcjs
// ─────────────────────────────────────────────────────────────

function cargarAbcjs() {
  try {
    return require(path.join(__dirname, '..', 'chuy-react-app', 'node_modules', 'abcjs'));
  } catch {
    return null;
  }
}

/** Lo que abcjs TOCA: por mano, lista ordenada de "instante:altura" en divisiones. */
function pistasAbcjs(abcjs, abc, divisiones) {
  const tune = abcjs.parseOnly(abc)[0];
  if (!tune) throw new Error('abcjs no pudo leer el ABC generado');
  const pistas = tune.setUpAudio({ qpm: 60 }).tracks.map((tr) => tr
    .filter((x) => x.cmd === 'note' && typeof x.pitch === 'number')
    .map((x) => `${Math.round(x.start * 4 * divisiones)}:${x.pitch}`)
    .sort());
  return { pistas, warnings: tune.warnings || [], pulso: tune.getBeatLength() };
}

/**
 * Lo que DEBERIA sonar, releido del MusicXML CRUDO con un lector aparte: a
 * proposito simple y sin compartir nada con leerPartitura. Si el lector principal
 * pierde una nota de un acorde, la cambia de mano o le cambia la duracion, este
 * no se equivoca igual — comparar contra el propio modelo no detectaria nada
 * (lo demostro una prueba de mutacion).
 */
function pistasDesdeXml(compases, secuencia, manos) {
  const pistas = manos.map(() => []);
  let t0 = 0;
  for (const i of secuencia) {
    const cursor = { 1: 0, 2: 0 };
    const inicioPrevio = { 1: 0, 2: 0 };
    for (const [nota] of compases[i].xml.matchAll(/<note[\s>][\s\S]*?<\/note>/g)) {
      const st = (nota.match(/<staff>(\d+)<\/staff>/) || [null, '1'])[1];
      const dur = Number((nota.match(/<duration>(\d+)<\/duration>/) || [null, 0])[1]);
      const enAcorde = /<chord\s*\/>/.test(nota);
      const inicio = enAcorde ? inicioPrevio[st] : cursor[st];
      if (!enAcorde) { inicioPrevio[st] = cursor[st]; cursor[st] += dur; }

      const m = manos.indexOf(st);
      if (m < 0 || /<rest\b/.test(nota) || /<tie\s+type="stop"/.test(nota)) continue;
      const step = nota.match(/<step>([A-G])<\/step>/)[1];
      const alter = Number((nota.match(/<alter>(-?\d+)<\/alter>/) || [null, 0])[1]);
      const octava = Number(nota.match(/<octave>(\d+)<\/octave>/)[1]);
      pistas[m].push(`${t0 + inicio}:${PASO[step] + alter + (octava + 1) * 12}`);
    }
    t0 += Math.max(cursor[1], cursor[2]);
  }
  return pistas.map((p) => p.sort());
}

/** Digitaciones contadas en el XML crudo de los compases que se tocan. */
const dedosEnXml = (compases, secuencia) => secuencia
  .reduce((a, i) => a + (compases[i].xml.match(/<fingering\b/g) || []).length, 0);

/** "instante" → "compas N" en la secuencia, para que el error diga donde mirar. */
function ubicar(instante, compases, secuencia) {
  let t0 = 0;
  for (const [j, i] of secuencia.entries()) {
    if (instante < t0 + compases[i].largo) return `compas ${compases[i].numero} (posicion ${j + 1} del orden)`;
    t0 += compases[i].largo;
  }
  return 'despues del final';
}

function compararPistas(a, b, etiquetaA, etiquetaB, compases, secuencia) {
  if (a.length !== b.length) return `hay ${a.length} voces en ${etiquetaA} y ${b.length} en ${etiquetaB}`;
  for (let m = 0; m < a.length; m++) {
    const mano = m === 0 ? 'derecha' : 'izquierda';
    const n = Math.max(a[m].length, b[m].length);
    for (let k = 0; k < n; k++) {
      if (a[m][k] !== b[m][k]) {
        const t = parseInt((a[m][k] || b[m][k]).split(':')[0], 10);
        return `mano ${mano}, ${ubicar(t, compases, secuencia)}: ${etiquetaA} dice ${a[m][k] || '(nada)'} y ${etiquetaB} dice ${b[m][k] || '(nada)'} [instante:altura MIDI]`;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Conversion completa
// ─────────────────────────────────────────────────────────────

/**
 * opciones: { forma?: "0-8,0-7", desde?: "0", hasta?: "24", tonalidad?, verificar = true }
 * Devuelve { notas, configuracion, secuencia, forma, digitaciones, informe[] }.
 */
function convertir(xml, opciones = {}) {
  const partitura = leerPartitura(xml);
  const { compases } = partitura;
  const indice = new Map(compases.map((c, i) => [c.numero, i]));

  // ── Orden de ejecucion ──
  let secuencia;
  let desde;
  let hasta;
  const automatico = !opciones.forma;
  if (opciones.forma) {
    secuencia = parsearForma(opciones.forma, compases);
  } else {
    desde = opciones.desde != null ? indice.get(String(opciones.desde)) : 0;
    hasta = opciones.hasta != null ? indice.get(String(opciones.hasta)) : compases.length - 1;
    if (desde === undefined || hasta === undefined) throw new Error('--compases: ese compas no existe en la partitura');
    if (hasta < desde) throw new Error('--compases: el rango va hacia atras');
    secuencia = desplegar(compases, desde, hasta);
  }

  const usados = secuencia.map((i) => compases[i]);
  for (const c of usados) if (c.problema) throw new Error(c.problema);
  const base = usados[0];
  for (const c of usados) {
    if (c.divisiones !== base.divisiones) throw new Error(`compas ${c.numero}: cambian las <divisions> a media pieza`);
    if (c.compas !== base.compas) throw new Error(`compas ${c.numero}: cambia el compas a media pieza (${base.compas} → ${c.compas})`);
    if (c.fifths !== base.fifths) throw new Error(`compas ${c.numero}: cambia la armadura a media pieza`);
  }
  // Una anacrusa a media secuencia solo es legitima justo despues de un salto
  // (repeticion que vuelve al inicio); en cualquier otro lado es un error de forma.
  secuencia.forEach((i, j) => {
    const c = compases[i];
    const esBorde = j === 0 || j === secuencia.length - 1 || secuencia[j - 1] + 1 !== i;
    if (c.implicito && !esBorde) throw new Error(`compas ${c.numero}: compas incompleto a media pieza`);
  });

  const manos = partitura.pentagramas > 1 ? ['1', '2'] : ['1'];
  const duraciones = usados.flatMap((c) => [c.largo, ...manos.flatMap((st) => c.eventos[st]
    .filter((e) => e.tipo === 'nota').map((e) => e.dur))]);
  const unidad = elegirUnidad(duraciones, base.divisiones);

  const tonalidad = opciones.tonalidad
    || (partitura.modo === 'minor' ? MENORES : MAYORES)[base.fifths];
  if (!tonalidad) throw new Error(`armadura de ${base.fifths} alteraciones no soportada`);

  const lineas = manos.map((st) => lineaDesplegada(compases, secuencia, st, unidad.u));
  const clavesIniciales = manos.map((st) => claveInicial(base, st));
  const notas = armarNotas(lineas, tonalidad, clavesIniciales);
  const configuracion = {
    compas: base.compas,
    tonalidad,
    clave: clavesIniciales[0],
    unidad: `1/${unidad.l}`,
  };

  const digitaciones = dedosEnXml(compases, secuencia);
  const enAbc = (notas.match(/!\d!/g) || []).length;
  if (enAbc !== digitaciones) throw new Error(`se perdieron digitaciones: la partitura trae ${digitaciones} y el ABC ${enAbc}`);

  const informe = [];
  let pulso = null;

  if (opciones.verificar !== false) {
    const abcjs = cargarAbcjs();
    if (!abcjs) throw new Error('no encontre abcjs en chuy-react-app/node_modules (corre npm install ahi) — o usa --sin-verificar');

    const generado = pistasAbcjs(abcjs, abcCompleto(notas, configuracion), base.divisiones);
    if (generado.warnings.length) throw new Error(`abcjs se queja del ABC generado: ${generado.warnings.join(' / ')}`);
    pulso = generado.pulso;

    const esperado = pistasDesdeXml(compases, secuencia, manos);
    const dif = compararPistas(esperado, generado.pistas, 'el MusicXML', 'el ABC', compases, secuencia);
    if (dif) throw new Error(`la verificacion nota por nota FALLO — ${dif}`);
    const total = esperado.reduce((a, p) => a + p.length, 0);
    informe.push(`✓ nota por nota: las ${total} notas suenan en el instante y la altura del MusicXML`);

    const hayRepeticiones = automatico
      && compases.slice(desde, hasta + 1).some((c) => c.repiteInicio || c.repiteFin || c.casilla);
    if (hayRepeticiones) {
      const escritas = manos.map((st) => lineaEscrita(compases, desde, hasta, st, unidad.u));
      const abcEscrito = abcCompleto(armarNotas(escritas, tonalidad, clavesIniciales), configuracion);
      const escrito = pistasAbcjs(abcjs, abcEscrito, base.divisiones);
      if (escrito.warnings.length) throw new Error(`abcjs se queja de la version con repeticiones: ${escrito.warnings.join(' / ')}`);
      const dif2 = compararPistas(escrito.pistas, generado.pistas, 'abcjs desplegando las repeticiones', 'mi despliegue', compases, secuencia);
      if (dif2) throw new Error(`el despliegue de repeticiones NO coincide con el de abcjs — ${dif2}`);
      informe.push('✓ repeticiones: mi despliegue suena identico a dejar que abcjs despliegue la version escrita');
    }
  }

  return {
    notas,
    configuracion,
    secuencia,
    forma: describirSecuencia(secuencia, compases),
    digitaciones,
    pulso,
    informe,
  };
}

// ─────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────

const AYUDA = `Uso:
  node _piano/_mxl-a-abc.js <archivo.mxl|.xml> [opciones]

Orden de compases (elige uno; por defecto, toda la pieza):
  --compases 0-24        rango; repeticiones y casillas se despliegan solas
  --forma "0-8,0-7,8"    orden explicito (para extractos que cierran en la tonica)

Datos de la pieza:
  --titulo "..."  --autor "..."  --descripcion "..."  --instruccion "..."
  --bpm 42               OJO: abcjs cuenta el pulso del compas (en 3/8, 6/8 y
                         9/8 el pulso es la negra con puntillo)
  --nivel PA1-01         (PA = track adulto)
  --dificultad principiante|intermedio|avanzado
  --tonalidad Am         si el MusicXML no trae el modo (menor) y quieres nombrarlo
  --url https://...      de donde salio el archivo (se guarda en "fuente")
  --id ...               por defecto, el nombre del archivo de salida

Salida:
  --salida ruta.json     escribe el JSON (si se omite, imprime el ABC)
  --sin-verificar        no toca el ABC con abcjs (NO recomendado)`;

function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--ayuda') || args.includes('-h')) {
    console.log(AYUDA);
    process.exit(0);
  }

  const archivo = args[0];
  const op = (nombre, def = null) => {
    const i = args.indexOf(`--${nombre}`);
    return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def;
  };

  const opciones = {
    forma: op('forma'),
    tonalidad: op('tonalidad'),
    verificar: !args.includes('--sin-verificar'),
  };
  const rango = op('compases');
  if (rango) {
    const m = rango.match(/^([^-\s]+)-([^-\s]+)$/);
    if (!m) { console.error('--compases debe ser "N-M", por ejemplo 0-24'); process.exit(1); }
    [, opciones.desde, opciones.hasta] = m;
  }

  let r;
  try {
    r = convertir(cargarXml(archivo), opciones);
  } catch (e) {
    console.error(`\n✗ No se pudo convertir: ${e.message}\n`);
    process.exit(1);
  }

  const PULSOS = { 0.25: 'negras', 0.375: 'negras con puntillo', 0.5: 'blancas', 0.125: 'corcheas', 0.75: 'blancas con puntillo' };
  console.error(`✓ ${r.secuencia.length} compases en orden de ejecucion: ${r.forma}`);
  console.error(`✓ ${r.digitaciones} digitaciones preservadas · L:${r.configuracion.unidad} · K:${r.configuracion.tonalidad}`);
  for (const linea of r.informe) console.error(linea);
  if (r.pulso) console.error(`  el BPM cuenta ${PULSOS[r.pulso] || `pulsos de ${r.pulso} de redonda`} por minuto`);

  const salida = op('salida');
  if (!salida) { console.log(r.notas); return; }

  const doc = armarDocumento(r, {
    id: op('id') || path.basename(salida, '.json'),
    archivo: path.basename(archivo),
    url: op('url'),
    titulo: op('titulo'),
    descripcion: op('descripcion'),
    instruccion: op('instruccion'),
    autor: op('autor'),
    bpm: op('bpm') && parseInt(op('bpm'), 10),
    dificultad: op('dificultad'),
    nivel: op('nivel'),
  });
  fs.writeFileSync(salida, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.error(`✓ escrito: ${salida}`);
}

/**
 * Documento de Firebase (coleccion `piano`) con la misma forma que el resto del
 * contenido de piano: `id` = nombre del archivo y `nivel` a nivel documento, que
 * es lo que agrupa en la Boveda (PA1-01 → grupo PA1, separado de P1).
 */
function armarDocumento(r, datos) {
  const nivel = datos.nivel || 'PA1-01';
  const titulo = datos.titulo || 'Sin titulo';
  return {
    id: datos.id,
    titulo,
    descripcion: datos.descripcion || '',
    tipo: 'piano-prompter',
    materia: 'piano',
    nivel,
    fuente: {
      archivo: datos.archivo,
      ...(datos.url ? { url: datos.url } : {}),
      forma: r.forma,
      convertido: new Date().toISOString().slice(0, 10),
    },
    misiones: [{
      id: `${datos.id}-01`,
      tipo: 'piano-prompter',
      titulo,
      instruccion: datos.instruccion || 'Los números son dedos: 1 pulgar, 2 índice, 3 medio, 4 anular, 5 meñique.',
      autor: datos.autor || '',
      bpm: datos.bpm || 80,
      dificultad: datos.dificultad || 'principiante',
      nivel,
      configuracion: r.configuracion,
      notas: r.notas,
    }],
  };
}

if (require.main === module) main();

module.exports = { convertir, armarDocumento, cargarXml, leerPartitura, desplegar, parsearForma };
