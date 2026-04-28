# Guia de Creacion de Contenido — Geografia

Convenciones para crear JSONs del modulo de geografia. Sigue el patron de los modulos de ingles/piano/ciencias.

---

## Estructura general del JSON

Todo JSON debe tener al nivel raiz:

```json
{
  "id": "G1-05_banderas-latam",
  "titulo": "Banderas de America Latina",
  "descripcion": "Identifica las banderas de los paises de America Latina",
  "tipo": "image-picker",
  "materia": "geografia",
  "tema": "banderas",
  "nivel": "G1-05",
  "misiones": [...]
}
```

Campos requeridos:
- `id` — formato `G{nivel}-{NN}_{tema-corto}` (ej: `G1-05_banderas-latam`)
- `titulo` — visible en Boveda
- `tipo` — UNO de los tipos validos (ver abajo)
- `materia` — siempre `"geografia"`
- `nivel` — formato `G{0-3}-{NN}` (ej: `G1-05`)
- `misiones` — array de misiones (puede ser una sola)

---

## Tipos de juego validos

| Tipo | Carpeta | Cuando usar |
|------|---------|-------------|
| `image-picker` | `image-picker/` | Banderas, monumentos, biomas — elige imagen correcta |
| `tap-the-pairs` | `tap-the-pairs/` | Empareja pais con capital, bandera, idioma, etc. |
| `fill-the-gap` | `fill-the-gap/` | Completa frase con palabra (capital, pais) |
| `true-or-false` | `true-or-false/` | Datos verdadero/falso |
| `opcion-multiple` | `opcion-multiple/` | Pregunta con 3-4 opciones de texto |
| `word-scramble` | `word-scramble/` | Desordenar nombre de pais/capital |
| `mini-story` | `mini-story/` | Historia cultural con preguntas embedded |
| `explorador-mapa` | `explorador-mapa/` | Reto de mapa SVG (click en pais) |

---

## Fuentes de imagenes

### Banderas — flagcdn.com

Formato URL: `https://flagcdn.com/w320/{codigo-iso2}.png`

| Pais | URL | Codigo |
|------|-----|--------|
| Mexico | https://flagcdn.com/w320/mx.png | mx |
| USA | https://flagcdn.com/w320/us.png | us |
| Brasil | https://flagcdn.com/w320/br.png | br |
| Japon | https://flagcdn.com/w320/jp.png | jp |
| España | https://flagcdn.com/w320/es.png | es |
| Francia | https://flagcdn.com/w320/fr.png | fr |
| Alemania | https://flagcdn.com/w320/de.png | de |
| Reino Unido | https://flagcdn.com/w320/gb.png | gb |
| Italia | https://flagcdn.com/w320/it.png | it |
| China | https://flagcdn.com/w320/cn.png | cn |

Tamaños disponibles: `w20`, `w40`, `w80`, `w160`, `w320`, `w640`, `w1280`, `w2560`. Para image-picker en geografia, recomendado `w320`.

### Monumentos y lugares — Wikimedia Commons

Buscar en https://commons.wikimedia.org y usar URLs publicas. Ejemplos:
- Torre Eiffel, Piramides de Egipto, Cristo Redentor, Machu Picchu, etc.

### Mapas — descargar SVGs

Ver seccion de ExploradorMapa abajo.

---

## Formatos por tipo de juego

### image-picker (banderas, monumentos)

```json
{
  "id": "G1-05_banderas-latam",
  "titulo": "Banderas de America Latina",
  "tipo": "image-picker",
  "materia": "geografia",
  "nivel": "G1-05",
  "misiones": [{
    "id": "mision-ip-banderas-latam",
    "tipo": "image-picker",
    "titulo": "¿De que pais es esta bandera?",
    "instruccion": "Mira la bandera y elige el pais correcto.",
    "retos": [
      {
        "imagen_url": "https://flagcdn.com/w320/mx.png",
        "palabra_es": "Mexico",
        "opciones": [
          { "label": "Mexico" },
          { "label": "España" },
          { "label": "Italia" },
          { "label": "Argentina" }
        ],
        "respuesta": 0,
        "explicacion": "Es la bandera de Mexico! Tiene verde, blanco y rojo, con el escudo del aguila."
      }
    ]
  }]
}
```

