// Regenera _lote-letras-<NIVEL>.json juntando los documentos de cada nivel.
// El lote es lo que se sube de un clic en Admin -> Migracion -> Letras.
// Correr despues de agregar o editar contenido:  node _letras/_lotes.js
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const files = fs.readdirSync(DIR).filter((f) => /^L[\dF]-\d\d_.*\.json$/.test(f)).sort();

const porNivel = new Map();
for (const f of files) {
  const nivel = f.slice(0, 2); // "L0", "L1", "LF"...
  if (!porNivel.has(nivel)) porNivel.set(nivel, []);
  porNivel.get(nivel).push(JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
}

for (const [nivel, docs] of [...porNivel].sort()) {
  fs.writeFileSync(path.join(DIR, `_lote-letras-${nivel}.json`), JSON.stringify(docs, null, 2) + '\n', 'utf8');
  const misiones = docs.reduce((n, d) => n + d.misiones.length, 0);
  console.log(`  _lote-letras-${nivel}.json  ${docs.length} docs, ${misiones} misiones`);
}
