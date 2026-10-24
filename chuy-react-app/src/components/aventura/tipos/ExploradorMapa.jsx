import React, { useState, useEffect, useMemo, useRef } from 'react';
import { feature } from 'topojson-client';
import {
  geoNaturalEarth1, geoMercator, geoAlbersUsa, geoOrthographic,
  geoPath, geoGraticule, geoCentroid,
} from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';
import usaStatesData from 'us-atlas/states-10m.json';
import mexicoStatesData from './maps/mexico-estados.json';
import { PAISES, ESTADOS_USA, NOMBRES_MX, idPaisMundo, banderaUrl } from '../../../data/paises';
import './ExploradorMapa.css';

/**
 * ExploradorMapa — mapa SVG interactivo con siluetas reales de paises.
 *
 * Datos: world-atlas (Natural Earth, dominio publico) + d3-geo para proyecciones.
 * Los IDs son ISO 3166-1 numericos (ej: "076" Brasil, "484" Mexico).
 *
 * Formato JSON:
 * {
 *   "tipo": "explorador-mapa",
 *   "mapa": "globo" | "world" | "america-latina" | "europa" | "asia" | "africa",
 *   "modo": "quiz" | "explorar",
 *   "retos": [
 *     { "id": "076", "nombre": "Brasil", "pregunta": "¿Donde esta Brasil?" }
 *   ]
 * }
 *
 * Para modo "explorar", retos puede tener `info` con datos del pais (capital, etc).
 *
 * "globo" usa proyeccion ortografica: la Tierra como esfera, girable con el dedo.
 * Un mapa plano miente sobre los tamaños (Groenlandia parece Africa) y esconde
 * que el planeta es redondo — para los niveles G0/G1 el globo enseña mejor.
 * Opciones extra del globo, a nivel de MISION:
 *   "rotacion_inicial": [lon, lat]   — por donde empieza mirando (por defecto America)
 *   "estilo": "tierra"               — pinta toda la tierra de un color (leccion tierra/agua)
 *   "resaltar_ecuador": true         — dibuja el Ecuador marcado sobre la graticula
 *
 * Y a nivel de RETO:
 *   "bandera": "jp"                  — codigo alfa-2 (o "us-tx"); sale al acertar, como premio
 *   "pregunta_bandera": true         — (reto o mision) la bandera ES la pregunta: se
 *                                      muestra arriba y el niño toca el pais/estado.
 *                                      Para el modulo de Banderas.
 *   "bandera_url": "https://upload.wikimedia.org/..." — bandera historica (no esta
 *                                      en flagcdn); con pregunta_bandera se usa esta
 *   "dato": "..."                    — dato curioso que acompaña a la bandera
 *   "marcar": [{ lon, lat, color }]  — puntos fijos del enunciado ("estas aqui")
 *   "ruta": { desde:[lon,lat], hasta:[lon,lat], mostrar_plano:true }
 *                                    — al responder dibuja el arco de circulo
 *                                      maximo, y opcionalmente el camino "recto
 *                                      en el mapa plano" para comparar
 *
 * Con bandera (de premio), dato o ruta el reto NO auto-avanza: aparece un boton
 * "Siguiente", porque hay algo que leer y mirar. Con pregunta_bandera la bandera ya
 * se vio arriba, asi que solo el dato o la ruta detienen el avance.
 *
 * En cualquier mapa plano, a nivel de MISION:
 *   "encuadre": [oeste, sur, este, norte]   (lonMin, latMin, lonMax, latMax)
 *                                    — rectangulo que debe verse completo (ajusta
 *                                      la proyeccion sola; p.ej. Mexico + Centroamerica)
 *
 * Zoom: botones ➕/➖ (y rueda del mouse); con zoom, el mapa plano se mueve
 * arrastrando. Para objetivos diminutos (Belice, Cuba, CDMX) ademas hay un
 * "halo" invisible SOBRE EL MAR alrededor del objetivo: un toque en la costa
 * cuenta, uno en el pais vecino no. Solo hay un intento por reto, asi que el
 * halo no se puede usar para buscar a tientas.
 */

