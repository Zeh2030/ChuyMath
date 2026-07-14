# Plan: Juegos avanzados (tipo Roblox / motores de juego)

> Documento de estrategia. **Es un plan a futuro**, no trabajo activo.
> Prioridad actual: pulir peques y luego mate / geografía / piano.
> Este doc se retoma cuando decidamos dar el salto. Última revisión: 2026-07.

---

## 0. Contexto y aclaración importante

La idea: eventualmente ChuyMath (o un proyecto hermano) podría tener **juegos
mucho más complejos** que los actuales (que son emoji + CSS + canvas simple),
al estilo de plataformas como Roblox.

**Aclaración clave:** "tipo Roblox" no es "JSON más difícil" ni una evolución
de los motores actuales. Es **otra disciplina completa**: motor 3D/2D, físicas,
red multijugador, pipeline de assets (modelos, sprites, audio), y moderación.
Nadie "hace un Roblox" — la gente hace juegos _sobre_ Roblox. Por eso las
opciones reales son tres caminos distintos (A, B, C), no una sola cosa.

**Restricción de contexto:** desarrollo en solitario, sin experiencia previa en
motores de juego, y el objetivo real es **que los niños aprendan y se diviertan**
(no construir una empresa de videojuegos). Todo el plan se optimiza para eso.

**Regla de oro transversal:** mantener todo **web (PWA)** siempre que se pueda.
Evita app stores, comisiones de Apple/Google, revisiones y builds nativos; todo
sigue viviendo bajo un login y un despliegue (Vercel/Netlify).

---

## Opción A — Publicar/enlazar en plataformas que ya existen

**Qué es:** no construimos el motor; usamos plataformas hechas y desde ChuyMath
solo **enlazamos** (o embebemos) las experiencias.

**Sub-opciones:**

- **Scratch** (recomendado como primer paso)
  - Editor visual de bloques, diseñado para niños. Gratis.
  - Doble beneficio: no solo se juega — **el hijo mayor puede CREAR sus propios
    juegos** ahí (aprende lógica y programación real). Enorme ganancia educativa.
  - Integración: se puede embeber el reproductor o simplemente enlazar al proyecto.
- **Roblox**
  - El niño lo amará como jugador; hay experiencias educativas.
  - _Crear_ ahí es Lua + 3D + multijugador **social con extraños** → moderación y
    seguridad son un tema serio a estas edades.
  - Postura: usarlo para **enlazar experiencias curadas**, no para invertir
    esfuerzo de desarrollo propio.
- Otras: PBS Kids Games, Toca Boca, Khan Academy Kids, etc. (curar y enlazar).

**Costo:** muy bajo. **Riesgo técnico:** bajo. **Aprendizaje requerido:** poco.
**Control/consistencia de marca:** bajo (vives en la plataforma ajena).

**Cuándo tiene sentido:** para validar rápido si a los niños les engancha ese
nivel de juego, sin invertir en desarrollo. Es el "solo agrega un link" que
propuso Jesús — y es sensato.

---

## Opción B — Juegos 2D/3D ricos DENTRO de ChuyMath  *(recomendada para el salto real)*

**Qué es:** metemos juegos de verdad **dentro de la app actual**, con un motor
real, sin salir del ecosistema: mismo login, mismos perfiles, mismo Firebase,
sin app store.

**Herramientas candidatas (todas funcionan en el Vite/React actual):**

- **Phaser** — motor 2D maduro. El punto dulce para juegos educativos:
  plataformas, físicas simples, puzzles, arcade. **Primera elección.**
- **PixiJS** — render 2D de bajo nivel (si se quiere algo muy custom).
- **Three.js / react-three-fiber** — 3D ligero en el navegador, integrable con
  React. Para cuando de verdad se necesite 3D.

**Por qué es el 80/20:**
- **No es un desvío** del plan de "pulir mate, geografía, piano" — es su
  **nivel-up**. Ejemplos naturales:
  - Geografía → mapa interactivo / explorador.
  - Mate → un plataformas donde avanzas resolviendo operaciones.
  - Piano → juego de ritmo (notas que caen, tipo Guitar Hero suave).
