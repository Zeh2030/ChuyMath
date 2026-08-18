import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { soportaWebGL } from '../../../utils/webgl';
import {
  PLANETAS, SOL, CONSTELACIONES, COMETA,
  ESTRELLAS_COMPARAR, PASOS_ESTRELLAS, ORBITAS_UA, UA_POR_RADIO_SOL,
  PLANETAS_ESCALERA, PASOS_EXOPLANETAS, ASTEROIDES_ESCALERA, PASOS_ASTEROIDES,
  faseInfoDe, estacionInfoDe, cometaInfoDe, impactoInfoDe, bigBangInfoDe, naceSolInfoDe,
  diaNocheInfoDe, MOMENTOS, CARRERA_ANIOS, DISTANCIAS_REALES, EJES,
  etiquetaComparar, etiquetaEstrella, etiquetaExoplaneta, etiquetaAsteroide,
} from './espacioDatos';

// Las tres escenas que comparten el motor de escalera por pasos.
const ESCALERAS = ['estrellas', 'exoplanetas', 'asteroides'];
import './Espacio3D.css';

/**
 * Espacio3D — motor three.js del modulo de astronomia.
 *
 * Dos escenas:
 *   'planetas'    : el Sol y los 8 planetas orbitando. Tocar un cuerpo lo
 *                   selecciona (onSeleccion); `enfocado` acerca la camara a el;
 *                   `comparar` forma a todos en fila a TAMANO REAL (el momento
 *                   wow: la Tierra se vuelve una canica junto al Sol).
 *   'tierra-luna' : Sol (luz real) + Tierra + Luna con deslizador de orbita.
 *                   La fase se ve en un recuadro "asi se ve desde la Tierra"
 *                   (una segunda camara dentro de la Tierra). Los eclipses
 *                   salen solos: son sombras de verdad (shadow map).
 *
 * Igual que Cubo3D: geometria 100% procedural, texturas dibujadas en canvas,
 * cero modelos externos. Este archivo solo se descarga al entrar a una mision
 * de astronomia (React.lazy en SistemaSolar.jsx).
 */

/* ============================ texturas procedurales ============================ */

// Generador con semilla: los planetas se ven IGUAL en cada visita.
const crearRng = (semilla) => {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const crearTexturaCuerpo = ({ tex, color, semilla = 7 }) => {
  const W = 256;
  const H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const rng = crearRng(semilla);

  ctx.fillStyle = color || '#888';
  ctx.fillRect(0, 0, W, H);

  // Pinta la elipse tres veces (x, x-W, x+W) para que la textura no tenga
  // costura en el borde del mapa esferico.
  const mancha = (x, y, rx, ry, c, a = 1) => {
    ctx.globalAlpha = a;
    ctx.fillStyle = c;
    for (const dx of [0, -W, W]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const bandas = (colores) => {
    const h = H / colores.length;
    colores.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, i * h, W, h + 1);
    });
  };

  // Casquete polar con borde irregular: franja fina + fila de elipses con
  // jitter. El rect duro se veia como calcomania pegada en el polo.
  const casquetes = (c, alto) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, W, H * alto * 0.55);
    ctx.fillRect(0, H * (1 - alto * 0.55), W, H * alto * 0.55);
    for (let x = 0; x < W; x += 9) {
      const r = 5 + rng() * 8;
      mancha(x + rng() * 8, H * alto * 0.55, r, r * (0.4 + rng() * 0.3), c);
      mancha(x + rng() * 8, H * (1 - alto * 0.55), r, r * (0.4 + rng() * 0.3), c);
    }
  };

  switch (tex) {
    case 'sol':
      for (let i = 0; i < 50; i++) mancha(rng() * W, rng() * H, 6 + rng() * 14, 4 + rng() * 8, '#ffb020', 0.4);
      for (let i = 0; i < 18; i++) mancha(rng() * W, rng() * H, 3 + rng() * 8, 2 + rng() * 5, '#fff3a0', 0.5);
      break;
    case 'estrella':
      // Granulacion neutra (blanco/negro translucido) que funciona sobre
      // CUALQUIER color base — sirve para toda la escalera de estrellas.
      for (let i = 0; i < 40; i++) mancha(rng() * W, rng() * H, 6 + rng() * 14, 4 + rng() * 8, 'rgba(255,255,255,0.14)');
      for (let i = 0; i < 22; i++) mancha(rng() * W, rng() * H, 4 + rng() * 10, 3 + rng() * 6, 'rgba(0,0,0,0.10)');
      break;
    case 'craterizado':
      for (let i = 0; i < 26; i++) {
        const x = rng() * W;
        const y = rng() * H;
        const r = 2 + rng() * 7;
        mancha(x, y, r, r * 0.8, 'rgba(0,0,0,0.28)');
        mancha(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.4, 'rgba(255,255,255,0.16)');
      }
      break;
    case 'nubes':
      for (let i = 0; i < 12; i++) {
        const y = rng() * H;
        mancha(rng() * W, y, 30 + rng() * 50, 4 + rng() * 6, 'rgba(255,255,255,0.20)');
        mancha(rng() * W, y + 6, 30 + rng() * 50, 3 + rng() * 5, 'rgba(160,110,30,0.15)');
      }
      break;
    case 'tierra': {
      // Algo de profundidad en el oceano
      for (let i = 0; i < 6; i++) mancha(rng() * W, rng() * H, 30 + rng() * 50, 12 + rng() * 18, '#275ec4', 0.45);
      // Grupos de continentes REPARTIDOS por longitud (al azar puro salian
      // apilados en columna) con varios verdes e islitas alrededor.
      const verdes = ['#3c8a3f', '#4c9e46', '#5fae52'];
      const G = 7;
      for (let g = 0; g < G; g++) {
        const cx = ((g + 0.15 + rng() * 0.7) / G) * W;
        const cy = H * (0.24 + rng() * 0.52);
        const verde = verdes[g % verdes.length];
        const n = 4 + Math.floor(rng() * 3);
        for (let j = 0; j < n; j++) {
          mancha(cx + (rng() - 0.5) * 44, cy + (rng() - 0.5) * 26, 6 + rng() * 12, 5 + rng() * 8, verde);
        }
        for (let j = 0; j < 3; j++) {
          mancha(cx + (rng() - 0.5) * 90, cy + (rng() - 0.5) * 52, 1.5 + rng() * 2.5, 1.2 + rng() * 2, verdes[(g + 1) % 3]);
        }
      }
      casquetes('#f4f8ff', 0.1);
      // Nubes alargadas, en dos capas translucidas
      for (let i = 0; i < 10; i++) {
        const y = rng() * H;
        mancha(rng() * W, y, 24 + rng() * 34, 3 + rng() * 4, 'rgba(255,255,255,0.30)');
        mancha(rng() * W, y + 4, 16 + rng() * 24, 2.5 + rng() * 3, 'rgba(255,255,255,0.20)');
      }
      break;
    }
    case 'marte': {
      for (let i = 0; i < 18; i++) mancha(rng() * W, rng() * H, 6 + rng() * 16, 4 + rng() * 9, 'rgba(90,30,10,0.25)');
      // El monte Olimpo: el volcan mas alto del sistema solar (C2-30). Un
      // escudo tan ancho que desde arriba casi no se notaria el relieve, asi
      // que se representa con un halo mas claro (la caida de sus laderas) y
      // una caldera oscura en el centro (el crater de la cima).
      const ox = W * 0.22;
      const oy = H * 0.42;
      mancha(ox, oy, 15, 10, 'rgba(220,150,110,0.35)');
      mancha(ox, oy, 9, 6, 'rgba(235,175,135,0.4)');
      mancha(ox, oy, 3.2, 2.2, 'rgba(80,25,10,0.55)');
      // Casquetes blanco hueso (hielo de agua + hielo seco)
      casquetes('#ece4d4', 0.08);
      break;
    }
    case 'bandas':
      bandas(['#e8d3ab', '#c98d4e', '#e2b57e', '#a96a38', '#e8d3ab', '#b87c44', '#d9a768', '#c98d4e']);
      // La Gran Mancha Roja
      mancha(W * 0.7, H * 0.62, 14, 8, '#c0392b', 0.9);
      mancha(W * 0.7, H * 0.62, 9, 5, '#e74c3c', 0.9);
      break;
    case 'bandas-suaves':
      bandas(['#e9d9a8', '#d9c28a', '#e3cf9c', '#cdb478', '#e9d9a8', '#d9c28a']);
      break;
    case 'liso': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,255,255,0.18)');
      g.addColorStop(1, 'rgba(0,40,60,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      break;
    }
    case 'neptuno':
      mancha(rng() * W, H * 0.4, 60, 6, 'rgba(255,255,255,0.15)');
      mancha(W * 0.35, H * 0.55, 13, 7, 'rgba(10,20,80,0.55)');
      break;
    default:
      break;
  }

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
};

const crearTexturaGlow = () => {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,220,120,0.85)');
  g.addColorStop(0.35, 'rgba(255,180,60,0.35)');
  g.addColorStop(1, 'rgba(255,160,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
};

