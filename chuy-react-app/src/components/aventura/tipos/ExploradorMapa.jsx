import React, { useState, useEffect, useMemo, useRef } from 'react';
import { feature } from 'topojson-client';
import {
  geoNaturalEarth1, geoMercator, geoAlbersUsa, geoOrthographic,
  geoPath, geoGraticule, geoCentroid,
} from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';
import usaStatesData from 'us-atlas/states-10m.json';
import mexicoStatesData from './maps/mexico-estados.json';
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
 *   "bandera": "jp"                  — codigo ISO alfa-2; sale al acertar, como premio
 *   "dato": "..."                    — dato curioso que acompaña a la bandera
 *   "marcar": [{ lon, lat, color }]  — puntos fijos del enunciado ("estas aqui")
 *   "ruta": { desde:[lon,lat], hasta:[lon,lat], mostrar_plano:true }
 *                                    — al responder dibuja el arco de circulo
 *                                      maximo, y opcionalmente el camino "recto
 *                                      en el mapa plano" para comparar
 *
 * Con bandera, dato o ruta el reto NO auto-avanza: aparece un boton "Siguiente",
 * porque hay algo que leer y mirar.
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
    '705','724','752','756','826','070','191','196','498','499','688','804','807'
  ],
  'asia': [
    '004','050','051','031','048','050','156','196','356','360','364','368','376',
    '392','398','400','408','410','414','417','418','422','446','458','462','496',
    '512','524','586','608','626','634','682','702','704','144','760','762','764',
    '784','792','795','860','887','156'
  ],
  'africa': [
    '012','024','072','108','120','132','140','148','174','178','180','204','226',
    '231','232','262','266','270','288','324','384','404','426','430','434','450',
    '454','466','478','480','504','508','516','562','566','646','678','686','690',
    '694','706','710','716','728','729','732','748','768','788','800','834','854'
  ],
};

