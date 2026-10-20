// Cálculo del cielo para el planificador del Observatorio ("¿Qué vemos hoy?").
// Sin React y sin red: astronomy-engine calcula todo en el navegador.
// Se importa solo desde la página lazy del Observatorio, así que la librería
// (~116 KB min) no entra al bundle principal.
//
// Una "noche" se nombra por la fecha de su tarde: la madrugada del sábado
// pertenece a la noche del viernes.

import * as A from 'astronomy-engine';
import { SITIO, VENTANA } from '../data/observatorio/sitio.js';
import { CATALOGO, LLUVIAS } from '../data/observatorio/catalogo.js';

const OBS = new A.Observer(SITIO.lat, SITIO.lon, SITIO.alturaM);
const PASO_MIN = 15;
const DIA_MS = 86400000;

// Altura máxima del Sol (grados) a la que cada tipo ya se alcanza a ver.
const SOL_MAX = {
  luna: -4, planeta: -6, doble: -9, estrella: -9,
  cumulo: -12, nebulosa: -15, galaxia: -15,
};
// Una Luna arriba y más iluminada que esto apaga galaxias y nebulosas.
const LUNA_APAGA = 0.35;

const altMinDe = (o) => o.altMin ?? (o.tipo === 'luna' || o.tipo === 'planeta' ? 20 : 25);

// ── Fechas ──────────────────────────────────────────────────────

export function fechaNocheActual(ahora = new Date()) {
  const d = new Date(ahora);
  if (d.getHours() < 12) d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// h puede pasar de 24 (madrugada del día siguiente): setHours lo acomoda.
const enHora = (dia, h, m = 0) => {
  const d = new Date(dia);
  d.setHours(h, m, 0, 0);
  return d;
};

const sumarDias = (dia, n) => {
  const d = new Date(dia);
  d.setDate(d.getDate() + n);
  return d;
};

// ── Posiciones ──────────────────────────────────────────────────

function horizonteCuerpo(cuerpo, t) {
  const eq = A.Equator(A.Body[cuerpo], t, OBS, true, true);
  return A.Horizon(t, OBS, eq.ra, eq.dec, 'normal');
}

function horizonteDe(obj, t) {
  if (obj.cuerpo) return horizonteCuerpo(obj.cuerpo, t);
  return A.Horizon(t, OBS, obj.ra, obj.dec, 'normal');
}

const RUMBOS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];
export const rumbo = (az) => RUMBOS[Math.round(az / 45) % 8];

// Un puño con el brazo estirado tapa ~10° del cielo.
export function alturaEnPunos(alt) {
  if (alt >= 70) return 'casi arriba de tu cabeza';
  const n = Math.max(1, Math.round(alt / 10));
  return `a ${n} ${n === 1 ? 'puño' : 'puños'} de altura`;
}

export const direccion = (alt, az) => `hacia el ${rumbo(az)}, ${alturaEnPunos(alt)}`;

// ── La Luna ─────────────────────────────────────────────────────

const FASES_LUNA = [
  ['Luna nueva', '🌑'], ['Luna creciente', '🌒'], ['Cuarto creciente', '🌓'],
  ['Gibosa creciente', '🌔'], ['Luna llena', '🌕'], ['Gibosa menguante', '🌖'],
  ['Cuarto menguante', '🌗'], ['Luna menguante', '🌘'],
];

export function lunaEn(t) {
  const fase = A.MoonPhase(t); // 0 nueva, 90 cuarto creciente, 180 llena
  const ilum = A.Illumination(A.Body.Moon, t).phase_fraction;
  const [nombre, emoji] = FASES_LUNA[Math.round(fase / 45) % 8];
  return { fase, ilum, nombre, emoji, creciente: fase < 180 };
}

// ── Ventanas de la noche ────────────────────────────────────────

function ventanasDe(dia) {
  const mediodia = enHora(dia, 12);
  const buscarSol = (dir, alt, desde) => A.SearchAltitude(A.Body.Sun, OBS, dir, desde, 1, alt)?.date ?? null;
  const puesta = A.SearchRiseSet(A.Body.Sun, OBS, -1, mediodia, 1)?.date ?? null;
  const salida = A.SearchRiseSet(A.Body.Sun, OBS, +1, enHora(dia, 18), 1)?.date ?? null;
  return {
    puesta,
    finCrepusculo: buscarSol(-1, -6, mediodia),
    oscuro: buscarSol(-1, -18, mediodia),
    finOscuro: buscarSol(+1, -18, enHora(dia, 18)),
    salida,
    familiar: {
      inicio: enHora(dia, VENTANA.inicio.h, VENTANA.inicio.m),
      fin: enHora(dia, VENTANA.fin.h, VENTANA.fin.m),
    },
    nocheEntera: VENTANA.diasNocheEntera.includes(dia.getDay()),
  };
}

function muestrasEntre(inicio, fin) {
  const out = [];
  for (let t = inicio.getTime(); t <= fin.getTime(); t += PASO_MIN * 60000) {
    const fecha = new Date(t);
    const sol = horizonteCuerpo('Sun', fecha).altitude;
    const luna = horizonteCuerpo('Moon', fecha).altitude;
    out.push({ t: fecha, sol, lunaAlt: luna });
  }
  return out;
}

