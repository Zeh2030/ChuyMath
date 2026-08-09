# Programa "Letras" — De conocer las letras a leer

Módulo de lectura para pre-lectores (empieza la hija, ~4 años). Todo se oye, nada se
tiene que leer para poder jugar: la app dice la consigna en voz alta y el niño toca.

---

## Por qué existe

La matemática de olimpiada del módulo normal es inalcanzable a los 4 años, y los
**números** ya están cubiertos por [Modo Peques](../_peques/PROGRAMA_PEQUES.md)
(contar, más/menos, qué sigue, grande/pequeño). El hueco real era **letras y lectura**:
antes de este módulo no existía nada.

Es el primer módulo pensado para que el objetivo final sea **leer**, no solo reconocer.

---

## A quién sirve (niveles)

| Nivel | Edad | Meta |
|-------|------|------|
| **L0 — Vocales** | 3-5 | Reconocer, oír y trazar A E I O U (mayúscula y minúscula) |
| **L1 — Primeras consonantes** | 4-6 | m, p, s, l, t, n, d + sus sílabas (ma-me-mi-mo-mu) |
| **L2 — Palabras** | 5-7 | Resto del abecedario + leer palabras de 2 sílabas |
| **L3 — Frases** | 6-8 | Leer y entender frases cortas |

Se produce por lotes, igual que ciencias: se termina y se prueba un nivel antes de
escribir el siguiente. **No escribir las 27 letras de golpe.**

---

## Pedagogía

**Método silábico** (el tradicional en México): vocales → consonante + vocal → sílaba →
palabra. Por eso L1 no enseña "la eme" suelta, sino **ma-me-mi-mo-mu**.

**Orden de las consonantes** (por utilidad para formar palabras, no alfabético):
`m, p, s, l, t, n, d` → luego `r, c, b, v, f, g, j, ñ, ll, ch, qu, z, h, y, x, k, w`.

### El problema del fonema (decisión importante)

