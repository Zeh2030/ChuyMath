import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { soportaWebGL } from '../../../utils/webgl';
import './Cubo3D.css';

/**
 * Cubo3D — toma el plano (desarrollo) de un cubo y lo dobla en 3D.
 *
 * La habilidad que se entrena en olimpiada es *rotacion mental de un solido*:
 * imaginar como se dobla un plano. Un dibujo isometrico congelado no deja
 * comprobar la hipotesis; aqui el nino dobla el plano solapa a solapa —
 * tocandolas directamente o con los controles — y luego gira el cubo.
 *
 * Geometria 100% procedural (planos + lineas) y texturas dibujadas en canvas.
 * Cero archivos de modelo, cero texturas externas: el contenido sigue siendo
 * JSON generable a mano.
 *
 * Props:
 *   caras     — [{ id, fila, columna, contenido, color }]  (rejilla del plano)
 *   resaltar  — { [idCara]: '#hexcolor' }  borde de color en caras concretas
 *   autoDoblar— si true, arranca ya doblado al montar
 *   etiqueta  — texto del boton principal cuando aun no se ha doblado nada
 */

// Como se pliega cada vecino respecto de su padre.
// El plano vive en XY (fila crece hacia abajo = -Y, columna hacia la derecha = +X)
// y todas las caras se doblan hacia atras (-Z), asi la cara raiz queda al frente
// mirando a la camara y el resto envuelve el cubo por detras.
const BISAGRAS = {
  derecha: { pos: [0.5, 0, 0], hijo: [0.5, 0, 0], eje: 'y', angulo: Math.PI / 2 },
  izquierda: { pos: [-0.5, 0, 0], hijo: [-0.5, 0, 0], eje: 'y', angulo: -Math.PI / 2 },
  arriba: { pos: [0, 0.5, 0], hijo: [0, 0.5, 0], eje: 'x', angulo: -Math.PI / 2 },
  abajo: { pos: [0, -0.5, 0], hijo: [0, -0.5, 0], eje: 'x', angulo: Math.PI / 2 },
};

const VECINOS = [
  { df: 0, dc: 1, dir: 'derecha' },
  { df: 0, dc: -1, dir: 'izquierda' },
  { df: -1, dc: 0, dir: 'arriba' },
  { df: 1, dc: 0, dir: 'abajo' },
];

const clave = (fila, columna) => `${fila},${columna}`;

/**
 * Arbol de doblado: recorre el plano en anchura desde la cara mas conectada
 * (normalmente el centro de la cruz) para que el arbol quede lo mas bajo posible.
 * Devuelve las caras alcanzables en orden de recorrido, cada una con el enlace
 * a su padre y la direccion de la bisagra.
 *
 * Ese orden es el que usan los botones y el deslizador: primero las solapas que
 * tocan la base, luego las que cuelgan de esas. Tocando se puede ir en cualquier
 * orden — cada bisagra fija su angulo de forma absoluta, no acumulada, asi que
 * el cubo final es el mismo se dobla como se dobla.
 */
const construirArbol = (caras) => {
  const mapa = new Map();
  caras.forEach((c) => mapa.set(clave(c.fila, c.columna), c));

  const gradoDe = (c) =>
    VECINOS.filter((v) => mapa.has(clave(c.fila + v.df, c.columna + v.dc))).length;

  let raiz = caras[0];
  let mejorGrado = -1;
  caras.forEach((c) => {
    const g = gradoDe(c);
    if (g > mejorGrado) {
      mejorGrado = g;
      raiz = c;
    }
  });

  const visitadas = new Set([clave(raiz.fila, raiz.columna)]);
  const orden = [{ cara: raiz, padre: null, dir: null }];
  const cola = [raiz];

  while (cola.length) {
    const actual = cola.shift();
    for (const v of VECINOS) {
      const k = clave(actual.fila + v.df, actual.columna + v.dc);
      if (visitadas.has(k) || !mapa.has(k)) continue;
      visitadas.add(k);
      const cara = mapa.get(k);
      orden.push({ cara, padre: actual, dir: v.dir });
      cola.push(cara);
    }
  }

  return { raiz, orden };
};

