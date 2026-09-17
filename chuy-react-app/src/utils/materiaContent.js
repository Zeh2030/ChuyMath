// Mapeo materia -> colección de Firestore, compartido por ExplorarTab (Mi Bóveda)
// y useAventuraDelDia (aventura del día), para no duplicar esta tabla en cada uno.
export const MATERIA_COLECCIONES = {
  matematicas: 'aventuras',
  ingles: 'ingles',
  piano: 'piano',
  ciencias: 'ciencias',
  dibujo: 'dibujo',
  geografia: 'geografia',
  letras: 'letras',
};

// Matemáticas es la única materia "implícita": sus docs no traen campo materia,
// o lo traen como 'matematicas' explícito. Las demás siempre lo traen explícito.
export const matchesMateria = (item, materia) => {
  if (materia === 'matematicas') return !item.materia || item.materia === 'matematicas';
  return item.materia === materia;
};

// ─── Piano: pista de niños y pista de adultos ───
// Un solo contenido (colección `piano`) y dos pistas. NADA se bloquea: la pista
// solo decide qué se ve; el perfil elige con cuál abre Piano (`esAdulto`) y el
// selector del Dashboard la cambia cuando uno quiera.
//
// Quién va dónde lo decide el NIVEL (convención de PROGRAMA_PIANO.md):
//  - `PA…`             → adultos (PA1-01 Für Elise, PA3-01 Clair de Lune…)
//  - `identifica-nota` → las dos: leer notas es igual a cualquier edad
//  - niveles de prueba (`TEST`, `P9-TEST`) → solo adultos, y nunca como
//    "aventura del día": son para quien prueba el motor, no para practicar
//  - el resto (`P1-01`, `P4-T05`…) → niños: Curso Yamaha, teoría, compositores
export const PISTA_NINOS = 'ninos';
export const PISTA_ADULTOS = 'adultos';

// Las canciones viejas del prompter traían el nivel solo dentro de la misión.
const nivelDe = (item) => item?.nivel || item?.misiones?.[0]?.nivel || '';

export const esPruebaPiano = (item) => /TEST/i.test(nivelDe(item));

/** 'ninos' | 'adultos' | 'ambas' */
export const pistaPiano = (item) => {
  if (item?.tipo === 'identifica-nota') return 'ambas';
  const nivel = nivelDe(item);
  if (/^PA/i.test(nivel) || esPruebaPiano(item)) return PISTA_ADULTOS;
  return PISTA_NINOS;
};

/** La pista con la que abre Piano para un perfil. */
export const pistaInicialPiano = (profile) => (profile?.esAdulto ? PISTA_ADULTOS : PISTA_NINOS);

/**
 * Materia y, si es piano, pista. Sin pista (null) se comporta como antes: todo
 * el piano. Las demás materias no cambian.
 */
export const matchesContenido = (item, materia, pista) => {
  if (!matchesMateria(item, materia)) return false;
  if (materia !== 'piano' || !pista) return true;
  const p = pistaPiano(item);
  return p === 'ambas' || p === pista;
};
