# Arquitectura de Colecciones — Firestore

> Actualizado 2026-08. Este documento describe cómo funciona **hoy**.
> La versión anterior describía una colección por tipo de ejercicio
> (`conteo-figuras/`, `secuencias/`, `desarrollo-cubos/`…). Esa arquitectura
> se abandonó: se agrupa **por materia**, no por tipo de ejercicio.

---

## La idea en una línea

**Las carpetas de `_contenido/` son organización local. En Firestore todo se
agrupa por materia.**

Un archivo que vive en `_contenido/desarrollo-cubos/` NO se sube a una colección
`desarrollo-cubos`: se sube a `aventuras`, igual que uno de
`_contenido/kakooma/`. La carpeta solo te ayuda a encontrarlo al escribirlo.

---

## Colecciones que existen

| Colección | Qué guarda | Quién la lee |
|-----------|-----------|--------------|
| `aventuras` | Aventuras de matemáticas (todos los tipos de misión) | Dashboard, Bóveda, Aventura |
| `simulacros` | Exámenes de práctica | Bóveda, Simulacro |
| `ingles` | Módulo de inglés | Dashboard, Bóveda, Aventura |
| `piano` | Módulo de piano | Dashboard, Bóveda, Aventura |
| `ciencias` | Experimentos | Dashboard, Bóveda, Aventura |
| `dibujo` | Arte y dibujo | Dashboard, Bóveda, Aventura |
| `geografia` | Geografía | Dashboard, Bóveda, Aventura |
| `letras` | Letras y lectura | Dashboard, Bóveda, Aventura |
| `peques` | Modo Peques (2-5 años) | Peques |
| `profiles` | Perfil, racha, progreso | Toda la app |
| `accounts` | Cuenta (multi-perfil) | Auth |
| `whitelist` | Autorización de acceso | Login |

Son exactamente las mismas nueve que ofrece `AdminMigracion`, más las tres de
usuario. **No hay colecciones por tipo de ejercicio.**

---

## Cómo se carga un documento

`Aventura.jsx` recibe un id por la URL (`/aventura/:id`) y busca **en cadena por
materia**, en este orden:

```
aventuras → ingles → piano → ciencias → dibujo → geografia → letras
```

`Simulacro.jsx` busca solo en `simulacros`.
`Boveda.jsx` lee las ocho colecciones de contenido y filtra por materia con el
`MateriaToggle`.

Esto significa que **un documento en cualquier otra colección es inalcanzable**:
no hay pantalla que lo lea. Si migras algo a una colección que no está en esa
lista, no vas a poder abrirlo.

---

## Dónde migrar cada cosa

| Si escribiste... | Migra a la colección |
|------------------|----------------------|
| Cualquier JSON de `_contenido/<lo-que-sea>/` con `misiones` | **aventuras** |
| Cualquier JSON de `_contenido/simulacros/` con `problemas` | **simulacros** |
| `_content/` (inglés) | **ingles** |
| `_ciencias/`, `_dibujo/`, `_geografia/`, `_letras/`, `_piano/`, `_peques/` | la de su materia |

El campo `tipo` del JSON no decide la colección: decide qué componente lo
renderiza (ver `MisionRenderer.jsx`). La colección la eliges tú en
`/admin/migracion`.

---

## Reglas de Firestore

Las reglas siguen contemplando colecciones antiguas que ya nadie usa
(`conteo-figuras`, `secuencias`, `desarrollo-cubos`…). No estorban —solo son
reglas para colecciones vacías— pero se pueden limpiar cuando toque tocar las
reglas. Ver `FIRESTORE_REGLAS_ACTUALIZADAS.md`.
