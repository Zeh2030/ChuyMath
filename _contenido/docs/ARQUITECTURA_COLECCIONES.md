# 🏗️ Arquitectura de Colecciones - Firestore

## 🎯 Decisión: Colecciones Separadas por Tipo

Se implementó una arquitectura de **colecciones independientes por tipo de contenido**.

---

## 📦 Estructura de Colecciones

```
firestore/
│
├── aventuras/               (Aventuras diarias - solo fechas YYYY-MM-DD)
│   ├── 2025-09-26          (múltiples misiones)
│   ├── 2025-09-27          (múltiples misiones)
│   └── ...
│
├── conteo-figuras/          (Conteo de figuras geométricas)
│   ├── 2025-09-27          {"titulo": "El Desafío Geométrico", "misiones": [...]}
│   └── ...
│
├── secuencias/              (Patrones y secuencias)
│   ├── 2025-11-10          {"titulo": "El Secreto de las Secuencias", "misiones": [...]}
│   ├── simulador-secuencias-1
│   └── ...
│
├── operaciones/             (Operaciones matemáticas)
│   ├── 2025-XX-XX          (próximamente)
│   └── ...
│
├── criptoaritmetica/        (Criptoaritmética)
│   ├── 2025-XX-XX          (próximamente)
│   └── ...
│
├── balanza-logica/          (Balanza lógica)
│   ├── 2025-XX-XX          (próximamente)
│   └── ...
│
├── desarrollo-cubos/        (Desarrollo de cubos)
│   ├── 2025-XX-XX          (próximamente)
│   └── ...
│
├── palabra-del-dia/         (Vocabulario)
│   ├── 2025-XX-XX          (próximamente)
│   └── ...
│
├── simulacros/              (Simulacros genéricos - variados)
│   ├── simulador-matematicas-1
│   ├── simulador-desafio-integral-1
│   └── ...
│
├── profiles/                (Perfil del usuario - datos personales)
│   ├── uid1                 {"nombre": "Capitán Gato", "racha": 5, ...}
│   └── ...
│
└── whitelist/               (Autorización de acceso)
    ├── usuario@gmail.com    {"nombreNino": "Capitán Gato"}
    └── ...
```

---

## ✅ Ventajas de Esta Arquitectura

| Aspecto | Ventaja |
|---------|---------|
| **Organización** | Cada tipo tiene su colección clara |
| **Filtrado** | En Bóveda filtra por colección específica |
| **Permisos** | Reglas Firestore específicas por colección |
| **Escalabilidad** | Fácil agregar nuevos tipos |
| **Mantenimiento** | Admin sabe exactamente dónde buscar |
| **Rendimiento** | Queries más eficientes y rápidas |
| **Lógica App** | Boveda.jsx carga de colecciones distintas |

---

## 🔄 Flujo de Migración Actualizado

### Admin selecciona tipo en AdminMigracion:

```
┌──────────────────────────────────┐
│ AdminMigracion.jsx               │
│                                  │
│ ¿Qué tipo?                       │
│ ┌─ Aventura → aventuras/         │
│ ├─ Conteo Figuras → conteo-figuras/
│ ├─ Secuencias → secuencias/      │
│ ├─ Operaciones → operaciones/    │
│ ├─ Criptoaritmética → criptoaritmetica/
│ ├─ Balanza Lógica → balanza-logica/
│ ├─ Desarrollo Cubos → desarrollo-cubos/
│ ├─ Palabra del Día → palabra-del-dia/
│ └─ Simulacro → simulacros/       │
└──────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ migrarSimulacro()                │
│ - Determina colección correcta   │
│ - Migra al doc.id correspondiente│
│ - Añade campo "tipo" si es       │
│   específico                     │
└──────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────┐
│ Firebase Firestore               │
│ ✅ Guardado en colección correcta│
└──────────────────────────────────┘
```

---

## 📋 Convención de IDs

