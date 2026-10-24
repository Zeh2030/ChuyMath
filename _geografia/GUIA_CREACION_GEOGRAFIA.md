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

Buscar en https://commons.wikimedia.org o en el articulo de Wikipedia del lugar.

**REGLA CRITICA — Usar URLs ORIGINALES (sin `/thumb/`):**

✅ **FUNCIONAN siempre:** `https://upload.wikimedia.org/wikipedia/commons/X/XX/FILENAME.jpg`

❌ **NO funcionan (HTTP 400):** `https://upload.wikimedia.org/wikipedia/commons/thumb/X/XX/FILENAME.jpg/800px-FILENAME.jpg` con tamaños arbitrarios. Wikimedia solo permite tamaños especificos que ya generaron para sus articulos. Pedir 640px, 800px, 1024px etc. da error 400 ("Use thumbnail steps").

**Como obtener la URL correcta:**
1. Ir al articulo de Wikipedia del lugar (ej: `https://en.wikipedia.org/wiki/Statue_of_Liberty`)
2. Click derecho en la imagen principal → "Copiar direccion de imagen"
3. La URL sera tipo: `.../thumb/X/XX/FILENAME.jpg/250px-FILENAME.jpg`
4. **Quitar `/thumb/` y `/250px-FILENAME.jpg` finales** dejando solo: `.../X/XX/FILENAME.jpg`
5. Resultado: URL original que SIEMPRE funciona

**Style recomendado para no saturar pantalla:**
```html
<img src="..." style="max-width:100%; height:auto; max-height:400px; object-fit:contain; border-radius:15px; box-shadow:0 8px 16px rgba(0,0,0,0.2);">
```

El navegador hace el resize via CSS — no necesitas pedir thumbnails de tamaño especifico.

Ejemplos validos: Torre Eiffel, Piramides de Egipto, Cristo Redentor, Machu Picchu, Estatua de la Libertad, Empire State, Big Ben, Coliseo, Taj Mahal, etc.

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

- `respuesta` es el **índice numérico** de la opción correcta.
- **Opción con `emoji`: se ve SOLO el emoji**; el `label` aparece hasta acertar.
  Úsalo cuando el emoji *es* la respuesta visual (🦁 África, 🌵 Desierto, 🗼 Torre
  Eiffel), sobre todo en G0 donde no se lee. Si el emoji es decorativo y no distingue
  las opciones (🏔️ vs ⛰️ para Everest vs Aconcagua, o 🌊 en los 5 océanos), **quítalo**:
  sin emoji la opción muestra su nombre escrito. El validador rechaza emojis repetidos.
- `palabra_es` (opcional) se pinta **en grande encima de las opciones**: es la
  *pregunta*, nunca la respuesta. Las banderas traían ahí el nombre del país y el
  juego se contestaba solo (corregido 2026-10). Con foto-estímulo (`imagen_url`)
  y opciones de texto, lo normal es omitirlo: la pregunta ya va en el título.
  El validador lo revisa.

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

- Ambas columnas van en español aunque los campos se llamen `es`/`en`.
- **Nada repetido en una misma columna dentro de una ronda.** El juego empareja
  por posición: con cinco tarjetas "Euro", tocar "la otra" cuenta como error
  (pasaba en Monedas). Si dos países comparten respuesta, van en rondas distintas.
- Las rondas pueden tener distinto número de pares.

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

Cómo se lee `respuesta` (misma regla en la app, el validador y la impresión,
`chuy-react-app/src/utils/calificar.js`):

| Opciones | `respuesta` | Se interpreta como |
|----------|-------------|--------------------|
| textos `["20","25","31","32"]` | `"3"` o `3` | **índice** → "32" |
| objetos `{ "texto": "B) 102 pisos", "valor": "102" }` | `"102"` | **valor** de esa opción |
| objetos con `valor` | `2` (número) | **índice** |
| textos | `"Nilo"` | el texto de la opción |

