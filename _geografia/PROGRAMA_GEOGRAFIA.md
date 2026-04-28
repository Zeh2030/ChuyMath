# Programa de Geografia ChuyMath — Roadmap Global

Programa completo de aprendizaje de geografia para niños de 4 a 11 años, con progresion desde "mi mundo cercano" hasta geografia mundial avanzada.

No es solo memorizar paises y capitales — es entender el mundo, las personas que lo habitan, las culturas, los paisajes y los datos curiosos que hacen al planeta interesante.

---

## Niveles

```
G0  → Mi Mundo Cercano   (3-5 años)  — Tierra/agua, formas, mi casa, continentes Montessori
G1  → Pequeño Explorador (5-7 años)  — Continentes, oceanos, Mexico, banderas, vecinos
G2  → Viajero del Mundo  (7-9 años)  — Capitales, paises por continente, geografia fisica
G3  → Geografo Junior    (9-11 años) — Tectonica, climas, demografia, geopolitica
```

| Nivel | Nombre | Edad | # Temas | Audiencia | Estado |
|-------|--------|------|---------|-----------|--------|
| **G0** | Mi Mundo Cercano | 3-5 | 10 | Hija (4 años) — papa lee | Planeado |
| **G1** | Pequeño Explorador | 5-7 | 12 | Alumno (7) — NIVEL INICIAL | Planeado |
| **G2** | Viajero del Mundo | 7-9 | 12 | Alumno cuando avance | Planeado |
| **G3** | Geografo Junior | 9-11 | 12 | Roadmap a largo plazo | Planeado |

**Total programa:** 46 temas (~1.5 años de contenido a 1/semana).

---

## Adaptaciones por nivel

| Aspecto | G0 (3-5) | G1 (5-7) | G2 (7-9) | G3 (9-11) |
|---------|----------|----------|----------|-----------|
| Lectura | No (papa lee) | Si, frases cortas | Si, parrafos | Si, textos largos |
| Vocabulario | Concreto, conocido | Continentes, paises | Capitales, geografia fisica | Geopolitica, demografia |
| Quiz | Visual (emojis, imagenes) | Texto + imagenes | Texto + datos | Datos, comparaciones |
| Mapas | Simples, sin nombres | Continentes con colores | Paises por continente | Mapas tematicos |
| Cultura | Animales, comida | Mexico, vecinos | Cultura mundial | Civilizaciones, patrimonio |

---

## Tipos de actividad

### Tipos reutilizados (componentes existentes, solo contenido nuevo)

| Tipo existente | Uso para geografia | Ejemplo |
|---------------|-------------------|---------|
| `image-picker` | Banderas, monumentos, biomas, simbolos | "¿Cual es la bandera de Mexico?" |
| `tap-the-pairs` | Pais↔Capital, Pais↔Continente, Pais↔Bandera | Mexico ↔ CDMX |
| `fill-the-gap` | Capitales con texto | "La capital de Japon es ___" |
| `true-or-false` | Datos verdadero/falso | "Brasil esta en Europa" → falso |
| `opcion-multiple` | Preguntas mc | "¿Cual rio es mas largo?" |
| `word-scramble` | Desordenar nombres de paises/capitales | "PEORTRA" → ROPETRA → REPORTAR (no, EUROPA) |
| `mini-story` | Historias culturales con preguntas | Historia de la civilizacion Maya |

### Tipo nuevo

| Tipo nuevo | Descripcion |
|-----------|-------------|
| `explorador-mapa` | Mapa SVG con siluetas reales clickeables. Modos quiz (resaltar correcto/incorrecto) y explorar (hover muestra info) |

---

## Contenido por nivel

### G0 — Mi Mundo Cercano (3-5 años)

| # | Tema | Tipo de juego | Notas |
|---|------|---------------|-------|
| G0-01 | Tierra vs agua (planeta azul) | image-picker | Concepto Montessori basico |
| G0-02 | Montaña, isla, lago, rio (formas) | image-picker + tap-the-pairs | Land/water forms |
| G0-03 | Sol, luna, estrellas (cielo) | true-or-false | Visual y simple |
| G0-04 | Dia y noche | opcion-multiple | Causa basica |
| G0-05 | Clima: sol, lluvia, nieve | image-picker | Clima cotidiano |
| G0-06 | Mi casa, mi calle, mi colonia | mini-story | Geografia personal |
| G0-07 | Los 7 continentes (colores Montessori) | image-picker | Africa verde, Asia amarillo, etc. |
| G0-08 | Mi pais Mexico (mapa simple) | image-picker + ExploradorMapa | Mapa Mexico colores |
| G0-09 | La bandera de Mexico | image-picker + true-or-false | Simbolo nacional |
| G0-10 | Animales del mundo (donde vive cada uno) | tap-the-pairs | Pinguino↔Polo, Camello↔Desierto |

