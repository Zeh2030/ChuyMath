// Pronóstico por hora para el Observatorio, de Open-Meteo (gratis, sin llave,
// CORS abierto; datos CC BY 4.0 → la página muestra la atribución).
// Se guarda 1 hora en localStorage para no pedirlo en cada visita.

import { SITIO } from '../data/observatorio/sitio.js';

const CLAVE = `chuymath_clima_v1_${SITIO.lat}_${SITIO.lon}`;
const VIGENCIA_MS = 60 * 60 * 1000;
const URL = 'https://api.open-meteo.com/v1/forecast'
  + `?latitude=${SITIO.lat}&longitude=${SITIO.lon}`
  + '&hourly=cloud_cover,relative_humidity_2m,temperature_2m,dew_point_2m,wind_speed_10m'
  + '&forecast_days=8&timeformat=unixtime&timezone=auto';

function leerCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE));
    if (c && Date.now() - c.guardado < VIGENCIA_MS) return c.datos;
  } catch {
    // sin almacenamiento disponible: se pide a la red
  }
  return null;
}

function guardarCache(datos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ guardado: Date.now(), datos }));
  } catch {
    // no pasa nada: la próxima visita se vuelve a pedir
  }
}

// Devuelve [{ t (ms), nubes %, humedad %, temp °C, rocio °C, viento km/h }]
export async function cargarClima() {
  const enCache = leerCache();
  if (enCache) return enCache;
  const r = await fetch(URL);
  if (!r.ok) throw new Error(`Open-Meteo respondió ${r.status}`);
  const j = await r.json();
  const h = j.hourly;
  const datos = h.time.map((s, i) => ({
    t: s * 1000,
    nubes: h.cloud_cover[i],
    humedad: h.relative_humidity_2m[i],
    temp: h.temperature_2m[i],
    rocio: h.dew_point_2m[i],
    viento: h.wind_speed_10m[i],
  }));
  guardarCache(datos);
  return datos;
}

// Resume el pronóstico de una ventana. null si el pronóstico no llega a esa fecha.
export function climaDeVentana(horas, inicio, fin) {
  if (!horas) return null;
  const ini = inicio.getTime() - 30 * 60000;
  const tramo = horas.filter((h) => h.t >= ini && h.t <= fin.getTime());
  if (!tramo.length) return null;

  const nubes = Math.round(tramo.reduce((s, h) => s + h.nubes, 0) / tramo.length);
  const viento = Math.max(...tramo.map((h) => h.viento));
  const temp = Math.min(...tramo.map((h) => h.temp));
  const margenRocio = Math.min(...tramo.map((h) => h.temp - h.rocio));

  const semaforo = nubes < 25
    ? { nivel: 'verde', emoji: '🟢', texto: 'Despejado' }
    : nubes < 60
      ? { nivel: 'amarillo', emoji: '🟡', texto: 'Nubes a ratos' }
      : { nivel: 'rojo', emoji: '🔴', texto: 'Nublado' };

  const avisos = [];
  if (viento >= 25) avisos.push(`Viento de ${Math.round(viento)} km/h: el tubo va a temblar.`);
  if (margenRocio <= 2) avisos.push('Mucha humedad: se puede mojar el espejo. Tapa el telescopio al terminar.');
  if (temp <= 10) avisos.push(`Frío (${Math.round(temp)} °C): abríguense.`);

  return { nubes, viento, temp, semaforo, avisos };
}
