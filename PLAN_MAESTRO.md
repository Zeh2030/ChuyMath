# Plan Maestro ChuyMath - Actualizado 2026-03-22

---

## 1. TEMAS VISUALES ✅ COMPLETADO

9 temas implementados:

| # | Tema | Animación | Estado |
|---|------|-----------|--------|
| 1 | `aventurero` | ☁️ Nubes flotantes | ✅ |
| 2 | `princesa` | ✨ Destellos dorados | ✅ |
| 3 | `espacial` | 🌟 Estrellas + planeta (dark mode) | ✅ |
| 4 | `oceano` | 🫧 14 burbujas (12-45px) | ✅ |
| 5 | `explorador` | 🍃 Hojas cayendo | ✅ |
| 6 | `selva` | 🦋 Mariposas | ✅ |
| 7 | `arcoiris` | 🌈 Burbujas de colores + fondo arcoíris | ✅ |
| 8 | `elegante` | ✨ Motas de polvo dorado | ✅ |
| 9 | `pizarron` | 📝 Símbolos de tiza (π,√,∞) + textura (dark mode) | ✅ |

---

## 2. TOGGLE DE MATERIAS ✅ COMPLETADO (expandible)

MateriaToggle dinámico. Actualmente 4 botones: 🔢 Mates | 🇬🇧 English | 🎹 Piano | 🔬 Ciencias

| Materia | Colección Firebase | Estado |
|---------|-------------------|--------|
| Matemáticas 🔢 | aventuras + simulacros | ✅ |
| English 🇬🇧 | ingles | ✅ |
| Piano 🎹 | piano | ✅ |
| Ciencias 🔬 | ciencias | ✅ |
| Geografía 🌍 | geografia | Planeado |

Agregar nueva materia requiere: MateriaToggle entry, colección Firebase, reglas Firestore, Dashboard acceso rápido, Bóveda loader, AdminMigracion radio button, Aventura.jsx fallback.

---

## 3. PIANO / TELEPROMPTER MUSICAL

### Completado ✅
- `abcjs` instalado y lazy-loaded (React.lazy + Suspense)
- MusicPrompter.jsx: ABC→SVG, scroll con rAF, playhead rojo al 25%
- Audio sintetizado (abcjs synth + FluidR3 SoundFont piano)
- Sincronización audio↔scroll usando `synth.duration` como fuente de verdad
- Primera nota alineada con playhead (compensa preámbulo clave+compás)
- BPM reactivo: cambiar BPM re-crea synth + recalibra scroll
- Controles: Play/Pause/Reset, 🔊/🔇 sonido, ⛶ fullscreen
- Fullscreen: fondo oscuro, viewport expandido, controles grandes para tablet
- Integrado: Dashboard, Bóveda, MateriaToggle, AdminMigracion, Aventura.jsx

### Pendiente - Contenido
Crear 10-15 canciones progresivas:

| Nivel | Descripción | Ejemplo |
|-------|-------------|---------|
| P1-01 | Solo Do (C) | Ejercicio de una nota |
| P1-02 | Do-Re (C-D) | Dos notas |
| P1-03 | Do-Re-Mi (C-D-E) | Mary Had a Little Lamb |
| P1-04 | Do-Re-Mi-Fa-Sol | Twinkle Twinkle ✅ |
| P1-05 | Escala completa | Hot Cross Buns |
| P1-06 | Mano izquierda (clave de Fa) | Ejercicios básicos |
| P1-07 | Ambas manos | Coordinación |
| P2-01+ | Canciones populares | Melodías conocidas |

### Pendiente - Clave de Fa (mano izquierda)
- Segunda línea de pentagrama (clave de Fa) debajo de la de Sol
- Acordes o melodía de mano izquierda con mismo teleprompter
- Requiere ABC con dos voces: `V:1 clef=treble` + `V:2 clef=bass`
- abcjs soporta múltiples voces nativamente
- Aplica a partir de nivel P1-06

---

## 4. INGLÉS