### G1 — Pequeño Explorador (5-7 años) — NIVEL INICIAL

| # | Tema | Tipo de juego | Notas |
|---|------|---------------|-------|
| G1-01 | Los 7 continentes (nombres) | tap-the-pairs + ExploradorMapa | Aprender nombres en mapa |
| G1-02 | Los 5 oceanos | image-picker + opcion-multiple | Pacifico, Atlantico, Indico, Artico, Antartico |
| G1-03 | Mexico: estados principales | ExploradorMapa + image-picker | CDMX, Yucatan, Jalisco, Nuevo Leon, etc. |
| G1-04 | Capital de Mexico (CDMX) | fill-the-gap + mini-story | Historia del nombre, Tenochtitlan |
| G1-05 | Banderas de America Latina (10 paises) | image-picker + tap-the-pairs | MX, GT, CR, CO, PE, BR, AR, CL, CU, RD |
| G1-06 | Capitales de America Latina | tap-the-pairs | Brasilia, Lima, Bogota, BA, etc. |
| G1-07 | Vecinos de Mexico (USA, Guatemala, Belice) | ExploradorMapa | Frontera norte y sur |
| G1-08 | Banderas conocidas mundo (USA, Japon, Brasil, etc) | image-picker | 8-10 banderas mas reconocibles |
| G1-09 | Polos: Norte y Sur | true-or-false + mini-story | Hielo, pinguinos, exploradores |
| G1-10 | Selvas, desiertos, bosques (biomas) | image-picker | Amazonas, Sahara, Bosques de Canada |
| G1-11 | Monumentos famosos | image-picker + tap-the-pairs | Torre Eiffel, Piramides Egipto, Estatua Libertad, Cristo Redentor |
| G1-12 | Mexico cultural | mini-story + true-or-false | Dia de Muertos, mariachi, comida tipica |

### G2 — Viajero del Mundo (7-9 años)

| # | Tema | Tipo de juego | Notas |
|---|------|---------------|-------|
| G2-01 | Capitales de Europa | tap-the-pairs + fill-the-gap | Paris, Madrid, Roma, Berlin, Londres, etc. |
| G2-02 | Capitales de Asia | tap-the-pairs + word-scramble | Tokio, Pekin, Nueva Delhi, Bangkok |
| G2-03 | Capitales de Africa y Oceania | tap-the-pairs | El Cairo, Nairobi, Pretoria, Canberra |
| G2-04 | Rios mas largos | opcion-multiple + true-or-false | Nilo, Amazonas, Yangtze, Misisipi |
| G2-05 | Montañas mas altas | image-picker + opcion-multiple | Everest, Aconcagua, Kilimanjaro, Popocatepetl |
| G2-06 | Paises de Europa | ExploradorMapa | Click en el mapa de Europa |
| G2-07 | Paises de Asia | ExploradorMapa | Click en el mapa de Asia |
| G2-08 | Idiomas del mundo | tap-the-pairs | Pais↔Idioma principal |
| G2-09 | Monedas del mundo | tap-the-pairs + image-picker | Peso, dolar, euro, yen, real |
| G2-10 | Husos horarios basicos | opcion-multiple | "Cuando son las 12 en MX, ¿que hora es en Tokio?" |
| G2-11 | Maravillas del mundo moderno | mini-story + image-picker | Chichen Itza, Machu Picchu, Coliseo, etc. |
| G2-12 | Mexico fisico | ExploradorMapa | Sierras, costas, golfos, Peninsula Yucatan |
| G2-13 | Estados famosos de USA | ExploradorMapa | California (Hollywood), Florida (Disney), Texas, New York, Nevada (Vegas), Arizona (Gran Cañon), Hawaii, Alaska |

### G3 — Geografo Junior (9-11 años)

