/**
 * Script específico para la Expedición Ancestral
 * Maneja las funcionalidades específicas de esta expedición
 */

class ExpedicionAncestral extends ExpedicionBase {
    constructor() {
        super(expedicionAncestralConfig);
        console.log('🏺 ExpedicionAncestral inicializada');
        this.setupAncestralSpecificEvents();
    }

    setupAncestralSpecificEvents() {
        // Eventos específicos para misiones de opción múltiple (Saturno y Mono)
        this.setupMultipleChoiceMissions();
    }

    setupMultipleChoiceMissions() {
        // Poblar opciones de geografía
        this.populateOptions('geo-options', this.config.geography.options, 'geo-choice');
        // Poblar opciones de planetas
        this.populateOptions('planet-options', this.config.planets.options, 'planet-choice');
        // Poblar opciones de animales
        this.populateOptions('animal-options', this.config.animals.options, 'animal-choice');

        // Event listeners para calificar
        document.getElementById('grade-geo').addEventListener('click', () => this.gradeGeography());
        document.getElementById('grade-planet').addEventListener('click', () => this.gradePlanets());
        document.getElementById('grade-animal').addEventListener('click', () => this.gradeAnimals());
    }

    // === OVERRIDE DE MÉTODOS PARA MISIONES DE OPCIÓN MÚLTIPLE ===

    gradeGeography() {
        const selectedOption = document.querySelector('input[name="geo-choice"]:checked');
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
        const selectedOption = document.querySelector('input[name="planet-choice"]:checked');
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
        const selectedOption = document.querySelector('input[name="animal-choice"]:checked');
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

    // === INICIALIZACIÓN ===
    // No se sobrescribe populateContent, se usa el de la base
}

document.addEventListener('DOMContentLoaded', () => {
    window.expedicionAncestral = new ExpedicionAncestral();
    // No se agregan easter eggs específicos aquí, se pueden agregar en la base si son comunes
});
