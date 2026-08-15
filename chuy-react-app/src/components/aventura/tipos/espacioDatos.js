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
  emoji: '☀️',
};

export const PLANETAS = [
  { id: 'mercurio', nombre: 'Mercurio', radio: 0.55, radioReal: 0.38, dist: 7.5, vel: 1.6, color: '#b8a89a', tex: 'craterizado', emoji: '☿️' },
  { id: 'venus', nombre: 'Venus', radio: 0.85, radioReal: 0.95, dist: 10, vel: 1.18, color: '#e8c46a', tex: 'nubes', emoji: '♀️' },
  { id: 'tierra', nombre: 'la Tierra', radio: 0.9, radioReal: 1, dist: 13, vel: 1, color: '#2f6fd0', tex: 'tierra', emoji: '🌍' },
  { id: 'marte', nombre: 'Marte', radio: 0.7, radioReal: 0.53, dist: 16, vel: 0.81, color: '#d1603d', tex: 'marte', emoji: '🔴' },
  { id: 'jupiter', nombre: 'Júpiter', radio: 2.6, radioReal: 11.2, dist: 21.5, vel: 0.44, color: '#d8a56a', tex: 'bandas', emoji: '🪐' },
  { id: 'saturno', nombre: 'Saturno', radio: 2.3, radioReal: 9.45, dist: 27.5, vel: 0.33, color: '#e3c98f', tex: 'bandas-suaves', anillos: true, emoji: '💫' },
  { id: 'urano', nombre: 'Urano', radio: 1.5, radioReal: 4.0, dist: 33, vel: 0.23, color: '#9fd8dd', tex: 'liso', emoji: '🌀' },
  { id: 'neptuno', nombre: 'Neptuno', radio: 1.45, radioReal: 3.88, dist: 38, vel: 0.18, color: '#3f66d4', tex: 'neptuno', emoji: '🔵' },
];

// Nombres de todo lo tocable en cualquier escena (onSeleccion devuelve estos ids).
export const NOMBRES = {
  sol: 'el Sol',
  tierra: 'la Tierra',
  luna: 'la Luna',
  'osa-mayor': 'la Osa Mayor',
  orion: 'Orión',
  'can-mayor': 'el Can Mayor',
  escorpion: 'el Escorpión',
  casiopea: 'Casiopea',
  cometa: 'el cometa',
  proxima: 'Próxima Centauri',
  sirio: 'Sirio',
  arcturus: 'Arcturus',
  aldebaran: 'Aldebarán',
  rigel: 'Rigel',
  betelgeuse: 'Betelgeuse',
  stephenson: 'Stephenson 2-18',
  bola: 'la bola pesada',
  canica: 'la canica',
  ...Object.fromEntries(PLANETAS.map((p) => [p.id, p.nombre])),
};

/* ============================ MODO COMPARAR (tamano real) ============================ */

// Bajo 10x muestra un decimal (distingue el 3.9x de Neptuno del 4x de
// Urano); de 10x para arriba redondea a entero (nadie necesita "109.0x").
export const formatMultiplo = (radioReal) => {
  const redondeado = radioReal < 10 ? Math.round(radioReal * 10) / 10 : Math.round(radioReal);
  const texto = Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(1);
  return `${texto}×`;
};

// "🪐 Júpiter · 11×" — etiqueta flotante del modo comparar para un cuerpo
// (Sol o planeta). El multiplo es sobre el tamaño de la Tierra: mas facil de
// comparar para un niño que los kilometros.
export const etiquetaComparar = (cuerpo) => (
  `${cuerpo.emoji} ${cuerpo.nombre.replace(/^(el|la) /, '')} · ${formatMultiplo(cuerpo.radioReal)}`
);

/* ============================ LA ESCALERA DE LAS ESTRELLAS ============================ */

// Radios en RADIOS SOLARES (reales, redondeados para niños; el orden es lo
// que importa). `paso` = escalon de la escalera en que aparece cada estrella:
// la re-normalizacion por pasos ES la leccion — en cada escalon todo se
// re-escala y el Sol se va encogiendo a la vista.
// Color por temperatura (ley de Wien): AZUL = mas caliente, ROJO = mas fria
// — al reves que las llaves del agua, y ese es el gancho.
export const PASOS_ESTRELLAS = 5;

