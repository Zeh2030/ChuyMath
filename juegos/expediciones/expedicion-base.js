/**
 * JavaScript Base para Expediciones
 * Sistema modular reutilizable para expediciones temáticas
 */

class ExpedicionBase {
    constructor(config) {
        this.config = config;
        this.completedMissions = 0;
        this.totalMissions = 0;
        this.init();
    }

    init() {
        this.setupAudio();
        this.setupEventListeners();
        this.populateContent();
        this.setupDrawingCanvas();
        this.countTotalMissions();
    }

    // === SISTEMA DE AUDIO Y EFECTOS ===
    setupAudio() {
        this.audioEnabled = true;
        try {
            // Verificar si Tone.js está disponible
            if (typeof Tone !== 'undefined') {
                this.synth = new Tone.Synth().toDestination();
            }
        } catch (e) {
            console.log("Audio context not available.");
            this.audioEnabled = false;
        }
    }

    playSound(type) {
        if (!this.audioEnabled || !this.synth) return;
        
        try {
            if (type === 'success') {
                this.synth.triggerAttackRelease("C5", "8n", Tone.now());
                setTimeout(() => this.synth.triggerAttackRelease("E5", "8n", Tone.now() + 0.1), 100);
                setTimeout(() => this.synth.triggerAttackRelease("G5", "8n", Tone.now() + 0.2), 200);
            } else if (type === 'error') {
                this.synth.triggerAttackRelease("C3", "8n", Tone.now());
            } else if (type === 'complete') {
                // Melodía de victoria
                const notes = ["C5", "E5", "G5", "C6"];
                notes.forEach((note, index) => {
                    setTimeout(() => this.synth.triggerAttackRelease(note, "8n", Tone.now()), index * 150);
                });
            }
        } catch (e) {
            console.log("Error playing sound:", e);
        }
    }

    confetti() {
        const confettiContainer = document.body;
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        
        for (let i = 0; i < 50; i++) {
            const confettiEl = document.createElement('div');
            confettiEl.style.position = 'fixed';
            confettiEl.style.left = `${Math.random() * 100}vw`;
            confettiEl.style.top = `${Math.random() * -100}vh`;
            confettiEl.style.width = `${Math.random() * 10 + 5}px`;
            confettiEl.style.height = `${Math.random() * 10 + 5}px`;
            confettiEl.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confettiEl.style.opacity = '0.8';
            confettiEl.style.transition = 'transform 2s ease-out, opacity 2s ease-out';
            confettiEl.style.zIndex = '1000';
            confettiEl.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confettiContainer.appendChild(confettiEl);

            setTimeout(() => {
                confettiEl.style.transform = `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`;
                confettiEl.style.opacity = '0';
            }, 10);
            
            setTimeout(() => confettiEl.remove(), 2010);
        }
    }

    // === UTILIDADES ===
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // === SETUP DE CONTENIDO ===
    populateContent() {
        if (this.config.math) this.populateMathSection();
        if (this.config.kakooma) this.populateKakoomaSection();
        if (this.config.geography) this.populateGeographySection();
        if (this.config.planets) this.populatePlanetsSection();
        if (this.config.animals) this.populateAnimalsSection();
    }

    populateMathSection() {
        const mathGrid = document.getElementById('math-grid');
        if (!mathGrid || !this.config.math.exercises) return;

        mathGrid.innerHTML = '';
        this.config.math.exercises.forEach((exercise, index) => {
            const exerciseDiv = document.createElement('div');
            exerciseDiv.className = 'exercise';
            exerciseDiv.dataset.answer = exercise.answer;
            exerciseDiv.innerHTML = `
                <div class="horizontal-op">${exercise.question} =</div>
                <input type="number" class="answer-input" inputmode="numeric" placeholder="?">
            `;
            mathGrid.appendChild(exerciseDiv);
        });
    }

