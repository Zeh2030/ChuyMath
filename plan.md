# 🗺️ Plan de Desarrollo: El Mundo de Chuy (React Edition)

> Plan de acción detallado para la refactorización del proyecto. Define las fases, tareas y objetivos de cada etapa del desarrollo.

---

## 📋 Tabla de Contenidos

1.  [Resumen Ejecutivo](#-resumen-ejecutivo)
2.  [Fases del Plan](#-fases-del-plan)
3.  [Fase 0: Configuración del Entorno](#-fase-0-configuración-del-entorno-y-planificación)
4.  [Fase 1: Autenticación y Perfil de Usuario](#-fase-1-autenticación-y-perfil-de-usuario)
5.  [Fase 2: Reconstrucción del Dashboard](#-fase-2-reconstrucción-del-dashboard)
6.  [Fase 3: El Motor de Aventuras](#-fase-3-el-motor-de-aventuras)
7.  [Fase 4: Simulacros de Examen (Prioridad)](#-fase-4-simulacros-de-examen-prioridad)
8.  [Fase 5: Migración de Contenido Restante](#-fase-5-migración-de-contenido-restante)
9.  [Fase 6: Testing y Optimización](#-fase-6-testing-y-optimización)

---

## 🎯 Resumen Ejecutivo

Este plan de desarrollo organiza la migración a React en fases manejables. Cada fase tiene un objetivo claro y entregables específicos, permitiendo un progreso incremental y medible. La estrategia es construir primero el "esqueleto" de la aplicación (entorno, autenticación, layout) y luego "poblarlo" con la lógica y el contenido de las aventuras.

---

## 🚀 Fases del Plan

| Fase | Título | Objetivo Principal | Estado |
| :--: | :--- | :--- | :--- |
| **0** | **Configuración y Planificación** | Establecer el entorno de desarrollo y la documentación. | ✅ **Completada** |
| **1** | **Autenticación y Perfil** | Implementar el flujo de inicio de sesión y la creación de perfiles. | ✅ **Completada** |
| **2** | **Reconstrucción del Dashboard** | Crear la página principal y la estructura de navegación. | ✅ **Completada** |
| **3** | **El Motor de Aventuras** | Desarrollar el sistema central para renderizar misiones. | ✅ **Completada** |
| **4** | **Simulacros de Examen** | Crear modo examen y componentes prioritarios para práctica inmediata. | ✅ **Completada** |
| **5** | **Migración de Contenido** | Adaptar el resto de juegos existentes a componentes de React. | ✅ **Completada** |
| **6** | **Testing, Optimización y UI/UX** | Asegurar la calidad, rendimiento y mejorar la experiencia de usuario. | 🔄 **En Progreso** |

---

##  Fase 0: Configuración del Entorno y Planificación

**Objetivo:** Tener un proyecto React funcional y los documentos de planificación listos.

*   [x] **Crear Archivos de Planificación:**
    *   [x] `arquitectura.md`: Define el stack y la estructura.
    *   [x] `plan.md`: Este mismo archivo.
    *   [x] `progreso.md`: Para registrar los avances.
    *   [x] `enseñanza.md`: Para documentar los conceptos de aprendizaje.
*   [x] **Inicializar el Proyecto React:**
    *   [x] Crear la carpeta `chuy-react-app/`.
    *   [x] Ejecutar `npm create vite@latest` para generar el proyecto base de React + Vite.
    *   [x] Limpiar los archivos de ejemplo de la plantilla de Vite.
*   [x] **Crear Estructura de Directorios:**
    *   [x] Crear las carpetas definidas en `arquitectura.md` (`src/components`, `src/pages`, etc.).
*   [x] **Instalar Dependencias Iniciales:**
    *   [x] Instalar `react-router-dom` para el manejo de rutas.
    *   [x] Instalar `firebase` para la conexión con el backend.
    *   [x] Instalar `react-icons` para la iconografía SVG.
*   [x] **Configurar Conexión a Firebase:**
    *   [x] Crear el proyecto en la consola de Firebase.
    *   [x] Habilitar Authentication (Google) y Firestore.
    *   [x] Crear el archivo `src/services/firebase.js` con las credenciales (usando variables de entorno).
*   [x] **Configurar Estilos Globales:**
    *   [x] Crear `src/styles/global.css` y definir las variables CSS base (colores, fuentes) del proyecto original.
    *   [x] Importar `global.css` en `main.jsx`.

---

## Fase 1: Autenticación y Perfil de Usuario

**Objetivo:** Permitir que un usuario inicie sesión y que su perfil se cree en la base de datos.

*   [x] **Crear Contexto de Autenticación:**
    *   [x] Crear un `AuthContext` en `src/hooks/useAuth.js` que provea la información del usuario a toda la app.
*   [x] **Crear Páginas de Login/Logout:**
    *   [x] Crear el componente `pages/Login.jsx`.
    *   [x] Añadir un botón "Iniciar Sesión con Google" que llame a la función de Firebase.
    *   [x] Crear una página o componente `LogoutButton.jsx` que cierre la sesión.
*   [x] **Implementar Rutas Protegidas:**
    *   [x] Configurar `react-router-dom` en `App.jsx`.
    *   [x] Crear un componente `ProtectedRoute` que redirija a `/login` si el usuario no está autenticado.
*   [x] **Crear Perfil en Firestore:**
    *   [x] Implementar la lógica que, tras un login exitoso, verifique si el usuario ya tiene un perfil en Firestore.
    *   [x] Si no existe, crear un nuevo documento en la colección `profiles` con los datos por defecto.

---

## Fase 2: Reconstrucción del Dashboard

**Objetivo:** Tener la página principal funcional, mostrando los datos correctos para el usuario logueado.

*   [x] **Crear Componentes de Layout:**
    *   [x] `components/layout/Header.jsx`: Barra de navegación superior.
    *   [x] `components/layout/Sidebar.jsx`: Menú lateral.
    *   [x] `components/layout/PageWrapper.jsx`: Contenedor que aplique el layout a cada página.
*   [x] **Crear la Página del Dashboard:**
    *   [x] `pages/Dashboard.jsx`.
    *   [x] Proteger esta ruta para que solo usuarios logueados puedan acceder.
*   [x] **Conectar con Datos de Firestore:**
    *   [x] Crear un hook `useProfile(userId)` que lea en tiempo real los datos del perfil del usuario desde Firestore.
    *   [x] Usar este hook en el `Dashboard.jsx` para mostrar la racha, progreso, etc.
*   [x] **Mostrar Aventura del Día:**
    *   [x] Implementar la lógica para obtener la fecha actual.
    *   [x] Leer el documento de la aventura correspondiente desde la colección `aventuras`.
    *   [x] Mostrar el título y la lista de misiones de la aventura del día.

---

## Fase 3: El Motor de Aventuras

**Objetivo:** Construir el sistema que renderiza dinámicamente las misiones de una aventura.

*   [x] **Crear Página de Aventura:**
    *   [x] `pages/Aventura.jsx`.
    *   [x] La ruta debe aceptar un parámetro, ej. `/aventura/:fecha`.
    *   [x] Implementar navegación entre misiones y barra de progreso.
*   [x] **Crear Componente "Renderizador" de Misiones:**
    *   [x] `components/aventura/MisionRenderer.jsx`.
    *   [x] Este componente recibirá los datos de una misión (incluyendo el `tipo`).
    *   [x] Usará una estructura `switch` para decidir qué componente de juego específico debe renderizar.
    *   [x] Preparado para agregar más tipos de misiones en Fase 4.
*   [x] **Crear el Primer Componente de Juego:**
    *   [x] `components/aventura/tipos/OpcionMultiple.jsx`.
    *   [x] Este componente recibirá la `data` de la misión y renderizará la pregunta, las opciones y manejará la lógica de selección y respuesta.
    *   [x] Soporte para opciones con texto y opciones con imágenes SVG.
    *   [x] Manejo de respuestas por índice o por valor.

---

## Fase 4: Simulacros de Examen (Prioridad)

**Objetivo:** Habilitar un modo de "Simulacro" y crear los componentes necesarios para practicar para el examen próximo. (Completada con implementación de `Simulacro.jsx`, `OpcionMultiple.jsx`, `NavegacionMapa`, `TablaDobleEntrada`, `ConteoFiguras` y creación de contenido JSON).

---

## Fase 5: Migración de Contenido Restante (Completada)

**Objetivo:** Recrear todos los tipos de juegos restantes como componentes de React.

*   [x] **Crear un Componente por cada Tipo de Juego:**
    *   [x] `NavegacionMapa`, `TablaDobleEntrada`, `ConteoFiguras`, `Operaciones`, `Criptoaritmetica`, `BalanzaLogica`, `DesarrolloCubos`, `PalabraDelDia`.
*   [x] **Adaptar Lógica y Estilos:**
    *   [x] Estilos encapsulados y lógica migrada.

---

## Fase 6: Testing, Optimización y UI/UX

**Objetivo:** Pulir la aplicación, mejorar la interfaz para niños y asegurar la estabilidad.

*   [x] **Mejoras de UI/UX (Dashboard y Bóveda):**
    *   [x] Implementar diseño "Child-First" (botones grandes, feedback visual).
    *   [x] Mejorar navegación en móvil (Tabs).
    *   [x] Visualización de logros y progreso.
*   [ ] **Gestión de Perfil:**
    *   [ ] Crear página para editar nombre de héroe y avatar.
*   [ ] **Seguridad de Firebase:**
    *   [ ] Configurar reglas de Firestore (firestore.rules).
*   [ ] **Migración de Datos:**
    *   [ ] Subir todos los simulacros JSON a la base de datos de producción.
*   [ ] **Auditoría Final:**
    *   [ ] Lighthouse score > 90.
    *   [ ] Testing manual en dispositivos móviles.
