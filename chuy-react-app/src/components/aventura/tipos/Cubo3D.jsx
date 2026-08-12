import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import './Cubo3D.css';

/**
 * Cubo3D — toma el plano (desarrollo) de un cubo y lo dobla en 3D.
 *
 * La habilidad que se entrena en olimpiada es *rotacion mental de un solido*:
 * imaginar como se dobla un plano. Un dibujo isometrico congelado no deja
 * comprobar la hipotesis; aqui el nino ve el doblado y luego gira el cubo.
 *
 * Geometria 100% procedural (planos + lineas) y texturas dibujadas en canvas.
 * Cero archivos de modelo, cero texturas externas: el contenido sigue siendo
 * JSON generable a mano.
 *
 * Props:
 *   caras     — [{ id, fila, columna, contenido, color }]  (rejilla del plano)
 *   resaltar  — { [idCara]: '#hexcolor' }  borde de color en caras concretas
 *   autoDoblar— si true, arranca el doblado solo al montar
 *   etiqueta  — texto del boton principal (opcional)
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

/** Distancia de camara que encuadra una caja de ancho x alto con margen. */
const distanciaParaEncuadrar = (ancho, alto, aspecto, fovGrados) => {
  const tan = Math.tan((fovGrados * Math.PI) / 180 / 2);
  const distVertical = alto / 2 / tan;
  const distHorizontal = ancho / 2 / (aspecto * tan);
  return Math.max(distVertical, distHorizontal) * 1.25;
};

const FOV = 45;
const LUZ = new THREE.Vector3(0.4, 0.7, 1).normalize();
const suavizar = (t) => t * t * (3 - 2 * t); // smoothstep

// Se comprueba una sola vez por sesion, fuera de React.
let cacheWebGL = null;
const soportaWebGL = () => {
  if (cacheWebGL !== null) return cacheWebGL;
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2') || c.getContext('webgl');
    cacheWebGL = Boolean(ctx);
    // El navegador solo permite un puñado de contextos vivos: soltar el de prueba.
    ctx?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cacheWebGL = false;
  }
  return cacheWebGL;
};

