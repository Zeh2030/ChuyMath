# Plan Maestro ChuyMath - Actualizado 2026-08-13

Estado real de cada módulo y pendientes vivos. Los programas detallados viven en el
doc de cada materia (`_ciencias/PROGRAMA_CIENCIAS.md`, `_piano/PROGRAMA_PIANO.md`, etc.).

---

## 1. MATERIAS ✅ 7 ACTIVAS

MateriaToggle (`src/components/layout/MateriaToggle.jsx`):

| Materia | Colección Firebase | Contenido en disco | Estado |
|---------|-------------------|--------------------|--------|
| Matemáticas 🔢 | aventuras + simulacros + expediciones | `_contenido/` (71 JSONs) | ✅ |
| English 🇬🇧 | ingles | `_content/` (118 JSONs, A0 completo + A1-12) | ✅ |
| Piano 🎹 | piano | `_piano/` (33 JSONs) | ✅ |
| Ciencias 🔬 | ciencias | `_ciencias/` (32 JSONs: C0 y C1 completos) | ✅ |
| Arte 🎨 | dibujo | `_dibujo/` (73 JSONs, 4 tipos) | ✅ |
| Geo 🌍 | geografia | `_geografia/` (48 JSONs, 9 tipos) | ✅ |
| Letras 📖 | letras | `_letras/` (12 JSONs, L0+L1) | ✅ |

Además: **Modo Peques** (lanzador kid-safe con flag `esPeque`, colección `peques`,
motores tap-and-celebrate / cual-es-diferente / memoria / formas / etc.).

Alta de materia nueva: MateriaToggle + colección Firebase + reglas Firestore +
Dashboard accesos rápidos + Bóveda (loader, `detectMateria`, tiles) + AdminMigracion +
fallback en Aventura.jsx.

Alta de sub-sección dentro de una materia (ej. teoría de piano, astronomía en ciencias):
solo tiles con id prefijado en Bóveda/Dashboard (`piano-mini-story`, `ciencias-*`) —
misma colección, cero cambios de infraestructura.

---

## 2. TEMAS VISUALES ✅ (9 temas)

aventurero, princesa, espacial, océano, explorador, selva, arcoíris, elegante, pizarrón.
Fix reciente: texto blanco sobre caja blanca en temas oscuros (commit 767da4a).

---

## 3. MULTI-PERFIL ✅ EN MASTER

Una cuenta Google → varios perfiles de hijo (estilo Netflix). Commit 94847b0.
`accounts/{uid}` + `profiles/{profileId}` con `ownerUid`; `activeProfileId` en
localStorage; ProfileSelector "¿Quién va a jugar?"; alta/edición self-service.

**Pendiente operativo** (usuario, Firebase Console): desplegar `chuy-react-app/firestore.rules`
y correr el botón de migración una vez — sin eso la app no carga perfiles.
Fase 3 pendiente: PIN opcional de adulto.

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

### Pendiente
1. **Transcribir canciones del libro Yamaha 4** donde va el hijo (el usuario manda fotos).
2. Acordes de mano izquierda de Zapatillas Rojas (el usuario los dicta).
3. Validar al oído el selector de manos por separado.
4. `identifica-acorde` (reutiliza ~90% de identifica-nota).

---

## 6. INGLÉS

Hecho ✅: 11 tipos de juego, 118 JSONs (A0 completo + A1 hasta 12), filtros Bóveda.
Pendiente: A1-13 a A1-40 gradual según avance (Present Continuous, Can/Can't,
There is/are, Prepositions...). Alumno actualmente en Present Simple negativo (A1-10).

---

## 7. CIENCIAS

Componente `ExperimentoGuia.jsx` (wizard Portada → Predicción → Pasos → Observación →
Explicación → Quiz) + `mezclador-colores` como motor interactivo con retos.

| Nivel | Edad | Estado |
|-------|------|--------|
| C0 Mis Sentidos | 3-5 (hija) | ✅ Completo (10 + laboratorio de colores) |
| C1 Explorador | 5-7 (hijo) | ✅ Completo (20 + retos de color) |
| C2 Investigador | 7-9 | Pendiente (Lotes 4-5) — **siguiente para el hijo** |
| C3 Científico Jr. | 9-11 | Pendiente (Lotes 6-7) |

### 🔭 Astronomía (C2-21 a C2-30) — EN CONSTRUCCIÓN
Ramal con motor 3D propio (three.js, patrón Cubo3D + MezcladorColores):
- Tipo nuevo `sistema-solar`: escena `planetas` (Sol + 8 planetas procedurales,
  explorar + retos "toca el planeta...") y escena `tierra-luna` (fases lunares y
  eclipses con deslizador).
- Resto del lote con tipos existentes: image-picker (fotos reales por URL),
  mini-story, tap-the-pairs, opcion-multiple, experimento-guia (eclipse casero).
- Detalle completo en `_ciencias/PROGRAMA_CIENCIAS.md` §Astronomía.

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
- **Peques** (2-5 años): lanzador kid-safe, bundle Gimnasia Cerebral.
- **Letras** (hija ~4): motores `abecedario`, `letra-quiz` (un motor, campo `modo`),
  `silabas`; trazo = `colorear` con SVG punteado. L0 aprobado con la niña; **L1 (m,p,s,l)
  pendiente de probar con ella** → luego L2 + motores `arma-la-palabra` / `lee-y-elige`.
  Validador: `node _letras/_valida.js`. OJO: `_letras/` lleva acentos (se habla por TTS).

---

## 10. ORDEN DE PENDIENTES

| Prioridad | Tarea | Estado |
|-----------|-------|--------|
| **1** | Astronomía 3D (motor + lote C2-21..30) | 🔨 En construcción |
| **2** | Ciencias C2-01 a C2-10 (experimentos — destraba al hijo) | Pendiente |
| **3** | Piano: canciones Yamaha 4 (esperando fotos del usuario) | Bloqueado por usuario |
| **4** | Letras: probar L1 con la niña → L2 | Bloqueado por prueba |
| **5** | Inglés A1-13+ | Gradual |
| **6** | Multi-perfil: desplegar reglas + migración (Firebase Console) | Bloqueado por usuario |
| **7** | Logotipo app (favicon, PWA, splash) | Pendiente |
| **Futuro** | SaaS (pagos, registro, tenant isolation) | Futuro |

---

## Notas operativas

- Branch local `master` → push **`master:main`** (el remoto principal es main).
- Netlify: no usar comando `ignore` (canceló todos los deploys dos veces).
- Sospechar del traductor de Chrome ante bugs visuales raros (rompió Letras).
- three.js: solo geometría procedural + lazy import, nunca .glb ni texturas externas.
