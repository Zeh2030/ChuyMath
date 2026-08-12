# ⚠️ OBSOLETO — Router genérico de contenido

**Este documento ya no describe el código.** Se conserva solo como historia.

Describía un router que buscaba cada documento en 8 colecciones nombradas por
tipo de ejercicio:

```
aventuras → conteo-figuras → secuencias → operaciones →
criptoaritmetica → balanza-logica → desarrollo-cubos → palabra-del-dia
```

Eso **se quitó**. Hoy `Aventura.jsx` busca por **materia**:

```
aventuras → ingles → piano → ciencias → dibujo → geografia → letras
```

Y `AdminMigracion` ya no ofrece destinos por tipo de ejercicio: solo las nueve
colecciones de materia.

Consecuencia práctica: si migras un JSON a una colección con nombre de tipo de
ejercicio (`desarrollo-cubos`, `secuencias`…), **la app no lo va a encontrar**.
Todo el contenido de matemáticas va a `aventuras` o a `simulacros`, sin importar
en qué carpeta de `_contenido/` lo hayas escrito.

👉 Ver **[ARQUITECTURA_COLECCIONES.md](ARQUITECTURA_COLECCIONES.md)**.

---

<details>
<summary>Texto original (2025), para referencia histórica</summary>

El router genérico se creó porque `Aventura.jsx` solo buscaba en `aventuras/` y
`Simulacro.jsx` solo en `simulacros/`, así que el contenido migrado a
colecciones por tipo daba "No se encontró el contenido". La solución de entonces
fue recorrer todas las colecciones hasta encontrar el documento.

Más tarde el proyecto creció a varias materias (inglés, piano, ciencias, dibujo,
geografía, letras) y se reorganizó por materia, que es lo que hay ahora.

</details>