### tap-the-pairs (pais ↔ capital)

```json
{
  "id": "G1-06_capitales-latam",
  "titulo": "Capitales de America Latina",
  "tipo": "tap-the-pairs",
  "materia": "geografia",
  "nivel": "G1-06",
  "misiones": [{
    "id": "mision-ttp-capitales-latam",
    "tipo": "tap-the-pairs",
    "titulo": "Empareja pais con su capital",
    "instruccion": "Toca un pais y luego su capital para emparejar.",
    "retos": [
      {
        "pares": [
          { "es": "Mexico", "en": "Ciudad de Mexico" },
          { "es": "Argentina", "en": "Buenos Aires" },
          { "es": "Brasil", "en": "Brasilia" },
          { "es": "Peru", "en": "Lima" }
        ]
      }
    ]
  }]
}
```

### fill-the-gap

```json
{
  "id": "G1-04_capital-mexico",
  "titulo": "La Capital de Mexico",
  "tipo": "fill-the-gap",
  "materia": "geografia",
  "nivel": "G1-04",
  "misiones": [{
    "id": "mision-ftg-capital-mx",
    "tipo": "fill-the-gap",
    "titulo": "Capital de Mexico",
    "instruccion": "Completa la frase con la capital correcta.",
    "retos": [
      {
        "oracion": "La capital de Mexico es ___.",
        "opciones": ["Guadalajara", "Ciudad de Mexico", "Monterrey", "Cancun"],
        "respuesta": 1,
        "explicacion": "La Ciudad de Mexico (CDMX) es la capital. Antes se llamaba Mexico DF."
      }
    ]
  }]
}
```

### true-or-false

```json
{
  "id": "G0-09_bandera-mexico",
  "titulo": "La Bandera de Mexico",
  "tipo": "true-or-false",
  "materia": "geografia",
  "nivel": "G0-09",
  "misiones": [{
    "id": "mision-tof-bandera-mx",
    "tipo": "true-or-false",
    "titulo": "Verdadero o Falso?",
    "instruccion": "Decide si cada afirmacion es verdadera o falsa.",
    "retos": [
      {
        "oracion": "La bandera de Mexico tiene tres colores.",
        "correcto": true,
        "correccion": null,
        "explicacion": "Verdadero! Verde, blanco y rojo."
      },
      {
        "oracion": "La bandera de Mexico tiene un leon en el centro.",
        "correcto": false,
        "correccion": "La bandera de Mexico tiene un aguila comiendo una serpiente.",
        "explicacion": "Falso! Es un aguila parada sobre un nopal comiendo una serpiente."
      }
    ]
  }]
}
```

### opcion-multiple

```json
{
  "id": "G2-04_rios-mas-largos",
  "titulo": "Rios mas Largos del Mundo",
  "tipo": "opcion-multiple",
  "materia": "geografia",
  "nivel": "G2-04",
  "misiones": [{
    "id": "mision-om-rios",
    "tipo": "opcion-multiple",
    "titulo": "Geografia Fisica",
    "instruccion": "Elige la respuesta correcta.",
    "pregunta": "¿Cual es el rio mas largo del mundo?",
    "opciones": ["Amazonas", "Nilo", "Yangtze", "Misisipi"],
    "respuesta": "1",
    "explicacion_correcta": "Correcto! El Nilo mide aproximadamente 6,650 km. Algunos cientificos creen que el Amazonas es mas largo (debate abierto).",
    "explicacion_incorrecta": "El rio mas largo del mundo es el Nilo (~6,650 km). El Amazonas es el mas caudaloso."
  }]
}
```

### word-scramble

```json
{
  "id": "G2-02_capitales-asia-scramble",
  "titulo": "Capitales de Asia (Desordenadas)",
  "tipo": "word-scramble",
  "materia": "geografia",
  "nivel": "G2-02",
  "misiones": [{
    "id": "mision-ws-capitales-asia",
    "tipo": "word-scramble",
    "titulo": "Adivina la Capital",
    "instruccion": "Las letras estan desordenadas. ¿Que capital es?",
    "retos": [
      {
        "palabra": "TOKIO",
        "pista": "Capital de Japon",
        "explicacion": "Tokio es la capital de Japon."
      },
      {
        "palabra": "PEKIN",
        "pista": "Capital de China",
        "explicacion": "Pekin (o Beijing) es la capital de China."
      }
    ]
  }]
}
```

