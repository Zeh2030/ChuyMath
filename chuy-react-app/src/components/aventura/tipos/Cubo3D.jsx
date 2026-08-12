import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import './Cubo3D.css';

/**
 * Cubo3D — toma el plano (desarrollo) de un cubo y lo dobla en 3D.
 *
 * La habilidad que se entrena en olimpiada es *rotacion mental de un solido*:
 * imaginar como se dobla un plano. Un dibujo isometrico congelado no deja
 * comprobar la hipotesis; aqui el nino dobla el plano UNA SOLAPA A LA VEZ y
 * luego gira el cubo.
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
 * Ese orden es tambien el orden en que se doblan las solapas: primero las que
 * tocan la base, luego las que cuelgan de esas. Igual que doblarias el papel.
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
const COLOR_BORDE = 0x2c3e50;
const COLOR_BORDE_ACTIVO = 0xf39c12; // la solapa que se esta doblando
const VELOCIDAD = 0.03; // avance por frame: ~0,55 s por pliegue

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
  const soportado = soportaWebGL();

  // Numero de pliegues = bisagras = caras alcanzables - 1. Se usa la MISMA
  // funcion que monta la escena para que no se desincronicen (importa cuando el
  // plano esta desconectado y no todas las caras son alcanzables).
  const totalPliegues = useMemo(
    () => (caras.length ? construirArbol(caras).orden.length - 1 : 0),
    [caras]
  );

  // `paso` es float: los botones lo mueven de uno en uno y el deslizador con decimales.
  const [paso, setPaso] = useState(autoDoblar ? totalPliegues : 0);
  const objetivoRef = useRef(autoDoblar ? totalPliegues : 0);
  const inmediatoRef = useRef(false); // el deslizador aplica sin animar

  useEffect(() => {
    objetivoRef.current = paso;
    if (escenaRef.current) escenaRef.current.marcarSucio();
  }, [paso]);

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
      // Un material de linea POR CARA: asi se puede resaltar la que se dobla.
      const matLinea = new THREE.LineBasicMaterial({ color: COLOR_BORDE });
      g.add(new THREE.LineSegments(geoBordes, matLinea));
      texturas.push(tex);
      materiales.push(mat, matLinea);
      mallas.push({ mesh, mat });
      return { grupo: g, mesh, mat, matLinea };
    };

    // --- construir el arbol de bisagras ---
    const { raiz, orden } = construirArbol(caras);
    const grupos = new Map();
    grupos.set(clave(raiz.fila, raiz.columna), grupoRaiz);
    grupoRaiz.add(grupoDeCara(raiz).grupo);

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
      bisagras.push({
        pivote,
        eje: b.eje,
        angulo: b.angulo,
        matLinea: visual.matLinea, // el borde que se resalta al doblarla
        mat: visual.mat,
      });
    });

    const N = bisagras.length;

    // --- estado de interaccion ---
    // Siempre se arranca extendido: ver el plano doblarse es justo lo que
    // enseña, asi que ni con autoDoblar aparece el cubo ya hecho.
    let progreso = 0; // 0 = plano extendido, N = cubo cerrado
    let sucio = true;
    let aspecto = 1;
    let distancia = 0; // se fija en el primer frame
    // Orientacion libre por cuaternion. Un cubo no tiene "arriba", asi que no se
    // limita el giro: hay que poder llegar a cualquier cara y a cualquier esquina.
    const orientacion = new THREE.Quaternion();
    const giroDelta = new THREE.Quaternion();
    const EJE_X = new THREE.Vector3(1, 0, 0);
    const EJE_Y = new THREE.Vector3(0, 1, 0);
    const SENSIBILIDAD = 0.012; // rad por pixel (~180° en 260 px)
    let arrastrado = false; // si el usuario ya giro, dejamos de imponer la inclinacion
    let arrastrando = false;
    let volviendo = false; // animacion de "recentrar la vista"
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
    const caja = new THREE.Box3();
    const centro = new THREE.Vector3();
    const punto = new THREE.Vector3();
    const puntos = []; // esquinas del modelo, se reutiliza el array
    let raf;

    /**
     * Encuadre MEDIDO. Antes se interpolaba la camara entre dos extremos ("plano
     * extendido" y "cubo cerrado") segun el avance; al doblar solapa a solapa eso
     * se rompe, porque a mitad de camino la camara ya se acerco pero la forma
     * sigue extendida (llegaba a salirse un 63%). Ahora se miden las esquinas
     * reales y se despeja la distancia exacta.
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
      for (const { mesh } of mallas) {
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
        // Alejarse rapido: nunca se debe recortar el modelo
        distancia += (necesaria - distancia) * 0.3;
      } else if (!arrastrando) {
        // Acercarse despacio, y solo con el dedo levantado: al girar el cubo la
        // distancia necesaria oscila ~33% y la camara "respiraria" sin parar.
        distancia += (necesaria - distancia) * 0.12;
      }
      if (Math.abs(necesaria - distancia) > 0.001) sucio = true;
    };

    const animar = () => {
      raf = requestAnimationFrame(animar);

      const objetivo = Math.min(N, Math.max(0, objetivoRef.current));
      let salto = false;
      if (inmediatoRef.current) {
        inmediatoRef.current = false;
        if (progreso !== objetivo) { progreso = objetivo; sucio = true; salto = true; }
      } else if (Math.abs(objetivo - progreso) > 0.0005) {
        // Velocidad constante: cada pliegue tarda lo mismo
        const d = objetivo - progreso;
        progreso += Math.sign(d) * Math.min(Math.abs(d), VELOCIDAD);
        sucio = true;
      }
      if (!sucio) return;
      sucio = false;

      // Cada bisagra tiene su propio tramo: la i se cierra de progreso i a i+1
      let activa = -1;
      bisagras.forEach(({ pivote, eje, angulo, matLinea }, i) => {
        const local = Math.min(1, Math.max(0, progreso - i));
        pivote.rotation[eje] = angulo * suavizar(local);
        const enMovimiento = local > 0.001 && local < 0.999;
        if (enMovimiento) activa = i;
        matLinea.color.setHex(enMovimiento ? COLOR_BORDE_ACTIVO : COLOR_BORDE);
      });

      // Inclinacion automatica mientras se dobla (hasta que el usuario gire)
      const f = N ? progreso / N : 0;
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
      const matActiva = activa >= 0 ? bisagras[activa].mat : null;
      mallas.forEach(({ mesh, mat }) => {
        mesh.getWorldQuaternion(cuaternion);
        normal.set(0, 0, 1).applyQuaternion(cuaternion);
        mesh.getWorldPosition(posCara);
        haciaCamara.copy(camara.position).sub(posCara);
        if (normal.dot(haciaCamara) < 0) normal.negate();
        let intensidad = 0.74 + 0.26 * Math.max(0, normal.dot(LUZ));
        // Mientras una solapa se mueve, las demas se apagan un poco para que el
        // ojo siga a la que se esta doblando.
        if (matActiva && mat !== matActiva) intensidad *= 0.78;
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
      renderer.dispose();
      if (lienzo.parentNode) lienzo.parentNode.removeChild(lienzo);
      escenaRef.current = null;
    };
    // Se reconstruye la escena solo si cambia el plano o el resaltado. Mover el
    // deslizador re-renderiza el componente pero NO rehace la escena.
  }, [caras, resaltar]);

  // --- controles ---
  const avanzar = useCallback(
    () => setPaso((p) => Math.min(totalPliegues, Math.floor(p + 1e-6) + 1)),
    [totalPliegues]
  );
  const retroceder = useCallback(
    () => setPaso((p) => Math.max(0, Math.ceil(p - 1e-6) - 1)),
    []
  );
  const desdoblar = useCallback(() => setPaso(0), []);
  const recentrar = useCallback(() => escenaRef.current?.reiniciarVista(), []);
  const alDeslizar = useCallback((e) => {
    inmediatoRef.current = true; // el dedo del niño ya es la animacion
    setPaso(Number(e.target.value));
  }, []);

  if (!soportado) {
    return (
      <div className="cubo3d-fallback">
        Este dispositivo no puede mostrar el cubo en 3D.
      </div>
    );
  }

  const cerrado = paso >= totalPliegues - 1e-6;
  const enElPlano = paso <= 1e-6;
  const etiquetaPaso = enElPlano
    ? 'Plano extendido'
    : cerrado
      ? (totalPliegues < 5 ? '¡Cerrado! (es un tubo)' : '¡Cubo cerrado!')
      : `Pliegue ${Math.ceil(paso - 1e-6)} de ${totalPliegues}`;

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
            value={paso}
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

      <span className="cubo3d-pista">👆 Arrástralo para girarlo en cualquier dirección</span>
    </div>
  );
};

export default Cubo3D;