// Paises por region (ISO 3166-1 numerico). Para filtrar el mapa por continente.
const REGIONES = {
  'world': null, // todos los paises
  'globo': null, // todos los paises, sobre la esfera
  // Americas: Norte + Centro + Sur America (incluye USA, Canada y todo Latinoamerica)
  'americas': [
    '124','840','484', // North America: Canada, USA, Mexico
    '084','188','222','320','340','558','591', // Central America: Belize, CR, ES, GT, HN, NI, PA
    '044','052','192','212','214','308','332','388','630','659','662','670','780','533','028', // Caribbean
    '032','068','076','152','170','218','254','328','600','604','740','858','862','238' // South America
  ],
  // America Latina (sin USA ni Canada)
  'america-latina': [
    '484','084','320','340','222','188','558','591','862','068','076','032','152',
    '600','604','858','170','218','328','740','192','214','388','332','630','533',
    '028','052','662','670','780','044','238'
  ],
  'europa': [
    '040','056','100','203','208','233','246','250','276','300','348','352','372',
    '380','428','440','442','470','492','528','578','616','620','642','643','703',
    '705','724','752','756','826','070','191','196','498','499','688','804','807',
    'KOS','CYN' // sin código ISO en world-atlas (ids de Natural Earth, ver data/paises.js)
  ],
  'asia': [
    '004','050','051','031','048','050','156','196','356','360','364','368','376',
    '392','398','400','408','410','414','417','418','422','446','458','462','496',
    '512','524','586','608','626','634','682','702','704','144','760','762','764',
    '784','792','795','860','887','156','CYN'
  ],
  'africa': [
    '012','024','072','108','120','132','140','148','174','178','180','204','226',
    '231','232','262','266','270','288','324','384','404','426','430','434','450',
    '454','466','478','480','504','508','516','562','566','646','678','686','690',
    '694','706','710','716','728','729','732','748','768','788','800','834','854','SOL'
  ],
};

// Configuracion de proyeccion por mapa
const PROJECTIONS = {
  'globo':           { proj: 'orthographic', center: [0, 0],     scale: 225 },
  'world':           { proj: 'naturalEarth1', center: [0, 0],     scale: 145 },
  'americas':        { proj: 'mercator',      center: [-90, 5],   scale: 230 },
  // De México a Tierra del Fuego (con centro/escala se cortaban Chile y Argentina).
  'america-latina':  { proj: 'mercator',      encuadre: [-118, -56, -34, 33] },
  // Por rango y no por centro/escala: con [15,55]·600 se cortaban España,
  // Italia y Grecia abajo y Escandinavia arriba.
  'europa':          { proj: 'mercator',      encuadre: [-11, 34.5, 32, 71] },
  'asia':            { proj: 'mercator',      center: [90, 30],   scale: 250 },
  'africa':          { proj: 'mercator',      center: [20, 0],    scale: 350 },
  'mexico-estados':  { proj: 'mercator',      center: [-102, 24], scale: 1200 },
  // USA usa Albers porque maneja Alaska/Hawaii. No requiere center/scale manuales.
  'usa-estados':     { proj: 'albersUsa',     scale: 900 },
};

// Mapas que usan TopoJSON propio (no world-atlas)
const MAPAS_TOPOJSON_ALT = {
  'usa-estados': {
    data: usaStatesData,
    objectKey: 'states',
  },
};

// Mapas que usan datos GeoJSON (no TopoJSON) — datos de fuentes alternativas
const MAPAS_GEOJSON = {
  'mexico-estados': {
    data: mexicoStatesData,
    idField: 'state_code',  // propiedad usada como ID
    nameField: 'state_name', // propiedad usada como nombre
  },
};

const VIEWPORT = { width: 800, height: 500 };

// Niveles de zoom (mapa plano: viewBox; globo: escala de la esfera).
const ZOOMS = [1, 2, 3.5, 6];
const ZOOMS_GLOBO = [1, 1.6, 2.5];

// Esquinas y puntos medios del rectangulo de `encuadre`, para fitExtent.
// Un MultiPoint evita los lios de sentido de giro de un Polygon esferico.
// Formato plano [oeste, sur, este, norte]: Firestore NO acepta arreglos dentro
// de arreglos ([[lon,lat],[lon,lat]] hacia fallar la migracion).
const puntosEncuadre = ([lon0, lat0, lon1, lat1]) => ({
  type: 'MultiPoint',
  coordinates: [
    [lon0, lat0], [lon0, lat1], [lon1, lat0], [lon1, lat1],
    [(lon0 + lon1) / 2, lat0], [(lon0 + lon1) / 2, lat1],
    [lon0, (lat0 + lat1) / 2], [lon1, (lat0 + lat1) / 2],
  ],
});

// Un objetivo cuya area en pantalla (unidades del viewBox) sea menor que esto
// recibe el halo de toque sobre el mar.
const AREA_OBJETIVO_CHICO = 900;