Ojo con opciones numéricas en texto plano: `"3"` es la *cuarta* opción, no la
opción "3". Si la respuesta es un número que aparece como opción, usa objetos
con `valor`.

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
        "respuesta": "TOKIO",
        "pista_es": "Capital de Japón",
        "pista_emoji": "🗼",
        "explicacion": "Tokio es la capital de Japón."
      },
      {
        "respuesta": "PEKÍN",
        "pista_es": "Capital de China",
        "pista_emoji": "🏯",
        "explicacion": "Pekín (o Beijing) es la capital de China."
      }
    ]
  }]
}
```

El componente lee `respuesta`, `pista_es` y `pista_emoji` (esta guía decía
`palabra`/`pista`, que el componente **no** lee: sin `respuesta` el juego truena).
Evita espacios en `respuesta`: salen como una ficha en blanco.

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

**Valores de `mapa`:** `globo`, `world`, `americas`, `america-latina`, `europa`,
`asia`, `africa`, `mexico-estados`, `usa-estados`.

**`modo`:** `quiz` (un intento por reto; en el quiz NO sale el nombre del país al
pasar el mouse, porque regalaría la respuesta) o `explorar` (tocar países libremente;
abajo aparece "¡Listo! ➜" para terminar la misión).

**Encuadre a la medida** (cualquier mapa plano), a nivel de misión:

```json
"encuadre": [-120, 12, -78, 40]
```

`[oeste, sur, este, norte]` (lonMin, latMin, lonMax, latMax): el rectángulo que debe
verse completo; la proyección se ajusta sola. Va **plano** a propósito: Firestore no
acepta arreglos dentro de arreglos (`[[..],[..]]` hace fallar la migración). Úsalo cuando la lección vive en una zona chica del mapa
(México + Centroamérica, el Caribe). El mapa `europa` ya trae el suyo.

**Lugares diminutos**: el niño tiene ➕/➖ (y rueda del mouse) para acercar, y con
zoom arrastra el mapa. Además, si el objetivo del reto es muy chico (Belice, Cuba,
CDMX), un halo invisible sobre el **mar** a su alrededor cuenta como acierto; los
toques en un país vecino siguen siendo error. El validador avisa de los objetivos
diminutos.

#### El globo (`"mapa": "globo"`)

Proyeccion ortografica: la Tierra como esfera de verdad, que se gira arrastrando
con el dedo. La mitad de atras no se dibuja, asi que **buscar un pais girando el
globo es parte del ejercicio**. Al responder, el globo gira solo hasta centrar el
pais — que es el momento en que conviene que lo vea bien.

Usalo cuando la leccion sea sobre el planeta o sobre continentes lejanos entre si.
Un mapa plano miente con los tamaños (Groenlandia parece Africa siendo 14 veces
mas chica) y esconde que el planeta es redondo.

Opciones extra, solo para `globo`:

| Campo | Valor | Para que |
|-------|-------|----------|
| `rotacion_inicial` | `[lon, lat]` | Por donde empieza mirando. Por defecto `[-80, 15]` (America). |
| `estilo` | `"tierra"` | Pinta toda la tierra de un mismo verde, en vez de un color por pais. Para la leccion tierra/agua de G0. |

```json
{
  "tipo": "explorador-mapa",
  "mapa": "globo",
  "modo": "quiz",
  "rotacion_inicial": [-80, 15],
  "instruccion": "Arrastra con el dedo para girar la Tierra.",
  "retos": [
    { "id": "036", "nombre": "Australia", "pregunta": "¿Donde esta Australia?" }
  ]
}
```

Opciones extra a nivel de **reto**, todas opcionales:

| Campo | Valor | Para que |
|-------|-------|----------|
| `bandera` | `"jp"` | Codigo ISO **alfa-2**. Sale al responder, como PREMIO. |
| `dato` | texto | Dato curioso que acompaña a la bandera. |
| `marcar` | `[{lon, lat, color}]` | Puntos fijos del enunciado ("estas aqui"). Se ven siempre. |
| `ruta` | `{desde, hasta, mostrar_plano}` | Al responder dibuja el arco real; con `mostrar_plano` añade la "linea recta del mapa" para comparar. |

Y a nivel de **mision**: `resaltar_ecuador: true` marca el Ecuador sobre la
grátícula.

> **En las lecciones de geografía, las banderas son recompensa, no pregunta.**
> Preguntar "¿de quien es esta bandera?" enseña banderas, no geografia: la bandera
> es solo otro nombre del pais. Puesta como premio al acertar, se aprende igual y
> no compite con la leccion. (En la sub-sección **Banderas** es al revés: ahí la
> bandera es el tema; ver la sección Banderas más abajo.)

**Con `bandera`, `dato` o `ruta` el reto NO auto-avanza**: aparece un boton
"Siguiente ➜" porque hay algo que leer. Sin ellos sigue avanzando solo a los
2 segundos, como siempre.

#### Que preguntar en el globo (y que no)

Si la pregunta funciona igual en un mapa plano, **no** aproveches el globo.
Estas cinco si lo necesitan, y estan hechas:

| Aventura | Idea |
|----------|------|
| `G1-09b_ecuador-y-polos` | El Ecuador y por que ahi hace calor |
| `G2-14_vecinos-del-mundo` | Seguir fronteras girando la Tierra |
| `G3-09b_los-mapas-mienten` | Groenlandia vs Australia: el mapa plano estira los polos |
| `G3-13_antipodas` | Cavar un hoyo hasta el otro lado — **imposible en un mapa plano** |
| `G3-14_rutas-de-vuelo` | Por que los aviones suben al Artico |

> ⚠️ **Verifica los datos, no los supongas.** Al preparar estas aventuras casi
> escribo "desde Mexico sales en Nueva Zelanda": la antipoda real de Mexico cae
> en **medio del oceano Indico**. Casi toda la tierra tiene agua enfrente, asi
> que los pares validos hay que buscarlos. Lo mismo con las fronteras (Mexico y
> Canada NO son vecinos) y con los tamaños. Pideselo a Claude: hay scripts que
> lo comprueban con `geoContains`, `geoArea` y `geoInterpolate` sobre el
> TopoJSON real.

Ejemplos ya hechos: `G1-01b_continentes-globo.json` (quiz) y
`G0-01b_planeta-azul-globo.json` (exploracion libre con `estilo: "tierra"`).

---

## Banderas (sub-sección)

Programa en `PROGRAMA_BANDERAS.md`. Documentos en `_geografia/banderas/` con
`"tipo": "banderas"` (tarjeta propia en Bóveda) y misiones de los motores de siempre.

- **Nivel e id**: `GB0`..`GB3` (actuales, por edad) y `GBH` (históricas). Archivo e id:
  `GB1-02_america-latina.json`, `GBH-01_mexico-historico.json`.
- **Código de bandera en cada reto** (para el álbum de la Fase 3): `"bandera": "mx"`
  (alfa-2 o subdivisión `us-tx`, `gb-sct`), o en históricas `"bandera_id": "h-prusia"`
  + `"bandera_url"`. El mismo `bandera_id` siempre con la misma URL.
- **Imágenes**: actuales y estados de EE.UU. desde flagcdn
  `https://flagcdn.com/w320/{codigo}.png` (anchos válidos: 20, 40, 80, 160, 320, 640, 1280;
  `w100` da 404; no hay `us-dc`). Históricas: URL **original** de Wikimedia Commons
  (`https://upload.wikimedia.org/wikipedia/commons/x/xx/Archivo.svg`, sin `/thumb/` ni `?utm…`),
  resuelta con la API de Commons (`prop=imageinfo&iiprop=url`).
