// Plantillas paramétricas de banderas para "pinta-bandera": con 6 plantillas salen
// unas 35 banderas sin dibujar un SVG por cada una. Las usan el motor
// (PintaBandera.jsx) y el validador (_geografia/_valida.mjs), así que
// "nº de colores = nº de regiones" sale de una sola fuente.
//
// Todas miden H = 200 de alto y W = round(200 · proporcion) de ancho.
// Cada región: { forma: 'rect'|'path'|'circle'|'polygon', attrs, nombre, ancla:[x,y], grosor }
//   nombre — cómo se le dice al niño en la pista ("la franja de arriba")
//   ancla  — punto dentro de la región (marca ❗ y toque del QA)
//   grosor — el lado más angosto (en unidades del viewBox) para saber si se toca con el dedo

export const PLANTILLAS = ['franjas-h', 'franjas-v', 'cruz-nordica', 'cruz-centrada', 'circulo', 'triangulo-asta'];

const H = 200;

const nombreFranja = (k, n, horizontal) => {
  if (n === 2) return horizontal ? ['la franja de arriba', 'la franja de abajo'][k] : ['la franja del lado del asta (izquierda)', 'la franja de la derecha'][k];
  if (n === 3) return horizontal
    ? ['la franja de arriba', 'la franja de en medio', 'la franja de abajo'][k]
    : ['la franja del lado del asta (izquierda)', 'la franja de en medio', 'la franja de la derecha'][k];
  return horizontal ? `la franja ${k + 1}, contando desde arriba` : `la franja ${k + 1}, contando desde el asta`;
};

const franjas = (n, pesos, W, horizontal, x0 = 0) => {
  const p = pesos && pesos.length === n ? pesos : Array(n).fill(1);
  if (p.some(v => !(v > 0))) throw new Error('pesos deben ser números positivos');
  const S = p.reduce((a, b) => a + b, 0);
  let acum = 0;
  return p.map((v, k) => {
    const ini = acum / S;
    acum += v;
    const tam = v / S;
    if (horizontal) {
      const y = H * ini, h = H * tam;
      return { forma: 'rect', attrs: { x: x0, y, width: W - x0, height: h }, nombre: nombreFranja(k, n, true), ancla: [(x0 + W) / 2, y + h / 2], grosor: h };
    }
    const x = W * ini, w = W * tam;
    return { forma: 'rect', attrs: { x, y: 0, width: w, height: H }, nombre: nombreFranja(k, n, false), ancla: [x + w / 2, H / 2], grosor: w };
  });
};

const fondo = (W, ancla) => ({ forma: 'rect', attrs: { x: 0, y: 0, width: W, height: H }, nombre: 'el fondo', ancla, grosor: H });

/**
 * Geometría de un reto de pinta-bandera.
 * @returns {{ W:number, H:number, regiones:Array }} — en el orden de reto.colores
 */
