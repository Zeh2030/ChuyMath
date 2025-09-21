document.addEventListener('DOMContentLoaded', () => {
    // --- DATOS DE SIMULACIÓN ---
    // Más adelante, esto vendrá de un archivo manifest.json y localStorage.
    const datosDeHoy = {
        titulo: "🌟 ¡La Aventura de Hoy te espera!",
        retos: [
            {
                icono: '🔢',
                titulo: 'Misión de Operaciones',
                descripcion: '¡Demuestra tu súper velocidad con las sumas y restas!',
                completado: true // Simulación
            },
            {
                icono: '🧠',
                titulo: 'Misión Kakooma',
                descripcion: 'Encuentra el número secreto que es la suma de otros dos.',
                completado: true // Simulación
            },
            {
                icono: '🌍',
                titulo: 'Misión Geográfica',
                descripcion: '¡Viaja a un lugar famoso por su puente rojo!',
                completado: false // Simulación
            }
        ]
    };

    const datosDeProgreso = {
        racha: 5, // 5 días seguidos
        misionesParaTesoro: 10,
        misionesCompletadas: 7
    };

    // --- FUNCIONES PARA RENDERIZAR EL DASHBOARD ---

    function cargarRetosDelDia() {
        const contenedorRetos = document.getElementById('retos-del-dia');
        const tituloWidget = document.querySelector('.aventura-widget .widget-title');

        if (!contenedorRetos || !datosDeHoy.retos) return;

        tituloWidget.textContent = datosDeHoy.titulo;
        contenedorRetos.innerHTML = ''; // Limpiar antes de añadir

        datosDeHoy.retos.forEach(reto => {
            const li = document.createElement('li');
            
            const checkboxHTML = `<input type="checkbox" class="reto-checkbox" ${reto.completado ? 'checked' : ''} disabled>`;
            
            li.innerHTML = `
                <span class="icono-reto">${reto.icono}</span>
                <div class="detalles-reto">
                    <span class="titulo-reto">${reto.titulo}</span>
                    <span class="descripcion-reto">${reto.descripcion}</span>
                </div>
                ${checkboxHTML}
            `;
            contenedorRetos.appendChild(li);
        });
    }

    function cargarProgreso() {
        const numeroRacha = document.getElementById('numero-racha');
        const barraProgreso = document.getElementById('barra-progreso-fill');
        const textoProgreso = document.getElementById('progreso-texto');

        if (numeroRacha) {
            numeroRacha.textContent = datosDeProgreso.racha;
        }

        if (barraProgreso && textoProgreso) {
            const porcentaje = (datosDeProgreso.misionesCompletadas / datosDeProgreso.misionesParaTesoro) * 100;
            barraProgreso.style.width = `${porcentaje}%`;
            textoProgreso.textContent = `${datosDeProgreso.misionesCompletadas} / ${datosDeProgreso.misionesParaTesoro} misiones`;
        }
    }

    // --- INICIALIZACIÓN ---
    cargarRetosDelDia();
    cargarProgreso();
});
