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


    // === MÉTODO ESPECÍFICO PARA KAKOOMA (CORREGIDO) ===
    setupKakoomaEvents() {
        // 1. Ejecutar la lógica base de Kakooma desde ExpedicionBase
        super.setupKakoomaEvents();
        
        // 2. Aplicar los estilos visuales únicos para la expedición marina
        const kakoomaGrids = document.querySelectorAll('.kakooma-grid');
        kakoomaGrids.forEach(grid => {
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
