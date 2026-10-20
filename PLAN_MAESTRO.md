# Plan Maestro ChuyMath - Actualizado 2026-10-07

Estado real de cada módulo y pendientes vivos. Los programas detallados viven en el
doc de cada materia (`_ciencias/PROGRAMA_CIENCIAS.md`, `_piano/PROGRAMA_PIANO.md`, etc.).

**El estado vive aquí, no en los chats.** Un chat se puede perder; para retomar un
frente se abre uno nuevo con "lee PLAN_MAESTRO §X y el PROGRAMA de la materia" y se
cierra actualizando la sección de estado del doc. Mapa de frentes en §13.

---

## 1. MATERIAS ✅ 7 ACTIVAS

MateriaToggle (`src/components/layout/MateriaToggle.jsx`):

| Materia | Colección Firebase | Contenido en disco | Estado |
|---------|-------------------|--------------------|--------|
| Matemáticas 🔢 | aventuras + simulacros + expediciones | `_contenido/` (71 JSONs) | ✅ |
| English 🇬🇧 | ingles | `_content/` (118 JSONs, A0 completo + A1-12) | ✅ |
| Piano 🎹 | piano | `_piano/` (44 JSONs) | ✅ |
| Ciencias 🔬 | ciencias | `_ciencias/` (59 JSONs: C0 y C1 completos + 27 de astronomía) | ✅ |
| Arte 🎨 | dibujo | `_dibujo/` (73 JSONs, 4 tipos) | ✅ |
| Geo 🌍 | geografia | `_geografia/` (53 JSONs, 9 tipos) | ✅ |
| Letras 📖 | letras | `_letras/` (16 actividades: L0, L1, LF y L2) | ✅ |

Además: **Modo Peques** (lanzador kid-safe con flag `esPeque`, colección `peques`,
motores tap-and-celebrate / cual-es-diferente / memoria / formas / etc.).

Alta de materia nueva: MateriaToggle + colección Firebase + reglas Firestore +
Dashboard accesos rápidos + Bóveda (loader, `detectMateria`, tiles) + AdminMigracion +
fallback en Aventura.jsx.

Alta de sub-sección dentro de una materia (ej. teoría de piano, astronomía en ciencias):
solo tiles con id prefijado en Bóveda/Dashboard (`piano-mini-story`, `ciencias-*`) —
misma colección, cero cambios de infraestructura.

---

## 2. TEMAS VISUALES ✅ (14 temas)

**Para niños (10)**: aventurero, princesa, espacial, océano, explorador, selva,
arcoíris, elegante, pizarrón, **guerreras** (Guerreras K-pop, pedido de la hija:
violeta/magenta/cian neón, silueta de Seúl en `public/temas/guerreras-ciudad.svg`,
reflectores de concierto y destellos ✦).
**Sobrios / adultos (4)**: piano (marfil-ébano-latón, fondo con pentagrama),
vinilo (crema-naranja-teal), cuaderno (papel rayado, tinta índigo),
bauhaus (hueso + primarios planos).

Fix reciente: texto blanco sobre caja blanca en temas oscuros (commit 767da4a).

**Alta de un tema = 4 puntos de registro** (no uno):
1. `src/styles/themes.css` — bloque `[data-theme="<id>"]` con los 30 tokens.
2. `src/components/layout/PageWrapper.css` — `.bg-<id>`, que es el **fondo real**
   de la página. OJO: `--theme-bg` está definido en los 13 temas y **no lo consume
   nadie**; es código muerto. Los patrones de fondo van aquí.
3. `src/pages/Perfil.jsx` — array del selector. Campo opcional `swatch` (un
   `background` CSS completo) para temas que no se explican con dos colores;
   si no, `color1`/`color2`.
4. `src/components/layout/PageWrapper.jsx` — cadena de ternarios de escenografía.
   **El `else` son 3 nubes**: un tema nuevo las hereda si no se le contempla.
   Los 4 sobrios se saltan con el set `SIN_ESCENOGRAFIA`.

Solo 16 de los 30 tokens se consumen. Los dominantes son `--theme-grad-1/-2`
(widgets grandes del dashboard, pestaña activa, header de Bóveda) y
`--theme-active` (chips de filtro y spinner).