// Configuracion de proyeccion por mapa
const PROJECTIONS = {
  'globo':           { proj: 'orthographic', center: [0, 0],     scale: 225 },
  'world':           { proj: 'naturalEarth1', center: [0, 0],     scale: 145 },
  'americas':        { proj: 'mercator',      center: [-90, 5],   scale: 230 },
  'america-latina':  { proj: 'mercator',      center: [-75, -5],  scale: 320 },
  'europa':          { proj: 'mercator',      center: [15, 55],   scale: 600 },
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

const ExploradorMapa = ({ mision, onCompletar }) => {
  const {
    mapa = 'world',
    modo = 'quiz',
    retos = [],
    instruccion,
    rotacion_inicial: rotacionInicial,
    estilo,
    resaltar_ecuador: resaltarEcuador,
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
  // [lambda, phi] de geoProjection.rotate(). El centro visible es (-lambda, -phi).
  const [rotacion, setRotacion] = useState(() => {
    const [lon, lat] = rotacionInicial || [-80, 15]; // America de frente
    return [-lon, -lat];
  });

  const reto = retos[retoIdx];
  const total = retos.length;
  const esModoQuiz = modo === 'quiz';

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
      getName = (f) => f.properties[geojsonConfig.nameField] || '';
    } else if (topojsonAltConfig) {
      // TopoJSON alternativo (us-atlas): mismo helper pero con su propio object key
      allFeatures = feature(topojsonAltConfig.data, topojsonAltConfig.data.objects[topojsonAltConfig.objectKey]).features;
      getId = (f) => String(f.id).padStart(2, '0'); // FIPS codes (estado: 01-56)
      getName = (f) => f.properties?.name || '';
    } else {
      // TopoJSON default (world-atlas)
      allFeatures = feature(worldData, worldData.objects.countries).features;
      getId = (f) => String(f.id).padStart(3, '0');
      getName = (f) => f.properties?.name || '';
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
    let projection;
    if (config.proj === 'orthographic') {
      // clipAngle(90) por defecto: la cara oculta de la Tierra no se dibuja
      projection = geoOrthographic()
        .rotate(rotacion)
        .scale(config.scale)
        .translate(translate);
    } else if (config.proj === 'albersUsa') {
      projection = geoAlbersUsa()
        .scale(config.scale)
        .translate(translate);
    } else if (config.proj === 'mercator') {
      projection = geoMercator()
        .center(config.center)
        .scale(config.scale)
        .translate(translate);
    } else {
      projection = geoNaturalEarth1()
        .center(config.center)
        .scale(config.scale)
        .translate(translate);
    }
    return geoPath(projection);
  }, [mapa, rotacion]);

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
    const radioCss = (PROJECTIONS[mapa]?.scale || 225) * (anchoCss / VIEWPORT.width);
    return Math.min(1, Math.max(0.15, 90 / Math.max(radioCss, 1)));
  };

  const detenerAnimacion = () => {
    if (rafAnimRef.current != null) {
      cancelAnimationFrame(rafAnimRef.current);
      rafAnimRef.current = null;
    }
  };

  const alBajar = (e) => {
    if (!esGlobo) return;
    detenerAnimacion();
    huboArrastreRef.current = false;
    // Aun NO se captura el puntero: al capturarlo, el navegador reasigna tambien
    // el `click` al SVG y dejaria de funcionar tocar un pais. Se captura mas
    // abajo, en cuanto el gesto deja de ser un toque y pasa a ser un arrastre.
    arrastreRef.current = {
      x: e.clientX, y: e.clientY, movido: 0,
      rot: rotacion, k: gradosPorPixel(), capturado: false,
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
    if (reto.bandera || reto.dato || reto.ruta) return;

    setTimeout(siguienteReto, espera);
  };

  // Buscar nombre de pais/estado por ID
  const getCountryName = (id) => {
    const country = countries.find(c => normalizeId(idGetter(c)) === normalizeId(id));
    return country ? nameGetter(country) : '';
  };

  if (!reto && esModoQuiz) {
    return <div className="em-error">No hay retos disponibles</div>;
  }

  return (
    <div className={`em-container ${isFullscreen ? 'em-fullscreen' : ''}`} ref={containerRef}>
      {esModoQuiz && (
        <div className="em-progreso">
          <span className="em-contador">{retoIdx + 1} / {total}</span>
          <span className="em-racha">🔥 {aciertos}</span>
          <button className="em-fs-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Salir' : 'Pantalla completa'}>
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      )}

      {esModoQuiz && reto?.pregunta && (
        <p className="em-pregunta">{reto.pregunta}</p>
      )}

      {!esModoQuiz && instruccion && (
        <p className="em-pregunta">{instruccion}</p>
      )}

      <div className={`em-mapa-wrapper ${esGlobo ? 'em-wrapper-globo' : ''}`}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
          className={`em-mapa ${esGlobo ? 'em-globo' : ''}`}
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

        {hovered && (
          <div className="em-tooltip">
            {getCountryName(hovered)}
          </div>
        )}

        {esGlobo && <div className="em-pista-giro">👆 Arrastra para girar la Tierra</div>}
      </div>

      {feedback && (
        <div className={`em-feedback em-${feedback}`}>
          <div className="em-feedback-linea">
            {/* La bandera es RECOMPENSA, no pregunta: preguntar por ella enseña
                banderas, no geografia. flagcdn ya se usa en MateriaToggle. */}
            {reto.bandera && (
              <img
                className="em-bandera"
                src={`https://flagcdn.com/w80/${reto.bandera}.png`}
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

          {(reto.bandera || reto.dato || reto.ruta) && (
            <button type="button" className="em-siguiente" onClick={siguienteReto}>
              {retoIdx + 1 >= total ? 'Terminar ➜' : 'Siguiente ➜'}
            </button>
          )}
        </div>
      )}

      {!esModoQuiz && seleccionado && (
        <div className="em-info">
          <strong>{getCountryName(seleccionado)}</strong>
          {reto?.info && <p>{reto.info}</p>}
        </div>
      )}
    </div>
  );
};

export default ExploradorMapa;