### mini-story (historias culturales)

Sigue el patron de las biografias de piano (`_piano/mini-story/P1-T08_mozart-nino-genio.json`).

```json
{
  "id": "G1-12_mexico-cultural",
  "titulo": "Mexico: Cultura y Tradiciones",
  "tipo": "mini-story",
  "materia": "geografia",
  "tema": "mexico",
  "nivel": "G1-12",
  "misiones": [{
    "id": "mision-story-mexico-cultural",
    "tipo": "mini-story",
    "titulo": "Mexico: Cultura y Tradiciones",
    "instruccion": "Lee cada parte y responde la pregunta.",
    "parrafos": [
      {
        "texto": "Mexico es un pais con tradiciones muy especiales...",
        "emoji": "🇲🇽",
        "preguntas": [
          { "tipo": "fill-the-gap", "oracion": "...", "opciones": [...], "respuesta": 0 }
        ]
      }
    ]
  }]
}
```

### explorador-mapa

```json
{
  "id": "G1-01_continentes",
  "titulo": "Los 7 Continentes",
  "tipo": "explorador-mapa",
  "materia": "geografia",
  "nivel": "G1-01",
  "misiones": [{
    "id": "mision-em-continentes",
    "tipo": "explorador-mapa",
    "mapa": "world",
    "modo": "quiz",
    "titulo": "Identifica los Continentes",
    "instruccion": "Click en el continente correcto.",
    "retos": [
      { "id": "AF", "pregunta": "¿Donde esta Africa?" },
      { "id": "EU", "pregunta": "¿Donde esta Europa?" }
    ]
  }]
}
```

---

## Convenciones de naming

### IDs de archivos
- Patron: `G{nivel}-{NN}_{tema-corto}.json`
- Ejemplos: `G1-05_banderas-latam.json`, `G2-01_capitales-europa.json`
- Sin acentos, espacios o ñ en el nombre del archivo

### IDs de misiones
- Patron: `mision-{tipo-abreviado}-{tema}`
- Abreviaciones: `ip` (image-picker), `ttp` (tap-the-pairs), `ftg` (fill-the-gap), `tof` (true-or-false), `om` (opcion-multiple), `ws` (word-scramble), `story` (mini-story), `em` (explorador-mapa)

### Niveles
- `G0` — 3-5 años (introductorio)
- `G1` — 5-7 años (basico)
- `G2` — 7-9 años (intermedio)
- `G3` — 9-11 años (avanzado)

---

## Reglas de contenido por edad

### G0 (4 años) — sin lectura
- Papa lee, hija interactua
- Maximo 3 botones por reto
- Imagenes grandes y claras
- Quiz visual (sin texto en respuestas)
- Vocabulario concreto: animal, color, cielo, tierra, agua

### G1 (5-7 años)
- Frases cortas (5-10 palabras)
- Vocabulario concreto: pais, ciudad, bandera, continente
- 4-6 retos por mision
- Quiz textual basico

### G2 (7-9 años)
- Parrafos cortos (2-3 lineas)
- Vocabulario geografico: peninsula, golfo, archipielago, cordillera
- 6-10 retos por mision
- Comparaciones y datos numericos basicos

### G3 (9-11 años)
- Textos completos (3-5 lineas por parrafo)
- Vocabulario tecnico: tectonica, demografia, biodiversidad, hemisferio
- 10+ retos por mision
- Datos numericos precisos (poblacion, area, altura)

---

## Datos "wow" recomendados

Cada tema debe incluir 1-2 datos sorprendentes. Ejemplos:

- **Mexico**: La Ciudad de Mexico esta construida sobre un lago.
- **Brasil**: La selva amazonica produce el 20% del oxigeno del mundo.
- **Rusia**: Es tan grande que tiene 11 husos horarios.
- **Australia**: Es el unico pais que es tambien un continente.
- **Egipto**: Las piramides son tan antiguas que cuando los romanos las visitaron, ya tenian 2,500 años.
- **Japon**: Tiene 6,852 islas (¡seis mil ochocientas!).
- **Antartida**: Es el lugar mas frio del mundo, hasta -89 grados.
- **Pacifico**: El oceano mas grande, mas grande que toda la tierra firme junta.

