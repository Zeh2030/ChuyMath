# Guía Maestra para Crear Contenido (Simulacros y Aventuras)

Esta guía detalla la estructura JSON necesaria para crear nuevo contenido en "El Mundo de Chuy".

## 1. Conceptos Básicos: ¿Simulacro o Aventura?

Antes de empezar, decide qué estás creando:

*   **🛡️ Simulacro (Examen):** Una lista de preguntas para evaluar. No da feedback inmediato (hasta el final).
    *   **Colección Firestore:** `simulacros`
    *   **Estructura:** Lista plana de preguntas.
*   **🗺️ Aventura (Juego):** Una experiencia interactiva con feedback inmediato tras cada intento.
    *   **Colección Firestore:** `aventuras`
    *   **Estructura:** Lista de misiones (puede tener historia).

---

## 2. Estructura General del Archivo JSON

Todo archivo debe tener estos campos raíz para funcionar y categorizarse correctamente.

```json
{
  "id": "YYYY-MM-DD_tipo-nivel-descripcion",  // EJ: "2026-03-05_area-maestro-ciudades"
  "tipo": "categoria-del-juego",              // ¡VITAL! Define en qué pestaña aparece.
  "nivel": "basico|intermedio|avanzado|maestro", // Para estratificación futura por dificultad
  "titulo": "Título Visible en la App",
  "descripcion": "Descripción corta para la tarjeta.",
  "misiones": [                               // Array con las actividades
    // ... aquí van las misiones/preguntas ...
  ]
}
```

> **⚠️ Sobre el campo `id`:** Este valor se convierte en el **Document ID en Firestore**. Es lo que ves al navegar en la consola de Firebase. Usa siempre un ID descriptivo — un ID tipo `"2026-03-04"` no te dice nada al buscar en Firebase; `"2026-03-04_area-maestro-gigantes"` sí.
>
> **Nombre del archivo** = mismo que el `id` + extensión `.json`
> EJ: id `"2026-03-05_area-maestro-ciudades"` → archivo `2026-03-05_area-maestro-ciudades.json`
>
> **Nota:** Los archivos creados antes de esta convención usan IDs más simples (solo fecha o sin nivel). Se dejan así para no romper los documentos ya subidos a Firestore.

### 🏷️ Categorías (Campo `tipo`)
El campo `tipo` en la raíz controla dónde aparece el juego en la Bóveda:
*   `"conteo-figuras"` -> Categoría Conteo de Figuras
*   `"criptoaritmetica"` -> Categoría Criptoaritmética
*   `"secuencia"` -> Categoría Secuencias
*   `"tabla-doble-entrada"` -> Categoría Tablas Lógicas
*   `"operaciones"` -> Categoría Operaciones
*   `"aventura"` -> Categoría General (Mix de juegos)
*   `"simulacro"` -> Categoría Exámenes
*   `"numberblocks-constructor"` -> Categoría Numberblocks (multiplicación como rectángulos)
*   `"area-constructor"` -> Categoría Área (medir lados, calcular y construir área)
*   `"fraccion-explorer"` -> Categoría Fracciones (pizza y chocolate visual)
*   `"angulo-explorer"` -> Categoría Ángulos (clasificar y triángulos)
*   `"kakooma"` -> Categoría Kakooma

---

## 3. Tipos de Misiones (Componentes)

Aquí tienes las plantillas para cada tipo de juego. Copia y pega la que necesites.

### A. Opción Múltiple (Texto o Imágenes)
Sirve para preguntas de texto, problemas de lógica con imagen estática, o balanzas simples.

**Nota sobre `respuesta`:**
*   Para **TODAS** las misiones de tipo `opcion-multiple`, la `respuesta` debe ser siempre el **ÍNDICE NUMÉRICO** (0, 1, 2...) de la opción correcta. Esto asegura la máxima coherencia y compatibilidad.