La voz de la app es **Web Speech (TTS) en es-MX**, vía `hablar()` de
`src/utils/sonido.js`. Es gratis, offline y no necesita grabar nada — pero **lee una
consonante suelta por su NOMBRE**: `hablar('M')` dice *"eme"*, no */mmm/*.

Con las **vocales no hay problema** (el nombre ES el sonido). Con las consonantes sí,
y el método silábico necesita el sonido.

**Solución adoptada:** enseñar siempre la letra **ligada a una palabra clave**
("M... M de mamá") y usar el campo opcional **`sonido`** para forzar lo que se
pronuncia cuando el nombre no sirve:

```json
{ "mayus": "M", "minus": "m", "palabra": "mamá", "emoji": "👩", "sonido": "mmm" }
```

**Mejora futura (opcional):** grabar audios cortos propios en `public/letras/audio/` y
añadir un campo `audio_url` que tenga prioridad sobre el TTS. La voz de papá o mamá
funciona mejor a esta edad. No hace falta rehacer nada: es un `if` en el motor.

### Reglas de autoría del contenido

1. **Los campos que se HABLAN llevan acento** (`palabra`, `sonido`, `voz`), aunque el
   resto del repo escriba los títulos sin acentos: sin acento el TTS pronuncia mal
   ("arbol" → *ar-BOL*). Los `titulo` y `descripcion` siguen la convención del repo.
2. **El emoji nunca decide la palabra** — la palabra va explícita en el JSON. 🍎 puede
   ser "manzana" o "fruta"; el motor dice lo que dice el campo `palabra`.
3. Elegir emojis cuyo nombre en español empiece de verdad con la letra que se enseña.
4. Máximo **6-8 retos** por actividad. Sesiones cortas por diseño; sin cronómetro,
   sin puntaje, sin "perdiste".

---

## Motores

### Implementados

| Tipo | Componente | Qué hace |
|------|-----------|----------|
| `abecedario` | `tipos/Abecedario.jsx` | Teclado sonoro: toca una letra y la oyes con su palabra clave. Exploración pura, sin respuestas correctas. |
| `letra-quiz` | `tipos/LetraQuiz.jsx` | Estímulo + 3 opciones. Tres modos (abajo). |
| `colorear` | `tipos/Colorear.jsx` (reusado) | Trazar la letra sobre una guía punteada. Sin código nuevo. |

`letra-quiz` es **un solo motor con campo `modo`** — los tres retos comparten mecánica,
como ya pasa con Contar/Formas/Tamaños/MásMenos:

| `modo` | Se ve | Se oye | Opciones |
|--------|-------|--------|----------|
| `primera-letra` | dibujo + palabra | "manzana. ¿Con qué empieza?" | letras |
| `reconoce-letra` | nada (juego de oído) | "Toca la M" | letras |
| `mayus-minus` | la mayúscula grande | "¿Cuál es la m chiquita?" | minúsculas |

### Pendientes (L1 en adelante)

| Tipo | Qué hace | Nivel |
|------|----------|-------|
| `silabas` | ma-me-mi-mo-mu: toca la sílaba que oyes | L1 |
| `arma-la-palabra` | ordenar 2-3 sílabas para formar una palabra | L2 |
| `lee-y-elige` | se lee una palabra → elegir entre 3 dibujos | L2 |

Nota: `memoria` (ya existe, de Peques) sirve tal cual para parejas A↔a si algún día
se quiere otra variante de `mayus-minus`.

---

## Trazo de letras (reusa `colorear`)

No hay motor nuevo. Una hoja de trazo es una misión `colorear` con un SVG de contorno,
exactamente como los trazos de pre-escritura del módulo de Arte
(`_dibujo/colorear/D0-01..D0-05`, que son la rampa natural ANTES de trazar letras).

Convención del SVG (`public/letras/trazos/`, 800×800):

- Renglón de fondo: líneas gris claro en y=200 (superior), y=400 (media, punteada) y
  y=600 (base). Las mayúsculas van de 200 a 600; las minúsculas redondas, de 400 a 600.
- Letra punteada: `stroke="#5a9bd5"`, `stroke-width="14"`, `stroke-dasharray="20 26"`.
- **Punto verde** al inicio de cada trazo, **punto rojo** al final, **flecha** azul a
  media línea indicando la dirección. Los verdes se pintan al final para quedar encima.
- Mayúscula a la izquierda, minúscula a la derecha, en la misma hoja.

El motor `colorear` pinta por debajo del contorno (`mix-blend-mode: multiply`), así que
la guía nunca se borra por más que el niño pinte encima.

---

## Modelo de datos

- **Colección Firestore: `letras`** + carpeta `_letras/` (mismo patrón que
  ciencias / dibujo / geografía).
- Estructura de documento idéntica a una aventura: `misiones: [...]`.
- Se sube con **Admin → Migración → 📖 Letras**. Acepta un **array** para carga en lote:
  usa `_letras/_lote-letras-L0.json` y subes todo el nivel de un clic.
- Requiere desplegar `firestore.rules` (ya incluye `letras`, lectura autenticada).
  **Sin desplegar, el respaldo nativo offline funciona igual** (ver abajo).

Ejemplo (`abecedario`):

```json
{
  "id": "L0-01_conoce-las-vocales",
  "titulo": "Conoce las vocales",
  "tipo": "abecedario",
  "materia": "letras",
  "nivel": "L0-01",
  "tema": "vocales",
  "misiones": [
    {
      "id": "let-abc-vocales",
      "tipo": "abecedario",
      "titulo": "Las cinco vocales",
      "emoji": "🔤",
      "instruccion": "Toca una letra para escucharla.",
      "letras": [
        { "mayus": "A", "minus": "a", "palabra": "árbol", "emoji": "🌳" }
      ]
    }
  ]
}
```

Ejemplo (`letra-quiz`, modo `primera-letra`):

```json
{
  "id": "let-primera-letra-vocales",
  "tipo": "letra-quiz",
  "modo": "primera-letra",
  "retos": [
    { "emoji": "🌳", "palabra": "árbol", "respuesta": "A", "opciones": ["A", "E", "O"] }
  ]
}
```

---

## Doble acceso (igual que Arte)

1. **Modo Peques** → tile 📖 Letras (`pages/LetrasHub.jsx`). Tres niveles:
   subsecciones → actividades → juego. Jala la colección `letras`, así que lo que
   escribas aparece en los dos lados sin duplicar contenido.
2. **Flujo normal** → materia 📖 Letras en el toggle del Dashboard y la Bóveda,
   que abre `/aventura/:id` como cualquier otra actividad.

Dos detalles del hub que difieren de `DibujarHub`, a propósito:

- **Aplana las misiones**: cada misión es su propia tarjeta. Los 5 trazos de vocales son
  5 tarjetas, no un wizard de 5 pasos (mucho pedir a los 4 años).
- **Las nativas son respaldo puro**, no se mezclan con las dinámicas: si se mezclaran,
  cada vocal aparecería duplicada al subir el lote.

> ⚠️ El tile de Letras va **hardcoded** en `Peques.jsx`, no sale de la colección
> `peques`. En ese lanzador, cualquier `mision.tipo` que no esté en el mapa `TIPO_GRUPO`
> cae en un grupo inexistente y la tarjeta desaparece.

---

## Estado

**Fase 0 + 1 — HECHO (2026-08-09)**

- Motores `abecedario` y `letra-quiz` (3 modos) + registro en `MisionRenderer`.
- `LetrasHub.jsx` + tile 📖 en Modo Peques + materia en Dashboard/Bóveda.
- Colección `letras`: reglas de Firestore, migrador (📖 Letras) y carga en `Aventura`.
- 5 SVG de trazo de vocales en `public/letras/trazos/`.
- Contenido L0: 5 actividades / 9 misiones (`L0-01` … `L0-05`) + lote.
- Respaldo offline: los motores traen las vocales por defecto, así que el hub funciona
  sin internet y aunque no se haya subido nada a Firestore.

**Siguiente (L1)**

1. Probar L0 con la niña y ajustar (velocidad de la voz, tamaño de los botones).
2. Motor `silabas`.
3. Contenido L1 de m, p, s, l — con el campo `sonido` para el fonema.
4. SVG de trazo de esas consonantes.

**Después**

- Números: el mismo `letra-quiz` con numerales (ver "5" → elegir entre 3), y
  `traza-numero` con SVG punteados en el mismo formato. Es reusar, no construir.
- Opcional: `audio_url` con voz grabada en casa.
- Opcional: progreso invisible para el niño (qué letras ya domina) solo para no repetir
  siempre las mismas. Nunca puntaje visible.
