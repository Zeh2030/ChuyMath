/**
 * Script específico para la Expedición Marina
 * Maneja las funcionalidades específicas de esta expedición
 */

class ExpedicionMarina extends ExpedicionBase {
    constructor() {
        super(expedicionMarinaConfig);
        console.log('🌊 ExpedicionMarina inicializada');
        this.setupMarinaSpecificEvents();
    }

    setupMarinaSpecificEvents() {
        // Los eventos de calificación se manejan a través de los botones de calificar
        // No necesitamos event listeners en los radio buttons
        console.log('Configuración de misiones de opción múltiple completada');
        // La llamada a setupKakoomaEvents() se elimina de aquí
    }

    // === OVERRIDE DE MÉTODOS PARA MISIONES DE OPCIÓN MÚLTIPLE ===

    gradeGeography() {
        const selectedOption = document.querySelector('input[name="city"]:checked');
        const resultsArea = document.getElementById('geo-results');
        const correctAnswer = this.config.geography.answer;

        if (!selectedOption) {
            resultsArea.innerHTML = `<div style="color: var(--c-danger); margin-top: 10px;">¡Selecciona una opción!</div>`;
            this.playSound('error');
            return;
        }

        const userAnswer = selectedOption.value;
        resultsArea.innerHTML = ''; // Limpiar resultados anteriores

        if (userAnswer === correctAnswer) {
            resultsArea.innerHTML = this.config.geography.clueHTML;
            this.playSound('success');
            this.markMissionCompleted('geography');
        } else {
            resultsArea.innerHTML = `<div style="color: var(--c-danger); margin-top: 10px;">¡Incorrecto! ${this.config.geography.clueHTML}</div>`;
            this.playSound('error');
        }
    }

    gradePlanets() {
        const selectedOption = document.querySelector('input[name="planet-answer"]:checked');
        const resultsArea = document.getElementById('planet-results');
        const correctAnswer = this.config.planets.answer;

        if (!selectedOption) {
            resultsArea.innerHTML = `<div style="color: var(--c-danger); margin-top: 10px;">¡Selecciona una opción!</div>`;
            this.playSound('error');
            return;
        }

        const userAnswer = selectedOption.value;
        resultsArea.innerHTML = ''; // Limpiar resultados anteriores

        if (userAnswer === correctAnswer) {
            resultsArea.innerHTML = this.config.planets.clueHTML;
            this.playSound('success');
            this.markMissionCompleted('planets');
        } else {
            resultsArea.innerHTML = `<div style="color: var(--c-danger); margin-top: 10px;">¡Incorrecto! ${this.config.planets.clueHTML}</div>`;
            this.playSound('error');
        }
    }

    gradeAnimals() {
        const selectedOption = document.querySelector('input[name="animal-answer"]:checked');
        const resultsArea = document.getElementById('animal-results');
        const correctAnswer = this.config.animals.answer;

        if (!selectedOption) {
            resultsArea.innerHTML = `<div style="color: var(--c-danger); margin-top: 10px;">¡Selecciona una opción!</div>`;
            this.playSound('error');
            return;
        }

        const userAnswer = selectedOption.value;
        resultsArea.innerHTML = ''; // Limpiar resultados anteriores

        if (userAnswer === correctAnswer) {
            resultsArea.innerHTML = this.config.animals.clueHTML;
            this.playSound('success');
            this.markMissionCompleted('animals');
        } else {
            resultsArea.innerHTML = `<div style="color: var(--c-danger); margin-top: 10px;">¡Incorrecto! ${this.config.animals.clueHTML}</div>`;
            this.playSound('error');
        }
    }

    // === MÉTODO ESPECÍFICO PARA KAKOOMA ===
    setupKakoomaEvents() {
        // Asegurar que se llama el método del padre y agregar mejoras específicas
        super.setupKakoomaEvents();
        
        // Mejoras visuales específicas para expedición marina
        const kakoomaGrids = document.querySelectorAll('.kakooma-grid');
        kakoomaGrids.forEach(grid => {
            // Agregar indicador visual de progreso marina
            const targetDiv = grid.querySelector('.kakooma-target');
            if (targetDiv) {
                targetDiv.style.background = 'linear-gradient(45deg, #4ecdc4, #44b3b8)'; // Azul marino
                targetDiv.style.padding = '10px';
                targetDiv.style.borderRadius = '10px';
                targetDiv.style.color = '#fff';
                targetDiv.style.fontWeight = 'bold';
                targetDiv.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.expedicionMarina = new ExpedicionMarina();
});