```json
{
  "id": "p-1",
  "tipo": "opcion-multiple",
  "titulo": "Título de la Pregunta",
  "instruccion": "Lee atentamente.",
  "pregunta": "¿Cuántas manzanas hay?",
  "imagen": "<svg>...</svg>",           // Opcional: Código SVG o <img> HTML
  "opciones": ["1", "2", "3", "4"],     // Opciones de texto
  "respuesta": 2,                       // Índice de la correcta (0, 1, 2...) -> Es la "3"
  "explicacion_correcta": "¡Muy bien!",
  "explicacion_incorrecta": "Cuenta otra vez."
}
```

**Versión con Opciones de Imagen:**
```json
{
  "id": "p-2",
  "tipo": "opcion-multiple",
  "pregunta": "¿Cuál es un triángulo?",
  "opciones_son_imagenes": true,
  "opciones": [
    "<svg>...cuadrado...</svg>",
    "<svg>...triángulo...</svg>"
  ],
  "respuesta": 1 // Índice de la segunda opción
}
```

### B. Palabra del Día (Word of the Day)
Juego para ordenar letras.

```json
{
  "id": "mision-palabra",
  "tipo": "palabra-del-dia",
  "titulo": "Word of the Day",
  "palabra": "APPLE",                 // La palabra a formar (letras desordenadas)
  "palabra_en": "Apple",              // Texto en inglés para mostrar/leer
  "palabra_es": "Manzana",            // Traducción al español
  "icono": "🍎",                      // Emoji o icono
  "audio_pronunciacion": "https://...mp3" // Opcional: URL de audio
}
```

### C. Desarrollo de Cubos (Visión Espacial)
Soporta múltiples ejercicios secuenciales.

```json
{
  "id": "mision-cubos",
  "tipo": "desarrollo-cubos",
  "titulo": "Construcción Mental",
  "ejercicios": [
    {
      "pregunta": "¿Qué cubo se forma?",
      "plano_svg": "<svg>...plano desplegado...</svg>",
      "opciones_svg": [
        "<svg>...cubo A...</svg>",
        "<svg>...cubo B...</svg>",
        "<svg>...cubo C...</svg>"
      ],
      "respuesta": 1 // Índice de la opción correcta
    },
    {
      // ... siguiente ejercicio ...
    }
  ]
}
```

### D. Criptoaritmética (Descifrar valores)
Suma donde figuras ocultan números.

```json
{
  "id": "mision-cripto",
  "tipo": "criptoaritmetica",
  "titulo": "Suma de Frutas",
  "instruccion": "Descubre el valor de cada fruta.",
  "ejercicios": [
    {
      "operacion": {
        "linea1": "  🍎",
        "linea2": "+ 🍎",
        "resultado": "  8"
      },
      "solucion": [
        { "figura": "🍎", "valor": "4" }
      ],
      "explicacion_correcta": "¡4+4=8!"
    }
  ]
}
```

### E. Tablas de Doble Entrada (Lógica Sherlock)
Deducción basada en pistas.

```json
{
  "id": "mision-tabla",
  "tipo": "tabla-doble-entrada",
  "titulo": "Quién tiene qué",
  "pistas": [
    "A Ana no le gusta el rojo.",
    "Beto tiene el azul."
  ],
  "encabezados_fila": ["Ana", "Beto"],
  "encabezados_columna": ["Rojo", "Azul"],
  "respuesta_final": "Azul" // Valor que resuelve la pregunta final (implícita o explícita)
}
```

### F. Secuencias (Patrones)
Completar la serie.

```json
{
  "id": "mision-secuencia",
  "tipo": "secuencia",
  "titulo": "Sigue el patrón",
  "ejercicios": [
    {
      "elementos": ["1", "2", "3", "?"],
      "respuesta": "4",
      "pista": "Suma 1"
    },
    {
      "elementos": ["🔴", "🔵", "🔴", "?"],
      "opciones": ["🔴", "🔵"],
      "respuesta": "🔵"
    }
  ]
}
```

### G. Numberblocks Constructor (Multiplicación Visual)
Juego para entender la multiplicación como rectángulos ("arrays"). El toolbox muestra los bloques **del 1 al 15**.

