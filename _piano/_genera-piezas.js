// Regenera las piezas de piano convertidas desde MusicXML (track adulto PA y
// piezas del track de nino P).
//
//   node _piano/_genera-piezas.js
//
// Las partituras NO viven en el repo: se descargan a una carpeta temporal (y se
// reusan si ya estan). Todo lo que define cada pieza —orden de compases, tempo,
// textos— esta aqui, asi que cuando el conversor mejore (p. ej. aprenda notas de
// adorno) basta con volver a correr esto. Si la verificacion de alguna pieza
// falla, no se escribe NINGUN archivo.
//
// Tempo (`bpm`): lo cuenta abcjs en el pulso del compas — negra en 2/4, 3/4 y
// 4/4; negra con puntillo en 3/8, 6/8 y 9/8. Se usa el que marca la partitura:
// es el 100 % de la escalera de tempo.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { convertir, armarDocumento, cargarXml } = require('./_mxl-a-abc');

// Todas las partituras vienen de https://github.com/musetrainer/library (rama master).
const musetrainer = (archivo) => ({
  archivo,
  descarga: `https://raw.githubusercontent.com/musetrainer/library/master/scores/${encodeURIComponent(archivo)}`,
  url: `https://github.com/musetrainer/library/blob/master/scores/${encodeURIComponent(archivo)}`,
});

const PIEZAS = [
  // ── Track adulto ──────────────────────────────────────────────────────────

  // Für Elise, seccion A en el MusicXML:
  //   0 anacrusa · 1-7 tema · 8 = 1a casilla (vuelve al inicio) · 9 = 2a casilla
  //   10-22 parte que sube (la izquierda pasa a clave de Sol en 13-16)
  //   23 = 1a casilla (vuelve al 10) · 24 = 2a casilla, que lleva a la seccion B.
  // 3/8 a bpm 42 (negra con puntillo) = corchea 126.
  {
    id: 'PA1-01_fur-elise-tema',
    fuente: musetrainer('Fur_Elise_fingered.mxl'),
    forma: '0-8', // el tema una vez; el compas 8 cierra en La
    titulo: 'Für Elise · El tema',
    autor: 'Ludwig van Beethoven',
    nivel: 'PA1-01',
    bpm: 42,
    dificultad: 'principiante',
    descripcion: 'Los primeros compases de Für Elise con la digitación de un pianista: la frase que todo el mundo reconoce.',
    instruccion: 'Los números son dedos: 1 pulgar, 2 índice, 3 medio, 4 anular, 5 meñique. Los de la mano derecha van arriba de su pentagrama; los de la izquierda, entre los dos pentagramas. Empieza en la escalera al 50 % y usa el bucle A-B en los compases que se te atoren.',
  },
  {
    id: 'PA1-02_fur-elise-seccion-a',
    fuente: musetrainer('Fur_Elise_fingered.mxl'),
    // Como esta escrito, pero cerrando con el compas 8 (La) en lugar del 24,
    // que lleva a la seccion B y dejaria la pieza a media frase.
    forma: '0-8,0-7,9-23,10-22,8',
    titulo: 'Für Elise · Sección A completa',
    autor: 'Ludwig van Beethoven',
    nivel: 'PA1-02',
    bpm: 42,
    dificultad: 'principiante',
    descripcion: 'Toda la sección A con sus repeticiones, desplegadas para leerse de corrido. Versión de estudio: en lugar de pasar a la sección B, cierra en La.',
    instruccion: 'Tocas el tema dos veces, luego la parte que sube —la mano izquierda cambia a clave de Sol para alcanzar las notas agudas— y vuelves al tema. La doble barra marca dónde empieza cada repetición. Domina primero «El tema» antes de venir aquí.',
  },

  // Canon in D (easy): 49 compases con repeticion 45-48; se despliega sola
  // (sin `forma`, asi corre tambien la verificacion cruzada con abcjs).
  // La izquierda es el bajo de Pachelbel arpegiado: Re La Si- Fa#- Sol Re Sol La.
  // Metronomo de la partitura: blanca = 50 → negra 100.
  {
    id: 'PA1-03_canon-en-re',
    fuente: musetrainer('Canon_in_D_easy.mxl'),
    titulo: 'Canon en Re',
    autor: 'Johann Pachelbel',
    nivel: 'PA1-03',
    bpm: 100,
    dificultad: 'principiante',
    descripcion: 'Versión fácil del Canon de Pachelbel, con digitación. Toda la pieza descansa sobre la misma serie de ocho acordes, una de las progresiones más usadas de la música.',
    instruccion: 'Los números son dedos: 1 pulgar, 2 índice, 3 medio, 4 anular, 5 meñique. La izquierda empieza sola durante cuatro compases y repite todo el tiempo la misma serie de acordes: Re, La, Si menor, Fa♯ menor, Sol, Re, Sol, La. Apréndela primero con el selector de manos; luego entra la derecha con la melodía.',
  },

  // Swan Lake: la armadura (2 sostenidos) dice Re, pero la pieza esta en Si
  // menor. Los compases 28-32 del archivo estan VACIOS en ambas manos: se corta
  // en el 27, donde cierra en Si. Metronomo de la partitura: negra = 100.
  {
    id: 'PA1-04_lago-de-los-cisnes',
    fuente: musetrainer('Swan_Lake.mxl'),
    forma: '1-27',
    tonalidad: 'Bm',
    titulo: 'El lago de los cisnes',
    autor: 'Piotr Ilich Tchaikovsky',
    nivel: 'PA1-04',
    bpm: 100,
    dificultad: 'principiante',
    descripcion: 'El tema del cisne, del ballet de 1877. La izquierda acompaña con acordes quebrados de Si menor mientras la derecha canta la melodía.',
    instruccion: 'Aquí casi siempre suena una sola nota en cada mano: lo difícil no son los dedos, sino que la melodía cante por encima del acompañamiento. Toca la izquierda más suave que la derecha.',
  },

  // Minuet in G (BWV Anh. 114): seccion A = compases 1-16, que en el original se
  // repite (`16:|`). Va una sola vez, como «El tema» de Für Elise: la repeticion
  // se practica con el bucle. Sin metronomo marcado; "Allegro" y reproduccion a 126.
  {
    id: 'PA1-05_minueto-en-sol-a',
    fuente: musetrainer('Bach_Minuet_in_G_Major_BWV_Anh._114.mxl'),
    forma: '1-16',
    titulo: 'Minueto en Sol · Sección A',
    autor: 'Christian Petzold',
    nivel: 'PA1-05',
    bpm: 126,
    dificultad: 'principiante',
    descripcion: 'Del Cuaderno de Ana Magdalena Bach (1725). Durante mucho tiempo se creyó de Bach; hoy se atribuye a Christian Petzold. Esta es la sección A, que cierra en Sol.',
    instruccion: 'La derecha lleva la melodía y la izquierda responde con notas largas. En 3/4 el primer tiempo de cada compás pesa un poco más. En el original esta sección se repite: repítela tú con el bucle A-B.',
  },

  // ── Track de nino ─────────────────────────────────────────────────────────

  // 12 Variaciones K.265: el tema son los compases 1-24 (`|:1 8:| |:9 24:|`). Va
  // una vez, como la cancion completa que el nino ya conoce. La derecha suena una
  // octava arriba de su Twinkle (P1-01). Metronomo de la partitura: negra = 120.
  {
    id: 'P4-02_twinkle-de-mozart',
    fuente: musetrainer('12_Variations_of_Twinkle_Twinkle_Little_Star.mxl'),
    forma: '1-24',
    titulo: 'Twinkle de Mozart',
    autor: 'Wolfgang Amadeus Mozart',
    nivel: 'P4-02',
    bpm: 120,
    dificultad: 'intermedio',
    descripcion: '¡La melodía de Twinkle que ya tocas, en la versión de Mozart! Él le puso mano izquierda e inventó 12 variaciones sobre ella.',
    instruccion: 'La derecha toca la melodía que ya conoces, una octava más arriba. La izquierda hace el bajo. Prueba primero cada mano por separado y después júntalas.',
  },
];

