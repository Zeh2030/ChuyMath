# Plan: Teoria Musical y Compositores

Plan para el siguiente lote de contenido de piano usando los tipos de juego YA existentes (no requieren componentes nuevos).

---

## Filosofia

Estos juegos complementan el teleprompter y identifica-nota para que el nino aprenda:
1. **Teoria musical** (duraciones, simbolos, vocabulario)
2. **Historia de compositores** (Mozart, Beethoven, Bach, etc.)
3. **Cultura musical** (generos, instrumentos, periodos)

No solo es tocar — es entender y disfrutar la musica.

---

## Tipos de juego reutilizados

Todos estos componentes YA existen en la app. Solo falta crear contenido JSON:

| Tipo | Uso para piano |
|------|---------------|
| `opcion-multiple` | Preguntas de teoria con 3-4 opciones |
| `true-or-false` | Datos curiosos, afirmaciones sobre teoria o compositores |
| `tap-the-pairs` | Emparejar simbolo ↔ nombre, compositor ↔ epoca |
| `fill-the-gap` | Completar vocabulario musical |
| `image-picker` | Identificar simbolos visualmente |
| `mini-story` | Biografias narradas de compositores |
| `word-scramble` | Desordenar palabras: SONATA, ALLEGRO, MOZART |

---

## Lote 1: Teoria Basica (P1-T01 a P1-T10)

### P1-T01 — Conoce el Piano (opcion-multiple)
**Tema:** Partes del piano
Preguntas:
- "¿Cuantas teclas tiene un piano completo?" (88)
- "¿Como se llaman las teclas negras?" (sostenidos y bemoles)
- "¿Que hace el pedal derecho?" (sostiene el sonido)
- "¿Cuantos pedales tiene un piano?" (3)

### P1-T02 — Las 7 Notas (tap-the-pairs)
**Tema:** Emparejar nombres hispanos con letras internacionales
- Do ↔ C
- Re ↔ D
- Mi ↔ E
- Fa ↔ F
- Sol ↔ G
- La ↔ A
- Si ↔ B

### P1-T03 — Clave de Sol (image-picker)
**Tema:** Identificar simbolos visualmente
- "¿Cual es la clave de Sol?" (mostrar 4 simbolos, elegir correcto)
- "¿Cual es la clave de Fa?"
- "¿Cual es el signo de sostenido?"
- "¿Cual es el bemol?"

### P1-T05 — Duraciones Basicas (opcion-multiple)
**Tema:** Figuras ritmicas y sus valores
- "¿Cuantos tiempos dura una negra?" (1)
- "¿Y una blanca?" (2)
- "¿Y una redonda?" (4)
- "¿Y una corchea?" (medio)
- "¿Cual es mas larga: blanca o negra?"

### P1-T08 — Mozart Nino Genio (mini-story)
**Tema:** Biografia de Mozart para ninos
Datos wow:
- Compuso su primera obra a los 5 anos
- Daba conciertos para reyes a los 6 anos
- Escribio mas de 600 piezas en su vida
- Podia memorizar obras enteras al primer escuche
- Murio joven pero dejo musica eterna

Preguntas al final:
- "¿A que edad compuso Mozart su primera pieza?"
- "¿Cuantas obras escribio aproximadamente?"

### P1-T09 — Silencios (true-or-false)
**Tema:** Los silencios tambien cuentan
- "Los silencios tienen duracion como las notas" → V
- "Un silencio de negra dura 2 tiempos" → F
- "En musica el silencio no importa" → F
- "El silencio sirve para respirar entre frases" → V

### P1-T10 — Compas 4/4 (fill-the-gap)
**Tema:** Vocabulario basico del compas
- "En un compas de 4/4 caben ___ tiempos" (4)
- "Las lineas verticales que dividen los compases se llaman ___ " (barras)
- "El numero de arriba en 4/4 indica cuantos ___ hay en cada compas" (tiempos)

---

## Lote 2: Compositores (Historia de la musica)

Cada uno usa `mini-story` con datos interesantes para ninos + 2-3 preguntas al final.