```json
{
  "id": "mision-nb-rectangulos",
  "tipo": "numberblocks-constructor",
  "titulo": "Rectángulos Numberblocks",
  "retos": [
    {
      "tipo": "multiply",            // El niño elige 2 bloques
      "target": 12,                  // El resultado debe ser 12 (ej: 3 x 4)
      "historia": "¡Super Rectángulo quiere formar el número 12! ¿Qué dos bloques necesitamos?"
    },
    {
      "tipo": "divide",              // Se da un número, el niño elige el otro
      "target": 20,
      "dado": 5,                     // "Tengo un 5, ¿por qué multiplico para llegar a 20?"
      "historia": "Tengo un bloque de 5. ¿Con qué otro bloque hago 20?"
    }
  ]
}
```

**Bloques disponibles (1–15) y sus colores oficiales:**

| # | Color | # | Color |
|---|-------|---|-------|
| 1 | Rojo | 9 | Gris (3 tonos) |
| 2 | Naranja | 10 | Blanco (borde rojo) |
| 3 | Amarillo | 11 | Blanco + rojo (2 piernas) |
| 4 | Verde | 12 | Blanco + naranja (grid 3×4) |
| 5 | Azul | 13 | Blanco + amarillo (L invertida) |
| 6 | Morado | 14 | Blanco + verde lima (sombrero) |
| 7 | Arcoíris (7 colores) | 15 | Blanco + cian (escalera) |
| 8 | Rosa | | |

### H. Lienzo de Dibujo (Libre)
Misión creativa donde el niño dibuja libremente o siguiendo una instrucción.

```json
{
  "id": "mision-dibujo-1",
  "tipo": "lienzo-dibujo",
  "titulo": "Arte Matemático",
  "instruccion": "Dibuja 3 manzanas rojas",
  "colores": ["#e74c3c", "#2ecc71", "#f1c40f"], // Opcional: paleta personalizada
  "operacion_texto": "3 Manzanas"               // Texto grande de fondo (opcional)
}
```

### I. Kakooma (Cálculo Mental Visual)
Juego de encontrar dos números que sumen el número del centro (o objetivo).

```json
{
  "id": "kakooma-nivel-1",
  "tipo": "kakooma",
  "titulo": "Nivel 1: Sumas Básicas",
  "instruccion": "Toca dos burbujas que sumen el número objetivo.",
  "objetivo": 10,                 // El número que deben sumar
  "numeros": [2, 8, 5, 3, 1, 9]   // Los números burbuja (debe haber al menos un par correcto)
}
```

### J. Operaciones (Respuesta Numérica)
Juego de suma/resta/multiplicación/división donde el niño escribe el resultado.

```json
{
  "id": "mision-ope-1",
  "tipo": "operaciones",
  "titulo": "Desafío de Operaciones",
  "instruccion": "Resuelve cada operación y escribe el resultado.",
  "ejercicios": [
    { "pregunta": "12 + 9 =",  "respuesta": "21", "explicacion_correcta": "12 + 9 = 21" },
    { "pregunta": "35 - 17 =", "respuesta": "18", "explicacion_correcta": "35 - 17 = 18" },
    { "pregunta": "6 × 7 =",   "respuesta": "42", "explicacion_correcta": "6 × 7 = 42" },
    { "pregunta": "56 ÷ 8 =",  "respuesta": "7",  "explicacion_correcta": "56 ÷ 8 = 7" }
  ]
}
```

Notas:
- Usa `ejercicios` cuando quieras una lista de operaciones en una sola misión.
- `respuesta` es texto/numérico exacto; el componente compara como string.
- Puedes poner explicaciones generales en el nivel de misión (`explicacion_correcta` / `explicacion_incorrecta`) o específicas por ejercicio.
- `instruccion` es opcional, pero recomendable para dar contexto.

---

### K. Área Constructor (Medir, Calcular y Construir)
Juego de 3 fases pedagógicas para aprender área de rectángulos y cuadrados:
1. **Medir** — el niño selecciona del toolbox los Numberblocks que coincidan con el ancho y el alto del grid.
2. **Calcular** — escribe el resultado de la multiplicación (área).
3. **Construir** — selecciona los dos Numberblocks que al multiplicarse forman el área.

