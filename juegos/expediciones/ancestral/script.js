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
        // La calificación ahora se maneja con los botones, ya no se necesitan listeners aquí.
        console.log('Listeners de cambio eliminados para calificación con botón.');
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

    // === MÉTODO ESPECÍFICO PARA KAKOOMA (ELIMINADO) ===

}

document.addEventListener('DOMContentLoaded', () => {
    window.expedicionAncestral = new ExpedicionAncestral();
});