| # | Tema | Tipo de juego | Notas |
|---|------|---------------|-------|
| G3-01 | Tectonica de placas | mini-story + true-or-false | Movimiento de continentes |
| G3-02 | Volcanes y terremotos del mundo | opcion-multiple + ExploradorMapa | Cinturon de fuego del Pacifico |
| G3-03 | Climas (tropical, polar, mediterraneo) | tap-the-pairs | Pais↔Clima predominante |
| G3-04 | Demografia: paises mas poblados | opcion-multiple | China, India, USA, Indonesia, Brasil |
| G3-05 | Banderas dificiles (todas Africa/Asia) | image-picker | 50+ banderas |
| G3-06 | Capitales completas (todas las del mundo) | fill-the-gap | Reto avanzado |
| G3-07 | UNESCO: patrimonio de la humanidad | mini-story | Sitios protegidos del mundo |
| G3-08 | Geopolitica basica (UE, ONU, OEA) | opcion-multiple | Organizaciones internacionales |
| G3-09 | Cartografia: latitud, longitud, ecuador | image-picker + true-or-false | Coordenadas geograficas |
| G3-10 | Recursos naturales por region | tap-the-pairs | Pais↔Recurso (petroleo, oro, cafe) |
| G3-11 | Datos curiosos extremos | opcion-multiple + true-or-false | Mas frio (Vostok), mas alto (Everest), mas profundo (Marianas) |
| G3-12 | Civilizaciones antiguas | mini-story + word-scramble | Maya, Inca, Egipto, Mesopotamia |

---

## Lotes de produccion

| Lote | Contenido | JSONs | Justificacion |
|------|-----------|-------|---------------|
| **Lote 1** | Codigo + ExploradorMapa + estructura | 0 | Foundation. Sin codigo no hay como migrar nada. |
| **Lote 2** | G1-01 a G1-04 (continentes, oceanos, MX estados, capital MX) | 4 | Empieza con lo familiar (Mexico) para alumno 7. |
| **Lote 3** | G1-05 a G1-08 (banderas Latam, capitales Latam, vecinos MX, banderas mundo) | 4 | Expande a Latinoamerica y mundo. |
| **Lote 4** | G0-01 a G0-05 (tierra/agua, formas, cielo, dia/noche, clima) | 5 | Hija de 4 — introduccion. |
| **Lote 5** | G1-09 a G1-12 (cierra G1) | 4 | Cierra nivel inicial alumno. |
| **Lote 6** | G0-06 a G0-10 (cierra G0 hija) | 5 | Cierra nivel basico. |
| **Lote 7+** | G2 y G3 bajo demanda | 24 | A medida que el alumno avanza. |

---

## Componente nuevo: ExploradorMapa.jsx

### Especificacion
- Mapa SVG con siluetas reales de paises/regiones, clickeables
- Soporta zoom basico (continente vs mundo vs pais)
- Tipo `tipo: "explorador-mapa"` registrado en MisionRenderer
- Modo `quiz`: "Click en Brasil" (resaltar correcto/incorrecto)
- Modo `explorar`: hover muestra nombre, click muestra info (capital, poblacion, bandera URL)

### Mapas a usar
- `world` — mundo completo (TopoJSON world-atlas, Natural Earth)
- `americas` — Norte+Centro+Sur America (incluye USA, Canada, Mexico)
- `america-latina` — Mexico, Centroamerica, Sudamerica (sin USA/Canada)
- `europa`, `asia`, `africa` — por continente
- `mexico-estados` — los 32 estados de Mexico (GeoJSON, INEGI)
- `usa-estados` — los 50 estados de USA (TopoJSON us-atlas, FIPS codes)

### Fuentes de mapas (descargar, no generar)
- Natural Earth Data (dominio publico)
- Wikimedia Commons (CC0/CC-BY)
- TopoJSON / D3 examples

### Formato JSON
```json
{
  "tipo": "explorador-mapa",
  "mapa": "america-latina",
  "modo": "quiz",
  "retos": [
    { "pais": "BR", "pregunta": "¿Donde esta Brasil?" },
    { "pais": "MX", "pregunta": "¿Y Mexico?" }
  ]
}
```

---

## Reglas de contenido

### Para todos los niveles
1. **Banderas**: usar URLs de flagcdn.com (ej: `https://flagcdn.com/w320/mx.png`)
2. **Monumentos/lugares**: URLs de Wikimedia Commons
3. **Mapas**: usar componente ExploradorMapa con SVGs descargados
4. **Mexico primero**: empezar siempre con lo familiar antes de expandir
5. **Datos curiosos**: incluir 1-2 datos "wow" por tema (ej: "Brasil tiene tanta selva como toda Europa junta")
6. **Atracciones para niños**: SIEMPRE incluir referencias atractivas para edades 4-7 (Disney, Hollywood, peliculas, deportes, animales famosos, comida, museos infantiles). Esto convierte el aprendizaje en algo memorable.

