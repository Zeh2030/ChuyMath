/**
 * Script específico para la Expedición Ancestral
 * Maneja las funcionalidades específicas de esta expedición
 */

class ExpedicionAncestral extends ExpedicionBase {
    constructor() {
        super(expedicionAncestralConfig);
        this.setupAncestralSpecificEvents();
    }

    setupAncestralSpecificEvents() {
        // La expedición ancestral usa solo opciones múltiples para mayor accesibilidad
        this.setupHistoricalThemes();
        this.setupEducationalEnhancements();
    }

    setupHistoricalThemes() {
        // Agregar elementos temáticos históricos
        this.addAncientEgyptianFlair();
        this.addAstronomicalElements();
        this.addPrimateIntelligenceFeatures();
    }

    addAncientEgyptianFlair() {
        // Agregar jeroglíficos decorativos ocasionales
        const sections = document.querySelectorAll('.section');
        sections.forEach((section, index) => {
            if (index === 1) { // Sección de geografía (Egipto)
                const hieroglyphs = ['𓀀', '𓁶', '𓂀', '𓃽', '𓄿', '𓅱', '𓆣'];
                const randomHieroglyph = hieroglyphs[Math.floor(Math.random() * hieroglyphs.length)];
                
                const decoration = document.createElement('div');
                decoration.style.cssText = `
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    font-size: 2rem;
                    opacity: 0.3;
                    pointer-events: none;
                    animation: fadeIn 2s ease;
                `;
                decoration.textContent = randomHieroglyph;
                section.style.position = 'relative';
                section.appendChild(decoration);
            }
        });
    }

    addAstronomicalElements() {
        // Agregar estrellas animadas para la sección de Saturno
        const planetSection = document.getElementById('planet-section');
        if (planetSection) {
            this.createStarField(planetSection);
        }
    }

    createStarField(container) {
        for (let i = 0; i < 15; i++) {
            const star = document.createElement('div');
            star.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: #ffd700;
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: twinkle ${2 + Math.random() * 3}s infinite;
                pointer-events: none;
                z-index: 1;
            `;
            container.style.position = 'relative';
            container.appendChild(star);
        }
    }

    addPrimateIntelligenceFeatures() {
        // Agregar elementos que destaquen la inteligencia de los primates
        const animalSection = document.getElementById('animal-section');
        if (animalSection) {
            const brainIcon = document.createElement('div');
            brainIcon.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                font-size: 1.5rem;
                opacity: 0.6;
                animation: pulse 2s infinite;
                pointer-events: none;
            `;
            brainIcon.textContent = '🧠';
            animalSection.style.position = 'relative';
            animalSection.appendChild(brainIcon);
        }
    }

    setupEducationalEnhancements() {
        // Mejorar la experiencia educativa con contexto histórico
        this.addEducationalContext();
        this.setupProgressCelebrations();
    }

    addEducationalContext() {
        // Agregar datos curiosos después de completar cada sección
        this.educationalFacts = {
            math: "¡Sabías que los antiguos egipcios ya usaban matemáticas avanzadas para construir las pirámides hace 4,500 años!",
            geography: "¡La Gran Pirámide de Giza fue la estructura más alta del mundo durante más de 3,800 años!",
            planets: "¡Saturno es tan ligero que podría flotar en el agua si hubiera un océano lo suficientemente grande!",
            animals: "¡Los chimpancés pueden aprender más de 300 palabras en lenguaje de señas!",
            numberblocks: "¡Los matemáticos antiguos inventaron el concepto del cero, que cambió las matemáticas para siempre!"
        };
    }

    setupProgressCelebrations() {
        // Celebraciones temáticas específicas para cada misión
        this.celebrations = {
            math: () => this.showAncientCalculatorEffect(),
            geography: () => this.showPyramidBuildingEffect(),
            planets: () => this.showSaturnRingsEffect(),
            animals: () => this.showPrimateIntelligenceEffect(),
            numberblocks: () => this.showAncientNumberEffect()
        };
    }

    // === EFECTOS ESPECÍFICOS POR MISIÓN ===

    showAncientCalculatorEffect() {
        this.showTemporaryMessage("🧮 ¡Como un matemático del antiguo Egipto!", 'encouragement');
        this.createFloatingNumbers();
    }

    showPyramidBuildingEffect() {
        this.showTemporaryMessage("🏗️ ¡Eres un constructor de pirámides!", 'encouragement');
        this.createPyramidEffect();
    }

    showSaturnRingsEffect() {
        this.showTemporaryMessage("🪐 ¡Descubriste los secretos de Saturno!", 'encouragement');
        this.createRingsEffect();
    }

    showPrimateIntelligenceEffect() {
        this.showTemporaryMessage("🐒 ¡Tienes la inteligencia de un primate superior!", 'encouragement');
        this.createBananaRain();
    }

    showAncientNumberEffect() {
        this.showTemporaryMessage("🔢 ¡Eres un maestro de números ancestrales!", 'encouragement');
        this.createHieroglyphEffect();
    }

