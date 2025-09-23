/**
 * Script específico para la Expedición Galáctica
 * Maneja las funcionalidades específicas de esta expedición
 */

class ExpedicionGalactica extends ExpedicionBase {
    constructor() {
        super(expedicionGalacticaConfig);
        this.setupGalacticaSpecificEvents();
    }

    setupGalacticaSpecificEvents() {
        // Eventos específicos para misiones de texto (Marte y Pulpo)
        this.setupTextInputMissions();
    }

    setupTextInputMissions() {
        // Configurar eventos para inputs de texto (planetas y animales)
        const planetInput = document.querySelector('#planet-section .answer-input');
        const animalInput = document.querySelector('#animal-section .answer-input');

        // Agregar eventos de "Enter" para facilitar la experiencia
        if (planetInput) {
            planetInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.gradePlanets();
                }
            });
        }

        if (animalInput) {
            animalInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.gradeAnimals();
                }
            });
        }
    }

    // === OVERRIDE DE MÉTODOS PARA MISIONES DE TEXTO ===
    
    gradePlanets() {
        const planetInput = document.querySelector('#planet-section .answer-input');
        const resultsArea = document.getElementById('planet-results');
        const correctAnswer = this.config.planets.answer.toLowerCase();
        
        if (!planetInput || !resultsArea) return;

        const userAnswer = planetInput.value.trim().toLowerCase();
        
        // Limpiar estilos anteriores
        planetInput.classList.remove('correct', 'incorrect');
        resultsArea.innerHTML = '';
        
        if (userAnswer === correctAnswer) {
            planetInput.classList.add('correct');
            resultsArea.innerHTML = this.config.planets.clueHTML;
            this.playSound('success');
            this.markMissionCompleted('planets');
        } else if (userAnswer.length > 0) {
            planetInput.classList.add('incorrect');
            resultsArea.innerHTML = `
                <div style="color: var(--c-danger); margin-top: 10px;">
                    ¡Esa no es la respuesta! 💭 Piensa en el color que asocias con Marte...
                </div>
            `;
            this.playSound('error');
        } else {
            resultsArea.textContent = "Por favor, escribe tu respuesta.";
        }
    }

    gradeAnimals() {
        const animalInput = document.querySelector('#animal-section .answer-input');
        const resultsArea = document.getElementById('animal-results');
        const correctAnswer = this.config.animals.answer.toLowerCase();
        
        if (!animalInput || !resultsArea) return;

        const userAnswer = animalInput.value.trim().toLowerCase();
        
        // Limpiar estilos anteriores
        animalInput.classList.remove('correct', 'incorrect');
        resultsArea.innerHTML = '';
        
        if (userAnswer === correctAnswer) {
            animalInput.classList.add('correct');
            resultsArea.innerHTML = this.config.animals.clueHTML;
            this.playSound('success');
            this.markMissionCompleted('animals');
        } else if (userAnswer.length > 0) {
            animalInput.classList.add('incorrect');
            resultsArea.innerHTML = `
                <div style="color: var(--c-danger); margin-top: 10px;">
                    ¡Esa no es la respuesta! 🤔 Piensa en un animal marino con 8 brazos...
                </div>
            `;
            this.playSound('error');
        } else {
            resultsArea.textContent = "Por favor, escribe tu respuesta.";
        }
    }

    // === OVERRIDE DE POPULATE CONTENT PARA LUNES ===
    
    populateContent() {
        super.populateContent();
        this.populateGalacticaSpecificContent();
    }

    populateGalacticaSpecificContent() {
        // Poblar las pistas del animal (pulpo)
        const animalClues = document.getElementById('animal-clues');
        if (animalClues && this.config.animals.clues) {
            const shuffledClues = this.shuffleArray([...this.config.animals.clues]);
            animalClues.innerHTML = '';
            shuffledClues.forEach((clue, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${clue}`;
                animalClues.appendChild(li);
            });
        }
    }

    // === MEJORAS ESPECÍFICAS PARA KAKOOMA ===
    
    setupKakoomaEvents() {
        super.setupKakoomaEvents();
        
        // Agregar instrucciones adicionales para niños de 7 años
        const kakoomaGrids = document.querySelectorAll('.kakooma-grid');
        kakoomaGrids.forEach(grid => {
            // Agregar indicador visual de progreso
            const targetDiv = grid.querySelector('.kakooma-target');
            if (targetDiv) {
                targetDiv.style.background = 'linear-gradient(45deg, #ff9a9e, #fecfef)';
                targetDiv.style.padding = '10px';
                targetDiv.style.borderRadius = '10px';
                targetDiv.style.color = '#fff';
                targetDiv.style.fontWeight = 'bold';
                targetDiv.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
            }
        });
    }

    // === FUNCIONES DE AYUDA ESPECÍFICAS ===
    
    showHint(sectionId) {
        const hints = {
            'planet-section': '💡 Pista: Piensa en el color que ves cuando miras Marte en el cielo nocturno...',
            'animal-section': '💡 Pista: Este animal marino es famoso por tener muchos brazos y ser muy inteligente...',
            'kakooma-section': '💡 Pista: Encuentra dos o más números que al sumarlos den exactamente el número pedido.'
        };
        
        const hint = hints[sectionId];
        if (hint) {
            const section = document.getElementById(sectionId);
            if (section) {
                const hintDiv = document.createElement('div');
                hintDiv.className = 'hint-message';
                hintDiv.style.cssText = `
                    background: linear-gradient(45deg, #fef9e7, #fcf3cf);
                    border: 2px solid #f39c12;
                    border-radius: 10px;
                    padding: 15px;
                    margin: 10px 0;
                    text-align: center;
                    font-style: italic;
                    color: #d68910;
                    animation: fadeIn 0.5s ease;
                `;
                hintDiv.textContent = hint;
                
                // Insertar después del título
                const title = section.querySelector('h2');
                if (title) {
                    title.insertAdjacentElement('afterend', hintDiv);
                    
                    // Remover después de 5 segundos
                    setTimeout(() => {
                        if (hintDiv.parentNode) {
                            hintDiv.style.animation = 'fadeOut 0.5s ease';
                            setTimeout(() => hintDiv.remove(), 500);
                        }
                    }, 5000);
                }
            }
        }
    }
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    // Crear la instancia de la expedición galáctica
    window.expedicionGalactica = new ExpedicionGalactica();
    
    // Agregar algunos easter eggs divertidos
    setupEasterEggs();
});

// === EASTER EGGS Y FUNCIONES DIVERTIDAS ===
function setupEasterEggs() {
    // Konami Code para activar modo desarrollador
    let konamiCode = [];
    const targetSequence = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        if (konamiCode.length > targetSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === targetSequence.join(',')) {
            activateDevMode();
            konamiCode = [];
        }
    });
    
    // Click secreto en el título
    let clickCount = 0;
    const title = document.querySelector('h1');
    if (title) {
        title.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 7) { // 7 años de Chuy
                showSecretMessage();
                clickCount = 0;
            }
        });
    }
}

function activateDevMode() {
    console.log('🎮 Modo Desarrollador Activado!');
    // Agregar botones de ayuda
    document.querySelectorAll('.section').forEach(section => {
        if (!section.querySelector('.hint-button')) {
            const hintButton = document.createElement('button');
            hintButton.className = 'hint-button';
            hintButton.textContent = '💡 Pista';
            hintButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: linear-gradient(45deg, #f39c12, #e67e22);
                color: white;
                border: none;
                border-radius: 20px;
                padding: 5px 15px;
                font-size: 0.8rem;
                cursor: pointer;
                z-index: 10;
            `;
            section.style.position = 'relative';
            section.appendChild(hintButton);
            
            hintButton.addEventListener('click', () => {
                window.expedicionGalactica.showHint(section.id);
            });
        }
    });
}

function showSecretMessage() {
    const secretDiv = document.createElement('div');
    secretDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #667eea, #764ba2);
        color: white;
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        z-index: 1000;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        animation: bounce 1s ease;
    `;
    secretDiv.innerHTML = `
        <h3 style="margin: 0 0 15px 0; font-family: 'Fredoka', sans-serif;">
            🎂 ¡Mensaje Especial! 🎂
        </h3>
        <p style="margin: 0; font-size: 1.1rem;">
            ¡Feliz cumpleaños, Chuy! 🌟<br>
            Tienes 7 años y eres increíble.<br>
            ¡Sigue explorando y aprendiendo!
        </p>
    `;
    
    document.body.appendChild(secretDiv);
    
    // Confetti especial
    window.expedicionGalactica.confetti();
    window.expedicionGalactica.playSound('complete');
    
    // Remover después de 5 segundos
    setTimeout(() => {
        secretDiv.style.animation = 'fadeOut 1s ease';
        setTimeout(() => secretDiv.remove(), 1000);
    }, 5000);
}

// === ESTILOS DINÁMICOS PARA ANIMACIONES ===
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);
