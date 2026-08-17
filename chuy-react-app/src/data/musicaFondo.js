// Pistas de música de fondo. La reproducción es opcional (el niño la elige
// desde el Header) y la preferencia se guarda por perfil: `musicaFondo`
// (encendida sí/no) y `musicaFondoPista` (cuál suena).
//
// Las grabaciones viven en Firebase Storage, NO en el repo: un mp3 pesa varios
// MB y todo public/ junto pesa menos de 1 MB. Con la URL pública basta
// `new Audio(url)`, sin importar el SDK de Storage.
//
// Para agregar una pista: súbela a Storage y pega aquí su URL de descarga.
// Anota siempre intérprete y fuente en `licencia`: la obra puede ser de
// dominio público, pero cada GRABACIÓN tiene su propia licencia de
// interpretación. Las pistas sin `url` simplemente no se ofrecen todavía.
export const PISTAS = [
  {
    id: 'clair-de-lune',
    titulo: 'Clair de Lune',
    compositor: 'Claude Debussy',
    url: 'https://firebasestorage.googleapis.com/v0/b/chuy-react-app.firebasestorage.app/o/M%C3%BAsica%2FSuite%20Bergamasque%20-%20III.%20Claire%20de%20Lune%20%281%29.mp3?alt=media&token=1c87d146-2ea5-4600-9635-e89ca1d03d6f',
    licencia: 'CC BY-NC — Simone Renzi (Musopen)',
  },
  {
    id: 'gymnopedie-1',
    titulo: 'Gymnopédie No. 1',
    compositor: 'Erik Satie',
    url: '', // ← pegar URL de Storage
    licencia: '', // ← anotar intérprete y fuente
  },
  {
    id: 'claro-de-luna',
    titulo: 'Claro de Luna (1er mov.)',
    compositor: 'Ludwig van Beethoven',
    url: '', // ← pegar URL de Storage
    licencia: '', // ← anotar intérprete y fuente
  },
  {
    id: 'preludio-1-bach',
    titulo: 'Preludio No. 1 en Do mayor',
    compositor: 'J. S. Bach',
    url: '', // ← pegar URL de Storage
    licencia: '', // ← anotar intérprete y fuente
  },
];

// Solo las que ya tienen grabación: ofrecer una pista muda confunde al niño.
export const pistasDisponibles = () => PISTAS.filter((p) => p.url);

export const buscarPista = (id) => pistasDisponibles().find((p) => p.id === id) || null;

// Tipos de misión donde el audio ES el ejercicio: ahí la música se pausa sola
// y se reanuda al salir. Si suena encima, la voz o las notas se pierden.
export const TIPOS_SILENCIO = new Set([
  // Piano: tienen su propio sintetizador
  'piano-prompter',
  'identifica-nota',
  // Inglés: el ejercicio es escuchar el dictado
  'listen-and-type',
  // Letras: fonética leída en voz alta
  'abecedario',
  'letra-quiz',
  'silabas',
  'rimas',
  'arma-la-palabra',
]);