    populateKakoomaSection() {
        const kakoomaGrid = document.getElementById('kakooma-grid');
        if (!kakoomaGrid || !this.config.kakooma.puzzles) return;

        kakoomaGrid.innerHTML = '';
        this.config.kakooma.puzzles.forEach((puzzle, puzzleIndex) => {
            const puzzleCard = document.createElement('div');
            puzzleCard.className = 'puzzle-card';
            puzzleCard.innerHTML = `
                <div class="kakooma-target">Busca números que sumen: ${puzzle.target}</div>
                <div class="kakooma-grid" data-target="${puzzle.target}" data-puzzle="${puzzleIndex}">
                    ${puzzle.numbers.map((num, index) => 
                        `<div class="kakooma-number" data-value="${num}" data-index="${index}">${num}</div>`
                    ).join('')}
                </div>
            `;
            kakoomaGrid.appendChild(puzzleCard);
        });

        // Agregar eventos de clic para Kakooma
        this.setupKakoomaEvents();
    }

    setupKakoomaEvents() {
        document.querySelectorAll('.kakooma-number').forEach(numberEl => {
            numberEl.addEventListener('click', (e) => {
                const grid = e.target.closest('.kakooma-grid');
                const target = parseInt(grid.dataset.target);
                
                // Toggle selección
                e.target.classList.toggle('selected');
                
                // Calcular suma actual
                const selectedNumbers = grid.querySelectorAll('.kakooma-number.selected');
                const currentSum = Array.from(selectedNumbers).reduce((sum, el) => 
                    sum + parseInt(el.dataset.value), 0);
                
                // Verificar si encontró la respuesta
                if (currentSum === target && selectedNumbers.length >= 2) {
                    selectedNumbers.forEach(el => {
                        el.classList.remove('selected');
                        el.classList.add('correct');
                    });
                    this.playSound('success');
                } else if (currentSum > target) {
                    // Reiniciar si se pasa del objetivo
                    selectedNumbers.forEach(el => el.classList.remove('selected'));
                }
            });
        });
    }

