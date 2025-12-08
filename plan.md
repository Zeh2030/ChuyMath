# 🗺️ Plan de Desarrollo: El Mundo de Chuy (React Edition)

> Plan de acción detallado para la refactorización del proyecto. Define las fases, tareas y objetivos de cada etapa del desarrollo.

---

## 📋 Tabla de Contenidos

1.  [Resumen Ejecutivo](#-resumen-ejecutivo)
2.  [Fases del Plan](#-fases-del-plan)
3.  [Fase 0: Configuración](#-fase-0-configuración-del-entorno-y-planificación)
4.  [Fase 1: Autenticación](#-fase-1-autenticación-y-perfil-de-usuario)
5.  [Fase 2: Dashboard](#-fase-2-reconstrucción-del-dashboard)
6.  [Fase 3: Motor de Aventuras](#-fase-3-el-motor-de-aventuras)
7.  [Fase 4: Simulacros](#-fase-4-simulacros-de-examen-prioridad)
8.  [Fase 5: Contenido](#-fase-5-migración-de-contenido-restante)
9.  [Fase 6: Testing y Optimización](#-fase-6-testing-y-optimización)
10. [Fase 7: Expansión y Niveles](#-fase-7-expansión-y-niveles-largo-plazo)

---

## 🎯 Resumen Ejecutivo

La migración a React está en sus etapas finales. Hemos construido una plataforma robusta, modular y escalable que soporta una amplia variedad de juegos educativos (desde lógica matemática hasta dibujo creativo). El enfoque ahora es la estabilización, la carga de contenido y el pulido final.

---

## 🚀 Fases del Plan

| Fase | Título | Objetivo Principal | Estado |
| :--: | :--- | :--- | :--- |
| **0** | **Configuración** | Entorno React + Vite + Firebase listo. | ✅ **Completada** |
| **1** | **Autenticación** | Login Google y Perfiles de Usuario. | ✅ **Completada** |
| **2** | **Dashboard** | Centro de mando y navegación "Child-First". | ✅ **Completada** |
| **3** | **Motor Aventuras** | Renderizado dinámico de misiones. | ✅ **Completada** |
| **4** | **Simulacros** | Modo examen y calificación. | ✅ **Completada** |
| **5** | **Contenido** | 12+ Tipos de juegos migrados (Kakooma, Numberblocks, etc.). | ✅ **Completada** |
| **6** | **Testing & UX** | Pulido, seguridad y lanzamiento. | ✅ **Completada** |
| **7** | **Expansión** | Nuevos grados escolares y sistema de niveles. | 📅 **Planeada** |

---

## 📜 Detalle de Fases (Historial Completo)

### Fase 0: Configuración del Entorno y Planificación
*   [x] **Configuración inicial:**
    *   [x] Inicializar proyecto con Vite + React.
    *   [x] Configurar Firebase (auth, firestore).
*   [x] **Estructura y Estilos:**
    *   [x] Definir arquitectura de directorios.
    *   [x] Implementar sistema de estilos globales.

### Fase 1: Autenticación y Perfil
*   [x] **Sistema de Login:**
    *   [x] Implementar Google Sign-In.
    *   [x] Crear contexto de autenticación (`useAuth`).
*   [x] **Gestión de Perfiles:**
    *   [x] Creación automática de documentos en Firestore.
    *   [x] Sistema de Whitelist para control de acceso.
    *   [x] Edición de avatar y nombre de héroe.

### Fase 2: Dashboard
*   [x] **Diseño UI/UX:**
    *   [x] Implementar diseño "Child-First" (botones grandes, visuales).
    *   [x] Navegación móvil optimizada.
*   [x] **Widgets Funcionales:**
    *   [x] "Aventura del Día" (lógica de progresión).
    *   [x] Visualización de Racha y Logros (medallas).
    *   [x] Bóveda de actividades pasadas.

### Fase 3: Motor de Aventuras
*   [x] **Core del Juego:**
    *   [x] Crear componente `MisionRenderer` (orquestador).
    *   [x] Implementar sistema de navegación entre pasos.
    *   [x] Barras de progreso y feedback visual inmediato.

### Fase 4: Simulacros de Examen
*   [x] **Modo Examen:**
    *   [x] Adaptar motor para modo sin feedback inmediato.
    *   [x] Sistema de calificación final y puntaje.
    *   [x] Pantalla de revisión de respuestas.

### Fase 5: Migración de Contenido (Juegos)
Se portaron y adaptaron todos los componentes de juego originales:
*   [x] **Opción Múltiple:** (`OpcionMultiple.jsx`) Texto, imágenes y HTML enriquecido.
*   [x] **Palabra del Día:** (`PalabraDelDia.jsx`) Con audio y pistas visuales.
*   [x] **Operaciones:** (`Operaciones.jsx`) Matemáticas básicas secuenciales.
*   [x] **Tablas Lógicas:** (`TablaDobleEntrada.jsx`) Detective con checks/taches.
*   [x] **Secuencias:** (`Secuencia.jsx`) Patrones lógicos.
*   [x] **Conteo de Figuras:** (`ConteoFiguras.jsx`) Identificación visual.
*   [x] **Criptoaritmética:** (`Criptoaritmetica.jsx`) Valores ocultos con emojis.
*   [x] **Balanza Lógica:** (`BalanzaLogica.jsx`) Ecuaciones visuales de peso.
*   [x] **Desarrollo de Cubos:** (`DesarrolloCubos.jsx`) Visión espacial 3D (SVG isométrico).
*   [x] **Numberblocks Constructor:** (`NumberblocksConstructor.jsx`) Lógica de rectángulos con colores alternados.
*   [x] **Kakooma:** (`Kakooma.jsx`) Cálculo mental visual interactivo.
*   [x] **Lienzo de Dibujo:** (`LienzoDibujo.jsx`) Creatividad libre.
*   [x] **Navegación Mapa:** (`NavegacionMapa.jsx`) Exploración de mundos.

### Fase 6: Testing, Optimización y UI/UX (Actual)
*   [x] **Mejoras de UX:**
    *   [x] Reemplazar auto-avance por botones "Continuar".
    *   [x] Feedback enriquecido con imágenes (Expediciones).
*   [x] **Infraestructura:**
    *   [x] Organización de carpetas temáticas en `_contenido`.
    *   [x] Configuración de despliegue en Netlify (`netlify.toml`).
*   [x] **Seguridad:**
    *   [x] Reglas de Firestore (`firestore.rules`) para producción.
    *   [x] Panel de Admin para gestión de usuarios.
*   [x] **Limpieza:** Eliminación de archivos obsoletos y duplicados.

---

## 🔮 Fase 7: Expansión y Niveles (Largo Plazo)

**Objetivo:** Escalar la plataforma para soportar grados escolares y niveles de habilidad.

*   [ ] **Estrategia de Clasificación (Definición):**
    *   [ ] Simulacros con `grado` (1º, 2º...). Alineados a examen/competencia.
    *   [ ] Aventuras/expediciones con `nivel` (`explorador`, `avanzado`, `retador`) y opcional `grado_sugerido`.
*   [ ] **Implementación Técnica:**
    *   [ ] Validar que simulacros traigan `grado` en migración.
    *   [ ] Filtros por `grado` (simulacros) y `nivel` (aventuras/expediciones) en Bóveda/Dashboard.
    *   [ ] Mostrar badges en tarjetas: `grado` (simulacros), `nivel` (aventuras).
    *   [ ] Perfil: campos `gradoActual` (para sugerir simulacros) y `preferenciaNivel` (aventuras).
*   [ ] **Contenido:**
    *   [ ] Etiquetar simulacros existentes con `grado`.
    *   [ ] Etiquetar aventuras/expediciones con `nivel`.
    *   [ ] Crear más niveles para juegos nuevos (Kakooma, Numberblocks).