### P2-T04 — Beethoven: El Sordo Genial
**Datos wow:**
- Se quedo completamente sordo pero siguio componiendo
- Su 9a sinfonia la dirigio sin poder oirla
- La gente aplaudia de pie y el no escuchaba los aplausos
- Compuso "Para Elisa" que todos conocemos
- Era de caracter fuerte y necio

### P3-T03 — Chopin: El Poeta del Piano
**Datos wow:**
- Solo compuso para piano (amaba ese instrumento)
- Nacio en Polonia pero vivio en Francia
- Era muy timido y prefería tocar en casas pequenas
- Le decian "el poeta del piano" por su musica sensible
- Sus valses son famosos mundialmente

### P2-T09 — Bach y la Familia Musical
**Datos wow:**
- Tuvo 20 hijos (!), varios fueron musicos tambien
- Caminaba 400 km solo para escuchar a un gran organista
- Es considerado "el padre de la musica clasica"
- Sus obras son como rompecabezas matematicos perfectos
- Invento tecnicas que usamos hoy en dia

### P3-T07 — Tchaikovsky y el Ballet
**Datos wow:**
- Compuso "El Cascanueces" — si lo has escuchado en navidad, es de el
- Tambien "El Lago de los Cisnes" — ballet famoso
- Era ruso y amaba mucho su pais
- Sus melodias son muy emocionales, te hacen sentir cosas
- Se comunicaba mejor con la musica que con palabras

### P4-T02 — Debussy y el Impresionismo
**Datos wow:**
- Creaba musica que "pintaba" paisajes
- Le gustaba el mar y lo compuso en "La Mer"
- Usaba sonidos nuevos, diferentes a los de su epoca
- "Claro de Luna" es su pieza mas conocida
- Abrio la puerta a la musica moderna

---

## Lote 3: Vocabulario musical (tap-the-pairs, fill-the-gap, word-scramble)

### P2-T08 — Dinamicas (tap-the-pairs)
- pp ↔ pianissimo (muy suave)
- p ↔ piano (suave)
- mf ↔ mezzoforte (medio fuerte)
- f ↔ forte (fuerte)
- ff ↔ fortissimo (muy fuerte)

### P3-T04 — Tempos (tap-the-pairs)
- Largo ↔ muy lento
- Adagio ↔ lento
- Andante ↔ caminando
- Allegro ↔ rapido
- Presto ↔ muy rapido

### P3-T05 — Formas musicales (fill-the-gap)
- "Una pieza para piano solo se llama ___" (sonata)
- "Una obra con solista y orquesta es un ___" (concierto)
- "Una obra larga para orquesta es una ___" (sinfonia)
- "La numeracion de obras de un compositor se llama ___" (opus)

### P2-T10 — Articulaciones (true-or-false)
- "Staccato significa tocar las notas separadas y cortas" → V
- "Legato es tocar las notas unidas y suaves" → V
- "Un trino es tocar una nota sola" → F
- "La ligadura une dos notas en una sola" → V

### P4-T10 — Grandes Pianistas (tap-the-pairs)
- Liszt ↔ 1800 (siglo XIX)
- Rachmaninoff ↔ 1900 (siglo XX)
- Horowitz ↔ 1950 (mediados del XX)
- Lang Lang ↔ actualidad
- Martha Argerich ↔ contemporanea

---

## Orden de produccion sugerido

| Fase | Contenido | JSONs | Estado |
|------|-----------|-------|--------|
| **A** | Teoria basica P1 (T01, T02, T03, T05, T09, T10) | 6 JSONs | ✅ |
| **B** | Biografia Mozart P1-T08 (mini-story) | 1 JSON | ✅ |
| **C** | Vocabulario intermedio P2-P3 (dinamicas, tempos, formas) | 4 JSONs | ✅ |
| **D** | Biografias Beethoven, Bach, Chopin, Tchaikovsky | 4 JSONs | ✅ |
| **E** | Biografia Debussy + Joplin (ragtime) | 2 JSONs | ✅ |

**Total entregado:** 17 JSONs de teoria y compositores ✅

---

## Estructura de JSON implementada

