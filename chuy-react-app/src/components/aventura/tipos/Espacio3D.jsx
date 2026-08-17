import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { soportaWebGL } from '../../../utils/webgl';
import {
  PLANETAS, SOL, CONSTELACIONES, COMETA,
  ESTRELLAS_COMPARAR, PASOS_ESTRELLAS, ORBITAS_UA, UA_POR_RADIO_SOL,
  PLANETAS_ESCALERA, PASOS_EXOPLANETAS,
  faseInfoDe, estacionInfoDe, cometaInfoDe, etiquetaComparar, etiquetaEstrella, etiquetaExoplaneta,
} from './espacioDatos';
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
    if (escena === 'estrellas' || escena === 'exoplanetas') return 1; // primer escalon
    if (escena === 'agujero-negro') return 0; // la Tierra sin apretar todavia
    if (escena === 'cama-elastica') return 0; // espacio plano: sin peso al centro
    return 90;                               // cuarto creciente
  });

  // Desenlace del ultimo lanzamiento (solo escena satelite): lo escribe el bucle.
  const [resultado, setResultado] = useState(null);

  // Constelaciones: pista caliente/frio y nombre de la ultima estrella tocada.
  const [pistaConst, setPistaConst] = useState('frio');
  const [estrellaTocada, setEstrellaTocada] = useState(null);

  // El bucle lee las props cada frame sin reconstruir la escena.
  const estadoRef = useRef({ enfocado, comparar, ocultarSol, seleccionable, angulo });
  useEffect(() => {
    estadoRef.current = { enfocado, comparar, ocultarSol, seleccionable, angulo };
  }, [enfocado, comparar, ocultarSol, seleccionable, angulo]);

  const onSeleccionRef = useRef(onSeleccion);
  const onFaseRef = useRef(onFase);
  const onVistaRef = useRef(onVista);
  useEffect(() => {
    onSeleccionRef.current = onSeleccion;
    onFaseRef.current = onFase;
    onVistaRef.current = onVista;
  }, [onSeleccion, onFase, onVista]);

  // Avisar la fase/estacion/zona visible al entrar y con cada movimiento del deslizador.
  useEffect(() => {
    if (escena === 'tierra-luna') onFaseRef.current?.(faseInfoDe(angulo));
    if (escena === 'estaciones') onFaseRef.current?.(estacionInfoDe(angulo));
    if (escena === 'cometa') onFaseRef.current?.(cometaInfoDe(angulo));
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

    const crearCuerpo = ({ id, radio, tex, color, semilla, lambert = true, sombras = false }) => {
      const mapa = registrar(crearTexturaCuerpo({ tex, color, semilla }));
      const mat = registrar(lambert
        ? new THREE.MeshLambertMaterial({ map: mapa })
        : new THREE.MeshBasicMaterial({ map: mapa }));
      const mesh = new THREE.Mesh(geoEsfera, mat);
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

    const cuerpos = [];        // escena planetas
    const lineasOrbita = [];
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
    let etiquetaEstrellaEl = null; // constelaciones: nombre flotante de la estrella tocada
    let nombreFlotante = null;     // constelaciones: { pos, hasta } del nombre flotante

    // Capa DOM para etiquetas flotantes: un <span> por cuerpo, posicionado
    // cada frame proyectando su posicion 3D a pantalla. Vive fuera del canvas
    // para que el texto salga nitido a cualquier zoom (un sprite con textura
    // se veria pixelado). La usan el modo comparar (planetas), la escalera
    // de estrellas y constelaciones (nombres de estrellas y de figuras).
    let crearEtiqueta = null;
    if (escena === 'planetas' || escena === 'estrellas' || escena === 'exoplanetas' || escena === 'constelaciones') {
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
        cuerpos.push({ ...p, mesh, anguloOrbita: rngAng() * Math.PI * 2, etiquetaEl: crearEtiqueta(etiquetaComparar(p)) });

        const { linea, mat } = crearLineaOrbita(p.dist);
        escena3.add(linea);
        lineasOrbita.push(mat);
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

    if (escena === 'estrellas' || escena === 'exoplanetas') {
      // La Escalera (de estrellas o de planetas): comparacion por PASOS. En
      // cada escalon entra un cuerpo mas grande y TODO se re-escala (el mayor
      // del paso siempre mide ~RADIO_FILA unidades). Esa re-normalizacion es
      // la leccion: la referencia (el Sol / la Tierra) se va encogiendo a la
      // vista, escalon a escalon. Mismo motor, dos datasets.
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
        : {
          lista: PLANETAS_ESCALERA,
          radioDe: (e) => e.radioTierra,
          pasos: PASOS_EXOPLANETAS,
          etiquetaDe: etiquetaExoplaneta,
          conGlow: (e) => !!e.glow,
          idRef: 'tierra',
          textoRefChico: '🌍 la Tierra: ¡ya casi no se ve! 😱',
        };

      const RADIO_FILA = 9;
      const HUECO_FILA = 2.2;

      const ordenadas = [...cfg.lista].sort((a, b) => cfg.radioDe(a) - cfg.radioDe(b));
      const geoToque = registrar(new THREE.SphereGeometry(1, 12, 8));
      const matToqueEst = registrar(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      const matAnilloInterno = registrar(new THREE.LineBasicMaterial({
        color: 0xdfe8ff, transparent: true, opacity: 0.55, depthTest: false,
      }));

      const estrellas = ordenadas.map((e) => {
        const mesh = crearCuerpo({ id: e.id, radio: 1, tex: e.tex, color: e.color, semilla: 101 + e.paso, lambert: false });
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

        // Sin el Sol, la fila se calcula con SOLO los planetas: se puede
        // encuadrar mucho mas cerca y las diferencias entre ellos se notan.
        const metricaActiva = est.ocultarSol ? metricaCompararSinSol : metricaComparar;
        const wCanvas = lienzo.clientWidth;
        const hCanvas = lienzo.clientHeight;

        cuerpos.forEach((c) => {
          if (c.vel) c.anguloOrbita += c.vel * VEL_ORBITAL * dt;
          const solOculto = c.id === 'sol' && est.ocultarSol;
          const m = solOculto ? null : metricaActiva.medias.get(c.id);
          const ox = Math.cos(c.anguloOrbita) * c.dist;
          const oz = -Math.sin(c.anguloOrbita) * c.dist;
          if (m) {
            c.mesh.position.set(ox + (m.x - ox) * mezcla, 0, oz * (1 - mezcla));
            c.mesh.scale.setScalar(c.radio + (m.r - c.radio) * mezcla);
          } else {
            // Sol oculto: sigue orbitando fuera de cuadro, no importa porque
            // queda invisible (y fuera del raycast, ver cuerpoEn).
            c.mesh.position.set(ox, 0, oz);
          }
          c.mesh.rotation.y += dt * 0.4;
          c.mesh.visible = !solOculto;

          // Etiqueta flotante "×Tierra": solo visible con algo de mezcla y
          // con el cuerpo delante de la camara; se apaga si es el Sol oculto.
          if (!solOculto && mezcla > 0.02 && wCanvas && hCanvas) {
            vProy.copy(c.mesh.position);
            vProy.y += c.mesh.scale.x * 1.3; // un poco arriba del cuerpo
            vProy.project(camara);
            if (vProy.z < 1) {
              const px = (vProy.x * 0.5 + 0.5) * wCanvas;
              const py = (1 - (vProy.y * 0.5 + 0.5)) * hCanvas;
              c.etiquetaEl.style.transform = `translate(${px}px, ${py}px) translate(-50%, -100%)`;
              c.etiquetaEl.style.opacity = mezcla;
            } else {
              c.etiquetaEl.style.opacity = 0;
            }
          } else {
            c.etiquetaEl.style.opacity = 0;
          }
        });
        lineasOrbita.forEach((mat) => { mat.opacity = 0.45 * (1 - mezcla); });

        const sol = cuerpos[0];
        glowSol.visible = !est.ocultarSol;
        glowSol.position.copy(sol.mesh.position);
        glowSol.scale.setScalar(sol.mesh.scale.x * 4.6);

        if (mezcla > 0.05) {
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
      } else if (escena === 'estrellas' || escena === 'exoplanetas') {
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

      if (escena === 'tierra-luna' || escena === 'estaciones') {
        // Recuadro de la esquina inferior derecha.
        const w = lienzo.clientWidth;
        let camRecuadro;
        if (escena === 'tierra-luna') {
          // "Asi se ve desde la Tierra": camara dentro de la Tierra mirando la Luna.
          tl.camFase.lookAt(tl.luna.position);
          camRecuadro = tl.camFase;
        } else {
          // "Asi pega la luz": la Tierra vista desde el lado del Sol.
          const posT = escEst.grupoTierra.position;
          vTmp.copy(posT).normalize();
          escEst.camEst.position.copy(posT).addScaledVector(vTmp, -5.2);
          escEst.camEst.lookAt(posT);
          camRecuadro = escEst.camEst;
        }
        renderer.setScissorTest(true);
        renderer.setViewport(w - INSET - 10, 10, INSET, INSET);
        renderer.setScissor(w - INSET - 10, 10, INSET, INSET);
        renderer.render(escena3, camRecuadro);
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, lienzo.clientHeight);
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

  const conSlider = ['tierra-luna', 'estaciones', 'cometa', 'satelite', 'estrellas', 'exoplanetas', 'agujero-negro', 'cama-elastica'].includes(escena);
  const conRecuadro = escena === 'tierra-luna' || escena === 'estaciones';

  const PISTAS = {
    planetas: '👆 Toca un planeta · arrastra para girar la vista',
    'tierra-luna': '👆 Mueve el deslizador para llevar la Luna por su órbita · arrastra para girar',
    estaciones: '👆 Mueve el deslizador para recorrer el año · fíjate hacia dónde apunta el eje rojo',
    constelaciones: '👆 Arrastra la vista hasta que un dibujo de estrellas ENCAJE · toca una estrella para saber más',
    cometa: '👆 Mueve el deslizador para viajar con el cometa · mira hacia dónde apunta la cola',
    satelite: '👆 Elige la velocidad y ¡lanza! · arrastra para girar la vista',
    estrellas: '👆 Sube la escalera con el deslizador · toca una estrella para saber más',
    exoplanetas: '👆 Sube la escalera con el deslizador · toca un planeta para saber más',
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
    'agujero-negro': ['🌍', '🕳️'],
    'cama-elastica': ['🪶', '🐘'],
  };

  // El deslizador no siempre recorre una orbita: en algunas escenas es un
  // porcentaje (velocidad, apreton, peso) o un escalon de la escalera.
  const SLIDER_MAX = {
    satelite: 100,
    'agujero-negro': 100,
    'cama-elastica': 100,
    estrellas: PASOS_ESTRELLAS,
    exoplanetas: PASOS_EXOPLANETAS,
  };

  const SLIDER_ETIQUETA = {
    satelite: 'Velocidad de lanzamiento',
    estrellas: 'Subir la escalera de estrellas',
    exoplanetas: 'Subir la escalera de planetas',
    'agujero-negro': 'Apretar la Tierra',
    'cama-elastica': 'Peso de la bola',
  };

  // Escenas con boton de disparo (y el texto del boton).
  const BOTON_LANZAR = {
    satelite: '🚀 ¡Lanzar!',
    'agujero-negro': '💡 ¡Rayo de luz!',
    'cama-elastica': '🎱 ¡Rueda la canica!',
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
  }

  return (
    <div className={`espacio3d ${fullscreen ? 'espacio3d-fullscreen' : ''}`}>
      <div className="espacio3d-vista">
        <div className="espacio3d-lienzo" ref={contenedorRef} />
        {conRecuadro && (
          <div className="espacio3d-inset-marco" style={{ width: INSET, height: INSET }}>
            <span className="espacio3d-inset-titulo">
              {escena === 'tierra-luna' ? 'Así se ve desde la Tierra' : 'Así pega la luz del Sol'}
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
              min={escena === 'estrellas' || escena === 'exoplanetas' ? 1 : 0}
              max={SLIDER_MAX[escena] ?? 360}
              step={1}
              value={angulo}
              onChange={(e) => {
                setAngulo(Number(e.target.value));
                // Aqui el deslizador cambia las REGLAS del tiro (que tan
                // apretada esta la Tierra, cuanto pesa la bola): el desenlace
                // anterior ya no aplica y la etiqueta vuelve a informar.
                if (escena === 'agujero-negro' || escena === 'cama-elastica') setResultado(null);
              }}
              aria-label={SLIDER_ETIQUETA[escena] || 'Mover con el deslizador'}
            />
            <span className="espacio3d-extremo">{EXTREMOS[escena][1]}</span>
            {BOTON_LANZAR[escena] && (
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

      {etiqueta}

      <span className="espacio3d-pista">{PISTAS[escena]}</span>
    </div>
  );
});

export default Espacio3D;
