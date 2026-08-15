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
| **LF — Sonidos** | 3-6 | Oír rimas y contar sílabas. **Transversal, no secuencial** |
| **L0 — Vocales** | 3-5 | Reconocer, oír y trazar A E I O U (mayúscula y minúscula) |
| **L1 — Primeras consonantes** | 4-6 | m, p, s, l, t, n, d + sus sílabas (ma-me-mi-mo-mu) |
| **L2 — Palabras** | 5-7 | Leer y armar palabras de 2 sílabas |
| **L3 — Frases** | 6-8 | Leer y entender frases cortas |

**LF (conciencia fonológica) va aparte a propósito.** No es un paso del camino: es la
habilidad de oír que las palabras están hechas de pedacitos de sonido, y es **el predictor
más fuerte** de que un niño aprenda a leer bien. Se juega **sin saber ninguna letra**, así
que sirve desde antes de L0 y en paralelo a todo lo demás — también para el hermano de 2-3.
Por eso lleva prefijo `LF` y no un número.

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

**Se intentó** un campo `sonido` con el fonema escrito (`"sonido": "mmm"`) para forzar la
pronunciación. **No funciona y se quitó** (2026-08-09): el TTS lo deletrea — "mmm" se oye
*"M, M, M"*, que es peor que "eme". Mismo resultado con "sss" y "lll". No hay forma de
sacarle un fonema aislado a Web Speech.

**Solución adoptada:** la letra se dice siempre **ligada a su palabra clave**
("M de mamá"), y en `silabas` la consonante sola **no se pronuncia**: se VE en la
ecuación y lo que se OYE es la vocal y la sílaba ya formada (*"u… mu. mu de música"*).
La mezcla la hace el ojo junto con el oído. Es honesto y suena bien; lo otro sonaba a robot.

**Si algún día se quiere el fonema de verdad**, el único camino son audios grabados:
MP3 cortos en `public/letras/audio/` y un campo `audio_url` con prioridad sobre el TTS.
Es un `if` en el motor; no hay que rehacer nada. La voz de papá o mamá además funciona
mejor a esta edad.

### El tono de voz

`hablar()` no elegía voz, así que el navegador usaba la de por defecto (la robótica de
Windows). Ahora elige la mejor voz en español disponible — prefiere las de Google, que son
mucho más naturales, y luego las locales de México (Sabina, Dalia). Esto mejoró de paso
todos los juegos de Peques que usan `hablar()`.

Los dos números a mover si el tono no convence están en `VOZ_LETRAS` (`src/utils/sonido.js`):
`rate` (0.8 = pausado, para letras y sílabas sueltas) y `pitch` (1.15 = un poco más cálido).

### Reglas de autoría del contenido

1. **Todo el texto va con acentos correctos** — este módulo enseña a leer, así que lo que
   se muestra tiene que estar bien escrito. Y además `instruccion`, `palabra` y `voz` se
   **hablan**: sin acento el TTS pronuncia mal ("arbol" → *ar-BOL*, "silaba" → *si-LA-ba*).
   Aquí NO aplica la costumbre del resto del repo de escribir sin acentos.
2. **El emoji nunca decide la palabra** — la palabra va explícita en el JSON. 🍎 puede
   ser "manzana" o "fruta"; el motor dice lo que dice el campo `palabra`.
3. Elegir emojis cuyo nombre en español empiece de verdad con la letra que se enseña.
4. Máximo **6-8 retos** por actividad. Sesiones cortas por diseño; sin cronómetro,
   sin puntaje, sin "perdiste".
5. **Correr `node _letras/_valida.js` antes de subir nada**, y `node _letras/_lotes.js`
   para regenerar los lotes. El validador comprueba lo que los motores dan por hecho y es
   fácil de romper a mano: que la `respuesta` esté entre las `opciones`, que la palabra
   clave de verdad empiece con su letra o sílaba (ignorando acentos), que cada sílaba sea
   consonante + vocal, que los SVG existan, que no haya ids duplicados, que el silabeo
   forme la palabra y cuadre con el número de pedacitos, que las piezas de
   `arma-la-palabra` formen la palabra y ningún distractor sea también una pieza, y —lo
   más fácil de equivocar— **que las rimas rimen de verdad y que ningún distractor rime
   también**, porque eso daría dos respuestas correctas.
6. **Los SVG de trazo se revisan renderizados, nunca leyendo el código.** En L0 el código
   parecía correcto y la `e` salía casi cerrada (parecía una `o` con raya) y el puntito de
   la `i`, un anillo roto. Basta con `chrome --headless --screenshot` sobre un HTML que
   los muestre juntos.

---

## Motores

### Implementados

| Tipo | Componente | Qué hace |
|------|-----------|----------|
| `abecedario` | `tipos/Abecedario.jsx` | Teclado sonoro: toca una letra y la oyes con su palabra clave. Exploración pura, sin respuestas correctas. |
| `letra-quiz` | `tipos/LetraQuiz.jsx` | Estímulo + 3 opciones. Tres modos (abajo). |
| `silabas` | `tipos/Silabas.jsx` | "m + a = ma": toca una vocal y se arma la sílaba. Exploración, sin puntaje. |
| `rimas` | `tipos/Rimas.jsx` | "¿cuál rima con sol?" → caracol. Opciones con dibujo + palabra; todo de oído. |
| `arma-la-palabra` | `tipos/ArmaLaPalabra.jsx` | Tocar piezas en orden para construir una palabra. |
| `colorear` | `tipos/Colorear.jsx` (reusado) | Trazar la letra sobre una guía punteada. Sin código nuevo. |

