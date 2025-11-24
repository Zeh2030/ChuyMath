#  Estructura de Carpetas - Contenido

##  Organización por Tipo

Los archivos JSON están organizados en carpetas según su tipo de contenido:

### Carpetas Disponibles:

- **venturas/** - Aventuras diarias con múltiples misiones
- **simulacros/** - Exámenes completos (variados o de un solo tipo)
- **secuencias/** - Ejercicios de secuencias y patrones
- **operaciones/** - Ejercicios de operaciones matemáticas
- **criptoaritmetica/** - Problemas de criptoaritmética
- **alanza-logica/** - Ejercicios de balanza lógica
- **desarrollo-cubos/** - Problemas de desarrollo de cubos
- **palabra-del-dia/** - Ejercicios de vocabulario
- **docs/** - Documentación y guías

##  Convención de Nombres

### Para Aventuras y Tipos Específicos:
- **Solo fecha:** 2025-11-10.json, 2025-11-15.json
- La fecha indica el **orden de dificultad** (cronológico = progresión)
- El sistema automáticamente ordena por fecha (más antigua = más fácil)

### Para Simulacros:
- **Nombre descriptivo:** simulador-desafio-integral-1.json
- Pueden tener cualquier nombre, pero deben tener 	ipo en el JSON

##  Importante

- **El ID del documento en Firestore** debe coincidir con el nombre del archivo (sin extensión)
- **No duplicar IDs** - Si subes un archivo con el mismo ID, se sobrescribe
- **La fecha en el nombre** es para organización local, no necesariamente la fecha de publicación

##  Flujo de Trabajo

1. Crear archivo JSON en la carpeta correspondiente
2. Usar AdminMigracion para subirlo a Firestore
3. El sistema automáticamente lo clasifica según el campo 	ipo en el JSON