### Catalogo de "ganchos" por region (referencias atractivas para niños)

**USA**:
- California: Hollywood, Disneyland, Golden Gate Bridge, Alcatraz, surfing
- Florida: Disney World, Kennedy Space Center, Miami, caimanes
- Nevada: Las Vegas (luces de neon), Grand Canyon (limita con Arizona)
- New York: Estatua de la Libertad, Times Square, Central Park, rascacielos
- Arizona: Gran Cañon, cactus saguaro
- Hawaii: volcanes, surf, collares de flores
- Alaska: osos polares, aurora boreal, Iditarod (carrera de perros)
- Texas: cowboys, NASA Houston, Alamo
- Washington DC: Casa Blanca, monumentos

**Mexico**:
- CDMX: Angel de la Independencia, Zocalo, Bellas Artes, Templo Mayor
- Yucatan: Chichen Itza (piramide), cenotes, Cancun
- Quintana Roo: Tulum, Riviera Maya, Cozumel
- Jalisco: mariachi, tequila, Guadalajara
- Oaxaca: Monte Alban, mole, alebrijes
- Estado de Mexico: Teotihuacan (piramides del Sol y Luna)
- Chihuahua: Barrancas del Cobre, perritos chihuahua
- Baja California Sur: ballenas grises, Cabo San Lucas, Arco

**Mundo**:
- Francia: Torre Eiffel, Louvre (Mona Lisa), Disneyland Paris
- Reino Unido: Big Ben, London Eye, Stonehenge
- Italia: Coliseo, Torre de Pisa, pizza, Vaticano
- Egipto: Piramides Giza, esfinge, Nilo, faraones
- China: Gran Muralla, pandas, Ciudad Prohibida
- Japon: Tokyo, sushi, samuray, Monte Fuji, Pokemon (origen)
- India: Taj Mahal, elefantes, Bollywood
- Brasil: Cristo Redentor, Amazonas, futbol, carnaval
- Argentina: tango, Patagonia, glaciares, futbol (Messi)
- Australia: canguros, koalas, Opera de Sydney, Gran Barrera
- Peru: Machu Picchu, llamas, incas
- Grecia: Acropolis, mitologia, dioses

### Especifico G0 (4 años)
- Sin lectura — papa lee, hija interactua
- Pocos botones (3 maximo)
- Imagenes grandes y claras
- Quiz visual (sin texto)

### Especifico G1 (5-7 años)
- Frases cortas
- Vocabulario concreto
- 4-6 retos por mision
- Quiz textual basico

### Especifico G2 (7-9 años)
- Parrafos cortos
- Vocabulario geografico (peninsula, golfo, archipielago)
- 6-10 retos por mision
- Comparaciones (mas alto, mas largo)

### Especifico G3 (9-11 años)
- Textos completos
- Vocabulario tecnico (tectonica, demografia, biodiversidad)
- 10+ retos
- Datos numericos (poblacion, area, altura)

---

## Estructura de archivos

```
_geografia/
  PROGRAMA_GEOGRAFIA.md
  GUIA_CREACION_GEOGRAFIA.md
  image-picker/        (banderas, monumentos, biomas)
  tap-the-pairs/       (pais↔capital, pais↔bandera)
  fill-the-gap/        (capitales con texto)
  true-or-false/       (datos verdadero/falso)
  opcion-multiple/     (preguntas mc)
  word-scramble/       (desordenar nombres)
  mini-story/          (historias culturales)
  explorador-mapa/     (retos de mapa SVG)
```

Convencion archivo: `{nivel}-{numero}_{tema-corto}.json`
Ejemplo: `G1-05_banderas-latam.json`

---

## Estado del programa