`letra-quiz` **no distingue entre letras y sílabas**: sus tres modos funcionan igual con
`respuesta: "A"` que con `respuesta: "ma"`. Por eso L1 no necesitó motores de quiz nuevos —
solo contenido. El único motor nuevo de L1 fue `silabas`, porque **ver** cómo se combinan
la consonante y la vocal es justo lo que el método silábico enseña y ningún otro motor lo hacía.

`letra-quiz` es **un solo motor con campo `modo`** — los tres retos comparten mecánica,
como ya pasa con Contar/Formas/Tamaños/MásMenos:

| `modo` | Se ve | Se oye | Opciones |
|--------|-------|--------|----------|
| `primera-letra` | dibujo + palabra | "manzana. ¿Con qué empieza?" | letras o sílabas |
| `reconoce-letra` | nada (juego de oído) | "Toca la M" | letras o sílabas |
| `mayus-minus` | la mayúscula grande | "¿Cuál es la m chiquita?" | minúsculas |
| `cuenta-silabas` | dibujo + palabra | "ma, ri, po, sa. ¿Cuántos pedacitos?" | números |
| `lee-palabra` | **la palabra escrita** | "¿Qué dice aquí?" — *nunca la palabra* | dibujos |

En `lee-palabra` la consigna **no dice la palabra**: si la dijera, la niña no estaría
leyendo, estaría oyendo. Solo se pronuncia al acertar. El `silabeo` que se muestra debajo
("ma-pa") es el andamio para leer por golpes.

En `cuenta-silabas` la palabra se muestra **sin guiones**: los golpes se cuentan con el
oído, no con los ojos.

### "Arma tu nombre" sale gratis

`arma-la-palabra` no distingue entre sílabas y letras — son piezas. Por eso *armar tu
nombre* no necesita motor propio: `"usar_nombre_perfil": true` y las piezas se generan de
`activeProfile.nombre` en tiempo de ejecución. A los 4 años la propia palabra es la más
motivadora que existe, y el perfil ya traía el nombre.

### Pendientes (L3 en adelante)

| Tipo | Qué hace | Nivel |
|------|----------|-------|
| `lee-frase` | leer una frase corta y elegir la escena | L3 |
| `dictado` | oír una palabra y escribirla con un teclado de letras grandes | L3 |

Escribir al dictado va **después** de leer con soltura, no antes.

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
  usa `_letras/_lote-letras-L0.json` (o `-L1`) y subes todo el nivel de un clic. Los lotes
  se regeneran juntando los `Lx-*.json` del nivel; el `id` del JSON es el id del documento,
  así que volver a subir algo solo lo sobrescribe (no duplica).
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

L0 probado con la niña y aprobado, sin ajustes.

**Fase 2 (L1) — HECHO (2026-08-09)**

- Motor `silabas` + registro en `MisionRenderer`, `LetrasHub`, Dashboard y Bóveda.
- 4 SVG de trazo (M, P, S, L), verificados renderizados.
- Contenido L1: 5 actividades / 11 misiones (`L1-01` … `L1-05`) + lote.
- `_valida.js`: validador del contenido contra lo que esperan los motores.

**Ajustes tras probarlo (mismo día)**

- **Se quitó el campo `sonido`.** El TTS deletreaba "mmm" como *"M, M, M"*. Ver
  "El problema del fonema" arriba: no hay truco de escritura que funcione.
- **`hablar()` ahora elige voz** (prefiere las de Google, luego Sabina/Dalia de es-MX) y
  acepta `rate`/`pitch`. Antes no elegía ninguna y sonaba la robótica de Windows.
  Mejora todos los juegos de Peques, no solo Letras.
- **`abecedario` y `silabas` leen la instrucción al entrar** y tienen botón 🔊 para
  repetir, como el resto de los juegos de peques. Se les había olvidado.
- **Todo el texto se acentuó.** Al pasar a hablarse la `instruccion`, los acentos dejaron
  de ser cosmética: "silaba" se oía *si-LA-ba*.

**Fase 3 (LF + L2) — HECHO (2026-08-15)**

- Motores `rimas` y `arma-la-palabra`; modos `cuenta-silabas` y `lee-palabra` en `letra-quiz`.
- `LF-01` rimas, `LF-02` pedacitos (conciencia fonológica).
- `L1-06` mayúscula/minúscula de M, P, S, L (solo contenido, cero código).
- `L2-01` ¡Ya leo!, `L2-02` arma la palabra, `L2-03` mi nombre.
- `_lotes.js` para regenerar los lotes; `_valida.js` ampliado (ver abajo).

**Decisión: NO se agregaron más consonantes todavía.** Es la tentación obvia y el error
clásico — acumular letras en vez de usarlas. Con vocales + m, p, s, l ya salen ~20 palabras
reales (sol, sopa, mesa, sapo, mapa, lupa, oso, mamá, papá, pila, pala, masa, paso, piso…),
que es justo lo que L2 explota. **t, n, d, r, c entran cuando lea esas con soltura**, y
entonces es contenido puro, cero motores.

**Siguiente**

1. Probar LF y L2 con la niña. Las preguntas: ¿oye las rimas? ¿lee "sol" sin ayuda?
2. Si L2 fluye → resto de consonantes frecuentes (t, n, d, r, c), solo contenido.
3. Si no fluye → más palabras con las mismas 4 consonantes antes de avanzar.

**Después**

- Números: el mismo `letra-quiz` con numerales (ver "5" → elegir entre 3), y
  `traza-numero` con SVG punteados en el mismo formato. Es reusar, no construir.
- Opcional: `audio_url` con voz grabada en casa.
- Opcional: progreso invisible para el niño (qué letras ya domina) solo para no repetir
  siempre las mismas. Nunca puntaje visible.