async function obtener(fuente) {
  const dir = path.join(os.tmpdir(), 'chuymath-partituras');
  fs.mkdirSync(dir, { recursive: true });
  const ruta = path.join(dir, fuente.archivo);
  if (!fs.existsSync(ruta)) {
    console.log(`descargando ${fuente.archivo}…`);
    const res = await fetch(fuente.descarga);
    if (!res.ok) throw new Error(`no se pudo descargar ${fuente.descarga} (HTTP ${res.status})`);
    fs.writeFileSync(ruta, Buffer.from(await res.arrayBuffer()));
  }
  return ruta;
}

async function main() {
  const documentos = [];
  for (const p of PIEZAS) {
    const xml = cargarXml(await obtener(p.fuente));
    console.log(`\n${p.id}`);
    let r;
    try {
      r = convertir(xml, { forma: p.forma, tonalidad: p.tonalidad });
    } catch (e) {
      console.error(`✗ ${e.message}\nNo se escribio ningun archivo.`);
      process.exit(1);
    }
    console.log(`  ${r.secuencia.length} compases (${r.forma}) · ${r.digitaciones} digitaciones · K:${r.configuracion.tonalidad}`);
    for (const linea of r.informe) console.log(`  ${linea}`);
    documentos.push(armarDocumento(r, { ...p, archivo: p.fuente.archivo, url: p.fuente.url }));
  }

  // Todo verifico: ahora si se escribe. Una pieza que sale igual (salvo la fecha
  // de conversion) no se toca, para no ensuciar el historial con fechas nuevas.
  for (const doc of documentos) {
    const salida = path.join(__dirname, 'prompter', `${doc.id}.json`);
    const nombre = path.relative(path.join(__dirname, '..'), salida);
    if (fs.existsSync(salida)) {
      const previo = JSON.parse(fs.readFileSync(salida, 'utf8'));
      const igual = JSON.stringify({ ...doc, fuente: { ...doc.fuente, convertido: previo.fuente?.convertido } })
        === JSON.stringify(previo);
      if (igual) { console.log(`= ${nombre} (sin cambios)`); continue; }
    }
    fs.writeFileSync(salida, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    console.log(`✓ ${nombre}`);
  }
}

main();
