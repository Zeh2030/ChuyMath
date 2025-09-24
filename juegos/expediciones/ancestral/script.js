/**
 * Script específico para la Expedición Ancestral
 * Basado en el código original que SÍ funciona (igual que Marina)
 */

class ExpedicionAncestral extends ExpedicionBase {
    constructor() {
        super(expedicionAncestralConfig);
        this.setupAncestralSpecificEvents();
    }

    setupAncestralSpecificEvents() {
        // Primero cargar el contenido base (matemáticas y kakooma)
        this.populateContent();
        // Luego usar el código original que funciona para opciones múltiples
        this.populateOriginalOptions();
        this.setupOriginalEventListeners();
    }

    // === CÓDIGO ORIGINAL QUE FUNCIONA ===
    populateOriginalOptions() {
        // Función shuffleArray del código original
        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        };

        // Función populateOptions del código original
        const populateOptions = (containerId, optionsData, radioName) => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.log(`ERROR: No se encontró el contenedor ${containerId}`);
                return;
            }
            
            container.innerHTML = '';
            const shuffledData = [...optionsData]; // Crear copia
            shuffleArray(shuffledData);
            
            shuffledData.forEach(opt => {
                const li = document.createElement('li');
                li.innerHTML = `<input type="radio" name="${radioName}" id="${opt.id}" value="${opt.value}"><label for="${opt.id}">${opt.label}</label>`;
                container.appendChild(li);
                
                // FIX TEMPORAL: Forzar estilos correctos
                const label = li.querySelector('label');
                if (label) {
                    label.style.display = 'block';
                    label.style.padding = '15px';
                    label.style.backgroundColor = '#fff';
                    label.style.border = '2px solid #eee';
                    label.style.borderRadius = '10px';
                    label.style.cursor = 'pointer';
                    label.style.fontSize = '1.1rem';
                    label.style.fontWeight = '500';
                    label.style.marginBottom = '10px';
                }
            });
            
            console.log(`Opciones cargadas en ${containerId}:`, shuffledData.length);
        };

        // === GEOGRAFÍA (Egipto) ===
        const geoOptionsData = [
            { id: 'mexico', value: 'mexico', label: 'A) México' },
            { id: 'egipto', value: 'egipto', label: 'B) Egipto' },
            { id: 'china', value: 'china', label: 'C) China' }
        ];
        populateOptions('geo-options', geoOptionsData, 'city');

        // === PLANETAS (Saturno) ===
        const planetOptionsData = [
            { id: 'volcanes', value: 'volcanes', label: 'A) Volcanes' },
            { id: 'anillos', value: 'anillos', label: 'B) Anillos' },
            { id: 'oceanos', value: 'oceanos', label: 'C) Océanos' }
        ];
        populateOptions('planet-options', planetOptionsData, 'planet-answer');

        // === ANIMALES (Mono) ===
        const animalOptionsData = [
            { id: 'leon', value: 'leon', label: 'A) León' },
            { id: 'serpiente', value: 'serpiente', label: 'B) Serpiente' },
            { id: 'mono', value: 'mono', label: 'C) Mono' }
        ];
        populateOptions('animal-options', animalOptionsData, 'animal-answer');

        // Pistas del mono
        const monoClues = [
            'Soy un mamífero muy inteligente que vive en los árboles.',
            'Me encanta comer bananas y frutas dulces.',
            'Soy un pariente cercano de los humanos.',
            'Uso herramientas para conseguir comida.',
            'Me columpio de rama en rama usando mi cola.'
        ];
        
        const cluesList = document.getElementById('animal-clues');
        if (cluesList) {
            cluesList.innerHTML = '';
            const shuffledClues = [...monoClues];
            shuffleArray(shuffledClues);
            shuffledClues.forEach((clue, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${clue}`;
                cluesList.appendChild(li);
            });
        }
    }

    setupOriginalEventListeners() {
        // === CALIFICACIÓN GEOGRAFÍA ===
        const gradeGeoBtn = document.getElementById('grade-geo');
        if (gradeGeoBtn) {
            gradeGeoBtn.addEventListener('click', () => {
                const clueHTML = `<div class="clue-box visible"><strong>¡Pista Secreta!</strong> Los faraones eran los reyes del antiguo Egipto y construyeron las pirámides como tumbas. ¡La Gran Pirámide de Giza fue una de las Siete Maravillas del Mundo Antiguo!<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/1280px-Kheops-Pyramid.jpg" alt="Pirámides de Giza"></div>`;
                this.gradeMultipleChoice('geo-mission', 'geo-results', 'city', clueHTML);
            });
        }

        // === CALIFICACIÓN PLANETAS ===
        const gradePlanetBtn = document.getElementById('grade-planet');
        if (gradePlanetBtn) {
            gradePlanetBtn.addEventListener('click', () => {
                const clueHTML = `<div class="clue-box visible"><strong>¡Pista Secreta!</strong> Los anillos de Saturno están hechos de miles de millones de trozos de hielo y roca. ¡Son tan delgados que si pudieras verlos de lado, apenas serían visibles!<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/1280px-Saturn_during_Equinox.jpg" alt="Saturno y sus anillos"></div>`;
                this.gradeMultipleChoice('planet-mission', 'planet-results', 'planet-answer', clueHTML);
            });
        }

        // === CALIFICACIÓN ANIMALES ===
        const gradeAnimalBtn = document.getElementById('grade-animal');
        if (gradeAnimalBtn) {
            gradeAnimalBtn.addEventListener('click', () => {
                const clueHTML = `<div class="clue-box visible"><strong>¡Pista Secreta!</strong> Los monos pueden usar herramientas como palos para sacar termitas de los hormigueros. ¡Son tan inteligentes que pueden aprender lenguaje de señas y resolver problemas complejos!<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Bonnet_macaque_%28Macaca_radiata%29_Photograph_By_Shantanu_Kuveskar.jpg/1280px-Bonnet_macaque_%28Macaca_radiata%29_Photograph_By_Shantanu_Kuveskar.jpg" alt="Mono en su hábitat"></div>`;
                this.gradeMultipleChoice('animal-mission', 'animal-results', 'animal-answer', clueHTML);
            });
        }
    }

    // === MÉTODO DE CALIFICACIÓN ORIGINAL ===
    gradeMultipleChoice(missionId, resultsId, radioName, clueHTML) {
        const mission = document.getElementById(missionId);
        const resultsArea = document.getElementById(resultsId);
        const correctAnswer = mission.dataset.answer;
        const selectedOption = document.querySelector(`input[name="${radioName}"]:checked`);
        
        // Limpiar estilos anteriores
        document.querySelectorAll(`#${missionId} label`).forEach(l => 
            l.classList.remove('correct', 'incorrect'));
        
        resultsArea.innerHTML = '';
        
        if (selectedOption) {
            const label = document.querySelector(`label[for="${selectedOption.id}"]`);
            if (selectedOption.value === correctAnswer) {
                label.classList.add('correct');
                resultsArea.innerHTML = clueHTML;
                this.playSound('success');
                this.confetti();
                this.markMissionCompleted(missionId.split('-')[0]); // math, geo, planet, animal
            } else {
                label.classList.add('incorrect');
                const correctLabel = document.querySelector(`#${missionId} input[value="${correctAnswer}"] + label`);
                if (correctLabel) correctLabel.classList.add('correct');
                resultsArea.textContent = "Esa no es la respuesta. ¡Inténtalo de nuevo!";
                this.playSound('error');
            }
        } else {
            resultsArea.textContent = "Por favor, elige una opción.";
        }
    }

    // === OVERRIDE DE MÉTODOS DE LA CLASE BASE ===
    populateContent() {
        // No llamar a super.populateContent() para evitar conflictos
        // En su lugar, usar solo nuestro código original
        this.populateOriginalOptions();
        this.setupOriginalEventListeners();
    }

    // === EFECTOS TEMÁTICOS ESPECÍFICOS ===
    
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
    window.expedicionAncestral.startTime = Date.now();
    
    console.log('Expedición Ancestral inicializada con código original');
    
    // VERIFICACIÓN ADICIONAL - Forzar carga después de un delay
    setTimeout(() => {
        console.log('Verificando opciones después de 1 segundo...');
        const planetOptions = document.getElementById('planet-options');
        
        // FIX AGRESIVO: Reemplazar completamente el contenido
        console.log('Aplicando FIX AGRESIVO para planet-options...');
        planetOptions.innerHTML = `
            <li style="margin-bottom: 10px;">
                <input type="radio" name="planet-answer" id="volcanes" value="volcanes" style="display: none;">
                <label for="volcanes" style="display: block; padding: 15px; background-color: #fff; border: 2px solid #eee; border-radius: 10px; cursor: pointer; font-size: 16px; color: #000; font-weight: 500;">A) Volcanes</label>
            </li>
            <li style="margin-bottom: 10px;">
                <input type="radio" name="planet-answer" id="anillos" value="anillos" style="display: none;">
                <label for="anillos" style="display: block; padding: 15px; background-color: #fff; border: 2px solid #eee; border-radius: 10px; cursor: pointer; font-size: 16px; color: #000; font-weight: 500;">B) Anillos</label>
            </li>
            <li style="margin-bottom: 10px;">
                <input type="radio" name="planet-answer" id="oceanos" value="oceanos" style="display: none;">
                <label for="oceanos" style="display: block; padding: 15px; background-color: #fff; border: 2px solid #eee; border-radius: 10px; cursor: pointer; font-size: 16px; color: #000; font-weight: 500;">C) Océanos</label>
            </li>
        `;
        
        console.log('✅ FIX AGRESIVO aplicado. planet-options ahora tiene HTML hardcodeado');
    }, 1000);
});

// === ESTILOS DINÁMICOS PARA ANIMACIONES ESPECÍFICAS ===
const ancestralStyle = document.createElement('style');
ancestralStyle.textContent = `
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