### Para Aventuras y Tipos Específicos:
```
SOLO FECHA: 2025-11-10.json
Razón: Orden cronológico = Dificultad progresiva
```

### Para Simulacros Genéricos:
```
NOMBRE DESCRIPTIVO: simulador-desafio-integral-1.json
Razón: Pueden ser variados, no siguen cronología específica
```

---

## 🔍 Cómo Boveda.jsx Carga Contenido

```javascript
// En Boveda.jsx useEffect:

// Carga Aventuras
getDocs(collection(db, 'aventuras'))

// Carga Conteo de Figuras
getDocs(collection(db, 'conteo-figuras'))

// Carga Secuencias
getDocs(collection(db, 'secuencias'))

// Carga Simulacros
getDocs(collection(db, 'simulacros'))

// Cada uno se carga de su colección específica
// Luego se unifican en estado único
```

---

## 🎯 Filtrado en Mi Bóveda

Cuando el usuario hace click en "Conteo de Figuras":

```javascript
// Filtro se establece a 'conteo-figuras'
setFiltro('conteo-figuras');

// En contenidoMostrar():
if (filtro === 'conteo-figuras') {
  return conteoFiguras;  // Array cargado de colección conteo-figuras
}
```

---

## 📝 Actualización de AdminMigracion

La función `migrarSimulacro()` ahora:

1. **Determina colección correcta:**
   ```javascript
   if (tipoJuego === 'conteo-figuras') coleccion = 'conteo-figuras';
   if (tipoJuego === 'secuencia') coleccion = 'secuencias';
   // ... etc
   ```

2. **Migra a colección correcta:**
   ```javascript
   const ref = doc(db, coleccion, id);
   ```

3. **Añade campo tipo si es específico:**
   ```javascript
   if (tipoJuego !== 'simulacro') {
     datosAMigrar.tipo = tipoJuego;
   }
   ```

---

## ✅ Verificación

Después de la actualización:

1. **Sube un JSON de Conteo:**
   - AdminMigracion
   - Selecciona "🔍 Conteo de Figuras"
   - Sube el JSON
   - ✅ Va a colección `conteo-figuras`

2. **En Firebase Console:**
   - Verifica que aparezca en `conteo-figuras` collection
   - NO en `simulacros`

3. **En Bóveda:**
   - Debería aparecer filtrado correctamente
   - Sin la colección "simulacros" contaminada

---

## 🚀 Próximos Tipos

Para agregar nuevo tipo:

1. Crear carpeta en `_contenido/nuevo-tipo/`
2. Crear colección en Firestore manualmente (o auto-create)
3. Actualizar `AdminMigracion.jsx` con mapeo:
   ```javascript
   } else if (tipoJuego === 'nuevo-tipo') {
     coleccion = 'nuevo-tipo';
   ```
4. Agregar en `FIRESTORE_REGLAS_ACTUALIZADAS.md`
5. Actualizar reglas en Firebase Console
6. Agregar en `Boveda.jsx` para cargar la colección

---

## 📊 Comparativa: Colecciones vs Todo en Simulacros

| Aspecto | Colecciones Separadas | Todo en Simulacros |
|---------|----------------------|-------------------|
| Organización | ✅ Clara | ❌ Confusa |
| Queries | ✅ Rápidas | ❌ Complejas |
| Filtros | ✅ Simples | ❌ Complejas |
| Permisos | ✅ Granulares | ❌ Generales |
| Escalabilidad | ✅ Fácil | ❌ Difícil |
| Mantenimiento | ✅ Limpio | ❌ Sucio |
| Admin UX | ✅ Intuitivo | ❌ Confuso |

---

## 📌 Conclusión

**Colecciones separadas** es la mejor arquitectura para:
- ✅ Organización clara
- ✅ Escalabilidad futura
- ✅ Permisos específicos
- ✅ Mejor experiencia del usuario final
- ✅ Facilita mantenimiento