El toolbox de medición y construcción muestra bloques **del 1 al 15**, por lo que `filas` y `columnas` deben ser valores entre 1 y 15.

```json
{
  "id": "mision-area-1",
  "tipo": "area-constructor",
  "titulo": "Nombre de la misión",
  "instruccion": "Mide los lados, calcula el área y reconstruye la figura.",
  "retos": [
    {
      "target": 24,          // Debe ser exactamente filas × columnas
      "filas": 6,            // Alto del grid (1–15). El niño lo mide contando.
      "columnas": 4,         // Ancho del grid (1–15). El niño lo mide contando.
      "tipo": "area",
      "esSquare": false,     // true solo si filas === columnas (cuadrado perfecto)
      "historia": "Seis construye una piscina rectangular. ¿Cuántas losetas necesita para el piso?",
      "unidad": "losetas"    // Palabra que aparece en el mensaje de éxito
    },
    {
      "target": 25,
      "filas": 5,
      "columnas": 5,
      "tipo": "area",
      "esSquare": true,
      "historia": "¡Cinco quiere un cuadrado perfecto para su jardín secreto! ¿Cuántos cuadritos tiene?",
      "unidad": "cuadritos"
    }
  ]
}
```

**Nomenclatura para archivos nuevos:** `YYYY-MM-DD_area-[nivel]-[descripcion].json`

| Ejemplo de archivo | Ejemplo de `id` |
|---|---|
| `2026-03-05_area-basico-animales.json` | `"2026-03-05_area-basico-animales"` |
| `2026-03-06_area-maestro-estadios.json` | `"2026-03-06_area-maestro-estadios"` |

*Los archivos anteriores (`2026-03-01_area-basicos.json`, etc.) usan la convención antigua — no se renombran.*

**Niveles de dificultad sugeridos:**
| Nivel | Rango de dimensiones | Área máxima |
|-------|---------------------|-------------|
| Básico | 2–5 | ~20 |
| Intermedio | 4–8 | ~56 |
| Avanzado | 6–12 | ~108 |
| Maestro | 10–15 | ~120 |

---

## 4. Imágenes y SVG
Recomendamos usar código SVG directamente (`<svg>...</svg>`) en los campos `imagen` o `figura_svg` para asegurar que se vean nítidos en cualquier tamaño. Evita usar URLs externas (`http...`) si es posible, ya que pueden romperse.

## 5. Proceso de Carga
1.  Guarda tu JSON (ej: `2025-10-20_logica.json`).
2.  Ve al **Administrador > Migración**.
3.  Selecciona la colección:
    *   `Aventuras` (para juegos diarios).
    *   `Simulacros` (para exámenes largos).
4.  Sube el archivo.
5.  Si el documento ya existe (mismo `id`), se **sobreescribe** automáticamente — útil para corregir contenido ya subido.

---

## 6. Reglas Pedagógicas para Escribir Historias

Estas reglas aplican especialmente a los juegos donde el niño debe **descubrir** un valor (Área Constructor, Numberblocks Constructor). El objetivo es que el aprendizaje ocurra durante el juego, no antes.

### ❌ NO hagas esto — revelar la respuesta en la historia

```
"historia": "Seis y Ocho construyen un estacionamiento de 6 filas y 8 columnas. ¿Cuántas losetas?"
```
Si el niño lee "6 filas y 8 columnas", ya sabe que debe seleccionar los bloques 6 y 8 sin contar el grid.

### ✅ SÍ haz esto — describe la situación, no las dimensiones

```
"historia": "Seis y Ocho construyen un estacionamiento enorme. ¿Cuántas losetas necesitan para el piso?"
```
El niño observa el grid y **cuenta** los lados él mismo. Ahí está el aprendizaje.

### Guía rápida para historias en Área Constructor

