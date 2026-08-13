/**
 * Datos compartidos del modulo de astronomia (tipo `sistema-solar`).
 *
 * Vive en su propio archivo SIN dependencia de three.js a proposito: lo importan
 * tanto el wrapper (SistemaSolar.jsx, chunk principal) como el motor 3D
 * (Espacio3D.jsx, chunk lazy). Si estos datos vivieran en Espacio3D, el wrapper
 * arrastraria three.js al bundle principal y se perderia el lazy import.
 *
 * `radio`/`dist` son la ESCALA DIDACTICA (para que todo se vea y se pueda tocar).
 * `radioReal` es el radio relativo real (Tierra = 1) y solo se usa en el modo
 * "tamano real", que forma los cuerpos en fila estilo poster comparativo.
 */

export const SOL = {
  id: 'sol',
  nombre: 'el Sol',
  radio: 3.6,
  radioReal: 109,
  color: '#ffcf3f',
  tex: 'sol',
};

export const PLANETAS = [
  { id: 'mercurio', nombre: 'Mercurio', radio: 0.55, radioReal: 0.38, dist: 7.5, vel: 1.6, color: '#b8a89a', tex: 'craterizado' },
  { id: 'venus', nombre: 'Venus', radio: 0.85, radioReal: 0.95, dist: 10, vel: 1.18, color: '#e8c46a', tex: 'nubes' },
  { id: 'tierra', nombre: 'la Tierra', radio: 0.9, radioReal: 1, dist: 13, vel: 1, color: '#2f6fd0', tex: 'tierra' },
  { id: 'marte', nombre: 'Marte', radio: 0.7, radioReal: 0.53, dist: 16, vel: 0.81, color: '#d1603d', tex: 'marte' },
  { id: 'jupiter', nombre: 'Júpiter', radio: 2.6, radioReal: 11.2, dist: 21.5, vel: 0.44, color: '#d8a56a', tex: 'bandas' },
  { id: 'saturno', nombre: 'Saturno', radio: 2.3, radioReal: 9.45, dist: 27.5, vel: 0.33, color: '#e3c98f', tex: 'bandas-suaves', anillos: true },
  { id: 'urano', nombre: 'Urano', radio: 1.5, radioReal: 4.0, dist: 33, vel: 0.23, color: '#9fd8dd', tex: 'liso' },
  { id: 'neptuno', nombre: 'Neptuno', radio: 1.45, radioReal: 3.88, dist: 38, vel: 0.18, color: '#3f66d4', tex: 'neptuno' },
];

// Cuerpos de la escena tierra-luna (ids que puede devolver onSeleccion alli).
export const NOMBRES = {
  sol: 'el Sol',
  tierra: 'la Tierra',
  luna: 'la Luna',
  ...Object.fromEntries(PLANETAS.map((p) => [p.id, p.nombre])),
};

/* ============================ FASES DE LA LUNA ============================ */

// Orden creciente del angulo Sol-Tierra-Luna: 0 = Luna entre la Tierra y el Sol.
export const FASES = [
  { id: 'nueva', nombre: 'Luna nueva', emoji: '🌑' },
  { id: 'creciente', nombre: 'Luna creciente', emoji: '🌒' },
  { id: 'cuarto-creciente', nombre: 'Cuarto creciente', emoji: '🌓' },
  { id: 'gibosa-creciente', nombre: 'Gibosa creciente', emoji: '🌔' },
  { id: 'llena', nombre: 'Luna llena', emoji: '🌕' },
  { id: 'gibosa-menguante', nombre: 'Gibosa menguante', emoji: '🌖' },
  { id: 'cuarto-menguante', nombre: 'Cuarto menguante', emoji: '🌗' },
  { id: 'menguante', nombre: 'Luna menguante', emoji: '🌘' },
];

// Ventana estrecha: el eclipse exige alineacion casi perfecta. (En la realidad
// no hay eclipse cada mes porque la orbita lunar esta inclinada ~5 grados.)
const VENTANA_ECLIPSE = 6;

/**
 * Que fase se ve desde la Tierra con la Luna a `angulo` grados (0-360) de la
 * direccion del Sol. Devuelve tambien si hay alineacion de eclipse.
 */
export const faseInfoDe = (angulo) => {
  const a = ((angulo % 360) + 360) % 360;
  const sector = Math.round(a / 45) % 8;
  const fase = FASES[sector];
  const eclipseSol = a < VENTANA_ECLIPSE || a > 360 - VENTANA_ECLIPSE;
  const eclipseLuna = Math.abs(a - 180) < VENTANA_ECLIPSE;
  return { angulo: a, fase: fase.id, nombre: fase.nombre, emoji: fase.emoji, eclipseSol, eclipseLuna };
};
