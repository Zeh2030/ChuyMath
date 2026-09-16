// Regenera las piezas del track adulto (PA1) a partir de su MusicXML original.
//
//   node _piano/_genera-pa1.js
//
// Las partituras NO viven en el repo: se descargan a una carpeta temporal (y se
// reusan si ya estan). Todo lo que define cada pieza —orden de compases, tempo,
// textos— esta aqui, asi que cuando el conversor mejore (p. ej. aprenda notas de
// adorno) basta con volver a correr esto. Si la verificacion de alguna pieza
// falla, no se escribe NINGUN archivo.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { convertir, armarDocumento, cargarXml } = require('./_mxl-a-abc');

const FUENTES = {
  furElise: {
    archivo: 'Fur_Elise_fingered.mxl',
    descarga: 'https://raw.githubusercontent.com/musetrainer/library/master/scores/Fur_Elise_fingered.mxl',
    url: 'https://github.com/musetrainer/library/blob/master/scores/Fur_Elise_fingered.mxl',
  },
};

// Für Elise, estructura de la seccion A en el MusicXML:
//   0 anacrusa · 1-7 tema · 8 = 1a casilla (vuelve al inicio) · 9 = 2a casilla
//   10-22 parte que sube (la izquierda pasa a clave de Sol en 13-16)
//   23 = 1a casilla (vuelve al 10) · 24 = 2a casilla, que lleva a la seccion B.
// 3/8: abcjs cuenta el pulso en negras con puntillo → bpm 42 equivale a corchea = 126.
const PIEZAS = [
  {
    id: 'PA1-01_fur-elise-tema',
    fuente: 'furElise',
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
    fuente: 'furElise',
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
    const fuente = FUENTES[p.fuente];
    const xml = cargarXml(await obtener(fuente));
    console.log(`\n${p.id}`);
    let r;
    try {
      r = convertir(xml, { forma: p.forma });
    } catch (e) {
      console.error(`✗ ${e.message}\nNo se escribio ningun archivo.`);
      process.exit(1);
    }
    console.log(`  ${r.secuencia.length} compases (${r.forma}) · ${r.digitaciones} digitaciones`);
    for (const linea of r.informe) console.log(`  ${linea}`);
    documentos.push(armarDocumento(r, { ...p, archivo: fuente.archivo, url: fuente.url }));
  }

  // Todo verifico: ahora si se escribe.
  for (const doc of documentos) {
    const salida = path.join(__dirname, 'prompter', `${doc.id}.json`);
    fs.writeFileSync(salida, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    console.log(`✓ ${path.relative(path.join(__dirname, '..'), salida)}`);
  }
}

main();
