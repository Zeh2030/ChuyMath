// Telescopio de la familia y sus oculares. De aquí salen los aumentos y el
// campo de visión que recomienda el planificador del Observatorio.
// Plan y decisiones: _ciencias/PROGRAMA_CIENCIAS.md §Observatorio.

export const TELESCOPIO = {
  nombre: 'Sky-Watcher Heritage 150',
  aperturaMm: 150,
  focalMm: 750,
};

// campoAparente en grados: el de serie ronda 50°; el SVBONY de 6 mm es gran angular.
export const OCULARES = [
  { mm: 25, campoAparente: 50 },
  { mm: 10, campoAparente: 50 },
  { mm: 6, campoAparente: 66 },
];

export const aumentosDe = (mm) => Math.round(TELESCOPIO.focalMm / mm);

// "10 mm (75×)"
export const etiquetaOcular = (mm) => `${mm} mm (${aumentosDe(mm)}×)`;