    // === EFECTOS VISUALES ESPECÍFICOS ===

    createFloatingNumbers() {
        const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.createFloatingElements(numbers, '#3498db', 2000);
    }

    createPyramidEffect() {
        const pyramidSymbols = ['🔺', '🔶', '🟧', '🟫'];
        this.createFloatingElements(pyramidSymbols, '#d4af37', 3000);
    }

    createRingsEffect() {
        // Crear anillos que se expanden desde el centro
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ring = document.createElement('div');
                ring.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    width: 50px;
                    height: 50px;
                    border: 3px solid #ffd700;
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    animation: expandRing 2s ease-out forwards;
                    pointer-events: none;
                    z-index: 1000;
                `;
                document.body.appendChild(ring);
                setTimeout(() => ring.remove(), 2000);
            }, i * 400);
        }
    }

    createBananaRain() {
        const bananas = ['🍌', '🐒', '🌿', '🍃'];
        this.createFloatingElements(bananas, '#ffeb3b', 2500);
    }

    createHieroglyphEffect() {
        const hieroglyphs = ['𓀀', '𓁶', '𓂀', '𓃽', '𓄿', '𓅱', '𓆣', '𓇋', '𓈖', '𓉐'];
        this.createFloatingElements(hieroglyphs, '#d4af37', 3000);
    }

    createFloatingElements(elements, color, duration) {
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const element = document.createElement('div');
                element.style.cssText = `
                    position: fixed;
                    top: -20px;
                    left: ${Math.random() * 100}vw;
                    font-size: ${Math.random() * 20 + 15}px;
                    color: ${color};
                    pointer-events: none;
                    z-index: 999;
                    animation: float ${duration}ms ease-out forwards;
                `;
                element.textContent = elements[Math.floor(Math.random() * elements.length)];
                document.body.appendChild(element);
                setTimeout(() => element.remove(), duration);
            }, i * 100);
        }
    }

    // === OVERRIDE DE MÉTODOS PARA CELEBRACIONES ===

    markMissionCompleted(missionType) {
        super.markMissionCompleted(missionType);
        
        // Mostrar dato educativo y celebración específica
        if (this.educationalFacts[missionType]) {
            setTimeout(() => {
                this.showEducationalFact(missionType);
            }, 1000);
        }

        if (this.celebrations[missionType]) {
            setTimeout(() => {
                this.celebrations[missionType]();
            }, 1500);
        }
    }

    showEducationalFact(missionType) {
        const fact = this.educationalFacts[missionType];
        const factDiv = document.createElement('div');
        factDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(45deg, #fff3cd, #ffeaa7);
            border: 2px solid #d4af37;
            border-radius: 15px;
            padding: 15px;
            font-size: 1rem;
            color: #856404;
            text-align: center;
            z-index: 1000;
            animation: slideUp 0.5s ease, slideDown 0.5s ease 4s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        factDiv.innerHTML = `<strong>💡 ¿Sabías que...?</strong><br>${fact}`;
        
        document.body.appendChild(factDiv);
        setTimeout(() => factDiv.remove(), 5000);
    }

    // === FUNCIONES DE UTILIDAD ===

    showTemporaryMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        const colors = {
            'encouragement': 'linear-gradient(45deg, #d4af37, #ffd700)',
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
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    // Crear la instancia de la expedición ancestral
    window.expedicionAncestral = new ExpedicionAncestral();
    
    // Configurar eventos específicos de la expedición ancestral
    setupAncestralSpecialFeatures();
});

// === CARACTERÍSTICAS ESPECIALES DE LA EXPEDICIÓN ANCESTRAL ===
function setupAncestralSpecialFeatures() {
    // Mensaje de bienvenida temático
    setTimeout(() => {
        window.expedicionAncestral.showTemporaryMessage("¡Bienvenido a la Expedición Ancestral! 🏺", 'encouragement');
    }, 1000);
    
    // Agregar contexto histórico cada 3 minutos
    setInterval(() => {
        if (window.expedicionAncestral.completedMissions < window.expedicionAncestral.totalMissions) {
            const historicalFacts = [
                "🏺 Los antiguos egipcios momificaban a sus faraones para la vida después de la muerte.",
                "🪐 Saturno tiene más de 80 lunas conocidas orbitando a su alrededor.",
                "🐒 Los chimpancés comparten el 99% de su ADN con los humanos."
            ];
            const randomFact = historicalFacts[Math.floor(Math.random() * historicalFacts.length)];
            window.expedicionAncestral.showTemporaryMessage(randomFact, 'info');
        }
    }, 180000); // 3 minutos
}

// === ESTILOS DINÁMICOS PARA ANIMACIONES ESPECÍFICAS ===
const ancestralStyle = document.createElement('style');
ancestralStyle.textContent = `
    @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.1); opacity: 1; }
    }
    
    @keyframes expandRing {
        0% { width: 50px; height: 50px; opacity: 1; }
        100% { width: 300px; height: 300px; opacity: 0; }
    }
    
    @keyframes float {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
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
document.head.appendChild(ancestralStyle);
