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
