# Programa de Dibujo y Arte ChuyMath — Roadmap Global

Programa progresivo de dibujo y arte para ninos. Combina colorear, trazos guiados,
dibujo paso a paso y creacion libre. 1-2 actividades por semana.

---

## 📌 ESTADO ACTUAL (actualizado 2026-07-03) — LEER PRIMERO AL RETOMAR

El modulo esta **EN PAUSA** unos dias por decision de Jesus. Resumen de donde quedamos:

**Hecho y en produccion (Firebase coleccion `dibujo`):**
- **D0 completo** (15/15) — para la hija (~4 anos). Trazos, colorear, primeras creaciones.
- **D1 completo** (15/15) — para el hijo (7 anos). Formas, animales, escenas.
- **D2 COMPLETO (20/20)** — nivel del hijo. Guiados de animales, personajes,
  vehiculos y escenas + colorear + dibujo-libre. Las ultimas 3 (D2-05 Tortuga
  Marina, D2-07 Cuerpo Completo, D2-17 Bosque Encantado) se crearon el 2026-07-03.
- **Teoria del color** (mezclador-colores): D1-21, D2-23, D2-24. Tienen tarjeta
  propia 🌈 "Teoria del Color" en Dashboard y Boveda (materia Arte).

**PENDIENTE mas grande:**
- **Todo D3** (9-11 anos): sombreado, perspectiva, rostros, proyectos. Es el nivel
  mas tecnico; el SVG naif tendra que subir de calidad o combinar con referencia.
- **Persistencia Nivel 2** (galeria Firebase Storage — ver seccion al final).

**Flujo para agregar contenido:** crear SVG con el generador → rasterizar y revisar
→ crear JSON → `git push` (Netlify auto-deploya) → **Jesus migra el JSON en
AdminMigracion** (paso manual imprescindible; sin migrar, no aparece en la app).
Ver seccion "Flujo de produccion SVG" mas abajo.

**Notas de implementacion recientes (2026-07-03):**
- Todas las imagenes son **SVG propios** en `chuy-react-app/public/dibujo/`
  (NO se descargan de internet — ver "Enfoque SVG-first").
- Se arreglaron 2 bugs del lienzo: (1) trazos rapidos/toques simples que no
  pintaban — el flag de dibujo paso de estado de React a `useRef`; (2) el boton
  Limpiar borraba el contorno base si antes se uso el borrador — se resetea
  `globalCompositeOperation` antes de repintar. Afecta Colorear/DibujoLibre/DibujoGuiado.
- Inconsistencia menor conocida: el codigo `D0-14` esta usado por dos docs
  (`dibujo-guiado/D0-14_gusanito` del programa y `dibujo-libre/D0-14_castillo-de-princesa`
  extra). Son docs distintos en Firebase (id distinto), solo comparten etiqueta de nivel.

---

## Estructura de niveles

```
D0  → Trazos y Color  (3-5 anos)  ← Para la hija (3.8 anos)
D1  → Formas           (5-7 anos)  ← Nivel de entrada del hijo (7 anos)
D2  → Creador          (7-9 anos)  ← Nivel actual real del hijo (va a clases)
D3  → Artista Jr.      (9-11 anos) ← Meta a largo plazo
```

| Nivel | Nombre | Edad | Duracion | Actividades | Ritmo |
|-------|--------|------|----------|-------------|-------|
| D0 | Trazos y Color | 3-5 | ~15 semanas | 15 | 1-2/semana |
| D1 | Formas | 5-7 | ~15 semanas | 15 | 1-2/semana |
| D2 | Creador | 7-9 | ~20 semanas | 20 | 1-2/semana |
| D3 | Artista Jr. | 9-11 | ~20 semanas | 20 | 1-2/semana |

**Total programa:** 70 actividades (~50-70 semanas de contenido)

---

## Estructura de carpetas

Los JSONs se organizan en subcarpetas por tipo de juego (igual que geografia / ingles):

```
_dibujo/
  PROGRAMA_DIBUJO.md       <- este archivo
  colorear/                <- tipo "colorear" (canvas con imagen de contorno)
  dibujo-libre/            <- tipo "dibujo-libre" (canvas en blanco + sugerencias)
  dibujo-guiado/           <- tipo "dibujo-guiado" (wizard pasos con referencia)
  mezclador-colores/       <- tipo "mezclador-colores" (teoria del color)
```

Esto solo afecta organizacion del repo. Firebase mantiene la coleccion `dibujo`
plana — no le importan los subfolders. La migracion (subir a Firebase) sigue igual.

---

## Tipos de actividad

### 4 tipos de juego (componentes)

