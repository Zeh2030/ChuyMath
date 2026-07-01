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