// Paleta vibrante kid-friendly — 12 colores muy distintos, alta saturacion.
// Cada pais recibe uno por hash deterministico de su ID, asi paises vecinos
// son visualmente distintos al maximo.
const PALETA_VIBRANTE = [
  '#E74C3C', // rojo
  '#FF9F40', // naranja
  '#FFD93D', // amarillo
  '#A8E063', // lima
  '#2ECC71', // verde
  '#1ABC9C', // turquesa
  '#3DB5E6', // cyan
  '#3498DB', // azul
  '#5E72E4', // indigo
  '#9B59B6', // violeta
  '#FF6B9D', // rosa
  '#E91E63', // magenta
];

// Color deterministico por pais. Hash mejorado para reducir colisiones de vecinos.
const getColorPais = (idPadded) => {
  // Hash usa multiplicacion para distribuir mejor que la suma simple
  let hash = 0;
  for (let i = 0; i < idPadded.length; i++) {
    hash = (hash * 31 + idPadded.charCodeAt(i)) | 0;
  }
  return PALETA_VIBRANTE[Math.abs(hash) % PALETA_VIBRANTE.length];
};

// Meridianos y paralelos cada 30°: a 10° son 25 KB de path que hay que reescribir
// en cada frame del arrastre, y para un niño es ruido. Se calcula una sola vez.
const GRATICULA = geoGraticule().step([30, 30])();

// Interpolacion angular por el camino corto (para no dar la vuelta al mundo).
const lerpAngulo = (a, b, t) => {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
};

// El Ecuador como linea propia, para el juego de latitud y clima.
const ECUADOR = {
  type: 'LineString',
  coordinates: Array.from({ length: 181 }, (_, i) => [-180 + i * 2, 0]),
};

/**
 * El camino "recto en el mapa plano": interpolar longitud y latitud linealmente.
 * Es lo que un niño dibujaria con una regla sobre un mapa, y sirve para
 * comparar con el arco real. geoPath NO lo curva porque los puntos ya vienen
 * dados uno a uno; en cambio un LineString de solo dos puntos si lo dibuja
 * siguiendo el circulo maximo, que es justo lo que queremos ensenar.
 */
const caminoPlano = (desde, hasta, pasos = 64) => {
  let dLon = hasta[0] - desde[0];
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  return {
    type: 'LineString',
    coordinates: Array.from({ length: pasos + 1 }, (_, i) => [
      desde[0] + (dLon * i) / pasos,
      desde[1] + ((hasta[1] - desde[1]) * i) / pasos,
    ]),
  };
};

// URL de la bandera de un reto: historica (Wikimedia) o de flagcdn por codigo.
const srcBandera = (reto, ancho) =>
  reto?.bandera_url || (reto?.bandera ? banderaUrl(reto.bandera, ancho) : null);