export const ESTRELLAS_COMPARAR = [
  { id: 'tierra', nombre: 'la Tierra', radioSol: 1 / 109, tempC: null, color: '#2f6fd0', emoji: '🌍', tex: 'tierra', paso: 1 },
  { id: 'proxima', nombre: 'Próxima Centauri', radioSol: 0.15, tempC: 2800, color: '#ff6b4a', emoji: '🔴', tex: 'estrella', paso: 2 },
  { id: 'sol', nombre: 'el Sol', radioSol: 1, tempC: 5500, color: '#ffcf3f', emoji: '☀️', tex: 'estrella', paso: 1 },
  { id: 'sirio', nombre: 'Sirio', radioSol: 1.7, tempC: 9700, color: '#cfe4ff', emoji: '💎', tex: 'estrella', paso: 2 },
  { id: 'arcturus', nombre: 'Arcturus', radioSol: 25, tempC: 4000, color: '#ffb46b', emoji: '🟠', tex: 'estrella', paso: 3 },
  { id: 'aldebaran', nombre: 'Aldebarán', radioSol: 44, tempC: 3600, color: '#ff9f50', emoji: '👁️', tex: 'estrella', paso: 3 },
  { id: 'rigel', nombre: 'Rigel', radioSol: 78, tempC: 11800, color: '#9db8ff', emoji: '🔵', tex: 'estrella', paso: 4 },
  { id: 'betelgeuse', nombre: 'Betelgeuse', radioSol: 760, tempC: 3300, color: '#ff7a45', emoji: '🟥', tex: 'estrella', paso: 4 },
  { id: 'stephenson', nombre: 'Stephenson 2-18', radioSol: 2150, tempC: 3000, color: '#e84f2f', emoji: '👑', tex: 'estrella', paso: 5 },
];

// "760 soles" es mas facil de imaginar que "760×". La Tierra y el Sol llevan
// texto propio (son las referencias, no comparaciones).
export const etiquetaEstrella = (e) => {
  if (e.id === 'tierra') return '🌍 la Tierra';
  if (e.id === 'sol') return '☀️ el Sol · ¡aquí estamos!';
  const n = e.radioSol < 1
    ? String(e.radioSol)
    : e.radioSol < 10
      ? (Math.round(e.radioSol * 10) / 10).toString()
      : String(Math.round(e.radioSol));
  return `${e.emoji} ${e.nombre} · ${n} soles`;
};

// Orbitas de los planetas (en UA) para dibujarlas DENTRO de las supergigantes:
// el visual mas impactante del tema. 1 radio solar = 0.00465 UA.
export const UA_POR_RADIO_SOL = 0.00465;
export const ORBITAS_UA = [
  { id: 'mercurio', ua: 0.39 },
  { id: 'venus', ua: 0.72 },
  { id: 'tierra', ua: 1 },
  { id: 'marte', ua: 1.52 },
  { id: 'jupiter', ua: 5.2 },
  { id: 'saturno', ua: 9.58 },
];

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

/* ============================ ESTACIONES DEL AÑO ============================ */

// Convencion de la escena `estaciones`: angulo 0 = solsticio de JUNIO (el polo
// norte inclinado hacia el Sol). La orbita avanza junio → septiembre → diciembre.
export const ESTACIONES = [
  { id: 'verano', nombre: 'Verano', emoji: '☀️', mes: 'junio' },
  { id: 'otono', nombre: 'Otoño', emoji: '🍂', mes: 'septiembre' },
  { id: 'invierno', nombre: 'Invierno', emoji: '❄️', mes: 'diciembre' },
  { id: 'primavera', nombre: 'Primavera', emoji: '🌸', mes: 'marzo' },
];