    populateGeographySection() {
        const geoOptions = document.getElementById('geo-options');
        if (!geoOptions || !this.config.geography.options) return;

        const shuffledOptions = this.shuffleArray(this.config.geography.options);
        geoOptions.innerHTML = '';
        
        shuffledOptions.forEach(option => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="radio" name="city" id="${option.id}" value="${option.value}">
                <label for="${option.id}">${option.label}</label>
            `;
            geoOptions.appendChild(li);
        });
    }

    populatePlanetsSection() {
        const planetOptions = document.getElementById('planet-options');
        if (!planetOptions || !this.config.planets.options) return;

        const shuffledOptions = this.shuffleArray(this.config.planets.options);
        planetOptions.innerHTML = '';
        
        shuffledOptions.forEach(option => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="radio" name="planet-answer" id="${option.id}" value="${option.value}">
                <label for="${option.id}">${option.label}</label>
            `;
            planetOptions.appendChild(li);
        });
    }

    populateAnimalsSection() {
        const animalClues = document.getElementById('animal-clues');
        const animalOptions = document.getElementById('animal-options');
        
        if (animalClues && this.config.animals.clues) {
            const shuffledClues = this.shuffleArray(this.config.animals.clues);
            animalClues.innerHTML = '';
            shuffledClues.forEach((clue, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${clue}`;
                animalClues.appendChild(li);
            });
        }

        if (animalOptions && this.config.animals.options) {
            const shuffledOptions = this.shuffleArray(this.config.animals.options);
            animalOptions.innerHTML = '';
            shuffledOptions.forEach(option => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <input type="radio" name="animal-answer" id="${option.id}" value="${option.value}">
                    <label for="${option.id}">${option.label}</label>
                `;
                animalOptions.appendChild(li);
            });
        }
    }

    // === EVENTOS ===
    setupEventListeners() {
        // Math grading
        const gradeMathBtn = document.getElementById('grade-math');
        if (gradeMathBtn) {
            gradeMathBtn.addEventListener('click', () => this.gradeMath());
        }

        // Kakooma grading
        const gradeKakoomaBtn = document.getElementById('grade-kakooma');
        if (gradeKakoomaBtn) {
            gradeKakoomaBtn.addEventListener('click', () => this.gradeKakooma());
        }

        // Geography grading
        const gradeGeoBtn = document.getElementById('grade-geo');
        if (gradeGeoBtn) {
            gradeGeoBtn.addEventListener('click', () => this.gradeGeography());
        }

        // Planets grading
        const gradePlanetBtn = document.getElementById('grade-planet');
        if (gradePlanetBtn) {
            gradePlanetBtn.addEventListener('click', () => this.gradePlanets());
        }

        // Animals grading
        const gradeAnimalBtn = document.getElementById('grade-animal');
        if (gradeAnimalBtn) {
            gradeAnimalBtn.addEventListener('click', () => this.gradeAnimals());
        }

        // Numberblocks grading
        const gradeNumberblocksBtn = document.getElementById('grade-numberblocks');
        if (gradeNumberblocksBtn) {
            gradeNumberblocksBtn.addEventListener('click', () => this.gradeNumberblocks());
        }

        // Restart button (if exists)
        const restartBtn = document.getElementById('restart-adventure');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartAdventure());
        }
    }

    // === MÉTODOS DE CALIFICACIÓN ===
    gradeMath() {
        let correctCount = 0;
        const exercises = document.querySelectorAll('#math-grid .exercise');
        
        exercises.forEach(ex => {
            const input = ex.querySelector('.answer-input');
            input.classList.remove('correct', 'incorrect');
            
            if (input.value && input.value == ex.dataset.answer) {
                input.classList.add('correct');
                correctCount++;
            } else if (input.value) {
                input.classList.add('incorrect');
            }
        });

        const resultsArea = document.getElementById('math-results');
        resultsArea.textContent = `Resultado: ${correctCount} de ${exercises.length} correctas.`;
        
        if (correctCount === exercises.length) {
            this.playSound('success');
            this.confetti();
            this.markMissionCompleted('math');
        } else if (correctCount > 0) {
            this.playSound('success');
        } else {
            this.playSound('error');
        }
    }

    gradeKakooma() {
        let correctPuzzles = 0;
        const puzzleCards = document.querySelectorAll('.puzzle-card');
        
        puzzleCards.forEach(card => {
            const correctNumbers = card.querySelectorAll('.kakooma-number.correct');
            if (correctNumbers.length >= 2) {
                correctPuzzles++;
            }
        });

        const resultsArea = document.getElementById('kakooma-results');
        resultsArea.textContent = `¡Encontraste ${correctPuzzles} de ${puzzleCards.length} combinaciones!`;
        
        if (correctPuzzles === puzzleCards.length) {
            this.playSound('success');
            this.confetti();
            this.markMissionCompleted('kakooma');
        } else if (correctPuzzles > 0) {
            this.playSound('success');
        }
    }

    gradeMultipleChoice(missionId, resultsId, radioName, clueHTML, configKey) {
        const mission = document.getElementById(missionId);
        const resultsArea = document.getElementById(resultsId);
        const correctAnswer = this.config[configKey].answer;
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
                this.markMissionCompleted(configKey);
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

    gradeGeography() {
        if (!this.config.geography) return;
        this.gradeMultipleChoice(
            'geo-mission', 
            'geo-results', 
            'city', 
            this.config.geography.clueHTML,
            'geography'
        );
    }

    gradePlanets() {
        if (!this.config.planets) return;
        this.gradeMultipleChoice(
            'planet-mission', 
            'planet-results', 
            'planet-answer', 
            this.config.planets.clueHTML,
            'planets'
        );
    }

    gradeAnimals() {
        if (!this.config.animals) return;
        this.gradeMultipleChoice(
            'animal-mission', 
            'animal-results', 
            'animal-answer', 
            this.config.animals.clueHTML,
            'animals'
        );
    }

    gradeNumberblocks() {
        const resultsArea = document.getElementById('numberblocks-results');
        resultsArea.textContent = '¡Fantástico! Un dibujo muy creativo.';
        this.playSound('success');
        this.confetti();
        this.markMissionCompleted('numberblocks');
    }

    // === CANVAS DE DIBUJO ===
    setupDrawingCanvas() {
        const canvas = document.getElementById('drawing-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let drawing = false;
        let lastX = 0;
        let lastY = 0;
        
        const canvasContainer = document.querySelector('.canvas-container');
        
        // Función para redimensionar canvas
        const resizeCanvas = () => {
            canvas.width = canvasContainer.offsetWidth;
            canvas.height = 300;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Configuración inicial del context
        ctx.strokeStyle = '#e53935';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Función para obtener posición del evento
        const getEventPosition = (e) => {
            const rect = canvas.getBoundingClientRect();
            if (e.touches && e.touches.length > 0) {
                return { 
                    x: e.touches[0].clientX - rect.left, 
                    y: e.touches[0].clientY - rect.top 
                };
            } else {
                return { 
                    x: e.clientX - rect.left, 
                    y: e.clientY - rect.top 
                };
            }
        };

        // Funciones de dibujo
        const startDrawing = (e) => {
            drawing = true;
            const pos = getEventPosition(e);
            [lastX, lastY] = [pos.x, pos.y];
        };

        const draw = (e) => {
            if (!drawing) return;
            e.preventDefault();
            const pos = getEventPosition(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            [lastX, lastY] = [pos.x, pos.y];
        };

        const stopDrawing = () => {
            drawing = false;
        };

        // Event listeners para mouse
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Event listeners para touch
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);

        // Herramientas de color
        document.getElementById('color-red')?.addEventListener('click', () => 
            ctx.strokeStyle = '#e53935');
        document.getElementById('color-blue')?.addEventListener('click', () => 
            ctx.strokeStyle = '#1e88e5');
        document.getElementById('color-yellow')?.addEventListener('click', () => 
            ctx.strokeStyle = '#fdd835');
        document.getElementById('color-green')?.addEventListener('click', () => 
            ctx.strokeStyle = '#43a047');
        
        // Limpiar canvas
        document.getElementById('clear-canvas')?.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        // Guardar dibujo
        document.getElementById('save-drawing')?.addEventListener('click', () => {
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `mi-dibujo-${this.config.name || 'expedicion'}.png`;
            link.href = dataURL;
            link.click();
        });
    }

    // === PROGRESO Y FINALIZACIÓN ===
    countTotalMissions() {
        this.totalMissions = 0;
        if (this.config.math) this.totalMissions++;
        if (this.config.kakooma) this.totalMissions++;
        if (this.config.geography) this.totalMissions++;
        if (this.config.planets) this.totalMissions++;
        if (this.config.animals) this.totalMissions++;
        if (this.config.numberblocks) this.totalMissions++;
    }

    markMissionCompleted(missionType) {
        if (!this[`${missionType}Completed`]) {
            this[`${missionType}Completed`] = true;
            this.completedMissions++;
            this.checkAllMissionsCompleted();
        }
    }

    checkAllMissionsCompleted() {
        if (this.completedMissions >= this.totalMissions) {
            setTimeout(() => {
                this.showFinalNavigation();
                this.playSound('complete');
                this.confetti();
            }, 1500);
        }
    }

    showFinalNavigation() {
        const finalNav = document.getElementById('final-navigation');
        if (finalNav) {
            finalNav.classList.remove('hidden');
            finalNav.scrollIntoView({ behavior: 'smooth' });
        }
    }

    restartAdventure() {
        // Reiniciar todos los estados
        this.completedMissions = 0;
        Object.keys(this).forEach(key => {
            if (key.endsWith('Completed')) {
                this[key] = false;
            }
        });

        // Limpiar formularios
        document.querySelectorAll('input').forEach(input => {
            input.value = '';
            input.classList.remove('correct', 'incorrect');
            if (input.type === 'radio') input.checked = false;
        });

        // Limpiar resultados
        document.querySelectorAll('.results-area').forEach(area => {
            area.innerHTML = '';
        });

        // Limpiar estilos de labels
        document.querySelectorAll('label').forEach(label => {
            label.classList.remove('correct', 'incorrect');
        });

        // Limpiar kakooma
        document.querySelectorAll('.kakooma-number').forEach(num => {
            num.classList.remove('selected', 'correct', 'incorrect');
        });

        // Limpiar canvas
        const canvas = document.getElementById('drawing-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Ocultar navegación final
        const finalNav = document.getElementById('final-navigation');
        if (finalNav) {
            finalNav.classList.add('hidden');
        }

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Hacer disponible globalmente
window.ExpedicionBase = ExpedicionBase;
