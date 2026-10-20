// Lugar de observación. Las horas se muestran en la zona horaria del dispositivo,
// que es la de aquí (Jerez: UTC-6 todo el año, sin horario de verano).
export const SITIO = {
  nombre: 'Jerez, Zacatecas',
  lat: 22.649,
  lon: -102.990,
  alturaM: 2027,
};

// Ventana familiar (decidida por el usuario, 2026-10-20).
// Entre semana: 19:30-22:00. Viernes y sábado: la noche entera, pero lo que cae
// fuera de 19:30-22:00 solo se propone si es EXCEPCIONAL (eclipse, pico de una
// lluvia de estrellas grande...).
export const VENTANA = {
  inicio: { h: 19, m: 30 },
  fin: { h: 22, m: 0 },
  diasNocheEntera: [5, 6], // viernes y sábado (getDay)
};