### Completado ✅
- 11 tipos de juego implementados
- 118 JSONs de contenido (A0-01 a A1-12)
- Colección Firebase `ingles` separada
- Filtros por nivel (A0/A1 + subniveles) y búsqueda en Bóveda
- Programa documentado (PROGRAMA_INGLES_GLOBAL.md, A1.md, GUIA_CREACION_INGLES.md)
- Plan detallado A0 en `PLAN_INGLES_A0.md`

### Pendiente - Contenido A1
- A1-13 a A1-40 (gradual, según avance del estudiante)
- Temas pendientes: Present Continuous, Can/Can't, There is/are, Prepositions, etc.

---

## 5. CIENCIAS APLICADAS ✅ COMPONENTE LISTO

### Completado ✅
- `ExperimentoGuia.jsx` — wizard paso a paso (Portada → Predicción → Pasos → Observación → Explicación → Quiz → Fin)
- Registrado como `case 'experimento-guia'` en MisionRenderer
- Integrado en: MateriaToggle, Dashboard, Bóveda, AdminMigración, Aventura.jsx
- Colección Firebase: `ciencias`
- Programa completo: `_ciencias/PROGRAMA_CIENCIAS.md` (4 niveles, 70 experimentos)

### Niveles

| Nivel | Nombre | Edad | Experimentos | Estado |
|-------|--------|------|--------------|--------|
| C0 | Mis Sentidos | 3-5 años (hija) | 10 | ✅ **Completo** (10/10) |
| C1 | Explorador | 5-7 años (hijo, inicio) | 20 | ✅ **Completo** (20/20) |
| C2 | Investigador | 7-9 años | 20 | Planeado |
| C3 | Científico Jr. | 9-11 años | 20 | Planeado |

### Contenido creado

| Archivo | Nivel | Tema |
|---------|-------|------|
| `C1-01_volcan-de-vinagre.json` | C1-01 | Reacciones químicas |
| `C1-02_torre-de-liquidos.json` | C1-02 | Densidad |
| `C1-03_que-atrae-un-iman.json` | C1-03 | Magnetismo |
| `C1-04_flota-o-se-hunde.json` | C1-04 | Flotabilidad |
| `C1-05_hielo-agua-vapor.json` | C1-05 | Estados de materia |
| `C1-06_separando-mezclas.json` | C1-06 | Mezclas |
| `C1-07_el-aire-ocupa-espacio.json` | C1-07 | Aire |
| `C1-08_arcoiris-casero.json` | C1-08 | Luz y color |
| `C1-09_telefono-de-vasos.json` | C1-09 | Sonido |
| `C1-10_semilla-en-algodon.json` | C1-10 | Plantas |

| `C1-11_globo-magico.json` | C1-11 | Electricidad estatica |
| `C1-12_carrito-de-globo.json` | C1-12 | Fuerza (accion-reaccion) |
| `C1-13_carrera-de-caidas.json` | C1-13 | Gravedad |
| `C1-14_que-absorbe-mas.json` | C1-14 | Absorcion |
| `C1-15_leche-magica.json` | C1-15 | Quimica de cocina |
| `C1-16_huevo-en-botella.json` | C1-16 | Presion de aire |
| `C1-17_flores-que-cambian-de-color.json` | C1-17 | Capilaridad |
| `C1-18_barcos-de-papel-aluminio.json` | C1-18 | Superficie y flotacion |
| `C1-19_derretir-hielo-rapido.json` | C1-19 | Temperatura |
| `C1-20_mini-terrario.json` | C1-20 | Ecosistema |

### Pendiente - Contenido
- C1 completo (20/20) ✅
- Siguiente: Lote 3 — C0-01 a C0-10 (Mis Sentidos, para hija) o Lote 4 — C2-01 a C2-10
- Producción en lotes de 10, ritmo 1 experimento/semana
- Ver `_ciencias/PROGRAMA_CIENCIAS.md` para programa completo

---

## 6. GEOGRAFÍA

### Objetivo
Aprender países, capitales, cultura, ríos, montañas y datos curiosos de forma visual e interactiva.

### Formato: Juegos existentes + componente de exploración de mapa

