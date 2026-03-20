# Guía para Crear Contenido de Inglés

Guía técnica con plantillas JSON para los 9 tipos de juego de inglés en ChuyMath.

## Campos comunes (raíz del JSON)

```json
{
  "id": "A1-09_word-bank_present-simple-affirmative",
  "titulo": "Título visible en la app",
  "descripcion": "Descripción corta para la tarjeta",
  "tipo": "word-bank",
  "materia": "ingles",
  "tema": "present-simple-affirmative",
  "nivel": "A1-09",
  "misiones": [...]
}
```

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `id` | Sí | Debe coincidir con nombre del archivo (sin .json) |
| `titulo` | Sí | Título en la app |
| `descripcion` | Sí | Texto de la tarjeta en Bóveda |
| `tipo` | Sí | Tipo de juego (ver tabla abajo) |
| `materia` | Sí | Siempre `"ingles"` |
| `tema` | Sí | Código del tema (ej: `"present-simple-affirmative"`) |
| `nivel` | Sí | Código del nivel (ej: `"A1-09"`) |
| `misiones` | Sí | Array con una o más misiones |

### Nomenclatura de archivos

```
{nivel}_{tipo-juego}_{tema-corto}.json

Ejemplos:
  A1-09_word-bank_present-simple-affirmative.json
  A1-10_fill-the-gap_present-simple-negative-questions.json
  A0-02_image-picker_colors.json
```

### Carpeta de destino

Todos los JSONs de inglés van en `_content/{tipo-juego}/`

```
_content/
├── word-bank/
├── verb-conjugator/
├── true-or-false/
├── fill-the-gap/
├── tap-the-pairs/
├── sentence-transform/
├── image-picker/
├── word-scramble/
├── listen-and-type/
└── docs/
```

### Colección Firebase

Todos se suben como **Aventuras** en el migrador (estructura misiones > retos).

---

## 1. Word Bank (Construir oraciones)

El niño toca palabras desordenadas para armar una oración en inglés.

