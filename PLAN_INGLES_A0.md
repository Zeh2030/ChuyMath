# Plan: Contenido A0 (8 unidades) para inglés

## Contexto

Contenido de inglés para las 8 unidades del nivel A0 (Pre-Starter). Servirá como repaso para el hijo (7 años, nivel A1-09) y como material base para la hija (4 años) y futuros usuarios. Son temas muy básicos: saludos, colores, números, objetos, formas, familia, emociones, cuerpo.

## Tipos de juego por unidad A0

No todos los 9 tipos aplican a nivel A0 (no hay conjugación de verbos ni transformación de oraciones a este nivel). La selección es:

| Tipo de juego | A0-01 Greetings | A0-02 Colors | A0-03 Numbers | A0-04 Objects | A0-05 Shapes | A0-06 Family | A0-07 Feelings | A0-08 Body |
|---------------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| image-picker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| tap-the-pairs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| word-scramble | | ✅ | | ✅ | ✅ | ✅ | ✅ | ✅ |
| listen-and-type | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ | ✅ |
| fill-the-gap | | | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| word-bank | | | | | | ✅ | ✅ | ✅ |
| **Total por unidad** | **3** | **4** | **4** | **5** | **4** | **6** | **6** | **6** |

**Total JSONs: ~38 archivos**

## Contenido por unidad

### A0-01: Greetings & Names (3 juegos)
- **image-picker**: emojis 👋🤝😊🙋 → hello, hi, bye, good morning
- **tap-the-pairs**: hola↔hello, adiós↔bye, buenos días↔good morning, buenas noches↔good night, ¿cómo te llamas?↔what's your name?
- **listen-and-type**: "Hello", "My name is Emma", "Good morning", "Bye bye"

### A0-02: Colors (4 juegos)
- **image-picker**: 🔴🔵🟢🟡 → red, blue, green, yellow (2 rondas: colores básicos + avanzados)
- **tap-the-pairs**: rojo↔red, azul↔blue, verde↔green, amarillo↔yellow, naranja↔orange, morado↔purple
- **word-scramble**: RED, BLUE, GREEN, YELLOW, ORANGE, PURPLE, BLACK, WHITE
- **listen-and-type**: "It is red", "The ball is blue", "I like green"

### A0-03: Numbers 1-20 (4 juegos)
- **image-picker**: emojis numéricos 1️⃣2️⃣3️⃣ → one, two, three... (2 rondas: 1-10, 11-20)
- **tap-the-pairs**: uno↔one, dos↔two, tres↔three... (2 rondas)
- **fill-the-gap**: "There are ___ apples" con imagen de 3 manzanas → three
- **listen-and-type**: "one", "five", "ten", "fifteen", "twenty"

### A0-04: Classroom Objects (5 juegos)
- **image-picker**: ✏️📖📏🎒 → pencil, book, ruler, bag
- **tap-the-pairs**: lápiz↔pencil, libro↔book, regla↔ruler, borrador↔eraser, mochila↔bag
- **word-scramble**: PENCIL, BOOK, RULER, ERASER, DESK, CHAIR
- **fill-the-gap**: "This is ___ pencil" → a/an
- **listen-and-type**: "This is a book", "I have a pencil"

### A0-05: Shapes (4 juegos)
- **image-picker**: 🔴🔲🔺⭐ → circle, square, triangle, star
- **tap-the-pairs**: círculo↔circle, cuadrado↔square, triángulo↔triangle, rectángulo↔rectangle, estrella↔star
- **word-scramble**: CIRCLE, SQUARE, TRIANGLE, STAR, RECTANGLE
- **fill-the-gap**: "It is ___ big circle" → a

### A0-06: Family (6 juegos)
- **image-picker**: 👩👨👦👧👶 → mom, dad, brother, sister, baby
- **tap-the-pairs**: mamá↔mom, papá↔dad, hermano↔brother, hermana↔sister, abuela↔grandma, abuelo↔grandpa
- **word-scramble**: MOM, DAD, BROTHER, SISTER, GRANDMA, BABY
- **fill-the-gap**: "This is ___ mom" → my
- **word-bank**: "This is my mom", "He is my brother", "She is my sister"
- **listen-and-type**: "This is my dad", "She is my sister", "I love my family"

### A0-07: Feelings & Emotions (6 juegos)
- **image-picker**: 😊😢😠😴🤤😨 → happy, sad, angry, tired, hungry, scared
- **tap-the-pairs**: feliz↔happy, triste↔sad, enojado↔angry, cansado↔tired, con hambre↔hungry, asustado↔scared
- **word-scramble**: HAPPY, SAD, ANGRY, TIRED, HUNGRY, SCARED
- **fill-the-gap**: "I ___ happy" → am, "Are you ___?" → sad
- **word-bank**: "I am happy", "She is sad", "Are you tired?"
- **listen-and-type**: "I am happy", "He is tired", "Are you hungry?"

### A0-08: Body Parts (6 juegos)
- **image-picker**: 👤👀👃👄🖐️🦶 → head, eyes, nose, mouth, hands, feet
- **tap-the-pairs**: cabeza↔head, ojos↔eyes, nariz↔nose, boca↔mouth, manos↔hands, pies↔feet
- **word-scramble**: HEAD, EYES, NOSE, MOUTH, HANDS, FEET, EARS, ARMS
- **fill-the-gap**: "I have two ___" → eyes/hands/feet
- **word-bank**: "Touch your head", "I have two eyes", "She has brown hair"
- **listen-and-type**: "Touch your nose", "I have two hands", "Open your mouth"

## Nomenclatura de archivos

```
_content/{tipo}/A0-{num}_{tipo}_{tema}.json

Ejemplos:
  _content/image-picker/A0-01_image-picker_greetings.json
  _content/tap-the-pairs/A0-02_tap-the-pairs_colors.json
  _content/word-scramble/A0-04_word-scramble_classroom-objects.json
```

## Verificación

1. `npm run build` sin errores (no hay cambios de código, solo JSONs)
2. Subir JSONs a Firebase vía migrador (🇬🇧 Inglés) o script batch
3. Verificar que aparecen en Bóveda bajo English
4. Jugar al menos 1 de cada tipo para confirmar estructura