**Costo**: un tema **claro** es ~30 líneas y cero overrides (los 11 claros no
tienen ninguno). Un tema **oscuro** cuesta ~45-48 reglas de override cada uno
(espacial y pizarrón lo pagaron), porque la app tiene ~102 `background: white` y
~127 declaraciones de texto oscuro hardcodeados.

**Atajo para temas oscuros (2026-10-14)**: los overrides de espacial se
generalizaron a `:is([data-theme="espacial"], [data-theme="guerreras"])` con
colores en 7 variables `--oscuro-*` (panel/hondo/borde en RGB, borde sólido, 3
tonos de texto) definidas en el bloque de tokens de cada tema. Un tema oscuro
nuevo = sus tokens + esas 7 variables + agregarlo a cada `:is()` y a los arreglos
de image-picker / sistema-solar. Pizarrón sigue aparte (bordes punteados).

---

## 3. MULTI-PERFIL ✅ EN MASTER

Una cuenta Google → varios perfiles de hijo (estilo Netflix). Commit 94847b0.
`accounts/{uid}` + `profiles/{profileId}` con `ownerUid`; `activeProfileId` en
localStorage; ProfileSelector "¿Quién va a jugar?"; alta/edición self-service.

**Reglas desplegadas ✅** (verificado 2026-10-07: lo publicado en Firebase Console
coincide con `chuy-react-app/firestore.rules`). La migración del perfil legacy es
automática al iniciar sesión (`useAuth.jsx` le pone `ownerUid`), no hay botón que correr.

**2026-10-20: `whitelist` cerrada en el repo** — antes era de lectura pública (cualquiera
listaba los correos autorizados); ahora cada quien lee solo su entrada y listar es de
admin. **Falta publicarla en Firebase Console** (Firestore → Reglas → pegar el archivo).

Pendiente: Fase 3, PIN opcional de adulto. Una materia nueva con colección propia
(ej. `aleman`) necesita su bloque en las reglas **y volver a publicarlas** en la consola.

---

## 4. MATEMÁTICAS — CUBOS 3D ✅

- `Cubo3D.jsx`: three.js **procedural + lazy** — el plano se dobla solapa a solapa
  (tocándolas o con deslizador) y el cubo se gira libre por cuaternión.
- 5 aventuras de desarrollo-cubos (fácil → experto → vista desde la esquina) con
  tipos: caras opuestas, ¿cuál plano SÍ forma un cubo?, orientación alrededor del vértice.
- Regla de uso de three.js (dónde sí / dónde no): memoria del proyecto
  `three_js_donde_si_donde_no`. Geografía NO usa three (globo con `geoOrthographic` de d3-geo).

---

## 5. PIANO

### Hecho ✅
- Teleprompter con motor "Enfoque 4" (mapa tiempo→posición vía `setTiming` + reloj
  AudioContext), validado al oído a 1 y 2 manos. Historial: `_piano/HISTORIAL_TELEPROMPTER.md`.
- Selector de manos (derecha / izquierda / ambas) en piezas multi-voz.
- `identifica-nota`: 13 lecciones (P1→P4, sostenidos/bemoles, graves, agudas, rango amplio).
- Teoría con tipos reutilizados: mini-story compositores (7), tap-the-pairs, fill-the-gap,
  opcion-multiple, true-or-false, image-picker.
- **Herramientas de práctica (2026-08-27/28)**: metrónomo con acento y cuenta de
  entrada, y bucle A-B que se reescala al cambiar el BPM. Validadas al oído por
  el usuario, compás compuesto incluido (Clair de Lune 9/8 marca 3, Twinkle 4).
  Todo en `MusicPrompter.jsx`; contenido y `PianoPrompter` sin tocar.
  Escalera de tempo (50-100% del original): validada 2026-09-16.
  Detalle y decisiones en `_piano/PROGRAMA_PIANO.md` §Herramientas de práctica.
