import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { soportaWebGL } from '../../../utils/webgl';
import { PLANETAS, SOL, faseInfoDe } from './espacioDatos';
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

  const casquetes = (c, alto) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, W, H * alto);
    ctx.fillRect(0, H * (1 - alto), W, H * alto);
  };

  switch (tex) {
    case 'sol':
      for (let i = 0; i < 50; i++) mancha(rng() * W, rng() * H, 6 + rng() * 14, 4 + rng() * 8, '#ffb020', 0.4);
      for (let i = 0; i < 18; i++) mancha(rng() * W, rng() * H, 3 + rng() * 8, 2 + rng() * 5, '#fff3a0', 0.5);
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
    case 'tierra':
      for (let i = 0; i < 9; i++) {
        const x = rng() * W;
        const y = H * 0.18 + rng() * H * 0.64;
        for (let j = 0; j < 3; j++) {
          mancha(x + (rng() - 0.5) * 30, y + (rng() - 0.5) * 16, 8 + rng() * 16, 6 + rng() * 10, '#4c9e46');
        }
      }
      casquetes('#f4f8ff', 0.09);
      for (let i = 0; i < 8; i++) mancha(rng() * W, rng() * H, 22 + rng() * 30, 3 + rng() * 4, 'rgba(255,255,255,0.35)');
      break;
    case 'marte':
      for (let i = 0; i < 18; i++) mancha(rng() * W, rng() * H, 6 + rng() * 16, 4 + rng() * 9, 'rgba(90,30,10,0.25)');
      casquetes('#fdf6ec', 0.07);
      break;
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

/* ============================ constantes ============================ */

const FOV = 45;
const UMBRAL_TOQUE = 6;   // px; por debajo es un toque, no un arrastre
const INSET = 140;        // px del recuadro "asi se ve desde la Tierra"
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

/* ============================ componente ============================ */

const Espacio3D = forwardRef(function Espacio3D(
  {
    escena = 'planetas',
    enfocado = null,      // id de cuerpo al que acercar la camara (planetas)
    comparar = false,     // modo "tamano real" en fila (planetas)
    seleccionable = true, // si tocar un cuerpo dispara onSeleccion
    onSeleccion = null,   // (idCuerpo) => {}
    onFase = null,        // (faseInfo) => {} en cada cambio del deslizador (tierra-luna)
  },
  ref
) {
  const contenedorRef = useRef(null);
  const apiRef = useRef(null);
  const soportado = soportaWebGL();

  // Posicion de la Luna en su orbita (grados desde la direccion del Sol).
  // Arranca en cuarto creciente para que se vea una fase "interesante".
  const [angulo, setAngulo] = useState(90);

  // El bucle lee las props cada frame sin reconstruir la escena.
  const estadoRef = useRef({ enfocado, comparar, seleccionable, angulo });
  useEffect(() => {
    estadoRef.current = { enfocado, comparar, seleccionable, angulo };
  }, [enfocado, comparar, seleccionable, angulo]);

  const onSeleccionRef = useRef(onSeleccion);
  const onFaseRef = useRef(onFase);
  useEffect(() => {
    onSeleccionRef.current = onSeleccion;
    onFaseRef.current = onFase;
  }, [onSeleccion, onFase]);

  // Avisar la fase visible al entrar y en cada movimiento del deslizador.
  useEffect(() => {
    if (escena === 'tierra-luna') onFaseRef.current?.(faseInfoDe(angulo));
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

    const crearGlow = (escala) => {
      const texGlow = registrar(crearTexturaGlow());
      const matGlow = registrar(new THREE.SpriteMaterial({
        map: texGlow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
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
    let glowSol = null;
    let tl = null;             // escena tierra-luna

    if (escena === 'planetas') {
      escena3.add(new THREE.AmbientLight(0xbfd0ff, 0.55));
      // Luz en el origen: los planetas se iluminan por el lado que mira al Sol.
      escena3.add(new THREE.PointLight(0xfff3d0, 2.4, 0, 0));

      const meshSol = crearCuerpo({ id: 'sol', radio: SOL.radio, tex: SOL.tex, color: SOL.color, semilla: 3, lambert: false });
      escena3.add(meshSol);
      cuerpos.push({ id: 'sol', mesh: meshSol, radio: SOL.radio, radioReal: SOL.radioReal, dist: 0, vel: 0, anguloOrbita: 0 });

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
        cuerpos.push({ ...p, mesh, anguloOrbita: rngAng() * Math.PI * 2 });

        const { linea, mat } = crearLineaOrbita(p.dist);
        escena3.add(linea);
        lineasOrbita.push(mat);
      });

      // Fila del modo comparar: Sol + planetas en orden, a radio REAL.
      const escalaReal = 0.9; // la Tierra didactica mide 0.9, asi que 1 radioReal = 0.9
      const HUECO = 3;
      let x = 0;
      let rPrevio = 0;
      const medias = new Map();
      let maxR = 0;
      cuerpos.forEach((c, i) => {
        const r = Math.max(c.radioReal * escalaReal, 0.12);
        if (i > 0) x += rPrevio + HUECO + r;
        medias.set(c.id, { x, r });
        rPrevio = r;
        maxR = Math.max(maxR, r);
      });
      const izquierda = medias.get(cuerpos[0].id).x - medias.get(cuerpos[0].id).r;
      const derecha = x + rPrevio;
      const centro = (izquierda + derecha) / 2;
      medias.forEach((m) => { m.x -= centro; });
      metricaComparar = { medias, halfW: (derecha - izquierda) / 2, maxR };
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

    /* --- camara orbital del usuario --- */
    const YAW0 = escena === 'planetas' ? 0.6 : 0.35;
    const PITCH0 = escena === 'planetas' ? 0.9 : 0.45;
    const DIST_BASE = escena === 'planetas' ? 60 : 24;
    let yaw = YAW0;
    let pitch = PITCH0;
    let zoomUsuario = 1;
    let aspecto = 1;
    let distSuave = DIST_BASE;
    const objetivoCam = new THREE.Vector3();

    const recentrar = () => {
      yaw = YAW0;
      pitch = PITCH0;
      zoomUsuario = 1;
    };
    apiRef.current = { recentrar };

    /* --- punteros: toque selecciona, arrastre gira, rueda acerca --- */
    const rayo = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const lienzo = renderer.domElement;
    let gesto = null;

    const cuerpoEn = (e) => {
      const r = lienzo.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      rayo.setFromCamera(ndc, camara);
      const impactos = rayo.intersectObjects(mallas, false);
      return impactos.length ? porMalla.get(impactos[0].object) ?? null : null;
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
      pitch = Math.min(1.45, Math.max(0.08, pitch));
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
      const id = cuerpoEn(e);
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

        cuerpos.forEach((c) => {
          if (c.vel) c.anguloOrbita += c.vel * VEL_ORBITAL * dt;
          const m = metricaComparar.medias.get(c.id);
          const ox = Math.cos(c.anguloOrbita) * c.dist;
          const oz = -Math.sin(c.anguloOrbita) * c.dist;
          c.mesh.position.set(ox + (m.x - ox) * mezcla, 0, oz * (1 - mezcla));
          c.mesh.scale.setScalar(c.radio + (m.r - c.radio) * mezcla);
          c.mesh.rotation.y += dt * 0.4;
        });
        lineasOrbita.forEach((mat) => { mat.opacity = 0.45 * (1 - mezcla); });

        const sol = cuerpos[0];
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
            metricaComparar.halfW / (tanFov * aspecto),
            (metricaComparar.maxR * 1.2) / tanFov
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
      } else {
        const a = (est.angulo * Math.PI) / 180;
        tl.luna.position.set(-Math.cos(a) * TL.orbitaLuna, 0, Math.sin(a) * TL.orbitaLuna);
        tl.luna.rotation.y = -a; // siempre da la misma cara a la Tierra
        tl.tierra.rotation.y += dt * 0.25;
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

      if (escena === 'tierra-luna') {
        // Recuadro "asi se ve desde la Tierra" en la esquina inferior derecha.
        const w = lienzo.clientWidth;
        tl.camFase.lookAt(tl.luna.position);
        renderer.setScissorTest(true);
        renderer.setViewport(w - INSET - 10, 10, INSET, INSET);
        renderer.setScissor(w - INSET - 10, 10, INSET, INSET);
        renderer.render(escena3, tl.camFase);
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

  const info = escena === 'tierra-luna' ? faseInfoDe(angulo) : null;

  return (
    <div className="espacio3d">
      <div className="espacio3d-vista">
        <div className="espacio3d-lienzo" ref={contenedorRef} />
        {escena === 'tierra-luna' && (
          <div className="espacio3d-inset-marco" style={{ width: INSET, height: INSET }}>
            <span className="espacio3d-inset-titulo">Así se ve desde la Tierra</span>
          </div>
        )}
      </div>

      {escena === 'tierra-luna' && (
        <>
          <div className="espacio3d-barra">
            <span className="espacio3d-extremo" title="La Luna cerca del Sol">🌞</span>
            <input
              type="range"
              className="espacio3d-slider"
              min={0}
              max={360}
              step={1}
              value={angulo}
              onChange={(e) => setAngulo(Number(e.target.value))}
              aria-label="Mover la Luna en su órbita"
            />
            <span className="espacio3d-extremo" title="La Luna lejos del Sol">🌙</span>
          </div>
          <div className={`espacio3d-fase ${info.eclipseSol || info.eclipseLuna ? 'eclipse' : ''}`}>
            {info.eclipseSol
              ? '🌑✨ ¡ECLIPSE DE SOL!'
              : info.eclipseLuna
                ? '🔴🌕 ¡ECLIPSE DE LUNA!'
                : `${info.emoji} ${info.nombre}`}
          </div>
        </>
      )}

      <span className="espacio3d-pista">
        {escena === 'planetas'
          ? '👆 Toca un planeta · arrastra para girar la vista'
          : '👆 Mueve el deslizador para llevar la Luna por su órbita · arrastra para girar'}
      </span>
    </div>
  );
});

export default Espacio3D;