/** Textura de una cara: color de fondo, borde y el simbolo/emoji centrado. */
const crearTexturaCara = (contenido, color, colorResalte) => {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color || '#ffffff';
  ctx.fillRect(0, 0, S, S);

  ctx.strokeStyle = colorResalte || 'rgba(44, 62, 80, 0.35)';
  ctx.lineWidth = colorResalte ? 22 : 8;
  const m = ctx.lineWidth / 2;
  ctx.strokeRect(m, m, S - ctx.lineWidth, S - ctx.lineWidth);

  if (contenido !== undefined && contenido !== null && String(contenido) !== '') {
    ctx.font = '150px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText(String(contenido), S / 2, S / 2 + 6);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
};

const FOV = 45;
const MARGEN_ENCUADRE = 1.10;
const ESQUINAS_CARA = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
const LUZ = new THREE.Vector3(0.4, 0.7, 1).normalize();
const suavizar = (t) => t * t * (3 - 2 * t); // smoothstep
const COL_BORDE = new THREE.Color(0x2c3e50);
const COL_ACTIVA = new THREE.Color(0xf39c12); // la solapa que se esta doblando
const COL_PISTA = new THREE.Color(0x8e44ad);  // latido de "tocame"
const COL_HOVER = new THREE.Color(0x3498db);
const VELOCIDAD = 0.03;      // avance por frame: ~0,55 s por pliegue
const UMBRAL_TOQUE = 6;      // px; por debajo de esto es un toque, no un arrastre
const PISTA_MS = 15000;      // el latido se apaga solo, para no gastar bateria

const Cubo3D = ({ caras = [], resaltar = null, autoDoblar = false, etiqueta = null }) => {
  const contenedorRef = useRef(null);
  const escenaRef = useRef(null);
  const soportado = soportaWebGL();

  // Numero de pliegues = bisagras = caras alcanzables - 1. Se usa la MISMA
  // funcion que monta la escena para que no se desincronicen (importa cuando el
  // plano esta desconectado y no todas las caras son alcanzables).
  const totalPliegues = useMemo(
    () => (caras.length ? construirArbol(caras).orden.length - 1 : 0),
    [caras]
  );

  // La verdad es UN OBJETIVO POR BISAGRA (0 = abierta, 1 = cerrada). Todos los
  // controles escriben aqui, asi que no hay estados en conflicto: tocar una
  // solapa cambia una, el deslizador las pone todas segun la secuencia guiada.
  const [objetivos, setObjetivos] = useState(() =>
    Array.from({ length: totalPliegues }, () => (autoDoblar ? 1 : 0))
  );
  const objetivosRef = useRef(objetivos);
  const inmediatoRef = useRef(false); // el deslizador aplica sin animar

  // Si cambiara el plano, la longitud dejaria de cuadrar (no deberia pasar: el
  // padre le da una `key` por ejercicio). Se cae con gracia a "nada doblado".
  const objetivosSeguros =
    objetivos.length === totalPliegues ? objetivos : Array(totalPliegues).fill(0);

  useEffect(() => {
    objetivosRef.current = objetivosSeguros;
    if (escenaRef.current) escenaRef.current.marcarSucio();
  }, [objetivosSeguros]);

  /** Tocar una solapa la dobla; volver a tocarla la desdobla. */
  const alternarSolapa = useCallback((indice) => {
    setObjetivos((prev) => {
      if (indice < 0 || indice >= prev.length) return prev;
      const sig = prev.slice();
      sig[indice] = sig[indice] > 0.5 ? 0 : 1;
      return sig;
    });
  }, []);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || caras.length === 0) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return undefined; // ya se comprobo WebGL antes de montar; esto es el cinturon
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);
    contenedor.appendChild(renderer.domElement);

    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    // Grupo giratorio (arrastre del usuario) → modelo (recentrado) → raiz
    const mundo = new THREE.Group();
    const modelo = new THREE.Group();
    const grupoRaiz = new THREE.Group();
    modelo.add(grupoRaiz);
    mundo.add(modelo);
    escena.add(mundo);

    // --- geometria y materiales compartidos ---
    const geoPlano = new THREE.PlaneGeometry(1, 1);
    const geoBordes = new THREE.EdgesGeometry(geoPlano);
    const texturas = [];
    const materiales = [];
    const mallas = [];        // meshes, para raycast y sombreado
    const porMalla = new Map(); // mesh -> indice de bisagra (la raiz no tiene)

    const grupoDeCara = (cara) => {
      const g = new THREE.Group();
      const tex = crearTexturaCara(cara.contenido, cara.color, resaltar?.[cara.id]);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      const mesh = new THREE.Mesh(geoPlano, mat);
      g.add(mesh);
      // Un material de linea POR CARA: asi se puede resaltar la que se dobla.
      const matLinea = new THREE.LineBasicMaterial({ color: COL_BORDE.getHex() });
      g.add(new THREE.LineSegments(geoBordes, matLinea));
      texturas.push(tex);
      materiales.push(mat, matLinea);
      mallas.push(mesh);
      return { grupo: g, mesh, mat, matLinea };
    };

    // --- construir el arbol de bisagras ---
    const { raiz, orden } = construirArbol(caras);
    const grupos = new Map();
    grupos.set(clave(raiz.fila, raiz.columna), grupoRaiz);
    const visualRaiz = grupoDeCara(raiz);
    grupoRaiz.add(visualRaiz.grupo);
    porMalla.set(visualRaiz.mesh, -1); // la base no se dobla

    const bisagras = [];
    orden.slice(1).forEach(({ cara, padre, dir }) => {
      const b = BISAGRAS[dir];
      const grupoPadre = grupos.get(clave(padre.fila, padre.columna));
      const pivote = new THREE.Group();
      pivote.position.set(...b.pos);
      grupoPadre.add(pivote);

      const grupoHijo = new THREE.Group();
      grupoHijo.position.set(...b.hijo);
      pivote.add(grupoHijo);
      const visual = grupoDeCara(cara);
      grupoHijo.add(visual.grupo);

      grupos.set(clave(cara.fila, cara.columna), grupoHijo);
      porMalla.set(visual.mesh, bisagras.length);
      bisagras.push({
        pivote,
        eje: b.eje,
        angulo: b.angulo,
        matLinea: visual.matLinea,
        mat: visual.mat,
        mesh: visual.mesh,
      });
    });

    const N = bisagras.length;
    const factores = new Array(N).fill(autoDoblar ? 1 : 0);

    // --- estado de interaccion ---
    let sucio = true;
    let aspecto = 1;
    let distancia = 0; // se fija en el primer frame
    const nacimiento = performance.now();
    // Orientacion libre por cuaternion. Un cubo no tiene "arriba", asi que no se
    // limita el giro: hay que poder llegar a cualquier cara y a cualquier esquina.
    const orientacion = new THREE.Quaternion();
    const giroDelta = new THREE.Quaternion();
    const EJE_X = new THREE.Vector3(1, 0, 0);
    const EJE_Y = new THREE.Vector3(0, 1, 0);
    const SENSIBILIDAD = 0.012; // rad por pixel (~180° en 260 px)
    let arrastrado = false; // si el usuario ya giro, dejamos de imponer la inclinacion
    let volviendo = false;  // animacion de "recentrar la vista"
    let gesto = null;       // { x, y, movido, capturado }
    let hover = -1;         // bisagra bajo el puntero

    const marcarSucio = () => { sucio = true; };
    const reiniciarVista = () => { volviendo = true; marcarSucio(); };

    // --- raycast: que solapa hay bajo el dedo ---
    const rayo = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const lienzo = renderer.domElement;

    const bisagraEn = (e) => {
      const r = lienzo.getBoundingClientRect();
      if (!r.width || !r.height) return -1;
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      rayo.setFromCamera(ndc, camara);
      const impactos = rayo.intersectObjects(mallas, false);
      if (!impactos.length) return -1;
      const i = porMalla.get(impactos[0].object);
      return i === undefined ? -1 : i;
    };

    const alBajar = (e) => {
      volviendo = false;
      // Aun NO se captura el puntero: capturarlo antes convierte cualquier toque
      // en arrastre. Se captura abajo, en cuanto el gesto deja de ser un toque.
      gesto = { x: e.clientX, y: e.clientY, movido: 0, capturado: false };
    };

    const alMover = (e) => {
      if (!gesto) {
        // Sin boton pulsado: solo resaltar la solapa bajo el puntero
        const i = bisagraEn(e);
        if (i !== hover) {
          hover = i;
          lienzo.style.cursor = i >= 0 ? 'pointer' : 'grab';
          marcarSucio();
        }
        return;
      }
      const dx = e.clientX - gesto.x;
      const dy = e.clientY - gesto.y;
      gesto.movido = Math.max(gesto.movido, Math.abs(dx) + Math.abs(dy));
      if (gesto.movido <= UMBRAL_TOQUE) return; // todavia puede ser un toque

      if (!gesto.capturado) {
        gesto.capturado = true;
        hover = -1;
        try { lienzo.setPointerCapture?.(e.pointerId); } catch { /* da igual */ }
      }
      // Premultiplicar por los ejes de la pantalla (no los del objeto): arrastrar
      // siempre gira en la direccion del dedo, sin bloqueo de cardan ni topes.
      arrastrado = true;
      giroDelta.setFromAxisAngle(EJE_Y, (e.clientX - (gesto.ultimoX ?? gesto.x)) * SENSIBILIDAD);
      orientacion.premultiply(giroDelta);
      giroDelta.setFromAxisAngle(EJE_X, (e.clientY - (gesto.ultimoY ?? gesto.y)) * SENSIBILIDAD);
      orientacion.premultiply(giroDelta);
      gesto.ultimoX = e.clientX;
      gesto.ultimoY = e.clientY;
      marcarSucio();
    };

    const alSoltar = (e) => {
      const g = gesto;
      gesto = null;
      if (!g) return;
      if (g.capturado) {
        try { lienzo.releasePointerCapture?.(e.pointerId); } catch { /* ya liberado */ }
        return;
      }
      // Fue un toque: doblar o desdoblar esa solapa
      const i = bisagraEn(e);
      if (i >= 0) alternarSolapa(i);
    };

    const alSalir = () => {
      if (hover !== -1) { hover = -1; marcarSucio(); }
      lienzo.style.cursor = 'grab';
    };

    lienzo.addEventListener('pointerdown', alBajar);
    lienzo.addEventListener('pointermove', alMover);
    lienzo.addEventListener('pointerup', alSoltar);
    lienzo.addEventListener('pointercancel', alSoltar);
    lienzo.addEventListener('pointerleave', alSalir);

    // --- tamano ---
    const redimensionar = () => {
      const w = contenedor.clientWidth;
      const h = contenedor.clientHeight;
      if (!w || !h) return;
      aspecto = w / h;
      camara.aspect = aspecto;
      camara.updateProjectionMatrix();
      // Sin el tercer argumento, three ademas fija el tamaño CSS del canvas.
      // Con `false` solo ajustaba el buffer (w × devicePixelRatio) y el canvas
      // se mostraba al doble de tamaño, recortado por el contenedor.
      renderer.setSize(w, h);
      marcarSucio();
    };
    redimensionar();
    const observador = new ResizeObserver(redimensionar);
    observador.observe(contenedor);

    // --- bucle ---
    const eulerInicial = new THREE.Euler();
    const vistaInicial = new THREE.Quaternion();
    const normal = new THREE.Vector3();
    const posCara = new THREE.Vector3();
    const haciaCamara = new THREE.Vector3();
    const cuaternion = new THREE.Quaternion();
    const caja = new THREE.Box3();
    const centro = new THREE.Vector3();
    const punto = new THREE.Vector3();
    const colorTmp = new THREE.Color();
    const puntos = [];
    let raf;

    /**
     * Encuadre MEDIDO. Antes se interpolaba la camara entre dos extremos ("plano
     * extendido" y "cubo cerrado") segun el avance; en cuanto las solapas se
     * doblan por separado eso no vale, porque no hay un "avance" unico. Ahora se
     * miden las esquinas reales, se centra el modelo en su caja y se despeja la
     * distancia exacta, sea cual sea la combinacion de solapas dobladas.
     *
     * Un punto (x,y,z) entra en el cuadro si |y| <= (d-z)·tan y |x| <= (d-z)·tan·aspecto,
     * luego d >= z + max(|y|/tan, |x|/(tan·aspecto)) para todos los puntos.
     */
    const medirYEncuadrar = (salto) => {
      // Medir sin la rotacion del usuario: las coordenadas del modelo tal cual.
      modelo.position.set(0, 0, 0);
      mundo.quaternion.identity();
      mundo.updateMatrixWorld(true);

      puntos.length = 0;
      for (const mesh of mallas) {
        for (const [ex, ey] of ESQUINAS_CARA) {
          puntos.push(punto.set(ex, ey, 0).applyMatrix4(mesh.matrixWorld).clone());
        }
      }
      caja.setFromPoints(puntos);
      caja.getCenter(centro);

      // Ahora si: centrar y aplicar el giro real
      modelo.position.copy(centro).negate();
      mundo.quaternion.copy(orientacion);

      const tan = Math.tan((FOV * Math.PI) / 180 / 2);
      let necesaria = -Infinity;
      for (const p of puntos) {
        punto.copy(p).sub(centro).applyQuaternion(orientacion);
        necesaria = Math.max(
          necesaria,
          punto.z + Math.max(Math.abs(punto.y) / tan, Math.abs(punto.x) / (tan * aspecto))
        );
      }
      necesaria *= MARGEN_ENCUADRE;

      if (distancia === 0 || salto) {
        // Primer frame, o el deslizador acaba de saltar: la camara salta con el
        // modelo. Si solo creciera un 30% por frame, recortaria unos instantes.
        distancia = necesaria;
      } else if (necesaria > distancia) {
        // Alejarse AL INSTANTE. Con un 30% por frame se quedaba corta cuando una
        // solapa se abre deprisa y el modelo se salia hasta un 6%. No produce
        // saltos porque `necesaria` cambia de forma continua.
        distancia = necesaria;
      } else if (!gesto?.capturado) {
        // Acercarse despacio, y solo con el dedo levantado: al girar el cubo la
        // distancia necesaria oscila ~33% y la camara "respiraria" sin parar.
        distancia += (necesaria - distancia) * 0.12;
      }
      if (Math.abs(necesaria - distancia) > 0.001) sucio = true;
    };

    const animar = () => {
      raf = requestAnimationFrame(animar);
      const objetivos = objetivosRef.current;
      const ahora = performance.now();

      let salto = false;
      if (inmediatoRef.current) { inmediatoRef.current = false; salto = true; }

      // Cada bisagra persigue su propio objetivo, a velocidad constante
      let suma = 0;
      for (let i = 0; i < N; i++) {
        const obj = Math.min(1, Math.max(0, objetivos[i] ?? 0));
        const d = obj - factores[i];
        if (salto) {
          if (factores[i] !== obj) { factores[i] = obj; sucio = true; }
        } else if (Math.abs(d) > 0.0005) {
          factores[i] += Math.sign(d) * Math.min(Math.abs(d), VELOCIDAD);
          sucio = true;
        } else if (factores[i] !== obj) {
          factores[i] = obj;
          sucio = true;
        }
        suma += factores[i];
      }

      // Latido de "tocame" mientras no se haya doblado nada. Se apaga solo a los
      // 15 s para no tener el bucle dibujando indefinidamente.
      const pista = suma < 0.001 && ahora - nacimiento < PISTA_MS;
      if (pista) sucio = true;

      if (!sucio) return;
      sucio = false;

      const latido = pista ? 0.5 + 0.5 * Math.sin(ahora / 380) : 0;
      let hayActiva = false;

      bisagras.forEach(({ pivote, eje, angulo, matLinea }, i) => {
        const v = factores[i];
        pivote.rotation[eje] = angulo * suavizar(v);
        const enMovimiento = v > 0.02 && v < 0.98;
        if (enMovimiento) hayActiva = true;
        if (enMovimiento) matLinea.color.copy(COL_ACTIVA);
        else if (hover === i) matLinea.color.copy(COL_HOVER);
        else if (pista) matLinea.color.copy(colorTmp.copy(COL_BORDE).lerp(COL_PISTA, latido));
        else matLinea.color.copy(COL_BORDE);
      });

      // Inclinacion automatica mientras se dobla (hasta que el usuario gire)
      const f = N ? suma / N : 0;
      eulerInicial.set(-0.32 * f, 0.62 * f, 0);
      if (!arrastrado) {
        orientacion.setFromEuler(eulerInicial);
      } else if (volviendo) {
        vistaInicial.setFromEuler(eulerInicial);
        orientacion.slerp(vistaInicial, 0.16);
        if (orientacion.angleTo(vistaInicial) < 0.01) {
          orientacion.copy(vistaInicial);
          arrastrado = false;
          volviendo = false;
        }
        sucio = true;
      }

      medirYEncuadrar(salto);

      camara.position.set(0, 0, distancia);
      camara.lookAt(0, 0, 0);
      camara.updateMatrixWorld();
      mundo.updateMatrixWorld(true);

      // Sombreado propio: un Lambert simple por cara, sin depender del sistema
      // de luces (asi el aspecto no cambia entre versiones de three).
      for (let k = 0; k < mallas.length; k++) {
        const mesh = mallas[k];
        const mat = mesh.material;
        mesh.getWorldQuaternion(cuaternion);
        normal.set(0, 0, 1).applyQuaternion(cuaternion);
        mesh.getWorldPosition(posCara);
        haciaCamara.copy(camara.position).sub(posCara);
        if (normal.dot(haciaCamara) < 0) normal.negate();
        let intensidad = 0.74 + 0.26 * Math.max(0, normal.dot(LUZ));
        // Mientras una solapa se mueve, las demas se apagan un poco para que el
        // ojo siga a la que se esta doblando.
        const idx = porMalla.get(mesh);
        const esActiva = idx >= 0 && factores[idx] > 0.02 && factores[idx] < 0.98;
        if (hayActiva && !esActiva) intensidad *= 0.78;
        if (idx >= 0 && idx === hover) intensidad = Math.min(1, intensidad * 1.12);
        mat.color.setScalar(intensidad);
      }

      renderer.render(escena, camara);
    };
    animar();

    escenaRef.current = { marcarSucio, reiniciarVista };

    return () => {
      cancelAnimationFrame(raf);
      observador.disconnect();
      lienzo.removeEventListener('pointerdown', alBajar);
      lienzo.removeEventListener('pointermove', alMover);
      lienzo.removeEventListener('pointerup', alSoltar);
      lienzo.removeEventListener('pointercancel', alSoltar);
      lienzo.removeEventListener('pointerleave', alSalir);
      texturas.forEach((x) => x.dispose());
      materiales.forEach((x) => x.dispose());
      geoPlano.dispose();
      geoBordes.dispose();
      renderer.dispose();
      if (lienzo.parentNode) lienzo.parentNode.removeChild(lienzo);
      escenaRef.current = null;
    };
    // Se reconstruye la escena solo si cambia el plano o el resaltado. Mover el
    // deslizador o tocar una solapa re-renderiza el componente pero NO rehace la
    // escena (`alternarSolapa` es estable).
  }, [caras, resaltar, autoDoblar, alternarSolapa]);

  // --- controles ---
  const dobladas = objetivosSeguros.filter((v) => v > 0.999).length;
  const suma = objetivosSeguros.reduce((a, b) => a + b, 0);
  const cerrado = totalPliegues > 0 && dobladas === totalPliegues;
  const enElPlano = suma <= 0.001;

  /** El deslizador toma el mando: pone TODAS las bisagras segun la secuencia. */
  const alDeslizar = useCallback((e) => {
    const k = Number(e.target.value);
    inmediatoRef.current = true; // el dedo del niño ya es la animacion
    setObjetivos((prev) =>
      prev.map((_, i) => Math.min(1, Math.max(0, k - i)))
    );
  }, []);

  // Los botones avanzan por el orden normal: la primera que falte / la ultima puesta
  const avanzar = useCallback(() => {
    setObjetivos((prev) => {
      const i = prev.findIndex((v) => v < 0.999);
      if (i === -1) return prev;
      const sig = prev.slice();
      sig[i] = 1;
      return sig;
    });
  }, []);

  const retroceder = useCallback(() => {
    setObjetivos((prev) => {
      let i = -1;
      prev.forEach((v, k) => { if (v > 0.001) i = k; });
      if (i === -1) return prev;
      const sig = prev.slice();
      sig[i] = 0;
      return sig;
    });
  }, []);

  const desdoblar = useCallback(() => setObjetivos((prev) => prev.map(() => 0)), []);
  const recentrar = useCallback(() => escenaRef.current?.reiniciarVista(), []);

  if (!soportado) {
    return (
      <div className="cubo3d-fallback">
        Este dispositivo no puede mostrar el cubo en 3D.
      </div>
    );
  }

  const etiquetaPaso = enElPlano
    ? 'Toca una solapa para doblarla'
    : cerrado
      ? (totalPliegues < 5 ? '¡Cerrado! (es un tubo)' : '¡Cubo cerrado!')
      : `${dobladas} de ${totalPliegues} solapas dobladas`;

  return (
    <div className="cubo3d">
      <div className="cubo3d-lienzo" ref={contenedorRef} />

      {totalPliegues > 0 && (
        <div className="cubo3d-barra">
          <span className="cubo3d-extremo">plano</span>
          <input
            type="range"
            className="cubo3d-slider"
            min={0}
            max={totalPliegues}
            step={0.01}
            value={suma}
            onChange={alDeslizar}
            aria-label="Doblar el plano"
          />
          <span className="cubo3d-extremo">cubo</span>
        </div>
      )}

      <div className={`cubo3d-contador ${cerrado ? 'cubo3d-contador-fin' : ''}`}>
        {etiquetaPaso}
      </div>

      <div className="cubo3d-controles">
        <button
          type="button"
          className="cubo3d-btn cubo3d-btn-icono"
          onClick={retroceder}
          disabled={enElPlano}
          title="Deshacer un pliegue"
          aria-label="Deshacer un pliegue"
        >
          ◀
        </button>

        {cerrado ? (
          <button type="button" className="cubo3d-btn" onClick={desdoblar}>
            📄 Desdoblar
          </button>
        ) : (
          <button type="button" className="cubo3d-btn" onClick={avanzar}>
            {enElPlano ? etiqueta || '🎲 Doblar' : '🎲 Doblar ▶'}
          </button>
        )}

        <button
          type="button"
          className="cubo3d-btn cubo3d-btn-secundario"
          onClick={recentrar}
          title="Volver a la vista inicial"
        >
          ↺ Enderezar
        </button>
      </div>

      <span className="cubo3d-pista">
        👆 Toca una solapa para doblarla · arrastra para girar el cubo
      </span>
    </div>
  );
};

export default Cubo3D;
