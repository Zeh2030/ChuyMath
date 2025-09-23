/**
 * Script específico para la Expedición Marina
 * Maneja las funcionalidades específicas de esta expedición
 */

class ExpedicionMarina extends ExpedicionBase {
    constructor() {
        super(expedicionMarinaConfig);
        this.setupMarinaSpecificEvents();
    }

    setupMarinaSpecificEvents() {
        // La expedición marina usa solo opciones múltiples, no necesita eventos especiales de texto
        // Pero podemos agregar algunas mejoras específicas
        this.setupEnhancedFeedback();
    }

    setupEnhancedFeedback() {
        // Agregar feedback mejorado para las respuestas
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.addEventListener('animationend', (e) => {
                if (e.animationName === 'bounce') {
                    this.addCelebrationEffect(section);
                }
            });
        });
    }

    addCelebrationEffect(section) {
        // Efecto especial cuando se completa una sección
        const stars = ['⭐', '🌟', '✨', '💫', '🎉'];
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 2rem;
            animation: celebrationPulse 2s ease-out;
            pointer-events: none;
            z-index: 10;
        `;
        celebration.textContent = stars[Math.floor(Math.random() * stars.length)];
        
        section.style.position = 'relative';
        section.appendChild(celebration);
        
        setTimeout(() => celebration.remove(), 2000);
    }

    // === OVERRIDE DE MÉTODOS PARA MEJOR EXPERIENCIA ===
    
    gradeGeography() {
        super.gradeGeography();
        // Agregar efecto especial para geografía
        const geoSection = document.getElementById('geo-section');
        if (geoSection && this.geographyCompleted) {
            this.addGeographyEffect(geoSection);
        }
    }

    gradePlanets() {
        super.gradePlanets();
        // Agregar efecto especial para planetas
        const planetSection = document.getElementById('planet-section');
        if (planetSection && this.planetsCompleted) {
            this.addPlanetEffect(planetSection);
        }
    }

    gradeAnimals() {
        super.gradeAnimals();
        // Agregar efecto especial para animales
        const animalSection = document.getElementById('animal-section');
        if (animalSection && this.animalsCompleted) {
            this.addAnimalEffect(animalSection);
        }
    }

    // === EFECTOS ESPECÍFICOS POR SECCIÓN ===
    
    addGeographyEffect(section) {
        // Efecto de "viaje" para geografía
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            animation: travelEffect 2s ease-out;
            pointer-events: none;
            z-index: 15;
        `;
        effect.textContent = '✈️🌍';
        section.appendChild(effect);
        setTimeout(() => effect.remove(), 2000);
    }

    addPlanetEffect(section) {
        // Efecto "espacial" para planetas
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 2rem;
            animation: orbitEffect 3s ease-out;
            pointer-events: none;
            z-index: 15;
        `;
        effect.textContent = '🚀🪐✨';
        section.appendChild(effect);
        setTimeout(() => effect.remove(), 3000);
    }

    addAnimalEffect(section) {
        // Efecto "marino" para animales
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            font-size: 2rem;
            animation: swimEffect 2.5s ease-out;
            pointer-events: none;
            z-index: 15;
        `;
        effect.textContent = '🌊🦈💙';
        section.appendChild(effect);
        setTimeout(() => effect.remove(), 2500);
    }

    // === MEJORAS EN LA EXPERIENCIA DE USUARIO ===
    
    populateContent() {
        super.populateContent();
        this.addProgressIndicators();
        
        // Debug: Verificar que las opciones de planetas se carguen
        setTimeout(() => {
            const planetOptions = document.getElementById('planet-options');
            if (planetOptions && planetOptions.children.length === 0) {
                console.log('Error: Las opciones de planetas no se cargaron. Forzando carga...');
                this.populatePlanetsSection();
            }
        }, 100);
    }

    populatePlanetsSection() {
        const planetOptions = document.getElementById('planet-options');
        if (!planetOptions || !this.config.planets.options) {
            console.log('Error: No se encontró planet-options o no hay opciones en config');
            return;
        }

        const shuffledOptions = this.shuffleArray([...this.config.planets.options]);
        planetOptions.innerHTML = '';
        
        shuffledOptions.forEach(option => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="radio" name="planet-answer" id="${option.id}" value="${option.value}">
                <label for="${option.id}">${option.label}</label>
            `;
            planetOptions.appendChild(li);
        });
        
        console.log('Opciones de planetas cargadas:', shuffledOptions.length);
    }

    addProgressIndicators() {
        // Agregar indicadores de progreso visual
        const sections = document.querySelectorAll('.section');
        sections.forEach((section, index) => {
            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                height: 4px;
                background: linear-gradient(90deg, #e9ecef 0%, #e9ecef 100%);
                border-radius: 2px;
                margin-bottom: 15px;
                position: relative;
                overflow: hidden;
            `;
            
            const progressFill = document.createElement('div');
            progressFill.style.cssText = `
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #4CAF50, #45a049);
                border-radius: 2px;
                transition: width 0.5s ease;
            `;
            
            progressBar.appendChild(progressFill);
            
            // Insertar después del título
            const title = section.querySelector('h2');
            if (title) {
                title.insertAdjacentElement('afterend', progressBar);
            }
            
            // Actualizar progreso cuando se completa la sección
            section.progressFill = progressFill;
        });
    }

    markMissionCompleted(missionType) {
        super.markMissionCompleted(missionType);
        
        // Actualizar barra de progreso correspondiente
        const sectionMap = {
            'math': 'math-section',
            'geography': 'geo-section',
            'planets': 'planet-section',
            'animals': 'animal-section',
            'numberblocks': 'numberblocks-section'
        };
        
        const sectionId = sectionMap[missionType];
        if (sectionId) {
            const section = document.getElementById(sectionId);
            if (section && section.progressFill) {
                section.progressFill.style.width = '100%';
                
                // Efecto de pulso
                section.progressFill.style.animation = 'progressPulse 0.6s ease';
            }
        }
    }

    // === FUNCIONES DE AYUDA ESPECÍFICAS PARA MARTES ===
    
    showRandomEncouragement() {
        const encouragements = [
            "¡Excelente trabajo, explorador! 🌟",
            "¡Eres increíble resolviendo esto! 💪",
            "¡Tu curiosidad es fantástica! 🔍",
            "¡Sigue así, campeón! 🏆",
            "¡Qué inteligente eres! 🧠"
        ];
        
        const message = encouragements[Math.floor(Math.random() * encouragements.length)];
        this.showTemporaryMessage(message, 'encouragement');
    }

    showTemporaryMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        const colors = {
            'encouragement': 'linear-gradient(45deg, #56ab2f, #a8e6cf)',
            'info': 'linear-gradient(45deg, #667eea, #764ba2)',
            'warning': 'linear-gradient(45deg, #f093fb, #f5576c)'
        };
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-family: 'Fredoka', sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s;
        `;
        messageDiv.textContent = text;
        
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    // === EASTER EGGS ESPECÍFICOS DEL MARTES ===
    
    checkForMartesEasterEgg() {
        // Si completa todo en menos de 5 minutos
        const startTime = this.startTime || Date.now();
        const completionTime = Date.now();
        const timeDifference = (completionTime - startTime) / (1000 * 60); // minutos
        
        if (timeDifference < 5 && this.completedMissions >= this.totalMissions) {
            this.showSpeedDemonMessage();
        }
    }

    showSpeedDemonMessage() {
        const speedMessage = document.createElement('div');
        speedMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            animation: bounce 1s ease;
        `;
        speedMessage.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-family: 'Fredoka', sans-serif;">
                ⚡ ¡SÚPER RÁPIDO! ⚡
            </h3>
            <p style="margin: 0; font-size: 1.1rem;">
                ¡Completaste todo en tiempo récord!<br>
                ¡Eres un verdadero genio! 🧠✨
            </p>
        `;
        
        document.body.appendChild(speedMessage);
        this.confetti();
        this.playSound('complete');
        
        setTimeout(() => {
            speedMessage.style.animation = 'fadeOut 1s ease';
            setTimeout(() => speedMessage.remove(), 1000);
        }, 4000);
    }
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    // Crear la instancia de la expedición marina
    window.expedicionMarina = new ExpedicionMarina();
    window.expedicionMarina.startTime = Date.now();
    
    // Configurar eventos específicos de la expedición marina
    setupMarinaSpecialFeatures();
});

// === CARACTERÍSTICAS ESPECIALES DE LA EXPEDICIÓN MARINA ===
function setupMarinaSpecialFeatures() {
    // Mensaje de bienvenida específico
    setTimeout(() => {
        window.expedicionMarina.showTemporaryMessage("¡Bienvenido a la Expedición Marina! 🌊", 'encouragement');
    }, 1000);
    
    // Estímulo cada 2 minutos
    setInterval(() => {
        if (window.expedicionMarina.completedMissions < window.expedicionMarina.totalMissions) {
            window.expedicionMarina.showRandomEncouragement();
        }
    }, 120000); // 2 minutos
    
    // Detector de completación rápida
    window.addEventListener('beforeunload', () => {
        if (window.expedicionMarina.completedMissions >= window.expedicionMarina.totalMissions) {
            window.expedicionMarina.checkForMartesEasterEgg();
        }
    });
}

// === ESTILOS DINÁMICOS PARA ANIMACIONES ESPECÍFICAS ===
const marinaStyle = document.createElement('style');
marinaStyle.textContent = `
    @keyframes celebrationPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.8; }
        100% { transform: scale(2); opacity: 0; }
    }
    
    @keyframes travelEffect {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.2); }
        100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
    }
    
    @keyframes orbitEffect {
        0% { transform: translateX(-50%) rotate(0deg); }
        100% { transform: translateX(-50%) rotate(360deg); }
    }
    
    @keyframes swimEffect {
        0% { transform: translateX(0); }
        25% { transform: translateX(20px) rotate(5deg); }
        50% { transform: translateX(40px) rotate(0deg); }
        75% { transform: translateX(60px) rotate(-5deg); }
        100% { transform: translateX(80px) rotate(0deg); opacity: 0; }
    }
    
    @keyframes progressPulse {
        0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
        100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(marinaStyle);