const Cubo3D = ({ caras = [], resaltar = null, autoDoblar = false, etiqueta = null }) => {
  const contenedorRef = useRef(null);
  const escenaRef = useRef(null);
  const [doblado, setDoblado] = useState(autoDoblar);
  const soportado = soportaWebGL();

  // El objetivo del doblado vive en un ref para que el bucle de animacion lo lea
  // sin re-montar la escena en cada cambio de estado.
  const objetivoRef = useRef(autoDoblar ? 1 : 0);

  useEffect(() => {
    objetivoRef.current = doblado ? 1 : 0;
    if (escenaRef.current) escenaRef.current.marcarSucio();
  }, [doblado]);

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
    const matLinea = new THREE.LineBasicMaterial({ color: 0x2c3e50 });
    const texturas = [];
    const materiales = [];
    const mallas = []; // { mesh, mat } para el sombreado por normal

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
      g.add(new THREE.LineSegments(geoBordes, matLinea));
      texturas.push(tex);
      materiales.push(mat);
      mallas.push({ mesh, mat });
      return g;
    };

    // --- construir el arbol de bisagras ---
    const { raiz, orden } = construirArbol(caras);
    const grupos = new Map();
    grupos.set(clave(raiz.fila, raiz.columna), grupoRaiz);
    grupoRaiz.add(grupoDeCara(raiz));

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
      grupoHijo.add(grupoDeCara(cara));

      grupos.set(clave(cara.fila, cara.columna), grupoHijo);
      bisagras.push({ pivote, eje: b.eje, angulo: b.angulo });
    });

    // --- encuadre: el plano extendido y el cubo cerrado ocupan distinto espacio ---
    const alcanzadas = orden.map((o) => o.cara);
    const filas = alcanzadas.map((c) => c.fila);
    const columnas = alcanzadas.map((c) => c.columna);
    const anchoPlano = Math.max(...columnas) - Math.min(...columnas) + 1;
    const altoPlano = Math.max(...filas) - Math.min(...filas) + 1;
    // Centro del plano respecto de la cara raiz (fila crece hacia abajo = -Y)
    const centroPlanoX = (Math.min(...columnas) + Math.max(...columnas)) / 2 - raiz.columna;
    const centroPlanoY = -((Math.min(...filas) + Math.max(...filas)) / 2 - raiz.fila);
    // Cerrado, el cubo ocupa z ∈ [-1, 0] → su centro esta en (0, 0, -0.5)
    const DIAGONAL_CUBO = 1.9;

    let aspecto = 1;
    const distPlano = () => distanciaParaEncuadrar(anchoPlano, altoPlano, aspecto, FOV);
    const distCubo = () => distanciaParaEncuadrar(DIAGONAL_CUBO, DIAGONAL_CUBO, aspecto, FOV);

    // --- estado de interaccion ---
    // Siempre se arranca extendido: ver el plano doblarse es justo lo que
    // enseña, asi que ni con autoDoblar aparece el cubo ya hecho.
    let t = 0; // 0 = plano extendido, 1 = cubo cerrado
    let sucio = true;
    // Orientacion libre por cuaternion. Un cubo no tiene "arriba", asi que no se
    // limita el giro: hay que poder llegar a cualquier cara y a cualquier esquina.
    const orientacion = new THREE.Quaternion();
    const giroDelta = new THREE.Quaternion();
    const EJE_X = new THREE.Vector3(1, 0, 0);
    const EJE_Y = new THREE.Vector3(0, 1, 0);
    const SENSIBILIDAD = 0.012; // rad por pixel (~180° en 260 px)
    let arrastrado = false; // si el usuario ya giro, dejamos de imponer la inclinacion
    let arrastrando = false;
    let volviendo = false;  // animacion de "recentrar la vista"
    let ultimo = { x: 0, y: 0 };

    const marcarSucio = () => { sucio = true; };
    const reiniciarVista = () => { volviendo = true; marcarSucio(); };

    const lienzo = renderer.domElement;
    const alBajar = (e) => {
      arrastrando = true;
      volviendo = false;
      ultimo = { x: e.clientX, y: e.clientY };
      lienzo.setPointerCapture?.(e.pointerId);
    };
    const alMover = (e) => {
      if (!arrastrando) return;
      const dx = e.clientX - ultimo.x;
      const dy = e.clientY - ultimo.y;
      ultimo = { x: e.clientX, y: e.clientY };
      if (!dx && !dy) return;
      arrastrado = true;
      // Premultiplicar por los ejes de la pantalla (no los del objeto): arrastrar
      // siempre gira en la direccion del dedo, sin bloqueo de cardan ni topes.
      giroDelta.setFromAxisAngle(EJE_Y, dx * SENSIBILIDAD);
      orientacion.premultiply(giroDelta);
      giroDelta.setFromAxisAngle(EJE_X, dy * SENSIBILIDAD);
      orientacion.premultiply(giroDelta);
      marcarSucio();
    };
    const alSoltar = (e) => {
      arrastrando = false;
      lienzo.releasePointerCapture?.(e.pointerId);
    };
    lienzo.addEventListener('pointerdown', alBajar);
    lienzo.addEventListener('pointermove', alMover);
    lienzo.addEventListener('pointerup', alSoltar);
    lienzo.addEventListener('pointercancel', alSoltar);

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
    let raf;

    const animar = () => {
      raf = requestAnimationFrame(animar);

      const objetivo = objetivoRef.current;
      if (Math.abs(objetivo - t) > 0.001) {
        t += (objetivo - t) * 0.09;
        sucio = true;
      } else if (t !== objetivo) {
        t = objetivo;
        sucio = true;
      }
      if (!sucio) return;
      sucio = false;

      const f = suavizar(Math.min(1, Math.max(0, t)));

      bisagras.forEach(({ pivote, eje, angulo }) => {
        pivote.rotation[eje] = angulo * f;
      });

      // Recentrar: del centro del plano al centro del cubo
      modelo.position.set(
        -centroPlanoX * (1 - f),
        -centroPlanoY * (1 - f),
        0.5 * f
      );

      // Inclinacion automatica mientras se dobla (hasta que el usuario gire)
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
      mundo.quaternion.copy(orientacion);

      camara.position.set(0, 0, distPlano() + (distCubo() - distPlano()) * f);
      camara.lookAt(0, 0, 0);
      camara.updateMatrixWorld();
      mundo.updateMatrixWorld(true);

      // Sombreado propio: un Lambert simple por cara, sin depender del sistema
      // de luces (asi el aspecto no cambia entre versiones de three).
      mallas.forEach(({ mesh, mat }) => {
        mesh.getWorldQuaternion(cuaternion);
        normal.set(0, 0, 1).applyQuaternion(cuaternion);
        mesh.getWorldPosition(posCara);
        haciaCamara.copy(camara.position).sub(posCara);
        if (normal.dot(haciaCamara) < 0) normal.negate();
        const intensidad = 0.74 + 0.26 * Math.max(0, normal.dot(LUZ));
        mat.color.setScalar(intensidad);
      });

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
      texturas.forEach((x) => x.dispose());
      materiales.forEach((x) => x.dispose());
      geoPlano.dispose();
      geoBordes.dispose();
      matLinea.dispose();
      renderer.dispose();
      if (lienzo.parentNode) lienzo.parentNode.removeChild(lienzo);
      escenaRef.current = null;
    };
    // Se reconstruye la escena solo si cambia el plano o el resaltado.
  }, [caras, resaltar]);

  const alternar = useCallback(() => setDoblado((v) => !v), []);
  const recentrar = useCallback(() => escenaRef.current?.reiniciarVista(), []);

  if (!soportado) {
    return (
      <div className="cubo3d-fallback">
        Este dispositivo no puede mostrar el cubo en 3D.
      </div>
    );
  }

  return (
    <div className="cubo3d">
      <div className="cubo3d-lienzo" ref={contenedorRef} />
      <div className="cubo3d-controles">
        <button type="button" className="cubo3d-btn" onClick={alternar}>
          {doblado ? '📄 Desdoblar' : etiqueta || '🎲 Doblar el cubo'}
        </button>
        <button
          type="button"
          className="cubo3d-btn cubo3d-btn-secundario"
          onClick={recentrar}
          title="Volver a la vista inicial"
        >
          ↺ Enderezar
        </button>
        <span className="cubo3d-pista">👆 Arrástralo para girarlo en cualquier dirección</span>
      </div>
    </div>
  );
};

export default Cubo3D;
