# 🌌 Sistema de Expediciones Temáticas Modulares

## 📋 Descripción

Este sistema permite crear expediciones temáticas reutilizables con una estructura modular que facilita la creación de nuevas expediciones sin duplicar código. Cada expedición es una aventura emocionante que combina diferentes tipos de misiones educativas.

## 🏗️ Estructura del Sistema

```
juegos/expediciones/
├── expedicion-base.css        # Estilos base compartidos
├── expedicion-base.js         # Lógica base reutilizable
├── galactica/                 # Expedición Galáctica (San Francisco + Marte + Pulpos)
│   ├── index.html
│   ├── config.js
│   └── script.js
├── marina/                    # Expedición Marina (Nueva York + Júpiter + Tiburones)
│   ├── index.html
│   ├── config.js
│   └── script.js
└── README.md                  # Este archivo
```

## 🔧 Componentes del Sistema

### 1. **expedicion-base.css**
- Estilos compartidos para todas las expediciones
- Variables CSS para consistencia visual
- Componentes reutilizables (botones, tarjetas, formularios)
- Animaciones y efectos
- Diseño responsive

### 2. **expedicion-base.js**
- Clase `ExpedicionBase` con funcionalidad común
- Sistema de audio y efectos visuales
- Manejo del canvas de dibujo
- Lógica de calificación base
- Gestión de progreso y finalización

### 3. **Carpetas por Expedición (galactica/, marina/, etc.)**
Cada expedición tiene su propia carpeta con:

#### **index.html**
- Estructura HTML específica de la expedición
- Referencias a archivos base y específicos
- Elementos únicos de cada expedición

#### **config.js**
- Configuración específica de la expedición
- Preguntas, respuestas, opciones múltiples
- Datos de misiones específicas
- URLs de imágenes

#### **script.js**
- Clase específica que extiende `ExpedicionBase`
- Lógica particular de cada expedición
- Easter eggs y características especiales

## 🎮 Tipos de Misiones Soportadas

### 1. **Misión de Operaciones (Math)**
```javascript
math: {
    exercises: [
        { question: '15 + 8', answer: '23' },
        { question: '32 - 17', answer: '15' }
    ]
}
```

### 2. **Misión Kakooma**
```javascript
kakooma: {
    puzzles: [
        {
            target: 8,
            numbers: [2, 6, 8, 3, 5, 1, 4, 7, 9]
        }
    ]
}
```

### 3. **Misión Geográfica**
```javascript
geography: {
    answer: 'sf',
    options: [
        { id: 'paris', value: 'paris', label: 'A) París' },
        { id: 'sf', value: 'sf', label: 'B) San Francisco' }
    ],
    clueHTML: '<div class="clue-box">...</div>'
}
```

### 4. **Misión Cósmica (Planetas)**
```javascript
planets: {
    answer: 'rojo',
    inputType: 'text', // o sin definir para opciones múltiples
    clueHTML: '<div class="clue-box">...</div>'
}
```

### 5. **Misión Marina (Animales)**
```javascript
animals: {
    answer: 'pulpo',
    clues: ['Pista 1', 'Pista 2'],
    inputType: 'text', // o options para múltiple
    clueHTML: '<div class="clue-box">...</div>'
}
```

### 6. **Misión Numberblocks**
```javascript
numberblocks: {
    operation: 'Dibuja Numberblocks para 4 + 3 = 7',
    enabled: true
}
```

## 🆕 Cómo Crear una Nueva Expedición

### Paso 1: Crear Carpeta
```bash
mkdir juegos/expediciones/continental
```

### Paso 2: Crear config.js
```javascript
const expedicionContinentalConfig = {
    name: 'continental',
    title: '🗺️ Expedición Continental',
    subtitle: 'Europa, Asia y Culturas del Mundo',
    
    math: {
        exercises: [
            { question: '20 + 15', answer: '35' }
        ]
    },
    
    geography: {
        answer: 'paris',
        options: [
            { id: 'paris', value: 'paris', label: 'A) París' },
            { id: 'london', value: 'london', label: 'B) Londres' }
        ],
        clueHTML: '<div class="clue-box">¡Torre Eiffel!</div>'
    }
    // ... más misiones
};
```