- **Digitación Fase 1 (2026-09-16)**: conversor `_piano/_mxl-a-abc.js` (MusicXML →
  ABC con `<fingering>` → `!N!`, repeticiones desplegadas, cambios de clave) con
  verificación nota por nota integrada contra un lector independiente del XML y
  prueba de mutación 10/10. Piezas `PA1-01` Für Elise · El tema y `PA1-02` Sección
  A completa. **Lote 2**: PA1-03 Canon en Re, PA1-04 El lago de los cisnes, PA1-05
  Minueto en Sol (A) y P4-02 Twinkle de Mozart (hijo). Todas se regeneran con
  `node _piano/_genera-piezas.js`. Faltan adornos y tresillos
  (catalogo de 69 partituras diagnosticado en PROGRAMA_PIANO).
- **Dos voces por mano (2026-09-18)**: bajo sostenido + acorde en la misma mano.
  Formato `%%staves {(1 2) (3 4)}` (la mano la decide el grupo; lo anterior sale
  idéntico), `x` donde una voz calla, plicas por altura. Conversor con mutación
  17/17; selector de manos y teclado por pentagrama. Arreglado de paso el salto
  hacia atrás al final del scroll con dos voces. Piezas nuevas: **PA1-06** Minueto
  completo, **PA2-01** Gymnopédie n.º 1, **PA2-02** Preludio en Do de Bach.
  Catálogo: 9 → 14 partituras convertibles. Detalle en PROGRAMA_PIANO §Dos voces
  por mano.
- **Metrónomo con anacrusa (2026-09-16)**: el acento caía en el tiempo equivocado
  en piezas con anacrusa — incluida **Zapatillas Rojas**. Ahora sigue los compases
  reales de abcjs; 3/8 se subdivide en corcheas; la cuenta de entrada continúa la
  rejilla. Regresión exacta en Twinkle y Clair de Lune (Chrome headless).
- **Bug de tonalidad en PianoPrompter** (2026-09-16): un cambio de clave en línea
  impedía insertar la armadura; en una pieza en Sol se perdía el Fa#.
- **Layout y scroll (2026-09-16)**: la partitura se centra y escala al espacio
  disponible (la mano izquierda ya no se corta); BPM con "↺ original" debajo;
  arreglado el salto hacia atrás en intros con silencio de compás completo
  (Canon, Lago de los cisnes).
- **Digitación Fase 2 (2026-09-17)**: el número del dedo sobre la tecla iluminada
  (enlace por `startChar`, sin adivinar). **Cambiar el tempo tocando ya no pausa.**
- **Teclado brillante/tenue + pedal en la Gymnopédie (2026-09-18)**: una nota larga
  brilla al tocarse (450 ms) y queda tenue mientras suena; las cortas nunca se
  atenúan. Se ve el salto de la mano (bajo con pedal → acorde). La instrucción de
  PA2-01 explica el pedal (el MusicXML no lo marca).
- **Avance de pieza manual (2026-09-18)**: en piano, que la pieza termine de sonar
  ya NO la completa. El alumno marca 🔄 Practicando (automático al abrir) ·
  🟡 Casi la tengo · ✅ Ya la domino, en la pantalla de manos, debajo del prompter y
  al final. Todos los perfiles. "Ya la domino" = la completada de siempre
  (bitácora, racha). `aventurasProgreso[id].status` admite `'casi'`; la aventura del
  día usa ese estado, así una pieza que se baja de "dominada" vuelve a proponerse.
- **Pistas Niños / Adultos (2026-09-16)**: casilla "Es un adulto" en el perfil
  (`esAdulto`) + selector `🧒 Niños | 🎼 Adultos` en Piano. Nada se bloquea. PA →
  adultos; lectura de notas → ambas; compositores y teoría → niños; Clair de Lune
  pasa a PA3-01. La aventura del día respeta la pista. Paso 1 del "modo papás":
  hoy solo afecta Piano. Detalle en `_piano/PROGRAMA_PIANO.md` §Track ADULTO.

### Track ADULTO (`PA1`..`PA4`) — decidido 2026-08-28
El papá aprende piano en la misma plataforma. **No es "básico vs avanzado"**: un
adulto principiante es principiante; cambia el ritmo, la secuencia y el tono.
Separación por prefijo de nivel (`PA` no colisiona con `P1..P5` en el filtro de
Bóveda). **Sin menú previo** — le cobraría un clic al hijo para servir al papá;
el perfil activo ya es el mecanismo. Programa completo en `_piano/PROGRAMA_PIANO.md`.