// Galaxia espiral de bolsillo: nucleo brillante + dos brazos de puntitos
// sobre una espiral. Para los sprites que "se encienden" en los cumulos de
// la escena big-bang.
const crearTexturaGalaxia = (semilla = 5) => {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const rng = crearRng(semilla);
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S * 0.45);
  g.addColorStop(0, 'rgba(255,244,214,1)');
  g.addColorStop(0.25, 'rgba(255,236,190,0.5)');
  g.addColorStop(1, 'rgba(140,170,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  for (const fase0 of [0, Math.PI]) {
    for (let i = 0; i < 90; i++) {
      const t = i / 90;
      const ang = fase0 + t * 3.6;
      const r = 6 + t * 50;
      ctx.globalAlpha = 0.5 * (1 - t) + 0.08;
      ctx.fillStyle = '#cfe0ff';
      ctx.beginPath();
      ctx.arc(
        S / 2 + Math.cos(ang) * r + (rng() - 0.5) * 4,
        S / 2 + Math.sin(ang) * r * 0.62 + (rng() - 0.5) * 4,
        1.4 + rng() * 1.8, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
};

// Halo suave y blanco para las estrellas de las constelaciones: las hace
// bonitas Y grandes de tocar sin convertirlas en pelotas.
const crearTexturaHalo = () => {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.38)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
};

/* ============================ constantes ============================ */

const FOV = 45;
const UMBRAL_TOQUE = 6;   // px; por debajo es un toque, no un arrastre
const INSET = 140;        // px del recuadro "asi se ve desde la Tierra"

// Escena constelaciones: tamanos en RADIANES aparentes (el bucle multiplica por
// la distancia a la camara). Asi una estrella se ve —y se toca— igual de grande
// este a 20 o a 100 unidades. El blanco de toque es invisible pero ancho: con
// esferas del tamano visible, tocar una estrella en tablet era casi imposible.
const K_ESTRELLA = 0.016; // nucleo ~14 px
const K_HALO = 0.05;      // resplandor ~48 px
const K_TOQUE = 0.032;    // blanco del dedo ~28-35 px (el maximo antes de que
                          // las 3 estrellas del cinturon de Orion se pisen)
const VEL_ORBITAL = 0.22; // rad/s de la Tierra (los demas van a su velocidad relativa)

// Escena tierra-luna. Tamanos exagerados a proposito (la Luna real esta a 60
// radios terrestres); la consecuencia es que la sombra de la Tierra es ancha,
// lo cual hasta ayuda: se ve clarisimo cuando la Luna entra en ella.
const TL = {
  radioTierra: 1.35,
  radioLuna: 0.42,
  orbitaLuna: 8.2,
  distSol: 50,
  radioSol: 2.6,
};

// Escena estaciones: el Sol en el centro, la Tierra orbitando con eje inclinado.
const EST = {
  radioTierra: 1.35,
  radioSol: 3,
  orbita: 14,
  inclinacion: 0.41, // 23.5 grados
};

// Escena agujero-negro: la Tierra se comprime a PESO CONSTANTE (GM fijo — esa
// es la leccion). Con esta velocidad de la luz de juguete, el horizonte queda
// en R_s = 2·GM/c² = 0.3, y el deslizador lo cruza a ~85% del recorrido
// (tension dramatica al final). Es la "estrella oscura" de Michell (1783):
// pura mecanica de Newton, la ruta honesta para un nino.
const AN = {
  GM: 40,
  radioMax: 3,          // la "Tierra" sin apretar
  radioMin: 0.2,
  cLuz: 16.33,          // velocidad de la luz de la simulacion
  radioHorizonte: 0.3,  // 2*GM/cLuz²
  orbitaLuna: 8,
  radioLuna: 0.45,
};

// Radio de la Tierra comprimida segun el deslizador (interpolacion
// logaritmica: los primeros apretones se notan, el final es dramatico).
const radioAN = (t) => AN.radioMax * Math.pow(AN.radioMin / AN.radioMax, Math.min(100, Math.max(0, t)) / 100);

// Velocidad de escape en la superficie como % de la velocidad de la luz —
// numero REAL de la simulacion, para la etiqueta.
const pctEscapeAN = (t) => Math.round((Math.sqrt(2 * AN.GM / radioAN(t)) / AN.cLuz) * 100);

// Escena cama-elastica: la sabana del espacio. El deslizador es el PESO de la
// bola central; la rejilla se hunde y la canica rueda por el hueco. La canica
// se mueve con el MISMO integrador de Newton de las otras escenas: la gracia
// pedagogica es que la imagen de Einstein (espacio hundido) produce las
// mismas curvas que ya conoce de Newton.
// Los numeros estan elegidos (simulando el integrador) para que el deslizador
// recorra los cuatro desenlaces en bandas anchas y con vuelos cortos:
// 0-9 recta · 10-23 curva · 24-74 orbita · 75-100 cae.
const CE = {
  lado: 30,
  divisiones: 24,
  sigma: 3.2,        // ancho del embudo
  profMax: 7,        // hundimiento en el centro con peso maximo
  GMmax: 875,
  r0: 9,             // desde donde se suelta la canica
  v0: 5.25,          // velocidad de lanzamiento (fija: lo que cambia es el peso)
  radioCanica: 0.24,
  bolaMin: 0.35,
  bolaMax: 2.75,
  borde: 14,         // se salio del tapete (el tapete llega a 15)
  desviacionMin: 0.35, // ~20 grados: menos que esto, el camino fue "derechito"
};

const pesoCE = (t) => Math.min(100, Math.max(0, t)) / 100;
const profCE = (t) => CE.profMax * pesoCE(t);
const gmCE = (t) => CE.GMmax * pesoCE(t);
const radioBolaCE = (t) => CE.bolaMin + (CE.bolaMax - CE.bolaMin) * pesoCE(t);

// Altura de la sabana a distancia r del centro. Es la forma del potencial de
// Newton (-1/r) suavizada en el centro: el embudo clasico de la cama elastica.
const alturaCE = (r, prof) => -prof * (CE.sigma / (r + CE.sigma));

/* ============================ componente ============================ */

const Espacio3D = forwardRef(function Espacio3D(
  {
    escena = 'planetas',
    enfocado = null,      // id de cuerpo al que acercar la camara
    comparar = false,     // modo "tamano real" en fila (planetas)
    distReal = false,     // modo "distancias reales" en orbita (planetas)
    ocultarSol = false,   // oculta el Sol en modo comparar (planetas)
    seleccionable = true, // si tocar un cuerpo dispara onSeleccion
    fullscreen = false,   // el ANCESTRO (SistemaSolar.jsx) esta en pantalla completa
    onSeleccion = null,   // (idCuerpo) => {}
    onFase = null,        // (info) => {} con cada cambio del deslizador (tierra-luna y estaciones)
    onVista = null,       // (idConstelacion) => {} cuando la figura "encaja" (constelaciones)
  },
  ref
) {
  const contenedorRef = useRef(null);
  const apiRef = useRef(null);
  const soportado = soportaWebGL();

  // La pantalla completa la controla el WRAPPER (SistemaSolar.jsx), no este
  // componente: el elemento que se fullscreenea tiene que ser ancestro de la
  // tarjeta y los botones tambien, que viven fuera de Espacio3D. Aqui solo
  // se reacciona al cambio (prop `fullscreen`) para: (a) aplicar la clase que
  // hace crecer el lienzo, y (b) forzar una remedicion — la transicion real
  // de la Fullscreen API tarda uno o dos frames en asentarse, y si el
  // ResizeObserver de mas abajo lee el tamaño demasiado pronto, la escena se
  // queda con el encuadre "de en medio" (se ve menos de lo que cabe).
  useEffect(() => {
    let id1 = 0;
    let id2 = 0;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        apiRef.current?.redimensionar?.();
      });
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [fullscreen]);

  // Deslizador. Que significa depende de la escena: posicion de la Luna en su
  // orbita (tierra-luna), de la Tierra en el ano (estaciones), del cometa en su
  // elipse (cometa) o VELOCIDAD de lanzamiento en % (satelite).
  const [angulo, setAngulo] = useState(() => {
    if (escena === 'estaciones') return 0;   // solsticio de junio
    if (escena === 'cometa') return 60;      // de viaje, alejandose
    if (escena === 'satelite') return 55;    // velocidad media
    if (ESCALERAS.includes(escena)) return 1; // primer escalon de la escalera
    if (escena === 'impacto') return 25;     // ~una ballena: banda vistosa
    if (escena === 'dia-noche') return 12;   // mediodia en tu casa
    if (escena === 'carrera') return 40;     // velocidad media del tiempo
    if (escena === 'trompos') return 35;     // se nota el giro sin marear
    if (escena === 'big-bang') return 100;   // HOY: el gesto natural es REBOBINAR
    if (escena === 'nace-un-sol') return 0;  // la nube de polvo, antes de todo
    if (escena === 'agujero-negro') return 0; // la Tierra sin apretar todavia
    if (escena === 'cama-elastica') return 0; // espacio plano: sin peso al centro
    return 90;                               // cuarto creciente
  });

  // Desenlace del ultimo lanzamiento (satelite y parientes): lo escribe el bucle.
  const [resultado, setResultado] = useState(null);

  // Big-bang: modo mito (la bola que explota) activado por su boton alterno.
  const [alterno, setAlterno] = useState(false);

  // Constelaciones: pista caliente/frio y nombre de la ultima estrella tocada.
  const [pistaConst, setPistaConst] = useState('frio');
  const [estrellaTocada, setEstrellaTocada] = useState(null);

  // El bucle lee las props cada frame sin reconstruir la escena.
  const estadoRef = useRef({ enfocado, comparar, distReal, ocultarSol, seleccionable, angulo, alterno });
  useEffect(() => {
    estadoRef.current = { enfocado, comparar, distReal, ocultarSol, seleccionable, angulo, alterno };
  }, [enfocado, comparar, distReal, ocultarSol, seleccionable, angulo, alterno]);

  const onSeleccionRef = useRef(onSeleccion);
  const onFaseRef = useRef(onFase);
  const onVistaRef = useRef(onVista);
  useEffect(() => {
    onSeleccionRef.current = onSeleccion;
    onFaseRef.current = onFase;
    onVistaRef.current = onVista;
  }, [onSeleccion, onFase, onVista]);

  // Avisar la fase/estacion/zona/hora visible al entrar y con cada movimiento del deslizador.
  useEffect(() => {
    if (escena === 'tierra-luna') onFaseRef.current?.(faseInfoDe(angulo));
    if (escena === 'estaciones') onFaseRef.current?.(estacionInfoDe(angulo));
    if (escena === 'cometa') onFaseRef.current?.(cometaInfoDe(angulo));
    if (escena === 'dia-noche') onFaseRef.current?.(diaNocheInfoDe(angulo));
  }, [escena, angulo]);

  useImperativeHandle(ref, () => ({
    recentrar: () => apiRef.current?.recentrar(),
  }));

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      return undefined; // ya se comprobo WebGL antes de montar
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor('#070b1a', 1);
    contenedor.appendChild(renderer.domElement);

    const escena3 = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(FOV, 1, 0.1, 700);

    const desechables = [];
    const registrar = (x) => {
      desechables.push(x);
      return x;
    };

    /* --- fondo de estrellas --- */
    {
      const rng = crearRng(99);
      const n = 420;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const u = rng() * 2 - 1;
        const ang = rng() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        pos[i * 3] = 300 * s * Math.cos(ang);
        pos[i * 3 + 1] = 300 * u;
        pos[i * 3 + 2] = 300 * s * Math.sin(ang);
      }
      const geo = registrar(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = registrar(new THREE.PointsMaterial({
        color: 0xffffff, size: 1.6, sizeAttenuation: false,
        transparent: true, opacity: 0.8, depthWrite: false,
      }));
      escena3.add(new THREE.Points(geo, mat));
    }

    /* --- cuerpos --- */
    const geoEsfera = registrar(new THREE.SphereGeometry(1, 48, 24));
    const mallas = [];
    const porMalla = new Map();

    const crearCuerpo = ({ id, radio, tex, color, semilla, lambert = true, sombras = false, geo = geoEsfera }) => {
      const mapa = registrar(crearTexturaCuerpo({ tex, color, semilla }));
      const mat = registrar(lambert
        ? new THREE.MeshLambertMaterial({ map: mapa })
        : new THREE.MeshBasicMaterial({ map: mapa }));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(radio);
      if (sombras) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
      mallas.push(mesh);
      porMalla.set(mesh, id);
      return mesh;
    };

    const crearGlow = (escala, color = null) => {
      const texGlow = registrar(crearTexturaGlow());
      const matGlow = registrar(new THREE.SpriteMaterial({
        map: texGlow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      if (color) matGlow.color.set(color); // tinta el resplandor (escalera de estrellas)
      const glow = new THREE.Sprite(matGlow);
      glow.scale.setScalar(escala);
      return glow;
    };

    const crearLineaOrbita = (radioOrbita) => {
      const curva = new THREE.EllipseCurve(0, 0, radioOrbita, radioOrbita);
      const geo = registrar(new THREE.BufferGeometry().setFromPoints(curva.getPoints(96)));
      const mat = registrar(new THREE.LineBasicMaterial({ color: 0x5a6a92, transparent: true, opacity: 0.45 }));
      const linea = new THREE.LineLoop(geo, mat);
      linea.rotation.x = -Math.PI / 2;
      return { linea, mat };
    };

    // Papa espacial: esfera con ruido radial suave y determinista (senos de
    // baja frecuencia con fases de la semilla) + achatado leve. Es funcion
    // pura de la posicion, asi que los vertices duplicados de la costura UV
    // se desplazan igual (sin grietas). MeshBasic no usa normales y la
    // escala uniforme tampoco se entera de la forma. La usan la escalera de
    // asteroides y la roca de la escena impacto.
    const crearGeoPapa = (semilla) => {
      const g = registrar(new THREE.SphereGeometry(1, 24, 16));
      const rngP = crearRng(semilla);
      const f = [2 + rngP() * 1.5, 2.5 + rngP() * 1.5, 3 + rngP() * 1.5];
      const fase = [rngP() * 6.28, rngP() * 6.28, rngP() * 6.28];
      const aplasta = 0.78 + rngP() * 0.12;
      const pos = g.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const d = 1
          + 0.12 * Math.sin(f[0] * v.x + fase[0])
          + 0.12 * Math.sin(f[1] * v.y + fase[1])
          + 0.10 * Math.sin(f[2] * v.z + fase[2]);
        pos.setXYZ(i, v.x * d, v.y * d * aplasta, v.z * d);
      }
      pos.needsUpdate = true;
      return g;
    };

    const cuerpos = [];        // escena planetas
    const lineasOrbita = [];
    const lineasOrbitaReal = []; // orbitas a escala real (modo distReal)
    let metricaComparar = null;
    let metricaCompararSinSol = null;
    let capaEtiquetas = null;  // capa DOM de etiquetas flotantes (planetas y estrellas)
    let glowSol = null;
    let tl = null;             // escena tierra-luna
    let escEst = null;         // escena estaciones
    const constels = [];       // escena constelaciones
    const escalables = [];     // { obj, k, pos } — tamano aparente constante en pantalla
    const nombreEstrella = new Map(); // malla -> nombre de la estrella
    let escCometa = null;      // escena cometa
    let escSat = null;         // escena satelite (canon de Newton)
    let escEstrellas = null;   // escena estrellas (escalera de gigantes)
    let escAN = null;          // escena agujero-negro (la Tierra comprimida)
    let escCE = null;          // escena cama-elastica (la sabana del espacio)
    let escImp = null;         // escena impacto (que pasa segun el tamano de la roca)
    let escBB = null;          // escena big-bang (el espacio que se estira)
    let escSol = null;         // escena nace-un-sol (la fabrica de planetas)
    let escDN = null;          // escena dia-noche (la Tierra que gira)
    let escCar = null;         // escena carrera (velocidades reales de los planetas)
    let escTrompos = null;     // escena trompos (ejes de giro reales)
    let etiquetaEstrellaEl = null; // constelaciones: nombre flotante de la estrella tocada
    let nombreFlotante = null;     // constelaciones: { pos, hasta } del nombre flotante

    // Capa DOM para etiquetas flotantes: un <span> por cuerpo, posicionado
    // cada frame proyectando su posicion 3D a pantalla. Vive fuera del canvas
    // para que el texto salga nitido a cualquier zoom (un sprite con textura
    // se veria pixelado). La usan el modo comparar (planetas), la escalera
    // de estrellas y constelaciones (nombres de estrellas y de figuras).
    let crearEtiqueta = null;
    if (escena === 'planetas' || escena === 'constelaciones' || escena === 'carrera' || escena === 'trompos' || ESCALERAS.includes(escena)) {
      capaEtiquetas = document.createElement('div');
      capaEtiquetas.className = 'espacio3d-etiquetas';
      contenedor.appendChild(capaEtiquetas);
      crearEtiqueta = (texto) => {
        const el = document.createElement('span');
        el.className = 'espacio3d-etiqueta';
        el.textContent = texto;
        capaEtiquetas.appendChild(el);
        return el;
      };
    }

    if (escena === 'planetas') {
      escena3.add(new THREE.AmbientLight(0xbfd0ff, 0.55));
      // Luz en el origen: los planetas se iluminan por el lado que mira al Sol.
      escena3.add(new THREE.PointLight(0xfff3d0, 2.4, 0, 0));

      const meshSol = crearCuerpo({ id: 'sol', radio: SOL.radio, tex: SOL.tex, color: SOL.color, semilla: 3, lambert: false });
      escena3.add(meshSol);
      cuerpos.push({ ...SOL, mesh: meshSol, dist: 0, vel: 0, anguloOrbita: 0, etiquetaEl: crearEtiqueta(etiquetaComparar(SOL)) });

      glowSol = crearGlow(SOL.radio * 4.6);
      escena3.add(glowSol);

      const rngAng = crearRng(2026);
      PLANETAS.forEach((p, i) => {
        const mesh = crearCuerpo({ id: p.id, radio: p.radio, tex: p.tex, color: p.color, semilla: 11 + i });
        escena3.add(mesh);
        if (p.anillos) {
          const geoAnillo = registrar(new THREE.RingGeometry(1.45, 2.35, 64));
          const matAnillo = registrar(new THREE.MeshBasicMaterial({
            color: 0xd9c08a, side: THREE.DoubleSide, transparent: true, opacity: 0.75,
          }));
          const anillo = new THREE.Mesh(geoAnillo, matAnillo);
          anillo.rotation.x = -Math.PI / 2 + 0.35; // tumbado y con inclinacion
          mesh.add(anillo); // hereda la escala del planeta (tambien en tamano real)
        }
        // Distancia REAL en unidades de escena: Neptuno conserva el borde
        // exterior didactico (38) y todos los demas se re-escalan con su UA.
        // Mercurio se pega al Sol (0.49) — asi se ve el VACIO de verdad.
        const real = DISTANCIAS_REALES[p.id];
        const distRealU = real.ua * (38 / DISTANCIAS_REALES.neptuno.ua);
        cuerpos.push({
          ...p,
          mesh,
          anguloOrbita: rngAng() * Math.PI * 2,
          etiquetaEl: crearEtiqueta(etiquetaComparar(p)),
          distRealU,
          inclOrb: (real.inclOrb * Math.PI) / 180,
          textoLuz: `${p.emoji} ${p.nombre.replace(/^(el|la) /, '')} · luz: ${real.luz}`,
          modoLuz: false,
        });

        const { linea, mat } = crearLineaOrbita(p.dist);
        escena3.add(linea);
        lineasOrbita.push(mat);

        // Segundo juego de orbitas: a escala real y con su inclinacion real
        // (todas comparten la linea de nodos en X — simplificacion didactica).
        // Casi no se ladean… y ESA es la leccion: el sistema solar es plano.
        const orbReal = crearLineaOrbita(distRealU);
        orbReal.linea.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), (real.inclOrb * Math.PI) / 180);
        orbReal.mat.opacity = 0;
        escena3.add(orbReal.linea);
        lineasOrbitaReal.push(orbReal.mat);
      });

      // Fila del modo comparar: cada cuerpo a su radio REAL, centrada en x=0.
      // Se calcula dos veces (con y sin Sol) para el boton "Ocultar el Sol":
      // sin el, la fila se puede encuadrar mucho mas cerca (109x vs ~11x de
      // rango) y se nota mucho mejor la diferencia entre planetas.
      const calcularFilaComparar = (lista) => {
        const escalaReal = 0.9; // la Tierra didactica mide 0.9, asi que 1 radioReal = 0.9
        const HUECO = 3;
        let x = 0;
        let rPrevio = 0;
        const medias = new Map();
        let maxR = 0;
        lista.forEach((c, i) => {
          const r = Math.max(c.radioReal * escalaReal, 0.12);
          if (i > 0) x += rPrevio + HUECO + r;
          medias.set(c.id, { x, r });
          rPrevio = r;
          maxR = Math.max(maxR, r);
        });
        const izquierda = medias.get(lista[0].id).x - medias.get(lista[0].id).r;
        const derecha = x + rPrevio;
        const centro = (izquierda + derecha) / 2;
        medias.forEach((m) => { m.x -= centro; });
        return { medias, halfW: (derecha - izquierda) / 2, maxR };
      };
      metricaComparar = calcularFilaComparar([SOL, ...PLANETAS]);
      metricaCompararSinSol = calcularFilaComparar(PLANETAS);
    }

    if (escena === 'tierra-luna') {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      escena3.add(new THREE.AmbientLight(0x8898c0, 0.32));

      // Luz paralela desde el Sol; los eclipses son sus sombras reales.
      const luz = new THREE.DirectionalLight(0xfff3d0, 2.6);
      luz.position.set(-30, 0, 0);
      luz.castShadow = true;
      luz.shadow.mapSize.set(2048, 2048);
      luz.shadow.bias = -0.0005;
      Object.assign(luz.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 5, far: 60 });
      luz.shadow.camera.updateProjectionMatrix();
      escena3.add(luz);
      escena3.add(luz.target);

      const tierra = crearCuerpo({ id: 'tierra', radio: TL.radioTierra, tex: 'tierra', color: '#2f6fd0', semilla: 13, sombras: true });
      escena3.add(tierra);

      const luna = crearCuerpo({ id: 'luna', radio: TL.radioLuna, tex: 'craterizado', color: '#c9c4bc', semilla: 21, sombras: true });
      escena3.add(luna);

      // El tamano y la distancia del Sol estan elegidos para que, desde la
      // Tierra, el Sol y la Luna se vean CASI IGUAL de grandes (como en la
      // realidad): por eso el eclipse de sol tapa justo.
      const sol = crearCuerpo({ id: 'sol', radio: TL.radioSol, tex: 'sol', color: SOL.color, semilla: 3, lambert: false });
      sol.position.set(-TL.distSol, 0, 0);
      escena3.add(sol);
      const glow = crearGlow(TL.radioSol * 5);
      glow.position.copy(sol.position);
      escena3.add(glow);

      const { linea } = crearLineaOrbita(TL.orbitaLuna);
      escena3.add(linea);

      // Camara del recuadro: vive DENTRO de la Tierra mirando a la Luna. El
      // plano near deja fuera la propia Tierra, asi que solo se ve el cielo.
      const camFase = new THREE.PerspectiveCamera(9, 1, TL.radioTierra + 0.6, 400);
      camFase.position.set(0, 0, 0);

      tl = { tierra, luna, camFase };
    }

    if (escena === 'estaciones') {
      // Sol en el centro y UNA Tierra orbitando con el eje inclinado 23.5°
      // SIEMPRE hacia el mismo lado del espacio: esa es toda la leccion.
      escena3.add(new THREE.AmbientLight(0xbfd0ff, 0.5));
      escena3.add(new THREE.PointLight(0xfff3d0, 2.4, 0, 0));

      const sol = crearCuerpo({ id: 'sol', radio: EST.radioSol, tex: 'sol', color: SOL.color, semilla: 3, lambert: false });
      escena3.add(sol);
      const glow = crearGlow(EST.radioSol * 4.2);
      escena3.add(glow);

      const { linea } = crearLineaOrbita(EST.orbita);
      escena3.add(linea);

      // grupoTierra solo se TRASLADA por la orbita (nunca se rota): asi el eje
      // inclinado del grupo interior conserva su direccion en el espacio.
      const grupoTierra = new THREE.Group();
      const eje = new THREE.Group();
      eje.rotation.z = EST.inclinacion;
      grupoTierra.add(eje);
      escena3.add(grupoTierra);

      const tierra = crearCuerpo({ id: 'tierra', radio: EST.radioTierra, tex: 'tierra', color: '#2f6fd0', semilla: 13 });
      eje.add(tierra);

      // Varilla del eje + puntita ROJA en el polo norte para seguirlo con la vista.
      const geoVarilla = registrar(new THREE.CylinderGeometry(0.05, 0.05, EST.radioTierra * 3.4, 8));
      const matVarilla = registrar(new THREE.MeshBasicMaterial({ color: 0xd9e2f5, transparent: true, opacity: 0.8 }));
      eje.add(new THREE.Mesh(geoVarilla, matVarilla));
      const geoNorte = registrar(new THREE.SphereGeometry(0.14, 12, 8));
      const matNorte = registrar(new THREE.MeshBasicMaterial({ color: 0xe74c3c }));
      const puntaNorte = new THREE.Mesh(geoNorte, matNorte);
      puntaNorte.position.y = EST.radioTierra * 1.7;
      eje.add(puntaNorte);

      // Recuadro: la Tierra vista desde el lado del Sol — se VE que hemisferio
      // recibe la luz de frente y cual de refilon.
      const camEst = new THREE.PerspectiveCamera(34, 1, 0.1, 200);

      // "Regla" Sol→Tierra: acompana al numero de la distancia que se muestra
      // abajo — y se ve que casi no cambia en todo el ano.
      const posRegla = new Float32Array(6);
      const geoRegla = registrar(new THREE.BufferGeometry());
      geoRegla.setAttribute('position', new THREE.BufferAttribute(posRegla, 3));
      const matRegla = registrar(new THREE.LineBasicMaterial({ color: 0x8090b8, transparent: true, opacity: 0.55 }));
      escena3.add(new THREE.Line(geoRegla, matRegla));

      escEst = { grupoTierra, tierra, camEst, geoRegla, posRegla };
    }

    if (escena === 'constelaciones') {
      // Estrellas a distancias (exageradas) REALES: el dibujo solo existe desde
      // el punto de vista de la Tierra; girar la vista lo deshace.
      escena3.add(new THREE.AmbientLight(0xffffff, 1));

      // La Tierra es un puntito azul en el origen.
      const tierra = crearCuerpo({ id: 'tierra', radio: 0.7, tex: 'tierra', color: '#2f6fd0', semilla: 13, lambert: false });
      escena3.add(tierra);

      const geoEstrella = registrar(new THREE.SphereGeometry(1, 16, 12));
      const texHalo = registrar(crearTexturaHalo());
      // Material invisible pero SI tocable: agranda el blanco del dedo sin
      // engordar la estrella (con visible=false el raycast no lo veria).
      const matToque = registrar(new THREE.MeshBasicMaterial({
        transparent: true, opacity: 0, depthWrite: false,
      }));
      const vDir = new THREE.Vector3();
      const MENOS_Z = new THREE.Vector3(0, 0, -1);

      // Un blanco de toque generoso tambien para la Tierra (es 1 de los 3 datos).
      const toqueTierra = new THREE.Mesh(geoEstrella, matToque);
      escena3.add(toqueTierra);
      mallas.push(toqueTierra);
      porMalla.set(toqueTierra, 'tierra');
      escalables.push({ obj: toqueTierra, k: K_TOQUE, pos: new THREE.Vector3() });

      CONSTELACIONES.forEach((c) => {
        const grupo = new THREE.Group();
        const dirVista = new THREE.Vector3(...c.dir).normalize();
        grupo.quaternion.setFromUnitVectors(MENOS_Z, dirVista);
        escena3.add(grupo);

        const puntos3d = c.estrellas.map((e) => {
          // Direccion local desde la Tierra (figura 2D) por su distancia real.
          vDir.set(e.u * c.escalaAngular, e.v * c.escalaAngular, -1).normalize();
          return vDir.clone().multiplyScalar(e.dist);
        });

        const halos = [];
        c.estrellas.forEach((e, i) => {
          const mat = registrar(new THREE.MeshBasicMaterial({ color: e.color || '#f5f6ff' }));
          const estrella = new THREE.Mesh(geoEstrella, mat);
          estrella.position.copy(puntos3d[i]);
          grupo.add(estrella);
          escalables.push({ obj: estrella, k: K_ESTRELLA * e.brillo, pos: new THREE.Vector3() });

          const matHalo = registrar(new THREE.SpriteMaterial({
            map: texHalo, color: e.color || '#dce6ff',
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          }));
          const halo = new THREE.Sprite(matHalo);
          halo.position.copy(puntos3d[i]);
          grupo.add(halo);
          halos.push(matHalo);
          escalables.push({ obj: halo, k: K_HALO * e.brillo, pos: new THREE.Vector3() });

          const toque = new THREE.Mesh(geoEstrella, matToque);
          toque.position.copy(puntos3d[i]);
          grupo.add(toque);
          mallas.push(toque);
          porMalla.set(toque, c.id); // tocar cualquier estrella abre la constelacion
          nombreEstrella.set(toque, e.nombre);
          escalables.push({ obj: toque, k: K_TOQUE, pos: new THREE.Vector3() });
        });

        const paresLinea = [];
        c.lineas.forEach(([a, b]) => {
          paresLinea.push(puntos3d[a], puntos3d[b]);
        });
        const geoLineas = registrar(new THREE.BufferGeometry().setFromPoints(paresLinea));
        const matLineas = registrar(new THREE.LineBasicMaterial({ color: 0x5a6a92, transparent: true, opacity: 0.75 }));
        grupo.add(new THREE.LineSegments(geoLineas, matLineas));

        // Lineas de VISION Tierra→estrella: aqui se ve el porque. Cada estrella
        // esta a su propia distancia; solo desde la Tierra se alinean en dibujo.
        const paresVision = [];
        puntos3d.forEach((p) => {
          paresVision.push(new THREE.Vector3(0, 0, 0), p);
        });
        const geoVision = registrar(new THREE.BufferGeometry().setFromPoints(paresVision));
        const matVision = registrar(new THREE.LineBasicMaterial({
          color: 0x4d5f8a, transparent: true, opacity: 0.18,
        }));
        grupo.add(new THREE.LineSegments(geoVision, matVision));

        // Centro de la figura en el mundo (el grupo solo rota, no se traslada)
        // para colocarle su nombre dorado cuando encaja.
        const centro = puntos3d
          .reduce((acc, p) => acc.add(p), new THREE.Vector3())
          .divideScalar(puntos3d.length)
          .applyQuaternion(grupo.quaternion);
        const etiquetaNombreEl = crearEtiqueta(`✨ ${c.nombre}`);
        etiquetaNombreEl.classList.add('dorada');

        constels.push({ id: c.id, dirVista, matLineas, matVision, halos, alineada: false, centro, etiquetaNombreEl });
      });

      // Nombre flotante de la estrella tocada, junto a la estrella (ademas de
      // la linea de abajo, que queda lejos del dedo).
      etiquetaEstrellaEl = crearEtiqueta('');
      nombreFlotante = { pos: new THREE.Vector3(), hasta: 0 };

      // Las estrellas nunca se mueven: se guarda su posicion de mundo una vez
      // y el bucle solo mide la distancia a la camara.
      escena3.updateMatrixWorld(true);
      escalables.forEach((s) => s.obj.getWorldPosition(s.pos));
    }

    if (escena === 'cometa') {
      // Orbita ELIPTICA con el Sol en un foco: a veces pegadito, a veces lejisimo.
      // La cola no es "humo que deja atras": es el viento solar empujando el gas,
      // asi que SIEMPRE apunta en contra del Sol.
      escena3.add(new THREE.AmbientLight(0xbfd0ff, 0.5));
      escena3.add(new THREE.PointLight(0xfff3d0, 2.4, 0, 0));

      const sol = crearCuerpo({ id: 'sol', radio: 2.6, tex: 'sol', color: SOL.color, semilla: 3, lambert: false });
      escena3.add(sol);
      escena3.add(crearGlow(11));

      // La Tierra de referencia, en su orbita circular chiquita.
      const tierra = crearCuerpo({ id: 'tierra', radio: 0.8, tex: 'tierra', color: '#2f6fd0', semilla: 13 });
      escena3.add(tierra);
      const orbTierra = crearLineaOrbita(6);
      escena3.add(orbTierra.linea);

      // Elipse del cometa (centro desplazado para que el Sol quede en el foco).
      const semiB = COMETA.a * Math.sqrt(1 - COMETA.e * COMETA.e);
      const foco = COMETA.a * COMETA.e;
      const curva = new THREE.EllipseCurve(-foco, 0, COMETA.a, semiB);
      const geoElipse = registrar(new THREE.BufferGeometry().setFromPoints(curva.getPoints(128)));
      const matElipse = registrar(new THREE.LineBasicMaterial({ color: 0x5a6a92, transparent: true, opacity: 0.5 }));
      const elipse = new THREE.LineLoop(geoElipse, matElipse);
      elipse.rotation.x = -Math.PI / 2;
      escena3.add(elipse);

      const cometa = crearCuerpo({ id: 'cometa', radio: 0.55, tex: 'craterizado', color: '#bcd0d8', semilla: 31 });
      escena3.add(cometa);
      const brilloCometa = crearGlow(1.8);
      escena3.add(brilloCometa);

      // Cola: cono con la punta EN el cometa y la parte ancha lejos del Sol.
      const geoCola = registrar(new THREE.ConeGeometry(0.45, 1, 12, 1, true));
      const matCola = registrar(new THREE.MeshBasicMaterial({
        color: 0x9fd8ff, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide,
      }));
      const cola = new THREE.Mesh(geoCola, matCola);
      escena3.add(cola);

      // Viento solar VISIBLE: chispitas que salen del Sol en todas direcciones.
      // Es el porque de la cola: se ve que algo sopla desde el Sol hacia afuera.
      const N_VIENTO = 70;
      const rngViento = crearRng(77);
      const dirViento = [];
      const radioViento = new Float32Array(N_VIENTO);
      const posViento = new Float32Array(N_VIENTO * 3);
      for (let i = 0; i < N_VIENTO; i++) {
        const ang = rngViento() * Math.PI * 2;
        dirViento.push(new THREE.Vector3(Math.cos(ang), (rngViento() - 0.5) * 0.35, Math.sin(ang)).normalize());
        radioViento[i] = 3.5 + rngViento() * 26;
      }
      const geoViento = registrar(new THREE.BufferGeometry());
      geoViento.setAttribute('position', new THREE.BufferAttribute(posViento, 3));
      const matViento = registrar(new THREE.PointsMaterial({
        color: 0xffd9a0, size: 2, sizeAttenuation: false,
        transparent: true, opacity: 0.4, depthWrite: false,
      }));
      escena3.add(new THREE.Points(geoViento, matViento));

      escCometa = {
        tierra, cometa, brilloCometa, cola, matCola, semiB, foco, angTierra: 0,
        geoViento, posViento, dirViento, radioViento,
      };
    }

    if (escena === 'satelite') {
      // El canon de Newton: desde una montana altisima, lanza cada vez mas
      // fuerte. Orbitar = caer alrededor de la Tierra sin parar de caer.
      escena3.add(new THREE.AmbientLight(0xbfd0ff, 0.75));
      const luz = new THREE.DirectionalLight(0xfff3d0, 1.6);
      luz.position.set(30, 35, 15);
      escena3.add(luz);

      const SAT = { R: 3, r0: 3.9, GM: 40, escape: 60, vMax: 900 };
      const tierra = crearCuerpo({ id: 'tierra', radio: SAT.R, tex: 'tierra', semilla: 13, color: '#2f6fd0' });
      escena3.add(tierra);

      // La montana de lanzamiento (exageradisima a proposito).
      const geoMonte = registrar(new THREE.ConeGeometry(0.34, 1.1, 10));
      const matMonte = registrar(new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
      const monte = new THREE.Mesh(geoMonte, matMonte);
      monte.position.set(0, 0, SAT.R + 0.35);
      monte.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));
      escena3.add(monte);

      const geoSat = registrar(new THREE.SphereGeometry(0.16, 12, 8));
      const matSat = registrar(new THREE.MeshBasicMaterial({ color: 0xf5f6ff }));
      const sat = new THREE.Mesh(geoSat, matSat);
      sat.visible = false;
      escena3.add(sat);

      // Estela: buffer preasignado que se va llenando durante el vuelo.
      const MAX_ESTELA = SAT.vMax;
      const posEstela = new Float32Array(MAX_ESTELA * 3);
      const geoEstela = registrar(new THREE.BufferGeometry());
      geoEstela.setAttribute('position', new THREE.BufferAttribute(posEstela, 3));
      geoEstela.setDrawRange(0, 0);
      const matEstela = registrar(new THREE.LineBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.8 }));
      escena3.add(new THREE.Line(geoEstela, matEstela));

      escSat = {
        SAT,
        tierra,
        sat,
        geoEstela,
        posEstela,
        vCirc: Math.sqrt(SAT.GM / SAT.r0),
        sim: null, // { pos, vel, angPrev, angAcum, orbito, puntos }
      };
    }

    if (ESCALERAS.includes(escena)) {
      // La Escalera (de estrellas, planetas o asteroides): comparacion por
      // PASOS. En cada escalon entra un cuerpo mas grande y TODO se re-escala
      // (el mayor del paso siempre mide ~RADIO_FILA unidades). Esa
      // re-normalizacion es la leccion: la referencia se va encogiendo a la
      // vista, escalon a escalon. Mismo motor, tres datasets.
      escena3.add(new THREE.AmbientLight(0xffffff, 1)); // brillan solos (MeshBasic)

      const esDeEstrellas = escena === 'estrellas';
      const cfg = esDeEstrellas
        ? {
          lista: ESTRELLAS_COMPARAR,
          radioDe: (e) => e.radioSol,
          pasos: PASOS_ESTRELLAS,
          etiquetaDe: etiquetaEstrella,
          conGlow: (e) => e.id !== 'tierra',
          idRef: 'sol',
          textoRefChico: '☀️ el Sol: ¡ya casi no se ve! 😱',
        }
        : escena === 'exoplanetas'
          ? {
            lista: PLANETAS_ESCALERA,
            radioDe: (e) => e.radioTierra,
            pasos: PASOS_EXOPLANETAS,
            etiquetaDe: etiquetaExoplaneta,
            conGlow: (e) => !!e.glow,
            idRef: 'tierra',
            textoRefChico: '🌍 la Tierra: ¡ya casi no se ve! 😱',
          }
          : {
            lista: ASTEROIDES_ESCALERA,
            radioDe: (e) => e.radioKm,
            pasos: PASOS_ASTEROIDES,
            etiquetaDe: etiquetaAsteroide,
            conGlow: () => false,
            idRef: 'chelyabinsk',
            textoRefChico: '💥 Cheliábinsk: ¡ya casi no se ve!',
          };

      const RADIO_FILA = 9;
      const HUECO_FILA = 2.2;

      const ordenadas = [...cfg.lista].sort((a, b) => cfg.radioDe(a) - cfg.radioDe(b));
      const geoToque = registrar(new THREE.SphereGeometry(1, 12, 8));
      const matToqueEst = registrar(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      const matAnilloInterno = registrar(new THREE.LineBasicMaterial({
        color: 0xdfe8ff, transparent: true, opacity: 0.55, depthTest: false,
      }));

      const estrellas = ordenadas.map((e, i) => {
        const mesh = crearCuerpo({
          id: e.id,
          radio: 1,
          tex: e.tex,
          color: e.color,
          semilla: 101 + e.paso + i * 13, // craterizados distintos entre vecinos
          lambert: false,
          geo: e.forma === 'papa' ? crearGeoPapa(211 + i * 7) : undefined,
        });
        mesh.visible = false;
        escena3.add(mesh);
        const glow = cfg.conGlow(e) ? crearGlow(1, e.color) : null;
        if (glow) {
          glow.visible = false;
          escena3.add(glow);
        }
        // Blanco de toque invisible con piso de tamano aparente: los chicos
        // quedan subpixel en los pasos altos y aun asi deben poderse tocar.
        const toque = new THREE.Mesh(geoToque, matToqueEst);
        toque.visible = false;
        escena3.add(toque);
        mallas.push(toque);
        porMalla.set(toque, e.id);

        // Saturno conserva sus anillos (hijos de la malla: heredan la escala
        // del paso). Mismo aro que en la escena planetas.
        if (e.anillos) {
          const geoAnillo = registrar(new THREE.RingGeometry(1.45, 2.35, 64));
          const matAnillo = registrar(new THREE.MeshBasicMaterial({
            color: 0xd9c08a, side: THREE.DoubleSide, transparent: true, opacity: 0.75,
          }));
          const anillo = new THREE.Mesh(geoAnillo, matAnillo);
          anillo.rotation.x = -Math.PI / 2 + 0.35;
          mesh.add(anillo);
        }

        // Orbitas de los planetas DENTRO de las supergigantes, a escala real
        // (esfera unidad: radio local = UA de la orbita / UA del radio de la
        // estrella). En el plano de pantalla y sin depthTest, como el
        // infografico clasico: se ven ENCIMA del disco de la estrella.
        if (esDeEstrellas && e.radioSol >= 500) {
          const radioUA = e.radioSol * UA_POR_RADIO_SOL;
          ORBITAS_UA.forEach((o) => {
            if (o.ua >= radioUA * 0.97) return; // solo las que quedan adentro
            const geoAro = registrar(new THREE.BufferGeometry().setFromPoints(
              new THREE.EllipseCurve(0, 0, o.ua / radioUA, o.ua / radioUA).getPoints(64)
            ));
            const aro = new THREE.LineLoop(geoAro, matAnilloInterno);
            aro.renderOrder = 5;
            mesh.add(aro); // hereda posicion y escala
          });
        }

        return { ...e, mesh, glow, toque, etiquetaEl: crearEtiqueta(cfg.etiquetaDe(e)) };
      });

      // Metrica de la fila por paso: radios normalizados AL MAYOR DEL PASO.
      const metricasPaso = [];
      for (let p = 1; p <= cfg.pasos; p++) {
        const visibles = ordenadas.filter((e) => e.paso <= p);
        const mayor = Math.max(...visibles.map((e) => cfg.radioDe(e)));
        let x = 0;
        let rPrev = 0;
        const medidas = new Map();
        visibles.forEach((e, i) => {
          const r = Math.max((cfg.radioDe(e) / mayor) * RADIO_FILA, 0.04);
          if (i > 0) x += rPrev + HUECO_FILA + r;
          medidas.set(e.id, { x, r });
          rPrev = r;
        });
        const izquierda = medidas.get(visibles[0].id).x - medidas.get(visibles[0].id).r;
        const derecha = x + rPrev;
        const centro = (izquierda + derecha) / 2;
        medidas.forEach((m) => { m.x -= centro; });
        metricasPaso.push({ medidas, halfW: (derecha - izquierda) / 2 });
      }

      escEstrellas = {
        estrellas, metricasPaso, RADIO_FILA, pasoPrevio: 0, refChica: false,
        pasos: cfg.pasos, idRef: cfg.idRef, textoRefChico: cfg.textoRefChico, etiquetaDe: cfg.etiquetaDe,
      };
    }

    if (escena === 'agujero-negro') {
      // La Tierra comprimible a peso constante + una luna TESTIGO cuya orbita
      // no cambia nunca (la gravedad depende del peso, no de ser negro: los
      // agujeros negros NO aspiran) + rayos de luz para probar el escape.
      escena3.add(new THREE.AmbientLight(0xbfd0ff, 0.75));
      const luz = new THREE.DirectionalLight(0xfff3d0, 1.6);
      luz.position.set(30, 35, 15);
      escena3.add(luz);

      const tierra = crearCuerpo({ id: 'tierra', radio: 1, tex: 'tierra', color: '#2f6fd0', semilla: 13 });
      escena3.add(tierra);

      // El horizonte: esfera negra de radio FIJO (solo depende del peso; por
      // mas que aprietas, no crece ni encoge) + aro que lo marca.
      const geoNegro = registrar(new THREE.SphereGeometry(1, 32, 16));
      const matNegro = registrar(new THREE.MeshBasicMaterial({ color: 0x000000 }));
      const horizonte = new THREE.Mesh(geoNegro, matNegro);
      horizonte.scale.setScalar(AN.radioHorizonte);
      horizonte.visible = false;
      escena3.add(horizonte);
      mallas.push(horizonte);
      porMalla.set(horizonte, 'tierra'); // colapsada sigue siendo "la tierra"
      const aroH = crearLineaOrbita(AN.radioHorizonte * 1.6);
      aroH.mat.color.set(0x9db8ff);
      aroH.mat.opacity = 0.8;
      aroH.linea.visible = false;
      escena3.add(aroH.linea);

      const luna = crearCuerpo({ id: 'luna', radio: AN.radioLuna, tex: 'craterizado', color: '#c9c4bc', semilla: 21 });
      escena3.add(luna);
      const orbLuna = crearLineaOrbita(AN.orbitaLuna);
      escena3.add(orbLuna.linea);

      // El rayo de luz: proyectil brillante + estela (patron del satelite).
      const geoRayo = registrar(new THREE.SphereGeometry(0.12, 10, 6));
      const matRayo = registrar(new THREE.MeshBasicMaterial({ color: 0xfff7c0 }));
      const rayo = new THREE.Mesh(geoRayo, matRayo);
      rayo.visible = false;
      escena3.add(rayo);
      const brilloRayo = crearGlow(0.9, '#fff2a0');
      brilloRayo.visible = false;
      escena3.add(brilloRayo);
      const MAX_ESTELA = 700;
      const posEstela = new Float32Array(MAX_ESTELA * 3);
      const geoEstela = registrar(new THREE.BufferGeometry());
      geoEstela.setAttribute('position', new THREE.BufferAttribute(posEstela, 3));
      geoEstela.setDrawRange(0, 0);
      const matEstela = registrar(new THREE.LineBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.85 }));
      escena3.add(new THREE.Line(geoEstela, matEstela));

      escAN = { tierra, horizonte, aroH, luna, rayo, brilloRayo, geoEstela, posEstela, sim: null, angLuna: 0 };
    }

    if (escena === 'cama-elastica') {
      // La sabana del espacio: una rejilla que se hunde con el peso de la bola
      // central. La canica no la "jala" nadie — sigue el camino que le deja el
      // hueco. Es la imagen de Einstein para la gravedad de Newton.
      escena3.add(new THREE.AmbientLight(0xc8d4ff, 0.85));
      const luzCE = new THREE.DirectionalLight(0xfff3d0, 1.4);
      luzCE.position.set(18, 30, 20);
      escena3.add(luzCE);

      // Rejilla como segmentos sueltos: se deforma escribiendo la Y de cada
      // vertice (solo al mover el deslizador, no cada frame).
      const N = CE.divisiones;
      const paso = CE.lado / N;
      const mitad = CE.lado / 2;
      const verts = [];
      for (let j = 0; j <= N; j++) {
        for (let i = 0; i < N; i++) {
          const a = -mitad + i * paso;
          const b = -mitad + (i + 1) * paso;
          const c = -mitad + j * paso;
          verts.push(a, 0, c, b, 0, c); // linea a lo largo de X
          verts.push(c, 0, a, c, 0, b); // linea a lo largo de Z
        }
      }
      const posRejilla = new Float32Array(verts);
      const geoRejilla = registrar(new THREE.BufferGeometry());
      geoRejilla.setAttribute('position', new THREE.BufferAttribute(posRejilla, 3));
      const matRejilla = registrar(new THREE.LineBasicMaterial({
        color: 0x6f8ae0, transparent: true, opacity: 0.55,
      }));
      escena3.add(new THREE.LineSegments(geoRejilla, matRejilla));

      const bola = crearCuerpo({ id: 'bola', radio: CE.bolaMin, tex: 'craterizado', color: '#8e7cc3', semilla: 33 });
      escena3.add(bola);

      const canica = crearCuerpo({ id: 'canica', radio: CE.radioCanica, tex: 'liso', color: '#ffd479', lambert: false });
      canica.visible = false;
      escena3.add(canica);

      // Alcanza para la orbita mas lenta (~16 s a 60 fps).
      const MAX_ESTELA = 1200;
      const posEstela = new Float32Array(MAX_ESTELA * 3);
      const geoEstela = registrar(new THREE.BufferGeometry());
      geoEstela.setAttribute('position', new THREE.BufferAttribute(posEstela, 3));
      geoEstela.setDrawRange(0, 0);
      const matEstela = registrar(new THREE.LineBasicMaterial({ color: 0xffd479, transparent: true, opacity: 0.85 }));
      escena3.add(new THREE.Line(geoEstela, matEstela));

      // Hunde la rejilla al peso dado (solo cuando el deslizador cambia).
      const deformar = (prof) => {
        for (let k = 0; k < posRejilla.length; k += 3) {
          const x = posRejilla[k];
          const z = posRejilla[k + 2];
          posRejilla[k + 1] = alturaCE(Math.hypot(x, z), prof);
        }
        geoRejilla.attributes.position.needsUpdate = true;
      };

      escCE = { bola, canica, geoEstela, posEstela, deformar, pesoPrevio: null, sim: null };
    }

    if (escena === 'impacto') {
      // ¿Que pasa segun el TAMANO? La Tierra con su atmosfera VISIBLE (el
      // escudo) y una roca que cae sobre el polo norte (el polo no se mueve
      // con la rotacion en Y, asi el crater se queda donde cayo). Los
      // umbrales de banda viven en impactoInfoDe (espacioDatos).
      escena3.add(new THREE.AmbientLight(0xbfd0ff, 0.7));
      const luzImp = new THREE.DirectionalLight(0xfff3d0, 1.5);
      luzImp.position.set(30, 25, 18);
      escena3.add(luzImp);

      const IMP = { radioTierra: 6, radioAtm: 7.6, alturaSalida: 20 };
      const tierra = crearCuerpo({ id: 'tierra', radio: IMP.radioTierra, tex: 'tierra', color: '#2f6fd0', semilla: 17 });
      escena3.add(tierra);

      // La cascara del escudo: sutil pero visible.
      const geoAtm = registrar(new THREE.SphereGeometry(IMP.radioAtm, 48, 24));
      const matAtm = registrar(new THREE.MeshBasicMaterial({
        color: 0x8fc4ff, transparent: true, opacity: 0.12, depthWrite: false,
      }));
      escena3.add(new THREE.Mesh(geoAtm, matAtm));

      const roca = crearCuerpo({
        id: 'roca', radio: 1, tex: 'craterizado', color: '#8a7a68', semilla: 41,
        lambert: false, geo: crearGeoPapa(97),
      });
      roca.visible = false;
      escena3.add(roca);
      const brilloRoca = crearGlow(1, '#ffb057'); // se enciende al entrar al aire
      brilloRoca.visible = false;
      escena3.add(brilloRoca);

      const destello = crearGlow(1, '#fff2a0'); // el BUM (su material se anima)
      destello.visible = false;
      escena3.add(destello);

      // Punto de impacto: una direccion fija, bien visible desde la camara.
      // Todo lo que queda pegado al suelo (mira, parche, crater, olas) vive
      // dentro de `grupoImp`, que copia la rotacion de la Tierra — asi gira
      // CON el planeta en vez de quedarse flotando en un punto del espacio
      // (antes el crater era un aro plano clavado en el polo: parecia sombrero).
      const DIR_IMP = new THREE.Vector3(0.42, 0.62, 0.66).normalize();
      const grupoImp = new THREE.Group();
      escena3.add(grupoImp);
      const marca = new THREE.Group();
      marca.position.copy(DIR_IMP).multiplyScalar(IMP.radioTierra);
      marca.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIR_IMP);
      grupoImp.add(marca);

      // Todo lo que se pinta sobre el suelo son CASQUETES: trozos de esfera del
      // mismo radio que el planeta, no discos planos. Un disco plano grande se
      // despega en las orillas y parece calcomania flotando (el "sombrero" que
      // tenia el crater antes).
      const crearCasquete = ({ angulo, alto, color, opacidad = 1, banda = 0 }) => {
        const geo = registrar(banda
          ? new THREE.SphereGeometry(IMP.radioTierra + alto, 44, 10, 0, Math.PI * 2, angulo, banda)
          : new THREE.SphereGeometry(IMP.radioTierra + alto, 44, 22, 0, Math.PI * 2, 0, angulo));
        const mat = registrar(new THREE.MeshLambertMaterial({
          color, transparent: opacidad < 1, opacity: opacidad, depthWrite: false,
        }));
        const m = new THREE.Mesh(geo, mat);
        m.quaternion.copy(marca.quaternion); // el +Y del casquete mira al blanco
        grupoImp.add(m);
        return m;
      };

      // El blanco: isla verde (modo TIERRA) o mar abierto (modo MAR). Se pintan
      // encima de la textura para que no haya duda de donde va a pegar — la
      // textura del planeta tiene continentes al azar y antes el punto podia
      // caer justo sobre uno estando en "modo mar".
      const isla = crearCasquete({ angulo: 0.26, alto: 0.03, color: 0x5f8f45 });
      const islaOrilla = crearCasquete({ angulo: 0.26, alto: 0.02, color: 0x7fa85e, opacidad: 0.55, banda: 0.1 });
      const mar = crearCasquete({ angulo: 0.34, alto: 0.02, color: 0x2c66cc });
      const marOrilla = crearCasquete({ angulo: 0.34, alto: 0.015, color: 0x3f7ad8, opacidad: 0.5, banda: 0.12 });

      const geoMira = registrar(new THREE.RingGeometry(0.5, 0.62, 32));
      const matMira = registrar(new THREE.MeshBasicMaterial({
        color: 0xffe08a, side: THREE.DoubleSide, transparent: true, opacity: 0.85,
      }));
      const mira = new THREE.Mesh(geoMira, matMira);
      mira.rotation.x = -Math.PI / 2;
      mira.position.y = 0.06;
      marca.add(mira);

      // El crater: hoyo oscuro + borde levantado, tambien de casquete. Dos
      // tamanos (no se puede escalar un casquete sin despegarlo de la esfera).
      const craterChico = [
        crearCasquete({ angulo: 0.14, alto: 0.05, color: 0x2b1d12 }),
        crearCasquete({ angulo: 0.14, alto: 0.07, color: 0x8a6440, banda: 0.05 }),
      ];
      const craterGrande = [
        crearCasquete({ angulo: 0.32, alto: 0.05, color: 0x2b1d12 }),
        crearCasquete({ angulo: 0.32, alto: 0.07, color: 0x8a6440, banda: 0.08 }),
      ];
      [...craterChico, ...craterGrande].forEach((m) => { m.visible = false; });

      // Nube de polvo (o de espuma, si cae en el mar): particulas que salen
      // disparadas del golpe, se abren y se apagan.
      const N_POLVO = 170;
      const posPolvo = new Float32Array(N_POLVO * 3);
      const velPolvo = new Float32Array(N_POLVO * 3);
      const geoPolvo = registrar(new THREE.BufferGeometry());
      geoPolvo.setAttribute('position', new THREE.BufferAttribute(posPolvo, 3));
      const matPolvo = registrar(new THREE.PointsMaterial({
        size: 0.85, map: registrar(crearTexturaGlow()), color: 0xbcaa92,
        transparent: true, depthWrite: false, opacity: 0,
      }));
      const polvo = new THREE.Points(geoPolvo, matPolvo);
      polvo.visible = false;
      escena3.add(polvo);

      // Olas / onda de choque que ABRAZAN el planeta: circulos dibujados sobre
      // la esfera que se abren desde el punto de impacto. Un tsunami de verdad
      // se ve asi — recorriendo la superficie, no como un aro plano.
      const N_OLA = 72;
      const olaU = new THREE.Vector3(0, 1, 0).cross(DIR_IMP).normalize();
      const olaV = new THREE.Vector3().crossVectors(DIR_IMP, olaU).normalize();
      const olas = [0, 1, 2].map(() => {
        const arr = new Float32Array(N_OLA * 3);
        const g = registrar(new THREE.BufferGeometry());
        g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        const m = registrar(new THREE.LineBasicMaterial({
          color: 0x9fe8ff, transparent: true, opacity: 0, depthWrite: false,
        }));
        const linea = new THREE.LineLoop(g, m);
        linea.visible = false;
        grupoImp.add(linea);
        return { arr, geo: g, mat: m, linea };
      });

      const MAX_ESTELA = 500;
      const posEstela = new Float32Array(MAX_ESTELA * 3);
      const geoEstela = registrar(new THREE.BufferGeometry());
      geoEstela.setAttribute('position', new THREE.BufferAttribute(posEstela, 3));
      geoEstela.setDrawRange(0, 0);
      const matEstela = registrar(new THREE.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.85 }));
      escena3.add(new THREE.Line(geoEstela, matEstela));

      escImp = {
        IMP, tierra, roca, brilloRoca, destello, matDestello: destello.material,
        DIR_IMP, grupoImp, marca, isla, islaOrilla, mar, marOrilla,
        mira, matMira, craterChico, craterGrande,
        polvo, matPolvo, geoPolvo, posPolvo, velPolvo,
        olas, olaU, olaV, N_OLA,
        geoEstela, posEstela, matEstela, luz: luzImp, sim: null, rng: crearRng(83),
      };
    }

    if (escena === 'big-bang') {
      // El espacio que se estira. Truco central: las galaxias-particula viven
      // en coordenadas COMOVILES fijas dentro de un grupo; cada frame el grupo
      // se escala con a(t) y se re-centra en la galaxia ancla → desde el ancla
      // TODAS se alejan, y las lejanas mas rapido (ley de Hubble exacta,
      // gratis). La niebla de distancia (fog) hace el resto de la honestidad:
      // en el modo real NUNCA ves una orilla (solo ves hasta donde alcanza la
      // vista, como en el universo); en el modo mito la bola es compacta y su
      // orilla y su centro quedan a la vista — esa es la prueba del detective.
      escena3.add(new THREE.AmbientLight(0xffffff, 1));
      escena3.fog = new THREE.Fog(0x070b1a, 24, 55);

      const N = 4000;
      const RADIO_COM = 60;   // radio comovil del universo "real" (la orilla queda tras la niebla)
      const RADIO_MITO = 16;  // bola del mito: compacta, con orilla visible
      const rngU = crearRng(777);
      const puntoEsfera = (radio) => {
        let x = 0;
        let y = 0;
        let z = 0;
        do {
          x = rngU() * 2 - 1;
          y = rngU() * 2 - 1;
          z = rngU() * 2 - 1;
        } while (x * x + y * y + z * z > 1 || x * x + y * y + z * z < 1e-4);
        return [x * radio, y * radio, z * radio];
      };

      // Semillas de cumulo para la telarana.
      const semillas = [];
      for (let s = 0; s < 25; s++) semillas.push(puntoEsfera(RADIO_COM * 0.8));

      const comUnif = new Float32Array(N * 3);
      const comTela = new Float32Array(N * 3);
      const comMito = new Float32Array(N * 3);
      const idxCerca = [];   // candidatos de mudanza (modo real): vecindario poblado
      const idxOrilla = []; // candidatos de mudanza (modo mito): la ORILLA de la bola
      let idxCentro = 0;
      let mejorCentro = Infinity;
      for (let i = 0; i < N; i++) {
        const [x, y, z] = puntoEsfera(RADIO_COM);
        comUnif[i * 3] = x;
        comUnif[i * 3 + 1] = y;
        comUnif[i * 3 + 2] = z;
        const d = Math.sqrt(x * x + y * y + z * z);
        if (d < RADIO_COM * 0.45) idxCerca.push(i);

        // Telarana: cada particula se corre hacia su semilla mas cercana.
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let mejor = Infinity;
        for (const [ax, ay, az] of semillas) {
          const dd = (x - ax) ** 2 + (y - ay) ** 2 + (z - az) ** 2;
          if (dd < mejor) {
            mejor = dd;
            sx = ax;
            sy = ay;
            sz = az;
          }
        }
        comTela[i * 3] = x + (sx - x) * 0.78 + (rngU() - 0.5) * 3;
        comTela[i * 3 + 1] = y + (sy - y) * 0.78 + (rngU() - 0.5) * 3;
        comTela[i * 3 + 2] = z + (sz - z) * 0.78 + (rngU() - 0.5) * 3;

        // El mito: bola uniforme compacta.
        const [mx, my, mz] = puntoEsfera(1);
        const norma = Math.sqrt(mx * mx + my * my + mz * mz) || 1;
        const v = Math.cbrt(rngU());
        comMito[i * 3] = (mx / norma) * v * RADIO_MITO;
        comMito[i * 3 + 1] = (my / norma) * v * RADIO_MITO;
        comMito[i * 3 + 2] = (mz / norma) * v * RADIO_MITO;
        if (v > 0.93) idxOrilla.push(i);
        if (v < mejorCentro) {
          mejorCentro = v;
          idxCentro = i;
        }
      }

      const posU = new Float32Array(N * 3);
      posU.set(comUnif);
      const geoU = registrar(new THREE.BufferGeometry());
      geoU.setAttribute('position', new THREE.BufferAttribute(posU, 3));
      const matU = registrar(new THREE.PointsMaterial({
        color: 0xdfe8ff, size: 0.55, map: registrar(crearTexturaGlow()),
        transparent: true, depthWrite: false, opacity: 0.9,
      }));
      const univ = new THREE.Group();
      univ.add(new THREE.Points(geoU, matU));
      escena3.add(univ);

      // Galaxias espirales que se "encienden" en los cumulos (solo modo real).
      const texGal = registrar(crearTexturaGalaxia(5));
      const texGal2 = registrar(crearTexturaGalaxia(11));
      const sprites = semillas.map(([x, y, z], s) => {
        const mat = registrar(new THREE.SpriteMaterial({
          map: s % 2 ? texGal : texGal2, transparent: true, depthWrite: false, opacity: 0,
        }));
        const sp = new THREE.Sprite(mat);
        sp.position.set(x, y, z);
        sp.scale.setScalar(3.5 + (s % 5));
        univ.add(sp);
        return sp;
      });

      // "Tu estas aqui": marca dorada clavada en el origen (el ancla).
      const marca = crearGlow(2.4, '#ffd700');
      escena3.add(marca);

      // La niebla caliente del principio: envolvente naranja + resplandor.
      const geoNiebla = registrar(new THREE.SphereGeometry(30, 32, 16));
      const matNiebla = registrar(new THREE.MeshBasicMaterial({
        color: 0xff9a40, transparent: true, opacity: 0, side: THREE.BackSide,
        depthWrite: false, fog: false,
      }));
      const niebla = new THREE.Mesh(geoNiebla, matNiebla);
      escena3.add(niebla);
      const glowNiebla = crearGlow(34, '#ffb057');
      glowNiebla.material.opacity = 0;
      escena3.add(glowNiebla);

      const anclaInicial = new THREE.Vector3().fromArray(comUnif, idxCerca[0] * 3);
      escBB = {
        univ, geoU, posU, matU, comUnif, comTela, comMito, sprites,
        idxCerca, idxOrilla, idxCentro,
        anclaActual: anclaInicial.clone(), anclaMeta: anclaInicial.clone(),
        marca, matNiebla, nieblaMesh: niebla, glowNiebla,
        mudanza: false, tPrevio: null, mitoPrevio: false, rng: crearRng(31),
      };
    }

    if (escena === 'nace-un-sol') {
      // La fabrica de planetas: nube de polvo (cenizas de estrellas viejas)
      // que colapsa a un DISCO girando (rotacion kepleriana), el centro se
      // enciende y las semillas de planeta barren carriles dejando surcos —
      // como los del disco real de HL Tauri (ALMA).
      escena3.add(new THREE.AmbientLight(0xffffff, 0.5));
      const luzSol = new THREE.PointLight(0xfff3d0, 0, 0, 0);
      escena3.add(luzSol);

      const N = 3000;
      const rngD = crearRng(555);
      const nube = new Float32Array(N * 3);
      const rDisco = new Float32Array(N);
      const hDisco = new Float32Array(N);
      const angD = new Float32Array(N);
      const colorBase = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        let x = 0;
        let y = 0;
        let z = 0;
        do {
          x = rngD() * 2 - 1;
          y = rngD() * 2 - 1;
          z = rngD() * 2 - 1;
        } while (x * x + y * y + z * z > 1 || x * x + y * y + z * z < 1e-4);
        const n = Math.sqrt(x * x + y * y + z * z);
        const rN = 13 * Math.pow(rngD(), 0.6);
        nube[i * 3] = (x / n) * rN;
        nube[i * 3 + 1] = (y / n) * rN;
        nube[i * 3 + 2] = (z / n) * rN;
        rDisco[i] = 2.2 + 11.8 * Math.sqrt(rngD());
        hDisco[i] = (rngD() - 0.5) * 0.5;
        angD[i] = rngD() * Math.PI * 2;
        const brillo = 0.72 + rngD() * 0.38;
        colorBase[i * 3] = brillo;
        colorBase[i * 3 + 1] = brillo * 0.86;
        colorBase[i * 3 + 2] = brillo * 0.64;
      }
      const posD = new Float32Array(N * 3);
      posD.set(nube);
      const colD = new Float32Array(N * 3);
      colD.set(colorBase);
      const geoD = registrar(new THREE.BufferGeometry());
      geoD.setAttribute('position', new THREE.BufferAttribute(posD, 3));
      geoD.setAttribute('color', new THREE.BufferAttribute(colD, 3));
      const matD = registrar(new THREE.PointsMaterial({
        size: 0.34, map: registrar(crearTexturaGlow()), vertexColors: true,
        transparent: true, depthWrite: false, opacity: 0.95,
      }));
      escena3.add(new THREE.Points(geoD, matD));

      const sol = crearCuerpo({ id: 'sol', radio: 1, tex: 'sol', color: '#ffcf3f', semilla: 3, lambert: false });
      sol.scale.setScalar(0.25);
      escena3.add(sol);
      const glowSol = crearGlow(1, '#ffdf80');
      glowSol.material.opacity = 0.15;
      escena3.add(glowSol);

      // Semillas de planeta: barren su carril y crecen con lo que juntan.
      const anillos = [6, 9, 12];
      const defPlan = [
        { radioFin: 0.38, color: '#b8a89a', tex: 'craterizado' },
        { radioFin: 0.55, color: '#d8a56a', tex: 'nubes' },
        { radioFin: 0.45, color: '#3f66d4', tex: 'liso' },
      ];
      const planetas = defPlan.map((p, j) => {
        const mesh = crearCuerpo({ id: 'planeta', radio: 1, tex: p.tex, color: p.color, semilla: 61 + j });
        mesh.visible = false;
        escena3.add(mesh);
        return { mesh, radioFin: p.radioFin, R: anillos[j], ang: (j * Math.PI * 2) / 3 };
      });

      escSol = {
        geoD, posD, colD, nube, rDisco, hDisco, angD, colorBase,
        sol, glowSol, luzSol, planetas, anillos, tPrevio: null,
      };
    }

    if (escena === 'dia-noche') {
      // La Tierra que gira: el Sol esta FIJO y el deslizador es la hora en tu
      // casa. Los pines (Mexico y Japon) viven en un GRUPO sin escalar que
      // rota — asi sus tamanos no heredan el x3 de la malla de la Tierra.
      // Calibracion: el pin de Mexico esta en el eje +X local, y a las 12 el
      // grupo rota para dejarlo de frente al Sol (que esta en +X del mundo).
      escena3.add(new THREE.AmbientLight(0x8fa8ff, 0.35));
      const luzDN = new THREE.PointLight(0xfff3d0, 2.6, 0, 0);
      const DN = { radioTierra: 3, distSol: 40, orbitaLuna: 9 };
      luzDN.position.set(DN.distSol, 0, 0);
      escena3.add(luzDN);

      const meshSol = crearCuerpo({ id: 'sol', radio: 2.6, tex: 'sol', color: '#ffcf3f', semilla: 3, lambert: false });
      meshSol.position.set(DN.distSol, 0, 0);
      escena3.add(meshSol);
      const glowSol = crearGlow(11, '#ffcf3f');
      glowSol.position.copy(meshSol.position);
      escena3.add(glowSol);

      const grupoTierra = new THREE.Group();
      escena3.add(grupoTierra);
      const tierra = crearCuerpo({ id: 'tierra', radio: DN.radioTierra, tex: 'tierra', color: '#2f6fd0', semilla: 13 });
      grupoTierra.add(tierra);

      // Pines: cono apuntando hacia AFUERA + blanco de toque invisible.
      const crearPin = (id, latGrados, lonGrados, color) => {
        const lat = (latGrados * Math.PI) / 180;
        const lon = (lonGrados * Math.PI) / 180;
        const dir = new THREE.Vector3(
          Math.cos(lat) * Math.cos(lon),
          Math.sin(lat),
          -Math.cos(lat) * Math.sin(lon)
        );
        const geoPin = registrar(new THREE.ConeGeometry(0.14, 0.42, 10));
        const matPin = registrar(new THREE.MeshBasicMaterial({ color }));
        const pin = new THREE.Mesh(geoPin, matPin);
        pin.position.copy(dir).multiplyScalar(DN.radioTierra + 0.18);
        pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        grupoTierra.add(pin);
        const toque = new THREE.Mesh(
          registrar(new THREE.SphereGeometry(0.5, 10, 6)),
          registrar(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
        );
        toque.position.copy(pin.position);
        grupoTierra.add(toque);
        mallas.push(toque);
        porMalla.set(toque, id);
        return { dir };
      };
      // Mexico lon local 0 (la calibracion de las 12 la hace la rotacion del
      // grupo); Japon a ~239 grados al este (casi del otro lado del mundo).
      const casa = crearPin('casa', 19, 0, 0xffd700);
      crearPin('japon', 36, 238.8, 0xd7dbe8);

      const luna = crearCuerpo({ id: 'luna', radio: 0.55, tex: 'craterizado', color: '#c9c4bc', semilla: 21 });
      escena3.add(luna);

      // Camara del recuadro: parada en tu casa, mirando al horizonte.
      const camDN = new THREE.PerspectiveCamera(60, 1, 0.05, 400);

      escDN = {
        DN,
        grupoTierra,
        tierra,
        luna,
        casaLocal: casa.dir.clone().multiplyScalar(DN.radioTierra),
        camDN,
        vSol: new THREE.Vector3(),
        colCielo: new THREE.Color(),
        colDia: new THREE.Color('#6fb0ff'),
        colTarde: new THREE.Color('#ff9a56'),
        colNoche: new THREE.Color('#0a0f26'),
      };
    }

    if (escena === 'carrera') {
      // La carrera de los planetas: la escena planetas pero con las
      // velocidades REALES (CARRERA_ANIOS) y todos alineados en la salida.
      // "Mas lejos = mas lento" emerge solo. El boton re-alinea y arranca.
      escena3.add(new THREE.AmbientLight(0xbfd0ff, 0.55));
      escena3.add(new THREE.PointLight(0xfff3d0, 2.4, 0, 0));

      const meshSol = crearCuerpo({ id: 'sol', radio: SOL.radio, tex: SOL.tex, color: SOL.color, semilla: 3, lambert: false });
      escena3.add(meshSol);
      escena3.add(crearGlow(SOL.radio * 4.6));

      const cuerposCar = PLANETAS.map((p, i) => {
        const mesh = crearCuerpo({ id: p.id, radio: p.radio, tex: p.tex, color: p.color, semilla: 11 + i });
        mesh.position.set(p.dist, 0, 0);
        escena3.add(mesh);
        if (p.anillos) {
          const geoAnillo = registrar(new THREE.RingGeometry(1.45, 2.35, 64));
          const matAnillo = registrar(new THREE.MeshBasicMaterial({
            color: 0xd9c08a, side: THREE.DoubleSide, transparent: true, opacity: 0.75,
          }));
          const anillo = new THREE.Mesh(geoAnillo, matAnillo);
          anillo.rotation.x = -Math.PI / 2 + 0.35;
          mesh.add(anillo);
        }
        escena3.add(crearLineaOrbita(p.dist).linea);
        const etiquetaEl = crearEtiqueta(`${p.emoji} ${p.nombre.replace(/^(el|la) /, '')} · en la salida`);
        return { ...p, mesh, etiquetaEl, vueltasPrev: null };
      });

      // Marcador de la linea de salida (una linea radial tenue en +X).
      const geoMeta = registrar(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(SOL.radio + 1, 0, 0),
        new THREE.Vector3(PLANETAS[PLANETAS.length - 1].dist + 2, 0, 0),
      ]));
      const matMeta = registrar(new THREE.LineBasicMaterial({ color: 0xf1c40f, transparent: true, opacity: 0.5 }));
      escena3.add(new THREE.Line(geoMeta, matMeta));

      // Cronometro flotante, fijo arriba al centro del lienzo.
      const etiquetaAnios = crearEtiqueta('⏱️ 0 años');
      etiquetaAnios.style.left = '50%';
      etiquetaAnios.style.top = '10px';
      etiquetaAnios.style.transform = 'translateX(-50%)';
      etiquetaAnios.style.opacity = 1;
      etiquetaAnios.style.fontSize = '0.9rem';

      escCar = { cuerpos: cuerposCar, anios: 0, corriendo: false, etiquetaAnios, deciPrev: 0 };
    }

    if (escena === 'trompos') {
      // Los 8 planetas en fila, cada uno girando como el trompo que es: con
      // su inclinacion de eje y su velocidad de rotacion REALES (EJES).
      // Venus (177°) queda de cabeza y por eso su giro se ve al reves; Urano
      // (98°) rueda acostado como llanta. El eje rojo lo hace legible.
      escena3.add(new THREE.AmbientLight(0xffffff, 0.9));
      const luzT = new THREE.DirectionalLight(0xfff3d0, 1.5);
      luzT.position.set(6, 10, 22);
      escena3.add(luzT);

      const HUECO_T = 1.4;
      const matEje = registrar(new THREE.LineBasicMaterial({ color: 0xe74c3c, transparent: true, opacity: 0.9 }));
      let xT = 0;
      let rPrevT = 0;
      const trompos = PLANETAS.map((p, i) => {
        if (i > 0) xT += rPrevT + HUECO_T + p.radio;
        rPrevT = p.radio;
        const eje = EJES[p.id];
        const grupo = new THREE.Group();
        grupo.position.x = xT;
        grupo.rotation.z = -(eje.incl * Math.PI) / 180; // el eje se ladea a la vista
        escena3.add(grupo);

        const mesh = crearCuerpo({ id: p.id, radio: p.radio, tex: p.tex, color: p.color, semilla: 11 + i });
        grupo.add(mesh);
        if (p.anillos) {
          const geoAnillo = registrar(new THREE.RingGeometry(1.45, 2.35, 64));
          const matAnillo = registrar(new THREE.MeshBasicMaterial({
            color: 0xd9c08a, side: THREE.DoubleSide, transparent: true, opacity: 0.75,
          }));
          const anillo = new THREE.Mesh(geoAnillo, matAnillo);
          anillo.rotation.x = -Math.PI / 2;
          mesh.add(anillo); // los anillos se ladean con el planeta: asi es de verdad
        }

        const largo = p.radio * 1.9;
        const geoEje = registrar(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, -largo, 0), new THREE.Vector3(0, largo, 0),
        ]));
        grupo.add(new THREE.Line(geoEje, matEje));

        const nombre = p.nombre.replace(/^(el|la) /, '');
        return { ...p, grupo, mesh, giroRel: eje.giroRel, etiquetaEl: crearEtiqueta(`${p.emoji} ${nombre} · día: ${eje.dia}`) };
      });

      // Centrar la fila y dibujar el piso: sin una horizontal de referencia
      // no se "lee" que tan chueco esta cada eje.
      const centroT = xT / 2;
      trompos.forEach((t) => { t.grupo.position.x -= centroT; });
      const geoPiso = registrar(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-centroT - 3, -3.4, 0), new THREE.Vector3(centroT + 3, -3.4, 0),
      ]));
      const matPiso = registrar(new THREE.LineBasicMaterial({ color: 0x5a6a92, transparent: true, opacity: 0.5 }));
      escena3.add(new THREE.Line(geoPiso, matPiso));

      escTrompos = { trompos, halfW: centroT + 3 };
    }

    /* --- camara orbital del usuario --- */
    const CAMARAS = {
      planetas: { yaw: 0.6, pitch: 0.9, dist: 60 },
      'tierra-luna': { yaw: 0.35, pitch: 0.45, dist: 24 },
      estaciones: { yaw: 0.5, pitch: 0.85, dist: 34 },
      constelaciones: { yaw: 0.15, pitch: -0.35, dist: 60 },
      cometa: { yaw: 0.5, pitch: 0.95, dist: 52 },
      satelite: { yaw: 0, pitch: 1.3, dist: 24 },
      estrellas: { yaw: 0, pitch: 0.18, dist: 26 },
      exoplanetas: { yaw: 0, pitch: 0.18, dist: 26 },
      asteroides: { yaw: 0, pitch: 0.18, dist: 26 },
      impacto: { yaw: 0.3, pitch: 0.5, dist: 30 },
      'dia-noche': { yaw: 0.55, pitch: 0.5, dist: 22 },
      carrera: { yaw: 0.2, pitch: 1.15, dist: 60 },
      trompos: { yaw: 0, pitch: 0.12, dist: 34 },
      'big-bang': { yaw: 0.2, pitch: 0.35, dist: 40 },
      'nace-un-sol': { yaw: 0.4, pitch: 0.7, dist: 26 },
      'agujero-negro': { yaw: 0, pitch: 1.1, dist: 26 },
      // Vista de 3/4: de frente no se veria el hundimiento de la sabana.
      'cama-elastica': { yaw: 0.3, pitch: 0.42, dist: 30 },
    };
    const YAW0 = CAMARAS[escena].yaw;
    const PITCH0 = CAMARAS[escena].pitch;
    const DIST_BASE = CAMARAS[escena].dist;
    // En constelaciones la camara puede bajar del plano: las figuras estan en
    // cualquier direccion y hay que poder alinearse con ellas.
    const PITCH_MIN = escena === 'constelaciones' ? -1.45 : 0.08;
    let yaw = YAW0;
    let pitch = PITCH0;
    let zoomUsuario = 1;
    let aspecto = 1;
    let distSuave = DIST_BASE;
    const objetivoCam = new THREE.Vector3();
    const vTmp = new THREE.Vector3();
    const vTmp2 = new THREE.Vector3();
    const vProy = new THREE.Vector3(); // reutilizado para proyectar cuerpo → pantalla (etiquetas)
    const V_ARRIBA = new THREE.Vector3(0, 1, 0);
    const EJE_X = new THREE.Vector3(1, 0, 0); // linea de nodos del modo distancias reales
    const COL_ORO = new THREE.Color(0xf1c40f);
    const COL_LINEA_CONST = new THREE.Color(0x5a6a92);
    const colTmp = new THREE.Color();
    let cajonPrevio = null; // ultimo "caliente/frio" avisado a React

    const recentrar = () => {
      yaw = YAW0;
      pitch = PITCH0;
      zoomUsuario = 1;
    };

    // Boton de lanzar, por escena: satelite dispara con la velocidad del
    // deslizador; agujero-negro dispara un RAYO DE LUZ (velocidad fija cLuz)
    // desde la superficie actual de la Tierra comprimida — el lanzador se
    // hunde con la compresion, y por eso el escape se endurece solo.
    const lanzar = () => {
      if (escSat) {
        const factor = 0.4 + (estadoRef.current.angulo / 100) * 1.2; // 0.4x a 1.6x de la velocidad circular
        escSat.sim = {
          pos: new THREE.Vector3(0, 0, escSat.SAT.r0),
          vel: new THREE.Vector3(escSat.vCirc * factor, 0, 0),
          angPrev: null,
          angAcum: 0,
          orbito: false,
          activo: true,
          puntos: 0,
        };
        escSat.geoEstela.setDrawRange(0, 0);
        escSat.sat.visible = true;
        setResultado('volando');
        return;
      }
      if (escAN) {
        escAN.sim = {
          pos: new THREE.Vector3(0, 0, radioAN(estadoRef.current.angulo)),
          vel: new THREE.Vector3(AN.cLuz, 0, 0),
          activo: true,
          reportado: false,
          apogeo: false,
          puntos: 0,
        };
        escAN.geoEstela.setDrawRange(0, 0);
        escAN.rayo.visible = true;
        escAN.brilloRayo.visible = true;
        setResultado('volando');
        return;
      }
      if (escCE) {
        // Siempre el mismo empujon: lo unico que cambia entre tiro y tiro es
        // cuanto pesa la bola, o sea cuanto se hunde el espacio.
        escCE.sim = {
          pos: new THREE.Vector3(0, 0, CE.r0),
          vel: new THREE.Vector3(CE.v0, 0, 0),
          velIni: new THREE.Vector3(CE.v0, 0, 0).normalize(),
          angPrev: null,
          angAcum: 0,
          orbito: false,
          activo: true,
          puntos: 0,
        };
        escCE.geoEstela.setDrawRange(0, 0);
        escCE.canica.visible = true;
        setResultado('volando');
      }
      if (escImp) {
        const info = impactoInfoDe(estadoRef.current.angulo);
        // Tamano visual: logaritmico (1 m → 0.15, 15 km → 1.2). A escala real
        // ni la de 15 km se veria junto a la Tierra didactica.
        const escala = 0.15 + (Math.log10(info.metros) / Math.log10(15000)) * 1.05;
        escImp.sim = {
          banda: info.banda,
          y: escImp.IMP.alturaSalida,
          vel: 5,
          escala,
          fase: 'cayendo',
          t: 0,
          puntos: 0,
          reportado: false,
        };
        escImp.geoEstela.setDrawRange(0, 0);
        escImp.craterChico.forEach((m) => { m.visible = false; });
        escImp.craterGrande.forEach((m) => { m.visible = false; });
        escImp.destello.visible = false;
        escImp.polvo.visible = false;
        escImp.matPolvo.opacity = 0;
        escImp.olas.forEach((o) => { o.linea.visible = false; });
        escImp.roca.visible = true;
        escImp.roca.scale.setScalar(escala);
        setResultado('cayendo');
      }
      if (escBB) {
        // "Mudate a otra galaxia": el bucle elige el destino segun el modo
        // (real: cualquier vecindario poblado; mito: la ORILLA de la bola).
        escBB.mudanza = true;
      }
      if (escCar) {
        // "¡Arranquen!": re-alinea a todos en la salida y echa a andar el
        // tiempo. Volver a apretar reinicia la carrera.
        escCar.anios = 0;
        escCar.deciPrev = -1;
        escCar.corriendo = true;
        escCar.cuerpos.forEach((c) => { c.vueltasPrev = null; });
        setResultado('corriendo');
      }
    };

    apiRef.current = { recentrar, lanzar };

    /* --- punteros: toque selecciona, arrastre gira, rueda acerca --- */
    const rayo = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const lienzo = renderer.domElement;
    let gesto = null;

    // Devuelve la MALLA tocada (no el id): quien llama decide si quiere el id
    // del cuerpo o el nombre de la estrella.
    const cuerpoEn = (e) => {
      const r = lienzo.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      rayo.setFromCamera(ndc, camara);
      // three.js NO excluye objetos con visible=false del raycast por si solo
      // (Mesh.raycast()/Raycaster no chequean .visible) — hay que filtrarlos
      // nosotros. Importa para el Sol oculto en modo comparar.
      const impactos = rayo.intersectObjects(mallas.filter((m) => m.visible), false);
      return impactos.length ? impactos[0].object : null;
    };

    const alBajar = (e) => {
      gesto = { x: e.clientX, y: e.clientY, movido: 0, capturado: false };
    };

    const alMover = (e) => {
      if (!gesto) {
        if (estadoRef.current.seleccionable) {
          lienzo.style.cursor = cuerpoEn(e) ? 'pointer' : 'grab';
        }
        return;
      }
      const dx = e.clientX - gesto.x;
      const dy = e.clientY - gesto.y;
      gesto.movido = Math.max(gesto.movido, Math.abs(dx) + Math.abs(dy));
      if (gesto.movido <= UMBRAL_TOQUE) return;
      if (!gesto.capturado) {
        gesto.capturado = true;
        try { lienzo.setPointerCapture?.(e.pointerId); } catch { /* da igual */ }
      }
      yaw -= (e.clientX - (gesto.ultimoX ?? gesto.x)) * 0.008;
      pitch += (e.clientY - (gesto.ultimoY ?? gesto.y)) * 0.008;
      pitch = Math.min(1.45, Math.max(PITCH_MIN, pitch));
      gesto.ultimoX = e.clientX;
      gesto.ultimoY = e.clientY;
    };

    const alSoltar = (e) => {
      const g = gesto;
      gesto = null;
      if (!g) return;
      if (g.capturado) {
        try { lienzo.releasePointerCapture?.(e.pointerId); } catch { /* ya liberado */ }
        return;
      }
      if (!estadoRef.current.seleccionable) return;
      const malla = cuerpoEn(e);
      if (!malla) return;
      if (nombreEstrella.has(malla)) {
        setEstrellaTocada(nombreEstrella.get(malla));
        // Nombre flotante junto a la estrella durante un par de segundos.
        if (nombreFlotante) {
          malla.getWorldPosition(nombreFlotante.pos);
          nombreFlotante.hasta = performance.now() + 2600;
          etiquetaEstrellaEl.textContent = `⭐ ${nombreEstrella.get(malla)}`;
        }
      }
      const id = porMalla.get(malla);
      if (id) onSeleccionRef.current?.(id);
    };

    const alRueda = (e) => {
      e.preventDefault();
      zoomUsuario = Math.min(3, Math.max(0.3, zoomUsuario * (1 + e.deltaY * 0.001)));
    };

    lienzo.addEventListener('pointerdown', alBajar);
    lienzo.addEventListener('pointermove', alMover);
    lienzo.addEventListener('pointerup', alSoltar);
    lienzo.addEventListener('pointercancel', alSoltar);
    lienzo.addEventListener('wheel', alRueda, { passive: false });

    /* --- tamano --- */
    const redimensionar = () => {
      const w = contenedor.clientWidth;
      const h = contenedor.clientHeight;
      if (!w || !h) return;
      aspecto = w / h;
      camara.aspect = aspecto;
      camara.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    redimensionar();
    const observador = new ResizeObserver(redimensionar);
    observador.observe(contenedor);
    // Expuesto para forzar una remedicion desde fuera (ver el toggle de
    // pantalla completa: la transicion de la Fullscreen API puede tardar un
    // frame en asentarse y el ResizeObserver a veces lee el tamaño de en medio).
    apiRef.current.redimensionar = redimensionar;

    /* --- bucle --- */
    // Los planetas siempre se mueven, asi que se renderiza cada frame mientras
    // la pestana esta visible (con la pestana oculta el navegador congela el
    // requestAnimationFrame solo, sin gastar bateria).
    let raf;
    let previo = performance.now();
    let mezcla = 0; // 0 = orbitas, 1 = fila a tamano real
    let mezclaReal = 0; // 0 = orbitas didacticas, 1 = distancias reales
    const tanFov = Math.tan((FOV * Math.PI) / 180 / 2);

    const animar = () => {
      raf = requestAnimationFrame(animar);
      const ahora = performance.now();
      const dt = Math.min((ahora - previo) / 1000, 0.05);
      previo = ahora;
      const est = estadoRef.current;

      let objetivoX = 0;
      let objetivoY = 0;
      let objetivoZ = 0;
      let distDeseada = DIST_BASE;

      if (escena === 'planetas') {
        const haciaComparar = est.comparar ? 1 : 0;
        mezcla += (haciaComparar - mezcla) * Math.min(1, dt * 4);
        if (Math.abs(haciaComparar - mezcla) < 0.002) mezcla = haciaComparar;
        // Los dos modos son excluyentes (lo garantiza el wrapper); aun asi,
        // comparar manda: si alguien pide los dos, gana la fila.
        const haciaReal = est.distReal && !est.comparar ? 1 : 0;
        mezclaReal += (haciaReal - mezclaReal) * Math.min(1, dt * 3);
        if (Math.abs(haciaReal - mezclaReal) < 0.002) mezclaReal = haciaReal;

        // Sin el Sol, la fila se calcula con SOLO los planetas: se puede
        // encuadrar mucho mas cerca y las diferencias entre ellos se notan.
        const metricaActiva = est.ocultarSol ? metricaCompararSinSol : metricaComparar;
        const wCanvas = lienzo.clientWidth;
        const hCanvas = lienzo.clientHeight;

        cuerpos.forEach((c) => {
          if (c.vel) c.anguloOrbita += c.vel * VEL_ORBITAL * dt;
          const solOculto = c.id === 'sol' && est.ocultarSol;
          const m = solOculto ? null : metricaActiva.medias.get(c.id);
          // En distancias reales la orbita se estira a su radio de verdad y
          // se ladea su inclinacion real; el Sol se queda en el centro pero
          // se encoge (si no, se traga la orbita de Mercurio).
          const distVisual = c.distRealU ? c.dist + (c.distRealU - c.dist) * mezclaReal : c.dist;
          const ox = Math.cos(c.anguloOrbita) * distVisual;
          const oz = -Math.sin(c.anguloOrbita) * distVisual;
          const radioVisual = c.id === 'sol'
            ? c.radio + (0.5 - c.radio) * mezclaReal
            : c.radio + (0.35 - c.radio) * mezclaReal;
          if (m) {
            c.mesh.position.set(ox + (m.x - ox) * mezcla, 0, oz * (1 - mezcla));
            c.mesh.scale.setScalar(radioVisual + (m.r - radioVisual) * mezcla);
          } else {
            // Sol oculto: sigue orbitando fuera de cuadro, no importa porque
            // queda invisible (y fuera del raycast, ver cuerpoEn).
            c.mesh.position.set(ox, 0, oz);
          }
          if (c.inclOrb && mezclaReal > 0.001) {
            c.mesh.position.applyAxisAngle(EJE_X, c.inclOrb * mezclaReal);
          }
          c.mesh.rotation.y += dt * 0.4;
          c.mesh.visible = !solOculto;

          // La etiqueta sirve a los dos modos: "×Tierra" en tamano real y el
          // tiempo que tarda la LUZ en distancias reales (cajon: el
          // textContent solo se toca al cruzar el umbral).
          if (c.textoLuz) {
            const quiereLuz = mezclaReal > 0.5;
            if (quiereLuz !== c.modoLuz) {
              c.modoLuz = quiereLuz;
              c.etiquetaEl.textContent = quiereLuz ? c.textoLuz : etiquetaComparar(c);
            }
          }
          const visibilidad = Math.max(mezcla, mezclaReal);
          if (!solOculto && visibilidad > 0.02 && wCanvas && hCanvas) {
            vProy.copy(c.mesh.position);
            vProy.y += c.mesh.scale.x * 1.3 + mezclaReal * 0.9; // un poco arriba del cuerpo
            vProy.project(camara);
            if (vProy.z < 1) {
              const px = (vProy.x * 0.5 + 0.5) * wCanvas;
              const py = (1 - (vProy.y * 0.5 + 0.5)) * hCanvas;
              c.etiquetaEl.style.transform = `translate(${px}px, ${py}px) translate(-50%, -100%)`;
              c.etiquetaEl.style.opacity = visibilidad;
            } else {
              c.etiquetaEl.style.opacity = 0;
            }
          } else {
            c.etiquetaEl.style.opacity = 0;
          }
        });
        lineasOrbita.forEach((mat) => { mat.opacity = 0.45 * (1 - mezcla) * (1 - mezclaReal); });
        lineasOrbitaReal.forEach((mat) => { mat.opacity = 0.45 * mezclaReal * (1 - mezcla); });

        const sol = cuerpos[0];
        glowSol.visible = !est.ocultarSol;
        glowSol.position.copy(sol.mesh.position);
        glowSol.scale.setScalar(sol.mesh.scale.x * 4.6);

        if (mezclaReal > 0.05 && mezcla < 0.05) {
          // Vista cenital y lejana: solo desde arriba se lee el vacio.
          if (!gesto?.capturado) {
            pitch += (1.15 - pitch) * Math.min(1, dt * 3);
          }
          distDeseada = DIST_BASE + (96 - DIST_BASE) * mezclaReal;
        } else if (mezcla > 0.05) {
          // En la fila conviene una vista casi de frente; se suaviza hacia ella
          // mientras el usuario no este arrastrando.
          if (!gesto?.capturado) {
            pitch += (0.18 - pitch) * Math.min(1, dt * 3);
            yaw += (0 - yaw) * Math.min(1, dt * 3);
          }
          const ajuste = Math.max(
            metricaActiva.halfW / (tanFov * aspecto),
            (metricaActiva.maxR * 1.2) / tanFov
          ) * 1.15;
          distDeseada = DIST_BASE + (ajuste - DIST_BASE) * mezcla;
        } else if (est.enfocado) {
          const c = cuerpos.find((x) => x.id === est.enfocado);
          if (c) {
            objetivoX = c.mesh.position.x;
            objetivoY = c.mesh.position.y;
            objetivoZ = c.mesh.position.z;
            distDeseada = c.mesh.scale.x * 5 + 1.5;
          }
        }
      } else if (escena === 'tierra-luna') {
        const a = (est.angulo * Math.PI) / 180;
        tl.luna.position.set(-Math.cos(a) * TL.orbitaLuna, 0, Math.sin(a) * TL.orbitaLuna);
        tl.luna.rotation.y = -a; // siempre da la misma cara a la Tierra
        tl.tierra.rotation.y += dt * 0.25;
      } else if (escena === 'estaciones') {
        const a = (est.angulo * Math.PI) / 180;
        // El grupo solo se TRASLADA: el eje inclinado nunca cambia de direccion.
        escEst.grupoTierra.position.set(Math.cos(a) * EST.orbita, 0, -Math.sin(a) * EST.orbita);
        escEst.tierra.rotation.y += dt * 1.1;
        escEst.posRegla[3] = escEst.grupoTierra.position.x;
        escEst.posRegla[5] = escEst.grupoTierra.position.z;
        escEst.geoRegla.attributes.position.needsUpdate = true;
        if (est.enfocado === 'tierra') {
          objetivoX = escEst.grupoTierra.position.x;
          objetivoZ = escEst.grupoTierra.position.z;
          distDeseada = 7;
        }
      } else if (escena === 'constelaciones') {
        // Tamano aparente constante: la estrella se ve (y se toca) igual de
        // grande sin importar a que distancia de la camara haya quedado.
        escalables.forEach((s) => {
          s.obj.scale.setScalar(s.k * camara.position.distanceTo(s.pos));
        });

        // ¿Desde donde mira el usuario? Si su direccion de vista coincide con la
        // direccion Tierra→constelacion, la figura "encaja". Y mientras tanto,
        // caliente/frio: las lineas se van dorando conforme uno se acerca.
        vTmp.copy(objetivoCam).sub(camara.position).normalize();
        const wConst = lienzo.clientWidth;
        const hConst = lienzo.clientHeight;
        let mejor = 0;
        constels.forEach((k) => {
          const ang = vTmp.angleTo(k.dirVista);
          if (!k.alineada && ang < 0.14) {
            k.alineada = true;
            onVistaRef.current?.(k.id);
          } else if (k.alineada && ang > 0.22) {
            k.alineada = false;
          }
          // 1 = encajada, 0 = a mas de ~50 grados de distancia.
          const calor = Math.max(0, Math.min(1, 1 - ang / 0.9));
          mejor = Math.max(mejor, calor);
          colTmp.copy(COL_LINEA_CONST).lerp(COL_ORO, calor);
          k.matLineas.color.lerp(colTmp, Math.min(1, dt * 6));
          // Foco por atencion: la figura que NO se esta mirando casi
          // desaparece — con 5 constelaciones, sin esto la pantalla se enreda.
          k.matLineas.opacity += ((0.06 + 0.94 * calor) - k.matLineas.opacity) * Math.min(1, dt * 6);
          k.matVision.opacity += ((0.02 + 0.48 * calor) - k.matVision.opacity) * Math.min(1, dt * 6);
          k.halos.forEach((h) => {
            h.opacity += ((0.15 + 0.85 * calor) - h.opacity) * Math.min(1, dt * 6);
          });
          // Nombre dorado flotando sobre la figura mientras esta encajada.
          if (k.alineada && wConst && hConst) {
            vProy.copy(k.centro).project(camara);
            if (vProy.z < 1) {
              const px = (vProy.x * 0.5 + 0.5) * wConst;
              const py = (1 - (vProy.y * 0.5 + 0.5)) * hConst;
              k.etiquetaNombreEl.style.transform = `translate(${px}px, ${py}px) translate(-50%, -100%)`;
              k.etiquetaNombreEl.style.opacity = 1;
            } else {
              k.etiquetaNombreEl.style.opacity = 0;
            }
          } else {
            k.etiquetaNombreEl.style.opacity = 0;
          }
        });
        // Nombre flotante de la estrella tocada (caduca solo).
        if (nombreFlotante && wConst && hConst) {
          if (performance.now() < nombreFlotante.hasta) {
            vProy.copy(nombreFlotante.pos).project(camara);
            if (vProy.z < 1) {
              const px = (vProy.x * 0.5 + 0.5) * wConst;
              const py = (1 - (vProy.y * 0.5 + 0.5)) * hConst;
              etiquetaEstrellaEl.style.transform = `translate(${px}px, ${py}px) translate(-50%, -140%)`;
              etiquetaEstrellaEl.style.opacity = 1;
            } else {
              etiquetaEstrellaEl.style.opacity = 0;
            }
          } else {
            etiquetaEstrellaEl.style.opacity = 0;
          }
        }
        // Solo se avisa a React cuando cambia el "cajon", no cada frame.
        const cajon = mejor > 0.84 ? 'encaja' : mejor > 0.6 ? 'caliente' : mejor > 0.35 ? 'tibio' : 'frio';
        if (cajon !== cajonPrevio) {
          cajonPrevio = cajon;
          setPistaConst(cajon);
        }
      } else if (escena === 'cometa') {
        const t = (est.angulo * Math.PI) / 180;
        const x2 = COMETA.a * Math.cos(t) - escCometa.foco;
        const y2 = escCometa.semiB * Math.sin(t);
        escCometa.cometa.position.set(x2, 0, -y2);
        escCometa.cometa.rotation.y += dt * 0.6;
        escCometa.brilloCometa.position.copy(escCometa.cometa.position);

        escCometa.angTierra += dt * 0.35;
        escCometa.tierra.position.set(Math.cos(escCometa.angTierra) * 6, 0, -Math.sin(escCometa.angTierra) * 6);
        escCometa.tierra.rotation.y += dt * 0.6;

        // Cola anti-sol: la punta EN el cometa, lo ancho lejos del Sol. Cerca
        // del Sol crece y brilla; lejos casi desaparece.
        const d = escCometa.cometa.position.length();
        vTmp.copy(escCometa.cometa.position).normalize();
        const L = Math.min(13, Math.max(1.2, 85 / d));
        escCometa.cola.scale.set(0.35 + L * 0.12, L, 0.35 + L * 0.12);
        escCometa.cola.position.copy(escCometa.cometa.position).addScaledVector(vTmp, L / 2);
        vTmp2.copy(vTmp).negate();
        escCometa.cola.quaternion.setFromUnitVectors(V_ARRIBA, vTmp2);
        escCometa.matCola.opacity = Math.min(0.7, Math.max(0.12, 4.5 / d));

        // Las chispitas del viento solar viajan hacia afuera y se reciclan.
        for (let i = 0; i < escCometa.dirViento.length; i++) {
          escCometa.radioViento[i] += dt * 6;
          if (escCometa.radioViento[i] > 30) escCometa.radioViento[i] = 3.5;
          const dv = escCometa.dirViento[i];
          const rv = escCometa.radioViento[i];
          escCometa.posViento[i * 3] = dv.x * rv;
          escCometa.posViento[i * 3 + 1] = dv.y * rv;
          escCometa.posViento[i * 3 + 2] = dv.z * rv;
        }
        escCometa.geoViento.attributes.position.needsUpdate = true;

        if (est.enfocado === 'cometa') {
          objetivoX = escCometa.cometa.position.x;
          objetivoZ = escCometa.cometa.position.z;
          distDeseada = 8;
        } else if (est.enfocado === 'tierra') {
          objetivoX = escCometa.tierra.position.x;
          objetivoZ = escCometa.tierra.position.z;
          distDeseada = 5;
        }
      } else if (escena === 'satelite') {
        escSat.tierra.rotation.y += dt * 0.15;
        const sim = escSat.sim;
        if (sim && sim.activo) {
          const { SAT } = escSat;
          // Gravedad de Newton integrada en pasitos chicos (estable y barata).
          const n = Math.min(8, Math.max(2, Math.ceil(dt / 0.006)));
          const h = dt / n;
          for (let i = 0; i < n && sim.activo; i++) {
            const r = sim.pos.length();
            vTmp.copy(sim.pos).multiplyScalar(-SAT.GM / (r * r * r));
            sim.vel.addScaledVector(vTmp, h);
            sim.pos.addScaledVector(sim.vel, h);

            const ang = Math.atan2(sim.pos.x, sim.pos.z);
            if (sim.angPrev !== null) {
              let delta = ang - sim.angPrev;
              if (delta > Math.PI) delta -= Math.PI * 2;
              if (delta < -Math.PI) delta += Math.PI * 2;
              sim.angAcum += Math.abs(delta);
            }
            sim.angPrev = ang;

            const rNuevo = sim.pos.length();
            // Escapa si su energia orbital es positiva (el criterio exacto de
            // Newton): asi no hay que esperar a que se aleje kilometros, y las
            // elipses muy alargadas no se confunden con escapes.
            const escapo = rNuevo > 12 &&
              sim.vel.lengthSq() / 2 - SAT.GM / rNuevo >= 0;
            if (rNuevo < SAT.R) {
              sim.activo = false;
              sim.pos.setLength(SAT.R + 0.05);
              setResultado('choca');
              onFaseRef.current?.({ resultado: 'choca' });
            } else if (escapo || rNuevo > SAT.escape) {
              sim.activo = false;
              setResultado('escapa');
              onFaseRef.current?.({ resultado: 'escapa' });
            } else if (!sim.orbito && sim.angAcum >= Math.PI * 2) {
              // ¡Vuelta completa sin caer ni escapar! Sigue volando: eso ES orbitar.
              sim.orbito = true;
              setResultado('orbita');
              onFaseRef.current?.({ resultado: 'orbita' });
            }
          }
          if (sim.puntos < escSat.posEstela.length / 3) {
            const k = sim.puntos * 3;
            escSat.posEstela[k] = sim.pos.x;
            escSat.posEstela[k + 1] = sim.pos.y;
            escSat.posEstela[k + 2] = sim.pos.z;
            sim.puntos++;
            escSat.geoEstela.setDrawRange(0, sim.puntos);
            escSat.geoEstela.attributes.position.needsUpdate = true;
          }
        }
        if (sim) escSat.sat.position.copy(sim.pos);
      } else if (ESCALERAS.includes(escena)) {
        const paso = Math.min(escEstrellas.pasos, Math.max(1, Math.round(est.angulo)));
        const met = escEstrellas.metricasPaso[paso - 1];
        if (paso !== escEstrellas.pasoPrevio) {
          // Estrella recien revelada: nace chiquita en su lugar y crece.
          escEstrellas.estrellas.forEach((e) => {
            if (e.paso === paso && !e.mesh.visible) {
              e.mesh.position.set(met.medidas.get(e.id).x, 0, 0);
              e.mesh.scale.setScalar(0.001);
            }
          });
          escEstrellas.pasoPrevio = paso;
        }

        const wCanvas = lienzo.clientWidth;
        const hCanvas = lienzo.clientHeight;
        const k = Math.min(1, dt * 4);

        escEstrellas.estrellas.forEach((e) => {
          const visible = e.paso <= paso;
          e.mesh.visible = visible;
          if (e.glow) e.glow.visible = visible;
          e.toque.visible = visible; // tambien lo saca del raycast (cuerpoEn filtra por .visible)
          if (!visible) {
            e.etiquetaEl.style.opacity = 0;
            return;
          }
          const m = met.medidas.get(e.id);
          e.mesh.position.x += (m.x - e.mesh.position.x) * k;
          e.mesh.position.z += (0 - e.mesh.position.z) * k;
          e.mesh.scale.setScalar(e.mesh.scale.x + (m.r - e.mesh.scale.x) * k);
          e.mesh.rotation.y += dt * 0.12;
          if (e.glow) {
            e.glow.position.copy(e.mesh.position);
            e.glow.scale.setScalar(e.mesh.scale.x * 3.4);
          }

          const dCam = camara.position.distanceTo(e.mesh.position);
          e.toque.position.copy(e.mesh.position);
          e.toque.scale.setScalar(Math.max(e.mesh.scale.x, K_TOQUE * dCam));

          // Radio en pantalla (px): decide si la etiqueta cabe sin amontonarse
          // y si la referencia (el Sol / la Tierra) "ya casi no se ve".
          const pxRadio = hCanvas ? (e.mesh.scale.x / (dCam * tanFov)) * (hCanvas / 2) : 0;
          if (e.id === escEstrellas.idRef) {
            const chico = pxRadio < 3;
            if (chico !== escEstrellas.refChica) {
              escEstrellas.refChica = chico;
              e.etiquetaEl.textContent = chico ? escEstrellas.textoRefChico : escEstrellas.etiquetaDe(e);
            }
          }
          const conEtiqueta = e.id === escEstrellas.idRef || pxRadio > 1.2;
          if (conEtiqueta && wCanvas && hCanvas) {
            vProy.copy(e.mesh.position);
            vProy.y += Math.max(e.mesh.scale.x * 1.25, 0.8);
            vProy.project(camara);
            if (vProy.z < 1) {
              const px = (vProy.x * 0.5 + 0.5) * wCanvas;
              const py = (1 - (vProy.y * 0.5 + 0.5)) * hCanvas;
              e.etiquetaEl.style.transform = `translate(${px}px, ${py}px) translate(-50%, -100%)`;
              e.etiquetaEl.style.opacity = 1;
            } else {
              e.etiquetaEl.style.opacity = 0;
            }
          } else {
            e.etiquetaEl.style.opacity = 0;
          }
        });

        // Encuadre de la fila del paso, vista casi de frente (como comparar).
        if (!gesto?.capturado) {
          pitch += (0.18 - pitch) * Math.min(1, dt * 3);
          yaw += (0 - yaw) * Math.min(1, dt * 3);
        }
        distDeseada = Math.max(
          (met.halfW + 3) / (tanFov * aspecto),
          (escEstrellas.RADIO_FILA * 1.35) / tanFov
        ) * 1.1;
      } else if (escena === 'agujero-negro') {
        const R = radioAN(est.angulo);
        const esAgujero = R < AN.radioHorizonte;
        escAN.tierra.visible = !esAgujero;
        escAN.horizonte.visible = esAgujero;
        escAN.aroH.linea.visible = esAgujero;
        if (!esAgujero) {
          escAN.tierra.scale.setScalar(R);
          escAN.tierra.rotation.y += dt * 0.3;
        }

        // La luna testigo: su orbita depende SOLO del peso (GM), que nunca
        // cambia — por eso no se inmuta cuando la Tierra colapsa.
        escAN.angLuna += dt * Math.sqrt(AN.GM / Math.pow(AN.orbitaLuna, 3));
        escAN.luna.position.set(
          Math.cos(escAN.angLuna) * AN.orbitaLuna,
          0,
          -Math.sin(escAN.angLuna) * AN.orbitaLuna
        );
        escAN.luna.rotation.y += dt * 0.3;

        const sim = escAN.sim;
        if (sim && sim.activo) {
          const n = Math.min(8, Math.max(2, Math.ceil(dt / 0.006)));
          const h = dt / n;
          for (let i = 0; i < n && sim.activo; i++) {
            const r = sim.pos.length();
            vTmp.copy(sim.pos).multiplyScalar(-AN.GM / (r * r * r));
            sim.vel.addScaledVector(vTmp, h);
            sim.pos.addScaledVector(sim.vel, h);
            const rN = sim.pos.length();
            const E = sim.vel.lengthSq() / 2 - AN.GM / rN;
            if (E >= 0) {
              // Con energia positiva el rayo se va: se anuncia pronto y se le
              // deja volar un poco mas antes de esconderlo.
              if (!sim.reportado && rN > 10) {
                sim.reportado = true;
                setResultado('escapa');
                onFaseRef.current?.({ resultado: 'escapa' });
              }
              if (rN > 25) {
                sim.activo = false;
                escAN.rayo.visible = false;
                escAN.brilloRayo.visible = false;
              }
            } else {
              // Ligado: el rayo sube, se curva y regresa (la elipse de la
              // "estrella oscura" de Michell); al re-entrar, el negro se lo traga.
              if (rN < r) sim.apogeo = true;
              if (sim.apogeo && rN < Math.max(radioAN(est.angulo), AN.radioHorizonte) * 1.15) {
                sim.activo = false;
                escAN.rayo.visible = false;
                escAN.brilloRayo.visible = false;
                setResultado('atrapado');
                onFaseRef.current?.({ resultado: 'atrapado' });
              }
            }
          }
          if (sim.activo && sim.puntos < escAN.posEstela.length / 3) {
            const k = sim.puntos * 3;
            escAN.posEstela[k] = sim.pos.x;
            escAN.posEstela[k + 1] = sim.pos.y;
            escAN.posEstela[k + 2] = sim.pos.z;
            sim.puntos++;
            escAN.geoEstela.setDrawRange(0, sim.puntos);
            escAN.geoEstela.attributes.position.needsUpdate = true;
          }
          escAN.rayo.position.copy(sim.pos);
          escAN.brilloRayo.position.copy(sim.pos);
        }
      } else if (escena === 'cama-elastica') {
        const prof = profCE(est.angulo);
        const rBola = radioBolaCE(est.angulo);
        // La sabana solo se recalcula cuando el deslizador cambia.
        if (est.angulo !== escCE.pesoPrevio) {
          escCE.pesoPrevio = est.angulo;
          escCE.deformar(prof);
          escCE.bola.scale.setScalar(rBola);
          escCE.bola.position.y = alturaCE(0, prof) + rBola;
        }
        escCE.bola.rotation.y += dt * 0.1;

        const sim = escCE.sim;
        if (sim && sim.activo) {
          const GM = gmCE(est.angulo);
          const n = Math.min(8, Math.max(2, Math.ceil(dt / 0.006)));
          const h = dt / n;
          for (let i = 0; i < n && sim.activo; i++) {
            const r = sim.pos.length();
            // Con peso 0 no hay hueco: GM=0 y la canica se va derechita.
            if (GM > 0) {
              vTmp.copy(sim.pos).multiplyScalar(-GM / (r * r * r));
              sim.vel.addScaledVector(vTmp, h);
            }
            sim.pos.addScaledVector(sim.vel, h);

            const ang = Math.atan2(sim.pos.x, sim.pos.z);
            if (sim.angPrev !== null) {
              let delta = ang - sim.angPrev;
              if (delta > Math.PI) delta -= Math.PI * 2;
              if (delta < -Math.PI) delta += Math.PI * 2;
              sim.angAcum += Math.abs(delta);
            }
            sim.angPrev = ang;

            const rN = sim.pos.length();
            if (rN < rBola) {
              // Cayo al fondo del pozo.
              sim.activo = false;
              escCE.canica.visible = false;
              setResultado('cae');
              onFaseRef.current?.({ resultado: 'cae' });
            } else if (!sim.orbito && sim.angAcum >= Math.PI * 2) {
              // Vuelta completa sin caer: eso ES orbitar. Y sigue rodando,
              // que es justo lo que hay que ver.
              sim.orbito = true;
              setResultado('orbita');
              onFaseRef.current?.({ resultado: 'orbita' });
            } else if (rN > CE.borde) {
              // Se fue del tapete: ¿se torcio su camino o no? Se mide cuanto
              // cambio la DIRECCION del movimiento — el barrido angular visto
              // desde el centro no sirve: una recta que pasa de largo tambien
              // barre angulo sin haberse torcido.
              sim.activo = false;
              escCE.canica.visible = false;
              vTmp2.copy(sim.vel).normalize();
              const desviacion = sim.velIni.angleTo(vTmp2);
              const res = desviacion > CE.desviacionMin ? 'curva' : 'recta';
              setResultado(res);
              onFaseRef.current?.({ resultado: res });
            }
          }
        }
        if (sim) {
          // La canica RUEDA sobre la sabana: su altura es la del hueco.
          const alt = alturaCE(sim.pos.length(), prof) + CE.radioCanica;
          escCE.canica.position.set(sim.pos.x, alt, sim.pos.z);
          if (sim.activo && sim.puntos < escCE.posEstela.length / 3) {
            const k = sim.puntos * 3;
            escCE.posEstela[k] = sim.pos.x;
            escCE.posEstela[k + 1] = alt;
            escCE.posEstela[k + 2] = sim.pos.z;
            sim.puntos++;
            escCE.geoEstela.setDrawRange(0, sim.puntos);
            escCE.geoEstela.attributes.position.needsUpdate = true;
          }
        }
      } else if (escena === 'impacto') {
        // El 71% de la Tierra es agua, asi que caer en el mar es lo NORMAL:
        // el boton alterno cambia el blanco entre oceano y tierra firme.
        const enMar = !!est.alterno;
        escImp.tierra.rotation.y += dt * 0.05;
        escImp.grupoImp.rotation.y = escImp.tierra.rotation.y;
        escImp.isla.visible = !enMar;
        escImp.islaOrilla.visible = !enMar;
        escImp.mar.visible = enMar;
        escImp.marOrilla.visible = enMar;
        escImp.matMira.color.set(enMar ? 0x9fe8ff : 0xffe08a);
        // Direccion actual del blanco (la marca gira con el planeta): la roca
        // le apunta cada frame, asi que siempre pega justo en la mira.
        const dirImp = vTmp.copy(escImp.DIR_IMP).applyAxisAngle(V_ARRIBA, escImp.grupoImp.rotation.y);

        const sim = escImp.sim;
        escImp.mira.visible = !sim || sim.fase === 'cayendo';

        if (sim && sim.fase === 'cayendo') {
          const enAire = sim.y < escImp.IMP.radioAtm;
          // Afuera acelera (gravedad); adentro el AIRE la frena en seco —
          // ver el frenon ES ver el escudo trabajando.
          if (enAire) sim.vel = Math.max(1.8, sim.vel - dt * 40);
          else sim.vel += dt * 4;
          sim.y -= sim.vel * dt;
          const altura = sim.y - escImp.IMP.radioTierra;

          // La chiquita se consume mientras cruza el aire.
          if (sim.banda === 'desintegra' && enAire) {
            sim.escala = Math.max(0.02, sim.escala - dt * 1.0);
          }

          escImp.roca.position.copy(dirImp).multiplyScalar(sim.y);
          escImp.roca.rotation.x += dt * 1.7;
          escImp.roca.rotation.z += dt * 1.1;
          escImp.roca.scale.setScalar(sim.escala);
          escImp.brilloRoca.visible = enAire;
          if (enAire) {
            escImp.brilloRoca.position.copy(escImp.roca.position);
            escImp.brilloRoca.scale.setScalar(sim.escala * 2.1 + 0.35);
            if (sim.puntos < escImp.posEstela.length / 3) {
              const k = sim.puntos * 3;
              escImp.posEstela[k] = escImp.roca.position.x;
              escImp.posEstela[k + 1] = escImp.roca.position.y;
              escImp.posEstela[k + 2] = escImp.roca.position.z;
              sim.puntos++;
              escImp.geoEstela.setDrawRange(0, sim.puntos);
              escImp.geoEstela.attributes.position.needsUpdate = true;
            }
          }

          // Desenlace: destello + nube + (crater en tierra / olas en el mar).
          const bum = (tam, resultado) => {
            sim.fase = 'boom';
            sim.t = 0;
            sim.tamBoom = tam;
            sim.resultado = resultado;
            escImp.roca.visible = false;
            escImp.brilloRoca.visible = false;
            escImp.geoEstela.setDrawRange(0, 0); // la estela ya no pinta nada
            const alturaBum = Math.max(sim.y, escImp.IMP.radioTierra + 0.12);
            escImp.destello.visible = true;
            escImp.destello.position.copy(dirImp).multiplyScalar(alturaBum);
            escImp.destello.scale.setScalar(tam * 0.4);
            escImp.matDestello.opacity = 1;

            // Nube: polvo cafe si cae en tierra, espuma blanca si cae al mar.
            const espuma = resultado === 'salpicon' || resultado === 'tsunami';
            escImp.matPolvo.color.set(espuma ? 0xdff2ff : 0xbcaa92);
            escImp.matPolvo.size = 0.5 + tam * 0.14;
            escImp.polvo.visible = true;
            sim.polvoLento = resultado === 'catastrofe' || resultado === 'tsunami';
            const nrm = vTmp2.copy(dirImp);
            const pu = new THREE.Vector3(0, 1, 0).cross(nrm).normalize();
            const pv = new THREE.Vector3().crossVectors(nrm, pu);
            const fuerza = tam * 0.75;
            for (let i = 0; i < escImp.posPolvo.length; i += 3) {
              escImp.posPolvo[i] = nrm.x * alturaBum;
              escImp.posPolvo[i + 1] = nrm.y * alturaBum;
              escImp.posPolvo[i + 2] = nrm.z * alturaBum;
              // Hemisferio hacia afuera, sesgado a la vertical del lugar.
              const cosT = 0.15 + 0.85 * escImp.rng();
              const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
              const phi = escImp.rng() * Math.PI * 2;
              const rap = fuerza * (0.35 + escImp.rng());
              escImp.velPolvo[i] = (nrm.x * cosT + (pu.x * Math.cos(phi) + pv.x * Math.sin(phi)) * sinT) * rap;
              escImp.velPolvo[i + 1] = (nrm.y * cosT + (pu.y * Math.cos(phi) + pv.y * Math.sin(phi)) * sinT) * rap;
              escImp.velPolvo[i + 2] = (nrm.z * cosT + (pu.z * Math.cos(phi) + pv.z * Math.sin(phi)) * sinT) * rap;
            }
            escImp.geoPolvo.attributes.position.needsUpdate = true;

            escImp.craterChico.forEach((m) => { m.visible = resultado === 'crater'; });
            escImp.craterGrande.forEach((m) => { m.visible = resultado === 'catastrofe'; });

            // Olas: alcance y color segun el desenlace. Un salpicon se apaga
            // cerquita (las olas de un impacto se deshacen rapido, no son como
            // las de un terremoto); un tsunami tipo Chicxulub da la vuelta al
            // mundo.
            sim.alcanceOla = resultado === 'tsunami' ? Math.PI * 0.98
              : resultado === 'salpicon' ? 0.55
                : resultado === 'catastrofe' ? 1.25 : 0;
            sim.velOla = resultado === 'tsunami' ? 0.42 : resultado === 'catastrofe' ? 0.7 : 0.5;
            const colorOla = resultado === 'catastrofe' ? 0xff8c42 : 0x9fe8ff;
            escImp.olas.forEach((o) => {
              o.mat.color.set(colorOla);
              o.linea.visible = false;
            });

            setResultado(resultado);
            onFaseRef.current?.({ resultado });
          };

          // La MISMA roca da un desenlace distinto segun donde cae: ese
          // contraste es el experimento.
          const enSuelo = enMar
            ? (sim.banda === 'crater' ? 'salpicon' : sim.banda === 'catastrofe' ? 'tsunami' : sim.banda)
            : sim.banda;
          if (sim.banda === 'desintegra' && (sim.escala <= 0.03 || altura <= 0.7)) {
            bum(1.2, 'desintegra');
          } else if (sim.banda === 'explota-aire' && altura <= 0.55) {
            bum(3.2, 'explota-aire');
          } else if (altura <= sim.escala * 0.55) {
            bum(sim.banda === 'catastrofe' ? 6 : 3.6, enSuelo);
          }
        } else if (sim && sim.fase === 'boom') {
          sim.t += dt;
          escImp.destello.scale.setScalar(sim.tamBoom * (0.4 + sim.t * 2.2));
          escImp.matDestello.opacity = Math.max(0, 1 - sim.t * 0.9);
          if (sim.t > 1.4) escImp.destello.visible = false;
          if (sim.t > (sim.polvoLento ? 7 : 4)) sim.fase = 'fin';
        } else if (sim && sim.fase === 'fin') {
          sim.t += dt; // sigue contando para que "amanezca" despues del polvo
        }

        // La nube vive despues del destello: sale disparada, se abre y se apaga.
        if (sim && sim.fase !== 'cayendo' && escImp.polvo.visible) {
          const rTierra = escImp.IMP.radioTierra;
          for (let i = 0; i < escImp.posPolvo.length; i += 3) {
            escImp.posPolvo[i] += escImp.velPolvo[i] * dt;
            escImp.posPolvo[i + 1] += escImp.velPolvo[i + 1] * dt;
            escImp.posPolvo[i + 2] += escImp.velPolvo[i + 2] * dt;
            const fr = 1 - Math.min(0.9, dt * 1.1);
            escImp.velPolvo[i] *= fr;
            escImp.velPolvo[i + 1] *= fr;
            escImp.velPolvo[i + 2] *= fr;
            // Que no se hunda en el planeta: el polvo se queda encima.
            const d = Math.hypot(escImp.posPolvo[i], escImp.posPolvo[i + 1], escImp.posPolvo[i + 2]);
            if (d < rTierra + 0.05 && d > 0.001) {
              const k = (rTierra + 0.05) / d;
              escImp.posPolvo[i] *= k;
              escImp.posPolvo[i + 1] *= k;
              escImp.posPolvo[i + 2] *= k;
            }
          }
          escImp.geoPolvo.attributes.position.needsUpdate = true;
          const dur = sim.polvoLento ? 7 : 3.4;
          const op = Math.max(0, 0.95 * (1 - sim.t / dur));
          escImp.matPolvo.opacity = op;
          if (op <= 0.001) escImp.polvo.visible = false;
        }

        // Las olas: circulos dibujados sobre la esfera que se abren desde el
        // punto de impacto (asi viaja un tsunami de verdad).
        if (sim && sim.alcanceOla > 0 && sim.fase !== 'cayendo') {
          const R = escImp.IMP.radioTierra + 0.05;
          escImp.olas.forEach((o, idx) => {
            const th = (sim.t - idx * 0.5) * sim.velOla;
            if (th <= 0.02 || th > sim.alcanceOla) {
              o.linea.visible = false;
              return;
            }
            o.linea.visible = true;
            const ct = Math.cos(th);
            const st = Math.sin(th);
            for (let k = 0; k < escImp.N_OLA; k++) {
              const ph = (k / escImp.N_OLA) * Math.PI * 2;
              const cp = Math.cos(ph);
              const sp = Math.sin(ph);
              o.arr[k * 3] = (escImp.DIR_IMP.x * ct + (escImp.olaU.x * cp + escImp.olaV.x * sp) * st) * R;
              o.arr[k * 3 + 1] = (escImp.DIR_IMP.y * ct + (escImp.olaU.y * cp + escImp.olaV.y * sp) * st) * R;
              o.arr[k * 3 + 2] = (escImp.DIR_IMP.z * ct + (escImp.olaU.z * cp + escImp.olaV.z * sp) * st) * R;
            }
            o.geo.attributes.position.needsUpdate = true;
            o.mat.opacity = Math.max(0, 1 - th / sim.alcanceOla) * 0.95;
          });
        }

        // Tras la catastrofe (o el mega-tsunami) el polvo tapa el Sol un
        // ratito… y luego amanece.
        const gorda = sim && (sim.resultado === 'catastrofe' || sim.resultado === 'tsunami');
        const aOscuras = gorda && sim.fase !== 'cayendo' && sim.t < 5.5;
        const luzMeta = aOscuras ? 0.4 : 1.5;
        escImp.luz.intensity += (luzMeta - escImp.luz.intensity) * Math.min(1, dt * 2);
      } else if (escena === 'big-bang') {
        const info = bigBangInfoDe(est.angulo);
        const mito = !!est.alterno;

        // Mudanza: elegir nuevo ancla segun el modo.
        if (escBB.mudanza) {
          escBB.mudanza = false;
          const lista = mito ? escBB.idxOrilla : escBB.idxCerca;
          const idx = lista[Math.floor(escBB.rng() * lista.length)];
          escBB.anclaMeta.fromArray(mito ? escBB.comMito : escBB.comUnif, idx * 3);
        }

        // Posiciones comoviles: solo se recalculan si cambia slider o modo.
        if (est.angulo !== escBB.tPrevio || mito !== escBB.mitoPrevio) {
          escBB.tPrevio = est.angulo;
          if (mito !== escBB.mitoPrevio) {
            escBB.mitoPrevio = mito;
            // Al entrar al mito arrancas en su CENTRO (la explosion clasica
            // se ve convincente…); al volver, a un vecindario del universo.
            escBB.anclaMeta.fromArray(
              mito ? escBB.comMito : escBB.comUnif,
              (mito ? escBB.idxCentro : escBB.idxCerca[0]) * 3
            );
          }
          const g = info.grumos;
          for (let k = 0; k < escBB.posU.length; k++) {
            escBB.posU[k] = mito
              ? escBB.comMito[k]
              : escBB.comUnif[k] + (escBB.comTela[k] - escBB.comUnif[k]) * g;
          }
          escBB.geoU.attributes.position.needsUpdate = true;
          const opSprite = mito || info.fase === 'niebla' ? 0 : Math.min(1, g * 1.6);
          escBB.sprites.forEach((sp) => { sp.material.opacity = opSprite; });
        }

        // Escala del espacio + anclaje: el grupo entero se re-centra para que
        // la galaxia ancla quede clavada en el origen (donde esta la camara).
        escBB.anclaActual.lerp(escBB.anclaMeta, Math.min(1, dt * 2.5));
        escBB.univ.scale.setScalar(info.a);
        escBB.univ.position.copy(escBB.anclaActual).multiplyScalar(-info.a);

        // La niebla caliente del principio (y las particulas dentro de ella).
        escBB.matNiebla.opacity = info.niebla * 0.8;
        escBB.nieblaMesh.visible = info.niebla > 0.01;
        escBB.glowNiebla.material.opacity = info.niebla * 0.9;
        escBB.glowNiebla.visible = info.niebla > 0.01;
        escBB.matU.opacity = 0.9 * (1 - info.niebla * 0.85);
        escBB.marca.material.opacity = 0.9 * (1 - info.niebla);
      } else if (escena === 'nace-un-sol') {
        const info = naceSolInfoDe(est.angulo);
        const ap = info.aplanado;

        // Giro kepleriano + lerp nube→disco, por frame (3,000 puntos: barato).
        for (let i = 0; i < escSol.rDisco.length; i++) {
          const r = escSol.rDisco[i];
          escSol.angD[i] += dt * ap * (15 / Math.pow(r, 1.5));
          const dx = Math.cos(escSol.angD[i]) * r;
          const dz = Math.sin(escSol.angD[i]) * r;
          const k = i * 3;
          escSol.posD[k] = escSol.nube[k] * (1 - ap) + dx * ap;
          escSol.posD[k + 1] = escSol.nube[k + 1] * (1 - ap) + escSol.hDisco[i] * ap;
          escSol.posD[k + 2] = escSol.nube[k + 2] * (1 - ap) + dz * ap;
        }
        escSol.geoD.attributes.position.needsUpdate = true;

        // Surcos: el polvo cerca del carril de cada planeta se apaga
        // (bajarle el color sobre fondo negro = desvanecerlo). Solo al mover
        // el deslizador.
        if (est.angulo !== escSol.tPrevio) {
          escSol.tPrevio = est.angulo;
          for (let i = 0; i < escSol.rDisco.length; i++) {
            let factor = 1;
            if (info.barrido > 0) {
              for (const R of escSol.anillos) {
                const d = Math.abs(escSol.rDisco[i] - R);
                if (d < 1.1) factor = Math.min(factor, 1 - info.barrido * (1 - d / 1.1));
              }
            }
            const k = i * 3;
            escSol.colD[k] = escSol.colorBase[k] * factor;
            escSol.colD[k + 1] = escSol.colorBase[k + 1] * factor;
            escSol.colD[k + 2] = escSol.colorBase[k + 2] * factor;
          }
          escSol.geoD.attributes.color.needsUpdate = true;
        }

        // El sol se enciende (y de paso ilumina a los planetas: son lambert).
        const s = 0.25 + info.brillo * 1.15;
        escSol.sol.scale.setScalar(s);
        escSol.sol.rotation.y += dt * 0.4;
        escSol.glowSol.position.copy(escSol.sol.position);
        escSol.glowSol.scale.setScalar(s * 4.2);
        escSol.glowSol.material.opacity = 0.15 + info.brillo * 0.85;
        escSol.luzSol.intensity = info.brillo * 2.2;

        escSol.planetas.forEach((p) => {
          p.mesh.visible = info.barrido > 0.05;
          if (!p.mesh.visible) return;
          p.ang += dt * (15 / Math.pow(p.R, 1.5));
          p.mesh.position.set(Math.cos(p.ang) * p.R, 0, Math.sin(p.ang) * p.R);
          p.mesh.scale.setScalar(p.radioFin * Math.min(1, 0.25 + info.barrido));
          p.mesh.rotation.y += dt * 0.8;
        });
      } else if (escena === 'dia-noche') {
        // El Sol quieto; la Tierra (y sus pines) giran con la hora. A las 12
        // el pin de Mexico (+X local) queda de frente al Sol (+X del mundo).
        escDN.grupoTierra.rotation.y = ((est.angulo - 12) / 24) * Math.PI * 2;
        // La Luna casi ni se mueve en un dia (~13° de su orbita): honesto, y
        // de paso a veces se deja ver de dia en el recuadro.
        const angL = 2.2 + (est.angulo / 24) * 0.23;
        escDN.luna.position.set(
          Math.cos(angL) * escDN.DN.orbitaLuna,
          1.2,
          -Math.sin(angL) * escDN.DN.orbitaLuna
        );
        escDN.luna.rotation.y += dt * 0.1;
      } else if (escena === 'carrera') {
        if (escCar.corriendo) {
          escCar.anios += dt * (0.1 + (est.angulo / 100) * 1.9); // años/segundo
        }
        const wc = lienzo.clientWidth;
        const hc = lienzo.clientHeight;
        const deci = Math.floor(escCar.anios * 10);
        if (deci !== escCar.deciPrev) {
          escCar.deciPrev = deci;
          escCar.etiquetaAnios.textContent = `⏱️ ${(deci / 10).toFixed(1)} años terrestres`;
        }
        escCar.cuerpos.forEach((c) => {
          const ang = (escCar.anios / CARRERA_ANIOS[c.id]) * Math.PI * 2;
          c.mesh.position.set(Math.cos(ang) * c.dist, 0, -Math.sin(ang) * c.dist);
          c.mesh.rotation.y += dt * 0.4;
          const vueltas = Math.floor(escCar.anios / CARRERA_ANIOS[c.id]);
          if (vueltas !== c.vueltasPrev) {
            c.vueltasPrev = vueltas;
            const nombre = c.nombre.replace(/^(el|la) /, '');
            c.etiquetaEl.textContent = escCar.anios > 0
              ? `${c.emoji} ${nombre} · ${vueltas} ${vueltas === 1 ? 'vuelta' : 'vueltas'}`
              : `${c.emoji} ${nombre} · en la salida`;
          }
          if (wc && hc) {
            vProy.copy(c.mesh.position);
            vProy.y += c.radio * 1.3 + 0.6;
            vProy.project(camara);
            if (vProy.z < 1) {
              const px = (vProy.x * 0.5 + 0.5) * wc;
              const py = (1 - (vProy.y * 0.5 + 0.5)) * hc;
              c.etiquetaEl.style.transform = `translate(${px}px, ${py}px) translate(-50%, -100%)`;
              c.etiquetaEl.style.opacity = 1;
            } else {
              c.etiquetaEl.style.opacity = 0;
            }
          }
        });
      } else if (escena === 'trompos') {
        // Velocidad exponencial: de 0.2x a 12x. A 1x, Venus (243 dias por
        // vuelta) practicamente no se mueve — honesto, y su etiqueta lo dice.
        const vel = 0.2 * Math.pow(60, est.angulo / 100);
        const wt = lienzo.clientWidth;
        const ht = lienzo.clientHeight;
        escTrompos.trompos.forEach((t) => {
          t.mesh.rotation.y += dt * 0.9 * t.giroRel * vel;
          if (!wt || !ht) return;
          vProy.copy(t.grupo.position);
          vProy.y += t.radio * 2.1 + 0.5;
          vProy.project(camara);
          if (vProy.z < 1) {
            const px = (vProy.x * 0.5 + 0.5) * wt;
            const py = (1 - (vProy.y * 0.5 + 0.5)) * ht;
            t.etiquetaEl.style.transform = `translate(${px}px, ${py}px) translate(-50%, -100%)`;
            t.etiquetaEl.style.opacity = 1;
          } else {
            t.etiquetaEl.style.opacity = 0;
          }
        });
        distDeseada = Math.max(
          (escTrompos.halfW + 1) / (tanFov * aspecto),
          9 / tanFov
        ) * 1.05;
      }

      distDeseada *= zoomUsuario;
      objetivoCam.x += (objetivoX - objetivoCam.x) * Math.min(1, dt * 5);
      objetivoCam.y += (objetivoY - objetivoCam.y) * Math.min(1, dt * 5);
      objetivoCam.z += (objetivoZ - objetivoCam.z) * Math.min(1, dt * 5);
      distSuave += (distDeseada - distSuave) * Math.min(1, dt * 5);

      camara.position.set(
        objetivoCam.x + distSuave * Math.cos(pitch) * Math.sin(yaw),
        objetivoCam.y + distSuave * Math.sin(pitch),
        objetivoCam.z + distSuave * Math.cos(pitch) * Math.cos(yaw)
      );
      camara.lookAt(objetivoCam);

      renderer.render(escena3, camara);

      if (escena === 'tierra-luna' || escena === 'estaciones' || escena === 'dia-noche') {
        // Recuadro de la esquina inferior derecha.
        const w = lienzo.clientWidth;
        let camRecuadro;
        let cieloInset = null;
        if (escena === 'tierra-luna') {
          // "Asi se ve desde la Tierra": camara dentro de la Tierra mirando la Luna.
          tl.camFase.lookAt(tl.luna.position);
          camRecuadro = tl.camFase;
        } else if (escena === 'estaciones') {
          // "Asi pega la luz": la Tierra vista desde el lado del Sol.
          const posT = escEst.grupoTierra.position;
          vTmp.copy(posT).normalize();
          escEst.camEst.position.copy(posT).addScaledVector(vTmp, -5.2);
          escEst.camEst.lookAt(posT);
          camRecuadro = escEst.camEst;
        } else {
          // "Asi se ve desde tu casa": parado en el pin, mirando el horizonte
          // hacia el lado del Sol. El suelo es la propia Tierra texturizada.
          const cam = escDN.camDN;
          vTmp.copy(escDN.casaLocal).applyAxisAngle(V_ARRIBA, escDN.grupoTierra.rotation.y);
          vTmp2.copy(vTmp).normalize(); // arriba local = radial
          cam.up.copy(vTmp2);
          cam.position.copy(vTmp).addScaledVector(vTmp2, 0.22);
          escDN.vSol.set(escDN.DN.distSol, 0, 0).sub(cam.position).normalize();
          const elev = escDN.vSol.dot(vTmp2); // seno de la altura del Sol
          // componente horizontal de la direccion al Sol (azimut)
          escDN.vSol.addScaledVector(vTmp2, -elev);
          if (escDN.vSol.lengthSq() < 1e-6) escDN.vSol.set(0, 0, 1); // Sol en el cenit
          escDN.vSol.normalize();
          vTmp.copy(cam.position).addScaledVector(escDN.vSol, 10).addScaledVector(vTmp2, 3);
          cam.lookAt(vTmp);
          // Cielo segun la altura del Sol: azul de dia, naranja al ras, oscuro
          // de noche (y entonces se ven las estrellas del fondo).
          const c = escDN.colCielo;
          if (elev > 0.28) c.copy(escDN.colDia);
          else if (elev > 0.02) c.copy(escDN.colTarde).lerp(escDN.colDia, (elev - 0.02) / 0.26);
          else if (elev > -0.12) c.copy(escDN.colNoche).lerp(escDN.colTarde, (elev + 0.12) / 0.14);
          else c.copy(escDN.colNoche);
          camRecuadro = cam;
          cieloInset = c;
        }
        if (cieloInset) renderer.setClearColor(cieloInset, 1);
        renderer.setScissorTest(true);
        renderer.setViewport(w - INSET - 10, 10, INSET, INSET);
        renderer.setScissor(w - INSET - 10, 10, INSET, INSET);
        renderer.render(escena3, camRecuadro);
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, lienzo.clientHeight);
        if (cieloInset) renderer.setClearColor('#070b1a', 1);
      }
    };
    animar();

    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      lienzo.removeEventListener('pointerdown', alBajar);
      lienzo.removeEventListener('pointermove', alMover);
      lienzo.removeEventListener('pointerup', alSoltar);
      lienzo.removeEventListener('pointercancel', alSoltar);
      lienzo.removeEventListener('wheel', alRueda);
      desechables.forEach((x) => x.dispose());
      renderer.dispose();
      if (lienzo.parentNode) lienzo.parentNode.removeChild(lienzo);
      if (capaEtiquetas?.parentNode) capaEtiquetas.parentNode.removeChild(capaEtiquetas);
      apiRef.current = null;
    };
  }, [escena]);

  if (!soportado) {
    return (
      <div className="espacio3d-fallback">
        Este dispositivo no puede mostrar el espacio en 3D.
      </div>
    );
  }

  const conSlider = ['tierra-luna', 'estaciones', 'cometa', 'satelite', ...ESCALERAS, 'impacto', 'dia-noche', 'carrera', 'trompos', 'big-bang', 'nace-un-sol', 'agujero-negro', 'cama-elastica'].includes(escena);
  const conRecuadro = escena === 'tierra-luna' || escena === 'estaciones' || escena === 'dia-noche';

  const PISTAS = {
    planetas: '👆 Toca un planeta · arrastra para girar la vista',
    'tierra-luna': '👆 Mueve el deslizador para llevar la Luna por su órbita · arrastra para girar',
    estaciones: '👆 Mueve el deslizador para recorrer el año · fíjate hacia dónde apunta el eje rojo',
    constelaciones: '👆 Arrastra la vista hasta que un dibujo de estrellas ENCAJE · toca una estrella para saber más',
    cometa: '👆 Mueve el deslizador para viajar con el cometa · mira hacia dónde apunta la cola',
    satelite: '👆 Elige la velocidad y ¡lanza! · arrastra para girar la vista',
    estrellas: '👆 Sube la escalera con el deslizador · toca una estrella para saber más',
    exoplanetas: '👆 Sube la escalera con el deslizador · toca un planeta para saber más',
    asteroides: '👆 Sube la escalera con el deslizador · toca una roca para saber más',
    impacto: '👆 Elige el tamaño de la roca, apuesta qué pasará… ¡y suéltala!',
    'dia-noche': '👆 Mueve la hora con el deslizador y mira el recuadro: así se ve desde tu casa',
    carrera: '👆 ¡Arranca la carrera! · acelera el tiempo con el deslizador · toca un planeta para saber más',
    trompos: '👆 Mira cada trompo: su inclinación y su giro son los REALES · toca uno para saber más',
    'big-bang': '👆 Rebobina el universo con el deslizador · múdate de galaxia para buscar el centro',
    'nace-un-sol': '👆 Avanza el tiempo con el deslizador y mira nacer un sistema solar',
    'agujero-negro': '👆 Aprieta la Tierra con el deslizador y lanza rayos de luz para ver si escapan',
    'cama-elastica': '👆 Ponle peso a la bola con el deslizador y rueda la canica · arrastra para girar',
  };

  const EXTREMOS = {
    'tierra-luna': ['🌞', '🌙'],
    estaciones: ['☀️', '☀️'],
    cometa: ['🔥', '🔥'],
    satelite: ['🐢', '🚀'],
    estrellas: ['🌍', '👑'],
    exoplanetas: ['🔴', '🎈'],
    asteroides: ['💥', '🌕'],
    impacto: ['🍚', '🏔️'],
    'dia-noche': ['🌅', '🌃'],
    carrera: ['🐢', '⏩'],
    trompos: ['🐢', '⏩'],
    'big-bang': ['🔥', '🌌'],
    'nace-un-sol': ['☁️', '🪐'],
    'agujero-negro': ['🌍', '🕳️'],
    'cama-elastica': ['🪶', '🐘'],
  };

  // El deslizador no siempre recorre una orbita: en algunas escenas es un
  // porcentaje (velocidad, apreton, peso) o un escalon de la escalera.
  const SLIDER_MAX = {
    satelite: 100,
    impacto: 100,
    'dia-noche': 24,
    carrera: 100,
    trompos: 100,
    'big-bang': 100,
    'nace-un-sol': 100,
    'agujero-negro': 100,
    'cama-elastica': 100,
    estrellas: PASOS_ESTRELLAS,
    exoplanetas: PASOS_EXOPLANETAS,
    asteroides: PASOS_ASTEROIDES,
  };

  const SLIDER_ETIQUETA = {
    satelite: 'Velocidad de lanzamiento',
    estrellas: 'Subir la escalera de estrellas',
    exoplanetas: 'Subir la escalera de planetas',
    asteroides: 'Subir la escalera de asteroides',
    impacto: 'Tamaño de la roca',
    'dia-noche': 'La hora del día',
    carrera: 'Velocidad del tiempo',
    trompos: 'Velocidad del tiempo',
    'big-bang': 'Viajar en el tiempo',
    'nace-un-sol': 'Tiempo de formación',
    'agujero-negro': 'Apretar la Tierra',
    'cama-elastica': 'Peso de la bola',
  };

  // Escenas con boton de disparo (y el texto del boton).
  const BOTON_LANZAR = {
    satelite: '🚀 ¡Lanzar!',
    impacto: '☄️ ¡Que caiga!',
    carrera: '🏁 ¡Arranquen!',
    'big-bang': '🚀 ¡Múdate a otra galaxia!',
    'agujero-negro': '💡 ¡Rayo de luz!',
    'cama-elastica': '🎱 ¡Rueda la canica!',
  };

  // Boton alterno (solo big-bang): entra y sale del MITO de la explosion.
  // El mito no se muestra para lucirlo sino para derrotarlo: en la bola hay
  // orilla y centro; en el universo real, te mudes a donde te mudes, no.
  const BOTON_ALTERNO = {
    'big-bang': alterno ? '🌌 Volver al universo real' : '🎭 ¿Y si fuera una explosión?',
    impacto: alterno ? '🏜️ Que caiga en tierra' : '🌊 Que caiga en el mar',
  };

  let etiqueta = null;
  if (escena === 'tierra-luna') {
    const info = faseInfoDe(angulo);
    etiqueta = (
      <div className={`espacio3d-fase ${info.eclipseSol || info.eclipseLuna ? 'eclipse' : ''}`}>
        {info.eclipseSol
          ? '🌑✨ ¡ECLIPSE DE SOL!'
          : info.eclipseLuna
            ? '🔴🌕 ¡ECLIPSE DE LUNA!'
            : `${info.emoji} ${info.nombre}`}
      </div>
    );
  } else if (escena === 'estaciones') {
    const info = estacionInfoDe(angulo);
    etiqueta = (
      <>
        <div className="espacio3d-fase">
          {`${info.emoji} ${info.nombre} aquí (${info.mes}) · en el sur: ${info.emojiSur} ${info.nombreSur}`}
        </div>
        <div className="espacio3d-subfase">
          {`📏 Distancia al Sol: ${info.distancia.toFixed(1)} millones de km`}
          {info.masCerca
            ? ' — ¡lo MÁS cerca del año… en pleno invierno nuestro!'
            : ' (casi igual todo el año)'}
        </div>
      </>
    );
  } else if (escena === 'cometa') {
    const info = cometaInfoDe(angulo);
    etiqueta = (
      <>
        <div className="espacio3d-fase">
          {info.zona === 'perihelio'
            ? '🔥 ¡Pegadito al Sol: cola gigante!'
            : info.zona === 'afelio'
              ? '🥶 Lejísimos del Sol: dormido, casi sin cola'
              : info.alejandose
                ? '🚀 Alejándose… ¡fíjate: viaja con la cola por DELANTE!'
                : '☄️ Acercándose al Sol: la cola crece'}
        </div>
        <div className="espacio3d-subfase">
          {info.zona === 'perihelio'
            ? 'El calor evapora su hielo, y las chispitas del viento solar lo soplan hacia afuera.'
            : info.zona === 'afelio'
              ? 'Tan lejos no hay calor que evapore el hielo: no hay casi nada que soplar.'
              : info.alejandose
                ? 'El viento del Sol siempre sopla DESDE el Sol: por eso la cola nunca va "atrás".'
                : 'Entre más se acerca, más hielo se evapora… y más cola tiene el viento para soplar.'}
        </div>
      </>
    );
  } else if (escena === 'constelaciones') {
    const TEXTOS = {
      frio: '❄️ Frío… sigue girando la vista',
      tibio: '🌡️ Tibio: vas por buen camino',
      caliente: '🔥 ¡Caliente! Ya casi encaja',
      encaja: '✨ ¡ENCAJÓ! Este es el punto de vista de la Tierra',
    };
    etiqueta = (
      <>
        <div className={`espacio3d-fase ${pistaConst === 'encaja' ? 'eclipse' : ''}`}>
          {TEXTOS[pistaConst]}
        </div>
        {estrellaTocada && <div className="espacio3d-subfase">⭐ {estrellaTocada}</div>}
      </>
    );
  } else if (escena === 'satelite') {
    const TEXTOS = {
      volando: '🛰️ Volando…',
      choca: '💥 ¡Se cayó! Prueba con más velocidad',
      orbita: '🛰️ ¡ÓRBITA LOGRADA! Está cayendo alrededor de la Tierra sin parar',
      escapa: '👋 ¡Escapó de la Tierra! Eso fue demasiada velocidad',
    };
    etiqueta = (
      <div className={`espacio3d-fase ${resultado === 'orbita' ? 'eclipse' : ''}`}>
        {TEXTOS[resultado] || `Velocidad: ${angulo}% · elige y ¡lanza!`}
      </div>
    );
  } else if (escena === 'agujero-negro') {
    const pct = pctEscapeAN(angulo);
    const TEXTOS = {
      volando: '💡 El rayo va volando…',
      escapa: '✨ ¡El rayo ESCAPÓ! Todavía no es agujero negro',
      atrapado: '🕳️ ¡ATRAPADO! Ni la luz pudo salir: es un AGUJERO NEGRO',
    };
    etiqueta = (
      <>
        <div className={`espacio3d-fase ${resultado === 'atrapado' ? 'eclipse' : ''}`}>
          {TEXTOS[resultado] || (pct >= 100
            ? `🕳️ ¡AGUJERO NEGRO! Para escapar habría que ir al ${pct}% de la luz`
            : pct >= 60
              ? `😰 A la luz ya le cuesta… (escape: ${pct}% de la velocidad de la luz)`
              : `☄️ La luz escapa fácil (escape: ${pct}% de la velocidad de la luz)`)}
        </div>
        <div className="espacio3d-subfase">
          {pct >= 100
            ? 'Por más que aprietes, el horizonte no crece ni encoge: solo depende del PESO. Y mira la luna: sigue igual.'
            : 'Mismo peso, más apretada → más gravedad en la superficie. ¡Lanza un rayo para probar!'}
        </div>
      </>
    );
  } else if (escena === 'cama-elastica') {
    const TEXTOS = {
      volando: '🎱 La canica va rodando…',
      recta: '➡️ Se fue DERECHITA: sin peso, el espacio está plano',
      curva: '🌀 ¡Se torció su camino! El hueco la desvió sin tocarla',
      orbita: '🔄 ¡VUELTA COMPLETA! Está orbitando: eso hace la Tierra con el Sol',
      cae: '⬇️ ¡Se cayó al fondo del pozo! Demasiado hundido',
    };
    etiqueta = (
      <>
        <div className={`espacio3d-fase ${resultado === 'orbita' ? 'eclipse' : ''}`}>
          {TEXTOS[resultado] || (angulo === 0
            ? '➖ Espacio PLANO: no hay peso que lo hunda'
            : angulo < 24
              ? `🌀 El espacio se hunde un poquito (peso: ${angulo}%)`
              : angulo < 75
                ? `🕳️ Hueco hondo (peso: ${angulo}%)`
                : `⚫ Pozo profundísimo (peso: ${angulo}%)`)}
        </div>
        <div className="espacio3d-subfase">
          {angulo === 0
            ? 'Sin hundimiento, la canica va derechita. ¡Ruédala y compruébalo!'
            : 'Nadie jala la canica: solo sigue el hueco que hizo el peso. Eso descubrió Einstein.'}
        </div>
      </>
    );
  } else if (escena === 'estrellas') {
    const TEXTOS_PASO = {
      1: '🌍☀️ Nuestro rincón: el Sol ya es 109 veces la Tierra',
      2: 'El Sol es… ¡normalito! Hay más chicas (Próxima) y más brillantes (Sirio)',
      3: 'Las gigantes naranjas: Arcturus y Aldebarán',
      4: '¡Las de Orión! Rigel 🔵 y Betelgeuse 🔴, que se tragaría hasta Marte',
      5: 'Stephenson 2-18, la más grande conocida: se tragaría hasta Saturno',
    };
    etiqueta = (
      <>
        <div className="espacio3d-fase">{TEXTOS_PASO[angulo] || TEXTOS_PASO[1]}</div>
        <div className="espacio3d-subfase">
          {angulo >= 4
            ? '⭕ Los anillos dentro de la gigante son las órbitas de los planetas: ¡quedarían ADENTRO!'
            : '🔵 azules = más calientes · 🔴 rojas = más frías (¡al revés que las llaves del agua!)'}
        </div>
      </>
    );
  } else if (escena === 'exoplanetas') {
    const TEXTOS_PASO = {
      1: '🌍 Nuestros conocidos: Marte y la Tierra',
      2: 'Planetas de OTRAS estrellas: TRAPPIST-1e y Kepler-452b, el primo de la Tierra',
      3: '🍭 Kepler-51d es grande como Saturno… ¡pero ligero como algodón de azúcar!',
      4: '💙 Júpiter ya no es el rey: HD 189733b es más grande, azul… y le llueve vidrio',
      5: '🎈 ¡El TECHO! No se conoce ningún planeta más ancho que HAT-P-67 b',
      6: '☀️ …y aun así el Sol es 5 veces más ancho que el planeta récord',
    };
    etiqueta = (
      <>
        <div className="espacio3d-fase">{TEXTOS_PASO[angulo] || TEXTOS_PASO[1]}</div>
        <div className="espacio3d-subfase">
          {angulo >= PASOS_EXOPLANETAS
            ? 'Un planeta no puede crecer sin límite: con más gas, la gravedad lo APRIETA… y con muchísimo más, se enciende como estrella.'
            : '📏 Los tamaños son medidos de verdad: al pasar frente a su estrella la tapan un poquito — su sombra los delata.'}
        </div>
      </>
    );
  } else if (escena === 'asteroides') {
    const TEXTOS_PASO = {
      1: '💥 Las que nos han visitado: Cheliábinsk y Tunguska',
      2: '🗼 Apophis y Bennu: rocas como edificios… y las estamos vigilando',
      3: '🦖 Chicxulub, la montaña voladora que acabó con los dinosaurios',
      4: '👑 Vesta y Ceres, los reyes del cinturón de asteroides',
      5: '🌕 …y la Luna los deja a todos chiquitos',
    };
    etiqueta = (
      <>
        <div className="espacio3d-fase">{TEXTOS_PASO[angulo] || TEXTOS_PASO[1]}</div>
        <div className="espacio3d-subfase">
          {angulo >= PASOS_ASTEROIDES
            ? 'Ni juntando TODOS los asteroides del cinturón armas ni el 5% de la Luna. Por eso ahí nunca se formó un planeta.'
            : '🥔 Los asteroides son papas espaciales: solo los MUY grandes tienen gravedad para hacerse bolita (Ceres ya lo logró).'}
        </div>
      </>
    );
  } else if (escena === 'impacto') {
    const info = impactoInfoDe(angulo);
    const TEXTOS = {
      cayendo: '☄️ ¡Ahí va! Mírala entrar…',
      desintegra: '✨ ¡Se quemó en el aire! El escudo de la Tierra funcionó',
      'explota-aire': '💥 ¡BUM! Explotó en el aire, como la de Cheliábinsk',
      crater: '🕳️ Llegó al suelo y abrió un cráter',
      catastrofe: '🌑 Catástrofe: el polvo tapó el Sol…',
      salpicon: '🌊 ¡SPLASH gigante! Olas grandes… que se apagan antes de llegar lejos',
      tsunami: '🌊 ¡MEGA-TSUNAMI! Olas gigantes dándole la vuelta al mundo',
    };
    const SUB = {
      catastrofe: 'Tranquilo: una así cae cada ~100 MILLONES de años, y los astrónomos vigilan el cielo todos los días.',
      tsunami: 'Así fue Chicxulub: cayó en el mar y levantó olas de más de 300 metros. Pasa cada ~100 millones de años.',
      salpicon: 'Dato honesto: las olas de un impacto se deshacen rápido, no son como las de un terremoto. ¡Las películas exageran!',
    };
    etiqueta = (
      <>
        <div className="espacio3d-fase">
          {TEXTOS[resultado] || `🪨 Roca de ${info.tamano} (${info.ancla})`}
        </div>
        <div className="espacio3d-subfase">
          {SUB[resultado]
            || (resultado && resultado !== 'cayendo'
              ? '¿Y si cae en otro lado, o con otro tamaño? Cambia y suelta otra.'
              : `🎯 Apuntando ${alterno ? 'al MAR 🌊' : 'a TIERRA firme 🏜️'} · ¿se quemará, explotará en el aire o llegará al suelo? Haz tu apuesta.`)}
        </div>
      </>
    );
  } else if (escena === 'dia-noche') {
    const info = diaNocheInfoDe(angulo);
    const m = MOMENTOS[info.momento];
    const mJ = MOMENTOS[info.momentoJapon];
    etiqueta = (
      <>
        <div className="espacio3d-fase">
          {`🕐 Las ${info.hora}:00 en tu casa (${m.emoji} ${m.nombre}) · en Japón: las ${info.horaJapon}:00 (${mJ.emoji} ${mJ.nombre})`}
        </div>
        <div className="espacio3d-subfase">
          El Sol no se mueve: ¡es el PISO el que gira! La Tierra da una vuelta completa cada 24 horas.
        </div>
      </>
    );
  } else if (escena === 'carrera') {
    etiqueta = (
      <>
        <div className="espacio3d-fase">
          {resultado === 'corriendo' ? '🏁 ¡La carrera está en marcha!' : '🏁 Todos en la línea de salida'}
        </div>
        <div className="espacio3d-subfase">
          {resultado === 'corriendo'
            ? 'Más CERCA del Sol = más rápido. Neptuno tardará 165 años en dar UNA sola vuelta.'
            : '¿Quién dará más vueltas? Haz tu apuesta… ¡y arranca! (Con el deslizador aceleras el tiempo.)'}
        </div>
      </>
    );
  } else if (escena === 'trompos') {
    etiqueta = (
      <>
        <div className="espacio3d-fase">
          🌀 Cada planeta es un trompo: su eje chueco y su velocidad son los REALES
        </div>
        <div className="espacio3d-subfase">
          Busca al que gira DE CABEZA (por eso parece girar al revés) y al que rueda ACOSTADO como llanta.
        </div>
      </>
    );
  } else if (escena === 'big-bang') {
    const info = bigBangInfoDe(angulo);
    const TXT_FASE = {
      niebla: `🔥 ${info.edad}: TODO el universo es una niebla caliente y brillante`,
      despeje: `✨ ${info.edad}: ¡se despeja la niebla! Esa primera luz es la FOTO BEBÉ del universo`,
      grumos: `🕸️ ${info.edad}: la gravedad hace crecer las arruguitas y se forman grumos`,
      galaxias: `🌌 ${info.edad}: los grumos ya son galaxias… y el espacio se sigue estirando HOY`,
    };
    etiqueta = (
      <>
        <div className="espacio3d-fase">
          {alterno ? `🎭 EL MITO: una bola explotando (${info.edad})` : TXT_FASE[info.fase]}
        </div>
        <div className="espacio3d-subfase">
          {alterno
            ? 'Si fuera así, habría un CENTRO y una ORILLA. Múdate de galaxia y búscalas… En el universo real nadie las ha encontrado jamás.'
            : '📍 El punto dorado eres TÚ. No es una explosión EN el espacio: es el espacio ESTIRÁNDOSE, como pan con pasas en el horno.'}
        </div>
      </>
    );
  } else if (escena === 'nace-un-sol') {
    const info = naceSolInfoDe(angulo);
    const TXT_FASE = {
      nube: '☁️ Una nube de polvo y gas flota en el espacio: son CENIZAS de estrellas viejas',
      disco: '🌀 La nube cae sobre sí misma y al girar se APLANA: nace un disco',
      enciende: '🌞 El centro junta tanto material que se aprieta, se calienta y… ¡SE ENCIENDE!',
      planetas: '🪐 Las semillas de planeta barren sus carriles y dejan SURCOS en el disco',
    };
    etiqueta = (
      <>
        <div className="espacio3d-fase">{TXT_FASE[info.fase]}</div>
        <div className="espacio3d-subfase">
          {info.fase === 'planetas'
            ? '📸 Estos surcos no son un invento: el telescopio ALMA fotografió un disco REAL así (HL Tauri). Está pasando ahorita.'
            : '⭐ Así nacieron el Sol y la Tierra hace 4,600 millones de años — de polvo reciclado de otras estrellas.'}
        </div>
      </>
    );
  }

  return (
    <div className={`espacio3d ${fullscreen ? 'espacio3d-fullscreen' : ''}`}>
      <div className="espacio3d-vista">
        <div className="espacio3d-lienzo" ref={contenedorRef} />
        {conRecuadro && (
          <div className="espacio3d-inset-marco" style={{ width: INSET, height: INSET }}>
            <span className="espacio3d-inset-titulo">
              {escena === 'tierra-luna'
                ? 'Así se ve desde la Tierra'
                : escena === 'dia-noche'
                  ? 'Así se ve desde tu casa'
                  : 'Así pega la luz del Sol'}
            </span>
          </div>
        )}
      </div>

      {conSlider && (
          <div className="espacio3d-barra">
            <span className="espacio3d-extremo">{EXTREMOS[escena][0]}</span>
            <input
              type="range"
              className="espacio3d-slider"
              min={ESCALERAS.includes(escena) ? 1 : 0}
              max={SLIDER_MAX[escena] ?? 360}
              step={1}
              value={angulo}
              onChange={(e) => {
                setAngulo(Number(e.target.value));
                // Aqui el deslizador cambia las REGLAS del tiro (que tan
                // apretada esta la Tierra, cuanto pesa la bola, que tan grande
                // es la roca): el desenlace anterior ya no aplica y la
                // etiqueta vuelve a informar.
                if (escena === 'agujero-negro' || escena === 'cama-elastica' || escena === 'impacto') setResultado(null);
              }}
              aria-label={SLIDER_ETIQUETA[escena] || 'Mover con el deslizador'}
            />
            <span className="espacio3d-extremo">{EXTREMOS[escena][1]}</span>
            {BOTON_LANZAR[escena] && !BOTON_ALTERNO[escena] && (
              <button
                type="button"
                className="espacio3d-btn-lanzar"
                onClick={() => apiRef.current?.lanzar?.()}
              >
                {BOTON_LANZAR[escena]}
              </button>
            )}
          </div>
      )}

      {BOTON_ALTERNO[escena] && (
        <div className="espacio3d-botones">
          {BOTON_LANZAR[escena] && (
            <button
              type="button"
              className="espacio3d-btn-lanzar"
              onClick={() => apiRef.current?.lanzar?.()}
            >
              {BOTON_LANZAR[escena]}
            </button>
          )}
          <button
            type="button"
            className="espacio3d-btn-lanzar espacio3d-btn-alterno"
            onClick={() => {
              setAlterno((v) => !v);
              if (escena === 'impacto') setResultado(null);
            }}
          >
            {BOTON_ALTERNO[escena]}
          </button>
        </div>
      )}

      {etiqueta}

      <span className="espacio3d-pista">{PISTAS[escena]}</span>
    </div>
  );
});

export default Espacio3D;