export function geometriaBandera(reto) {
  const { plantilla } = reto;
  const n = (reto.colores || []).length;

  switch (plantilla) {
    case 'franjas-h':
    case 'franjas-v': {
      const W = Math.round(H * (reto.proporcion ?? 1.5));
      if (n < 2) throw new Error('franjas: al menos 2 colores');
      return { W, H, regiones: franjas(n, reto.pesos, W, plantilla === 'franjas-h') };
    }

    case 'cruz-nordica': {
      if (reto.borde) {
        // Noruega/Islandia, engrosada para dedos: columnas [6,1.5,2,1.5,11]/22, filas [5.5,1.5,2,1.5,5.5]/16
        const W = Math.round(H * (reto.proporcion ?? 1.375));
        const cx = (u) => (W * u) / 22, cy = (u) => (H * u) / 16;
        const cruz = (x1, x2, y1, y2) => `M ${cx(x1)} 0 H ${cx(x2)} V ${H} H ${cx(x1)} Z M 0 ${cy(y1)} H ${W} V ${cy(y2)} H 0 Z`;
        return {
          W, H, regiones: [
            fondo(W, [cx(3), cy(2.75)]),
            { forma: 'path', attrs: { d: cruz(6, 11, 5.5, 10.5), fillRule: 'nonzero' }, nombre: 'el borde de la cruz', ancla: [cx(6.75), cy(13.5)], grosor: cy(1.5) },
            { forma: 'path', attrs: { d: cruz(7.5, 9.5, 7, 9), fillRule: 'nonzero' }, nombre: 'la cruz', ancla: [cx(8.5), cy(13.5)], grosor: cy(2) },
          ],
        };
      }
      // Suecia/Finlandia/Dinamarca: columnas 5/2/9 de 16, filas 4/2/4 de 10
      const W = Math.round(H * (reto.proporcion ?? 1.6));
      const d = `M ${(5 * W) / 16} 0 H ${(7 * W) / 16} V ${H} H ${(5 * W) / 16} Z M 0 ${0.4 * H} H ${W} V ${0.6 * H} H 0 Z`;
      return {
        W, H, regiones: [
          fondo(W, [(2.5 * W) / 16, 0.2 * H]),
          { forma: 'path', attrs: { d, fillRule: 'nonzero' }, nombre: 'la cruz', ancla: [(6 * W) / 16, 0.85 * H], grosor: 0.2 * H },
        ],
      };
    }

    case 'cruz-centrada': {
      if (reto.completa) {
        // Inglaterra: cruz de lado a lado
        const W = Math.round(H * (reto.proporcion ?? 5 / 3));
        const d = `M ${W / 2 - 0.1 * H} 0 H ${W / 2 + 0.1 * H} V ${H} H ${W / 2 - 0.1 * H} Z M 0 ${0.4 * H} H ${W} V ${0.6 * H} H 0 Z`;
        return {
          W, H, regiones: [
            fondo(W, [W / 4, H / 5]),
            { forma: 'path', attrs: { d, fillRule: 'nonzero' }, nombre: 'la cruz', ancla: [W / 2, H * 0.85], grosor: 0.2 * H },
          ],
        };
      }
      // Suiza: cuadrada, cruz que no toca los bordes
      const W = Math.round(H * (reto.proporcion ?? 1));
      const u = (k) => (k / 32);
      const d = `M ${W * u(13)} ${H * u(6)} H ${W * u(19)} V ${H * u(26)} H ${W * u(13)} Z M ${W * u(6)} ${H * u(13)} H ${W * u(26)} V ${H * u(19)} H ${W * u(6)} Z`;
      return {
        W, H, regiones: [
          fondo(W, [W * u(3), H * u(3)]),
          { forma: 'path', attrs: { d, fillRule: 'nonzero' }, nombre: 'la cruz', ancla: [W / 2, H / 2], grosor: H * u(6) },
        ],
      };
    }

    case 'circulo': {
      const W = Math.round(H * (reto.proporcion ?? 1.5));
      const cxR = reto.circulo_x ?? 0.5, rR = reto.radio ?? 0.3;
      if (!(cxR > 0 && cxR < 1) || !(rR > 0 && rR < 0.5)) throw new Error('circulo_x en (0,1) y radio en (0,0.5)');
      const cx = W * cxR, r = H * rR;
      return {
        W, H, regiones: [
          fondo(W, [Math.min(cx + r + (W - cx - r) / 2, W - 10), H / 2]),
          { forma: 'circle', attrs: { cx, cy: H / 2, r }, nombre: 'el círculo', ancla: [cx, H / 2], grosor: 2 * r },
        ],
      };
    }

    case 'triangulo-asta': {
      const W = Math.round(H * (reto.proporcion ?? 1.5));
      if (n < 3) throw new Error('triangulo-asta: al menos 2 franjas + el triángulo');
      const L = W * (reto.triangulo_largo ?? 0.5);
      if (!(L > 0 && L < W)) throw new Error('triangulo_largo en (0,1)');
      const fr = franjas(n - 1, reto.pesos, W, true).map(f => ({ ...f, ancla: [(L + W) / 2, f.ancla[1]] }));
      return {
        W, H, regiones: [
          ...fr,
          { forma: 'polygon', attrs: { points: `0,0 ${L},${H / 2} 0,${H}` }, nombre: 'el triángulo', ancla: [L / 3, H / 2], grosor: Math.min(L, H) * 0.6 },
        ],
      };
    }

    default:
      throw new Error(`plantilla desconocida «${plantilla}»`);
  }
}

// Una región es "angosta" para el dedo: el motor ofrece además un botón por región.
export const GROSOR_MINIMO = 0.14 * H;
