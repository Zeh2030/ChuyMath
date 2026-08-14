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
