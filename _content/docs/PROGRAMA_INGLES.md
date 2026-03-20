# Programa de Inglés ChuyMath

## Sistema de Niveles (CEFR + Cambridge YLE)

| Código | Nombre | Cambridge | Edad típica | Estado |
|--------|--------|-----------|-------------|--------|
| **A0** | Pre-Starter | Pre-A1 | 6-7 años | Pendiente (repaso rápido) |
| **A1-1** | Starter | Pre-A1 Starters | 7-8 años | **EN PROGRESO** |
| **A1-2** | Elementary | A1 Movers | 8-9 años | Pendiente |
| **A2** | Pre-Intermediate | A2 Flyers | 9-11 años | Pendiente (pesquisa futura) |
| **B1** | Intermediate | KET | 11+ años | Pendiente (pesquisa futura) |

## Nomenclatura de contenido

```
{nivel}-{número}_{tipo-juego}_{tema-corto}.json

Ejemplo: A1-09_word-bank_present-simple-affirmative.json
```

### Campos del JSON
- `tipo`: tipo de juego (word-bank, verb-conjugator, etc.)
- `materia`: "ingles"
- `tema`: código del tema (ej: "present-simple-affirmative")
- `nivel`: código del nivel (ej: "A1-09")

## 9 Tipos de juego disponibles

| # | Tipo | Habilidad principal |
|---|------|---------------------|
| 1 | word-bank | Construcción de oraciones |
| 2 | verb-conjugator | Conjugación de verbos |
| 3 | true-or-false | Detección de errores gramaticales |
| 4 | fill-the-gap | Completar huecos (auxiliares, preposiciones) |
| 5 | tap-the-pairs | Asociación español↔inglés |
| 6 | sentence-transform | Afirmativo→negativo→pregunta |
| 7 | image-picker | Vocabulario visual + pronunciación |
| 8 | word-scramble | Spelling + conjugación |
| 9 | listen-and-type | Comprensión auditiva + escritura |

### Pendientes de implementar
| # | Tipo | Descripción |
|---|------|-------------|
| 10 | expedicion-ingles | Multi-misión temática combinando varios tipos |
| 11 | mini-story | Historia corta + comprensión lectora |

---

## Nivel A0: Pre-Starter (8 unidades)

Primeras palabras, saludos, vocabulario visual. Para niños que empiezan de cero.

| # | Tema | Vocabulario clave | Gramática |
|---|------|-------------------|-----------|
| A0-01 | Greetings & Names | hello, hi, bye, my name is, what's your name | I am, you are |
| A0-02 | Colors | red, blue, green, yellow, orange, purple, black, white, pink, brown | It is + color. What color is it? |
| A0-03 | Numbers 1-20 | one, two, three... twenty | How many? There are... |
| A0-04 | Classroom Objects | pencil, book, ruler, eraser, bag, desk, chair, board | This is a/an... What is this? |
| A0-05 | Shapes | circle, square, triangle, rectangle, star | It is a + shape. a big/small circle |
| A0-06 | Family | mom, dad, brother, sister, grandma, grandpa, baby | This is my... He/She is my... |
| A0-07 | Feelings & Emotions | happy, sad, angry, tired, hungry, thirsty, scared | I am happy. Are you sad? |
| A0-08 | Body Parts | head, eyes, ears, nose, mouth, hands, feet, arms, legs | I have... He/She has... Touch your... |

---

## Nivel A1-1: Starter (32 unidades)

### Bloque 2: Mi mundo (A1-01 a A1-08)

| # | Tema | Vocabulario clave | Gramática |
|---|------|-------------------|-----------|
| A1-01 | Animals | cat, dog, bird, fish, horse, cow, monkey, elephant, snake, frog | I like + animals. It can + verb |
| A1-02 | Food & Drinks | apple, banana, bread, milk, water, juice, pizza, rice, egg, chicken | I like / I don't like. Do you like...? |
| A1-03 | Clothes | shirt, pants, shoes, hat, dress, socks, jacket, skirt | I am wearing... He/She is wearing... |
| A1-04 | Days of the Week | Monday-Sunday, today, tomorrow, yesterday | On Monday I... What day is it? |
| A1-05 | Weather & Seasons | sunny, rainy, cloudy, windy, hot, cold, spring, summer, fall, winter | It is sunny. What's the weather like? |
| A1-06 | My House | bedroom, kitchen, bathroom, living room, door, window, bed, table | There is / There are. Where is the...? |
| A1-07 | Toys & Playtime | ball, doll, car, game, bike, kite, robot, teddy bear | I have a... Can I play with...? |
| A1-08 | Action Verbs | run, jump, swim, fly, read, write, draw, sing, dance, eat, drink, play | I can + verb. He/She can... Can you...? |

### Bloque 3: Present Simple (A1-09 a A1-16) ← POSICIÓN ACTUAL DEL ALUMNO

