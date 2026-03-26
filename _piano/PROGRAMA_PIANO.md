# Programa de Piano ChuyMath — Roadmap Global

Programa completo de aprendizaje de piano: tocar, leer partituras, teoria musical e historia.
No es solo un teleprompter — es un curso integral para que el nino entienda, toque y disfrute la musica.

---

## Estructura de niveles

```
P1  → Primeras Notas    (Libro 1 Yamaha)  — Mano derecha, notas sueltas
P2  → Dos Manos         (Libro 2 Yamaha)  — Inicio mano izquierda
P3  → Coordinacion      (Libro 3 Yamaha)  — Ambas manos juntas
P4  → Piezas Completas  (Libro 4 Yamaha)  — Nivel actual del alumno
P5  → Intermedio        (Post-Yamaha)     — Futuro
```

| Nivel | Nombre | Contenido estimado | Ritmo |
|-------|--------|-------------------|-------|
| P1 | Primeras Notas | 15 canciones + 10 teoria | 1-2/semana |
| P2 | Dos Manos | 15 canciones + 10 teoria | 1-2/semana |
| P3 | Coordinacion | 15 canciones + 10 teoria | 1-2/semana |
| P4 | Piezas Completas | 15 canciones + 10 teoria | 1-2/semana |
| P5 | Intermedio | 15 canciones + 10 teoria | Futuro |

**Total programa:** ~75 canciones + ~50 lecciones de teoria

---

## Tipos de actividad

### 1. `piano-prompter` (ya existe)
Teleprompter con scroll horizontal, playhead rojo, audio sintetizado.
- Canciones de practica con partitura visual
- BPM ajustable, fullscreen, sonido on/off

### 2. `identifica-nota` (NUEVO — componente necesario)
Juego para aprender a leer notas en el pentagrama.
- Se muestra una nota en un pentagrama (clave de Sol o Fa)
- El nino elige la respuesta correcta entre opciones (Do, Re, Mi, Fa, Sol, La, Si)
- Variantes:
  - **Nota → Nombre**: se muestra nota en pentagrama, elegir nombre
  - **Nombre → Nota**: se muestra nombre, elegir posicion en pentagrama
  - **Nota → Tecla**: se muestra nota, senalar tecla en teclado visual
- Progresion: empieza con 3 notas (Do, Re, Mi), va agregando
- Clave de Sol primero, luego Fa, luego mixto

### 3. `identifica-acorde` (NUEVO — componente necesario)
Similar a identifica-nota pero con acordes.
- Se muestran 2-3 notas simultaneas en pentagrama
- El nino identifica el acorde (Do mayor, Sol mayor, etc.)
- Solo a partir de P3/P4

### 4. Tipos existentes reutilizables (solo contenido nuevo)
Estos componentes ya existen y se reutilizan con contenido de piano:

| Tipo existente | Uso para piano | Ejemplo |
|---------------|----------------|---------|
| `opcion-multiple` | Teoria musical, historia | "Cuantos tiempos tiene una blanca?" |
| `true-or-false` | Datos curiosos, conceptos | "Mozart compuso su primera pieza a los 5 anos" → Verdadero |
| `tap-the-pairs` | Emparejar simbolo↔nombre | Simbolo de bemol ↔ "Bemol" |
| `fill-the-gap` | Vocabulario musical | "Una pieza para piano solo se llama ___" |
| `image-picker` | Identificar simbolos visualmente | "Cual es el simbolo de clave de Sol?" |
| `word-scramble` | Vocabulario | Desordenar "SONATA", "ALLEGRO" |
| `mini-story` | Biografias de compositores | Historia de Mozart contada para ninos |

---

## Contenido por nivel

### Nivel P1: Primeras Notas (mano derecha)

#### Canciones (teleprompter)

