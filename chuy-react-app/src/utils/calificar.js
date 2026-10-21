// Calificación de simulacros: una sola fuente de verdad para la tarjeta de cada
// problema (✅/❌) y para el puntaje total. Funciones puras, sin React, para que
// _contenido/_valida.mjs pruebe exactamente la misma lógica que corre en la app.

// `??` y no `||`: con `||` una respuesta 0 (la primera opción) se volvía ''.
export const respuestaCorrectaOM = (mision) =>
  mision.respuesta ?? mision.respuesta_final ?? '';

// La respuesta de un JSON puede ser el índice de la opción (0, "2") o su valor.
export const esIndice = (respuesta) =>
  typeof respuesta === 'number' ||
  (typeof respuesta === 'string' && /^\d+$/.test(respuesta));

export const valorDeOpcion = (opcion) =>
  (typeof opcion === 'object' && opcion !== null && opcion.valor !== undefined)
    ? opcion.valor
    : opcion;

// Lo que OpcionMultiple guarda al tocar la opción `indice`: el índice como texto
// si la respuesta es un índice, o el valor de la opción si no.
export const seleccionOM = (mision, opcion, indice) =>
  esIndice(respuestaCorrectaOM(mision)) ? String(indice) : valorDeOpcion(opcion);

// Índice contra índice o valor contra valor; nunca cruzados. Cruzarlos hacía que,
// con opciones ["1","2","3","4"] y respuesta 1 (= "2"), elegir el índice 2 ("3")
// contara como acierto.
export const opcionMultipleCorrecta = (mision, seleccion) => {
  if (seleccion === null || seleccion === undefined) return false;
  return String(seleccion) === String(respuestaCorrectaOM(mision));
};

// Tipos que esRespuestaCorrecta sabe calificar; cualquier otro vale siempre 0.
export const TIPOS_CALIFICABLES = [
  'opcion-multiple', 'navegacion-mapa', 'tabla-doble-entrada', 'operaciones',
  'balanza-logica', 'desarrollo-cubos', 'palabra-del-dia', 'conteo-figuras',
  'secuencia', 'criptoaritmetica',
];

// El componente Criptoaritmetica define la solución como lista [{ figura, valor }]
// y guarda la respuesta del niño como { figura: valor }. Antes se leía como objeto
// y la lista daba claves "0","1"...: nunca había acierto.
export const solucionCripto = (problema) => {
  const s = problema.solucion || {};
  return Array.isArray(s)
    ? Object.fromEntries(s.map(({ figura, valor }) => [figura, valor]))
    : s;
};

const textoIgual = (a, b) =>
  String(a ?? '').trim().toUpperCase() === String(b ?? '').trim().toUpperCase();

export const esRespuestaCorrecta = (problema, respuestaUsuario) => {
  switch (problema.tipo) {
    case 'opcion-multiple':
      return opcionMultipleCorrecta(problema, respuestaUsuario);

    case 'navegacion-mapa':
      return respuestaUsuario === problema.configuracion_mapa.respuesta_correcta;

    case 'tabla-doble-entrada':
      return respuestaUsuario === problema.respuesta_final;

    case 'operaciones':
    case 'balanza-logica':
    case 'desarrollo-cubos':
    case 'palabra-del-dia':
    case 'conteo-figuras':
    case 'secuencia':
      return textoIgual(respuestaUsuario, problema.respuesta ?? problema.palabra);

    case 'criptoaritmetica': {
      const usuario = respuestaUsuario || {};
      const solucion = solucionCripto(problema);
      if (Object.keys(usuario).length === 0) return false;
      return Object.keys(solucion).every(letra =>
        String(usuario[letra]) === String(solucion[letra])
      );
    }

    default:
      return false;
  }
};
