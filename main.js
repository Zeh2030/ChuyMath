document.addEventListener('DOMContentLoaded', () => {
    const PRIMERA_VISITA_KEY = 'haVisitadoElMundoDeChuy';

    function esPrimeraVisita() {
        // localStorage.getItem devuelve null si la clave no existe.
        return localStorage.getItem(PRIMERA_VISITA_KEY) === null;
    }

    function marcarComoVisitado() {
        try {
            localStorage.setItem(PRIMERA_VISITA_KEY, 'true');
        } catch (e) {
            console.error("No se pudo usar localStorage. La redirección automática no funcionará.", e);
        }
    }

    // --- Lógica Principal ---
    if (esPrimeraVisita()) {
        // Si es la primera vez que entra, marcamos que ya nos visitó
        // para que la próxima vez sea redirigido.
        console.log("¡Primera visita! Mostrando el portal principal.");
        marcarComoVisitado();
    } else {
        // Si no es la primera visita, lo llevamos directamente al dashboard.
        console.log("¡Bienvenido de nuevo! Redirigiendo al Centro de Mando...");
        // window.location.href = 'dashboard/dashboard.html';
    }
});