const ExploradorMapa = ({ mision, onCompletar }) => {
  const {
    mapa = 'world',
    modo = 'quiz',
    retos = [],
    rotacion_inicial: rotacionInicial,
    estilo,
    resaltar_ecuador: resaltarEcuador,
    encuadre: encuadreMision,
  } = mision;

  const [retoIdx, setRetoIdx] = useState(0);
  const [seleccionado, setSeleccionado] = useState(null);
  const [aciertos, setAciertos] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const esGlobo = (PROJECTIONS[mapa] || {}).proj === 'orthographic';
  const niveles = esGlobo ? ZOOMS_GLOBO : ZOOMS;
  const [zoomIdx, setZoomIdx] = useState(0);
  const zoom = niveles[zoomIdx];
  const zoomGlobo = esGlobo ? zoom : 1; // el mapa plano hace zoom con el viewBox, no reproyecta
  // Centro de la vista del mapa plano, en unidades del viewBox.
  const [centroVista, setCentroVista] = useState([VIEWPORT.width / 2, VIEWPORT.height / 2]);
  // [lambda, phi] de geoProjection.rotate(). El centro visible es (-lambda, -phi).
  const [rotacion, setRotacion] = useState(() => {
    const [lon, lat] = rotacionInicial || [-80, 15]; // America de frente
    return [-lon, -lat];
  });

  const reto = retos[retoIdx];
  const total = retos.length;
  const esModoQuiz = modo === 'quiz';

  // Modulo de Banderas: la bandera como pregunta (en geografia normal es premio).
  const preguntaBandera = esModoQuiz && !!(reto?.pregunta_bandera ?? mision.pregunta_bandera);
  const srcPregunta = preguntaBandera ? srcBandera(reto, 320) : null;
  // Algo que leer o mirar al responder: entonces no se auto-avanza.
  const tieneRecompensa = !!reto && !!((!preguntaBandera && reto.bandera) || reto.dato || reto.ruta);

  // Precarga la bandera del siguiente reto: sin esto, con internet lento se
  // quedaba visible la anterior junto a la pregunta nueva.
  useEffect(() => {
    if (!preguntaBandera) return;
    const siguiente = srcBandera(retos[retoIdx + 1], 320);
    if (siguiente) new Image().src = siguiente;
  }, [preguntaBandera, retos, retoIdx]);

  // Fullscreen events
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // el navegador puede bloquear pantalla completa; no es critico
    }
  };

  // Extraer features — soporta TopoJSON (world-atlas, us-atlas) y GeoJSON (mexico-estados)
  const { countries, idGetter, nameGetter } = useMemo(() => {
    let allFeatures;
    let getId;
    let getName;

    const geojsonConfig = MAPAS_GEOJSON[mapa];
    const topojsonAltConfig = MAPAS_TOPOJSON_ALT[mapa];

    if (geojsonConfig) {
      // GeoJSON: features ya estan en .features con propiedades custom
      allFeatures = geojsonConfig.data.features;
      getId = (f) => String(f.properties[geojsonConfig.idField]);
      // El GeoJSON trae nombres viejos ("Distrito Federal") o largos ("Veracruz de Ignacio de la Llave")
      getName = (f) => NOMBRES_MX[getId(f)] || f.properties[geojsonConfig.nameField] || '';
    } else if (topojsonAltConfig) {
      // TopoJSON alternativo (us-atlas): mismo helper pero con su propio object key
      allFeatures = feature(topojsonAltConfig.data, topojsonAltConfig.data.objects[topojsonAltConfig.objectKey]).features;
      getId = (f) => String(f.id).padStart(2, '0'); // FIPS codes (estado: 01-56)
      getName = (f) => ESTADOS_USA[getId(f)]?.es || f.properties?.name || '';
    } else {
      // TopoJSON default (world-atlas): nombres en español desde data/paises.js
      // (world-atlas solo los trae en inglés).
      allFeatures = feature(worldData, worldData.objects.countries).features;
      getId = idPaisMundo;
      getName = (f) => PAISES[getId(f)]?.es || f.properties?.name || '';
    }

    const filterIds = REGIONES[mapa];
    const filtered = filterIds
      ? allFeatures.filter(f => filterIds.includes(getId(f)))
      : allFeatures;

    return {
      countries: filtered,
      idGetter: getId,
      nameGetter: getName,
    };
  }, [mapa]);

  // La proyeccion se rehace al girar el globo; en los mapas planos solo depende del mapa.
  const pathGenerator = useMemo(() => {
    const config = PROJECTIONS[mapa] || PROJECTIONS['world'];
    const translate = [VIEWPORT.width / 2, VIEWPORT.height / 2];
    const encuadre = encuadreMision || config.encuadre;
    let projection;
    if (config.proj === 'orthographic') {
      // clipAngle(90) por defecto: la cara oculta de la Tierra no se dibuja
      projection = geoOrthographic()
        .rotate(rotacion)
        .scale(config.scale * zoomGlobo)
        .translate(translate);
    } else if (config.proj === 'albersUsa') {
      projection = geoAlbersUsa()
        .scale(config.scale)
        .translate(translate);
    } else {
      projection = config.proj === 'mercator' ? geoMercator() : geoNaturalEarth1();
      if (encuadre) {
        projection.fitExtent(
          [[8, 8], [VIEWPORT.width - 8, VIEWPORT.height - 8]],
          puntosEncuadre(encuadre)
        );
      } else {
        projection.center(config.center).scale(config.scale).translate(translate);
      }
    }
    return geoPath(projection);
  }, [mapa, rotacion, encuadreMision, zoomGlobo]);

  // === Zoom (mapa plano por viewBox; el globo por escala) ===
  const anchoVista = VIEWPORT.width / (esGlobo ? 1 : zoom);
  const altoVista = VIEWPORT.height / (esGlobo ? 1 : zoom);
  const limitar = (v, min, max) => Math.min(max, Math.max(min, v));
  const vistaX = limitar(centroVista[0] - anchoVista / 2, 0, VIEWPORT.width - anchoVista);
  const vistaY = limitar(centroVista[1] - altoVista / 2, 0, VIEWPORT.height - altoVista);
  const viewBox = `${vistaX} ${vistaY} ${anchoVista} ${altoVista}`;

  const cambiarZoom = (delta, foco = null) => {
    const nuevo = limitar(zoomIdx + delta, 0, niveles.length - 1);
    if (nuevo === zoomIdx) return;
    if (!esGlobo) {
      if (nuevo === 0) {
        setCentroVista([VIEWPORT.width / 2, VIEWPORT.height / 2]);
      } else if (foco) {
        // Acercar hacia el punto del mouse: ese punto se queda bajo el cursor.
        const k = zoom / niveles[nuevo];
        setCentroVista([
          foco[0] + (vistaX + anchoVista / 2 - foco[0]) * k,
          foco[1] + (vistaY + altoVista / 2 - foco[1]) * k,
        ]);
      } else {
        setCentroVista([vistaX + anchoVista / 2, vistaY + altoVista / 2]);
      }
    }
    setZoomIdx(nuevo);
  };

  // Coordenadas del viewBox bajo un evento de puntero.
  const puntoEnVista = (e) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width) return null;
    return [
      vistaX + ((e.clientX - r.left) / r.width) * anchoVista,
      vistaY + ((e.clientY - r.top) / r.height) * altoVista,
    ];
  };

  const alRueda = (e) => {
    if (!e.deltaY) return;
    e.preventDefault();
    cambiarZoom(e.deltaY < 0 ? 1 : -1, puntoEnVista(e));
  };
  // La rueda necesita un listener no pasivo para poder evitar el scroll de la pagina.
  const alRuedaRef = useRef(alRueda);
  useEffect(() => { alRuedaRef.current = alRueda; });
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const fn = (e) => alRuedaRef.current(e);
    svg.addEventListener('wheel', fn, { passive: false });
    return () => svg.removeEventListener('wheel', fn);
  }, []);

  // Normalizar IDs segun el tipo de mapa:
  // - paises (ISO 3166-1): 3 digitos con padding ("076", "484")
  // - mexico-estados (INEGI): 1-2 digitos sin padding ("9", "31")
  // - usa-estados (FIPS): 2 digitos con padding ("06", "48")
  const normalizeId = (id) => {
    if (id === null || id === undefined) return '';
    const s = String(id);
    if (mapa === 'mexico-estados') return s.replace(/^0+/, '') || '0';
    if (mapa === 'usa-estados') return s.padStart(2, '0');
    return s.padStart(3, '0');
  };

  // === Girar el globo con el dedo ===
  // Buscar el pais girando la Tierra ES la leccion, asi que no se recoloca solo:
  // al responder se gira hasta centrar el pais, que es cuando toca aprenderlo.
  const arrastreRef = useRef(null);
  const huboArrastreRef = useRef(false);
  const rafGiroRef = useRef(null);
  const rafAnimRef = useRef(null);
  const pendienteRef = useRef(null);
  const UMBRAL_ARRASTRE = 6; // px; por debajo de esto sigue siendo un toque

  // Arrastrar el radio del globo ≈ 90°, sin importar a que tamano se dibuje.
  const gradosPorPixel = () => {
    const anchoCss = svgRef.current?.clientWidth || VIEWPORT.width;
    const radioCss = (PROJECTIONS[mapa]?.scale || 225) * zoomGlobo * (anchoCss / VIEWPORT.width);
    return Math.min(1, Math.max(0.05, 90 / Math.max(radioCss, 1)));
  };

  // Con zoom, el mapa plano se mueve arrastrando (sin zoom no hay a donde moverlo).
  const sePuedeArrastrar = esGlobo || zoomIdx > 0;

  const detenerAnimacion = () => {
    if (rafAnimRef.current != null) {
      cancelAnimationFrame(rafAnimRef.current);
      rafAnimRef.current = null;
    }
  };

  const alBajar = (e) => {
    huboArrastreRef.current = false;
    if (!sePuedeArrastrar) return;
    detenerAnimacion();
    // Aun NO se captura el puntero: al capturarlo, el navegador reasigna tambien
    // el `click` al SVG y dejaria de funcionar tocar un pais. Se captura mas
    // abajo, en cuanto el gesto deja de ser un toque y pasa a ser un arrastre.
    const anchoCss = svgRef.current?.clientWidth || VIEWPORT.width;
    arrastreRef.current = {
      x: e.clientX, y: e.clientY, movido: 0,
      rot: rotacion, k: gradosPorPixel(), capturado: false,
      // mapa plano: centro de la vista al empezar y unidades de viewBox por px
      centro: [vistaX + anchoVista / 2, vistaY + altoVista / 2],
      upp: anchoVista / anchoCss,
    };
  };

  const alMover = (e) => {
    const a = arrastreRef.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    const dy = e.clientY - a.y;
    a.movido = Math.max(a.movido, Math.abs(dx) + Math.abs(dy));
    if (a.movido <= UMBRAL_ARRASTRE) return; // todavia puede ser un toque

    if (!a.capturado) {
      // Ya es un arrastre: capturar para que siga girando aunque el dedo
      // se salga del globo. El `click` que venga despues ya se ignora.
      a.capturado = true;
      huboArrastreRef.current = true;
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        // algunos navegadores rechazan capturar en SVG; el giro sigue
        // funcionando mientras el dedo no salga del mapa
      }
    }

    if (!esGlobo) {
      // Mapa plano con zoom: el mapa sigue al dedo.
      setCentroVista([
        limitar(a.centro[0] - dx * a.upp, anchoVista / 2, VIEWPORT.width - anchoVista / 2),
        limitar(a.centro[1] - dy * a.upp, altoVista / 2, VIEWPORT.height - altoVista / 2),
      ]);
      return;
    }

    pendienteRef.current = [
      a.rot[0] + dx * a.k,
      Math.max(-90, Math.min(90, a.rot[1] - dy * a.k)),
    ];
    // Un solo setState por frame: reproyectar el mundo en cada pointermove seria brutal.
    if (rafGiroRef.current == null) {
      rafGiroRef.current = requestAnimationFrame(() => {
        rafGiroRef.current = null;
        if (pendienteRef.current) setRotacion(pendienteRef.current);
      });
    }
  };

  const alSoltar = (e) => {
    const a = arrastreRef.current;
    if (!a) return;
    arrastreRef.current = null;
    if (!a.capturado) return;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ya liberado
    }
  };

  // Gira suavemente hasta poner unas coordenadas en el centro de la esfera.
  const animarHacia = ([lon, lat]) => {
    detenerAnimacion();
    const destino = [-lon, -lat];
    const desde = rotacion;
    let inicio = null;
    const DURACION = 750;
    const paso = (ahora) => {
      if (inicio === null) inicio = ahora;
      const t = Math.min(1, (ahora - inicio) / DURACION);
      const s = t * t * (3 - 2 * t); // smoothstep
      setRotacion([
        lerpAngulo(desde[0], destino[0], s),
        desde[1] + (destino[1] - desde[1]) * s,
      ]);
      if (t < 1) rafAnimRef.current = requestAnimationFrame(paso);
      else rafAnimRef.current = null;
    };
    rafAnimRef.current = requestAnimationFrame(paso);
  };

  useEffect(() => () => {
    if (rafGiroRef.current != null) cancelAnimationFrame(rafGiroRef.current);
    if (rafAnimRef.current != null) cancelAnimationFrame(rafAnimRef.current);
  }, []);

  const siguienteReto = () => {
    if (retoIdx + 1 >= total) {
      if (onCompletar) onCompletar();
    } else {
      setRetoIdx(prev => prev + 1);
      setSeleccionado(null);
      setFeedback(null);
      // Cada pregunta empieza viendo el mapa completo.
      setZoomIdx(0);
      setCentroVista([VIEWPORT.width / 2, VIEWPORT.height / 2]);
    }
  };

  const handleClick = (countryId) => {
    // Si venia de girar el globo, no cuenta como respuesta.
    if (huboArrastreRef.current) {
      huboArrastreRef.current = false;
      return;
    }
    if (!esModoQuiz) {
      // Modo explorar: solo mostrar info del pais clickeado
      setSeleccionado(countryId);
      return;
    }

    if (feedback) return; // ya respondio
    setSeleccionado(countryId);
    const correcto = normalizeId(countryId) === normalizeId(reto.id);
    if (correcto) setAciertos(prev => prev + 1);
    setFeedback(correcto ? 'correcto' : 'incorrecto');

    // En el globo, girar hasta centrar el pais: acierte o falle, ahora es cuando
    // conviene que vea donde estaba de verdad.
    let espera = 2000;
    if (esGlobo) {
      const objetivo = countries.find(c => normalizeId(idGetter(c)) === normalizeId(reto.id));
      if (objetivo) {
        animarHacia(geoCentroid(objetivo));
        espera = 2600;
      }
    }

    // Si el reto trae recompensa (bandera, dato o el arco de la ruta), hay algo
    // que leer y mirar: manda el niño con un boton en vez de avanzar solo a los
    // 2 segundos. Sin recompensa, se mantiene el auto-avance de siempre.
    if (tieneRecompensa) return;

    setTimeout(siguienteReto, espera);
  };

  // Buscar nombre de pais/estado por ID
  const getCountryName = (id) => {
    const country = countries.find(c => normalizeId(idGetter(c)) === normalizeId(id));
    return country ? nameGetter(country) : '';
  };

  // Halo de toque sobre el mar para objetivos diminutos (ver comentario de arriba).
  // Va DEBAJO de los paises: los toques en tierra los sigue recibiendo cada pais.
  let halo = null;
  if (esModoQuiz && reto && !feedback) {
    const objetivo = countries.find(c => normalizeId(idGetter(c)) === normalizeId(reto.id));
    const zoomVista = esGlobo ? 1 : zoom;
    if (objetivo && pathGenerator(objetivo) && pathGenerator.area(objetivo) * zoomVista ** 2 < AREA_OBJETIVO_CHICO) {
      const [cx, cy] = pathGenerator.centroid(objetivo);
      if (Number.isFinite(cx) && Number.isFinite(cy)) halo = { cx, cy, r: 32 / zoomVista };
    }
  }

  // Modo explorar: el `info` es del pais tocado (antes salia siempre el del primer reto).
  const infoSeleccionado = seleccionado
    ? retos.find(r => normalizeId(r.id) === normalizeId(seleccionado))?.info
    : null;

  if (!reto && esModoQuiz) {
    return <div className="em-error">No hay retos disponibles</div>;
  }

  return (
    <div className={`em-container ${isFullscreen ? 'em-fullscreen' : ''}`} ref={containerRef}>
      {/* Barra de arriba: los controles van FUERA del mapa. Encima tapaban
          California y Baja California en un celular. */}
      <div className="em-progreso">
        {esModoQuiz && (
          <>
            <span className="em-contador">{retoIdx + 1} / {total}</span>
            <span className="em-racha">🔥 {aciertos}</span>
          </>
        )}
        <div className="em-zoom">
          <button type="button" onClick={() => cambiarZoom(1)} disabled={zoomIdx >= niveles.length - 1} title="Acercar" aria-label="Acercar">➕</button>
          <button type="button" onClick={() => cambiarZoom(-1)} disabled={zoomIdx === 0} title="Alejar" aria-label="Alejar">➖</button>
        </div>
        <button className="em-fs-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Salir' : 'Pantalla completa'}>
          {isFullscreen ? '✕' : '⛶'}
        </button>
      </div>

      {/* key por src: al cambiar de reto se monta una imagen nueva en vez de dejar
          la anterior visible mientras carga. alt neutro: si la imagen falla, el
          navegador escribe el alt y no debe decir el pais. */}
      {srcPregunta && (
        <img key={srcPregunta} className="em-bandera-pregunta" src={srcPregunta} alt="Bandera" />
      )}

      {esModoQuiz && reto?.pregunta && (
        <p className="em-pregunta">{reto.pregunta}</p>
      )}

      {/* En modo explorar la instruccion ya la pinta MisionRenderer arriba. */}

      <div className={`em-mapa-wrapper ${esGlobo ? 'em-wrapper-globo' : ''}`}>
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className={`em-mapa ${esGlobo ? 'em-globo' : ''} ${!esGlobo && zoomIdx > 0 ? 'em-arrastrable' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
        >
          {esGlobo && (
            <>
              <defs>
                <radialGradient id="em-oceano" cx="35%" cy="28%" r="78%">
                  <stop offset="0%" stopColor="#8fd4ff" />
                  <stop offset="55%" stopColor="#3aa0e8" />
                  <stop offset="100%" stopColor="#16609c" />
                </radialGradient>
              </defs>
              <path d={pathGenerator({ type: 'Sphere' })} className="em-oceano-path" />
              <path d={pathGenerator(GRATICULA)} className="em-graticula" />
              {resaltarEcuador && (
                <path d={pathGenerator(ECUADOR)} className="em-ecuador" />
              )}
            </>
          )}

          {halo && (
            <circle
              cx={halo.cx}
              cy={halo.cy}
              r={halo.r}
              className="em-halo"
              onClick={() => handleClick(reto.id)}
            />
          )}

          {countries.map((country, idx) => {
            const d = pathGenerator(country);
            // En el globo, la mitad de atras no se dibuja (clipAngle 90°)
            if (!d) return null;
            const rawId = idGetter(country);
            const cid = normalizeId(rawId);
            const isCorrect = esModoQuiz && cid === normalizeId(reto?.id);
            const isSelected = cid === normalizeId(seleccionado);
            const isHovered = cid === normalizeId(hovered);
            // Usar el ID sin padding para hash (consistente entre tipos de mapa)
            // `estilo: "tierra"` pinta todo igual: la leccion es tierra vs agua,
            // no que pais es cual.
            const baseColor = estilo === 'tierra' ? '#7cb342' : getColorPais(cid);

            let className = 'em-pais';
            let fillColor = baseColor;
            if (feedback) {
              if (isCorrect) { className += ' em-correcto'; fillColor = null; }
              else if (isSelected) { className += ' em-incorrecto'; fillColor = null; }
            } else if (isSelected && !esModoQuiz) {
              className += ' em-seleccionado';
              fillColor = null;
            }
            if (isHovered && !feedback) className += ' em-hover';

            return (
              <path
                key={`${cid}-${idx}`}
                d={d}
                className={className}
                style={fillColor ? { fill: fillColor } : undefined}
                onClick={() => handleClick(rawId)}
                onMouseEnter={() => setHovered(rawId)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* La ruta se revela al responder: es el momento del "ajá".
              Un LineString de dos puntos lo dibuja geoPath siguiendo el circulo
              maximo; el camino "recto en el mapa" hay que construirlo a mano. */}
          {esGlobo && feedback && reto?.ruta && (
            <>
              {reto.ruta.mostrar_plano && (
                <path
                  d={pathGenerator(caminoPlano(reto.ruta.desde, reto.ruta.hasta))}
                  className="em-ruta-plana"
                />
              )}
              <path
                d={pathGenerator({ type: 'LineString', coordinates: [reto.ruta.desde, reto.ruta.hasta] })}
                className="em-ruta"
              />
            </>
          )}

          {/* Marcadores: forman parte del enunciado, se ven siempre. El recorte
              de la cara oculta ya lo hace geoPath. */}
          {esGlobo && reto?.marcar?.map((m, i) => (
            <path
              key={`marca-${i}`}
              d={pathGenerator.pointRadius(m.radio || 6)({ type: 'Point', coordinates: [m.lon, m.lat] })}
              className="em-marca"
              style={m.color ? { fill: m.color } : undefined}
            />
          ))}
        </svg>

        {/* En el quiz el nombre al pasar el mouse regalaria la respuesta. */}
        {hovered && !esModoQuiz && (
          <div className="em-tooltip">
            {getCountryName(hovered)}
          </div>
        )}

      </div>

      {/* Debajo del globo, no encima: sobre la esfera tapaba Sudamérica. */}
      {esGlobo && <div className="em-pista-giro">👆 Arrastra para girar la Tierra</div>}

      {feedback && (
        <div className={`em-feedback em-${feedback}`}>
          <div className="em-feedback-linea">
            {/* En geografia la bandera es RECOMPENSA, no pregunta: preguntar por
                ella enseña banderas, no geografia. En el modulo de Banderas
                (pregunta_bandera) ya se vio arriba y no se repite. */}
            {reto.bandera && !preguntaBandera && (
              <img
                className="em-bandera"
                src={banderaUrl(reto.bandera, 80)}
                alt={`Bandera de ${reto.nombre}`}
                loading="lazy"
              />
            )}
            <span>
              {feedback === 'correcto'
                ? `¡Correcto! 🎉 Es ${reto.nombre}`
                : `Era ${reto.nombre}`}
            </span>
          </div>

          {reto.dato && <p className="em-dato">💡 {reto.dato}</p>}

          {tieneRecompensa && (
            <button type="button" className="em-siguiente" onClick={siguienteReto}>
              {retoIdx + 1 >= total ? 'Terminar ➜' : 'Siguiente ➜'}
            </button>
          )}
        </div>
      )}

      {!esModoQuiz && seleccionado && (
        <div className="em-info">
          <strong>{getCountryName(seleccionado)}</strong>
          {infoSeleccionado && <p>{infoSeleccionado}</p>}
        </div>
      )}

      {/* Explorar no tiene preguntas que contestar: sin este boton la mision
          nunca terminaba (Planeta Azul se quedaba sin salida). */}
      {!esModoQuiz && (
        <button type="button" className="em-siguiente em-listo" onClick={onCompletar}>
          ¡Listo! ➜
        </button>
      )}
    </div>
  );
};

export default ExploradorMapa;
