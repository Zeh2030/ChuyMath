import React, { useState, useEffect, useMemo } from 'react';
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
  'america-latina': [
    '484','320','340','222','188','558','591','862','068','076','032','152',
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
  'america-latina':  { proj: 'mercator',      center: [-65, -10], scale: 380 },
  'europa':          { proj: 'mercator',      center: [15, 55],   scale: 600 },
  'asia':            { proj: 'mercator',      center: [90, 30],   scale: 250 },
  'africa':          { proj: 'mercator',      center: [20, 0],    scale: 350 },
};

const VIEWPORT = { width: 800, height: 500 };

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

  const reto = retos[retoIdx];
  const total = retos.length;
  const esModoQuiz = modo === 'quiz';

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
    <div className="em-container">
      {esModoQuiz && (
        <div className="em-progreso">
          <span className="em-contador">{retoIdx + 1} / {total}</span>
          <span className="em-racha">🔥 {aciertos}</span>
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
        >
          {countries.map(country => {
            const cid = normalizeId(country.id);
            const isCorrect = esModoQuiz && cid === normalizeId(reto?.id);
            const isSelected = cid === normalizeId(seleccionado);
            const isHovered = cid === normalizeId(hovered);

            let className = 'em-pais';
            if (feedback) {
              if (isCorrect) className += ' em-correcto';
              else if (isSelected) className += ' em-incorrecto';
            } else if (isSelected && !esModoQuiz) {
              className += ' em-seleccionado';
            }
            if (isHovered) className += ' em-hover';

            return (
              <path
                key={country.id}
                d={pathGenerator(country)}
                className={className}
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
