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
        // La calificación de opción múltiple ahora se maneja con el botón "Calificar".
        // Ya no se necesitan listeners de 'change' en los radio buttons.
        console.log('Listeners de cambio para opción múltiple eliminados.');
    }

    // === OVERRIDE DE MÉTODOS PARA MISIONES DE OPCIÓN MÚLTIPLE ===
    // La lógica de calificación (gradeGeography, gradePlanets, gradeAnimals)
    // ya existe en la clase base (ExpedicionBase) y no necesita ser
    // sobreescrita aquí si los nombres de los radio buttons son correctos.
    // Los hemos verificado y están correctos, por lo que podemos eliminar
    // estas funciones redundantes de este archivo para simplificar.


    // === MÉTODO ESPECÍFICO PARA KAKOOMA (ELIMINADO) ===

}

document.addEventListener('DOMContentLoaded', () => {
    window.expedicionMarina = new ExpedicionMarina();
});