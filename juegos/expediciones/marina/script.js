/**
 * Script específico para la Expedición Marina
 * Basado en el código original que SÍ funciona
 */

class ExpedicionMarina extends ExpedicionBase {
    constructor() {
        super(expedicionMarinaConfig);
        this.setupMarinaSpecificEvents();
    }

    setupMarinaSpecificEvents() {
        // Usar el código original que funciona
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
            console.log(`HTML generado:`, container.innerHTML.substring(0, 200) + '...');
            
            // DEBUG VISUAL: Verificar que los elementos sean visibles
            setTimeout(() => {
                const labels = container.querySelectorAll('label');
                console.log(`DEBUG ${containerId}: Encontrados ${labels.length} labels`);
                labels.forEach((label, index) => {
                    const rect = label.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(label);
                    console.log(`Label ${index}:`, {
                        text: label.textContent,
                        visible: rect.width > 0 && rect.height > 0,
                        dimensions: `${rect.width}x${rect.height}`,
                        display: computedStyle.display,
                        opacity: computedStyle.opacity,
                        visibility: computedStyle.visibility,
                        overflow: computedStyle.overflow,
                        color: computedStyle.color,
                        backgroundColor: computedStyle.backgroundColor,
                        textContent: label.textContent,
                        innerHTML: label.innerHTML
                    });
                    
                    // FORZAR VISIBILIDAD TOTAL
                    label.style.visibility = 'visible';
                    label.style.overflow = 'visible';
                    label.style.color = '#000';
                    label.style.fontSize = '16px';
                    label.style.lineHeight = '1.5';
                    label.style.minHeight = '50px';
                    label.style.width = '100%';
                });
                
                // DEBUG: Verificar el contenedor padre
                console.log(`DEBUG ${containerId} container:`, {
                    tagName: container.tagName,
                    className: container.className,
                    id: container.id,
                    children: container.children.length,
                    innerHTML: container.innerHTML.substring(0, 500)
                });
            }, 100);
        };

        // === GEOGRAFÍA (Nueva York) ===
        const geoOptionsData = [
            { id: 'paris', value: 'paris', label: 'A) París' },
            { id: 'ny', value: 'ny', label: 'B) Nueva York' },
            { id: 'tokio', value: 'tokio', label: 'C) Tokio' }
        ];
        populateOptions('geo-options', geoOptionsData, 'city');

        // === PLANETAS (Júpiter) ===
        const planetOptionsData = [
            { id: 'pequeno', value: 'pequeno', label: 'A) Pequeño' },
            { id: 'rocoso', value: 'rocoso', label: 'B) Rocoso' },
            { id: 'gigante', value: 'gigante', label: 'C) Gigante' }
        ];
        populateOptions('planet-options', planetOptionsData, 'planet-answer');

        // === ANIMALES (Tiburón) ===
        const animalOptionsData = [
            { id: 'delfin', value: 'delfin', label: 'A) Delfín' },
            { id: 'tiburon', value: 'tiburon', label: 'B) Tiburón' },
            { id: 'ballena', value: 'ballena', label: 'C) Ballena' }
        ];
        populateOptions('animal-options', animalOptionsData, 'animal-answer');

        // Pistas del tiburón
        const tiburonClues = [
            'Soy un famoso cazador del océano.',
            'Tengo filas y filas de dientes afilados.',
            'No tengo huesos, mi esqueleto es de cartílago.'
        ];
        
