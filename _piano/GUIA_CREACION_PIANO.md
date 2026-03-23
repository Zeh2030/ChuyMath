# Guía para Crear Contenido de Piano

Guía técnica para crear JSONs de partituras para el teleprompter de piano en ChuyMath.

## Estructura del JSON

```json
{
  "id": "piano-nombre-cancion",
  "titulo": "Nombre de la Canción",
  "misiones": [
    {
      "id": "cancion-01",
      "tipo": "piano-prompter",
      "titulo": "Nombre de la Canción",
      "instruccion": "Texto de instrucción para el niño",
      "autor": "Compositor",
      "bpm": 80,
      "dificultad": "principiante",
      "nivel": "P4-01",
      "configuracion": {
        "compas": "4/4",
        "tonalidad": "C",
        "clave": "treble"
      },
      "notas": "C D E F | G A B c |]"
    }
  ]
}
```

## Campos

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `id` | Sí | ID único, prefijo `piano-` |
| `titulo` | Sí | Nombre visible en la app |
| `tipo` | Sí | Siempre `"piano-prompter"` |
| `autor` | Sí | Compositor de la pieza |
| `bpm` | Sí | Tempo en beats por minuto |
| `dificultad` | No | `"principiante"`, `"intermedio"`, `"avanzado"` |
| `nivel` | Sí | Libro + número: `P1-01` a `P4-xx` |
| `configuracion.compas` | Sí | `"4/4"`, `"3/4"`, `"2/4"`, `"6/8"` |
| `configuracion.tonalidad` | Sí | Tonalidad ABC: `C`, `G`, `F`, `D`, `Bb`, `Eb`, etc. |
| `configuracion.clave` | Sí | `"treble"` para solo mano derecha |
| `notas` | Sí | Notación ABC (ver abajo) |

## Niveles

| Nivel | Libro Yamaha | Descripción |
|-------|-------------|-------------|
| P1-xx | Libro 1 | Primeras notas, mano derecha |
| P2-xx | Libro 2 | Más notas, inicio mano izquierda |
| P3-xx | Libro 3 | Ambas manos, coordinación |
| P4-xx | Libro 4 | Nivel actual (piezas completas) |

## Notación ABC - Referencia

### Notas

| ABC | Nota | Duración |
|-----|------|----------|
| `C` | Do central | Negra (1 beat) |
| `D E F G A B` | Re Mi Fa Sol La Si | Negra |
| `c d e f g a b` | Octava arriba | Negra |
| `C, D, E,` | Octava abajo | Negra |
| `C2` | Do | Blanca (2 beats) |
| `C4` | Do | Redonda (4 beats) |
| `C/2` | Do | Corchea (½ beat) |
| `C3/2` | Do | Negra con punto (1.5 beats) |
| `C/4` | Do | Semicorchea (¼ beat) |
| `z` | Silencio | 1 beat |
| `z2` | Silencio | 2 beats |

### Alteraciones

| ABC | Significado |
|-----|-------------|
| `^F` | Fa sostenido (F#) |
| `^^F` | Fa doble sostenido |
| `_B` | Si bemol (Bb) |
| `__B` | Si doble bemol |
| `=B` | Si natural (cancela bemol/sostenido) |

### Articulaciones y dinámicas

| ABC | Significado |
|-----|-------------|
| `.C` | Staccato |
| `(C D E)` | Ligadura (slur) |
| `C3/2 D/2` | Negra con punto + corchea |
| `[C E G]` | Acorde (notas simultáneas) |
| `\|` | Barra de compás |
| `\|]` | Doble barra final |
| `\|:` | Inicio repetición |
| `:\|` | Fin repetición |

### Tonalidades comunes

| Tonalidad | ABC | Alteraciones automáticas |
|-----------|-----|------------------------|
| Do mayor | `K:C` | Ninguna |
| Sol mayor | `K:G` | F# |
| Fa mayor | `K:F` | Bb |
| Re mayor | `K:D` | F#, C# |
| Si bemol mayor | `K:Bb` | Bb, Eb |

## Multi-voz (Grand Staff - ambas manos)

Para piezas con mano derecha (clave de Sol) + mano izquierda (clave de Fa):

```json
{
  "notas": "%%staves {1 2}\nV:1\nnotas mano derecha aquí |]\nV:2 clef=bass\nnotas mano izquierda aquí |]"
}
```

### Reglas multi-voz
- `%%staves {1 2}` agrupa ambas voces con llave
- `V:1` = mano derecha (clave de Sol, automática)
- `V:2 clef=bass` = mano izquierda (clave de Fa)
- Ambas voces deben tener el **mismo número de compases**
- `configuracion.clave` sigue siendo `"treble"` (el componente detecta multi-voz automáticamente)
- Las notas de cada voz pueden tener `\n` entre líneas — el componente las junta automáticamente

### Ejemplo completo multi-voz

```json
{
  "id": "piano-zapatillas-rojas",
  "titulo": "Las Zapatillas Rojas",
  "misiones": [{
    "id": "zapatillas-01",
    "tipo": "piano-prompter",
    "titulo": "Las Zapatillas Rojas",
    "instruccion": "Sigue las notas de ambas manos. ¡Tempo Andante, tranquilo!",
    "autor": "A. Diabelli",
    "bpm": 80,
    "dificultad": "principiante",
    "nivel": "P4-01",
    "configuracion": {
      "compas": "4/4",
      "tonalidad": "F",
      "clave": "treble"
    },
    "notas": "%%staves {1 2}\nV:1\n\"!mp!\".C .F .A .c | (c3/2 d/2 c) A | (=B =B) (=B/c/ d/=B/) | c G z2 |\n\"!mf!\".C .F .A .c | (c3/2 d/2 c) A | (B B) (B/c/ d/B/) | F z z2 |]\nV:2 clef=bass\nz4 | z4 | =B,, [D,F,] z2 | C, [E,G,] z2 |\nz4 | z4 | C, [E,G,] z2 | F,, [A,,C,] z2 |]"
  }]
}
```

### Notas clave de Fa (mano izquierda)

En la clave de Fa, las notas se escriben una octava abajo:

| Nota en pentagrama | ABC |
|-------------------|-----|
| Do debajo del pentagrama | `C,,` |
| Sol (segunda línea) | `G,` |
| Do central | `C` |

## Carpeta y colección Firebase

- **Carpeta**: `_piano/`
- **Colección Firebase**: `piano`
- **Migrador**: seleccionar 🎹 Piano
- **Nomenclatura**: `nombre-cancion.json` (sin fecha, las piezas no caducan)

## Proceso de carga

1. Crear JSON en `_piano/`
2. Ir a Admin > Migración
3. Seleccionar **🎹 Piano**
4. Subir JSON
5. Aparece en Bóveda bajo la pestaña Piano

## Features del teleprompter

- Scroll horizontal con playhead rojo
- Audio sintetizado (piano FluidR3 SoundFont)
- BPM ajustable (±5) con indicador 🐢/🐇
- Botón de sonido 🔊/🔇
- Modo fullscreen ⛶ para tablet
- Sincronización híbrida (scroll continuo + corrección por nota)
