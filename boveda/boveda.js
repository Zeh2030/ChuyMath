document.addEventListener('DOMContentLoaded', () => {
    const misionesGrid = document.getElementById('misiones-grid');
    const PROGRESO_KEY = 'progresoChuy'; // La misma clave que en aventura.js

    // --- OBTENER DATOS DE PROGRESO REALES ---
    function getProgreso() {
        try {
            const progresoGuardado = localStorage.getItem(PROGRESO_KEY);
            return progresoGuardado ? JSON.parse(progresoGuardado) : { misionesCompletadas: [] };
        } catch (e) {
            console.error("Error al leer el progreso de localStorage.", e);
            return { misionesCompletadas: [] }; // Devolver un objeto vacío en caso de error
        }
    }

    async function cargarMisiones() {
        try {
            const response = await fetch('../_contenido/manifest.json');
            if (!response.ok) throw new Error('No se pudo encontrar el manifiesto de misiones.');
            const misiones = await response.json();
            
            const progreso = getProgreso();
            renderizarMisiones(misiones, progreso.misionesCompletadas);

        } catch (error) {
            console.error("Error al cargar las misiones:", error);
            misionesGrid.innerHTML = `<div class="loader" style="color: red;">Error al cargar la bóveda.</div>`;
        }
    }

    function renderizarMisiones(misiones, misionesCompletadas) {
        misionesGrid.innerHTML = '';

        if (misiones.length === 0) {
            misionesGrid.innerHTML = `<div class="loader">Aún no hay misiones en la bóveda.</div>`;
            return;
        }

        misiones.forEach(mision => {
            const esCompletada = misionesCompletadas.includes(mision.id);
            
            const card = document.createElement('a');
            
            // Verificar si es un juego especial
            if (mision.esJuegoEspecial && mision.urlJuego) {
                card.href = mision.urlJuego;
            } else {
                card.href = `../aventura/aventura.html?dia=${mision.id}`;
            }
            
            card.className = `mision-card ${esCompletada ? 'completada' : 'pendiente'}`;

            const footerText = esCompletada ? 'Repasar' : '¡Empezar!';

            card.innerHTML = `
                <div class="mision-icono">${mision.icono}</div>
                <h2>${mision.titulo}</h2>
                <p>${mision.descripcion}</p>
                <div class="card-footer">${footerText}</div>
            `;
            misionesGrid.appendChild(card);
        });
    }

    cargarMisiones();
});