// ── Evaluar objetos ─────────────────────────────────────────────

function evaluar(obj, muestras, ilumLuna) {
  if (obj.tipo === 'luna' && ilumLuna < 0.05) return null; // Luna nueva: no hay nada que ver
  const altMin = altMinDe(obj);
  const solMax = SOL_MAX[obj.tipo] ?? -12;
  let mejor = null;
  let desde = null;
  let hasta = null;
  let apagadoPorLuna = false;

  for (const m of muestras) {
    if (m.sol > solMax) continue;
    const pos = horizonteDe(obj, m.t);
    if (pos.altitude < altMin) continue;
    if ((obj.tipo === 'galaxia' || obj.tipo === 'nebulosa') && m.lunaAlt > 0 && ilumLuna > LUNA_APAGA) {
      apagadoPorLuna = true;
      continue;
    }
    if (!desde) desde = m.t;
    hasta = m.t;
    if (!mejor || pos.altitude > mejor.alt) mejor = { t: m.t, alt: pos.altitude, az: pos.azimuth };
  }
  if (!mejor) return apagadoPorLuna ? { obj, apagadoPorLuna: true } : null;

  let wow = obj.wow;
  if (obj.tipo === 'luna') wow = ilumLuna > 0.15 && ilumLuna < 0.85 ? 3 : 2;
  let puntaje = wow * 10 + Math.min(mejor.alt, 60) / 6 - (obj.dificultad - 1) * 3 + (obj.mision ? 2 : 0);
  // Un cúmulo con la Luna muy llena arriba pierde brillo, pero se sigue viendo.
  const lunaArriba = muestras.some((m) => m.t.getTime() === mejor.t.getTime() && m.lunaAlt > 0);
  if (obj.tipo === 'cumulo' && lunaArriba && ilumLuna > 0.6) puntaje *= 0.6;

  return { obj, mejor, desde, hasta, puntaje, ocular: ocularPara(obj, ilumLuna) };
}

function ocularPara(obj, ilumLuna) {
  const mm = obj.oculares[0];
  const filtro = obj.tipo === 'luna' && ilumLuna > 0.6;
  return { mm, filtro };
}

// Detalle del momento que cambia con la fecha (lo fijo vive en el catálogo).
function detalleDe(obj, t, luna) {
  if (obj.id === 'saturno') {
    const tilt = Math.abs(A.Illumination(A.Body.Saturn, t).ring_tilt);
    return tilt < 10
      ? `Anillos inclinados solo ${tilt.toFixed(0)}°: se ven delgaditos.`
      : `Anillos inclinados ${tilt.toFixed(0)}°.`;
  }
  if (obj.tipo === 'luna') {
    if (luna.ilum > 0.92) return 'Luna llena: deslumbra (usa el filtro) y los cráteres se ven planos, pero lucen los rayos de Tycho.';
    if (luna.ilum > 0.15 && luna.ilum < 0.85) return `${luna.nombre}: noche buena de cráteres en la línea de sombra.`;
    return `${luna.nombre}: un gajito delgado, bonito pero con pocos cráteres a la vista.`;
  }
  return null;
}

// ── Eventos ─────────────────────────────────────────────────────

const NOMBRES_CUARTO = ['Luna nueva', 'Cuarto creciente', 'Luna llena', 'Cuarto menguante'];
const TEXTO_CUARTO = [
  'Noches oscuras alrededor: las mejores para galaxias y nebulosas.',
  'Las noches de cerca son las mejores para cazar cráteres.',
  'Deslumbra: usa el filtro. Mala para cráteres y galaxias, buena para los rayos de Tycho.',
  'La Luna sale de madrugada: el horario familiar queda oscuro.',
];
const OPOSICIONES = [
  ['Mars', 'Marte'], ['Jupiter', 'Júpiter'], ['Saturn', 'Saturno'],
];
const NOMBRE_ECLIPSE = { total: 'total', partial: 'parcial', penumbral: 'penumbral' };

