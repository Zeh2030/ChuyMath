document.addEventListener('DOMContentLoaded', () => {
    const misionesGrid = document.getElementById('misiones-grid');

    // --- SIMULACIÓN DE DATOS DE PROGRESO ---
    // Más adelante, esto vendrá del localStorage real.
    // Simulamos que Chuy ya completó la misión del 22 y 24 de septiembre.
    const progresoChuy = {
        misionesCompletadas: ["2025-09-22", "2025-09-24"]
    };

    async function cargarMisiones() {
        try {
            // La ruta es relativa a la raíz del sitio web.
            const response = await fetch('../_contenido/manifest.json');
            if (!response.ok) {
                throw new Error('No se pudo encontrar el manifiesto de misiones.');
            }
            const misiones = await response.json();
            
            renderizarMisiones(misiones);

        } catch (error) {
            console.error("Error al cargar las misiones:", error);
            misionesGrid.innerHTML = `<div class="loader" style="color: red;">Error al cargar la bóveda.</div>`;
        }
    }

    function renderizarMisiones(misiones) {
        misionesGrid.innerHTML = ''; // Limpiar el mensaje de "cargando"

        if (misiones.length === 0) {
            misionesGrid.innerHTML = `<div class="loader">Aún no hay misiones en la bóveda.</div>`;
            return;
        }

        misiones.forEach(mision => {
            const esCompletada = progresoChuy.misionesCompletadas.includes(mision.id);
            
            const card = document.createElement('a');
            card.href = `../aventura/aventura.html?dia=${mision.id}`; // Enlace a la aventura específica
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

    // Iniciar la carga
    cargarMisiones();
});
