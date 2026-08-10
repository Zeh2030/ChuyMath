// Sonido corto y alegre para los juegos de peques (Web Audio, sin archivos de audio).
let audioCtx = null;

export function sonar(freq = 660) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.37);
  } catch {
    /* sin audio, no pasa nada */
  }
}

// Notas de una escala pentatónica alegre (para variar el tono).
export const NOTAS = [523.25, 587.33, 659.25, 783.99, 880.0];

// Voz (Web Speech) en español, para que los pre-lectores escuchen la instrucción.
// Funciona offline con las voces del sistema operativo. Si no hay, no pasa nada.
//
// Antes solo se ponía `lang = 'es-MX'` y NO se elegía voz, así que el navegador usaba
// la que trajera por defecto — normalmente la robótica de Windows. Elegir voz a mano
// es lo que más mejora el tono, y de paso mejora todos los juegos que usan hablar().
//
// Preferencia: las de Google (Chrome, mucho más naturales) y luego las locales de
// Windows en español de México.
const VOCES_PREFERIDAS = [
  'google español de estados unidos',
  'google español',
  'sabina',   // Microsoft Sabina — es-MX
  'dalia',    // Microsoft Dalia — es-MX (Win 11)
  'jorge',
  'raul',
];

let vozElegida;

function elegirVoz() {
  const voces = window.speechSynthesis.getVoices() || [];
  const es = voces.filter((v) => /^es\b|^es[-_]/i.test(v.lang));
  if (!es.length) return null;
  for (const pref of VOCES_PREFERIDAS) {
    const v = es.find((x) => x.name.toLowerCase().includes(pref));
    if (v) return v;
  }
  // Sin preferidas: latinoamericana antes que peninsular (es la que oyen en casa).
  return es.find((v) => /mx|419|us/i.test(v.lang)) || es[0];
}

// Las voces cargan async en Chrome: la primera llamada suele devolver [].
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { vozElegida = elegirVoz(); };
}

/**
 * @param {string} texto
 * @param {{rate?: number, pitch?: number}} [opciones]
 *   rate  0.1-10 (1 = normal). Más lento para letras y sílabas sueltas.
 *   pitch 0-2 (1 = normal). Un poco arriba suena más cálido para los peques.
 */
export function hablar(texto, opciones = {}) {
  try {
    if (!window.speechSynthesis || !texto) return;
    if (vozElegida === undefined) vozElegida = elegirVoz();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-MX';
    u.rate = opciones.rate ?? 0.95;
    u.pitch = opciones.pitch ?? 1.1;
    if (vozElegida) u.voice = vozElegida;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* sin voz, no pasa nada */
  }
}

// Ritmo pausado y cálido para letras y sílabas sueltas, donde la voz normal
// atropella. Lo usan Abecedario, LetraQuiz y Silabas.
export const VOZ_LETRAS = { rate: 0.8, pitch: 1.15 };
