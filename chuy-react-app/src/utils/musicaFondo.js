// Música de fondo opcional. Singleton a nivel de módulo (no contexto de React)
// para que sobreviva los cambios de ruta: si viviera en un componente, cada
// navegación lo remontaría y la música arrancaría desde el segundo 0.
//
// Usa HTMLAudioElement a propósito, NO Web Audio API:
//   1. Queda independiente de los dos AudioContext que ya existen (el de
//      sonido.js y sobre todo el de MusicPrompter, cuyo reloj mueve el scroll
//      de la partitura — perturbarlo la desincroniza del sonido).
//   2. Un elemento <audio> reproduce desde otro dominio sin CORS; el
//      decodeAudioData de Web Audio sí lo exigiría en el bucket de Storage.
import { useEffect, useState } from 'react';

let audio = null;
let encendida = false; // intención del usuario
let pistaActual = null; // id de la pista elegida
const motivos = new Set(); // supresiones temporales activas (piano, dictado, letras)
const oyentes = new Set();
let siguienteToken = 1;
let esperandoGesto = false;

const VOLUMEN = 0.25; // por debajo de la voz y de los beeps de acierto/error

const avisar = () => {
  oyentes.forEach((cb) => {
    try {
      cb();
    } catch {
      /* un oyente roto no debe tumbar a los demás */
    }
  });
};

// Suena solo si el usuario la encendió Y no hay ninguna supresión activa.
const deberiaSonar = () => encendida && motivos.size === 0;

// Los navegadores bloquean el audio hasta que hay un gesto del usuario. Si
// play() se rechaza, esperamos al primer toque en cualquier parte y lo
// reintentamos una sola vez.
const reintentarTrasGesto = () => {
  if (esperandoGesto) return;
  esperandoGesto = true;

  const alInteractuar = () => {
    quitar();
    if (deberiaSonar()) intentarReproducir();
  };
  const quitar = () => {
    esperandoGesto = false;
    document.removeEventListener('click', alInteractuar);
    document.removeEventListener('touchstart', alInteractuar);
    document.removeEventListener('keydown', alInteractuar);
  };

  document.addEventListener('click', alInteractuar);
  document.addEventListener('touchstart', alInteractuar);
  document.addEventListener('keydown', alInteractuar);
};

const intentarReproducir = () => {
  if (!audio) return;
  const promesa = audio.play();
  // play() devuelve promesa en navegadores modernos; en los viejos, undefined.
  if (promesa && typeof promesa.catch === 'function') {
    promesa.catch(() => reintentarTrasGesto());
  }
};

const sincronizar = () => {
  if (!audio) return;
  if (deberiaSonar()) intentarReproducir();
  else audio.pause();
};

// Enciende la música con la pista dada ({ id, url }). El elemento de audio se
// crea aquí y no antes: mientras esté apagada no se descarga ni un byte del
// mp3 (pesan varios MB). Llamarla con otra pista cambia de canción al vuelo.
export function encender(pista) {
  if (!pista?.url) return;

  if (!audio) {
    audio = new Audio(pista.url);
    audio.loop = true;
    audio.volume = VOLUMEN;
  } else if (pistaActual !== pista.id) {
    // Cambio de pista: reemplazar la fuente arranca la nueva desde el inicio.
    audio.src = pista.url;
  }

  pistaActual = pista.id;
  encendida = true;
  sincronizar();
  avisar();
}

export function apagar() {
  encendida = false;
  if (audio) audio.pause();
  avisar();
}

// Silencio temporal mientras dura una actividad donde el audio es el ejercicio.
// Devuelve un token en vez de recibir un nombre para que dos supresiones
// simultáneas nunca se pisen entre sí.
export function suprimir() {
  const token = siguienteToken++;
  motivos.add(token);
  sincronizar();
  return token;
}

export function liberar(token) {
  motivos.delete(token);
  sincronizar();
}

export function estaEncendida() {
  return encendida;
}

export function pistaEncendida() {
  return encendida ? pistaActual : null;
}

export function suscribir(cb) {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

// Hook para que la UI (el botón del Header) refleje el estado real.
// Devuelve el id de la pista sonando, o null si está apagada.
export function useMusicaFondo() {
  const [pista, setPista] = useState(pistaEncendida());

  useEffect(() => suscribir(() => setPista(pistaEncendida())), []);

  return pista;
}
