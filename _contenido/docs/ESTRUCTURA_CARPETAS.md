# Estructura de Carpetas — Contenido de Matemáticas

> Actualizado 2026-08 (se corrigió la lista de carpetas y unos caracteres rotos
> por encoding).

## Lo primero, para no perder tiempo

**Estas carpetas son organización local, no colecciones de Firestore.**
Da igual en cuál escribas el JSON: al migrarlo eliges **`aventuras`** (si tiene
`misiones`) o **`simulacros`** (si tiene `problemas`). No existe una colección
`desarrollo-cubos` ni `kakooma` ni ninguna otra por tipo de ejercicio.

Ver [ARQUITECTURA_COLECCIONES.md](ARQUITECTURA_COLECCIONES.md).

---

## Carpetas

| Carpeta | Contenido |
|---------|-----------|
| `aventuras/` | Aventuras diarias con varias misiones mezcladas |
| `simulacros/` | Exámenes completos (variados o de un solo tipo) |
| `angulo-explorer/` | Ángulos |
| `area-constructor/` | Área y perímetro |
| `conteo-figuras/` | Conteo de figuras |
| `criptoaritmetica/` | Criptoaritmética |
| `desarrollo-cubos/` | Desarrollo de cubos (visión espacial) |
| `fraccion-explorer/` | Fracciones — exploración |
| `fraccion-operaciones/` | Fracciones — operaciones |
| `kakooma/` | Kakooma |
| `numberblocks-constructor/` | Numberblocks |
| `operaciones/` | Operaciones |
| `secuencias/` | Secuencias y patrones |
| `tablas-doble-entrada/` | Tablas de doble entrada (lógica) |
| `docs/` | Documentación y guías |

Las demás materias viven fuera de `_contenido/`: `_content/` (inglés),
`_ciencias/`, `_dibujo/`, `_geografia/`, `_letras/`, `_piano/`, `_peques/`.

---

## Convención de nombres

**Aventuras y tipos específicos:** solo la fecha — `2025-11-10.json`.
La fecha marca el **orden de dificultad** (cronológico = progresión), y el
sistema ordena por ella: la más antigua es la más fácil.

**Simulacros:** nombre descriptivo — `simulador-desafio-integral-1.json`.
Cualquier nombre vale, pero el JSON debe traer su campo `tipo`.

---

## Importante

- **El `id` dentro del JSON es el id del documento en Firestore**, no el nombre
  del archivo. Procura que coincidan para no volverte loco.
- **No dupliques ids:** migrar un JSON con un id existente lo sobrescribe.
- La fecha del nombre es organización local, no la fecha de publicación.

---

## Flujo de trabajo

1. Crear el JSON en la carpeta que le corresponda por tipo.
2. Ir a `/admin/migracion`, elegir **aventuras** o **simulacros**, pegar y migrar.
3. Abrirlo en `/aventura/<id>` o `/simulacro/<id>` para comprobarlo.

El campo `tipo` del JSON no decide la colección: decide **qué componente lo
dibuja** (ver `MisionRenderer.jsx`).
