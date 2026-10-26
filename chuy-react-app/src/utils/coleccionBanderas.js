// Reglas del álbum de banderas (decisión del papá, 2026-10-25). Un "acierto" es
// contestar bien AL PRIMER INTENTO; cada día con un acierto se guarda en `dias`.
//   nueva  → nunca acertada
//   vista  → acertada un día (se ve en gris)
//   pegada → acertada en 2 días distintos (estampa a color)
//   dorada → acertada en 3+ días y el último intento bien
// Datos por bandera en el perfil: banderasColeccion[clave] =
//   { aciertos, fallos, dias: ['2026-10-25', …], ultimoBien, ultima }

export const VOLVER_BANDERAS = '/dashboard?tab=explorar&filtro=geografia-banderas';

// Imagen de una estampa: las históricas traen su url; las actuales, flagcdn.
// (Sin importar data/paises.js: este archivo entra al paquete principal.)
export const urlEstampa = (b, ancho = 160) =>
  b.url || `https://flagcdn.com/w${[160, 320, 640].includes(ancho) ? ancho : 160}/${b.clave}.png`;

export const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const estadoBandera = (datos) => {
  const dias = datos?.dias?.length || 0;
  if (dias >= 3 && datos.ultimoBien) return 'dorada';
  if (dias >= 2) return 'pegada';
  if (dias === 1) return 'vista';
  return 'nueva';
};

export const estaPegada = (datos) => ['pegada', 'dorada'].includes(estadoBandera(datos));

// Le cuesta: ya la falló y, o el último intento fue mal, o falla tanto como acierta.
export const meCuesta = (datos) =>
  (datos?.fallos || 0) > 0 && (!datos.ultimoBien || datos.fallos >= (datos.aciertos || 0));

// Suma los eventos que aún no se escriben a lo que ya hay en el perfil.
export const combinar = (guardado, pendiente) => {
  if (!pendiente) return guardado;
  const dias = new Set(guardado?.dias || []);
  if (pendiente.aciertos) dias.add(hoy());
  return {
    aciertos: (guardado?.aciertos || 0) + pendiente.aciertos,
    fallos: (guardado?.fallos || 0) + pendiente.fallos,
    dias: [...dias],
    ultimoBien: pendiente.ultimoBien,
  };
};
