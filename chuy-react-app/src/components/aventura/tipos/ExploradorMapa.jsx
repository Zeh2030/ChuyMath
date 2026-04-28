import React, { useState, useEffect, useMemo, useRef } from 'react';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoMercator, geoPath } from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';
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
};

const VIEWPORT = { width: 800, height: 500 };

// Mapeo de pais (ISO numerico) → continente (Montessori-style)
const CONTINENTES = {
  // Norte America (naranja)
  'norte': ['124','840','484','304'],
  // Centro America + Caribe (variante naranja-rosa)
  'centro': ['084','188','222','320','340','558','591','044','052','092','192','212','214','308','332','388','630','659','662','670','780','533','028'],
  // Sur America (rosa)
  'sur': ['032','068','076','152','170','218','254','328','600','604','740','858','862','238'],
  // Europa (rojo)
  'europa': ['040','056','100','203','208','233','246','250','276','300','348','352','372','380','428','440','442','470','492','528','578','616','620','642','643','703','705','724','752','756','826','070','191','196','498','499','688','804','807'],
  // Asia (amarillo)
  'asia': ['004','050','051','031','048','156','196','356','360','364','368','376','392','398','400','408','410','414','417','418','422','446','458','462','496','512','524','586','608','626','634','682','702','704','144','760','762','764','784','792','795','860','887'],
  // Africa (verde)
  'africa': ['012','024','072','108','120','132','140','148','174','178','180','204','226','231','232','262','266','270','288','324','384','404','426','430','434','450','454','466','478','480','504','508','516','562','566','646','678','686','690','694','706','710','716','728','729','732','748','768','788','800','834','854'],
  // Oceania (cafe/marron)
  'oceania': ['036','242','296','316','520','540','548','554','574','580','583','584','585','598','612','772','776','798','882','876'],
};

// Paletas por continente — colores Montessori adaptados (variaciones suaves)
const PALETAS = {
  'norte':   ['#FFB347','#FFA94D','#FF9233','#F39C12','#E67E22','#D4801A'],     // naranjas
  'centro':  ['#FFA07A','#F38E68','#FF9D8C','#FFB6A3','#FF8E76','#E58E66'],     // coral
  'sur':     ['#F8B7C5','#F5A0B0','#FFB6C1','#FFA8B9','#F2A8B5','#E89DAB'],     // rosas
  'europa':  ['#FF8C8C','#F47878','#FF9999','#FF7B7B','#E67878','#FF8E8E'],     // rojos suaves
  'asia':    ['#FFE066','#FFD93D','#FFD966','#FFCB47','#FFC857','#FFE599'],     // amarillos
  'africa':  ['#95C98A','#7FBE6F','#88C97A','#A2D098','#6FB360','#83C475'],     // verdes
  'oceania': ['#C19A6B','#B58860','#A87E5C','#C9A878','#BB9166','#A88455'],     // marrones
  'default': ['#B0BEC5','#90A4AE','#A5B4BC'],                                    // gris para no clasificados
};

// Determina continente de un pais (ISO numerico padded a 3 digitos)
const getContinente = (idPadded) => {
  for (const [cont, ids] of Object.entries(CONTINENTES)) {
    if (ids.includes(idPadded)) return cont;
  }
  return 'default';
};

// Color deterministico por pais (basado en hash simple del ID)
const getColorPais = (idPadded) => {
  const cont = getContinente(idPadded);
  const paleta = PALETAS[cont];
  // Hash simple: suma de digitos del ID, modulo paleta length
  const hash = idPadded.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return paleta[hash % paleta.length];
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

  // Extraer features del topojson y proyectar
  const { countries, pathGenerator } = useMemo(() => {
    const allCountries = feature(worldData, worldData.objects.countries).features;
    const filterIds = REGIONES[mapa];
    const filtered = filterIds
      ? allCountries.filter(c => filterIds.includes(String(c.id).padStart(3, '0')))
      : allCountries;

    const config = PROJECTIONS[mapa] || PROJECTIONS['world'];
    const projection = (config.proj === 'mercator' ? geoMercator() : geoNaturalEarth1())
      .center(config.center)
      .scale(config.scale)
      .translate([VIEWPORT.width / 2, VIEWPORT.height / 2]);

    return {
      countries: filtered,
      pathGenerator: geoPath(projection),
    };
  }, [mapa]);

  // Normalizar IDs (world-atlas usa string sin padding, JSON puede usar "076" o "76")
  const normalizeId = (id) => String(id).padStart(3, '0');

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

  // Buscar nombre de pais por ID (para tooltips en modo explorar)
  const getCountryName = (id) => {
    const country = countries.find(c => normalizeId(c.id) === normalizeId(id));
    return country?.properties?.name || '';
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
          {countries.map(country => {
            const cid = normalizeId(country.id);
            const isCorrect = esModoQuiz && cid === normalizeId(reto?.id);
            const isSelected = cid === normalizeId(seleccionado);
            const isHovered = cid === normalizeId(hovered);
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
                key={country.id}
                d={pathGenerator(country)}
                className={className}
                style={fillColor ? { fill: fillColor } : undefined}
                onClick={() => handleClick(country.id)}
                onMouseEnter={() => setHovered(country.id)}
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
