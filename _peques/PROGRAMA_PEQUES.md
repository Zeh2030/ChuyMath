# Programa "Modo Peques" — Jueguitos para niños pequeños (2-5 años)

Una zona segura, sin lectura y sin anuncios, donde los niños chiquitos juegan Y aprenden
un poco. Reutiliza los motores y el contenido pre-lector que ChuyMath ya tiene, más unos
pocos "juguetes" nuevos ultra-simples.

---

## Por qué existe

**Problema real:** los peques piden el celular y acaban en juegos online llenos de anuncios
que paralizan el juego y no aportan nada. Queremos una alternativa: que si juegan, jueguen
en algo bonito, seguro y que enseñe aunque sea un poquito.

**Ventaja:** no partimos de cero. El inventario mostró que:
- 11 de los 30 motores ya funcionan para pre-lectores (2-5 años).
- Ya existen ~62 actividades aptas para peques (A0 inglés, C0 ciencias, D0 dibujo),
  pero están "enterradas" en módulos por materia que un niño de 3 no puede navegar.

**El hueco real no son motores ni contenido — es un LUGAR.** Modo Peques es ese lugar:
un lanzador kid-safe que junta lo que ya sirve + unos juguetes nuevos.

---

## A quién sirve (sub-niveles por edad)

| Nivel | Edad | Qué puede hacer | Enfoque |
|-------|------|-----------------|---------|
| P0 — Bebé | 2-3 | Tocar y que pase algo; pintar libre; oír sonidos | Causa-efecto, sensorial |
| P1 — Peque | 3-4 | + emparejar, contar hasta 5, colores, señalar imágenes | Reconocer, asociar |
| P2 — Peque grande | 4-5 | + memoria, puzzles, secuencias simples, contar hasta 10 | Primeros retos |

**Contexto familiar:** bebé de 2 años (P0), hija de ~4 en agosto (P1→P2). El hijo de 7 usa
los módulos normales, no este.

---

## Activación: flag de edad en el perfil

Aprovecha el sistema de perfiles (multi-perfil ya construido).

- Nuevo campo en `profiles`: **`esPeque: true`** (opcional `edad: number` para afinar P0/P1/P2).
- Se elige al **crear/editar** un perfil ("¿Es un niño pequeño?").
- Si el perfil activo tiene `esPeque: true`, la app **arranca directo en `/peques`** (Kid Mode),
  saltando el Dashboard normal. Los menús/Header normales se ocultan.
- **Candado de adultos** para salir de Modo Peques o cambiar de perfil: un gate que un niño de
  2-4 no pueda pasar (mantener presionado 3s, o "toca el 7", o resolver 3+4). Evita que el niño
  se meta a admin, a otros perfiles o cierre sesión.

---

## Kid Mode (el lanzador)

- Pantalla de **tarjetones grandes y coloridos**, con dibujo + sonido al tocar, **sin texto**
  (o texto mínimo que el adulto lee).
- Máximo **6-8 tarjetas** visibles (no abrumar). Se filtran por el sub-nivel (P0/P1/P2) del perfil.
- Cada tarjeta abre un juego **a pantalla completa**; botón "🏠 casa" grande para volver.
- **Sin puntajes ni presión.** Feedback siempre positivo. Sin cronómetros ni "rachas".

---

## Qué reutiliza (cero o casi cero código)

Cada tarjeta del lanzador puede apuntar a un motor y contenido que YA existen:

| Tarjeta | Motor existente | Contenido a reusar |
|---------|-----------------|--------------------|
| 🎨 Pintar | `colorear` / `dibujo-libre` | D0 (dibujo) |
| 🌈 Mezclar colores | `mezclador-colores` | C0-11 / D1-21 |
| 🔢 Contar | `conteo-figuras` / `numberblocks-constructor` | matemáticas |
| 🖼️ ¿Qué es? | `image-picker` (con audio TTS) | A0 (inglés) |
| 🧩 Emparejar | `tap-the-pairs` (versión sin palabras) | A0 / geografía |
| 🗺️ Explorar | `explorador-mapa` | geografía |

---

## Qué es nuevo (juguetes a crear, por prioridad)

Motores nuevos, todos mínimos y sin lectura:

| # | Tipo nuevo | Qué hace | Edad | Prioridad |
|---|-----------|----------|------|-----------|
| 1 | `tap-and-celebrate` | Tocar la pantalla → confeti + sonido. Causa-efecto puro. | 2-3 (P0) | **MVP** |
| 2 | `memoria` | Voltear 4-8 cartas y encontrar pares iguales. | 4-5 (P2) | Fase 2 |
| 3 | `sonidos` | Tocar animal/instrumento → suena (reúsa audio). | 2-4 | Fase 2 |
| 4 | `encuentra-diferencias` | Tocar las diferencias entre 2 imágenes. | 4-8 | Fase 2 (alto valor; cruza a módulos normales, sirve al de 7) |
| 5 | `colorea-por-clave` | Pintar cada zona según una clave de colores / copiar patrón. | 3-5 | Fase 2 (usa el lienzo existente) |
| 6 | `clasifica` | Arrastrar objeto a la caja correcta (color/forma). | 4-5 (P2) | Fase 3 |
| 7 | `laberinto` | Trazar el camino con el dedo hasta la meta. | 4-6 | Fase 3 |

