document.addEventListener('DOMContentLoaded', () => {
    const misionesGrid = document.getElementById('misiones-grid');
    const vistaCalendarioBtn = document.getElementById('calendario-view-btn');
    const vistaCategoriasBtn = document.getElementById('categoria-view-btn');
    const vistaCalendarioContent = document.getElementById('vista-calendario-content');
    const vistaCategoriasContent = document.getElementById('vista-categorias-content');
    const PROGRESO_KEY = 'progresoChuy'; // La misma clave que en aventura.js
    
    let misionesData = [];
    let misionesCompletadas = [];

    // Event listeners para los toggles
    vistaCalendarioBtn.addEventListener('click', () => cambiarVista('calendario'));
    vistaCategoriasBtn.addEventListener('click', () => cambiarVista('categorias'));

    // Manejar parámetros URL al cargar la página
    function manejarParametrosURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const vista = urlParams.get('vista');
        const categoria = urlParams.get('categoria');
        
        if (vista === 'categorias') {
            cambiarVista('categorias');
        }
        
        if (categoria) {
            // Si se especifica una categoría, cambiar a vista de categorías
            cambiarVista('categorias');
            // Scroll a la categoría específica después de un breve delay
            setTimeout(() => {
                const seccionCategoria = document.querySelector(`[data-categoria="${categoria}"]`);
                if (seccionCategoria) {
                    seccionCategoria.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Resaltar la categoría
                    seccionCategoria.style.background = 'rgba(52, 152, 219, 0.1)';
                    seccionCategoria.style.borderRadius = '15px';
                    seccionCategoria.style.padding = '20px';
                    seccionCategoria.style.transition = 'all 0.3s ease';
                }
            }, 100);
        }
    }

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

    function cambiarVista(vista) {
        if (vista === 'calendario') {
            vistaCalendarioBtn.classList.add('active');
            vistaCategoriasBtn.classList.remove('active');
            vistaCalendarioContent.classList.remove('hidden');
            vistaCategoriasContent.classList.add('hidden');
        } else {
            vistaCategoriasBtn.classList.add('active');
            vistaCalendarioBtn.classList.remove('active');
            vistaCategoriasContent.classList.remove('hidden');
            vistaCalendarioContent.classList.add('hidden');
        }
    }

    async function cargarMisiones() {
        try {
            const response = await fetch('../_contenido/manifest.json');
            if (!response.ok) throw new Error('No se pudo encontrar el manifiesto de misiones.');
            misionesData = await response.json();
            
            const progreso = getProgreso();
            misionesCompletadas = progreso.misionesCompletadas;
            
            renderizarMisiones(misionesData, misionesCompletadas);
            renderizarCategorias(misionesData, misionesCompletadas);
            
            // Manejar parámetros URL después de cargar las misiones
            manejarParametrosURL();

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

    function renderizarCategorias(misiones, misionesCompletadas) {
        // Limpiar grids de categorías
        document.getElementById('geometria-grid').innerHTML = '';
        document.getElementById('simulacros-grid').innerHTML = '';
        document.getElementById('secuencias-grid').innerHTML = '';
        document.getElementById('constructores-grid').innerHTML = '';
        document.getElementById('aventuras-grid').innerHTML = '';

        // Clasificar misiones por categoría
        const categorias = {
            geometria: [],
            simulacros: [],
            secuencias: [],
            constructores: [],
            aventuras: []
        };

        misiones.forEach(mision => {
            if (mision.esJuegoEspecial) {
                if (mision.temas && mision.temas.includes('simulacro')) {
                    categorias.simulacros.push(mision);
                } else if (mision.temas && mision.temas.includes('numberblocks')) {
                    categorias.constructores.push(mision);
                } else {
                    categorias.aventuras.push(mision); // Otros juegos especiales van a aventuras
                }
            } else {
                // Lógica existente para aventuras diarias
                if (mision.temas) {
                    if (mision.temas.includes('geometria')) {
                        categorias.geometria.push(mision);
                    } else if (mision.id.includes('secuencia') || mision.titulo.toLowerCase().includes('secuencia')) {
                        categorias.secuencias.push(mision);
                    } else {
                        categorias.aventuras.push(mision);
                    }
                } else {
                    categorias.aventuras.push(mision);
                }
            }
        });

        // Renderizar cada categoría
        Object.keys(categorias).forEach(categoria => {
            const grid = document.getElementById(`${categoria}-grid`);
            const misionesCategoria = categorias[categoria];

            if (misionesCategoria.length === 0) {
                grid.innerHTML = '<div class="categoria-vacia">Aún no hay misiones en esta categoría</div>';
                return;
            }

            misionesCategoria.forEach(mision => {
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
                grid.appendChild(card);
            });
        });
    }

    cargarMisiones();
});