| Elemento | ¿Incluir? | Ejemplo |
|----------|-----------|---------|
| Personajes Numberblocks | ✅ Sí | "Siete y Cuatro construyen..." |
| Contexto / escenario | ✅ Sí | "...un campo de fútbol" |
| Pregunta sobre el total | ✅ Sí | "¿Cuántas losetas necesitan?" |
| Unidades creativas | ✅ Sí | flores, butacas, casillas, losetas |
| Número exacto de filas | ❌ No | ~~"de 7 filas de alto"~~ |
| Número exacto de columnas | ❌ No | ~~"de 4 bloques de ancho"~~ |
| Ambas dimensiones explícitas | ❌ No | ~~"7 por 4"~~ |

**Excepción aceptable:** Mencionar el nombre del personaje (ej. "Trece") implica indirectamente el número 13, pero se considera contexto narrativo aceptable — el niño todavía debe contar el otro lado y realizar la multiplicación.

---

### L. Fraccion Explorer (Fracciones visuales)

Enseña fracciones con modelos visuales de pizza (circulo) y chocolate (barra). Dos tipos de retos:

- **identificar**: el niño ve una figura con partes coloreadas y dice qué fracción es (numerador + denominador)
- **construir**: el niño lee una fracción y colorea las partes correctas en la figura

**Carpeta de contenido:** `_contenido/fraccion-explorer/`
**Tipo en JSON raíz:** `"fraccion-explorer"`

```json
{
  "id": "YYYY-MM-DD_fraccion-nivel-descripcion",
  "titulo": "Titulo visible",
  "tipo": "fraccion-explorer",
  "nivel": "basico|intermedio|avanzado",
  "misiones": [
    {
      "id": "mision-fraccion-N",
      "tipo": "fraccion-explorer",
      "titulo": "Titulo de la mision",
      "instruccion": "Instruccion general",
      "retos": [
        {
          "tipo": "identificar",
          "forma": "circulo|barra",
          "partes": 4,
          "coloreadas": 3,
          "historia": "Historia con personajes Numberblocks",
          "explicacion": "Tres cuartos: 3 de 4 partes"
        },
        {
          "tipo": "construir",
          "forma": "circulo|barra",
          "partes": 3,
          "coloreadas": 2,
          "historia": "Historia pidiendo colorear 2/3",
          "explicacion": "Dos tercios de la pizza"
        }
      ]
    }
  ]
}
```

**Reglas pedagogicas para fracciones:**
- Empezar SIEMPRE con medios (1/2), luego tercios, luego cuartos
- Usar contextos de comida: pizza, chocolate, pastel
- Cada reto tiene una `explicacion` que conecta visual con numero
- `forma`: `"circulo"` para pizza, `"barra"` para chocolate
- `partes`: en cuantas partes iguales se divide (denominador)
- `coloreadas`: cuantas partes estan coloreadas (numerador)
- **⚠️ NUNCA mencionar colores específicos en las historias** (rojo, naranja, azul, morado, verde, gris). El componente usa colores fijos (amarillo para círculo, azul para barra) que no coinciden con los colores mencionados en el texto. Usar "coloreadas/coloreados" o simplemente describir la acción sin color (ej: "Tres se comió 3 rebanadas").

| Nivel | Denominadores | Formas |
|-------|--------------|--------|
| basico | 2, 3, 4 | circulo + barra |
| intermedio | 5, 6, 8 | circulo + barra |
| avanzado | 7, 9, 10, 12 | circulo + barra |

---

### M. Angulo Explorer (Clasificacion de angulos y triangulos)

Enseña tipos de angulos y la regla de que los angulos de un triangulo suman 180°. Dos tipos de retos:

- **identificar**: el niño ve un angulo con su medida en grados y lo clasifica como agudo, recto u obtuso
- **triangulo**: el niño ve un triangulo con 2 angulos conocidos y calcula el tercero (180° - a - b)

**Carpeta de contenido:** `_contenido/angulo-explorer/`
**Tipo en JSON raíz:** `"angulo-explorer"`

