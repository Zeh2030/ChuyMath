import React, { useState, useEffect, useMemo, useRef } from 'react';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoMercator, geoAlbersUsa, geoPath } from 'd3-geo';
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
 *   "mapa": "world" | "america-latina" | "europa" | "asia" | "africa",
 *   "modo": "quiz" | "explorar",
 *   "retos": [
 *     { "id": "076", "nombre": "Brasil", "pregunta": "¿Donde esta Brasil?" }
 *   ]
 * }
 *
 * Para modo "explorar", retos puede tener `info` con datos del pais (capital, etc).
 */

// Paises por region (ISO 3166-1 numerico). Para filtrar el mapa por continente.
const REGIONES = {
  'world': null, // todos los paises
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

const ExploradorMapa = ({ mision, onCompletar }) => {
  const {
    mapa = 'world',
    modo = 'quiz',
    retos = [],
    instruccion,
  } = mision;

  const [retoIdx, setRetoIdx] = useState(0);
  const [seleccionado, setSeleccionado] = useState(null);
  const [aciertos, setAciertos] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

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
    } catch (err) {}
  };

  // Extraer features y proyectar — soporta TopoJSON (world-atlas, us-atlas) y GeoJSON (mexico-estados)
  const { countries, pathGenerator, idGetter, nameGetter } = useMemo(() => {
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

    const config = PROJECTIONS[mapa] || PROJECTIONS['world'];
    let projection;
    if (config.proj === 'albersUsa') {
      projection = geoAlbersUsa()
        .scale(config.scale)
        .translate([VIEWPORT.width / 2, VIEWPORT.height / 2]);
    } else if (config.proj === 'mercator') {
      projection = geoMercator()
        .center(config.center)
        .scale(config.scale)
        .translate([VIEWPORT.width / 2, VIEWPORT.height / 2]);
    } else {
      projection = geoNaturalEarth1()
        .center(config.center)
        .scale(config.scale)
        .translate([VIEWPORT.width / 2, VIEWPORT.height / 2]);
    }

    return {
      countries: filtered,
      pathGenerator: geoPath(projection),
      idGetter: getId,
      nameGetter: getName,
    };
  }, [mapa]);

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

  const handleClick = (countryId) => {
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

    setTimeout(() => {
      if (retoIdx + 1 >= total) {
        if (onCompletar) onCompletar();
      } else {
        setRetoIdx(prev => prev + 1);
        setSeleccionado(null);
        setFeedback(null);
      }
    }, 2000);
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

      <div className="em-mapa-wrapper">
        <svg
          viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
          className="em-mapa"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {countries.map((country, idx) => {
            const rawId = idGetter(country);
            const cid = normalizeId(rawId);
            const isCorrect = esModoQuiz && cid === normalizeId(reto?.id);
            const isSelected = cid === normalizeId(seleccionado);
            const isHovered = cid === normalizeId(hovered);
            // Usar el ID sin padding para hash (consistente entre tipos de mapa)
            const baseColor = getColorPais(cid);

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
                d={pathGenerator(country)}
                className={className}
                style={fillColor ? { fill: fillColor } : undefined}
                onClick={() => handleClick(rawId)}
                onMouseEnter={() => setHovered(rawId)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        {hovered && (
          <div className="em-tooltip">
            {getCountryName(hovered)}
          </div>
        )}
      </div>

      {feedback && (
        <div className={`em-feedback em-${feedback}`}>
          {feedback === 'correcto'
            ? `¡Correcto! 🎉 Es ${reto.nombre}`
            : `Era ${reto.nombre}`}
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
