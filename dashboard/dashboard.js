document.addEventListener('DOMContentLoaded', () => {
    const PROGRESO_KEY = 'progresoChuy';
    const MANIFEST_URL = '../_contenido/manifest.json';

    // --- 1. OBTENER DATOS DE PROGRESO Y AVENTURAS ---

    // Función para obtener el progreso guardado en localStorage
    function getProgreso() {
        try {
            const progresoGuardado = localStorage.getItem(PROGRESO_KEY);
            // Aseguramos que siempre devuelva un objeto con la estructura esperada
            const defaults = { misionesCompletadas: [], ultimaVisita: null, racha: 0 };
            const progreso = progresoGuardado ? JSON.parse(progresoGuardado) : defaults;
            return { ...defaults, ...progreso }; // Combina defaults con lo guardado
        } catch (e) {
            console.error("Error al leer el progreso de localStorage.", e);
            return { misionesCompletadas: [], ultimaVisita: null, racha: 0 };
        }
    }

    // Función para cargar el manifiesto de todas las aventuras
    async function getManifest() {
        try {
            const response = await fetch(MANIFEST_URL);
            if (!response.ok) throw new Error('No se pudo cargar el manifiesto.');
            return await response.json();
        } catch (error) {
            console.error("Error al cargar el manifiesto:", error);
            return []; // Devuelve un array vacío en caso de error
        }
    }

    // --- 2. FUNCIONES PARA RENDERIZAR EL DASHBOARD ---

    // Carga los retos del día actual
    async function cargarRetosDelDia(manifest) {
        const contenedorRetos = document.getElementById('retos-del-dia');
        const tituloWidget = document.querySelector('.aventura-widget .widget-title');
        const botonAventura = document.querySelector('.aventura-widget .boton-principal');

        if (!contenedorRetos) return;

        const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        let aventuraDeHoy = manifest.find(aventura => aventura.id === hoy);
        
        // Si no hay aventura para hoy, buscar la más reciente
        if (!aventuraDeHoy) {
            const aventurasConFecha = manifest.filter(m => m.id.match(/^\d{4}-\d{2}-\d{2}$/));
            if (aventurasConFecha.length > 0) {
                aventurasConFecha.sort((a, b) => b.id.localeCompare(a.id));
                aventuraDeHoy = aventurasConFecha[0];
            }
        }

        if (aventuraDeHoy) {
            // Si hay aventura disponible, la cargamos desde su propio JSON
            try {
                const response = await fetch(`../_contenido/${aventuraDeHoy.id}.json`);
                if (!response.ok) throw new Error('No se encontró el JSON de la aventura.');
                const dataAventura = await response.json();

                tituloWidget.textContent = `🌟 ${dataAventura.titulo}`;
                botonAventura.href = `../aventura/aventura.html?dia=${aventuraDeHoy.id}`;
                botonAventura.textContent = "¡Empezar Aventura!";
                contenedorRetos.innerHTML = '';

                dataAventura.misiones.forEach(reto => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span class="icono-reto">${getIconoTema(reto.tipo)}</span>
                        <div class="detalles-reto">
                            <span class="titulo-reto">${reto.titulo}</span>
                        </div>
                    `;
                    contenedorRetos.appendChild(li);
                });

            } catch (error) {
                console.error(error);
                contenedorRetos.innerHTML = `<p>Hubo un problema al cargar los detalles de la aventura.</p>`;
            }
        } else {
            // Si no hay aventuras disponibles
            tituloWidget.textContent = "🎮 ¡Hora de Explorar!";
            contenedorRetos.innerHTML = `<p style="text-align: center; font-weight: 600; color: #16a085;">¡Perfecto momento para explorar la Bóveda o jugar con el Constructor!</p>`;
            botonAventura.textContent = "Ir a la Bóveda";
            botonAventura.href = "../boveda/boveda.html";
        }
    }

    // Actualiza los widgets de progreso (racha y barra)
    function cargarProgresoVisual(progreso, manifest) {
        const numeroRacha = document.getElementById('numero-racha');
        const barraProgreso = document.getElementById('barra-progreso-fill');
        const textoProgreso = document.getElementById('progreso-texto');

        if (numeroRacha) {
            numeroRacha.textContent = progreso.racha || 0;
        }

        if (barraProgreso && textoProgreso) {
            const totalMisiones = manifest.length;
            const misionesCompletadas = progreso.misionesCompletadas.length;
            const porcentaje = totalMisiones > 0 ? Math.min((misionesCompletadas / totalMisiones) * 100, 100) : 0;
            
            barraProgreso.style.width = `${porcentaje}%`;
            textoProgreso.textContent = `${misionesCompletadas} / ${totalMisiones} aventuras`;
            
            // Agregar mensaje motivacional
            if (porcentaje === 100) {
                textoProgreso.textContent += " 🎉 ¡Completadas todas!";
            } else if (porcentaje >= 75) {
                textoProgreso.textContent += " 🔥 ¡Casi ahí!";
            } else if (porcentaje >= 50) {
                textoProgreso.textContent += " 💪 ¡A mitad de camino!";
            }
        }
    }

    // Función auxiliar para obtener un icono por tipo de misión
    function getIconoTema(tipo) {
        switch(tipo) {
            case 'operaciones': return '🔢';
            case 'secuencia': return '🔍';
            case 'conteo-figuras': return '💠';
            case 'opcion-multiple': return '🌍';
            case 'numberblocks-dibujo': return '🎨';
            default: return '⭐';
        }
    }

    // --- 3. INICIALIZACIÓN PRINCIPAL ---
    async function inicializarDashboard() {
        const progreso = getProgreso();
        const manifest = await getManifest();
        
        await cargarRetosDelDia(manifest);
        cargarProgresoVisual(progreso, manifest);
        
        // Mostrar mensaje de bienvenida personalizado
        const saludo = document.querySelector('.dashboard-header p');
        if (saludo && progreso.racha > 0) {
            saludo.textContent = `¡Bienvenido de nuevo! Llevas ${progreso.racha} días de aventura seguidos 🔥`;
        }
    }

    inicializarDashboard();
});