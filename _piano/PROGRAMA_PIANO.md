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

## Track ADULTO (`PA1`..`PA4`) — decidido 2026-08-28

El papa quiere aprender piano en la misma plataforma. **NO es "piano avanzado"
contra "piano basico"**: un adulto principiante es principiante. Lo que cambia
es el RITMO, la SECUENCIA y el TONO, no la dificultad.

### Por que un track aparte y no reusar P1..P4

Investigacion sobre abandono en adultos (fuentes al final de esta seccion):

- *"Adults quit when they spend months stuck on childish-sounding beginner
  pieces. Adults want to feel like musicians."* → el repertorio de nino no sirve.
- *"They quit because nobody ever taught them how to practice."* → el abandono
  es por falta de ESTRUCTURA, no de talento. Por eso las herramientas de
  practica (metronomo, bucle A-B, escalera de tempo) son la funcion de
  retencion, no un extra.
- Los adultos abandonan por **culpa** ("no practique, perdon") mas que por
  dificultad. → **el perfil adulto NO debe llevar rachas ni estrellas**: una
  racha rota es un amplificador de culpa. Registro neutro de minutos, si;
  contador que regana, no.
- *"Adults like to understand the reasons behind what they're learning."* →
  cargar teoria y armonia AL FRENTE.

### Diferencias con el track de nino

| | Nino (P1..P4) | Adulto (PA1..PA4) |
|---|---|---|
| Teoria | Goteada, 1 concepto/semana | Al frente y comprimida (P1-T01..T10 = 2 sesiones) |
| Armonia | Primer acorde en P2-T06 (~mes 8) | Triadas y I-IV-V-I desde PA1 |
| Tecnica | No existe en el programa | Escalas, arpegios, Hanon 1-5 como piezas de prompter |
| Repertorio | Twinkle, Mary Had a Little Lamb | Satie, Bach BWV 846, Chopin Op.28 No.7, blues de 12 compases |
| Motivacion | Estrellas, historias "wow" | Diario de practica (minutos y tempo alcanzado) |

### Como se separa en la app — ✅ pistas Niños / Adultos (2026-09-16)

Una sola coleccion `piano`, **dos pistas**. Nada se bloquea: la pista solo decide
que se ve.

- **Perfil**: casilla "Es un adulto" (`esAdulto`, espejo de `esPeque`, excluyentes
  entre si) en Perfil y en el alta de perfil. Hoy **solo** decide con que pista
  abre Piano; el resto de la app se ve igual. Es el paso 1 del "modo papas".
- **Selector** `🧒 Niños | 🎼 Adultos` en el Dashboard, bajo la barra de materias,
  solo en Piano. Cambia la pista de esa visita en Hoy y en Explorar. El nino
  puede ver lo de adultos y el adulto lo de ninos.
- **Regla** (`utils/materiaContent.js` → `pistaPiano`, compartida por la Boveda
  y la aventura del dia):

  | Contenido | Pista |
  |---|---|
  | nivel `PA…` | Adultos |
  | `identifica-nota` (lectura de notas) | **Ambas** — decision del usuario |
  | niveles de prueba (`TEST`, `P9-TEST`) | Adultos, y **nunca** aventura del dia |
  | todo lo demas (`P1-01`, teoria `P?-T??`, **compositores**) | Ninos |

- **Aventura del dia**: filtra por la pista del perfil (a un nino no se le propone
  una pieza de adulto). Para adultos, el repertorio PA va antes que la lectura de
  notas compartida (si no, P1-T04 "Do Re Mi" ordenaba antes que PA1-01).
- **Boveda**: conteos, chips de nivel y listas respetan la pista. En Adultos se
  ocultan los tipos sin contenido (compositores, teoria): no estan "bloqueados",
  son de la otra pista. Al cambiar de pista se suelta el chip de nivel.
- **Clair de Lune → PA3-01** (antes P5-01), decision del usuario.
- Se agrego `nivel` a nivel documento en las 5 canciones viejas del prompter
  (Twinkle, Zapatillas, Clair de Lune y las 2 de prueba): sin el, la Boveda no
  las mostraba al filtrar por nivel. Hay que re-migrarlas.
