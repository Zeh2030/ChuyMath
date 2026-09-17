// Utilidades musicales puras (sin dependencias).
// MIDI: 60 = Do central (C4). Piano real: 21 (La0) a 108 (Do8).

// Frecuencia en Hz de una nota MIDI (La4 = 69 = 440 Hz).
export const midiAFrecuencia = (midi) => 440 * 2 ** ((midi - 69) / 12);

// ¿La tecla es negra? (por posición dentro de la octava)
const NEGRAS = new Set([1, 3, 6, 8, 10]);
export const esNegra = (midi) => NEGRAS.has(((midi % 12) + 12) % 12);

// Nombre en español + octava (Do central = Do4).
const NOMBRES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
export const nombreDeMidi = (midi) => ({
  nombre: NOMBRES[((midi % 12) + 12) % 12],
  octava: Math.floor(midi / 12) - 1,
});

// Rango de teclado para una lista de notas MIDI: expande a octavas completas
// (empieza en Do, termina en Si) y lo acota al piano real. Así el teclado
// muestra solo lo que la pieza usa, con teclas grandes.
export const rangoTeclado = (midis, margen = 0) => {
  if (!midis || !midis.length) return { min: 60, max: 83 }; // 2 octavas centrales
  let min = Math.min(...midis) - margen;
  let max = Math.max(...midis) + margen;
  min = Math.floor(min / 12) * 12;          // baja al Do de su octava
  max = Math.ceil((max + 1) / 12) * 12 - 1; // sube al Si de su octava
  return { min: Math.max(21, min), max: Math.min(108, max) };
};

// ─── Metrónomo ───
// Tolerancia en ms: los instantes de abcjs son flotantes.
const TOL_MS = 1;

/**
 * Clicks del metrónomo alineados a los compases REALES de la pieza, no a una
 * rejilla que arranca en 0. Con rejilla fija, una pieza con anacrusa (Für Elise
 * empieza con dos semicorcheas) ponía el acento en el tiempo equivocado de TODOS
 * los compases, y una repetición que vuelve a la anacrusa lo volvía a correr.
 *
 * - Compás completo: clicks desde su inicio; acento en el primero.
 * - Compás incompleto a mitad de pieza (anacrusa, o la anacrusa que se repite
 *   tras una 1a casilla): sus clicks se cuentan HACIA ATRÁS desde el compás
 *   siguiente, donde cae el tiempo fuerte, y no llevan acento.
 * - Compás incompleto al final: arranca en tiempo fuerte, cuenta hacia adelante.
 *
 * @param {number[]} inicios   ms donde empieza cada compás (0 se agrega si falta)
 * @param {number}   finMs     fin de la pieza
 * @param {number}   pulsoMs   separación entre clicks
 * @param {number}   porCompas clicks en un compás completo
 * @returns {{t: number, acento: boolean}[]} ordenados por t
 */
export const pulsosMetronomo = (inicios, finMs, pulsoMs, porCompas) => {
  if (!(pulsoMs > 0) || !(porCompas > 0) || !(finMs > 0)) return [];
  const compasMs = pulsoMs * porCompas;
  const bordes = [0];
  for (const t of [...inicios].sort((a, b) => a - b)) {
    if (t > bordes[bordes.length - 1] + TOL_MS && t < finMs - TOL_MS) bordes.push(t);
  }

  const pulsos = [];
  for (let i = 0; i < bordes.length; i++) {
    const ini = bordes[i];
    const fin = i + 1 < bordes.length ? bordes[i + 1] : finMs;
    const incompleto = fin - ini < compasMs - TOL_MS;
    const esUltimo = i === bordes.length - 1;

    if (incompleto && !esUltimo) {
      const atras = [];
      for (let t = fin - pulsoMs; t >= ini - TOL_MS; t -= pulsoMs) atras.push({ t: Math.max(t, ini), acento: false });
      pulsos.push(...atras.reverse());
    } else {
      for (let k = 0; ini + k * pulsoMs < fin - TOL_MS; k++) {
        pulsos.push({ t: ini + k * pulsoMs, acento: k % porCompas === 0 });
      }
    }
  }
  return pulsos;
};

