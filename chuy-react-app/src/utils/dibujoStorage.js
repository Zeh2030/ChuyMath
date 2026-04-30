// Persistencia local del ultimo dibujo de cada actividad.
// MVP: localStorage por usuario+mision. Sobrescribe (no historial).
// Pendiente: subir a Firebase Storage para galeria multi-dispositivo (Nivel 2).

const KEY_PREFIX = 'chuymath_dibujo';

const getKey = (userId, misionId) => `${KEY_PREFIX}_${userId || 'guest'}_${misionId}`;

export const loadDibujo = (userId, misionId) => {
  if (!misionId) return null;
  try {
    return localStorage.getItem(getKey(userId, misionId));
  } catch {
    return null;
  }
};

export const saveDibujo = (userId, misionId, dataURL) => {
  if (!misionId || !dataURL) return false;
  try {
    localStorage.setItem(getKey(userId, misionId), dataURL);
    return true;
  } catch (e) {
    console.warn('No se pudo guardar el dibujo (memoria llena?):', e);
    return false;
  }
};

export const deleteDibujo = (userId, misionId) => {
  if (!misionId) return;
  try {
    localStorage.removeItem(getKey(userId, misionId));
  } catch {
    // ignore
  }
};

export const hasDibujoGuardado = (userId, misionId) => {
  if (!misionId) return false;
  try {
    return localStorage.getItem(getKey(userId, misionId)) !== null;
  } catch {
    return false;
  }
};
