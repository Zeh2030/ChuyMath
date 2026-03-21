# Plan Maestro ChuyMath - Actualizado 2026-03-21

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

Implementación: CSS variables (`--theme-*`), `data-theme` en PageWrapper, selector en Perfil, overrides dark mode completos para espacial y pizarrón.

---

## 2. TOGGLE DE MATERIAS ✅ COMPLETADO

MateriaToggle con 3 botones: 🔢 Mates | 🇬🇧 English | 🎹 Piano

| Materia | Colección Firebase | Estado |
|---------|-------------------|--------|
| Matemáticas 🔢 | aventuras + simulacros | ✅ |
| English 🇬🇧 | ingles | ✅ |
| Piano 🎹 | piano | ✅ |
| Geografía 🌍 | geografia | Futuro |
| Historia 📜 | historia | Futuro |
| Dibujo 🎨 | dibujo | Futuro |

---

## 3. PIANO / TELEPROMPTER MUSICAL

### Completado ✅
- `abcjs` instalado y lazy-loaded (React.lazy + Suspense)
- MusicPrompter.jsx: ABC→SVG, scroll con rAF, playhead rojo al 25%
- Audio sintetizado (abcjs synth + FluidR3 SoundFont piano)
- Sincronización audio↔scroll usando `synth.duration` como fuente de verdad
- BPM reactivo: cambiar BPM re-crea synth + recalibra scroll
- Controles: Play/Pause/Reset, 🔊/🔇 sonido, ⛶ fullscreen
- Fullscreen: fondo oscuro, viewport expandido, controles grandes para tablet
- Indicador de tempo (🐢/🐇) + botón ↺ reset a BPM original
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
- Colección Firebase `ingles` separada
- Contenido A1-01 a A1-09 (Present Simple)
- Programa documentado (PROGRAMA_INGLES_GLOBAL.md, A1.md, GUIA_CREACION_INGLES.md)

### Pendiente - Contenido A0 (hija de 4 años)
- 8 unidades, ~38 JSONs
- Temas: Greetings, Colors, Numbers, Objects, Shapes, Family, Feelings, Body
- Tipos de juego: image-picker, tap-the-pairs, word-scramble, listen-and-type, fill-the-gap, word-bank

### Pendiente - Contenido A1
- Completar A1-09 a A1-12 (~25 JSONs)
- A1-13 a A1-40 (gradual, según avance del estudiante)

---

## 5. ORDEN DE IMPLEMENTACIÓN

| Fase | Tarea | Estado |
|------|-------|--------|
| ~~Temas visuales~~ | ~~9 temas con animaciones~~ | ✅ |
| ~~Toggle materias~~ | ~~3 materias~~ | ✅ |
| ~~Piano teleprompter~~ | ~~Core + audio + fullscreen~~ | ✅ |
| **Siguiente** | Contenido A0 inglés (~38 JSONs) | Pendiente |
| **Siguiente** | Contenido piano (10-15 canciones) | Pendiente |
| **Siguiente** | Completar A1-09 a A1-12 (~25 JSONs) | Pendiente |
| **Después** | Piano: clave de Fa (mano izquierda) | Pendiente |
| **Futuro** | Contenido A1-13 a A1-40 | Gradual |
| **Futuro** | Logotipo app (favicon, icono PWA, splash) | Pendiente |
| **Futuro** | Geografía, Historia, Dibujo | Por definir |
| **Futuro** | SaaS (pagos, registro, tenant isolation) | Por definir |

---

## Notación ABC - Referencia rápida

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