/**
 * Cuenta de entrada que CONTINÚA la rejilla de la pieza: sus clicks caen donde
 * caerían si la música ya viniera sonando, así el pulso no da un brinco al
 * entrar. Dura al menos un compás completo, y termina justo en `desdeMs`.
 *
 * - Desde un tiempo fuerte: un compás ("1 2 3 4") — lo de siempre.
 * - Desde una anacrusa: "1 2 3 | 1 2" y la anacrusa entra en el 3.
 * - Desde medio compás (bucle o pausa): se cuenta desde el compás anterior.
 *
 * @param {number} desdeMs  donde va a empezar a sonar la pieza
 * @param {{t: number, acento: boolean}[]} pulsos  los de pulsosMetronomo
 * @returns {{pulsos: {t: number, acento: boolean}[], inicioMs: number}}
 *   `t` en ms de la pieza (pueden ser negativos); la cuenta arranca en inicioMs.
 */
export const cuentaDeEntrada = (desdeMs, pulsos, pulsoMs, porCompas) => {
  if (!(pulsoMs > 0) || !(porCompas > 0)) return { pulsos: [], inicioMs: desdeMs };
  const compasMs = pulsoMs * porCompas;
  // Primer tiempo fuerte en o después del arranque; sin él (final de la pieza),
  // se cuenta un compás que termina donde empieza a sonar.
  const fuerte = pulsos.find((p) => p.acento && p.t >= desdeMs - TOL_MS);
  let inicioMs = (fuerte ? fuerte.t : desdeMs) - compasMs;
  while (desdeMs - inicioMs < compasMs - TOL_MS) inicioMs -= compasMs;

  const cuenta = [];
  for (let k = 0; inicioMs + k * pulsoMs < desdeMs - TOL_MS; k++) {
    cuenta.push({ t: inicioMs + k * pulsoMs, acento: k % porCompas === 0 });
  }
  return { pulsos: cuenta, inicioMs };
};

// ─── Digitación en el teclado (Fase 2) ───

/**
 * Qué dedo toca cada nota que SUENA, para pintarlo sobre la tecla iluminada.
 *
 * `tune` es la partitura interpretada por abcjs: sus elementos traen las
 * decoraciones `!0!`..`!5!`. `pistas` son las voces de `setUpAudio`: cada nota
 * trae el `startChar` de su elemento (abcjs lo pone para resaltar al tocar), así
 * que se enlazan sin adivinar por tiempo ni altura.
 *
 * En acordes los dedos se asignan de grave a agudo —así los escribe
 * `_piano/_mxl-a-abc.js`— y SOLO si hay exactamente un dedo por nota: con menos
 * dedos que notas no hay forma honesta de saber cuál es cuál, y se omiten.
 *
 * @returns {Map<object, string>} nota de la pista → dedo
 */
export const dedosPorNota = (tune, pistas) => {
  const porElemento = new Map(); // startChar → ['1', '5']
  for (const linea of tune?.lines || []) {
    for (const staff of linea.staff || []) {
      for (const voz of staff.voices || []) {
        for (const el of voz) {
          if (el.el_type !== 'note' || !Array.isArray(el.decoration)) continue;
          const dedos = el.decoration.filter((d) => /^[0-5]$/.test(d));
          if (dedos.length) porElemento.set(el.startChar, dedos);
        }
      }
    }
  }
  const resultado = new Map();
  if (!porElemento.size) return resultado;

  for (const pista of pistas || []) {
    const grupos = new Map(); // mismo elemento y mismo instante = mismo acorde
    for (const nota of pista) {
      if (nota.cmd !== 'note' || typeof nota.pitch !== 'number' || nota.startChar == null) continue;
      const clave = `${nota.startChar}|${nota.start}`;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(nota);
    }
    for (const notas of grupos.values()) {
      const dedos = porElemento.get(notas[0].startChar);
      if (!dedos || dedos.length !== notas.length) continue;
      [...notas].sort((a, b) => a.pitch - b.pitch).forEach((n, i) => resultado.set(n, dedos[i]));
    }
  }
  return resultado;
};