| Tipo | Descripcion | Componente | Estado |
|------|-------------|------------|--------|
| `colorear` | Imagen de contornos como fondo, nino pinta encima | Nuevo (basado en LienzoDibujo) | ✅ Creado |
| `dibujo-guiado` | Tutorial paso a paso con imagen de referencia por paso | Nuevo (wizard + canvas) | ✅ Creado |
| `dibujo-libre` | Canvas libre con tema e imagen de referencia al lado | LienzoDibujo existente (extender) | ✅ Creado |
| `mezclador-colores` | Mezcla de colores RYB: explorar + retos + rueda de color | `MezcladorColores.jsx` (compartido con ciencias) | ✅ Creado |

> **Nota:** `mezclador-colores` es agnostico de materia (igual que `tap-the-pairs`).
> En Ciencias enmarca el *descubrimiento* del fenomeno; en Dibujo enmarca la
> *teoria del color* del artista. Mismo componente, distinto contenido JSON.

#### Mezclador dentro del lienzo (fase 2 — IMPLEMENTADO)

Ademas del juego `mezclador-colores`, los componentes `colorear` y `dibujo-libre`
incluyen un mini-mezclador (`MezcladorLienzo.jsx`, boton 🧪 en la barra): el nino
elige dos colores, los mezcla (modelo RYB), los aclara/oscurece (tinte/sombra) y
pinta con el color que creo. Los colores mezclados quedan en una fila para reusarlos.
Toda la logica de mezcla vive en `src/utils/colorMix.js`.

### Como funcionan tecnicamente