- Prueba: la regla se corrio contra los 41 JSON de `_piano` (20 ninos, 8
  adultos, 13 ambas).

**Descartado** (con el usuario): modulo aparte en la barra de materias (el nino
veria un boton ajeno y dar de alta una materia toca ~7 puntos) y preguntar al
entrar (le cobraria un clic al nino cada vez).

### Repertorio inicial sugerido (todo dominio publico)

Satie *Gymnopedie No.1*, Bach *Preludio en Do* (BWV 846), Chopin *Preludio
Op.28 No.7* (16 compases, Chopin real, tocable en 3 semanas), *Fur Elise*
intro, blues de 12 compases en Do.

**Construidas (2026-09-16):** `PA1-01` Für Elise · El tema y `PA1-02` Für Elise ·
Seccion A completa (con digitacion); `PA1-03` Canon en Re (con digitacion),
`PA1-04` El lago de los cisnes, `PA1-05` Minueto en Sol · Seccion A. Ver
§Digitacion → Piezas construidas.

Einaudi y Yann Tiersen estan en derechos. Con el uso actual (personal + amigos)
no es impedimento — ver la decision de licencias en §Digitacion.

Fuentes: [por que abandonan los adultos](https://www.angelesacademyofmusic.com/news/piano-practice-build-piano-skills-as-an-adult-teenager) ·
[adultos vs ninos](https://www.tymmi.com/piano-lessons-adults-vs-children-teaching-methods/) ·
[apps para adultos](https://www.pianostartguide.com/flowkey-vs-simply-piano/)

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
    (el teclado visual YA EXISTE como componente reutilizable:
    `src/components/piano/Teclado.jsx`, construido 2026-08-17 para el
    teleprompter; esta variante solo necesita hacerlo interactivo)
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
| P4-02 | Twinkle de Mozart (tema de K.265) | Mozart, la melodia de P1-01 con mano izquierda | C | 120 | ✅ Creado 2026-09-16 (MusicXML) |
| P4-03 | Sonatina Op.36 No.2 | Clementi, 1er movimiento | G | 95 |
| P4-04 | Invention No.1 | Bach, contrapunto 2 voces | C | 75 |
| P4-05 | Fur Elise (completa) | Beethoven | Am | 70 |
| P4-06 | Rondo Alla Turca (completo) | Mozart | Am | 100 |
| P4-07 | Gymnopedia No.1 | Satie, expresividad | D | 55 |
| P4-08 | Maple Leaf Rag (simplificado) | Joplin, ritmo sincopado | Ab | 75 |
| P4-09 | El Entretenedor | Joplin, ragtime | C | 80 |
| P4-10 | Vals en La menor | Chopin | Am | 65 |
| P4-11 | Arabesque No.1 (tema) | Debussy, impresionismo | E | 60 |

> Las filas sin ✅ son un plan: su numero se recorrio el 2026-09-16 al crear
> P4-02. Solo las creadas tienen archivo.

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

## Feature: Herramientas de practica — ✅ CONSTRUIDAS 2026-08-27/28

Todo vive en `MusicPrompter.jsx`; `PianoPrompter` y los JSON de contenido NO
cambian. Sirven igual al nino y al adulto, pero para el adulto (que no tiene
maestra) son la funcion de retencion, no un extra.

### Metronomo 🥁 + cuenta de entrada — ✅ probado

- Click sintetizado por nosotros (oscilador + envolvente), **NO** por el synth
  de abcjs, para que suene **aunque la pieza este en mudo** — practicar con
  click y sin guia es el caso normal.
- Agendado con lookahead de 250 ms contra el reloj del AudioContext. El rAF solo
  decide QUE agendar, nunca CUANDO suena: el pulso no tiembla aunque un frame
  llegue tarde.
- El primer frame llega ~16 ms tarde: ese click aun se toca (con `ceil` sobre
  una rejilla se perdia el del primer tiempo). Uno muy atrasado (pestaña
  congelada, > 80 ms) se salta.
- Acento (1600 Hz) en el primer tiempo del compas; el resto a 1100 Hz.

- **Anacrusa — BUG corregido 2026-09-16.** El metronomo original contaba una
  rejilla desde 0, asi que en una pieza con anacrusa el acento caia en el tiempo
  equivocado de TODOS los compases. Lo destapo Für Elise (empieza con dos
  semicorcheas), pero **Zapatillas Rojas tambien tiene anacrusa** (`.A |`) y
  sufria el mismo error. Ahora los clicks salen de los inicios de compas REALES
  que marca abcjs (`measureStart` en `noteTimings`), con dos funciones puras en
  `utils/musica.js`:
  - `pulsosMetronomo`: compas completo → clicks desde su inicio con acento;
    compas incompleto a media pieza (anacrusa, o la anacrusa que vuelve tras una
    1a casilla) → clicks contados hacia atras desde el tiempo fuerte, sin acento.
  - `cuentaDeEntrada`: la cuenta CONTINUA la rejilla de la pieza y dura al menos
    un compas. Desde un tiempo fuerte es un compas, como siempre; con anacrusa
    cuenta "1 2 3 | 1 2" y la anacrusa entra en el 3; desde medio compas (bucle o
    pausa) entra en su tiempo exacto.
  - OJO: el `measureStart` se lee ANTES de descartar eventos sin elemento: abcjs
    marca asi el inicio de compas cuando una ligadura cruza la barra.
- **3/8 subdividido.** abcjs cuenta 3/8 como UN pulso por compas: un click por
  compas no da nada que contar (a 50 % seria uno cada ~3 s). Si un compas tiene
  un solo pulso, se subdivide en las figuras del numerador (3 corcheas). 6/8 y
  9/8 no cambian.
- **Verificado de punta a punta en Chrome (headless)**, dibujando cada pieza como
  la app y con el codigo real del repo: Twinkle y Clair de Lune dan **exactamente
  los mismos clicks** que el metronomo validado al oido (regresion); Für Elise
  acentua el inicio exacto de sus 44 compases completos; Zapatillas acentua el
  primer tiempo real. Desvio maximo entre clicks: 0.7 ms (abcjs redondea sus
  milisegundos; inaudible).
- **Compas compuesto: correcto sin trabajo extra.** Verificado con
  `abcjs.parseOnly`: `getBeatLength()` devuelve negra con puntillo (0.375) en
  6/8 y 9/8, asi que marca los pulsos que se sienten, no las corcheas:

  | 4/4 | 3/4 | 2/4 | 6/8 | 9/8 |
  |-----|-----|-----|-----|-----|
  | 4   | 3   | 2   | 2   | 3   |

  **Validado al oido** por el usuario (2026-08-28): Clair de Lune (9/8) suena a
  3 por compas y Twinkle (4/4) a 4, con el acento en el primero. Se temia tener
  que corregir a mano el compas compuesto; no hizo falta.

- **Cuenta de entrada** atada al metronomo (si hay click, hay cuenta) para no
  meter otro boton. El synth arranca DESPUES y el reloj se ancla en ese
  instante: la garantia de cero deriva del Enfoque 4 queda intacta.

### Bug de tonalidad en PianoPrompter — corregido 2026-09-16

`construirAbc` decidia si insertar el `K:` del encabezado con
`notas.includes('K:')`. Un cambio de clave en linea (`[K:clef=treble]`) contiene
"K:", asi que dejaba de insertar la tonalidad: en Do no se nota, pero en una pieza
en Sol se perdia el Fa# de la armadura **en silencio**. Ahora solo cuenta un `K:`
en su propia linea (`/^K:/m`). Verificado: con y sin cambios de clave, la
partitura completa y cada mano sola suenan identicas.

### Bucle A-B 🔁 — ✅ probado

- A y B se marcan al vuelo desde la posicion real de reproduccion. Al marcar B
  el bucle arranca **de inmediato** (marcas el final del pasaje y ya se repite).
- Al pasar B se vuelve a A por `irA()`, el mismo camino que la barra de avance
  (reancla reloj, audio, teclado y metronomo). Va ANTES del corte de fin de
  pieza para que un bucle en el ultimo compas siga dando vueltas.
- **Al cambiar el BPM los puntos se reescalan**: marcan COMPASES, no
  milisegundos. Marcas el tramo dificil una vez y lo bajas de velocidad.
- `irA()` se movio arriba de `animate()`: el bucle lo necesita en su lista de
  dependencias, que se evalua en tiempo de definicion.

### Escalera de tempo 🪜 — ✅ validada por el usuario 2026-09-16

- Escalones fijos al **50/60/70/80/90/100 % del tempo original** de la pieza.
  Con ±5 BPM habia que apretar ocho veces para llegar al 70%.
- Boton ⏫ para subir un escalon. Si el BPM quedo fuera de la escalera (se uso
  ±5), sube al primer escalon por encima.
- **Cambiar de tempo ya NO reinicia la pieza.** Antes se volvia al compas 1, lo
  que hacia la escalera inutil trabajando un pasaje. Ahora la posicion se
  reescala por el mismo factor que el bucle y **queda en pausa** (no se reanuda
  sola): asi entras con la cuenta del metronomo, que es justo lo que quieres al
  cambiar de escalon. Se corrigio tambien el texto de ayuda, que prometia lo
  contrario.
- La escalera + el bucle A-B juntos son la mecanica de estudio completa: marcas
  el tramo dificil una vez, y subes escalones sin volver a marcarlo.
- **Deliberadamente NO hay escalera automatica** ("sube solo al tocarlo bien"):
  sin entrada del alumno no se puede saber si estuvo bien, y subir a ciegas cada
  N vueltas seria arbitrario. Se construye cuando exista el modo espera.

---

## Feature: Entrada del alumno (modo espera) — PENDIENTE

**Es el hueco real de la plataforma**: la app muestra y toca, pero **nunca oye**.
Para el nino con maestra eso basta; para un adulto autodidacta no hay ciclo de
retroalimentacion. "Wait mode" (el scroll no avanza hasta que aciertas) es
funcion con nombre propio en Flowkey y es lo que sostiene a un autodidacta.

**Correccion importante (2026-08-28):** en un analisis previo se descarto el
microfono por "no funciona con polifonia". **Fue demasiado tajante.** Simply
Piano, Skoove, Flowkey y Yousician usan microfono y funcionan con pianos
acusticos. El matiz que si sobrevive: la transcripcion polifonica GENERAL es
dificil, pero **verificar contra notas esperadas es mucho mas facil** — y ese es
el unico problema que tenemos, porque siempre sabemos que deberia sonar.

→ **El modo espera NO requiere comprar hardware MIDI.** MIDI (Web MIDI API,
nativo en Chrome, sin libreria) sigue siendo mas confiable y mas barato de
programar, y `Teclado.jsx` ya tiene la API imperativa `setActivas` lista para
iluminar lo que el alumno presiona. Pero ya no es prerrequisito.

Valor progresivo: (1) eco en el teclado de pantalla, (2) quizzes que se
contestan TOCANDO la tecla en vez de hacer clic (la variante "Nota → Tecla" ya
esta disenada arriba), (3) modo espera en el prompter, (4) puntuacion.

---

## Feature: Selector de manos (MEJORA al teleprompter)

> ✅ **IMPLEMENTADO 2026-07-14** en PianoPrompter.jsx + PianoPrompter.css.
> Se siguió la estrategia de "filtrar a un pentagrama". Pendiente: validar al
> oído (izquierda/derecha por separado) con una pieza a dos manos.

### Problema
Cuando una pieza tiene dos manos (multi-voz), el alumno necesita practicar:
1. Solo mano derecha (clave de Sol)
2. Solo mano izquierda (clave de Fa)
3. Ambas manos juntas

Actualmente el teleprompter siempre muestra ambas manos sin opcion de separar.

### Solucion propuesta
Agregar selector ANTES de iniciar reproduccion en PianoPrompter.jsx:

```
┌──────────────────────────────────────────┐
│  🎹 Las Zapatillas Rojas                 │
│  Tradicional Japonesa                    │
│                                          │
│  ¿Como quieres practicar?                │
│  ┌───────────┐ ┌───────────┐ ┌─────────┐ │
│  │🎼 Derecha │ │🎵 Izquierda│ │🎹 Dos   │ │
│  │(clave Sol)│ │(clave Fa) │ │  manos  │ │
│  └───────────┘ └───────────┘ └─────────┘ │
└──────────────────────────────────────────┘
   (al elegir, entra directo al teleprompter con esa mano)
```

### Estrategia elegida: filtrar a UN solo pentagrama  *(no silenciar la otra mano)*

Con el motor nuevo (Enfoque 4, ver HISTORIAL_TELEPROMPTER) lo mas simple Y
pedagogico es, para una sola mano, **renderizar solo esa voz como pieza de un
pentagrama** (no grand staff con la otra en silencio). Ventajas:
- El niño ve SOLO su clave, con notas mas grandes y sin distraccion.
- El sintetizador toca solo esa voz automaticamente (solo esa voz esta en el ABC).
- El motor de scroll ya esta validado para pieza de una voz (F1) — cero riesgo.
- "Ambas" = comportamiento actual (grand staff), ya validado (F2).

### Implementacion tecnica (lista para ejecutar)

Todo en **PianoPrompter.jsx** (no toca MusicPrompter ni el motor):

1. **Estado** `mano` ('ambas' | 'derecha' | 'izquierda'). Default: mostrar
   selector si la pieza es multi-voz; si es de una sola voz, saltar directo
   (comportamiento actual).
2. **Selector**: pantalla previa con 3 botones (solo si `isMultiVoice`). Al
   elegir, se setea `mano` y se muestra el `<MusicPrompter>`.
3. **`filtrarVoz(notas, voz)`** — nueva funcion:
   - Parsea las lineas de `notas`, agrupa las lineas de notas por su `V:N`
     (robusto a que una voz ocupe varias lineas o aparezca intercalada).
   - `'derecha'` → devuelve las notas de **V:1**, para armar single-staff
     `clef=treble` (reusa el branch NO-multivoz que ya existe en el componente).
   - `'izquierda'` → notas de **V:2**, single-staff `clef=bass` (la clave sale
     de la declaracion `V:2 clef=bass`).
   - `'ambas'` → devuelve `notas` sin cambio (grand staff, ruta actual).
4. Se pasa `multiVoice={mano === 'ambas' && isMultiVoice}` para que el motor
   trate una-mano como pieza sencilla.
5. **Boton "🔄 Cambiar mano"** dentro del prompter (o en la pantalla de fin)
   para volver al selector sin salir de la actividad.

### Casos borde a cuidar
- Anacrusa / silencios iniciales: preservarlos (en zapatillas V:2 abre con `z |`).
- Dinamicas `!mp!`/`!mf!` viven en V:1 → al filtrar izquierda simplemente no
  aparecen (correcto).
- Piezas de una sola voz (twinkle): sin selector, directo (como hoy).
- Confirmar que abcjs respeta `clef=bass` en el header de una sola voz (es
  estandar; ya se usa en el branch single-staff via `configuracion.clave`).

### Esfuerzo: ~1 sesion
- Solo PianoPrompter.jsx (estado + selector UI + `filtrarVoz`) + un poco de CSS.
- No requiere componente nuevo ni tocar el motor de scroll.
- Reversible: es una capa ANTES del prompter; si algo falla, el default 'ambas'
  reproduce la pieza como hoy.

---

## Feature: Digitacion (numeros de dedo) — ✅ FASE 1 CONSTRUIDA 2026-09-16

> **Historia:** anotado 2026-08-23 como bloqueado. El cuello de botella nunca fue
> tecnico sino la FUENTE de los numeros: dictarlos a mano resulto demasiado
> tedioso (probado con el usuario), y el MusicXML de Clair de Lune de checker.by
> trae CERO etiquetas (los numeritos que se ven en MuseScore eran del arreglo
> oficial de Keveren, no descargable). El disparador acordado era "encontrar una
> fuente que ya traiga la digitacion en datos".

**Fuente encontrada y VERIFICADA** (descargada e inspeccionada, no solo citada):

| Fuente | Que trae | Nota |
|--------|----------|------|
| [musetrainer/library](https://github.com/musetrainer/library) | 79 MusicXML de dominio publico. `scores/Fur_Elise_fingered.mxl` = **219 etiquetas `<fingering>`**; `WA_Mozart_Marche_Turque_..._fingered.mxl` | Rama `master`, no `main`. Tambien trae Gymnopedie No.1 y Gnossienne No.1 de Satie (repertorio de adulto) |
| [ThumbSet](https://explore.openaire.eu/search/result?pid=10.5281%2Fzenodo.6433702) | 2523 partituras de MuseScore con digitacion | Ruidosa; si dos piezas no bastan |
| [PIG dataset](https://arxiv.org/pdf/1904.10237) | 150 piezas anotadas por pianistas reales | Uso academico |

Estructura confirmada en el archivo real — es el estandar de MusicXML:

```xml
<note>
  <pitch><step>E</step><octave>5</octave></pitch>
  <staff>1</staff>
  <notations>
    <technical><fingering>4</fingering></technical>
  </notations>
</note>
```

Mapea directo a las decoraciones `!1!`..`!5!` de ABC (abcjs las maneja
explicitamente: `write/creation/decoration.js`, casos "0".."5").

> **Licencias — decision del usuario (2026-09-16):** el proyecto es de uso
> personal y, a lo mas, se comparte con amigos; no hay planes de venderlo. Con
> eso, usar estas partituras y su digitacion esta bien. **Si algun dia se piensa
> en vender, se revisa entonces que se puede y que no.** No volver a frenar
> contenido por licencias mientras ese sea el uso.

### Diseño acordado (2 fases)

- **Fase 1 — digitacion en la PARTITURA:** ✅ construida (ver abajo). Los numeros
  se deslizan con el PianoPrompter porque son parte del pentagrama.
- **Fase 2 — numero sobre la tecla iluminada:** requiere enlazar dedo↔nota en
  la linea de tiempo del teclado (correlacion por startChar o canal paralelo
  en el JSON). Solo si la Fase 1 demuestra ser util.

### Conversor `_piano/_mxl-a-abc.js` (Fase 1)

El conversor anterior vivio en un scratchpad y se perdio; este va en el repo.
Sin dependencias propias (descomprime el `.mxl` leyendo el ZIP con zlib; abcjs lo
toma de `chuy-react-app/node_modules`).

```
node _piano/_mxl-a-abc.js <archivo.mxl> --compases 0-24          # despliega repeticiones solo
node _piano/_mxl-a-abc.js <archivo.mxl> --forma "0-8,0-7,9-23,10-22,8" --salida ...json
node _piano/_genera-piezas.js                                     # regenera todas las piezas convertidas
```

**Que traduce:** notas, acordes, silencios, ligaduras, anacrusa (por
`implicit="yes"`, no adivinando), alteraciones (simula la regla "valen por octava
hasta la barra", verificada igual en abcjs), cambios de clave a media pieza
(`[K:clef=...]`, que conserva la armadura), repeticiones y casillas.

**Decisiones:**
- **Repeticiones DESPLEGADAS**, no con signos: un teleprompter se lee de corrido.
  Semantica de MuseScore (un `:|` sin `|:` vuelve al inicio, anacrusa incluida).
  En cada salto del orden se dibuja doble barra `||` como pista visual.
- `--forma` para extractos que cierran en la tonica (el despliegue literal de la
  seccion A de Für Elise termina en el compas 24, que lleva a la seccion B).
- **Digitacion ARRIBA en ambas manos** (la izquierda queda entre pentagramas).
  Se probo `%%ornament below`: abcjs pega los numeros a cabezas y plicas y se
  vuelven ilegibles (comparado con capturas de Chrome). En acordes se apilan de
  grave a agudo.
- Emite `K:` explicito en las notas multi-voz (ver bug de PianoPrompter abajo).
- La `unidad` (`L:`) es la figura mas grande que divide todas las duraciones.

**Falla RUIDOSAMENTE** ante lo que no sabe traducir, con el compas exacto:
notas de adorno, tresillos, notas guia, `<forward>`, varias voces en una mano,
cambios de compas/armadura a media pieza, compases que no suman. Pero solo si el
compas problematico **entra en lo pedido**: un adorno en el compas 25 no impide
convertir 0-24.

**Verificacion integrada — no escribe el JSON si falla:**
1. Toca el ABC generado con el abcjs de la app y compara nota por nota
   (altura + instante) contra el MusicXML **releido con un lector aparte**, sin
   compartir nada con el lector principal. (Una primera version comparaba contra
   el propio modelo y una prueba de mutacion demostro que no detectaba notas
   perdidas: por eso el lector independiente.)
2. Cuenta las digitaciones en el XML crudo contra las del ABC.
3. Si despliega repeticiones solo: genera tambien la version ESCRITA con signos
   de repeticion, deja que abcjs la despliegue por su cuenta y exige que suene
   identica a su despliegue.

**Prueba de mutacion (2026-09-16): 10/10 errores inyectados detectados** —
accidentes perdidos, octavas corridas (con y sin crash), duraciones al doble,
casillas que no avanzan, repeticion al compas equivocado, nota de acorde perdida
(incluso conservando su dedo para esquivar el conteo), dedo descartado, mano
izquierda desfasada.

**Pendiente (cuando una pieza lo pida):** notas de adorno y tresillos (abcjs los
soporta: `{g}A`, `(3abc`); con eso sale Für Elise completa (adornos en 25-36,
tresillos en 79-83).

### Catalogo musetrainer/library — diagnostico con el conversor (2026-09-16)

Se pasaron las **69 partituras** del repo por el conversor real. **9 convierten
completas** tal cual; el resto se detiene por (una pieza puede tener varios):
varias voces en una mano **38**, adornos **32**, tresillos **29**, `<forward>` **22**,
cambio de armadura 14, cambio de compas 10, otros 18. "Voces" es el bloqueo
dominante, pero sola destraba solo +5 piezas completas; voces + adornos +
tresillos destraba **+14**.

| Pieza (archivo) | Estado | Notas |
|---|---|---|
| Canon in D easy (Pachelbel) | ✅ **construida PA1-03** | **67 digitaciones**; Re mayor; `\|:45 48:\|` |
| Canon in D (arr. lemontart) | ✅ completa, 102 c. | semicorcheas, acordes de 4 — meta larga |
| Swan Lake (Tchaikovsky) | ✅ **construida PA1-04** (1-27) | una nota por mano a la vez; K Re → nombrar Bm |
| Passacaglia (Händel-Halvorsen) | ✅ completa, 74 c. | 13.9 notas/compas; `Passacaglia2` es duplicado |
| Ode to Joy easy variation | ✅ completa, 17 c. | Sol mayor, con izquierda (acordes de 3) |
| Happy Birthday C Major | ✅ completa, 8 c. | |
| Carol of the Bells easy piano | ✅ completa, 40 c. | |
| 12 Variations Twinkle (Mozart K.265) | ✅ **tema construido P4-02**; limpio 1-40 | tema = 1-24 (`\|:1 8:\| \|:9 24:\|`); voces desde 41 |
| Minuet in G BWV Anh. 114 (Petzold) | ✅ **seccion A construida PA1-05**; limpio 1-24 | seccion A (1-16) sale hoy; voces desde 25 |
| Hungarian Dance No. 5 (Brahms) | limpio 1-34 | voces desde 35 |
| Mozart K.545 Allegro | limpio 1-17 | compas 18 con `<alter>9</alter>`: **archivo corrupto** |
| Gymnopedie No.1 (Satie) | limpio 1-4 | voces desde 5 (ambos archivos) |
| Greensleeves easy | bloqueada | anacrusa sin `implicit` + tresillos; 14 dedos |
| Danse villageoise No.2 (Beethoven) | bloqueada | SOLO anacrusa sin `implicit` |
| Happy Birthday Piano | limpio 0-18 | SOLO compas final corto sin `implicit` |
| Carol of the Bells (Ross) | bloqueada | **bug**: ligadura que cruza un salto de repeticion (59→61) |
| The Entertainer (Joplin) | bloqueada | 2 `<part>` (una por mano); 96 dedos |

### Piezas construidas (track adulto)

| Archivo | Forma | Compases | Notas verificadas | Dedos |
|---------|-------|----------|-------------------|-------|
| `prompter/PA1-01_fur-elise-tema.json` | `0-8` | 9 | 53 | 24 |
| `prompter/PA1-02_fur-elise-seccion-a.json` | `0-8,0-7,9-23,10-22,8` | 46 | 294 | 101 |
| `prompter/PA1-03_canon-en-re.json` | `1-48,45-49` (despliegue automatico) | 53 | 471 | 71 |
| `prompter/PA1-04_lago-de-los-cisnes.json` | `1-27` | 27 | 326 | — |
| `prompter/PA1-05_minueto-en-sol-a.json` | `1-16` | 16 | 102 | — |
| `prompter/P4-02_twinkle-de-mozart.json` (hijo) | `1-24` | 24 | 96 | — |

**Lote 2 (2026-09-16)** — todas con verificacion nota por nota, revision visual y
prueba de punta a punta en Chrome (0 warnings; metronomo con 4/3/2 clicks por
compas y un acento por compas; cada mano sola suena igual que en la partitura):
- **Canon en Re** (easy): la izquierda es el bajo de Pachelbel arpegiado (Re La
  Si- Fa#- Sol Re Sol La); la derecha entra en el compas 5. Metronomo del
  arreglo: blanca = 50 → bpm 100.
- **El lago de los cisnes**: la armadura (2 #) dice Re, pero la pieza esta en
  **Si menor** → `tonalidad: Bm`. Los compases **28-32 del archivo estan vacios**
  en ambas manos: se corta en el 27, que cierra en Si.
- **Minueto en Sol, seccion A** (1-16, una vez; el original la repite). Sin
  metronomo marcado: "Allegro" y reproduccion a 126. Autor: Christian Petzold
  (atribuido antes a Bach).
- **Twinkle de Mozart** (P4-02, para el hijo): tema de las 12 Variaciones K.265,
  compases 1-24 una vez. La derecha suena una octava arriba de su Twinkle P1-01.

**Validadas por el usuario en la app (2026-09-16):** digitacion, cambios de clave,
repeticiones y metronomo con anacrusa en Für Elise. Falta que pruebe el metronomo
nuevo en Zapatillas Rojas (anacrusa) y Twinkle (regresion).

- 3/8 a **bpm 42**: abcjs cuenta el pulso en negras con puntillo → corchea = 126.
  La escalera al 50 % da corchea = 63.
- PA1-02 es la seccion A tal como esta escrita, pero **cierra con el compas 8**
  (La) en lugar del 24, que lleva a la seccion B. Esta dicho en su descripcion.
- En PA1-02 la izquierda pasa a clave de Sol en los compases 13-16 (en ambas
  pasadas) y regresa a Fa: verificado en capturas.
- Para cargarlas: `/admin/migracion` → coleccion Piano → subir cada archivo.

### Regla de diseño
La digitacion la pone un humano (maestra/usuario) o viene en los datos; la app
solo la muestra. Una digitacion auto-generada seria mediocre (la buena
digitacion es planeacion posicional).

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