---

## Inspiración: bundle "Gimnasia Cerebral" (atención y concentración)

Se revisó un pack imprimible comprado (6 módulos, ~380 hojas, edad ~4-8). Conclusiones:

- **Imprimir tal cual** (uso inmediato en casa): sopa de letras, crucigramas, cuadernillos
  terapéuticos, programas de atención. En papel están mejor y ya vienen listos.
- **Digitalizar la MECÁNICA** (con arte propio/libre, NO las imágenes del pack): encuentra las
  diferencias, colorea por clave / copia el patrón, laberintos. Ver tabla de tipos nuevos arriba.
- **Reusar motores existentes**: "une y pinta / conecta puntos" → páginas para `colorear`;
  "V o F sobre escena" → `true-or-false` + imagen; "rutinas/pictogramas" → juego de `secuencia`.

> ⚠️ **Derechos de autor:** el bundle es un producto pagado. Uso privado familiar (imprimir /
> app solo para los hijos) está bien. Para digitalizar, usar SOLO las ideas/mecánicas (no tienen
> copyright) con arte propio o de licencia libre. NO incrustar las imágenes del pack en la app,
> sobre todo si ChuyMath llega a ser público/SaaS.

---

## Modelo de datos

- **Colección Firebase nueva: `peques`** + carpeta de contenido **`_peques/`**.
- Cada "tarjeta" del lanzador es un JSON de una de dos clases:
  1. **Juego nativo peque:** `tipo` nuevo (`tap-and-celebrate`, `memoria`, `sonidos`, `clasifica`)
     con su propio contenido.
  2. **Atajo curado:** `{ "ref": { "coleccion": "dibujo", "id": "D0-06_sol-brillante" } }` que
     apunta a una actividad existente. El lanzador la carga y la renderiza con `MisionRenderer`.
     **Evita duplicar contenido** — surface, no copiar.
- Campo `edadMin` / `nivelPeque` (P0/P1/P2) por tarjeta para filtrar según el perfil.
- Campo `orden` para el orden en el lanzador.

```json
{
  "id": "peque-pintar",
  "tipo": "atajo",
  "titulo": "Pintar",
  "emoji": "🎨",
  "nivelPeque": "P0",
  "orden": 1,
  "ref": { "coleccion": "dibujo", "id": "D0-15_mi-familia" }
}
```

```json
{
  "id": "peque-toca-y-celebra",
  "tipo": "tap-and-celebrate",
  "titulo": "¡Toca!",
  "emoji": "✨",
  "nivelPeque": "P0",
  "orden": 2,
  "temas": ["confeti", "estrellas", "globos", "animales"]
}
```

---

## Progreso

Los peques **no necesitan puntaje ni rachas**. Guardado mínimo (opcional):
- Los dibujos ya se guardan (localStorage por perfil — ya funciona con multi-perfil).
- Nada de métricas de "engagement". Sesiones cortas por diseño.

---

## Seguridad y principios (lo que NO hacemos)

1. **Cero anuncios.** Cero enlaces externos. Cero compras.
2. **Candado de adultos** para salir de Modo Peques.
3. Sin bucles de enganche manipuladores; sin presión de tiempo.
4. Feedback siempre positivo (no hay "perdiste").
5. Audio/imagen de fuentes seguras (locales o libres).

---

## Fases de entrega

| Fase | Contenido | Resultado |
|------|-----------|-----------|
| **1 (MVP)** | Flag `esPeque` en perfil + Kid Mode launcher + candado de adultos + 4-5 atajos a actividades existentes + `tap-and-celebrate` | Usable YA por el bebé (2) y la hija (4) |
| 2 | Motores `memoria` y `sonidos` + 10-15 tarjetas más (curadas y nativas) | Módulo con variedad real |
| 3 | Motor `clasifica`, secuencias, afinar filtros por edad (P0/P1/P2) | Cobertura completa 2-5 años |

---

## Integración en ChuyMath (resumen técnico)

| Archivo | Cambio |
|---------|--------|
| `useAuth.jsx` / ProfileSelector | Campo `esPeque` (y `edad`) al crear/editar perfil |
| `App.jsx` | Ruta `/peques`; si `activeProfile.esPeque` → arrancar ahí; candado para salir |
| `pages/Peques.jsx` (nuevo) | El lanzador Kid Mode (tarjetones + filtro por nivel) |
| `MisionRenderer.jsx` | Nuevos `case`: `tap-and-celebrate` (Fase 1), luego `memoria`, `sonidos`, `clasifica` |
| Firestore | Colección `peques` + reglas (lectura autenticada) |
| `_peques/` | Contenido JSON (atajos + juegos nativos) |

### Carpetas
```
_peques/
  PROGRAMA_PEQUES.md      <- este archivo
  atajos/                 <- referencias a actividades existentes
  tap-and-celebrate/
  memoria/
  sonidos/
  clasifica/
```
