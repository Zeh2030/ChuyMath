---
name: crear-simulacro
description: Genera un nuevo archivo JSON de simulacro para ChuyMath
argument-hint: "[tema] [grado] [cantidad de problemas]"
---

Genera un nuevo archivo JSON de simulacro para la aplicación ChuyMath.

El usuario proporcionará: $ARGUMENTS

Genera un simulacro completo siguiendo estas reglas:

### Estructura del JSON

```json
{
  "id": "simulador-[tema]-[numero]",
  "titulo": "Título descriptivo del simulacro",
  "descripcion": "Descripción breve del simulacro.",
  "problemas": []
}
```

### Tipos de problemas soportados

#### 1. Opción múltiple (texto)
```json
{
  "id": "problema-N",
  "tipo": "opcion-multiple",
  "pregunta": "Texto de la pregunta",
  "opciones": ["opción1", "opción2", "opción3", "opción4", "opción5"],
  "respuesta": "INDICE_BASE_0",
  "explicacion_correcta": "Retroalimentación positiva cuando acierta",
  "explicacion_incorrecta": "Explicación de por qué la respuesta correcta es esa"
}
```

#### 2. Opción múltiple con imágenes SVG
```json
{
  "id": "problema-N",
  "tipo": "opcion-multiple",
  "pregunta": "Texto de la pregunta",
  "imagen": "<svg>...</svg>",
  "opciones_son_imagenes": true,
  "opciones": ["<svg>...</svg>", "<svg>...</svg>", ...],
  "respuesta": "INDICE_BASE_0",
  "explicacion_correcta": "...",
  "explicacion_incorrecta": "..."
}
```

#### 3. Navegación en mapa
```json
{
  "id": "problema-N",
  "tipo": "navegacion-mapa",
  "pregunta": "Texto describiendo movimientos en un mapa",
  "configuracion_mapa": {
    "columnas": 10,
    "filas": 8,
    "punto_inicio": {"fila": 3, "columna": 6, "icono": "🏠"},
    "puntos_interes": [
      {"nombre": "Lugar", "fila": 6, "columna": 4, "icono": "📚"}
    ],
    "movimientos": ["sur", "sur", "oeste"],
    "respuesta_correcta": "Nombre del lugar destino"
  }
}
```

### Reglas de generación

1. **Campo `respuesta`**: Es un STRING con el ÍNDICE base 0 de la opción correcta en el array `opciones`. Ejemplo: si la respuesta correcta es la tercera opción, `"respuesta": "2"`.
2. **Cantidad de problemas**: Genera entre 10 y 20 problemas por simulacro.
3. **Variedad**: Mezcla diferentes tipos de problemas. Prioriza `opcion-multiple` pero incluye al menos 1 problema de otro tipo si es apropiado.
4. **Opciones**: Cada problema debe tener exactamente 5 opciones (para opcion-multiple).
5. **Explicaciones**: Incluye `explicacion_correcta` y `explicacion_incorrecta` en todos los problemas que puedas. El tono debe ser amigable y motivador (es para niños).
6. **SVG**: Si usas imágenes SVG, deben ser inline, simples, y usar viewBox. No usar comillas dobles dentro del SVG (usar comillas simples).
7. **ID del simulacro**: Formato `simulador-[tema]-[numero]`. Ejemplo: `simulador-fracciones-1`.
8. **Nivel**: Adapta la dificultad al grado escolar indicado (primaria, 1ro-6to grado).

### Ubicación del archivo

Guarda el JSON en: `_contenido/simulacros/[id-del-simulacro].json`

### Después de crear

Indica al usuario:
1. El archivo fue guardado en `_contenido/simulacros/`
2. Para usarlo: ir a `http://localhost:5173/admin/migracion` (o el puerto que esté usando Vite)
3. Seleccionar "Simulacro", pegar el contenido del JSON, y hacer clic en "Migrar Simulacro"
4. Acceder en: `/simulacro/[id-del-simulacro]`