> ⚠️ **SUPERADO (2026-07-02):** las subsecciones de abajo describen el plan
> original de *descargar PNGs de internet*. Ese enfoque se descarto: ahora todo
> es **SVG propio** en `public/dibujo/` (ver "Enfoque SVG-first" y "Flujo de
> produccion SVG"). Se conserva el texto solo como referencia historica del
> funcionamiento del canvas (que sigue siendo valido: imagen de fondo + pintar encima).

#### `colorear`
- Se carga una imagen PNG de contornos negros sobre fondo blanco como background del canvas
- El nino pinta encima con dedo/mouse usando la paleta de colores
- No necesitamos SVG interactivo: pintar encima de la imagen es suficiente y divertido
- Las imagenes de contornos se pueden:
  - Descargar de sitios gratuitos de colorear (supercoloring.com, coloring-pages-for-kids, etc.)
  - Guardar como PNG en el repositorio o en Firebase Storage
  - Referenciar por URL en el JSON

#### `dibujo-guiado`
- Wizard tipo ExperimentoGuia con pasos
- Cada paso muestra: instruccion + imagen de referencia (como se ve ese paso terminado)
- El nino dibuja en canvas al lado o debajo
- Al final puede comparar su dibujo con el modelo completo
- Imagenes de referencia: URLs o PNGs locales (tutoriales de "how to draw" hay miles)

#### `dibujo-libre`
- Canvas existente (LienzoDibujo)
- Se agrega: imagen de referencia opcional (tema del dia)
- Ejemplo: "Dibuja tu animal favorito" con 4 fotos de ejemplo al lado

### Fuentes de imagenes

| Tipo | Fuente | Formato |
|------|--------|---------|
| Contornos para colorear | supercoloring.com, coloringpages101.com | PNG transparente o fondo blanco |
| Tutoriales paso a paso | "how to draw X step by step" | PNG por paso (extraer de tutoriales) |
| Referencia para dibujo libre | Fotos simples (Unsplash, Pexels) | URL directa |

**Nota sobre imagenes:** Las imagenes se referencian por URL en el JSON (`imagen_url`).
Para imagenes propias o que no tengan URL estable, se suben a Firebase Storage
y se usa la URL de descarga. No guardamos PNGs en el repositorio.

---

## Diferencias por nivel

| Aspecto | D0 | D1 | D2 | D3 |
|---------|----|----|----|----|
| Actividad principal | Colorear + trazos basicos | Colorear + dibujo guiado simple | Dibujo guiado detallado | Dibujo guiado + libre |
| Trazos | Lineas rectas, circulos, zigzag | Formas geometricas, letras | Contornos de objetos | Sombreado, texturas |
| Colorear | Figuras grandes, pocos espacios | Figuras medianas, mas detalle | Escenas con varios elementos | Escenas complejas, degradados |
| Dibujo guiado | No | 3-4 pasos, formas simples | 5-7 pasos, proporciones | 7-10 pasos, volumen y sombra |
| Herramientas | 4-6 colores, grosor unico | 6-8 colores, 2 grosores | Paleta completa, borrador | Paleta + opacidad + capas |
| Tiempo por actividad | 5-10 min | 10-15 min | 15-25 min | 20-30 min |

---

## Nivel D0: Trazos y Color (15 actividades)

**Perfil:** Nina de 3-5 anos. Motricidad fina en desarrollo. Colores brillantes, figuras grandes.
**Papa/mama acompana.** El objetivo es divertirse y mejorar control del trazo.

### Bloque 1: Trazos basicos (D0-01 a D0-05)

> **Nota (2026-07-03):** los trazos se implementaron como tipo `colorear` en vez de
> `dibujo-guiado`: la guia punteada (SVG con `stroke-dasharray`, punto verde =
> inicio, punto rojo = fin) va como fondo del canvas y la nina traza ENCIMA.
> Para 3-4 anos calcar es mejor que copiar mirando una imagen al lado.
> Cada actividad tiene 2-3 misiones que suben de dificultad.

| # | Titulo | Tipo | Descripcion | Estado |
|---|--------|------|-------------|--------|
| D0-01 | Lineas Locas | colorear (trazo) | Horizontales, verticales y reja (3 misiones) | ✅ Creado |
| D0-02 | Circulos y Mas Circulos | colorear (trazo) | Circulo grande + circulos de tamanos (2 misiones) | ✅ Creado |
| D0-03 | Olas del Mar | colorear (trazo) | Una ola + dos olas con pececito (2 misiones) | ✅ Creado |
| D0-04 | Zigzag de Rayo | colorear (trazo) | Montanas + rayo vertical (2 misiones) | ✅ Creado |
| D0-05 | Espirales Magicas | colorear (trazo) | Espiral + concha de caracol (2 misiones) | ✅ Creado |

### Bloque 2: Colorear figuras simples (D0-06 a D0-10)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D0-06 | Sol Brillante | colorear | Colorear un sol grande con rayos |
| D0-07 | Flor del Jardin | colorear | Colorear una flor de 5 petalos |
| D0-08 | Estrella de Mar | colorear | Colorear una estrella de mar |
| D0-09 | Mariposa Bonita | colorear | Colorear una mariposa simetrica |
| D0-10 | Casa Feliz | colorear | Colorear una casa simple (cuadrado + triangulo) |

### Bloque 3: Primeras creaciones (D0-11 a D0-15)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D0-11 | Mi Cara | dibujo-guiado | Dibujar una cara: circulo + ojos + boca (3 pasos) ✅ Creado |
| D0-12 | Arbol con Manzanas | colorear | Colorear arbol + agregar manzanas rojas (dibujar circulos) ✅ Creado |
| D0-13 | Lluvia y Nubes | dibujo-libre | Dibujo libre: cielo con nubes y gotas de lluvia |
| D0-14 | Gusanito de Circulos | dibujo-guiado | Dibujar gusano: circulos conectados + antenas ✅ Creado |
| D0-15 | Mi Familia | dibujo-libre | Dibujo libre: dibuja a tu familia |

---

## Nivel D1: Formas (15 actividades)

**Perfil:** Nino de 5-7 anos. Reconoce formas. Puede seguir instrucciones visuales de 3-5 pasos.
**Si el hijo de 7 ya dibuja bien, puede empezar directo en D2.** D1 es backup o para la hija cuando crezca.

### Bloque 1: Formas geometricas (D1-01 a D1-05)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D1-01 | Robot de Cuadrados | dibujo-guiado | Dibujar un robot usando solo cuadrados y rectangulos (4 pasos) ✅ Creado |
| D1-02 | Cohete Espacial | dibujo-guiado | Triangulo + rectangulo + circulos = cohete (4 pasos) ✅ Creado |
| D1-03 | Tren de Figuras | dibujo-guiado | Locomotora con rectangulos, circulos como ruedas (5 pasos) ✅ Creado |
| D1-04 | Ciudad de Noche | colorear | Colorear edificios rectangulares con ventanas y luna ✅ Creado |
| D1-05 | Pecera Redonda | dibujo-guiado | Ovalo grande + peces triangulares + burbujas circulares (4 pasos) ✅ Creado |

### Bloque 2: Animales simples (D1-06 a D1-10)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D1-06 | Gato Facil | dibujo-guiado | Circulo + triangulos (orejas) + bigotes (5 pasos) ✅ Creado |
| D1-07 | Perro Amigable | dibujo-guiado | Formas redondeadas: cabeza, cuerpo, patas, cola (5 pasos) ✅ Creado |
| D1-08 | Pez Tropical | colorear | Colorear pez con franjas y aletas (muchos espacios) ✅ Creado |
| D1-09 | Buho Nocturno | dibujo-guiado | Circulos concentricos (ojos grandes), triangulo (pico) (5 pasos) ✅ Creado |
| D1-10 | Dinosaurio | colorear | Colorear dinosaurio con fondo de volcanes ✅ Creado |

### Bloque 3: Escenas (D1-11 a D1-15)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D1-11 | Paisaje con Montana | dibujo-guiado | Montana (triangulo) + sol + rio + arboles (5 pasos) ✅ Creado |
| D1-12 | Fondo del Mar | colorear | Colorear escena submarina: peces, corales, tortuga ✅ Creado |
| D1-13 | Mi Cuarto | dibujo-libre | Dibujo libre con referencia: dibuja tu cuarto (cama, juguetes, ventana) |
| D1-14 | Castillo Medieval | dibujo-guiado | Torres con rectangulos y triangulos, puerta, bandera (5 pasos) ✅ Creado |
| D1-15 | Retrato de mi Mascota | dibujo-libre | Dibujo libre: dibuja a tu mascota (o animal favorito) con referencia |

---

## Nivel D2: Creador (20 actividades)

**Perfil:** Nino de 7-9 anos que va a clases de dibujo. Proporciones basicas, mas detalle.
**NIVEL PROBABLE del hijo (7 anos, asiste a clases).** Puede empezar aqui si D1 le queda facil.

### Bloque 1: Animales detallados (D2-01 a D2-05)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D2-01 | Perro Realista | dibujo-guiado | Proporciones reales: cabeza, hocico, cuerpo, patas, cola (6 pasos) ✅ Creado |
| D2-02 | Gato Sentado | dibujo-guiado | Postura de gato sentado, ojos almendrados, bigotes (6 pasos) ✅ Creado |
| D2-03 | Caballo al Trote | dibujo-guiado | Cuerpo alargado, patas en movimiento, crin (7 pasos) ✅ Creado |
| D2-04 | Aguila en Vuelo | dibujo-guiado | Alas extendidas, plumas, garras (7 pasos) ✅ Creado |
| D2-05 | Tortuga Marina | colorear | Colorear tortuga con patron de caparazon detallado ✅ Creado |

### Bloque 2: Personajes (D2-06 a D2-10)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D2-06 | Cara con Expresiones | dibujo-guiado | Proporciones del rostro: ojos al centro, nariz, boca (6 pasos) ✅ Creado |
| D2-07 | Cuerpo Completo | dibujo-guiado | Figura humana: cabeza, torso, brazos, piernas, proporciones (7 pasos) ✅ Creado |
| D2-08 | Ninja | dibujo-guiado | Personaje de accion con pose dinamica (7 pasos) ✅ Creado |
| D2-09 | Princesa / Principe | dibujo-guiado | Personaje con ropa detallada, corona, capa (7 pasos) ✅ Creado (version princesa) |
| D2-10 | Superheroe | dibujo-libre | Dibujo libre: disena tu propio superheroe (con guia de proporciones) |

### Bloque 3: Objetos y vehiculos (D2-11 a D2-15)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D2-11 | Auto Deportivo | dibujo-guiado | Perspectiva lateral, ruedas, ventanas, detalles (6 pasos) ✅ Creado |
| D2-12 | Avion de Pasajeros | dibujo-guiado | Fuselaje, alas, cola, ventanillas (6 pasos) ✅ Creado |
| D2-13 | Barco Pirata | dibujo-guiado | Casco, mastil, velas, bandera pirata (7 pasos) ✅ Creado |
| D2-14 | Mandala Basico | colorear | Colorear mandala con patron repetitivo circular ✅ Creado |
| D2-15 | Disena tu Robot | dibujo-libre | Dibujo libre: inventa un robot con partes mecanicas |

### Bloque 4: Escenas y fondos (D2-16 a D2-20)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D2-16 | Atardecer en la Playa | dibujo-guiado | Horizonte, sol poniente, palmeras, reflejo en agua (6 pasos) ✅ Creado |
| D2-17 | Bosque Encantado | colorear | Colorear escena compleja: arboles, hongos, hada, rio ✅ Creado |
| D2-18 | Ciudad Futurista | dibujo-libre | Dibujo libre: imagina la ciudad del futuro |
| D2-19 | Mapa del Tesoro | dibujo-guiado | Isla, camino, X marca el tesoro, brujula, barco (7 pasos) ✅ Creado |
| D2-20 | Mi Obra Maestra | dibujo-libre | Dibujo libre total: tema libre, usa todo lo aprendido |

---

## Nivel D3: Artista Jr. (20 actividades)

**Perfil:** Nino de 9-11 anos. Introduce sombreado, perspectiva, volumen, texturas.
**Nivel avanzado.** Actividades mas largas y tecnicas.

### Bloque 1: Tecnicas de sombreado (D3-01 a D3-05)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D3-01 | Esfera con Sombra | dibujo-guiado | Circulo + degradado de sombra + sombra proyectada (5 pasos) |
| D3-02 | Cubo en 3D | dibujo-guiado | Cubo con perspectiva, caras claras y oscuras (5 pasos) |
| D3-03 | Cilindro y Cono | dibujo-guiado | Formas 3D con sombreado (6 pasos) |
| D3-04 | Bodegon Simple | dibujo-guiado | Manzana + vaso sobre mesa, sombras y reflejos (7 pasos) |
| D3-05 | Texturas | dibujo-guiado | Practicar texturas: madera, piedra, agua, pelaje (4 ejercicios) |

### Bloque 2: Perspectiva (D3-06 a D3-10)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D3-06 | Camino al Horizonte | dibujo-guiado | Perspectiva de 1 punto de fuga: camino, arboles, postes (6 pasos) |
| D3-07 | Cuarto en Perspectiva | dibujo-guiado | Habitacion con 1 punto de fuga: piso, paredes, muebles (7 pasos) |
| D3-08 | Edificio en Esquina | dibujo-guiado | Perspectiva de 2 puntos de fuga (7 pasos) |
| D3-09 | Ciudad en Perspectiva | dibujo-guiado | Calle con edificios usando perspectiva (8 pasos) |
| D3-10 | Paisaje con Profundidad | dibujo-guiado | Planos: frente, medio, fondo — objetos se hacen mas chicos (7 pasos) |

### Bloque 3: Personajes avanzados (D3-11 a D3-15)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D3-11 | Rostro de Frente | dibujo-guiado | Proporciones exactas: linea de ojos, nariz, boca (8 pasos) |
| D3-12 | Rostro de Perfil | dibujo-guiado | Vista lateral con proporciones (7 pasos) |
| D3-13 | Manos y Pies | dibujo-guiado | Simplificar manos en formas basicas, luego detalle (8 pasos) |
| D3-14 | Personaje en Movimiento | dibujo-guiado | Figura humana corriendo/saltando, lineas de accion (8 pasos) |
| D3-15 | Disena tu Personaje de Comic | dibujo-libre | Crear personaje original con hoja de modelo (frente, perfil, pose) |

### Bloque 4: Proyectos finales (D3-16 a D3-20)

| # | Titulo | Tipo | Descripcion |
|---|--------|------|-------------|
| D3-16 | Dragon Epico | dibujo-guiado | Dragon completo con alas, escamas, fuego (9 pasos) |
| D3-17 | Mandala Complejo | colorear | Mandala con patrones geometricos avanzados y degradados |
| D3-18 | Paisaje Completo | dibujo-guiado | Montana, lago, arboles, cielo con nubes, reflejos (8 pasos) |
| D3-19 | Portada de Comic | dibujo-libre | Disenar portada de comic con titulo, personaje y escena |
| D3-20 | Galeria Personal | dibujo-libre | Elegir 3 dibujos favoritos de todo el programa, mejorarlos |

---

## Bloque de Teoria del Color (mezclador-colores)

Progresion de artista, transversal a los niveles. Usa el tipo `mezclador-colores`.

| # | Titulo | Modo | Enfoque | Estado |
|---|--------|------|---------|--------|
| D1-21 | Primarios y Secundarios | completo | 3 primarios → 3 secundarios | ✅ Creado |
| D2-23 | La Rueda de Color | completo | + secundarios → 6 terciarios (rueda completa) | ✅ Creado |
| D2-24 | Calidos, Frios y Complementarios | explorar | temperaturas + opuestos = cafe | ✅ Creado |

Campos JSON del tipo `mezclador-colores`:

```json
{
  "tipo": "mezclador-colores",
  "modo": "explorar | reto | completo",
  "instruccion": "...",
  "leccion": "texto que aparece en la portada",
  "colores_base": ["rojo", "amarillo", "azul"],
  "mostrar_rueda": true,
  "retos": [ { "objetivo": "naranja", "pista": "..." } ],
  "dato_curioso": "texto al terminar"
}
```

ids de color validos (en `src/utils/colorMix.js`): `rojo`, `amarillo`, `azul`,
`naranja`, `verde`, `morado`, `rojo-naranja`, `amarillo-naranja`, `amarillo-verde`,
`azul-verde`, `azul-morado`, `rojo-morado`, `cafe`.

### Pendiente (siguiente lote de teoria del color)
- Complementarios como reto de emparejar → reutilizar `tap-the-pairs`.
- Calido vs frio como clasificacion → reutilizar `opcion-multiple`.
- Tintes y sombras (agregar blanco/negro) ya existen en el mezclador del lienzo;
  podrian volverse su propia leccion.

---

## Coleccion Firebase: `dibujo`

### Estructura del JSON

```json
{
  "id": "D0-06_sol-brillante",
  "titulo": "Sol Brillante",
  "materia": "dibujo",
  "nivel": "D0-06",
  "tema": "colorear-basico",
  "misiones": [{
    "id": "dib-sol-01",
    "tipo": "colorear",
    "titulo": "Sol Brillante",
    "emoji": "☀️",
    "instruccion": "Colorea el sol con colores brillantes!",
    "imagen_contorno_url": "https://..../sol-contorno.png",
    "colores_sugeridos": ["#f1c40f", "#e67e22", "#e74c3c"],
    "dificultad": "facil"
  }]
}
```

```json
{
  "id": "D1-06_gato-facil",
  "titulo": "Gato Facil",
  "materia": "dibujo",
  "nivel": "D1-06",
  "tema": "animales-simples",
  "misiones": [{
    "id": "dib-gato-01",
    "tipo": "dibujo-guiado",
    "titulo": "Gato Facil",
    "emoji": "🐱",
    "instruccion": "Sigue los pasos para dibujar un gato!",
    "pasos": [
      { "instruccion": "Dibuja un circulo grande para la cabeza", "imagen_url": "https://..../gato-paso1.png" },
      { "instruccion": "Agrega 2 triangulos arriba para las orejas", "imagen_url": "https://..../gato-paso2.png" },
      { "instruccion": "Dibuja 2 ojos ovalados y una nariz triangular", "imagen_url": "https://..../gato-paso3.png" },
      { "instruccion": "Agrega bigotes: 3 lineas a cada lado", "imagen_url": "https://..../gato-paso4.png" },
      { "instruccion": "Dibuja el cuerpo ovalado y la cola curva", "imagen_url": "https://..../gato-paso5.png" }
    ],
    "imagen_final_url": "https://..../gato-completo.png"
  }]
}
```

```json
{
  "id": "D2-10_superheroe",
  "titulo": "Superheroe",
  "materia": "dibujo",
  "nivel": "D2-10",
  "tema": "personajes",
  "misiones": [{
    "id": "dib-hero-01",
    "tipo": "dibujo-libre",
    "titulo": "Disena tu Superheroe",
    "emoji": "🦸",
    "instruccion": "Inventa y dibuja tu propio superheroe. Usa la guia de proporciones.",
    "imagen_referencia_url": "https://..../guia-proporciones-personaje.png",
    "sugerencias": ["Piensa en un superpoder", "Disena su traje", "Dale un nombre"]
  }]
}
```

---

## Implementacion tecnica

### Componentes nuevos necesarios

| Componente | Base | Que agrega |
|------------|------|------------|
| `DibujoGuiado.jsx` | Wizard (como ExperimentoGuia) + LienzoDibujo | Pasos con imagen de referencia + canvas al lado |
| `Colorear.jsx` | LienzoDibujo | Imagen de contorno como fondo del canvas |
| `DibujoLibre.jsx` | LienzoDibujo (extender) | Imagen de referencia opcional al lado/arriba |

### Mejoras al LienzoDibujo existente

| Mejora | Para que |
|--------|---------|
| Borrador (color blanco o clearRect puntual) | Todos los niveles |
| Selector de grosor (3 opciones: fino, medio, grueso) | D1+ |
| Boton deshacer (guardar ultimos N trazos) | D2+ |
| Zoom/pan en canvas (pinch to zoom en tablet) | D3 (opcional) |
| Imagen de fondo en canvas (para colorear) | Tipo `colorear` |

### Sobre las imagenes

**Enfoque SVG-first (decidido 2026-07-02):** los contornos y referencias se generan
como SVG propios y viven en el repo (`chuy-react-app/public/dibujo/`). Razones:

- Las URLs externas se rompen: openclipart manda el header CORS duplicado (`*,*`)
  y el navegador rechaza la imagen aunque la URL responda 200 → canvas en blanco.
- SVGs propios: sin copyright, sin Storage, funcionan offline, estilo consistente,
  editables (si un contorno queda dificil para la nina, se simplifica).
- Para `dibujo-guiado`: un SVG maestro en capas genera los pasos (paso N =
  capas 1..N visibles, con el trazo nuevo resaltado en color). Esto era el
  cuello de botella del enfoque de recortes de internet.
- Los trazos punteados de D0-01 a D0-05 salen nativos con `stroke-dasharray`.

En el JSON va la ruta local: `"imagen_contorno_url": "/dibujo/colorear/D0-06_sol-brillante.svg"`.
Los SVG llevan `width`/`height` explicitos (no solo viewBox) para que
`drawImage()` los escale bien en el canvas.
Galeria de revision interna: `http://localhost:5173/dibujo/galeria.html`
(agregar cada SVG nuevo a `public/dibujo/galeria.html`).

**Hecho con SVG local (migrar JSONs a Firebase tras cada lote):**
- D0-06 a D0-10 colorear (sol, flor, estrella de mar, mariposa, casa) — piloto.
- D0-01 a D0-05 trazos (guias punteadas, 11 SVGs en `public/dibujo/trazos/`).
- Todos los colorear restantes de D0-D2: D0-12 arbol, D1-04 ciudad de noche,
  D1-08 pez tropical, D1-10 dinosaurio, D1-12 fondo del mar, D2-14 mandala
  basico (el mandala se genera con simetria rotacional — SVG ideal).
- D1-06 Gato Facil, primer dibujo-guiado real: SVG por paso en
  `public/dibujo/guiado/`, paso nuevo resaltado en rojo, anteriores en negro,
  mas modelo final. Esta es la plantilla para el resto de dibujo-guiado.

**Excepcion:** para el 5-10% de casos que de verdad necesite foto o arte complejo
(referencias de dibujo-libre, D2/D3 realista), se permite URL externa o Firebase
Storage como antes. El esquema JSON no cambia.

---

## Flujo de produccion SVG (COMO SE CREO TODO — replicar al retomar)

Toda la biblioteca D0-D2 se genero con este flujo. Reproducirlo para D3 o para
las 3 actividades pendientes de D2.

### 1. Colorear y trazos (SVG estatico)
Un SVG 800x800 por actividad, en `public/dibujo/colorear/` o `public/dibujo/trazos/`:
- `width`/`height` explicitos (no solo viewBox) para que `drawImage()` escale bien.
- Fondo blanco, contornos `#2b2b2b`, grosor 12 (detalles 8-10), `stroke-linejoin/linecap="round"`.
- Zonas grandes y cerradas (D0: max 5-6 zonas). Caritas felices para dar encanto.
- Trazos guiados: guia punteada con `stroke-dasharray`, punto verde = inicio, rojo = fin.
- Mandalas: se generan con simetria rotacional (`transform="rotate(...)"`) — el SVG es ideal.

### 2. Dibujo-guiado (SVG por capas — la parte clave)
Cada figura se define UNA vez como lista de "grupos", cada grupo con:
- `step`: en que paso del tutorial aparece.
- `z`: orden de dibujo (para que unas piezas queden delante/detras de otras).
- `xml`: el fragmento SVG, con `{C}` donde va el color del trazo.

Un script de PowerShell recorre los grupos y emite un SVG por paso:
- Paso N = todos los grupos con `step <= N` visibles.
- El grupo cuyo `step == N` (lo nuevo) se pinta en ROJO `#e74c3c`; el resto en negro.
- Ademas emite `_final.svg` con todo en negro (modelo para comparar).
- Nombres: `<prefijo>_paso1.svg` ... `_pasoN.svg` + `_final.svg` en `public/dibujo/guiado/`.

Se creo un generador de referencia reutilizable en **`_dibujo/_generador-guiados.ps1`**
(con una figura de ejemplo y comentarios). Los 3 generadores originales
(`gen-guiados.ps1/-2/-3`) vivian en el scratchpad temporal y ya no existen; este
archivo del repo preserva la tecnica.

### 3. Rasterizar y auto-revisar (control de calidad)
Los SVG se rasterizan a PNG con Edge headless y se revisan visualmente ANTES de
publicar (asi se cazaron errores como orejas flotando o colas despegadas):
```
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  --headless --disable-gpu --screenshot="salida.png" --window-size=800,800 `
  --default-background-color=FFFFFFFF "file:///ruta/al.svg"
```
Galeria de revision para ver todo junto en el navegador (con dev server):
`http://localhost:5173/dibujo/galeria.html` — agregar cada SVG nuevo a
`public/dibujo/galeria.html`.

### 4. JSON + publicar
- Crear el JSON en `_dibujo/<tipo>/` apuntando a las rutas locales
  (`/dibujo/guiado/D2-03_caballo_paso1.svg`, etc.).
- `git push origin master:main` (branch local `master`, remote principal `main`).
  Netlify auto-deploya en ~2-3 min.
- **Jesus migra el/los JSON en AdminMigracion** (radio "Dibujo"). Sin este paso
  el contenido NO aparece en la app aunque el SVG este desplegado.

---

## Integracion en ChuyMath

Misma pauta que Piano y Ciencias:

| Archivo | Cambio |
|---------|--------|
| MateriaToggle.jsx | Agregar: `{ id: 'dibujo', emoji: '🎨', label: 'Arte' }` |
| MateriaToggle.css | `.materia-dibujo.active { background: linear-gradient(135deg, #e67e22, #d35400) }` |
| Dashboard.jsx | Accesos rapidos para materia dibujo |
| Boveda.jsx | Cargar coleccion `dibujo`, tipos `colorear`, `dibujo-guiado`, `dibujo-libre` |
| AdminMigracion.jsx | Radio button `Dibujo` |
| Aventura.jsx | Fallback busqueda en coleccion `dibujo` |
| MisionRenderer.jsx | 4 cases: `colorear`, `dibujo-guiado`, `dibujo-libre`, `mezclador-colores` |

### Coleccion Firebase: `dibujo`
### Carpeta contenido: `_dibujo/`

---

## Plan de contenido

### Produccion en lotes de 10

| Lote | Contenido | Requiere |
|------|-----------|----------|
| Lote 1 | Componentes (DibujoGuiado, Colorear, DibujoLibre) + integracion | Desarrollo |
| Lote 2 | D0-01 a D0-10 (Trazos y colorear basico) | 10 imagenes de contorno |
| Lote 3 | D0-11 a D0-15 + D1-01 a D1-05 | 5 imagenes contorno + tutoriales |
| Lote 4 | D1-06 a D1-15 | Tutoriales de animales y escenas |
| Lote 5 | D2-01 a D2-10 | Tutoriales detallados |
| Lote 6 | D2-11 a D2-20 | Tutoriales + mandalas |
| Lote 7 | D3-01 a D3-20 | Tutoriales avanzados |

### Nota sobre imagenes
Cada lote de contenido requiere preparar las imagenes ANTES de crear los JSONs.
El flujo es: buscar/crear imagenes → subir a Firebase Storage → obtener URLs → crear JSON.

---

## Reglas de contenido

1. Las imagenes de colorear deben tener contornos gruesos y negros (faciles de ver)
2. Para D0: figuras grandes con pocos espacios (maximo 5-6 zonas)
3. Para dibujo guiado: cada paso debe mostrar claramente que se agrego (resaltado)
4. Nunca pedir al nino que dibuje algo sin dar referencia visual
5. Siempre incluir la opcion de "dibujo libre" al final de cada bloque para creatividad
6. No evaluar con calificacion — el boton es "Termine mi dibujo!" no "Verificar"
7. Para D0: instrucciones muy cortas (papa lee), maximo 1 oracion por paso

---

## Persistencia de dibujos del nino

### Nivel 1 (MVP) — localStorage [IMPLEMENTADO 2026-04-29]
- Cada actividad guarda el ultimo dibujo del nino en `localStorage`
- Key: `chuymath_dibujo_{userId}_{misionId}` (separado por usuario y actividad)
- Sobrescribe (no historial). Se carga automaticamente al volver a la actividad.
- Boton "🧽 Borrar guardado" disponible cuando existe dibujo previo.
- Util: `chuy-react-app/src/utils/dibujoStorage.js`
- Componentes integrados: Colorear, DibujoLibre, DibujoGuiado.

### Nivel 2 (PENDIENTE) — Firebase Storage + galeria multi-dispositivo
Cuando el Nivel 1 tenga validacion, escalar a:
- Subir dataURL del canvas a Firebase Storage en `usuarios/{uid}/dibujos/{misionId}.png`
- Documento en Firestore `usuarios/{uid}/dibujos_meta/{misionId}` con `{ fecha, titulo, storage_url }`
- Vista nueva `MisDibujos.jsx`: galeria del usuario activo con todos sus dibujos.
- Hijos pueden ver galerias de los hermanos (no es info sensible).
- Boton borrar individual y boton de descargar PNG (compartir).
- Free tier de Storage (5 GB) alcanza ~5,000 dibujos. Suficiente por años para 3 ninos.

### Nivel 3 (FUTURO) — historial de versiones
- En lugar de sobrescribir, guardar `{misionId}_{timestamp}.png` para ver evolucion.
- "Antes/despues": comparar primer y ultimo dibujo de la misma actividad.