- Un "módulo de juegos complejos" aquí es una **adición incremental** a lo que ya
  existe (un nuevo `tipo` en el `MisionRenderer`), **no un rewrite**.

**Costo:** medio. **Riesgo:** medio (curva de aprendizaje del motor + assets).
**Control/consistencia:** alto (todo vive en tu app).

**Primer piloto sugerido:** UN solo juego con Phaser que potencie un módulo que
ya tienes (candidato: geografía = mapa interactivo, o piano = juego de ritmo).
Un juego bien hecho enseña el motor y dice si vale la pena un módulo entero.

---

## Opción C — Módulo/app de juegos SEPARADO (nativo o standalone)

**Qué es:** en vez de vivir dentro de ChuyMath web, los juegos complejos serían
un **proyecto aparte**: una app nativa (iOS/Android con Unity/Godot/React Native
+ motor), o un sitio/aplicación de juegos independiente, enlazado desde ChuyMath.

**Formas que podría tomar:**
- App nativa con **Unity** o **Godot** (motores completos 2D/3D) publicada en
  las tiendas.
- Proyecto web separado con su propio dominio/despliegue, enlazado desde ChuyMath.
- Un backend/servidor propio si hubiera multijugador de verdad.

**Ventajas:** máxima potencia (3D, rendimiento nativo, físicas serias),
separación de responsabilidades (no infla la app principal).

**Costos/desventajas (por los que hoy NO se justifica):**
- App stores: cuentas de desarrollador de pago, revisiones, comisiones, builds
  nativos, actualizaciones más lentas.
- Duplicas infra: otro login/perfiles/almacenamiento, o integrarlos entre dos
  sistemas.
- Curva de aprendizaje mucho mayor (Unity/Godot + C#/GDScript).
- Moderación/privacidad si hay multijugador o contenido social.

**Postura actual:** **descartada por ahora.** Solo se reconsideraría si (1) el
piloto de B demuestra tracción fuerte, y (2) se necesita 3D/rendimiento que el
navegador no da, o (3) el proyecto deja de ser "para mis hijos" y se vuelve
producto serio con equipo. *(Sección a desarrollar más a fondo si llegamos aquí.)*

---

## Comparativo rápido

| Criterio            | A (enlazar) | B (Phaser en la app) | C (separado/nativo) |
|---------------------|-------------|----------------------|---------------------|
| Costo/esfuerzo      | Muy bajo    | Medio                | Alto                |
| Aprendizaje nuevo   | Poco        | Medio                | Mucho               |
| Control/marca       | Bajo        | Alto                 | Alto                |
| Riesgo              | Bajo        | Medio                | Alto                |
| Reusa login/perfiles| No          | **Sí**               | No (o integrar)     |
| App store           | No          | No (PWA)             | Sí (probable)       |
| Potencia máxima     | (la de ellos)| Media-alta          | Máxima              |

---

## Recomendación y secuencia

1. **Ahora:** terminar peques y pulir mate / geografía / piano. (Plan acordado.)
2. **Primer paso hacia "complejo" (bajo riesgo):** enlazar 2-3 juegos de
   **Scratch** (Opción A) — y que el hijo mayor cree uno. Forma barata de validar
   el interés.
3. **Salto real:** piloto con **Phaser** (Opción B) de _un_ juego que potencie un
   módulo existente (empezar por geografía o piano).
4. **Opción C:** solo si B demuestra tracción y aparece una necesidad real
   (3D/rendimiento/producto). Desarrollar esta sección entonces.

---

## Notas / pendientes para retomar

- Definir el primer juego piloto de Phaser (¿geografía-mapa o piano-ritmo?).
- Revisar seguridad/moderación antes de enlazar cualquier plataforma social.
- Ver cómo embeber Scratch (iframe del player) vs. solo enlazar.
- Estimar peso del bundle si se añade Phaser (carga diferida / lazy import).
- Este documento se cruza con `plan_futuro_materias_piano_temas` (memoria) y
  `arquitectura.md`.
