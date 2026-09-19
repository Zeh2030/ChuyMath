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
// - Hasta DOS VOCES por mano (bajo sostenido bajo un arpegio, melodia sobre
//   acompañamiento): cada una en su linea ABC, agrupadas por pentagrama con
//   `%%staves {(1 2) (3 4)}` y plicas arriba/abajo. Donde una voz calla o entra
//   tarde se rellena con silencio invisible `x`.
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

const MANO = { 1: 'derecha', 2: 'izquierda' };
/** Voces de MusicXML de una mano (claves de un Map), de numero menor a mayor. */
const ordenVoces = (mapa) => [...mapa.keys()].sort((a, b) => a - b);

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
 *     clavesAlInicio: {1, 2}, claves: {1: [{ pos, clave }], 2: [...]},
 *     voces: {1: Map(voz MusicXML → eventos), 2: Map(...)},
 *     repiteInicio, repiteFin, vecesRepite, casilla: [n...] | null, casillaInicia }
 * Un evento es { inicio, dur, esSilencio, invisible, notas: [{ abc, midi, dedos, liga, ligaFin }] },
 * con `inicio` en divisiones desde el principio del compas.
 *
 * VOCES: una mano puede tener dos voces con ritmos distintos (un bajo largo bajo
 * un arpegio). MusicXML las escribe una tras otra y regresa el reloj con
 * <backup>; aqui se sigue ese reloj para saber cuando empieza cada nota.
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
      claves: { 1: [], 2: [] },
      voces: { 1: new Map(), 2: new Map() },
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
    // Alteraciones vigentes en ESTE compas, por VOZ y por nota+octava. Por voz y
    // no por pentagrama porque asi las aplica abcjs (verificado): un ^F de la voz
    // de arriba no altera el F de la de abajo.
    const vigentes = new Map();
    // Reloj canonico de MusicXML: cada nota lo avanza, <backup> lo regresa y
    // <forward> lo adelanta; las notas de acorde no lo mueven.
    let pos = 0;
    let ultima = null; // ultima nota que no es de acorde: ahi se pegan las <chord/>
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
            c.claves[st].push({ pos, clave });
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

      if (tok.startsWith('<backup') || tok.startsWith('<forward')) {
        const d = parseInt(valor(tok, 'duration'), 10);
        if (Number.isNaN(d)) { problema('<backup>/<forward> sin <duration>'); continue; }
        pos += tok.startsWith('<backup') ? -d : d;
        if (pos < 0) problema('un <backup> regresa antes del inicio del compas');
        continue;
      }

      // ── <note> ──
      if (/<grace\b/.test(tok)) { problema('hay NOTAS DE ADORNO (<grace>), que este conversor todavia no traduce'); continue; }
      if (/<time-modification>|<tuplet\b/.test(tok)) { problema('hay TRESILLOS (<tuplet>), que este conversor todavia no traduce'); continue; }
      if (/<cue\s*\/>/.test(tok)) { problema('hay notas guia (<cue>), que no se tocan; este conversor no las traduce'); continue; }

      const st = valor(tok, 'staff') || '1';
      if (st !== '1' && st !== '2') { problema(`pentagrama ${st} inesperado`); continue; }
      const voz = valor(tok, 'voice') || '1';
      if (!/^\d+$/.test(voz)) { problema(`voz "${voz}" no numerica`); continue; }
      if (!c.voces[st].has(voz)) c.voces[st].set(voz, []);
      const lista = c.voces[st].get(voz);
      if (!vigentes.has(lista)) vigentes.set(lista, new Map());
      const vigentesVoz = vigentes.get(lista);

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
        const implicita = vigentesVoz.has(clave) ? vigentesVoz.get(clave) : deArmadura(step, estado.fifths);
        let signo = '';
        if (/<accidental\b/.test(tok) || alter !== implicita) {
          signo = SIMBOLO[alter];
          vigentesVoz.set(clave, alter);
        }
        nota = {
          abc: signo + letraAbc(step, octava),
          midi: PASO[step] + alter + (octava + 1) * 12,
          dedos,
          liga: /<tie\s+type="start"/.test(tok),
          ligaFin: /<tie\s+type="stop"/.test(tok),
        };
      }

      if (enAcorde) {
        const prev = ultima && ultima.lista === lista ? ultima.evento : null;
        if (!prev || prev.esSilencio || esSilencio) { problema('acorde mal formado'); continue; }
        prev.notas.push(nota);
      } else {
        // print-object="no": silencio que MuseScore rellena pero no dibuja → `x` en ABC.
        const invisible = esSilencio && /^<note\b[^>]*\sprint-object="no"/.test(tok);
        const evento = { inicio: pos, dur, esSilencio, invisible, notas: esSilencio ? [] : [nota] };
        lista.push(evento);
        ultima = { lista, evento };
        pos += dur;
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
      c.largo = completo;

      if (!c.problema) { // con notas descartadas la suma ya no significa nada
        // La voz principal de cada mano (la de numero menor) tiene que llenar el
        // compas sin huecos: es la que dice cuanto mide. Las demas pueden entrar
        // tarde o callar antes (se rellena con `x`), pero no encimarse ni pasarse.
        const sumas = [];
        for (const st of manos) {
          const [principal] = ordenVoces(c.voces[st]);
          if (!principal) continue;
          let t = 0;
          for (const e of c.voces[st].get(principal)) {
            if (e.inicio !== t) { problema(`la voz principal de la mano ${MANO[st]} tiene un hueco`); break; }
            t += e.dur;
          }
          sumas.push(t);
        }
        if (c.implicito) {
          // Anacrusa (o compas final incompleto): valido, pero ambas manos deben medir igual.
          if (!sumas.length) problema('compas incompleto y vacio');
          else if (sumas.some((s) => s !== sumas[0])) problema(`las dos manos no miden lo mismo (${sumas.join(' vs ')})`);
          else c.largo = sumas[0];
        } else if (sumas.some((s) => s !== completo)) {
          problema(`dura ${sumas.find((s) => s !== completo)} divisiones y el compas ${estado.compas} pide ${completo}`);
        }
        for (const st of manos) {
          for (const [voz, eventos] of c.voces[st]) {
            let fin = 0;
            for (const e of eventos) {
              if (e.inicio < fin) problema(`en la mano ${MANO[st]}, la voz ${voz} tiene notas encimadas`);
              fin = e.inicio + e.dur;
            }
            if (fin > c.largo) problema(`en la mano ${MANO[st]}, la voz ${voz} se pasa del compas`);
          }
        }
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

/**
 * ABC de un compas para UNA VOZ de una mano. `v` es { st, voz, hermanas }
 * (hermanas = las voces que se escriben en esa mano); `clave` es { actual } y
 * se va actualizando.
 */
function compasAbc(c, v, unidad, clave) {
  const eventos = c.voces[v.st].get(v.voz) || [];
  const claves = c.claves[v.st];
  const piezas = [];
  const figura = (d) => (d === unidad ? '' : String(d / unidad));
  const cambiarClave = (nueva) => {
    if (nueva === clave.actual) return;
    piezas.push(`[K:clef=${nueva}]`); // conserva la armadura (verificado en abcjs)
    clave.actual = nueva;
  };

  // Clave efectiva al entrar al compas: la de su inicio, con los cambios que
  // ocurren en el instante 0. Tras un salto de repeticion puede diferir de la
  // que traia el compas anterior en el orden desplegado. Los cambios de clave son
  // del pentagrama: se escriben igual en cada una de sus voces.
  let k = 0;
  let entrada = c.clavesAlInicio[v.st];
  while (k < claves.length && claves[k].pos === 0) entrada = claves[k++].clave;
  cambiarClave(entrada);

  // Avanza el reloj de la voz hasta `hasta`: los huecos (voz que entra tarde o
  // calla antes) van como silencio invisible `x`, cortado donde cae un cambio de clave.
  let t = 0;
  const avanzar = (hasta) => {
    while (k < claves.length && claves[k].pos <= hasta) {
      if (claves[k].pos > t) { piezas.push(`x${figura(claves[k].pos - t)}`); t = claves[k].pos; }
      cambiarClave(claves[k++].clave);
    }
    if (hasta > t) { piezas.push(`x${figura(hasta - t)}`); t = hasta; }
  };

  // Voz sin nada en este compas: silencio visible si es lo unico de la mano;
  // invisible si la otra voz si toca (no se dibuja un silencio encima de sus notas).
  const otraToca = v.hermanas.some((h) => h !== v.voz && (c.voces[v.st].get(h) || []).length);
  if (!eventos.length && !otraToca) { piezas.push(`z${figura(c.largo)}`); t = c.largo; }

  for (const e of eventos) {
    avanzar(e.inicio);
    t = e.inicio + e.dur;
    const dur = figura(e.dur);
    if (e.esSilencio) { piezas.push(`${e.invisible ? 'x' : 'z'}${dur}`); continue; }

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
  avanzar(c.largo);
  return piezas.join(' ');
}

/** Primer compas de la secuencia: con que clave arranca cada mano. */
function claveInicial(c, st) {
  let clave = c.clavesAlInicio[st];
  for (const k of c.claves[st]) {
    if (k.pos !== 0) break;
    clave = k.clave;
  }
  return clave;
}

/** Linea de una voz siguiendo el orden de ejecucion (desplegado). */
function lineaDesplegada(compases, secuencia, v, unidad) {
  const clave = { actual: claveInicial(compases[secuencia[0]], v.st) };
  let s = '';
  secuencia.forEach((i, j) => {
    if (j > 0) s += i === secuencia[j - 1] + 1 ? ' | ' : ' || ';
    s += compasAbc(compases[i], v, unidad, clave);
  });
  return s + ' |]';
}

/** Linea de una voz tal como esta ESCRITA, con signos de repeticion y casillas. */
function lineaEscrita(compases, desde, hasta, v, unidad) {
  const clave = { actual: claveInicial(compases[desde], v.st) };
  let s = '';
  for (let i = desde; i <= hasta; i++) {
    const c = compases[i];
    const prev = i > desde ? compases[i - 1] : null;
    let barra = '';
    if (prev) barra = prev.repiteFin ? (c.repiteInicio ? ':||:' : ':|') : (c.repiteInicio ? '|:' : '|');
    else if (c.repiteInicio) barra = '|:';
    if (c.casillaInicia) barra += `[${c.casilla.join(',')}`;
    s += (barra ? `${barra} ` : '') + compasAbc(c, v, unidad, clave) + ' ';
  }
  return s + (compases[hasta].repiteFin ? ':|' : '|]');
}

/**
 * Arma el campo `notas` en el formato que espera PianoPrompter.
 * `pentagramas` = [{ clave, lineas: [una o dos voces], plicas: ['up'|'down'|null...] }],
 * derecha primero.
 *
 * Las voces se numeran corrido (derecha primero) y `%%staves` dice cuales van
 * juntas en un pentagrama: `{1 2}` una voz por mano (todo el contenido de antes,
 * identico), `{(1 2) (3 4)}` dos y dos, `{1 (2 3)}` bajo + arpegio a la izquierda.
 * La MANO la decide el grupo, no el numero de voz.
 */
function armarNotas(pentagramas, tonalidad) {
  if (pentagramas.length === 1 && pentagramas[0].lineas.length === 1) return pentagramas[0].lineas[0];
  let n = 0;
  const grupos = [];
  const cuerpo = [];
  for (const p of pentagramas) {
    const ids = p.lineas.map(() => ++n);
    grupos.push(ids.length > 1 ? `(${ids.join(' ')})` : String(ids[0]));
    p.lineas.forEach((linea, j) => {
      // Con dos voces, la aguda con plica arriba y la grave abajo: sin esto abcjs
      // decide nota por nota y las plicas de una voz atraviesan a la otra.
      const plica = p.plicas?.[j] ? ` stem=${p.plicas[j]}` : '';
      // Digitacion izquierda ARRIBA de sus notas (entre pentagramas), a proposito:
      // con `%%ornament below` abcjs pega los numeros a cabezas y plicas y se
      // vuelven ilegibles (comparado con capturas de Chrome, 2026-09-16).
      cuerpo.push(`V:${ids[j]} clef=${p.clave}${plica}`, linea);
    });
  }
  return [
    `%%staves ${pentagramas.length > 1 ? `{${grupos.join(' ')}}` : grupos[0]}`,
    // K: explicito: PianoPrompter no inserta el suyo si las notas ya traen uno,
    // y las claves en linea ([K:clef=...]) contienen "K:".
    `K:${tonalidad}`,
    ...cuerpo,
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

/**
 * Lo que abcjs TOCA: por mano, lista ordenada de "instante:altura" en divisiones.
 * abcjs da una pista por VOZ, en orden de pentagrama; se juntan las de cada
 * pentagrama (= mano) segun cuantas voces tiene.
 */
function pistasAbcjs(abcjs, abc, divisiones) {
  const tune = abcjs.parseOnly(abc)[0];
  if (!tune) throw new Error('abcjs no pudo leer el ABC generado');
  const porVoz = tune.setUpAudio({ qpm: 60 }).tracks.map((tr) => tr
    .filter((x) => x.cmd === 'note' && typeof x.pitch === 'number')
    .map((x) => `${Math.round(x.start * 4 * divisiones)}:${x.pitch}`));
  const linea = tune.lines.find((l) => l.staff);
  const vocesPorMano = linea ? linea.staff.map((s) => s.voices.length) : [porVoz.length];
  let v = 0;
  const pistas = vocesPorMano.map((n) => porVoz.slice(v, (v += n)).flat().sort());
  if (v !== porVoz.length) throw new Error(`abcjs dio ${porVoz.length} pistas y los pentagramas suman ${v} voces`);
  return { pistas, warnings: tune.warnings || [], pulso: tune.getBeatLength() };
}

/**
 * Lo que DEBERIA sonar, releido del MusicXML CRUDO con un lector aparte: a
 * proposito simple y sin compartir nada con leerPartitura. Si el lector principal
 * pierde una nota de un acorde, la cambia de mano o le cambia la duracion, este
 * no se equivoca igual — comparar contra el propio modelo no detectaria nada
 * (lo demostro una prueba de mutacion).
 * Sigue el reloj de MusicXML tal cual lo define el estandar: la nota avanza,
 * <backup> regresa, <forward> adelanta, <chord/> suena junto con la anterior.
 */
function pistasDesdeXml(compases, secuencia, manos) {
  const pistas = manos.map(() => []);
  let t0 = 0;
  for (const i of secuencia) {
    let cursor = 0;
    let fin = 0;
    let inicioPrevio = 0;
    for (const [tok] of compases[i].xml.matchAll(/<note[\s>][\s\S]*?<\/note>|<backup>[\s\S]*?<\/backup>|<forward>[\s\S]*?<\/forward>/g)) {
      const dur = Number((tok.match(/<duration>(\d+)<\/duration>/) || [null, 0])[1]);
      if (tok.startsWith('<backup')) { cursor -= dur; continue; }
      if (tok.startsWith('<forward')) { cursor += dur; fin = Math.max(fin, cursor); continue; }
      const enAcorde = /<chord\s*\/>/.test(tok);
      const inicio = enAcorde ? inicioPrevio : cursor;
      if (!enAcorde) { inicioPrevio = cursor; cursor += dur; fin = Math.max(fin, cursor); }

      const st = (tok.match(/<staff>(\d+)<\/staff>/) || [null, '1'])[1];
      const m = manos.indexOf(st);
      if (m < 0 || /<rest\b/.test(tok) || /<tie\s+type="stop"/.test(tok)) continue;
      const step = tok.match(/<step>([A-G])<\/step>/)[1];
      const alter = Number((tok.match(/<alter>(-?\d+)<\/alter>/) || [null, 0])[1]);
      const octava = Number(tok.match(/<octave>(\d+)<\/octave>/)[1]);
      pistas[m].push(`${t0 + inicio}:${PASO[step] + alter + (octava + 1) * 12}`);
    }
    t0 += fin;
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

  // Voces que se escriben en cada mano: las que TOCAN algo en lo pedido (una voz
  // de puros silencios no aporta y solo ensuciaria). Asi una pieza de una voz por
  // mano sale identica a como salia antes de soportar dos.
  const voces = manos.map((st) => {
    const todas = new Set();
    const conNotas = new Set();
    for (const c of usados) {
      for (const [voz, eventos] of c.voces[st]) {
        todas.add(voz);
        if (eventos.some((e) => !e.esSilencio)) conNotas.add(voz);
      }
    }
    const elegidas = [...(conNotas.size ? conNotas : todas)].sort((a, b) => a - b);
    if (elegidas.length > 2) {
      const c = usados.find((x) => x.voces[st].has(elegidas[2]));
      throw new Error(`compas ${c.numero}: la mano ${MANO[st]} usa ${elegidas.length} voces (${elegidas.join(', ')}); este conversor maneja hasta 2 por mano`);
    }
    if (!elegidas.length) elegidas.push('1');
    // Con dos voces, plica arriba la mas AGUDA en promedio (regla de grabado).
    // No se puede fiar del numero de voz: en el Preludio de Bach la voz 1 de
    // MuseScore es el Do grave, con plica abajo.
    const media = (voz) => {
      const midis = usados.flatMap((c) => (c.voces[st].get(voz) || []).flatMap((e) => e.notas.map((x) => x.midi)));
      return midis.reduce((a, m) => a + m, 0) / (midis.length || 1);
    };
    const aguda = elegidas.length > 1 && media(elegidas[1]) > media(elegidas[0]) ? 1 : 0;
    return elegidas.map((voz, j) => ({
      st,
      voz,
      hermanas: elegidas,
      plica: elegidas.length > 1 ? (j === aguda ? 'up' : 'down') : null,
    }));
  });

  // Todo lo que cae en el reloj (duraciones, entradas tardias de una voz, cambios
  // de clave) tiene que caber en la unidad elegida.
  const duraciones = usados.flatMap((c) => [c.largo, ...manos.flatMap((st) => [
    ...[...c.voces[st].values()].flat().flatMap((e) => [e.dur, e.inicio]),
    ...c.claves[st].map((k) => k.pos),
  ])]);
  const unidad = elegirUnidad(duraciones, base.divisiones);

  const tonalidad = opciones.tonalidad
    || (partitura.modo === 'minor' ? MENORES : MAYORES)[base.fifths];
  if (!tonalidad) throw new Error(`armadura de ${base.fifths} alteraciones no soportada`);

  const pentagramas = (linea) => voces.map((vs) => ({
    clave: claveInicial(base, vs[0].st),
    lineas: vs.map(linea),
    plicas: vs.map((v) => v.plica),
  }));
  const notas = armarNotas(pentagramas((v) => lineaDesplegada(compases, secuencia, v, unidad.u)), tonalidad);
  const configuracion = {
    compas: base.compas,
    tonalidad,
    clave: claveInicial(base, '1'),
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
      const escritas = pentagramas((v) => lineaEscrita(compases, desde, hasta, v, unidad.u));
      const abcEscrito = abcCompleto(armarNotas(escritas, tonalidad), configuracion);
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

// Fecha LOCAL (AAAA-MM-DD). `toISOString` da la de UTC: en la noche de Mexico ya
// es "mañana" y la pieza quedaba fechada un dia despues.
function fechaLocal(d = new Date()) {
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
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
      convertido: fechaLocal(),
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
