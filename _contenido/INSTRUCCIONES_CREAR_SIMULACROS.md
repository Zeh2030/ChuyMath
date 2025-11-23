# Guía para Crear Nuevos Simulacros

Esta guía explica cómo crear archivos JSON para añadir nuevos simulacros a "El Mundo de Chuy".

## Estructura del Archivo JSON

Cada simulacro es un archivo `.json` independiente (ej: `simulador-matematicas-3.json`).

### Plantilla Básica

```json
{
  "id": "simulador-tema-nivel",
  "titulo": "Título del Simulacro",
  "descripcion": "Breve descripción de lo que el niño aprenderá o practicará.",
  "problemas": [
    {
      "id": "p-1",
      "tipo": "opcion-multiple",
      "pregunta": "¿Pregunta del problema?",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuesta": "1",
      "explicacion_correcta": "¡Muy bien! Explicación de por qué es correcto.",
      "explicacion_incorrecta": "Pista o explicación de por qué es incorrecto."
    }
    // ... más problemas ...
  ]
}
```

## Reglas Importantes

### 1. Campo `respuesta` (¡Muy Importante!)
Para preguntas de **opción múltiple**, el campo `respuesta` debe ser **SIEMPRE el ÍNDICE de la opción correcta**, guardado como texto.

Los índices empiezan a contar desde 0:
- 1ra opción = "0"
- 2da opción = "1"
- 3ra opción = "2"
- 4ta opción = "3"

**Ejemplo Correcto:**
```json
"opciones": ["Manzana", "Pera", "Uva"],
"respuesta": "1"  // La respuesta correcta es "Pera" (índice 1)
```

**Ejemplo INCORRECTO (No usar):**
```json
"respuesta": "Pera" // NO usar el texto de la respuesta
"respuesta": 1      // Preferible usar comillas "1"
```

### 2. IDs Únicos
- El `id` del simulacro debe ser único en todo el sistema.
- Los `id` de los problemas (`p-1`, `p-2`) deben ser únicos dentro del simulacro.

### 3. Tipos de Problemas Soportados
- `"opcion-multiple"`: Pregunta estándar con botones de opciones.
- `"navegacion-mapa"`: Misión interactiva de mover un personaje en una cuadrícula.

### 4. Imágenes y SVG
Puedes usar código SVG directamente en las opciones o preguntas si estableces `"opciones_son_imagenes": true`.

## Cómo Subir el Simulacro
1. Guarda tu archivo `.json` en tu computadora.
2. Abre la aplicación web e inicia sesión como administrador.
3. Ve a la página `/admin/migracion` (o busca el botón de Admin/Migración).
4. Selecciona "Simulacro" en el tipo de contenido.
5. Sube tu archivo JSON.

