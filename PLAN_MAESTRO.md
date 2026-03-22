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

MateriaToggle dinámico. Actualmente 3 botones: 🔢 Mates | 🇬🇧 English | 🎹 Piano

| Materia | Colección Firebase | Estado |
|---------|-------------------|--------|
| Matemáticas 🔢 | aventuras + simulacros | ✅ |
| English 🇬🇧 | ingles | ✅ |
| Piano 🎹 | piano | ✅ |
| Ciencias 🔬 | ciencias | Planeado |
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

## 5. CIENCIAS APLICADAS (NUEVO)

### Objetivo
Módulo de experimentos caseros para aprender física, química y biología de forma práctica. El niño sigue instrucciones paso a paso, hace predicciones, ejecuta el experimento y responde preguntas de comprensión.

### Formato: Tutorial interactivo paso a paso
A diferencia de los juegos existentes (respuesta rápida), ciencias es **guiado y secuencial**:

1. **Portada**: Título, imagen/emoji del experimento, materiales necesarios
2. **Predicción**: "¿Qué crees que pasará si...?" (el niño elige antes de experimentar)
3. **Pasos**: Instrucciones detalladas con emojis, cada paso con checkbox para marcar completado
4. **Observación**: "¿Qué pasó?" — el niño describe o selecciona lo que observó
5. **Explicación**: Concepto científico explicado para niño de 7 años
6. **Quiz**: 2-3 preguntas de comprensión (reutiliza true-or-false, fill-the-gap, opcion-multiple)

### Componente nuevo necesario
- `ExperimentoGuia.jsx` — tipo step-by-step wizard
- Registrar como `case 'experimento-guia'` en MisionRenderer
- Reutiliza componentes existentes para el quiz final

### Colección Firebase: `ciencias`
```json
{
  "id": "C1-01_volcán-de-vinagre",
  "titulo": "El Volcán de Vinagre",
  "materia": "ciencias",
  "nivel": "C1-01",
  "tema": "reacciones-quimicas",
  "misiones": [{
    "tipo": "experimento-guia",
    "titulo": "El Volcán de Vinagre",
    "materiales": ["Vinagre", "Bicarbonato", "Botella", "Colorante rojo"],
    "materiales_emoji": ["🫗", "🧂", "🍶", "🔴"],
    "prediccion": {
      "pregunta": "¿Qué crees que pase si mezclas vinagre con bicarbonato?",
      "opciones": ["No pasa nada", "Hace burbujas y espuma", "Se congela", "Cambia de color"]
    },
    "pasos": [
      { "instruccion": "Pon la botella sobre un plato", "emoji": "🍶" },
      { "instruccion": "Agrega 3 cucharadas de bicarbonato", "emoji": "🥄" },
      { "instruccion": "Agrega unas gotas de colorante rojo", "emoji": "🔴" },
      { "instruccion": "Vierte medio vaso de vinagre... ¡y observa!", "emoji": "🫗" }
    ],
    "explicacion": "El vinagre (ácido) reacciona con el bicarbonato (base) y produce gas CO₂. ¡Ese gas hace las burbujas! Es una reacción química.",
    "quiz": [
      { "tipo": "true-or-false", "pregunta": "La espuma se produce por un gas llamado CO₂", "respuesta": true },
      { "tipo": "opcion-multiple", "pregunta": "¿Qué tipo de reacción ocurrió?", "opciones": ["Magnética", "Química", "Eléctrica"], "respuesta": "Química" }
    ]
  }]
}
```

### Temas de experimentos propuestos

| Nivel | Tema | Experimentos ejemplo |
|-------|------|---------------------|
| C1-01 | Reacciones químicas | Volcán de vinagre, Leche mágica con colorante |
| C1-02 | Densidad | Torre de líquidos (miel, agua, aceite) |
| C1-03 | Magnetismo | ¿Qué atrae un imán? |
| C1-04 | Estados de la materia | Hielo → agua → vapor |
| C1-05 | Luz y color | Disco de Newton (mezcla de colores) |
| C1-06 | Fuerza y movimiento | Carrito con globo (acción-reacción) |
| C1-07 | Plantas | Germinación en algodón |
| C1-08 | Sonido | Teléfono con vasos y cuerda |
| C1-09 | Electricidad estática | Globo que atrae papelitos |
| C1-10 | Flotabilidad | ¿Qué flota y qué se hunde? |

### Esfuerzo estimado
- 1 sesión: componente ExperimentoGuia + integración (materia, toggle, migrador)
- 1-2 sesiones: contenido (10 experimentos C1-01 a C1-10)

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
| **7** | Ciencias: ExperimentoGuia + integración | 1 sesión | Pendiente |
| **8** | Ciencias: contenido (10 experimentos) | 1-2 sesiones | Pendiente |
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
