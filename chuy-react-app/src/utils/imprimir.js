// Utilidades de la versión impresa de los simulacros (pages/ImprimirSimulacro.jsx).
// Funciones puras: _contenido/_valida.mjs y el QA usan las mismas que la página.
import { esIndice, respuestaCorrectaOM, solucionCripto, valorDeOpcion } from './calificar.js';

// Tipos que PreguntaImpresa sabe dibujar en papel.
export const TIPOS_IMPRIMIBLES = [
  'opcion-multiple', 'operaciones', 'criptoaritmetica', 'navegacion-mapa',
  'desarrollo-cubos', 'balanza-logica', 'palabra-del-dia',
];

export const letra = (i) => String.fromCharCode(65 + i);

export const esSvg = (s) => typeof s === 'string' && /^\s*<svg[\s>]/i.test(s);

// Índice de la opción correcta de una pregunta de opción múltiple (-1 si no se halla).
export const indiceCorrectoOM = (p) => {
  const r = respuestaCorrectaOM(p);
  if (esIndice(r)) return Number(r);
  return (p.opciones || []).findIndex((o) => valorDeOpcion(o) === r);
};

// Figuras de una criptoaritmética, con la misma regla del componente: todo carácter
// que no sea espacio, +, - o dígito es una incógnita. Array.from respeta emojis.
export const figurasCripto = (operacion = {}) => {
  const figuras = [];
  for (const linea of [operacion.linea1, operacion.linea2, operacion.resultado]) {
    for (const c of Array.from(linea || '')) {
      if (!/[\s+\-0-9]/.test(c) && !figuras.includes(c)) figuras.push(c);
    }
  }
  return figuras;
};

// Caras del cubo en orden de lectura (fila, luego columna); la letra de cada cara
// en el papel sale de esta posición.
export const carasConLetra = (datosCubo) =>
  [...(datosCubo?.caras || [])]
    .sort((a, b) => a.fila - b.fila || a.columna - b.columna)
    .map((cara, i) => ({ ...cara, letra: letra(i) }));

// Letras de la palabra revueltas de forma estable (sembrada con el id) y nunca en
// el orden original: el examen impreso no puede regalar la respuesta.
export const letrasRevueltas = (palabra, semilla = '') => {
  const letras = Array.from(String(palabra || '').toUpperCase());
  if (letras.length < 2 || new Set(letras).size < 2) return letras;
  let s = 0;
  for (const c of String(semilla)) s = (s * 31 + c.codePointAt(0)) >>> 0;
  const azar = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  const out = [...letras];
  for (let intento = 0; intento < 10; intento++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.join('') !== letras.join('')) return out;
  }
  // Último recurso: rotar una posición (distinto porque hay al menos 2 letras distintas).
  return [...letras.slice(1), letras[0]];
};

// Respuesta correcta para la hoja de claves: { letra?, texto }.
export const claveDe = (p) => {
  switch (p.tipo) {
    case 'opcion-multiple': {
      const i = indiceCorrectoOM(p);
      const opcion = valorDeOpcion((p.opciones || [])[i]);
      const texto = p.opciones_son_imagenes || esSvg(opcion) ? '(dibujo)' : String(opcion ?? '');
      return { letra: i >= 0 ? letra(i) : '?', texto };
    }
    case 'navegacion-mapa':
      return { texto: p.configuracion_mapa?.respuesta_correcta ?? '' };
    case 'criptoaritmetica':
      return {
        texto: Object.entries(solucionCripto(p)).map(([f, v]) => `${f} = ${v}`).join(', '),
      };
    case 'desarrollo-cubos': {
      const cara = carasConLetra(p.datos_cubo).find((c) => c.id === p.respuesta);
      return cara ? { letra: cara.letra, texto: cara.contenido } : { letra: '?', texto: String(p.respuesta) };
    }
    case 'palabra-del-dia':
      return { texto: String(p.palabra ?? p.respuesta ?? '').toUpperCase() };
    default:
      return { texto: String(p.respuesta ?? '') };
  }
};

// Cuántas burbujas lleva la fila de la hoja de respuestas (0 = renglón para escribir).
export const burbujasDe = (p) => {
  if (p.tipo === 'opcion-multiple') return (p.opciones || []).length;
  if (p.tipo === 'desarrollo-cubos') return (p.datos_cubo?.caras || []).length;
  return 0;
};
