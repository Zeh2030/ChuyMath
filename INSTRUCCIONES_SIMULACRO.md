# 📝 Instrucciones para Usar el Simulacro

## ✅ Implementación Completada

¡El sistema de simulacros está listo! Hemos implementado:

### Componentes Creados

1. **Página de Simulacro** (`pages/Simulacro.jsx`)
   - Flujo de examen sin feedback inmediato
   - Botón "Calificar Examen" al final
   - Pantalla de resultados con puntaje y porcentaje
   - Explicaciones después de calificar

2. **Componente NavegaciónMapa** (`components/aventura/tipos/NavegacionMapa.jsx`)
   - Para el problema de navegación (Problema 1 del simulacro)
   - Mapa interactivo con puntos de interés
   - Visualización del camino después de calificar

3. **Adaptaciones para Modo Simulacro**
   - `MisionRenderer.jsx` - Acepta props de simulacro
   - `OpcionMultiple.jsx` - Funciona sin feedback inmediato
   - `AdminMigracion.jsx` - Ahora soporta migración de simulacros

4. **Sistema de Rutas**
   - Nueva ruta: `/simulacro/:id`

---

## 🚀 Pasos para Usar el Simulacro

### Paso 1: Iniciar la Aplicación

```bash
cd chuy-react-app
npm run dev
```

### Paso 2: Subir el Simulacro a Firestore

1. Inicia sesión en la aplicación
2. Ve a la página de administración: `http://localhost:5173/admin/migracion`
3. Selecciona la opción **"Simulacro"** (radio button)
4. Abre el archivo `_contenido/simulador-oem-2025-g2.json`
5. Copia **TODO** el contenido del archivo
6. Pégalo en el área de texto de la página de administración
7. Haz clic en **"Migrar Simulacro"**
8. Deberías ver el mensaje: ✅ Simulacro "Simulacro Olimpiada de Mayo (2do Grado)" (simulador-oem-2025-g2) migrado exitosamente

### Paso 3: Acceder al Simulacro

Una vez migrado, puedes acceder al simulacro de dos formas:

#### Opción A: URL Directa
Ve a: `http://localhost:5173/simulacro/simulador-oem-2025-g2`

#### Opción B: Desde el Dashboard (Recomendado - Siguiente Paso)
En el futuro, podemos agregar un botón o tarjeta en el Dashboard que muestre los simulacros disponibles y redirija a la URL correcta.

---

## 📋 Contenido del Simulacro

El simulacro **"Simulacro Olimpiada de Mayo (2do Grado)"** contiene **20 problemas**:

- **19 problemas de Opción Múltiple** (con texto y/o imágenes SVG)
- **1 problema de Navegación en Mapa** (Problema 1)

Todos los problemas incluyen:
- Pregunta clara
- Opciones de respuesta
- Respuesta correcta
- Explicaciones (se muestran después de calificar)

---

## 🎯 Funcionalidades Implementadas

### Durante el Examen:
- ✅ El usuario puede seleccionar respuestas
- ✅ NO hay feedback inmediato (sin mostrar si está correcto o incorrecto)
- ✅ El usuario puede cambiar sus respuestas antes de calificar
- ✅ Todos los problemas se muestran en una sola página (scroll)

### Al Calificar:
- ✅ Se muestra el puntaje total (ej: "15 de 20")
- ✅ Se muestra el porcentaje (ej: "75%")
- ✅ Cada problema muestra si fue correcto (✅) o incorrecto (❌)
- ✅ Se muestran las explicaciones de cada problema
- ✅ Las respuestas correctas se resaltan en verde
- ✅ Las respuestas incorrectas se resaltan en rojo
- ✅ Botón "Intentar de Nuevo" para reiniciar

---

## 🔧 Próximos Pasos Sugeridos

### 1. Agregar Acceso desde el Dashboard
Crear una sección de "Simulacros" en el Dashboard con tarjetas para cada simulacro disponible.

**Ejemplo:**
```jsx
<div className="simulacros-section">
  <h2>📝 Simulacros de Práctica</h2>
  <div className="simulacros-lista">
    <Link to="/simulacro/simulador-oem-2025-g2" className="simulacro-card">
      <h3>🎓 Olimpiada de Mayo (2do Grado)</h3>
      <p>20 problemas · Matemáticas</p>
    </Link>
  </div>
</div>
```

### 2. Crear Más Simulacros
- Usa la misma estructura del JSON `simulador-oem-2025-g2.json`
- Cambia el `id`, `titulo`, `descripcion` y los `problemas`
- Sube el nuevo simulacro usando la página de administración
- Accede con la URL: `/simulacro/[nuevo-id]`

### 3. Agregar Cronómetro (Opcional)
Si deseas agregar un cronómetro para simular condiciones de examen real, esto se puede implementar en `Simulacro.jsx`.

### 4. Guardar Resultados en Firestore (Opcional)
Para llevar un registro del progreso del usuario, se puede guardar el puntaje de cada intento en el perfil del usuario.

---

## 📱 Dispositivos Soportados

El simulacro es **responsive** y funciona en:
- 💻 Computadoras de escritorio
- 📱 Tablets
- 📱 Teléfonos móviles

---

## ❓ Preguntas Frecuentes

### ¿Cómo creo un nuevo simulacro?
1. Copia el archivo `simulador-oem-2025-g2.json`
2. Cambia el `id` (ej: `simulador-practica-2`)
3. Modifica el `titulo` y `descripcion`
4. Cambia los problemas según necesites
5. Súbelo usando la página de administración

### ¿Qué tipos de preguntas puedo usar?
Actualmente soportamos:
- **opcion-multiple**: Preguntas con opciones de texto o imágenes
- **navegacion-mapa**: Problemas de rutas en un mapa

Más tipos se implementarán en la Fase 5.

### ¿Los resultados se guardan?
Actualmente **NO** se guardan. El simulacro es solo para práctica inmediata. 
Si deseas guardar resultados, esto se puede implementar fácilmente.

### ¿Puedo compartir el simulacro con otras personas?
Sí, una vez desplegado en producción (ej: Vercel), cualquier persona con la URL puede acceder al simulacro (si está autenticada).

---

## 🎉 ¡Listo para Usar!

El simulacro está completamente funcional y listo para que tu hijo practique. 
Solo falta subirlo a Firestore siguiendo el Paso 2 de arriba.

**¡Buena suerte con el examen! 🚀**