```json
{
  "id": "YYYY-MM-DD_angulo-nivel-descripcion",
  "titulo": "Titulo visible",
  "tipo": "angulo-explorer",
  "nivel": "basico|intermedio|avanzado",
  "misiones": [
    {
      "id": "mision-angulo-N",
      "tipo": "angulo-explorer",
      "titulo": "Titulo de la mision",
      "instruccion": "Instruccion general",
      "retos": [
        {
          "tipo": "identificar",
          "angulo": 45,
          "respuesta": "agudo",
          "historia": "Historia con contexto visual",
          "pista": "Pista opcional para si falla"
        },
        {
          "tipo": "triangulo",
          "angulos": [60, 60, null],
          "historia": "Historia mencionando la regla de 180"
        }
      ]
    }
  ]
}
```

**Reglas pedagogicas para angulos:**
- Empezar con angulo recto (90°) — el niño lo reconoce en esquinas de hojas, libros, mesas
- Luego agudo (< 90°) y obtuso (> 90°) — SIEMPRE comparar con 90°
- Los triangulos vienen DESPUES de que entienda los tipos de angulos
- La regla de 180° se muestra visualmente con barra, no solo como formula
- `respuesta` para identificar: `"agudo"`, `"recto"` u `"obtuso"`
- `angulos` para triangulo: array de 3 valores, el faltante es `null`

| Nivel | Contenido |
|-------|-----------|
| basico | Solo clasificar angulos (agudo/recto/obtuso) |
| intermedio | Clasificar + triangulos con angulos faciles (sumas a 180) |
| avanzado | Triangulos complejos, mezcla de tipos |

---

### N. Fraccion Operaciones (Aritmetica de fracciones)

Componente para sumar, restar, multiplicar y dividir fracciones, con flujos guiados por pasos. Tambien soporta problemas verbales.

**Carpeta de contenido:** `_contenido/fraccion-operaciones/`
**Tipo en JSON raiz:** `"fraccion-operaciones"`

```json
{
  "id": "YYYY-MM-DD_fraccion-op-nivel-descripcion",
  "titulo": "Titulo visible",
  "tipo": "fraccion-operaciones",
  "nivel": "basico|intermedio|avanzado|maestro",
  "misiones": [
    {
      "id": "mision-frac-op-N",
      "tipo": "fraccion-operaciones",
      "titulo": "Titulo de la mision",
      "instruccion": "Instruccion general",
      "retos": [
        {
          "tipo": "sumar",
          "fraccion1": [1, 4],
          "fraccion2": [2, 4],
          "resultado": [3, 4],
          "historia": "Historia con contexto",
          "explicacion": "Explicacion del resultado"
        },
        {
          "tipo": "verbal",
          "historia": "Problema de texto",
          "resultado": [2, 5],
          "explicacion": "Explicacion",
          "pista": "Pista opcional"
        }
      ]
    }
  ]
}
```

**Tipos de reto disponibles:**

| Tipo | Flujo | Descripcion |
|------|-------|-------------|
| `sumar` | Ver → (Denominador comun → Convertir →) Operar → Resultado | Suma de 2 fracciones |
| `restar` | Ver → (Denominador comun → Convertir →) Operar → Resultado | Resta de 2 fracciones |
| `multiplicar` | Ver → Numeradores → Denominadores → Resultado | num x num, den x den |
| `dividir` | Ver → Invertir → Multiplicar → Resultado | Invierte 2da y multiplica |
| `verbal` | Leer → Fraccion → Resultado | El nino escribe numerador y denominador |

**Notas:**
- `fraccion1` y `fraccion2`: arrays `[numerador, denominador]`
- `resultado`: array `[numerador, denominador]` con la respuesta correcta
- Para sumar/restar con mismo denominador, el flujo omite las fases de denominador comun
- Para verbal, no se usan `fraccion1`/`fraccion2`, solo `resultado`
- `pista` es opcional, se muestra despues de 2 intentos fallidos

**Niveles de dificultad:**

| Nivel | Operaciones | Denominadores |
|-------|------------|---------------|
| basico | Suma/resta con MISMO denominador | 2-6 |
| intermedio | Suma/resta con denominador DIFERENTE + verbal | 2-8 |
| avanzado | Multiplicacion + verbal | 2-10 |
| maestro | Division + verbal complejo | 2-12 |