// Distancia Tierra-Sol REAL: la orbita es casi un circulo perfecto
// (excentricidad 0.0167 — los ovalos exagerados de los libros son justo lo que
// alimenta el mito de "verano = mas cerca"). El perihelio cae a inicios de
// ENERO: estamos MAS CERCA del Sol en pleno invierno nuestro — la prueba
// definitiva de que la distancia no causa las estaciones.
const UA_MILLONES_KM = 149.6;
const EXCENTRICIDAD = 0.0167;
const ANGULO_PERIHELIO = 194; // solsticio de diciembre = 180; el 3 de enero ≈ +14

// Estacion en el hemisferio NORTE (Mexico) con la Tierra a `angulo` grados de su
// orbita. En el sur siempre es la contraria — esa es la mitad de la leccion.
export const estacionInfoDe = (angulo) => {
  const a = ((angulo % 360) + 360) % 360;
  const sector = Math.round(a / 90) % 4;
  const e = ESTACIONES[sector];
  const sur = ESTACIONES[(sector + 2) % 4];
  const desdePerihelio = ((a - ANGULO_PERIHELIO) * Math.PI) / 180;
  const distancia = UA_MILLONES_KM * (1 - EXCENTRICIDAD * Math.cos(desdePerihelio));
  return {
    angulo: a,
    estacion: e.id,
    nombre: e.nombre,
    emoji: e.emoji,
    mes: e.mes,
    estacionSur: sur.id,
    nombreSur: sur.nombre,
    emojiSur: sur.emoji,
    distancia: Math.round(distancia * 10) / 10,
    masCerca: Math.cos(desdePerihelio) > 0.85, // a ±~32 grados del perihelio (enero)
  };
};

/* ============================ EL COMETA ============================ */

// Orbita eliptica con el Sol en un FOCO (por eso a veces esta pegadito y a veces
// lejisimo). a = semieje mayor, e = excentricidad. El deslizador recorre el
// parametro de la elipse: 0 = perihelio (lo mas cerca), 180 = afelio (lo mas lejos).
export const COMETA = { a: 20, e: 0.75 };

export const cometaInfoDe = (angulo) => {
  const a = ((angulo % 360) + 360) % 360;
  const t = (a * Math.PI) / 180;
  const semiB = COMETA.a * Math.sqrt(1 - COMETA.e * COMETA.e);
  const foco = COMETA.a * COMETA.e;
  const x = COMETA.a * Math.cos(t) - foco;
  const z = semiB * Math.sin(t);
  const dist = Math.sqrt(x * x + z * z);
  const zona = a < 30 || a > 330 ? 'perihelio' : Math.abs(a - 180) < 30 ? 'afelio' : 'viaje';
  // El deslizador avanza como el cometa: de 0 a 180 se esta ALEJANDO del Sol.
  const alejandose = a > 0 && a < 180;
  return { angulo: a, dist, zona, alejandose };
};

/* ============================ CONSTELACIONES 3D ============================ */

