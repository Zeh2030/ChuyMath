document.addEventListener('DOMContentLoaded', () => {
    const aventuraTitulo = document.getElementById('aventura-titulo');
    const misionesContainer = document.getElementById('misiones-container');
    const aventuraFooter = document.getElementById('aventura-footer');
    const completarBtn = document.getElementById('completar-aventura-btn');
    const mensajeFinal = document.getElementById('mensaje-final');
    const navegacionFinal = document.getElementById('navegacion-final');

    let aventuraData = null;
    const PROGRESO_KEY = 'progresoChuy';

    function getDiaAventura() {
        const params = new URLSearchParams(window.location.search);
        return params.get('dia');
    }

    // --- NUEVA LÓGICA DE CARGA DINÁMICA DE RECURSOS ---
    async function cargarRecursosMisiones(misiones) {
        const tiposRequeridos = new Set(misiones.map(m => m.tipo));
        const promesas = [];

        tiposRequeridos.forEach(tipo => {
            const basePath = `tipos/${tipo}/${tipo}`;
            
            // Cargar CSS
            const cssPromise = new Promise((resolve) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `${basePath}.css`;
                link.onload = resolve;
                link.onerror = () => {
                    console.warn(`No se encontró CSS para el tipo: ${tipo}`);
                    resolve();
                };
                document.head.appendChild(link);
            });

            // Cargar JS
            const jsPromise = new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = `${basePath}.js`;
                script.onload = resolve;
                script.onerror = () => {
                    console.warn(`No se encontró JS para el tipo: ${tipo}`);
                    resolve();
                };
                document.body.appendChild(script);
            });

            promesas.push(cssPromise, jsPromise);
        });

        await Promise.all(promesas);
    }

    async function cargarAventura(dia) {
        try {
            if (!dia) throw new Error('No se especificó el día de la aventura.');
            
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) throw new Error(`No se pudo cargar el archivo de la aventura del día ${dia}.`);
            
            aventuraData = await response.json();

            // Cargar solo los recursos necesarios ANTES de renderizar
            await cargarRecursosMisiones(aventuraData.misiones);
            
            renderizarAventura();
            
        } catch (error) {
            console.error('Error al cargar la aventura:', error);
            misionesContainer.innerHTML = `<div class="error-mensaje"><h2>¡Ups! Algo salió mal</h2><p>No se pudo cargar la aventura. Error: ${error.message}</p><a href="../dashboard/dashboard.html" class="back-button">Volver al Centro de Mando</a></div>`;
        }
    }

    function renderizarAventura() {
        misionesContainer.innerHTML = '';
        aventuraTitulo.textContent = aventuraData.titulo;

        aventuraData.misiones.forEach(misionData => {
            const misionDiv = document.createElement('div');
            misionDiv.className = `mision ${misionData.tipo}`;
            misionDiv.id = misionData.id;
            misionDiv.dataset.info = JSON.stringify(misionData);

            let contenidoMision = `<h2>${misionData.titulo}</h2>`;
            if (misionData.instruccion) {
                contenidoMision += `<p class="mision-instruccion">${misionData.instruccion}</p>`;
            }
            
            const renderFunctionName = `renderizarMision${capitalizeTipo(misionData.tipo)}`;
            if (typeof window[renderFunctionName] === 'function') {
                contenidoMision += window[renderFunctionName](misionData);
            } else {
                contenidoMision += `<p>Error: La función ${renderFunctionName} no está definida.</p>`;
            }
            
            misionDiv.innerHTML = contenidoMision;
            misionesContainer.appendChild(misionDiv);
        });
        
        addGlobalEventListeners();
        aventuraFooter.classList.remove('hidden');
    }
    
    function capitalizeTipo(tipo) {
        return tipo.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    }


    completarBtn.addEventListener('click', () => {
        let puntaje = 0;
        let totalPreguntas = 0;

        document.querySelectorAll('.mision').forEach(misionDiv => {
            const misionData = JSON.parse(misionDiv.dataset.info);
            
            if (misionData.tipo !== 'palabra-del-dia' && misionData.tipo !== 'numberblocks-dibujo') {
                 const ejercicios = misionData.ejercicios || [misionData]; // Handle single-exercise missions
                 totalPreguntas += ejercicios.length;
            } else if (misionData.tipo === 'numberblocks-dibujo') {
                totalPreguntas++;
            }

            const calificarFunctionName = `calificarMision${capitalizeTipo(misionData.tipo)}`;
            if (typeof window[calificarFunctionName] === 'function') {
                puntaje += window[calificarFunctionName](misionDiv, misionData);
            } else if (misionData.tipo === 'palabra-del-dia') {
                 // No suma puntaje, es solo informativa
            } else if (misionData.tipo === 'numberblocks-dibujo') {
                puntaje++; // Autopass
            }
        });
        
        mensajeFinal.textContent = `¡Aventura terminada! Lograste ${puntaje} de ${totalPreguntas} aciertos. ¡Sigue así!`;
        completarBtn.style.display = 'none';
        if (navegacionFinal) navegacionFinal.classList.remove('hidden');
        guardarProgreso();
    });

    function addGlobalEventListeners() {
        misionesContainer.addEventListener('click', (e) => {
            const opcionCubo = e.target.closest('.cubo-opcion');
            const opcionImagen = e.target.closest('.opcion-imagen-container');
            const celdaLogica = e.target.closest('.celda-logica');

            if (opcionCubo) {
                const ejercicio = opcionCubo.closest('.cubo-ejercicio');
                ejercicio.querySelectorAll('.cubo-opcion').forEach(op => op.classList.remove('seleccionada'));
                opcionCubo.classList.add('seleccionada');
            }
            if(opcionImagen){
                const grid = opcionImagen.closest('.opciones-imagenes-grid');
                grid.querySelectorAll('.opcion-imagen-container').forEach(op => op.classList.remove('seleccionada'));
                opcionImagen.classList.add('seleccionada');
            }
            if(celdaLogica){
                 const estados = ['', '✅', '❌'];
                 const clases = ['', 'si', 'no'];
                 let estadoActual = celdaLogica.textContent;
                 let indiceActual = estados.indexOf(estadoActual);
                 let nuevoIndice = (indiceActual + 1) % estados.length;

                 celdaLogica.textContent = estados[nuevoIndice];
                 celdaLogica.className = 'celda-logica'; // Reset classes
                 if (clases[nuevoIndice]) {
                     celdaLogica.classList.add(clases[nuevoIndice]);
                 }
            }
        });
    }

    function guardarProgreso() {
        const diaAventura = getDiaAventura();
        if (!diaAventura) return;

        try {
            const defaults = { misionesCompletadas: [], ultimaVisita: null, racha: 0 };
            let progreso = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || defaults;
            progreso = { ...defaults, ...progreso };

            if (!progreso.misionesCompletadas.includes(diaAventura)) {
                progreso.misionesCompletadas.push(diaAventura);
            }

            const hoy = new Date();
            const hoyStr = hoy.toISOString().split('T')[0];

            if (progreso.ultimaVisita !== hoyStr) {
                const ayer = new Date(hoy);
                ayer.setDate(hoy.getDate() - 1);
                const ayerStr = ayer.toISOString().split('T')[0];

                if (progreso.ultimaVisita === ayerStr) {
                    progreso.racha = (progreso.racha || 0) + 1;
                } else {
                    progreso.racha = 1;
                }
                progreso.ultimaVisita = hoyStr;
            }
            
            localStorage.setItem(PROGRESO_KEY, JSON.stringify(progreso));
            console.log('Progreso guardado:', progreso);

        } catch (e) {
            console.error("No se pudo guardar el progreso en localStorage.", e);
        }
    }

    const dia = getDiaAventura();
    cargarAventura(dia);
});

// Función global para el audio
function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(e => console.error('No se pudo reproducir el audio:', e));
}