```
_piano/
  prompter/          ← teleprompter (3 JSONs)
  identifica-nota/   ← lectura de notas (4 JSONs)
  opcion-multiple/   ← teoria con preguntas (2 JSONs)
  tap-the-pairs/     ← emparejar conceptos (3 JSONs)
  image-picker/      ← simbolos visuales (1 JSON)
  true-or-false/     ← verdadero o falso (2 JSONs)
  fill-the-gap/      ← completar frases (2 JSONs)
  mini-story/        ← biografias compositores (7 JSONs)
```

Cada tipo de juego tiene su propia subcarpeta. Total entregado: **24 JSONs**.

---

## Pendiente — Contenido

### Mas biografias de compositores (mini-story)
- **Clara Schumann** — pianista prodigio mujer, compositora desde niña, una de las mejores de la historia
- **Liszt** — el primer "rockstar", mujeres se desmayaban en sus conciertos
- **Satie** — el excentrico, titulos absurdos, precursor de la musica ambiental
- **Vivaldi** — "Las Cuatro Estaciones", el cura compositor pelirrojo
- **Haydn** — el padre de la sinfonia, profesor de Beethoven
- **Schumann** (Robert) — esposo de Clara, compositor romantico

### Teoria pendiente
- **P4-T01 Acordes de 7a** (identifica-acorde — necesita componente nuevo)
- **P4-T03 Forma sonata** (opcion-multiple): exposicion, desarrollo, recapitulacion
- **P4-T04 Ornamentos** (tap-the-pairs): trino, mordente, grupeto ↔ simbolo
- **P4-T06 Pedales del piano** (true-or-false): sustain, sostenuto, una corda
- **P4-T07 Circulo de quintas** (image-picker): relacion entre tonalidades
- **P4-T09 Semicorcheas y tresillos** (opcion-multiple): subdivisiones ritmicas
- **P4-T10 Grandes Pianistas** (tap-the-pairs): Liszt, Rachmaninoff, Horowitz, Lang Lang, Argerich

### Canciones del teleprompter (prompter)
- Crear gradualmente segun avance del niño
- Ver PROGRAMA_PIANO.md tabla P1-P5 para el catalogo
- Prioridad: P1-02 a P1-10 (mano derecha sola) y P4-02 a P4-10 (nivel actual)

---

## Pendiente — Componentes nuevos

### `identifica-acorde` (alta prioridad cuando se introduzcan acordes)
- Similar a `identifica-nota` pero con 2-3 notas simultaneas en pentagrama
- Reutiliza ~90% del codigo de IdentificaNota.jsx
- Reproducir el acorde con synth al hacer click (ya esta en identifica-nota)
- Esfuerzo: 0.5 sesiones

### **Selector de manos en teleprompter** (alta prioridad para grand staff)
- Antes de Play, en piezas multi-voz, mostrar 3 botones:
  - 🎼 Solo Sol (mano derecha)
  - 🎵 Solo Fa (mano izquierda)
  - 🎹 Ambas manos
- Filtrar el ABC: para "Sol" reemplazar V:2 con silencios; para "Fa" reemplazar V:1
- Necesario para volver a agregar la mano izquierda de Zapatillas Rojas
- Esfuerzo: 1 sesion

### `eco-musical` (futuro, baja prioridad)
- Escucha una secuencia de notas y reproducela
- Empieza con 2-3 notas, sube dificultad
- Para entrenar el oido absoluto/relativo

### `dictado-ritmico` (futuro)
- Escucha un patron ritmico y lo replica
- Para reforzar la lectura ritmica

---

## Pendiente — Mejoras al PianoPrompter

El sync actual con correccion al 20% es "casi perfecto" pero el usuario noto que todavia hay
ajuste visible al cambiar de seccion. Posibles mejoras futuras:

- Probar valores intermedios de absorption (10-15%) con cap proporcional
- Investigar si abcjs expone duracion exacta del visualObj sin necesidad de synth
- Considerar pre-computar todas las posiciones de notas al render para evitar correccion
- Ver `HISTORIAL_TELEPROMPTER.md` para no repetir enfoques fallidos

---

Ver `PROGRAMA_PIANO.md` para el programa completo P1-P5 y `HISTORIAL_TELEPROMPTER.md`
para el historial de iteraciones del teleprompter.