```json
{
  "tipo": "word-bank",
  "materia": "ingles",
  "tema": "present-simple-affirmative",
  "nivel": "A1-09",
  "misiones": [{
    "id": "mision-wb-1",
    "tipo": "word-bank",
    "titulo": "Build the Sentence!",
    "instruccion": "Tap words in order to build the English sentence.",
    "retos": [{
      "oracion_es": "Ella come sandía en el parque",
      "palabras": ["She", "eats", "watermelon", "in", "the", "park"],
      "respuesta": ["She", "eats", "watermelon", "in", "the", "park"],
      "palabras_extra": ["eat", "a"],
      "explicacion": "She eats (tercera persona: he/she/it lleva -s)"
    }]
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `oracion_es` | string | Oración en español (objetivo a traducir) |
| `palabras` | string[] | Palabras correctas de la oración |
| `respuesta` | string[] | Orden correcto (debe coincidir con `palabras`) |
| `palabras_extra` | string[] | Palabras distractoras (opcional) |
| `explicacion` | string | Se muestra al acertar |

---

## 2. Verb Conjugator (Conjugar verbos)

El niño elige la conjugación correcta del verbo para el pronombre dado.

```json
{
  "tipo": "verb-conjugator",
  "retos": [{
    "pronombre": "He",
    "verbo_base": "play",
    "opciones": ["play", "plays", "playes"],
    "respuesta": 1,
    "oracion_completa": "He plays soccer every day",
    "traduccion": "Él juega fútbol todos los días",
    "regla": "Con He/She/It se agrega -s al verbo"
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pronombre` | string | He, She, It, I, You, We, They |
| `verbo_base` | string | Forma base del verbo |
| `opciones` | string[] | 2-4 opciones de conjugación |
| `respuesta` | number | Índice (0-based) de la opción correcta |
| `oracion_completa` | string | Oración completa que se muestra al acertar |
| `traduccion` | string | Traducción al español |
| `regla` | string | Regla gramatical (se muestra al acertar) |

---

## 3. True or False (Evaluar oraciones)

El niño decide si una oración en inglés es gramaticalmente correcta.

```json
{
  "tipo": "true-or-false",
  "retos": [{
    "oracion": "She play basketball on Saturdays",
    "traduccion": "Ella juega basketball los sábados",
    "correcto": false,
    "correccion": "She plays basketball on Saturdays",
    "explicacion": "Con She se usa plays, no play"
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `oracion` | string | Oración en inglés (puede tener error o no) |
| `traduccion` | string | Traducción al español |
| `correcto` | boolean | `true` si la oración es correcta, `false` si tiene error |
| `correccion` | string/null | Versión corregida (solo si `correcto: false`) |
| `explicacion` | string | Explicación gramatical |

---

## 4. Fill the Gap (Completar huecos)

El niño elige la palabra correcta para completar una oración.

```json
{
  "tipo": "fill-the-gap",
  "retos": [{
    "oracion": "___ you play soccer?",
    "traduccion": "¿Juegas fútbol?",
    "opciones": ["Do", "Does", "Don't", "Doesn't"],
    "respuesta": 0,
    "explicacion": "Do you play? Con You se usa Do para preguntar"
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `oracion` | string | Oración con `___` donde va el hueco |
| `traduccion` | string | Traducción (opcional) |
| `opciones` | string[] | 2-4 opciones |
| `respuesta` | number | Índice de la opción correcta |
| `explicacion` | string | Se muestra al acertar |

---

## 5. Tap the Pairs (Emparejar)

El niño conecta oraciones/palabras en español con su equivalente en inglés.

```json
{
  "tipo": "tap-the-pairs",
  "retos": [{
    "pares": [
      { "es": "Yo juego", "en": "I play" },
      { "es": "Él juega", "en": "He plays" },
      { "es": "Ella juega", "en": "She plays" },
      { "es": "Nosotros jugamos", "en": "We play" },
      { "es": "Ellos juegan", "en": "They play" }
    ]
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `pares` | array | Array de objetos `{es, en}` |
| `pares[].es` | string | Texto en español (columna izquierda) |
| `pares[].en` | string | Texto en inglés (columna derecha, se shufflea) |

**Nota:** Recomendado 4-6 pares por reto. La columna derecha se desordena automáticamente.

---

## 6. Sentence Transform (Transformar oraciones)

El niño cambia una oración de afirmativo a negativo o interrogativo usando word bank.

```json
{
  "tipo": "sentence-transform",
  "retos": [{
    "modo": "negativo",
    "oracion_original": "She plays basketball",
    "traduccion": "Ella juega basketball",
    "palabras": ["She", "doesn't", "play", "basketball"],
    "respuesta": ["She", "doesn't", "play", "basketball"],
    "palabras_extra": ["don't", "plays"],
    "explicacion": "Con She: doesn't + verbo base (sin -s)"
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `modo` | string | `"negativo"`, `"interrogativo"`, o `"afirmativo"` |
| `oracion_original` | string | Oración original que debe transformar |
| `traduccion` | string | Traducción de la original |
| `palabras` | string[] | Palabras correctas de la respuesta |
| `respuesta` | string[] | Orden correcto |
| `palabras_extra` | string[] | Distractores |
| `explicacion` | string | Regla gramatical |

---

## 7. Image Picker (Vocabulario visual)

El niño ve una palabra en inglés y elige el emoji/imagen que la representa.

```json
{
  "tipo": "image-picker",
  "retos": [{
    "palabra_en": "play",
    "palabra_es": "jugar",
    "opciones": [
      { "emoji": "⚽", "label": "play" },
      { "emoji": "📖", "label": "read" },
      { "emoji": "🍽️", "label": "eat" },
      { "emoji": "😴", "label": "sleep" }
    ],
    "respuesta": 0,
    "explicacion": "Play = jugar. I play soccer every day."
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `palabra_en` | string | Palabra en inglés (se muestra grande) |
| `palabra_es` | string | Traducción como pista (opcional) |
| `opciones` | array | Array de `{emoji, label}` |
| `respuesta` | number | Índice de la opción correcta |
| `explicacion` | string | Se muestra al acertar |

**Nota:** El componente incluye botón 🔊 que usa Web Speech API para pronunciar `palabra_en`.

---

## 8. Word Scramble (Desordenar letras)

El niño ordena letras desordenadas para formar la palabra correcta.

```json
{
  "tipo": "word-scramble",
  "retos": [{
    "respuesta": "plays",
    "letras_desordenadas": "lsayp",
    "pista_es": "Él juega (he ___)",
    "pista_emoji": "⚽",
    "explicacion": "PLAYS - He plays soccer. Con he/she/it agregamos -s"
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `respuesta` | string | Palabra correcta |
| `letras_desordenadas` | string | Letras mezcladas (si se omite, se mezclan automáticamente) |
| `pista_es` | string | Pista en español |
| `pista_emoji` | string | Emoji como pista visual (opcional) |
| `explicacion` | string | Se muestra al acertar |

**Nota:** Incluye botón 🔊 que pronuncia `respuesta` via Web Speech API.

---

## 9. Listen and Type (Dictado)

El niño escucha una oración en inglés (Web Speech API) y la escribe.

```json
{
  "tipo": "listen-and-type",
  "retos": [{
    "texto_en": "She eats watermelon",
    "traduccion": "Ella come sandía",
    "pista": "She ___ watermelon (3 words)",
    "explicacion": "She eats - tercera persona con -s"
  }]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `texto_en` | string | Oración en inglés (se pronuncia via TTS) |
| `traduccion` | string | Traducción como contexto (opcional) |
| `pista` | string | Pista que se muestra después de 2 intentos fallidos |
| `explicacion` | string | Se muestra al acertar |

**Comportamiento:**
- Auto-play al cargar cada reto
- Botón 🔊 Play (velocidad normal) y 🐢 Slow (velocidad lenta)
- Comparación ignora puntuación y mayúsculas/minúsculas
- Pista aparece automáticamente después de 2 errores

---

## Reglas generales para crear contenido de inglés

1. **Explicaciones en español** — el niño habla español, las explicaciones deben ser en español
2. **Reglas gramaticales** — siempre incluir la regla (campo `regla` o `explicacion`)
3. **Progresión** — dentro de una misión, empezar fácil e ir subiendo
4. **Distractores** — en word-bank y sentence-transform, incluir la forma incorrecta como distractor (ej: "plays" como extra cuando la respuesta es "play")
5. **6-8 retos por misión** — suficiente para practicar sin cansar
6. **Emojis relevantes** — en image-picker usar emojis claros y universales
7. **Oraciones del temario** — basarse en las oraciones y temas que el niño ve en clase

## Proceso de carga

1. Crear JSON en `_content/{tipo-juego}/`
2. Ir a Admin > Migración
3. Seleccionar **Aventuras** (estructura misiones > retos)
4. Subir JSON
5. Si el ID ya existe, se sobreescribe
