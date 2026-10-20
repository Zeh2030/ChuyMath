// Catálogo curado del Observatorio: lo que vale la pena buscar con un reflector
// de 150 mm desde Jerez (22.6° N). Sin three ni astronomy-engine: datos puros.
//
// Campos:
//   tipo        luna | planeta | doble | estrella | cumulo | nebulosa | galaxia
//   cuerpo      (luna y planetas) nombre del cuerpo en astronomy-engine
//   ra, dec     (el resto) coordenadas J2000 en horas y grados. La precesión
//               desde 2000 mueve ~0.35°: no cambia ninguna recomendación.
//   wow         1-3, cuánto impresiona a un niño
//   dificultad  1-3 (1 = se encuentra solo; 3 = cielo oscuro y paciencia)
//   oculares    en orden de preferencia (mm)
//   altMin      opcional; por defecto 20° (luna/planetas) o 25° (el resto)
//   queVeras    lo que se ve DE VERDAD por el ocular (nunca prometer la foto)
//   mision      id del documento OB-xx (misión de observación)
//   leccion     id de una lección ya construida, para el "antes de salir"

export const CATALOGO = [
  // ── Luna y planetas ─────────────────────────────────────────────
  {
    id: 'luna', nombre: 'La Luna', emoji: '🌙', tipo: 'luna', cuerpo: 'Moon',
    wow: 3, dificultad: 1, oculares: [25, 10],
    queVeras: 'Cráteres, montañas y mares de lava. Los mejores cráteres están en la orilla entre la luz y la sombra.',
    mision: 'OB-04_la-luna', leccion: 'C2-24_fases-de-la-luna',
  },
  {
    id: 'saturno', nombre: 'Saturno', emoji: '🪐', tipo: 'planeta', cuerpo: 'Saturn',
    wow: 3, dificultad: 1, oculares: [10, 6],
    queVeras: 'Una bolita amarilla con sus anillos (estos años, delgaditos) y una o varias lunitas cerca: la más brillante es Titán.',
    mision: 'OB-03_saturno', leccion: 'C2-21_sistema-solar-3d',
  },
  {
    id: 'jupiter', nombre: 'Júpiter', emoji: '🟠', tipo: 'planeta', cuerpo: 'Jupiter',
    wow: 3, dificultad: 1, oculares: [10, 6],
    queVeras: 'Un disco con dos rayas oscuras (sus nubes) y hasta 4 lunas en fila, las mismas que vio Galileo. Cambian de lugar cada noche.',
    leccion: 'C2-34_comparando-planetas',
  },
  {
    id: 'marte', nombre: 'Marte', emoji: '🔴', tipo: 'planeta', cuerpo: 'Mars',
    wow: 2, dificultad: 2, oculares: [10, 6],
    queVeras: 'Un disquito naranja. Solo cuando está cerca de la Tierra se alcanza a ver una manchita blanca: su casquete de hielo.',
    leccion: 'C2-30_marte',
  },
  {
    id: 'urano', nombre: 'Urano', emoji: '🔵', tipo: 'planeta', cuerpo: 'Uranus',
    wow: 1, dificultad: 3, oculares: [10, 6],
    queVeras: 'Un puntito verde-azulado que no parpadea. Poca cosa… pero es un planeta que nadie conocía hasta 1781.',
    leccion: 'C2-42_el-sistema-solar-de-verdad',
  },
  {
    id: 'neptuno', nombre: 'Neptuno', emoji: '🫐', tipo: 'planeta', cuerpo: 'Neptune',
    wow: 1, dificultad: 3, oculares: [10, 6],
    queVeras: 'Una estrellita azulada, casi igual a las demás. Es el planeta más lejano: su luz tarda 4 horas en llegar.',
    leccion: 'C2-42_el-sistema-solar-de-verdad',
  },

  // ── Estrellas y estrellas dobles ────────────────────────────────
  {
    id: 'albireo', nombre: 'Albireo', emoji: '✨', tipo: 'doble', ra: 19.512, dec: 27.96,
    wow: 3, dificultad: 1, oculares: [25, 10],
    queVeras: 'Una estrella que en el telescopio se vuelve DOS: una dorada y una azul.',
    mision: 'OB-06_albireo', leccion: 'C2-35_gigantes-del-universo',
  },
  {
    id: 'mizar', nombre: 'Mizar y Alcor', emoji: '🐴', tipo: 'doble', ra: 13.399, dec: 54.93,
    wow: 2, dificultad: 1, oculares: [25, 10],
    queVeras: 'En el mango de la Osa Mayor: a simple vista son dos, y con el telescopio Mizar se parte en dos más.',
  },
  {
    id: 'almach', nombre: 'Almach', emoji: '💛', tipo: 'doble', ra: 2.065, dec: 42.33,
    wow: 2, dificultad: 2, oculares: [10, 6],
    queVeras: 'Otra doble de colores, parecida a Albireo pero más apretada: una naranja y una azulita.',
  },
  {
    id: 'castor', nombre: 'Cástor', emoji: '👯', tipo: 'doble', ra: 7.577, dec: 31.89,
    wow: 1, dificultad: 2, oculares: [6, 10],
    queVeras: 'Uno de los gemelos de Géminis. Con el ocular fuerte se separa en dos estrellas blancas pegaditas.',
  },
  {
    id: 'doble-doble', nombre: 'La Doble Doble', emoji: '🎲', tipo: 'doble', ra: 18.739, dec: 39.67,
    wow: 2, dificultad: 3, oculares: [25, 6],
    queVeras: 'Junto a Vega: con el de 25 se ven dos estrellas, y con el de 6, si el aire está quieto, cada una se parte en dos. ¡Cuatro!',
  },
  {
    id: 'betelgeuse', nombre: 'Betelgeuse', emoji: '🔴', tipo: 'estrella', ra: 5.919, dec: 7.41,
    wow: 2, dificultad: 1, oculares: [25],
    queVeras: 'El hombro de Orión: una estrella claramente naranja-rojiza. Es tan grande que dentro cabría la órbita de Marte.',
    leccion: 'C2-35_gigantes-del-universo',
  },
  {
    id: 'sirio', nombre: 'Sirio', emoji: '💎', tipo: 'estrella', ra: 6.753, dec: -16.72,
    wow: 1, dificultad: 1, oculares: [25],
    queVeras: 'La estrella más brillante de la noche. Cerca del horizonte centellea de muchos colores por el aire.',
    leccion: 'C2-35_gigantes-del-universo',
  },

  // ── Cúmulos de estrellas ────────────────────────────────────────
  {
    id: 'pleyades', nombre: 'Las Pléyades', emoji: '💠', tipo: 'cumulo', ra: 3.79, dec: 24.12,
    wow: 3, dificultad: 1, oculares: [25],
    queVeras: 'Un puñado de estrellas azules brillantes. A simple vista cuentas 6 o 7; con el de 25 mm, decenas.',
    leccion: 'C2-26_constelaciones',
  },
  {
    id: 'pesebre', nombre: 'El Pesebre', emoji: '🐝', tipo: 'cumulo', ra: 8.673, dec: 19.98,
    wow: 2, dificultad: 2, oculares: [25],
    queVeras: 'Un enjambre de estrellas que a simple vista es apenas una nubecita. Llena todo el ocular de 25 mm.',
  },
  {
    id: 'doble-cumulo', nombre: 'El Doble Cúmulo', emoji: '👀', tipo: 'cumulo', ra: 2.333, dec: 57.13,
    wow: 3, dificultad: 2, oculares: [25],
    queVeras: 'Dos montones de estrellas lado a lado, como un par de ojos brillantes. Caben juntos en el de 25 mm.',
  },
  {
    id: 'm13', nombre: 'Cúmulo de Hércules', emoji: '🔮', tipo: 'cumulo', ra: 16.695, dec: 36.46,
    wow: 2, dificultad: 2, oculares: [10, 6],
    queVeras: 'Una bolita de algodón brillante: son cientos de miles de estrellas apretadas. En la orilla algunas se separan.',
  },
  {
    id: 'm22', nombre: 'Cúmulo de Sagitario', emoji: '🔮', tipo: 'cumulo', ra: 18.607, dec: -23.9,
    wow: 2, dificultad: 2, oculares: [10],
    queVeras: 'Otra bola de estrellas, de las más brillantes del cielo. Desde Jerez se ve bien porque Sagitario nos queda alto.',
  },
  {
    id: 'm11', nombre: 'El Pato Salvaje', emoji: '🦆', tipo: 'cumulo', ra: 18.851, dec: -6.27,
    wow: 2, dificultad: 2, oculares: [10],
    queVeras: 'Un montón de estrellas en forma de V, como patos volando en parvada.',
  },
  {
    id: 'm7', nombre: 'Cúmulo de Ptolomeo', emoji: '🦂', tipo: 'cumulo', ra: 17.898, dec: -34.79, altMin: 15,
    wow: 2, dificultad: 1, oculares: [25],
    queVeras: 'En la cola del Escorpión: un grupo grande de estrellas brillantes. Lo vieron los griegos hace casi 2,000 años.',
  },
  {
    id: 'm35', nombre: 'Cúmulo de Géminis', emoji: '✳️', tipo: 'cumulo', ra: 6.148, dec: 24.33,
    wow: 1, dificultad: 2, oculares: [25],
    queVeras: 'Un campo lleno de estrellitas parejas, junto a los pies de los gemelos.',
  },
  {
    id: 'm37', nombre: 'Cúmulo del Cochero', emoji: '✳️', tipo: 'cumulo', ra: 5.872, dec: 32.55,
    wow: 1, dificultad: 2, oculares: [25, 10],
    queVeras: 'Una nube de estrellitas finas como polvo de azúcar, con una naranja en medio.',
  },
  {
    id: 'omega-centauri', nombre: 'Omega Centauri', emoji: '🌐', tipo: 'cumulo', ra: 13.446, dec: -47.48, altMin: 12,
    wow: 3, dificultad: 3, oculares: [25, 10],
    queVeras: 'La bola de estrellas más grande de la galaxia: unos 10 millones. Desde Jerez sale bajita en el sur, en primavera; desde EU casi no se ve.',
  },

  // ── Nebulosas ───────────────────────────────────────────────────
  {
    id: 'm42', nombre: 'Nebulosa de Orión', emoji: '☁️', tipo: 'nebulosa', ra: 5.588, dec: -5.39,
    wow: 3, dificultad: 1, oculares: [25, 10],
    queVeras: 'Una nube gris-verdosa con cuatro estrellitas en el centro (el Trapecio). Ahí están naciendo estrellas.',
    leccion: 'C3-25_el-principio-de-todo',
  },
  {
    id: 'm57', nombre: 'Nebulosa del Anillo', emoji: '⭕', tipo: 'nebulosa', ra: 18.893, dec: 33.03,
    wow: 2, dificultad: 2, oculares: [10, 6],
    queVeras: 'Una donita gris chiquita: es el humo de una estrella que se apagó.',
  },
  {
    id: 'm27', nombre: 'Nebulosa de las Pesas', emoji: '🏋️', tipo: 'nebulosa', ra: 19.993, dec: 22.72,
    wow: 2, dificultad: 2, oculares: [25, 10],
    queVeras: 'Una mancha gris con forma de corazón de manzana (o de pesa de gimnasio).',
  },
  {
    id: 'm8', nombre: 'Nebulosa de la Laguna', emoji: '🌫️', tipo: 'nebulosa', ra: 18.06, dec: -24.38,
    wow: 2, dificultad: 2, oculares: [25],
    queVeras: 'Una nube gris con un cúmulo de estrellas a un lado y una franja oscura en medio: la "laguna".',
  },
  {
    id: 'm17', nombre: 'Nebulosa Omega', emoji: '🦢', tipo: 'nebulosa', ra: 18.341, dec: -16.18,
    wow: 1, dificultad: 2, oculares: [25, 10],
    queVeras: 'Una nube alargada con forma de cisne nadando (o de número 2).',
  },

  // ── Galaxias ────────────────────────────────────────────────────
  {
    id: 'm31', nombre: 'Galaxia de Andrómeda', emoji: '🌌', tipo: 'galaxia', ra: 0.712, dec: 41.27,
    wow: 3, dificultad: 2, oculares: [25],
    queVeras: 'Una mancha ovalada y tenue, más brillante en el centro. Es otra galaxia entera; su luz salió hace 2.5 millones de años.',
    mision: 'OB-07_andromeda', leccion: 'C2-29_via-lactea',
  },
  {
    id: 'm81', nombre: 'Galaxias de Bode y del Cigarro', emoji: '🚬', tipo: 'galaxia', ra: 9.926, dec: 69.07,
    wow: 2, dificultad: 3, oculares: [25],
    queVeras: 'Dos manchitas en el mismo ocular: una ovalada y otra alargada como cigarro. Dos galaxias juntas.',
  },
  {
    id: 'm51', nombre: 'Galaxia del Remolino', emoji: '🌀', tipo: 'galaxia', ra: 13.498, dec: 47.2,
    wow: 1, dificultad: 3, oculares: [25, 10],
    queVeras: 'Dos manchitas tenues pegadas. Los brazos en espiral de las fotos NO se ven con este telescopio.',
  },
  {
    id: 'm104', nombre: 'Galaxia del Sombrero', emoji: '👒', tipo: 'galaxia', ra: 12.667, dec: -11.62,
    wow: 1, dificultad: 3, oculares: [10],
    queVeras: 'Una rayita de luz alargada, de canto. Con mucha suerte y cielo oscuro, la línea oscura del "ala del sombrero".',
  },
];

// Lluvias de estrellas: fecha del pico (mes 1-12, día de la noche del pico).
// `grande` = vale la desvelada si la Luna no estorba. `desde` = hora local a la
// que empieza a valer la pena (el radiante ya está alto).
export const LLUVIAS = [
  { id: 'cuadrantidas', nombre: 'Cuadrántidas', mes: 1, dia: 3, porHora: 80, grande: true, desde: 2 },
  { id: 'liridas', nombre: 'Líridas', mes: 4, dia: 22, porHora: 18, grande: false, desde: 23 },
  { id: 'eta-acuaridas', nombre: 'Eta Acuáridas', mes: 5, dia: 5, porHora: 40, grande: false, desde: 3 },
  { id: 'perseidas', nombre: 'Perseidas', mes: 8, dia: 12, porHora: 100, grande: true, desde: 23 },
  { id: 'orionidas', nombre: 'Oriónidas', mes: 10, dia: 21, porHora: 20, grande: false, desde: 1 },
  { id: 'leonidas', nombre: 'Leónidas', mes: 11, dia: 17, porHora: 15, grande: false, desde: 1 },
  { id: 'geminidas', nombre: 'Gemínidas', mes: 12, dia: 13, porHora: 120, grande: true, desde: 21 },
];