Hallazgo que manda en el diseño: los adultos abandonan por falta de **estructura
de práctica** y por **culpa**, no por dificultad → el perfil adulto no lleva
rachas ni estrellas, y las herramientas de práctica son la función de retención.

### Pendiente
1. **Probar en el piano**: ✅ Für Elise (PA1-01/02) y escalera de tempo validadas
   (2026-09-16). Falta: metrónomo nuevo en Zapatillas Rojas (anacrusa) y Twinkle;
   el lote 2 (Canon, Cisnes, Minueto A, Twinkle de Mozart); y las pistas
   Niños/Adultos (marcar "Es un adulto" en el perfil del papá, re-migrar Twinkle,
   Zapatillas, Clair de Lune y las 2 de prueba). Dos voces por mano: subir PA1-06,
   PA2-01 y PA2-02, y resubir PA1-01/02; probar cada mano sola en la Gymnopédie y
   el Preludio. Re-migrar PA2-01 (instrucción del pedal) y ver en el piano si el
   brillante/tenue del teclado (450 ms, opacidad 0.35) se siente bien, también en
   una pieza rápida (Minueto a 126).
   Licencias: uso personal + amigos, sin venta → no es impedimento; se revisa solo
   si algún día se vende (decisión del usuario 2026-09-16).
2. **Modo espera (entrada del alumno)** — el hueco real: la app nunca oye. Ya NO
   requiere hardware MIDI (corrección: los apps líderes usan micrófono; verificar
   contra notas esperadas es mucho más fácil que transcribir).
3. Diario de práctica **sin rachas** (minutos y tempo alcanzado).
4. **Transcribir canciones del libro Yamaha 4** donde va el hijo (el usuario manda fotos).
5. Acordes de mano izquierda de Zapatillas Rojas (el usuario los dicta).
6. Validar al oído el selector de manos por separado.
7. `identifica-acorde` (reutiliza ~90% de identifica-nota).
8. Conversor: huecos en la voz principal (destrabaría el *Clair de Lune* de
   Debussy y otras 6), adornos, tresillos, ligaduras dentro de acordes.