        const cluesList = document.getElementById('animal-clues');
        if (cluesList) {
            cluesList.innerHTML = '';
            const shuffledClues = [...tiburonClues];
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
                const clueHTML = `<div class="clue-box visible"><strong>¡Pista Secreta!</strong> La Estatua de la Libertad fue un regalo de Francia. ¡Su antorcha representa la libertad e ilumina el camino para todos los que llegan a la ciudad!<img src="https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Estatua de la Libertad"></div>`;
                this.gradeMultipleChoice('geo-mission', 'geo-results', 'city', clueHTML);
            });
        }

        // === CALIFICACIÓN PLANETAS ===
        const gradePlanetBtn = document.getElementById('grade-planet');
        if (gradePlanetBtn) {
            gradePlanetBtn.addEventListener('click', () => {
                const clueHTML = `<div class="clue-box visible"><strong>¡Pista Secreta!</strong> Júpiter tiene una tormenta gigante llamada la 'Gran Mancha Roja'. ¡Es más grande que todo el planeta Tierra!<img src="https://i.ytimg.com/vi/O1WLJTlESW4/maxresdefault.jpg" alt="La Gran Mancha Roja de Júpiter"></div>`;
                this.gradeMultipleChoice('planet-mission', 'planet-results', 'planet-answer', clueHTML);
            });
        }

        // === CALIFICACIÓN ANIMALES ===
        const gradeAnimalBtn = document.getElementById('grade-animal');
        if (gradeAnimalBtn) {
            gradeAnimalBtn.addEventListener('click', () => {
                const clueHTML = `<div class="clue-box visible"><strong>¡Pista Secreta!</strong> Los tiburones pueden tener miles de dientes en su vida. Si se les cae uno, ¡otro nuevo crece para reemplazarlo! Por eso siempre tienen una sonrisa afilada.<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Tiger_shark_jaw_and_teeth_-_top_and_bottom.jpg/1280px-Tiger_shark_jaw_and_teeth_-_top_and_bottom.jpg" alt="Mandíbula y dientes de tiburón"></div>`;
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
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    // Crear la instancia de la expedición marina
    window.expedicionMarina = new ExpedicionMarina();
    window.expedicionMarina.startTime = Date.now();
    
    console.log('Expedición Marina inicializada con código original');
    
    // VERIFICACIÓN ADICIONAL - Forzar carga después de un delay
    setTimeout(() => {
        console.log('Verificando opciones después de 1 segundo...');
        const planetOptions = document.getElementById('planet-options');
        
        // FIX AGRESIVO: Reemplazar completamente el contenido
        console.log('Aplicando FIX AGRESIVO para planet-options...');
        planetOptions.innerHTML = `
            <li style="margin-bottom: 10px;">
                <input type="radio" name="planet-answer" id="pequeno" value="pequeno" style="display: none;">
                <label for="pequeno" style="display: block; padding: 15px; background-color: #fff; border: 2px solid #eee; border-radius: 10px; cursor: pointer; font-size: 16px; color: #000; font-weight: 500;">A) Pequeño</label>
            </li>
            <li style="margin-bottom: 10px;">
                <input type="radio" name="planet-answer" id="rocoso" value="rocoso" style="display: none;">
                <label for="rocoso" style="display: block; padding: 15px; background-color: #fff; border: 2px solid #eee; border-radius: 10px; cursor: pointer; font-size: 16px; color: #000; font-weight: 500;">B) Rocoso</label>
            </li>
            <li style="margin-bottom: 10px;">
                <input type="radio" name="planet-answer" id="gigante" value="gigante" style="display: none;">
                <label for="gigante" style="display: block; padding: 15px; background-color: #fff; border: 2px solid #eee; border-radius: 10px; cursor: pointer; font-size: 16px; color: #000; font-weight: 500;">C) Gigante</label>
            </li>
        `;
        
        console.log('✅ FIX AGRESIVO aplicado. planet-options ahora tiene HTML hardcodeado');
        
        // Verificar que se vean
        setTimeout(() => {
            const labels = planetOptions.querySelectorAll('label');
            labels.forEach((label, index) => {
                const rect = label.getBoundingClientRect();
                console.log(`Label ${index} después del fix:`, {
                    text: label.textContent,
                    dimensions: `${rect.width}x${rect.height}`,
                    visible: rect.width > 0 && rect.height > 0
                });
            });
        }, 200);
    }, 1000);
});
