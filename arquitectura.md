# 🏗️ Arquitectura: El Mundo de Chuy (React Edition)

> Documento vivo que define las decisiones de arquitectura, stack tecnológico y estructura de datos para la refactorización del proyecto a React.

---

## 📋 Tabla de Contenidos

1.  [Resumen Ejecutivo](#-resumen-ejecutivo)
2.  [Stack Tecnológico](#-stack-tecnológico)
3.  [Estructura de Directorios](#-estructura-de-directorios)
4.  [Gestión de Estado y Flujo de Datos](#-gestión-de-estado-y-flujo-de-datos)
5.  [Autenticación y Perfiles de Usuario](#-autenticación-y-perfiles-de-usuario)
6.  [Base de Datos (Firestore)](#-base-de-datos-firestore)
7.  [Despliegue y CI/CD](#-despliegue-y-cicd)
8.  [Principios de Diseño y Calidad](#-principios-de-diseño-y-calidad)

---

## 🎯 Resumen Ejecutivo

Este documento describe la arquitectura de la nueva versión de "El Mundo de Chuy", migrando de una aplicación de JavaScript puro a una **Single Page Application (SPA)** moderna construida con **React**.

**Objetivos Arquitectónicos:**
*   **Escalabilidad:** Construir una base que pueda crecer para soportar múltiples usuarios y un contenido educativo en constante expansión.
*   **Mantenibilidad:** Usar componentes reutilizables para un código más limpio y fácil de mantener.
*   **Rendimiento:** Aprovechar herramientas modernas para optimizar los tiempos de carga y la experiencia de usuario.
*   **Experiencia de Desarrollador (DX):** Crear un entorno de desarrollo ágil y productivo.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Razón de la Elección |
| :--- | :--- | :--- |
| **Framework Frontend** | **React** | Ecosistema robusto, modelo de componentes potente. Ideal para el objetivo de aprendizaje y construcción de una aplicación compleja. |
| **Build Tool** | **Vite** | Servidor de desarrollo ultrarrápido (HMR), configuración sencilla y optimización de build para producción. |
| **Lenguaje** | JavaScript (ES6+) | Estándar de la web. Usaremos la sintaxis más moderna para un código limpio. |
| **Estilos** | **CSS Modules / CSS Puro** | `global.css` para estilos base y archivos CSS por componente para estilos encapsulados. Simple y efectivo. |
| **Backend (BaaS)** | **Firebase** | Solución "todo en uno" para autenticación, base de datos en tiempo real (Firestore) y reglas de seguridad. |
| **Hosting Frontend** | **Vercel** | Integración perfecta con GitHub para CI/CD, despliegues atómicos, previews automáticas. Excelente DX. |
| **Iconografía** | **SVG** | Consistencia visual en todas las plataformas, accesibilidad y capacidad de animación. Se usarán librerías como `react-icons`. |

---

## 📁 Estructura de Directorios

Se creará una nueva carpeta `chuy-react-app/` para alojar el proyecto.

```
chuy-react-app/
├── public/              # Archivos estáticos (favicon.ico, index.html)
├── src/                 # Código fuente de la aplicación
│   ├── assets/          # Imágenes, iconos SVG, fuentes
│   ├── components/      # Componentes de UI reutilizables y agnósticos
│   │   ├── ui/          # Botones, Tarjetas, Inputs, etc.
│   │   └── layout/      # Header, Sidebar, PageWrapper, etc.
│   ├── hooks/           # Hooks personalizados (ej. useAuth, useProfile)
│   ├── pages/           # Componentes que representan una "página" o "ruta"
│   │   ├── Dashboard.jsx
│   │   ├── Aventura.jsx
│   │   ├── Login.jsx
│   │   └── ...
│   ├── services/        # Lógica para interactuar con APIs externas
│   │   └── firebase.js  # Configuración, inicialización y funciones de Firebase
│   ├── styles/          # Estilos globales
│   │   └── global.css
│   ├── utils/           # Funciones de utilidad puras (ej. formateo de fechas)
│   ├── App.jsx          # Componente raíz que maneja el enrutamiento
│   └── main.jsx         # Punto de entrada de la aplicación
├── .gitignore
├── package.json         # Dependencias y scripts del proyecto
└── vite.config.js       # Configuración de Vite
```

---

## 🔄 Gestión de Estado y Flujo de Datos

1.  **Estado Local:** Gestionado dentro de los componentes usando los hooks de React (`useState`, `useReducer`). Ideal para datos que no necesitan ser compartidos, como el estado de un formulario.
2.  **Estado Global:** Para datos que necesitan ser accesibles en toda la aplicación (como la información del usuario autenticado), se utilizará **React Context API**. Se creará un `AuthContext` para gestionar el estado del usuario.
3.  **Datos del Servidor (Firestore):** La interacción con Firestore se manejará a través de funciones específicas en `src/services/firebase.js`. Se crearán hooks personalizados (ej. `useUserProfile(userId)`) para abstraer la lógica de fetching y actualización de datos, facilitando su uso en los componentes.

---

## 🔐 Autenticación y Perfiles de Usuario

*   **Proveedor de Autenticación:** Se usará **Firebase Authentication** con el proveedor de **Google** como método principal para un inicio de sesión fácil y seguro.
*   **Flujo de Usuario:**
    1.  El usuario llega a una página de Login.
    2.  Hace clic en "Iniciar sesión con Google".
    3.  Al autenticarse con éxito, se verifica si es un usuario nuevo.
    4.  **Si es nuevo:** Se crea un nuevo documento para él en la colección `users` de Firestore.
    5.  **Si ya existe:** Se lee su perfil.
    6.  La información del usuario se almacena en el `AuthContext` global y se le redirige al Dashboard.
*   **Persistencia de Sesión:** Firebase gestiona automáticamente la persistencia de la sesión, por lo que el usuario permanecerá logueado entre visitas.

---

## 🗃️ Base de Datos (Firestore)

Firestore se usará para almacenar todos los datos persistentes. La estructura de datos inicial será la siguiente:

#### Colección: `users`
*   **Documento ID:** `userId` (el UID de Firebase Auth)
*   **Datos:**
    ```json
    {
      "email": "usuario@gmail.com",
      "displayName": "Nombre del Usuario",
      "photoURL": "url_de_la_foto.jpg",
      "createdAt": "timestamp"
    }
    ```

#### Colección: `profiles`
*   **Documento ID:** `userId`
*   **Datos:**
    ```json
    {
      "racha": 0,
      "ultimaVisita": "timestamp",
      "habilidades": {
        "geometria": { "nivel": 1, "xp": 50 },
        "logica": { "nivel": 2, "xp": 120 },
        "calculo": { "nivel": 1, "xp": 80 }
      },
      "misionesCompletadas": ["misionId1", "misionId2"]
    }
    ```

#### Colección: `aventuras`
*   **Documento ID:** `YYYY-MM-DD` (ej. "2025-10-26")
*   **Datos:**
    ```json
    {
      "titulo": "La Aventura de los Polígonos",
      "misiones": [
        {
          "misionId": "mision_poligonos_1",
          "tipo": "opcion-multiple",
          "titulo": "Contando Lados",
          "data": { ... }
        },
        {
          "misionId": "mision_poligonos_2",
          "tipo": "geometria",
          "titulo": "Dibuja un Hexágono",
          "data": { ... }
        }
      ]
    }
    ```

---

## 🚀 Despliegue y CI/CD

*   **Repositorio:** El código fuente se alojará en un repositorio de **GitHub**.
*   **Plataforma de Despliegue:** **Vercel** se conectará a este repositorio.
*   **Flujo de CI/CD (Integración y Despliegue Continuo):**
    1.  **Desarrollo Local:** El trabajo se realiza en ramas (`feature/nombre-funcionalidad`).
    2.  **Pull Request (PR):** Al terminar una funcionalidad, se abre un PR a la rama `main`.
    3.  **Preview Automática:** Vercel automáticamente despliega una versión de "preview" de este PR, con una URL única. Esto permite probar los cambios en un entorno real antes de fusionar.
    4.  **Fusión a `main`:** Una vez que el PR es aprobado y fusionado, Vercel dispara un nuevo despliegue.
    5.  **Producción:** Este nuevo despliegue se convierte automáticamente en la versión de producción accesible para todos.

---

## ✨ Principios de Diseño y Calidad

*   **Component-First:** Pensar en piezas de UI reutilizables antes de construir páginas.
*   **Mobile-First & Child-First:** Diseñar los estilos pensando primero en pantallas pequeñas y en la usabilidad para niños (botones grandes, feedback visual claro). Se implementa una capa de CSS mejorado (`*.enhanced.css`) sobre los estilos base.
*   **Código Limpio y Autodocumentado:** Usar nombres de variables y funciones descriptivos para que el código sea fácil de entender.
*   **Accesibilidad (a11y):** Asegurar que los componentes sean semánticos y accesibles (ej. buen contraste, etiquetas ARIA donde sea necesario, soporte `prefers-reduced-motion`). Se usará **Lighthouse** para auditorías periódicas.
*   **Una Sola Fuente de Verdad (Single Source of Truth):** Evitar duplicar el estado. Los datos deben fluir de una única fuente (el estado del componente, el Context, o Firestore).