#### Juegos que ya sirven (solo contenido nuevo):
- `image-picker`: ¿De qué país es esta bandera? (URLs de imágenes de banderas)
- `tap-the-pairs`: País↔Capital, País↔Continente
- `fill-the-gap`: "La capital de Japón es ___"
- `true-or-false`: "Brasil está en Europa" → Falso
- `word-scramble`: Nombres de países/capitales

#### Componente nuevo: `ExploradorMapa.jsx`
- Mapa SVG interactivo (por continente)
- Click en un país → muestra tarjeta con:
  - Bandera (imagen URL)
  - Capital
  - Idioma
  - Datos curiosos (comida típica, animal emblemático, monumento)
  - Ríos y montañas principales
- Quiz integrado al explorar

### Imágenes
- **Banderas**: URLs públicas (ej: flagcdn.com o similar)
- **Fotos de cultura/monumentos**: URLs o Firebase Storage si es necesario
- Los juegos tipo `image-picker` ya soportan `imagen_url` en los retos

### Colección Firebase: `geografia`

### Temas propuestos

| Nivel | Tema | Contenido |
|-------|------|-----------|
| G1-01 | Mi país (México) | Estados, comida, cultura |
| G1-02 | América del Norte | México, USA, Canadá |
| G1-03 | América del Sur | Brasil, Argentina, Perú, Colombia |
| G1-04 | Europa | España, Francia, Italia, Alemania, UK |
| G1-05 | Asia | Japón, China, India |
| G1-06 | Continentes y océanos | Vista global |
| G1-07 | Ríos del mundo | Nilo, Amazonas, Misisipi |
| G1-08 | Montañas del mundo | Everest, Andes, Alpes |

### Esfuerzo estimado
- 1-2 sesiones: ExploradorMapa + integración
- 2-3 sesiones: contenido (mapas SVG + datos de países + quizzes)
- Mapas SVG: usar librerías open source o simplificados

---

## 7. BÓVEDA ✅ MEJORADA

### Completado
- Filtros por nivel (chips A0/A1 + subniveles expandibles)
- Búsqueda por título, tema, nivel o descripción
- Filtros combinables (tipo + nivel + búsqueda)

---

## 8. ORDEN DE IMPLEMENTACIÓN GLOBAL

| Prioridad | Tarea | Esfuerzo | Estado |
|-----------|-------|----------|--------|
| ~~1~~ | ~~Temas visuales (9 temas)~~ | — | ✅ |
| ~~2~~ | ~~Toggle materias (3)~~ | — | ✅ |
| ~~3~~ | ~~Piano teleprompter~~ | — | ✅ |
| ~~4~~ | ~~Contenido inglés A0-A1 (118 JSONs)~~ | — | ✅ |
| ~~5~~ | ~~Filtros Bóveda (nivel + búsqueda)~~ | — | ✅ |
| **6** | Contenido piano (10-15 canciones) | 1-2 sesiones | Pendiente |
| ~~7~~ | ~~Ciencias: ExperimentoGuia + integración~~ | — | ✅ |
| ~~8~~ | ~~Ciencias: contenido C1-01 a C1-10 (Lote 1)~~ | — | ✅ |
| **9** | Geografía: ExploradorMapa + integración | 1-2 sesiones | Pendiente |
| **10** | Geografía: contenido (mapas + datos) | 2-3 sesiones | Pendiente |
| **11** | Piano: clave de Fa (mano izquierda) | 1 sesión | Pendiente |
| **12** | Contenido A1-13 a A1-40 | Gradual | Pendiente |
| **13** | Logotipo app (favicon, PWA, splash) | 1 sesión | Pendiente |
| **Futuro** | SaaS (pagos, registro, tenant isolation) | Por definir | Futuro |

---

## Apéndice: Notación ABC (Piano)

| Símbolo | Significado |
|---------|-------------|
| C D E F G A B | Notas centrales (Do Re Mi Fa Sol La Si) |
| c d e f g a b | Octava arriba |
| C2 | Blanca (2 beats) |
| C4 | Redonda (4 beats) |
| C/2 | Corchea (medio beat) |
| z | Silencio (1 beat) |
| \| | Separador de compás |
| \|] | Fin de canción |
| ^F | Fa sostenido |
| _B | Si bemol |