| # | Titulo | Notas usadas | Tonalidad | BPM |
|---|--------|-------------|-----------|-----|
| P1-01 | Twinkle Twinkle | C D E F G A | C | 80 | ✅ Creado |
| P1-02 | Mary Had a Little Lamb | E D C D E | C | 90 |
| P1-03 | Hot Cross Buns | E D C | C | 85 |
| P1-04 | Ode to Joy (simple) | E E F G G F E D | C | 80 |
| P1-05 | Jingle Bells (simple) | E E E, E G C D | C | 100 |
| P1-06 | London Bridge | G A G F E F G | C | 95 |
| P1-07 | Frere Jacques | C D E C, E F G | C | 90 |
| P1-08 | Lightly Row | E D C D E E E | C | 85 |
| P1-09 | Go Tell Aunt Rhody | E D C D E E E | C | 80 |
| P1-10 | Long Long Ago | C E G E, D F A F | C | 75 |

#### Teoria P1 (reutilizando tipos existentes)

| # | Titulo | Tipo | Tema |
|---|--------|------|------|
| P1-T01 | Conoce el Piano | opcion-multiple | Partes del piano (teclas blancas/negras, pedales) |
| P1-T02 | Las 7 Notas | tap-the-pairs | Emparejar Do-Re-Mi con C-D-E |
| P1-T03 | Clave de Sol | image-picker | Identificar clave de Sol entre simbolos |
| P1-T04 | Notas en el Pentagrama | identifica-nota | Do, Re, Mi en clave de Sol |
| P1-T05 | Negra y Blanca | opcion-multiple | Duracion: negra=1, blanca=2 |
| P1-T06 | Mas Notas | identifica-nota | Fa, Sol, La, Si en clave de Sol |
| P1-T07 | La Redonda | opcion-multiple | Duracion: redonda=4 tiempos |
| P1-T08 | Mozart Nino Genio | mini-story | Biografia de Mozart para ninos |
| P1-T09 | Silencio! | true-or-false | Los silencios tambien tienen duracion |
| P1-T10 | Compas 4/4 | fill-the-gap | "En un compas de 4/4 caben ___ tiempos" |

### Nivel P2: Dos Manos

#### Canciones

| # | Titulo | Caracteristica | Tonalidad | BPM |
|---|--------|---------------|-----------|-----|
| P2-01 | Aura Lee | Mano izquierda: notas sueltas | C | 75 |
| P2-02 | When the Saints | Mano izquierda: acompanamiento basico | C | 85 |
| P2-03 | Minuet en Sol | Bach/Petzold, manos separadas primero | G | 80 |
| P2-04 | Musette en Re | Bach, mano izquierda con pedal | D | 75 |
| P2-05 | Ecossaise | Beethoven, alternancia de manos | G | 90 |
| P2-06 | Himno a la Alegria (dos manos) | Beethoven, melodia + bajo | C | 80 |
| P2-07 | Vals del Principiante | 3/4, mano izquierda: bajo-acorde | C | 70 |
| P2-08 | Canon en Re (simplificado) | Pachelbel, bajo repetido | D | 65 |
| P2-09 | Fur Elise (intro) | Beethoven, solo primeros 8 compases | Am | 70 |
| P2-10 | Sonatina Op.36 No.1 (tema) | Clementi | C | 85 |

#### Teoria P2