### Paso 3: Crear index.html
- Copiar estructura de `galactica/index.html`
- Cambiar título y referencias
- Ajustar contenido específico

### Paso 4: Crear script.js
```javascript
class ExpedicionContinental extends ExpedicionBase {
    constructor() {
        super(expedicionContinentalConfig);
        // Lógica específica de la expedición continental
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.expedicionContinental = new ExpedicionContinental();
});
```

### Paso 5: Actualizar manifest.json
```json
{
    "id": "expedicion-continental",
    "titulo": "Expedición Continental",
    "descripcion": "¡Explora Europa, Asia y las culturas del mundo!",
    "icono": "🗺️",
    "temas": ["mates", "geografia", "cultura"],
    "esJuegoEspecial": true,
    "urlJuego": "../juegos/expediciones/continental/index.html"
}
```

## ✨ Características Especiales

### 🎵 Sistema de Audio
- Sonidos de éxito y error
- Melodías de completación
- Compatible con Tone.js

### 🎉 Efectos Visuales
- Confetti personalizable
- Animaciones de celebración
- Transiciones suaves

### 📱 Diseño Responsive
- Adaptable a móviles y tablets
- Touch events para canvas
- Interfaz amigable para niños

### 🎮 Easter Eggs
- Konami Code
- Clicks secretos
- Mensajes especiales

## 🛠️ Mejoras Implementadas

### Para Niños de 7 Años:
1. **Kakooma Simplificado**: Números menores (2-10)
2. **Instrucciones Claras**: Explicaciones visuales
3. **Feedback Inmediato**: Respuestas instantáneas
4. **Progreso Visual**: Barras de progreso

### Optimizaciones Técnicas:
1. **Código Reutilizable**: Una base para todas las expediciones
2. **Mantenimiento Fácil**: Cambios en un lugar afectan todo
3. **Escalabilidad**: Fácil agregar nuevas expediciones
4. **Performance**: Código optimizado y modular

## 🔗 Integración con el Sistema

Las expediciones se integran automáticamente con:
- **Dashboard**: Aparecen en accesos rápidos
- **Bóveda**: Se listan como juegos especiales
- **Progreso**: Se guarda en localStorage
- **Navegación**: Botones de retorno integrados

## 📊 Ventajas del Sistema Modular

1. **Mantenimiento**: Un cambio en base afecta todas las expediciones
2. **Consistencia**: Mismo look & feel en todas las expediciones  
3. **Velocidad de Desarrollo**: Crear nuevas expediciones es rápido
4. **Escalabilidad**: Fácil agregar nuevos tipos de misiones
5. **Reutilización**: Componentes compartidos reducen duplicación

## 🎯 Expediciones Disponibles

### 🌌 **Expedición Galáctica**
**Destinos**: San Francisco, Marte, Océanos  
**Misiones**: Matemáticas, Kakooma, Geografía, Planetas, Animales, Numberblocks  
**Características**: Inputs de texto para mayor desafío, Easter eggs especiales

### 🌊 **Expedición Marina**  
**Destinos**: Nueva York, Júpiter, Profundidades Marinas  
**Misiones**: Matemáticas, Geografía, Planetas, Animales, Numberblocks  
**Características**: Todo en opciones múltiples, efectos visuales mejorados

## 🚀 Futuras Expediciones Sugeridas

1. **🗺️ Expedición Continental** (Europa + Asia + Culturas)
2. **🦕 Expedición Prehistórica** (Dinosaurios + Fósiles + Historia)
3. **🎭 Expedición Cultural** (Arte + Música + Monumentos)
4. **🏔️ Expedición Extrema** (Montañas + Deportes + Clima)
5. **🌸 Expedición Botánica** (Plantas + Ecosistemas + Biología)