// Eventos de los próximos `dias` (oposiciones y eclipses se buscan más lejos).
// Nunca se listan eclipses de Sol ni nada que se observe cerca del Sol.
export function proximosEventos(desde, dias = 60) {
  const hasta = new Date(desde.getTime() + dias * DIA_MS);
  const eventos = [];

  let q = A.SearchMoonQuarter(desde);
  while (q.time.date <= hasta) {
    eventos.push({
      id: `cuarto-${q.time.date.getTime()}`, tipo: 'luna', t: q.time.date,
      emoji: ['🌑', '🌓', '🌕', '🌗'][q.quarter],
      titulo: NOMBRES_CUARTO[q.quarter], texto: TEXTO_CUARTO[q.quarter],
    });
    q = A.NextMoonQuarter(q);
  }

  const hastaLejos = new Date(desde.getTime() + 150 * DIA_MS);
  for (const [cuerpo, nombre] of OPOSICIONES) {
    const t = A.SearchRelativeLongitude(A.Body[cuerpo], 0, desde)?.date;
    if (t && t <= hastaLejos) {
      eventos.push({
        id: `oposicion-${cuerpo}`, tipo: 'oposicion', t, emoji: '🌟', excepcional: true,
        titulo: `${nombre} en oposición`,
        texto: 'Su mejor momento del año: sale al atardecer, está toda la noche y se ve más grande y brillante que nunca.',
      });
    }
  }

  let e = A.SearchLunarEclipse(desde);
  for (let i = 0; i < 4 && e.peak.date.getTime() <= desde.getTime() + 365 * DIA_MS; i++) {
    const alt = horizonteCuerpo('Moon', e.peak.date).altitude;
    if (alt > 0) {
      const penumbral = e.kind === 'penumbral';
      eventos.push({
        id: `eclipse-${e.peak.date.getTime()}`, tipo: 'eclipse', t: e.peak.date, emoji: '🌘',
        excepcional: !penumbral,
        titulo: `Eclipse de Luna ${NOMBRE_ECLIPSE[e.kind] || ''}`.trim(),
        texto: penumbral
          ? 'Penumbral: la Luna apenas se oscurece un poco. Casi no se nota.'
          : 'La sombra de la Tierra se come a la Luna y la puede poner rojiza. Se ve sin telescopio, y con el de 25 mm todavía mejor.',
      });
    }
    e = A.NextLunarEclipse(e.peak);
  }

  for (const anio of [desde.getFullYear(), desde.getFullYear() + 1]) {
    for (const ll of LLUVIAS) {
      const noche = new Date(anio, ll.mes - 1, ll.dia);
      const t = enHora(noche, ll.desde < 12 ? ll.desde + 24 : ll.desde);
      if (t < desde || t > hasta) continue;
      const ilum = A.Illumination(A.Body.Moon, t).phase_fraction;
      const lunaEstorba = ilum >= 0.5 && horizonteCuerpo('Moon', t).altitude > 0;
      eventos.push({
        id: `lluvia-${ll.id}-${anio}`, tipo: 'lluvia', t, emoji: '☄️',
        excepcional: ll.grande && !lunaEstorba,
        titulo: `Lluvia de estrellas: ${ll.nombre}`,
        texto: `En el mejor de los casos, unas ${ll.porHora} estrellas fugaces por hora (en la práctica, menos). `
          + `Sin telescopio: acostados, mirando el cielo. Mejor desde las ${ll.desde}:00. `
          + (lunaEstorba ? 'Este año la Luna estorba.' : 'Este año la Luna no estorba.'),
      });
    }
  }

  return eventos.sort((a, b) => a.t - b.t);
}

// ── Plan de una noche ───────────────────────────────────────────

export function planNoche(dia, eventos = []) {
  const v = ventanasDe(dia);
  const medio = new Date((v.familiar.inicio.getTime() + v.familiar.fin.getTime()) / 2);
  const luna = lunaEn(medio);
  const salidaLuna = A.SearchRiseSet(A.Body.Moon, OBS, +1, enHora(dia, 12), 1)?.date ?? null;
  const puestaLuna = A.SearchRiseSet(A.Body.Moon, OBS, -1, enHora(dia, 12), 1)?.date ?? null;

  const muestras = muestrasEntre(v.familiar.inicio, v.familiar.fin);
  const evaluados = CATALOGO.map((o) => evaluar(o, muestras, luna.ilum)).filter(Boolean);
  const objetos = evaluados
    .filter((r) => r.mejor)
    .sort((a, b) => b.puntaje - a.puntaje)
    .map((r) => ({ ...r, detalle: detalleDe(r.obj, r.mejor.t, luna) }));
  const apagadosPorLuna = evaluados.filter((r) => !r.mejor).map((r) => r.obj);

  // Eventos que caen en esta noche (de mediodía a mediodía).
  const iniNoche = enHora(dia, 12).getTime();
  const finNoche = iniNoche + DIA_MS;
  const eventosNoche = eventos
    .filter((e) => e.t.getTime() >= iniNoche && e.t.getTime() < finNoche)
    .map((e) => ({
      ...e,
      fueraDeHorario: e.tipo !== 'luna' && e.tipo !== 'oposicion'
        && (e.t < v.familiar.inicio || e.t > v.familiar.fin),
    }));

  return {
    dia, ventanas: v, luna, salidaLuna, puestaLuna,
    objetos, apagadosPorLuna, eventos: eventosNoche,
    excepcionales: eventosNoche.filter((e) => e.excepcional),
  };
}

// Resumen de varias noches para la tira "Esta semana".
export function semana(desde, n = 7, eventos = []) {
  return Array.from({ length: n }, (_, i) => {
    const dia = sumarDias(desde, i);
    const p = planNoche(dia, eventos);
    return {
      dia,
      luna: p.luna,
      ventanas: p.ventanas,
      mejores: p.objetos.slice(0, 3).map((r) => r.obj),
      total: p.objetos.length,
      excepcional: p.excepcionales.length > 0,
    };
  });
}