| # | Tema | Vocabulario clave | Gramática | Contenido creado |
|---|------|-------------------|-----------|------------------|
| **A1-09** | Present Simple: Affirmative | play, eat, drink, study, go, watch | I play / He plays. -s/-es/-ies rules | ✅ 9 juegos |
| **A1-10** | Present Simple: Negative | don't, doesn't | I don't play / She doesn't play | ✅ parcial (fill-the-gap, sentence-transform) |
| **A1-11** | Present Simple: Questions | do, does | Do you play? Does she play? | ✅ parcial (fill-the-gap, sentence-transform) |
| **A1-12** | Time Expressions | every day, on Mondays, always, never, sometimes, usually, often, rarely | Adverbs of frequency + present simple | ✅ parcial (word-bank, listen-and-type) |
| A1-13 | Daily Routines | wake up, get up, brush teeth, go to school, eat lunch, do homework, go to bed | I wake up at 7. He goes to school at 8. | Pendiente |
| A1-14 | Telling Time | o'clock, half past, quarter to, quarter past | What time is it? It's 3 o'clock. | Pendiente |
| A1-15 | Sports & Hobbies | soccer, basketball, swimming, reading, painting, singing, dancing | I like playing soccer. She enjoys reading. | Pendiente |
| A1-16 | Jobs | teacher, doctor, nurse, police, firefighter, cook, farmer, pilot | He is a doctor. She works at a hospital. | Pendiente |

### Bloque 4: Expandiendo (A1-17 a A1-24)

| # | Tema | Vocabulario clave | Gramática |
|---|------|-------------------|-----------|
| A1-17 | Present Continuous | I'm playing, she's eating, they're running | -ing forms. What are you doing? |
| A1-18 | Simple vs Continuous | I play (always) vs I'm playing (now) | Contraste entre ambos tiempos |
| A1-19 | Prepositions of Place | in, on, under, next to, between, behind, in front of | The cat is on the table. Where is...? |
| A1-20 | Transport | car, bus, train, bike, plane, boat, walk | I go to school by bus. How do you go? |
| A1-21 | Months & Birthdays | January-December, birthday, party, present, cake, candles | My birthday is in March. When is your birthday? |
| A1-22 | Comparatives | bigger, smaller, taller, shorter, faster, slower | A dog is bigger than a cat. |
| A1-23 | Superlatives | the biggest, the fastest, the tallest | The elephant is the biggest animal. |
| A1-24 | Can / Can't | can, can't, ability | I can swim. She can't fly. Can you dance? |

### Bloque 5: Hacia A1-2 (A1-25 a A1-32)

| # | Tema | Vocabulario clave | Gramática |
|---|------|-------------------|-----------|
| A1-25 | Past Simple: Was/Were | was, were, yesterday, last week | I was happy. They were at school. |
| A1-26 | Past Simple: Regular | played, watched, walked, danced, studied | -ed endings. I played yesterday. |
| A1-27 | Past Simple: Irregular | went, had, ate, saw, did, made, came, got | I went to the park. She ate pizza. |
| A1-28 | Past Simple: Questions | did, didn't | Did you play? I didn't go. |
| A1-29 | There is / There are | there is, there are, there was, there were | How many...? Is there a...? |
| A1-30 | Countable / Uncountable | some, any, much, many, a lot of | Some water, many apples. Is there any milk? |
| A1-31 | Going to (Future) | I'm going to + verb | I'm going to play. What are you going to do? |
| A1-32 | Will (Future) | will, won't | It will rain tomorrow. I won't go. |

### Bloque 6: Integración (A1-33 a A1-40)

| # | Tema | Contenido |
|---|------|-----------|
| A1-33 | Review: Vocabulary | Repaso de vocabulario por categorías |
| A1-34 | Review: Present Simple | Repaso integral de present simple (3 formas) |
| A1-35 | Review: Past Simple | Repaso integral de past simple |
| A1-36 | Review: Questions | Todas las formas de pregunta (do/does/did/can/is/are) |
| A1-37 | Mini Story 1 | Historia corta con comprensión (presente) |
| A1-38 | Mini Story 2 | Historia corta con comprensión (pasado) |
| A1-39 | Expedición: Around the World | Expedición temática combinando todo |
| A1-40 | Final Assessment | Evaluación estilo Cambridge Pre-A1 Starters |

---

## Niveles futuros (roadmap general)

### A1-2: Elementary / A1 Movers (pesquisa detallada pendiente)
- Present perfect introduction
- Comparatives/superlatives avanzados
- Adverbs of manner
- Reading comprehension
- Vocabulary: ~800 palabras (Cambridge Movers wordlist)

### A2: Pre-Intermediate / A2 Flyers (pesquisa detallada pendiente)
- Past continuous
- First conditional (if + present, will)
- Should / must
- Passive voice introduction
- Longer reading and listening
- Vocabulary: ~1200 palabras (Cambridge Flyers wordlist)

### B1: Intermediate (pesquisa detallada pendiente)
- Present perfect vs past simple
- Second conditional
- Reported speech
- Relative clauses
- Essay writing basics

---

## Flujo semanal sugerido

Cuando el maestro de inglés asigne un tema específico:
1. Ubicar el tema en este programa (o agregarlo si no existe)
2. Crear contenido para los 9 tipos de juego de ese tema
3. Subir JSONs al migrador de Firebase
4. El niño practica durante la semana

## Fuentes del programa

- Cambridge Young Learners (YLE) Pre-A1 Starters syllabus
- CEFR A1 Grammar contents (test-english.com)
- Cambridge Pre-A1 Starters vocabulary wordlist (~500 palabras)
- ESL Pals kids curriculum structure
- British Council LearnEnglish Kids