### Fuentes de repertorio (dominio público)
- [musetrainer/library](https://github.com/musetrainer/library) — 79 MusicXML, 2 con
  digitación. Trae Satie (Gymnopédie, Gnossienne), repertorio de adulto.
- [Mutopia](https://www.mutopiaproject.org/) — 2124 piezas, >⅓ piano. **Ojo: LilyPond
  + PDF + MIDI, NO MusicXML** — el camino sería MIDI→ABC, no MusicXML→ABC.
- ⚠️ Einaudi y Yann Tiersen están en derechos. El repo es público.

---

## 6. INGLÉS

Hecho ✅: 11 tipos de juego, 118 JSONs (A0 completo + A1 hasta 12), filtros Bóveda.
Pendiente: completar A1-10, A1-11 y A1-12 (hoy parciales: solo 2 tipos de juego cada
una, contra 9 de A1-09); luego A1-13 a A1-40 gradual según avance (Daily Routines,
Telling Time, Sports, Jobs, Present Continuous, Can/Can't...). El programa A1-2
(`PROGRAMA_INGLES_A1-2.md`) no está escrito. Alumno actualmente en Present Simple
negativo (A1-10). La conversación por voz (§12) también sirve a inglés.

---

## 7. CIENCIAS

Componente `ExperimentoGuia.jsx` (wizard Portada → Predicción → Pasos → Observación →
Explicación → Quiz) + `mezclador-colores` como motor interactivo con retos.

| Nivel | Edad | Estado |
|-------|------|--------|
| C0 Mis Sentidos | 3-5 (hija) | ✅ Completo (10 + laboratorio de colores) |
| C1 Explorador | 5-7 (hijo) | ✅ Completo (20 + retos de color) |
| C2 Investigador | 7-9 | Experimentos C2-01..20 **pendientes (0 de 20)** — siguiente para el hijo |
| C3 Científico Jr. | 9-11 | Experimentos C3-01..20 pendientes (Lotes 6-7) |

Ojo para C2: tres experimentos duran días (C2-12 cristales, C2-16 fotosíntesis,
C2-18 moho) y piden un paso "espera X días y vuelve" que el wizard no tiene.

### 🔭 Astronomía ✅ CONSTRUIDA (C2-21..42 y C3-21..25, 27 unidades)
Ramal con motor 3D propio (three.js, patrón Cubo3D + MezcladorColores):
- Tipo `sistema-solar` con 18 escenas: planetas (con tamaño real y distancias
  reales), tierra-luna, estaciones, constelaciones, cometa, satélite, estrellas,
  agujero-negro, cama-elástica, exoplanetas, asteroides, impacto, big-bang,
  nace-un-sol, trompos, día-noche y carrera.
- El resto con tipos existentes: image-picker (fotos reales de Wikimedia),
  mini-story, tap-the-pairs, opcion-multiple, experimento-guia.
- Detalle completo en `_ciencias/PROGRAMA_CIENCIAS.md` §Astronomía.

### 🔭 Observatorio (telescopio) — FRENTE NUEVO, decidido 2026-10-07
La familia compró un **Sky-Watcher Heritage 150** (reflector Dobson de mesa; 150 mm
de apertura, f/5, focal 750 mm). Oculares de serie: 25 mm (30×) y 10 mm (75×).
Sitio de observación: Jerez, Zacatecas (~22.65° N, 103.0° O, ~2,000 m).

Accesorios que el usuario va a pedir (2026-10-07): ocular SVBONY gran angular de
6 mm (125×), adaptador de celular Celestron NexYZ y filtro polarizador variable
SVBONY SV128. Consecuencias para el diseño: el planificador recomienda ocular por
objeto con la lista real de oculares, y la bitácora guarda **fotos** tomadas con el
celular (Firebase Storage — la misma plomería que la galería "Mis Dibujos" de §9).
Regla de seguridad para todo el contenido: el polarizador NO es filtro solar;
ninguna misión apunta al Sol.

**Decisión: sección dentro de Ciencias, ni materia propia ni app aparte.** Una
sub-sección solo cuesta tiles; el selector de materias ya tiene 7. Una app aparte
solo tendría sentido si se compartiera con gente que no usa la app de los niños.

Son dos piezas distintas:
1. **Misiones de observación** — solo contenido, con `experimento-guia` (ya trae
   Predicción → Pasos → Observación → Explicación). Luna y terminador, lunas de
   Júpiter, anillos de Saturno, Pléyades, nebulosa de Orión, estrellas dobles.
   Enlazan con las escenas 3D ("lo viste en el motor, ahora velo de verdad").
   Primero van las de manejo: armar, colimar, apuntar con el buscador.
2. **Planificador "¿qué vemos hoy?"** — página de herramienta, no tipo de misión.
   Sin IA y sin backend: efemérides calculadas en el navegador (qué está arriba,
   a qué hora, a qué altura, fase de la Luna), nubosidad por hora de un servicio
   gratuito tipo Open-Meteo, y los datos del telescopio para filtrar qué objetos
   alcanza y con qué aumento. Bitácora de observación **de la familia** (en
   `accounts/{uid}`), no de un solo perfil.

**Hecho 2026-10-20**: Lote A de misiones (OB-01..07, validadas) y el planificador
en `/observatorio` (acceso desde Hoy → Ciencias). Primera luz de la familia: la Luna
en cuarto creciente el 18 de octubre, ya con mesa propia.
**Decidido**: bitácora familiar; Mercurio y Venus fuera (pegados al Sol); horario
entre semana 19:30-22:00 y viernes/sábado la noche entera solo si hay algo
excepcional (eclipse, pico de una lluvia grande).
**Siguiente**: el usuario migra OB-01..07 en AdminMigracion; luego Fase 3
(bitácora + pasaporte + insignias) y Lote B antes de diciembre.
Detalle completo en `_ciencias/PROGRAMA_CIENCIAS.md` §Observatorio.
Accesorios: ocular 6 mm, NexYZ y SV128 llegan el fin de semana del 24-25 de oct;
pendientes de compra: herramienta de colimación y manga para el tubo.

No reconstruir un planetario (Stellarium ya existe): lo propio es la misión de la
noche para niños más la bitácora. El modo nocturno rojo va local a la página, no
como tema global (un tema oscuro cuesta ~48 overrides, ver §2).

---

## 8. GEOGRAFÍA ✅ CONSTRUIDA

- `ExploradorMapa.jsx` con mapas por continente + **globo terráqueo girable**
  (`geoOrthographic`, d3-geo, sin three.js).
- 48 JSONs en 9 tipos (explorador-mapa, expediciones, image-picker con banderas
  flagcdn, tap-the-pairs, mini-story, opcion-multiple, true-or-false, fill-the-gap,
  word-scramble). Niveles G0-G2 en marcha; G3 pendiente.
- Programa: `_geografia/PROGRAMA_GEOGRAFIA.md`.

---

## 9. ARTE / DIBUJO ✅ · PEQUES ✅ · LETRAS ✅

- **Dibujo**: SVG-first (SVGs propios, sin descargas), 73 JSONs en colorear /
  dibujo-guiado / dibujo-libre / mezclador-colores. Galería en `public/dibujo/galeria.html`.
  D0, D1 y D2 completos. Sin urgencias; lo que ameritaría chat propio:
  (a) **galería "Mis Dibujos"** — hoy el dibujo vive en localStorage y se
  sobrescribe; falta Firebase Storage + vista entre dispositivos; (b) **nivel D3**
  completo (20 actividades, 9-11 años); (c) lienzo: opacidad, deshacer y zoom.
  El siguiente lote de teoría del color (complementarios, cálido/frío) es solo contenido.
- **Peques** (2-5 años): lanzador kid-safe, bundle Gimnasia Cerebral. Pendiente de
  baja prioridad: motores `clasifica` y `laberinto`.
- **Letras** (hija ~4): motores `abecedario`, `letra-quiz` (un motor, campo `modo`),
  `silabas`, `rimas` y `arma-la-palabra`; trazo = `colorear` con SVG punteado.
  L0 aprobado con la niña; L1, LF y L2 construidos. **Pendiente: probar LF y L2 con
  ella** → si fluye, consonantes t, n, d, r, c (solo contenido) y luego números.
  Validador: `node _letras/_valida.js`. OJO: `_letras/` lleva acentos (se habla por TTS).

---

## 10. ORDEN DE PENDIENTES

| Prioridad | Tarea | Estado |
|-----------|-------|--------|
| **1** | Ciencias C2-01 a C2-10 (experimentos — destraba al hijo) | Pendiente |
| **2** | Observatorio: bitácora, pasaporte e insignias; Lote B (§7) | Lote A + planificador hechos |
| **3** | Alemán para el papá: programa + piloto (§11) | Nuevo, esperando índice de los libros |
| **4** | Conversación por voz, piloto en alemán adulto (§12) | Nuevo, sin empezar |
| **5** | Inglés: completar A1-10..12, luego A1-13+ | Gradual |
| **6** | Piano: probar lo construido en el piano; canciones Yamaha 4 (fotos del usuario) | Bloqueado por usuario |
| **7** | Letras: probar LF y L2 con la niña → más consonantes | Bloqueado por prueba |
| **8** | Dibujo: galería "Mis Dibujos" (Firebase Storage) | Cuando se quiera |
| **9** | Multi-perfil Fase 3: PIN de adulto | Pendiente |
| **Futuro** | SaaS (pagos, registro, tenant isolation) | Futuro |

Cerrado desde la versión anterior: astronomía 3D (27 unidades), logotipo propio
(favicon e icono de app; la app se llama "Chuy & Lucy's World"), reglas de
Firestore de multi-perfil desplegadas.

---

## 11. ALEMÁN (adulto) — FRENTE NUEVO, decidido 2026-10-07

**Para el papá, no para los niños.** Llegó a B2 y obtuvo el Zertifikat Deutsch hace
más de 10 años; lleva 1 año en Duolingo y quiere retomar desde cero. Lo que siente
flojo: **gramática y práctica**. Eso manda el diseño: no es un curso de vocabulario
por temas como el inglés de los niños.

- Es un falso principiante: avanzar rápido por A1-A2 con la gramática como
  columna (casos, género, orden de la frase, verbos separables, Perfekt) y bajar
  la velocidad donde falle, no recorrer 40 unidades al ritmo de un niño.
- Fuente del programa: el **índice de sus libros de alemán** (el usuario manda
  fotos de los tomos A1 y A2). Son libros de adulto, así que aplican directo.
- Perfil adulto (`esAdulto`): sin rachas ni estrellas, igual que el track PA de piano.
- Motores de inglés reutilizables tal cual: fill-the-gap, sentence-transform,
  verb-conjugator, word-bank (ideal para el orden de la frase), listen-and-type,
  mini-story. Lo que el inglés no tiene y habrá que resolver: **der/die/das y la
  declinación por caso**, y ä/ö/ü/ß en los juegos de escribir. Voz TTS `de-DE`.
- Infraestructura: alta de materia completa (ver §1) con colección propia, y
  publicar las reglas de Firestore. **Decidido 2026-10-07: la materia se muestra
  solo a perfiles adultos** (`esAdulto`); los niños no la ven en el selector.
- En espera hasta que el usuario mande las fotos del índice de los libros.
- La práctica oral es el frente de §12; este frente es el que le da el vocabulario
  y la gramática de cada unidad.

---

## 12. CONVERSACIÓN POR VOZ (alemán e inglés) — FRENTE NUEVO, decidido 2026-10-07

Conversar en voz alta con una IA dentro de la app. Factible con la Live API de
Gemini (voz a voz en tiempo real, con interrupciones). Nada construido.

- **Piloto: el papá en alemán.** Un adulto que calibra el sistema antes de dárselo
  a los niños; además evita de entrada la duda de los términos de uso con menores.
- **La llave de la API no puede ir en el cliente** (el repo es público y el sitio
  es estático). Camino a verificar primero: Firebase AI Logic, que llama a Gemini
  desde el SDK de Firebase sin backend propio — confirmar que soporta la Live API
  en web. Plan B: una Netlify Function que emita tokens efímeros.
- Verificar al construir: precios vigentes del audio y los términos de la API
  respecto a menores de 18 antes de abrirlo a los niños.
- Diseño: no es chat libre. Escenas cortas (3-5 min) atadas a la unidad en curso,
  con su vocabulario y gramática en el prompt, corrección por reformulación y un
  resumen al final (2-3 errores a trabajar). Para los niños, además, límite de
  tiempo y transcripción visible para el papá.
- Es la primera función de la app que usa micrófono; el modo espera de piano (§5)
  será la segunda. Comparten el permiso y la captura, no el procesamiento.

---

## 13. MAPA DE FRENTES (un chat por frente)

| Frente | Qué sigue | Leer al abrir |
|--------|-----------|---------------|
| Ciencias C2 | Experimentos C2-01..10 | §7 + `_ciencias/PROGRAMA_CIENCIAS.md` |
| Observatorio | Fase 3: bitácora familiar, pasaporte e insignias; luego Lote B | §7 + `_ciencias/PROGRAMA_CIENCIAS.md` §Observatorio |
| Alemán | Programa a partir del índice de los libros; piloto | §11 + `_content/docs/GUIA_CREACION_INGLES.md` (motores) |
| Voz | Verificar Firebase AI Logic + Live API; piloto alemán | §12 |
| Inglés | Completar A1-10..12; A1-13..16 | §6 + `_content/docs/PROGRAMA_INGLES_A1.md` |
| Piano | Lista de §5 (chat vivo) | §5 + `_piano/PROGRAMA_PIANO.md` |
| Letras | Resultado de la prueba de LF y L2 | §9 + `_letras/PROGRAMA_LETRAS.md` |
| Dibujo | Galería, D3 o lienzo (ninguno urgente) | §9 + `_dibujo/PROGRAMA_DIBUJO.md` |
| Plataforma | PIN de adulto, modo papás, temas | §2, §3 |
| Geografía | Nada; G3 cuando aplique | §8 + `_geografia/PROGRAMA_GEOGRAFIA.md` |

---

## Notas operativas

- Branch local `master` → push **`master:main`** (el remoto principal es main).
- Netlify: no usar comando `ignore` (canceló todos los deploys dos veces).
- Sospechar del traductor de Chrome ante bugs visuales raros (rompió Letras).
- three.js: solo geometría procedural + lazy import, nunca .glb ni texturas externas.