---

## Proceso de creacion

1. Elegir tema del programa (`PROGRAMA_GEOGRAFIA.md`)
2. Decidir tipo(s) de juego apropiados
3. Crear JSON siguiendo la plantilla del tipo
4. Guardar en `_geografia/{tipo}/{id}.json`
5. Migrar a Firebase via `/admin/migracion`
6. Probar en la app antes de pasar al siguiente tema

---

## Expediciones (formato extendido)

Las **expediciones** son aventuras tematicas largas que combinan multiples tipos de juego en una narrativa. Inspiradas en `_contenido/aventuras/` (expedicion-ancestral, expedicion-galactica, etc.).

### Estructura

```json
{
  "id": "GE1-01_expedicion-new-york",
  "titulo": "🗽 Expedicion por New York",
  "tipo": "expedicion",
  "tema": "ny",
  "materia": "geografia",
  "descripcion": "Recorre los lugares mas famosos de NY",
  "misiones": [
    {
      "id": "ny-01",
      "tipo": "explorador-mapa",
      "mapa": "usa-estados",
      "modo": "quiz",
      "titulo": "Encuentra New York",
      "instruccion": "Antes de explorar, ubica el estado",
      "retos": [{ "id": "36", "nombre": "New York", "pregunta": "¿Donde esta NY?" }]
    },
    {
      "id": "ny-02",
      "tipo": "image-picker",
      "titulo": "La Estatua de la Libertad",
      ...
    },
    {
      "id": "ny-03",
      "tipo": "opcion-multiple",
      "titulo": "Times Square",
      ...
    },
    {
      "id": "ny-04",
      "tipo": "mini-story",
      "titulo": "La historia de Manhattan",
      ...
    },
    {
      "id": "ny-05",
      "tipo": "true-or-false",
      "titulo": "Datos curiosos de NY",
      ...
    }
  ]
}
```

### Convenciones expediciones

- **ID**: `GE{nivel}-{NN}_expedicion-{tema}` (ej: `GE1-01_expedicion-new-york`)
- **Carpeta**: `_geografia/expediciones/`
- **Nivel**: numerico G0/G1/G2/G3 (igual que juegos individuales)
- **Misiones**: 5-8 misiones recomendadas, mezclando tipos para variedad
- **Imagenes**: SIEMPRE incluir imagenes reales de Wikimedia Commons o flagcdn
- **Narrativa**: cada mision debe sentirse como un "siguiente paso" del viaje
- **Datos atractivos**: Hollywood, Disney, peliculas, deportes, comida famosa

### Plantilla de imagen para opcion-multiple

```json
"imagen": "<img src=\"https://upload.wikimedia.org/wikipedia/commons/X/XX/FILENAME.jpg\" alt=\"...\" style=\"max-width:100%; height:auto; max-height:400px; object-fit:contain; border-radius:15px; box-shadow:0 8px 16px rgba(0,0,0,0.2);\">"
```

**IMPORTANTE — Wikimedia URLs:**
- Usar URL **original** (sin `/thumb/`) — siempre funcionan: `commons/X/XX/FILENAME.jpg`
- Las URLs `commons/thumb/X/XX/FILENAME.jpg/800px-FILENAME.jpg` SOLO funcionan con tamaños especificos que Wikipedia ya ha generado para sus articulos. Pedir tamaños arbitrarios (640px, 800px) suele dar HTTP 400.
- Para encontrar la URL correcta: buscar el archivo en `commons.wikimedia.org`, click derecho en la imagen, "Copiar URL de imagen", y QUITAR la parte `/thumb/.../800px-` para quedarte con la original.
- Usar `max-height:400px; object-fit:contain` en el style para que la imagen no domine la pantalla.

---

## Verificacion antes de migrar

- ¿`tipo` esta a nivel raiz Y a nivel mision?
- ¿`materia: "geografia"` esta a nivel raiz?
- ¿`nivel` sigue el patron `G{0-3}-{NN}`?
- ¿Las URLs de imagenes son accesibles (no requieren auth)?
- ¿Las opciones tienen una respuesta correcta marcada?
- ¿El tema esta listado en `PROGRAMA_GEOGRAFIA.md`?
