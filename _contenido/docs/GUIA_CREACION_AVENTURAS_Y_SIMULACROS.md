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
  "id": "YYYY-MM-DD_nombre-descriptivo",  // EJ: "2025-10-01_conteo-figuras"
  "tipo": "categoria-del-juego",          // ¡VITAL! Define en qué pestaña aparece.
  "titulo": "Título Visible en la App",
  "descripcion": "Descripción corta para la tarjeta.",
  "misiones": [                           // Array con las actividades
    // ... aquí van las misiones/preguntas ...
  ]
}
```

### 🏷️ Categorías (Campo `tipo`)
El campo `tipo` en la raíz controla dónde aparece el juego en la Bóveda:
*   `"conteo-figuras"` -> Categoría Conteo de Figuras
*   `"criptoaritmetica"` -> Categoría Criptoaritmética
*   `"secuencia"` -> Categoría Secuencias
*   `"tabla-doble-entrada"` -> Categoría Tablas Lógicas
*   `"operaciones"` -> Categoría Operaciones
*   `"aventura"` -> Categoría General (Mix de juegos)
*   `"simulacro"` -> Categoría Exámenes

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