| # | Titulo | Tipo | Tema |
|---|--------|------|------|
| P2-T01 | Clave de Fa | image-picker | Identificar clave de Fa |
| P2-T02 | Notas en Clave de Fa | identifica-nota | Do, Sol, Fa en clave de Fa |
| P2-T03 | Corcheas | opcion-multiple | Duracion: corchea = medio tiempo |
| P2-T04 | Beethoven: El Sordo Genial | mini-story | Biografia de Beethoven |
| P2-T05 | Sostenidos y Bemoles | tap-the-pairs | Simbolo ↔ nombre (# → sostenido, b → bemol) |
| P2-T06 | Que es un Acorde? | opcion-multiple | 3 notas juntas, mayor vs menor |
| P2-T07 | Acordes Basicos | identifica-acorde | Do mayor, Sol mayor, Fa mayor |
| P2-T08 | Dinamicas | tap-the-pairs | pp↔pianissimo, f↔forte, mf↔mezzoforte |
| P2-T09 | Bach y la Familia Musical | mini-story | Biografia de Bach |
| P2-T10 | Ligaduras y Staccato | true-or-false | Ligadura une notas, staccato las corta |

### Nivel P3: Coordinacion

#### Canciones

| # | Titulo | Caracteristica | Tonalidad | BPM |
|---|--------|---------------|-----------|-----|
| P3-01 | Sonatina Op.36 No.1 (completa) | Clementi, 1er movimiento | C | 90 |
| P3-02 | Minuet en Sol (completo) | Bach/Petzold, ambas manos simultaneas | G | 80 |
| P3-03 | Allegro en Fa | Mozart, articulacion | F | 95 |
| P3-04 | Vals del Perrito | Chopin simplificado, 3/4 | Db | 70 |
| P3-05 | Preludio en Do | Bach, patron arpegiado | C | 65 |
| P3-06 | Rondo Alla Turca (tema) | Mozart, primeros 16 compases | Am | 85 |
| P3-07 | Claro de Luna (simplificado) | Beethoven, arpegio mano derecha | C#m | 55 |
| P3-08 | Danza Hungara No.5 (tema) | Brahms, ritmo marcado | Gm | 80 |
| P3-09 | El Lago de los Cisnes (tema) | Tchaikovsky | Bm | 65 |
| P3-10 | Nocturno Op.9 No.2 (simplificado) | Chopin, expresividad | Eb | 60 |

#### Teoria P3

| # | Titulo | Tipo | Tema |
|---|--------|------|------|
| P3-T01 | Tonalidades Mayores | tap-the-pairs | Tonalidad ↔ alteraciones (Do=ninguna, Sol=F#) |
| P3-T02 | Intervalos | opcion-multiple | 2a, 3a, 5a, 8a — distancia entre notas |
| P3-T03 | Chopin: El Poeta del Piano | mini-story | Biografia de Chopin |
| P3-T04 | Tempo: De Lento a Rapido | tap-the-pairs | Largo↔muy lento, Allegro↔rapido, Presto↔muy rapido |
| P3-T05 | Que es una Sonata? | fill-the-gap | Vocabulario: sonata, concierto, sinfonia |
| P3-T06 | Tonalidades Menores | opcion-multiple | Diferencia mayor vs menor (alegre vs triste) |
| P3-T07 | Tchaikovsky y el Ballet | mini-story | El Cascanueces, Lago de los Cisnes |
| P3-T08 | Escalas | identifica-nota | Escala de Do mayor, Sol mayor completa |
| P3-T09 | Signos de Repeticion | image-picker | Identificar barras de repeticion, Da Capo, coda |
| P3-T10 | Periodos de la Musica | opcion-multiple | Barroco, Clasico, Romantico — fechas y compositores |

### Nivel P4: Piezas Completas (nivel actual del alumno)

#### Canciones

| # | Titulo | Caracteristica | Tonalidad | BPM |
|---|--------|---------------|-----------|-----|
| P4-01 | Las Zapatillas Rojas | Diabelli, staccato + legato | F | 80 | ✅ Creado |
| P4-02 | Sonatina Op.36 No.2 | Clementi, 1er movimiento | G | 95 |
| P4-03 | Invention No.1 | Bach, contrapunto 2 voces | C | 75 |
| P4-04 | Fur Elise (completa) | Beethoven | Am | 70 |
| P4-05 | Rondo Alla Turca (completo) | Mozart | Am | 100 |
| P4-06 | Gymnopedia No.1 | Satie, expresividad | D | 55 |
| P4-07 | Maple Leaf Rag (simplificado) | Joplin, ritmo sincopado | Ab | 75 |
| P4-08 | El Entretenedor | Joplin, ragtime | C | 80 |
| P4-09 | Vals en La menor | Chopin | Am | 65 |
| P4-10 | Arabesque No.1 (tema) | Debussy, impresionismo | E | 60 |

#### Teoria P4

| # | Titulo | Tipo | Tema |
|---|--------|------|------|
| P4-T01 | Acordes de 7a | identifica-acorde | Acordes con 4 notas |
| P4-T02 | Debussy y el Impresionismo | mini-story | Musica que pinta paisajes |
| P4-T03 | Forma Sonata | opcion-multiple | Exposicion, desarrollo, recapitulacion |
| P4-T04 | Ornamentos | tap-the-pairs | Trino, mordente, grupeto ↔ simbolo |
| P4-T05 | Joplin y el Ragtime | mini-story | Historia del ragtime afroamericano |
| P4-T06 | Pedales del Piano | true-or-false | Sustain, sostenuto, una corda |
| P4-T07 | Circulo de Quintas | image-picker | Relacion entre tonalidades |
| P4-T08 | Satie: El Excéntrico | mini-story | Composiciones con titulos absurdos |
| P4-T09 | Semicorcheas y Tresillos | opcion-multiple | Subdivisiones ritmicas |
| P4-T10 | Grandes Pianistas | tap-the-pairs | Pianista ↔ epoca (Liszt, Horowitz, Lang Lang) |

---

## Feature: Selector de manos (MEJORA al teleprompter)

### Problema
Cuando una pieza tiene dos manos (multi-voz), el alumno necesita practicar:
1. Solo mano derecha (clave de Sol)
2. Solo mano izquierda (clave de Fa)
3. Ambas manos juntas

Actualmente el teleprompter siempre muestra ambas manos sin opcion de separar.

### Solucion propuesta
Agregar selector ANTES de iniciar reproduccion en PianoPrompter.jsx:

```
┌─────────────────────────────────────┐
│  🎹 Las Zapatillas Rojas            │
│  A. Diabelli                        │
│                                     │
│  Practicar:                         │
│  ┌──────┐ ┌──────┐ ┌──────────────┐│
│  │🎼 Sol│ │🎵 Fa │ │🎹 Ambas     ││
│  │(der) │ │(izq) │ │   manos     ││
│  └──────┘ └──────┘ └──────────────┘│
│                                     │
│         ▶️ Reproducir                │
└─────────────────────────────────────┘
```

### Implementacion tecnica
- Solo aparece cuando la pieza es multi-voz (`isMultiVoice`)
- Opcion "Sol" → filtra ABC para solo incluir V:1 (reemplaza V:2 con silencios)
- Opcion "Fa" → filtra ABC para solo incluir V:2 (reemplaza V:1 con silencios)
- Opcion "Ambas" → comportamiento actual (default)
- Para piezas de una sola mano, no se muestra selector (directo al teleprompter)

### Esfuerzo: 1 sesion
- Modificar PianoPrompter.jsx (agregar estado de seleccion + filtro ABC)
- No requiere nuevo componente ni cambios en MusicPrompter

---

## Feature: Componente `identifica-nota` (NUEVO)

### Descripcion
Juego de lectura de notas en el pentagrama. Fundamental para todo pianista.

### Pantalla

```
┌─────────────────────────────────────┐
│  Que nota es esta?                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    ───────────────────      │    │
│  │    ───────────────────      │    │
│  │    ───────●───────────      │    │
│  │    ───────────────────      │    │
│  │    ───────────────────      │    │
│  │  𝄞                          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────┐┌────┐┌────┐┌────┐         │
│  │ Do ││ Mi ││ Sol││ Si │         │
│  └────┘└────┘└────┘└────┘         │
│                                     │
│  Racha: 🔥 5 correctas             │
└─────────────────────────────────────┘
```

### Implementacion tecnica
- Usar abcjs para renderizar UNA nota en un pentagrama corto (solo 1 compas)
- Generar ABC dinamico: `X:1\nK:C clef=treble\nE4 |]` (la nota a adivinar)
- 4 opciones, 1 correcta
- Racha de aciertos para motivar
- Variante avanzada: mostrar nombre, elegir posicion

### Formato JSON

```json
{
  "tipo": "identifica-nota",
  "clave": "treble",
  "retos": [
    { "nota_abc": "C", "respuesta": "Do", "opciones": ["Do", "Re", "Mi", "Fa"] },
    { "nota_abc": "E", "respuesta": "Mi", "opciones": ["Re", "Mi", "Sol", "La"] },
    { "nota_abc": "G", "respuesta": "Sol", "opciones": ["Fa", "Sol", "La", "Si"] }
  ]
}
```

### Esfuerzo: 1 sesion

---

## Feature: Componente `identifica-acorde` (NUEVO)

### Descripcion
Similar a identifica-nota pero con 2-3 notas simultaneas.

### Formato JSON

```json
{
  "tipo": "identifica-acorde",
  "retos": [
    { "notas_abc": "[CEG]", "respuesta": "Do mayor", "opciones": ["Do mayor", "Sol mayor", "Fa mayor", "Re menor"] },
    { "notas_abc": "[GBd]", "respuesta": "Sol mayor", "opciones": ["Do mayor", "Sol mayor", "La menor", "Mi menor"] }
  ]
}
```

### Esfuerzo: 0.5 sesiones (reutiliza 90% de identifica-nota)

---

## Guia: Extraccion de canciones desde foto de partitura

### Proceso paso a paso

Cuando el usuario proporciona una foto de una partitura de piano, seguir estos pasos:

#### Paso 1: Identificar metadatos
- **Titulo** de la pieza
- **Compositor** / autor
- **Tonalidad**: ver armadura al inicio (cuantos sostenidos/bemoles)
- **Compas**: ver fraccion al inicio (4/4, 3/4, 2/4, 6/8)
- **Tempo/BPM**: si hay indicacion (Allegro~120, Andante~80, Adagio~60)
- **Clave(s)**: Solo clave de Sol? Grand staff (Sol + Fa)?

#### Paso 2: Mapear armadura a tonalidad ABC

| Armadura | Tonalidad | ABC |
|----------|-----------|-----|
| Ninguna | Do mayor / La menor | C / Am |
| 1 sostenido (F#) | Sol mayor / Mi menor | G / Em |
| 2 sostenidos (F#, C#) | Re mayor / Si menor | D / Bm |
| 3 sostenidos (F#, C#, G#) | La mayor / Fa# menor | A / F#m |
| 1 bemol (Bb) | Fa mayor / Re menor | F / Dm |
| 2 bemoles (Bb, Eb) | Sib mayor / Sol menor | Bb / Gm |
| 3 bemoles (Bb, Eb, Ab) | Mib mayor / Do menor | Eb / Cm |

#### Paso 3: Transcribir notas compas por compas
Para cada compas, leer de izquierda a derecha:

1. **Identificar cada nota por posicion en el pentagrama**
   - Clave de Sol: lineas de abajo a arriba = Mi, Sol, Si, Re, Fa
   - Clave de Sol: espacios de abajo a arriba = Fa, La, Do, Mi
   - Clave de Fa: lineas = Sol, Si, Re, Fa, La
   - Clave de Fa: espacios = La, Do, Mi, Sol

2. **Identificar duracion por forma**
   - ● rellena + plica = negra (1 beat) → `C`
   - ○ vacia + plica = blanca (2 beats) → `C2`
   - ○ vacia sin plica = redonda (4 beats) → `C4`
   - ● rellena + plica + corchete = corchea (0.5 beat) → `C/2`
   - ● + doble corchete = semicorchea (0.25 beat) → `C/4`
   - Punto despues de nota = +50% duracion → `C3/2` (negra con punto)

3. **Convertir a ABC**
   - Octava central: `C D E F G A B`
   - Octava arriba: `c d e f g a b`
   - Octava abajo: `C, D, E, F, G, A, B,`
   - Sostenido: `^F` (F#), Bemol: `_B` (Bb), Natural: `=B`
   - Acorde: `[CEG]`
   - Ligadura: `(C D E)`
   - Staccato: `.C`

4. **Separar compases con `|`**, terminar con `|]`

#### Paso 4: Si es grand staff (dos manos)
```
%%staves {1 2}
V:1
[notas mano derecha compas por compas]
V:2 clef=bass
[notas mano izquierda compas por compas]
```
- Ambas voces DEBEN tener el mismo numero de compases
- Compases vacios en una mano → `z4 |` (silencios llenando el compas)

#### Paso 5: Validar
- Contar tiempos por compas — deben sumar lo indicado en el compas (4 para 4/4, 3 para 3/4)
- Verificar que sostenidos/bemoles coincidan con la armadura
- Notas fuera de armadura llevan alteracion explicita (^, _, =)

#### Paso 6: Armar JSON
```json
{
  "id": "piano-nombre-cancion",
  "titulo": "Nombre",
  "misiones": [{
    "id": "cancion-01",
    "tipo": "piano-prompter",
    "titulo": "Nombre",
    "instruccion": "Descripcion para el nino",
    "autor": "Compositor",
    "bpm": 80,
    "dificultad": "principiante|intermedio|avanzado",
    "nivel": "P1-01",
    "configuracion": {
      "compas": "4/4",
      "tonalidad": "C",
      "clave": "treble"
    },
    "notas": "notas ABC aqui"
  }]
}
```

### Errores comunes a evitar
- **Olvidar naturales**: si la armadura tiene F# pero aparece F natural, escribir `=F`
- **Octava equivocada**: Do central es `C`, el de arriba es `c`, el de abajo es `C,`
- **Tiempos que no cuadran**: negra=1, blanca=2, corchea=0.5 — deben sumar al compas
- **Multi-voz desbalanceada**: si mano derecha tiene 8 compases, mano izquierda tambien

---

## Temas de teoria musical — Desglose completo

### Lectura musical (identifica-nota, identifica-acorde)
| Tema | Nivel | Descripcion |
|------|-------|-------------|
| Notas en clave de Sol (Do-Sol) | P1 | Las primeras 5 notas |
| Notas en clave de Sol (completa) | P1 | Las 7 notas + ledger lines |
| Notas en clave de Fa (basico) | P2 | Do, Sol, Fa, La |
| Notas en clave de Fa (completa) | P2 | Las 7 notas |
| Lectura mixta (Sol + Fa) | P3 | Alternar entre claves |
| Acordes mayores | P2-P3 | Do, Sol, Fa, Re mayor |
| Acordes menores | P3-P4 | La, Re, Mi menor |
| Acordes de 7a | P4 | Sol7, Do7 |

### Ritmo y duracion
| Tema | Nivel | Descripcion |
|------|-------|-------------|
| Negra y blanca | P1 | 1 y 2 tiempos |
| Redonda y silencio | P1 | 4 tiempos, silencios |
| Corchea | P2 | Medio tiempo |
| Negra con punto | P2 | 1.5 tiempos |
| Semicorchea | P4 | Cuarto de tiempo |
| Tresillos | P4 | 3 notas en 1 tiempo |
| Compas 3/4 y 6/8 | P3 | Vals, compases compuestos |

### Vocabulario musical
| Termino | Nivel | Significado |
|---------|-------|-------------|
| Pentagrama | P1 | Las 5 lineas |
| Clave | P1 | Sol y Fa |
| Compas | P1 | Division ritmica |
| Sostenido/Bemol | P2 | Alteraciones |
| Legato/Staccato | P2 | Articulacion |
| Piano/Forte | P2 | Dinamicas (suave/fuerte) |
| Allegro/Andante/Adagio | P3 | Tempos |
| Sonata | P3 | Forma musical |
| Concierto | P3 | Solista + orquesta |
| Sinfonia | P4 | Obra para orquesta |
| Opus | P4 | Numero de obra |
| Arpegio | P3 | Acorde desglosado |
| Escala | P2 | Secuencia de 7 notas |
| Tonalidad | P3 | Centro tonal de la pieza |

### Historia de compositores (mini-story)
| Compositor | Nivel | Datos interesantes para ninos |
|-----------|-------|------------------------------|
| Mozart | P1 | Compuso a los 5 anos, viajo por toda Europa de nino, escribio 600+ obras |
| Beethoven | P2 | Se quedo sordo y siguio componiendo, su 9a sinfonia la dirigio sin oir |
| Bach | P2 | Tuvo 20 hijos, caminaba 400 km para oir a un organista, padre de la musica |
| Chopin | P3 | Solo compuso para piano, era timido, le decian "el poeta del piano" |
| Tchaikovsky | P3 | El Cascanueces, El Lago de los Cisnes — ballet que todos conocen |
| Debussy | P4 | Inventó sonidos nuevos, le gustaba el mar y la naturaleza |
| Satie | P4 | Excéntrico, titulos absurdos, precursor de la musica ambiental |
| Joplin | P4 | Rey del Ragtime, afroamericano que revoluciono la musica popular |
| Liszt | P5 | El primer "rockstar", mujeres se desmayaban en sus conciertos |
| Clara Schumann | P3 | Pianista prodigio, compuso desde nina, una de las mejores de la historia |

---

## Plan de contenido

### Produccion en lotes

| Lote | Contenido | Prioridad |
|------|-----------|-----------|
| Lote 1 | P1-01 a P1-10 (canciones basicas mano derecha) | Alta |
| Lote 2 | P1-T01 a P1-T10 (teoria nivel 1) | Alta |
| Lote 3 | Selector de manos (feature PianoPrompter) | Alta |
| Lote 4 | Componente identifica-nota | Media |
| Lote 5 | P4-02 a P4-10 (canciones nivel actual) | Media |
| Lote 6 | P2 canciones + teoria | Cuando avance a P2 o retroactivo |
| Lote 7 | P3 canciones + teoria | Futuro |
| Lote 8 | Componente identifica-acorde | Futuro |

### Contenido ya creado

| Archivo | Nivel | Tipo |
|---------|-------|------|
| `twinkle-twinkle.json` | P1-01 | piano-prompter |
| `zapatillas-rojas.json` | P4-01 | piano-prompter |

---

## Verificacion de notas existentes

### twinkle-twinkle.json (P1-01)
- Tonalidad: C (Do mayor) ✅
- Compas: 4/4 ✅
- Notas: `C C G G | A A G2 | F F E E | D D C2 | G G F F | E E D2 | G G F F | E E D2 | C C G G | A A G2 | F F E E | D D C2`
- Verificacion: Melodia correcta de Twinkle Twinkle en Do mayor
- Cada compas suma 4 tiempos ✅
- **Status: CORRECTO** ✅

### zapatillas-rojas.json (P4-01)
- Tonalidad: F (Fa mayor, 1 bemol: Bb) ✅
- Compas: 4/4 ✅
- Multi-voz: Si (V:1 + V:2 clef=bass) ✅
- V:1 (mano derecha):
  - Compas 1: `.C .F .A .c` = 4 staccatos de negra = 4 tiempos ✅
  - Compas 2: `(c3/2 d/2 c) A` = 1.5 + 0.5 + 1 + 1 = 4 ✅
  - Compas 3: `(=B =B) (=B/c/ d/=B/)` — B naturales (porque Bb en armadura)
    - =B + =B + =B/2 + c/2 + d/2 + =B/2 = 1+1+0.5+0.5+0.5+0.5 = 4 ✅
  - Compas 4: `c G z2` = 1+1+2 = 4 ✅
  - Compases 5-8: repiten patron con variacion final ✅
- V:2 (mano izquierda):
  - Compases 1-2: `z4 | z4` = silencios ✅
  - Compas 3: `=B,, [D,F,] z2` = 1+1+2 = 4 ✅
  - Compas 4: `C, [E,G,] z2` = 1+1+2 = 4 ✅
- **Status: CORRECTO** ✅ (las notas naturales =B son correctas para Fa mayor)

---

## Reglas de contenido

1. **BPM conservador**: siempre empezar lento, el nino puede subir con el control de BPM
2. **Tonalidades simples primero**: C, G, F (0-1 alteracion) antes que D, Bb, etc.
3. **Cada cancion debe ser reconocible**: el nino debe poder identificarla y motivarse
4. **Teoria intercalada**: no 10 canciones seguidas ni 10 teorias seguidas — alternar
5. **Biografias deben incluir datos sorprendentes**: edades, anecdotas, datos "wow"
6. **Para fotos de partitura**: siempre verificar tiempos por compas antes de entregar JSON