- **image-picker**:
  - bandera → nombre: `imagen_url` en el reto, opciones de texto (sin `palabra_es` que diga el país).
  - nombre → bandera: opciones `{ "imagen": "https://flagcdn.com/w320/jp.png", "label": "Japón" }`
    y en la **misión** `"opciones_bandera": true` (no recorta y quita el `alt`, que si la
    imagen falla diría la respuesta).
- **explorador-mapa** con `"pregunta_bandera": true` (misión o reto): la bandera es la
  pregunta y el niño toca el país/estado. La `pregunta` **no** nombra el lugar
  ("¿De qué país es esta bandera? Tócalo en el mapa"). Para históricas, `bandera_url`
  y el `id` del país actual ("¿Dónde quedaba el Imperio Alemán? Toca la Alemania de hoy").
  Ojo: el mapa 110m no tiene países chicos (Singapur, Mónaco, Malta, casi todo el
  Caribe chico); esos van en image-picker. El validador lo marca.
- **tap-the-pairs** con imagen: `{ "es": "Japón", "en": "bandera de Japón", "en_img": "https://flagcdn.com/w160/jp.png", "bandera": "jp" }`.
  `es`/`en` siguen siendo obligatorios (describen el par); del lado con imagen se ve la imagen.
- **Banderas polémicas** (Alemania 1933-45, Confederación, URSS, sol naciente): sí entran,
  con descripción **neutral y breve** (qué país, qué años); nada racista; no se profundiza.

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
5. Validar: `node _geografia/_valida.mjs` (con `--red` prueba también que carguen las imágenes)
6. Migrar a Firebase via `/admin/migracion` (Geografía; acepta un arreglo `[...]` para subir varios)
7. Probar en la app antes de pasar al siguiente tema. QA en pantalla:
   `C:\Proyectos JJCG\qa-navegador\chuymath-geo-recorrido.mjs` juega cada aventura
   completa y `chuymath-geo-dump.mjs` compara Firestore con el disco.

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

Ver seccion "Monumentos y lugares — Wikimedia Commons" arriba para la regla de URLs originales (sin `/thumb/`).

---

## Verificacion antes de migrar

- **`node _geografia/_valida.mjs` sin errores** (califica opción múltiple con la
  función real de la app, revisa ids de mapa contra los datos, parejas repetidas,
  banderas que regalan la respuesta, preguntas de mini-story que la app no dibuja).
- **Datos verificados, no supuestos** (ver la advertencia del globo): récords,
  poblaciones (India supera a China desde 2023), "el más grande", fechas.
- **Sin regalos**: el título, la instrucción, la pista o un emoji no deben decir
  la respuesta.
- Texto en español correcto, con tildes y ¡ ¿ (el botón 🔊 lee con ellas).
- ¿`tipo` esta a nivel raiz Y a nivel mision?
- ¿`materia: "geografia"` esta a nivel raiz?
- ¿`nivel` sigue el patron `G{0-3}-{NN}`?
- ¿Las URLs de imagenes son accesibles (no requieren auth)?
- ¿Las opciones tienen una respuesta correcta marcada?
- ¿El tema esta listado en `PROGRAMA_GEOGRAFIA.md`?