// Cada estrella: figura 2D vista desde la Tierra (u = derecha, v = arriba) +
// distancia DIDACTICA en unidades de escena (conserva el ORDEN real de
// distancias, exagerado para que el dibujo se deshaga al girar). `brillo`
// escala el tamano; `color` opcional (Betelgeuse roja, Rigel azul).
// `dir` = direccion Tierra → constelacion en el mundo (se normaliza en el motor).
export const CONSTELACIONES = [
  {
    id: 'osa-mayor',
    nombre: 'la Osa Mayor',
    dir: [0.4, -0.42, -0.82],
    escalaAngular: 0.13,
    estrellas: [
      { nombre: 'Alkaid', u: -3.1, v: 0.4, dist: 27, brillo: 1.0 },
      { nombre: 'Mizar', u: -2.2, v: 0.75, dist: 21, brillo: 0.95 },
      { nombre: 'Alioth', u: -1.4, v: 0.9, dist: 20, brillo: 1.05 },
      { nombre: 'Megrez', u: -0.6, v: 1.0, dist: 19, brillo: 0.75 },
      { nombre: 'Phecda', u: -0.5, v: 0.15, dist: 20, brillo: 0.9 },
      { nombre: 'Merak', u: 0.9, v: 0.15, dist: 18, brillo: 0.95 },
      { nombre: 'Dubhe', u: 1.0, v: 1.05, dist: 32, brillo: 1.1 },
    ],
    lineas: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  {
    id: 'orion',
    nombre: 'Orión',
    dir: [-0.78, 0.36, 0.51],
    escalaAngular: 0.13,
    estrellas: [
      { nombre: 'Betelgeuse', u: 0.9, v: 1.5, dist: 22, brillo: 1.25, color: '#ff9a5c' },
      { nombre: 'Bellatrix', u: -0.9, v: 1.4, dist: 18, brillo: 0.95 },
      { nombre: 'Alnitak', u: 0.45, v: 0, dist: 34, brillo: 1.0 },
      { nombre: 'Alnilam', u: 0, v: 0.1, dist: 40, brillo: 1.05 },
      { nombre: 'Mintaka', u: -0.45, v: 0.2, dist: 33, brillo: 0.9 },
      { nombre: 'Saiph', u: 0.75, v: -1.4, dist: 25, brillo: 0.9 },
      { nombre: 'Rigel', u: -0.85, v: -1.5, dist: 28, brillo: 1.3, color: '#bcd4ff' },
    ],
    lineas: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
  {
    id: 'can-mayor',
    nombre: 'el Can Mayor',
    dir: [0.15, 0.62, 0.77],
    escalaAngular: 0.13,
    // Sirio a 8.6 años luz (casi vecina) y las demas a cientos: la
    // profundidad 3D mas dramatica de todas las figuras.
    estrellas: [
      { nombre: 'Sirio', u: 0, v: 1.2, dist: 14, brillo: 1.35, color: '#cfe4ff' },
      { nombre: 'Mirzam', u: -0.9, v: 0.9, dist: 26, brillo: 0.9 },
      { nombre: 'Wezen', u: 0.1, v: -0.9, dist: 34, brillo: 0.95 },
      { nombre: 'Adhara', u: -0.35, v: -1.4, dist: 25, brillo: 1.0 },
      { nombre: 'Aludra', u: 0.55, v: -1.3, dist: 38, brillo: 0.85 },
    ],
    lineas: [[0, 1], [0, 2], [2, 3], [2, 4]],
  },
  {
    id: 'escorpion',
    nombre: 'el Escorpión',
    dir: [0.85, -0.2, 0.49],
    escalaAngular: 0.13,
    // Antares, "la rival de Marte": otra supergigante ROJA como Betelgeuse.
    estrellas: [
      { nombre: 'Acrab', u: -0.5, v: 1.5, dist: 27, brillo: 0.9 },
      { nombre: 'Dschubba', u: -0.8, v: 1.1, dist: 27, brillo: 0.9 },
      { nombre: 'Antares', u: -0.5, v: 0.4, dist: 30, brillo: 1.3, color: '#ff5a3c' },
      { nombre: 'Epsilon Scorpii', u: -0.35, v: -0.35, dist: 17, brillo: 0.85 },
      { nombre: 'Sargas', u: 0.1, v: -1.1, dist: 24, brillo: 0.9 },
      { nombre: 'Shaula', u: 0.8, v: -1.0, dist: 34, brillo: 1.0 },
    ],
    lineas: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  },
  {
    id: 'casiopea',
    nombre: 'Casiopea',
    dir: [-0.45, -0.75, -0.48],
    escalaAngular: 0.13,
    // La W: la mas facil de encontrar de verdad en el cielo del norte.
    estrellas: [
      { nombre: 'Caph', u: -1.6, v: 0.55, dist: 16, brillo: 0.95 },
      { nombre: 'Schedar', u: -0.8, v: -0.3, dist: 26, brillo: 1.0 },
      { nombre: 'Navi', u: 0, v: 0.35, dist: 36, brillo: 1.05 },
      { nombre: 'Ruchbah', u: 0.8, v: -0.35, dist: 19, brillo: 0.9 },
      { nombre: 'Segin', u: 1.6, v: 0.45, dist: 32, brillo: 0.8 },
    ],
    lineas: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
];
