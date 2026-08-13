// Deteccion de WebGL compartida por los componentes 3D (Cubo3D, Espacio3D).
// Se comprueba una sola vez por sesion, fuera de React.
let cacheWebGL = null;

export const soportaWebGL = () => {
  if (cacheWebGL !== null) return cacheWebGL;
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2') || c.getContext('webgl');
    cacheWebGL = Boolean(ctx);
    // El navegador solo permite un puñado de contextos vivos: soltar el de prueba.
    ctx?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cacheWebGL = false;
  }
  return cacheWebGL;
};
