// Resuelve qué pestaña de nivel superior (Hoy/Explorar) está activa en /dashboard
// a partir de la URL. Compartido por Dashboard.jsx (qué renderiza) y Header.jsx
// (qué link de nav ocultar), para no duplicar esta regla en dos archivos.
export const resolveActiveTab = (searchParams) => {
  const tab = searchParams.get('tab');
  if (tab === 'explorar') return 'explorar';
  if (tab === 'hoy') return 'hoy';
  // Sin tab explícito: un filtro presente implica que se quiere ver Explorar
  // (mismo comportamiento dual que tenía Boveda.jsx con su filtroFromUrl).
  return searchParams.get('filtro') ? 'explorar' : 'hoy';
};