| Componente | Estado |
|------------|--------|
| Programa documentado (este archivo) | ✅ |
| Estructura de carpetas | ✅ |
| Componente ExploradorMapa.jsx | ✅ Lote 1 (3 mapas: world, mexico-estados, usa-estados) |
| Integracion en Boveda/Dashboard/etc | ✅ Lote 1 |
| Contenido G0 | ✅ Lote 4 (G0-01..05) — pendiente Lote 6 (G0-06..10) |
| Contenido G1 | ✅ Lote 2 (G1-01..04) + Lote 3 (G1-05..08) — pendiente Lote 5 (G1-09..12) |
| Contenido G2 | G2-13 estados-usa-famosos (bonus); resto pendiente Lote 7+ |
| Contenido G3 | Pendiente (cuando aplique) |
| Expediciones | GE1-01 New York creada y validada (✅ banderas + imagenes) |

Ver `GUIA_CREACION_GEOGRAFIA.md` para convenciones de creacion de JSONs.

---

## Expediciones tematicas (formato extendido)

Ademas de los juegos individuales, podemos crear **expediciones**: aventuras tematicas largas que combinan multiples tipos de juego en una sola narrativa inmersiva. Inspiradas en `_contenido/aventuras/2025-10-06_expedicion-ancestral.json`.

### Formato

Un JSON de expedicion tiene MULTIPLES misiones con DIFERENTES tipos en una secuencia narrativa:

```json
{
  "id": "GE1-01_expedicion-new-york",
  "titulo": "🗽 Expedicion por New York",
  "tipo": "expedicion",
  "tema": "ny",
  "materia": "geografia",
  "descripcion": "Recorre los lugares mas famosos de NY",
  "misiones": [
    { "tipo": "explorador-mapa", ... },     // primero ubica NY en el mapa
    { "tipo": "image-picker", ... },         // identifica Estatua Libertad
    { "tipo": "opcion-multiple", ... },      // pregunta sobre Times Square
    { "tipo": "mini-story", ... },           // historia de Manhattan
    { "tipo": "true-or-false", ... }         // datos sobre NY
  ]
}
```

Carpeta sugerida: `_geografia/expediciones/`

### Expediciones planeadas

| ID | Tema | Lugares incluidos | Audiencia |
|----|------|-------------------|-----------|
| GE1-01 | 🗽 Expedicion por New York | Estatua Libertad, Times Square, Central Park, Empire State, Brooklyn Bridge | G1 |
| GE1-02 | 🌉 Expedicion por San Francisco | Golden Gate, Alcatraz, tranvias historicos, China Town | G1 |
| GE1-03 | 🏛️ Expedicion por Mexico antiguo | Tenochtitlan, Chichen Itza, Teotihuacan, mayas, aztecas | G1 |
| GE1-04 | 🐭 Expedicion Disney | Disneyland California, Disney World Florida, Disneyland Paris, Tokyo Disney | G1 |
| GE2-01 | 🗼 Expedicion por Paris | Torre Eiffel, Louvre (Mona Lisa), Notre Dame, Champs-Elysees | G2 |
| GE2-02 | 🏯 Expedicion por Asia | Gran Muralla China, Tokyo, Taj Mahal, templos | G2 |
| GE2-03 | 🦘 Expedicion por Australia | Sydney (Opera), canguros, koalas, Gran Barrera de Coral | G2 |
| GE2-04 | 🏖️ Expedicion por el Caribe | Cancun, Cuba, Republica Dominicana, Puerto Rico | G2 |
| GE2-05 | ⛰️ Expedicion por Sudamerica | Machu Picchu, Cristo Redentor, Patagonia, Amazonas | G2 |
| GE3-01 | 🌍 Expedicion 7 Maravillas | Las 7 maravillas modernas (Chichen Itza, Petra, Cristo Redentor, Coliseo, Machu Picchu, Taj Mahal, Gran Muralla) | G3 |

Cada expedicion tiene 5-8 misiones combinando explorador-mapa, image-picker, opcion-multiple, mini-story y true-or-false.

---

## Astronomia (Espacio) → CIENCIAS, no Geografia

Aunque a veces se llama "geografia universal", el sistema solar y los planetas pertenecen a ciencias (astronomia es una ciencia fisica). Geografia se enfoca en la Tierra.

**Lo que NO va en geografia:**
- Sistema solar y planetas
- Estrellas, galaxias, universo
- Sol, Luna (cuerpos celestes)
- Cohetes, astronautas

**Lo que SI puede tener geografia (puente con astronomia):**
- G3: "La Tierra en el Sistema Solar" (mini-story breve introductoria)
- G3: "Como vemos la Tierra desde el espacio" (satellites, ISS)

Ver `_ciencias/PROGRAMA_CIENCIAS.md` seccion Astronomia para el contenido espacial.
