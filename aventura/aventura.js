document.addEventListener('DOMContentLoaded', () => {
    const misionesContainer = document.getElementById('misiones-container');
    const aventuraTitulo = document.getElementById('aventura-titulo');
    const completarBtn = document.getElementById('completar-aventura-btn');
    const footer = document.getElementById('aventura-footer');
    const loader = document.querySelector('.loader');

    let aventuraData = null;
    let diaAventura = '';

    function getDiaAventura() {
        const urlParams = new URLSearchParams(window.location.search);
        const dia = urlParams.get('dia');
        if (!dia) {
            console.error('No se especificó el día en la URL.');
            misionesContainer.innerHTML = '<p class="error-cargando">Error: No se ha especificado un día de aventura. Asegúrate de que la URL sea correcta.</p>';
            loader.style.display = 'none';
            return null;
        }
        return dia;
    }

    async function cargarAventura(dia) {
        try {
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) {
                throw new Error(`No se encontró el archivo de aventura para el día ${dia}.`);
            }
            aventuraData = await response.json();
            renderizarAventura();
            revisarEstadoAventura(); 
        } catch (error) {
            console.error('Error al cargar la aventura:', error);
            misionesContainer.innerHTML = `<p class="error-cargando">¡Oh no! No pudimos cargar la aventura de hoy. Revisa la fecha o intenta más tarde.</p><p class="error-detalle">${error.message}</p>`;
        } finally {
            loader.style.display = 'none';
            footer.classList.remove('hidden');
        }
    }

    function renderizarAventura() {
        if (!aventuraData) return;

        aventuraTitulo.textContent = aventuraData.titulo;
        misionesContainer.innerHTML = ''; 

        aventuraData.misiones.forEach((mision, index) => {
            const misionCard = document.createElement('div');
            misionCard.className = 'mision-card';
            misionCard.id = `mision-${index}`;
            misionCard.style.borderLeft = `5px solid ${mision.color || '#4A90E2'}`;

            const misionHeader = document.createElement('div');
            misionHeader.className = 'mision-header';
            misionHeader.innerHTML = `<h2>${mision.titulo}</h2>`;
            misionCard.appendChild(misionHeader);

            const misionContent = document.createElement('div');
            misionContent.className = 'mision-content';
            
            const instrucciones = document.createElement('div');
            instrucciones.className = 'instrucciones';
            if (mision.instruccion) {
                instrucciones.innerHTML = `<p>${mision.instruccion}</p>`;
            }
            misionContent.appendChild(instrucciones);
            
            const ejercicioContainer = document.createElement('div');
            ejercicioContainer.className = 'ejercicio-container';
            
            // Re-implementación del switch case
            switch (mision.tipo) {
                case 'tabla-doble-entrada':
                    ejercicioContainer.innerHTML = renderizarMisionTabla(mision);
                    break;
                case 'operaciones':
                    ejercicioContainer.innerHTML = renderizarMisionOperaciones(mision);
                    break;
                case 'opcion-multiple':
                    ejercicioContainer.innerHTML = renderizarMisionOpcionMultiple(mision);
                    break;
                case 'secuencia':
                    ejercicioContainer.innerHTML = renderizarMisionSecuencia(mision);
                    break;
                case 'conteo-figuras':
                     ejercicioContainer.innerHTML = renderizarMisionConteo(mision);
                    break;
                case 'criptoaritmetica':
                    ejercicioContainer.innerHTML = renderizarMisionCripto(mision);
                    break;
                case 'desarrollo-cubos':
                    ejercicioContainer.innerHTML = renderizarMisionCubo(mision);
                    break;
                case 'balanza-logica':
                    ejercicioContainer.innerHTML = renderizarMisionBalanza(mision);
                    break;
                case 'palabra-del-dia':
                    ejercicioContainer.innerHTML = renderizarPalabraDelDia(mision);
                    break;
                case 'geometria':
                    ejercicioContainer.innerHTML = renderizarMisionGeometria(mision);
                    break;
                case 'numberblocks-dibujo':
                    ejercicioContainer.innerHTML = renderizarMisionNumberblocks(mision);
                    break;
                case 'navegacion-mapa':
                    ejercicioContainer.innerHTML = renderizarMisionNavegacionMapa(mision);
                    break;
                default:
                    ejercicioContainer.innerHTML = `<p>Error: Tipo de misión "${mision.tipo}" no reconocido.</p>`;
            }

            misionContent.appendChild(ejercicioContainer);
            misionCard.appendChild(misionContent);
            misionesContainer.appendChild(misionCard);
        });
        
        addGlobalEventListeners();
    }

    function addGlobalEventListeners() {
        const tablas = document.querySelectorAll('.tabla-logica');
        tablas.forEach(tabla => {
            tabla.addEventListener('click', (event) => {
                if (event.target.tagName === 'TD' && !event.target.classList.contains('header')) {
                    const cell = event.target;
                    const currentValue = cell.textContent;
                    if (currentValue === '✅') {
                        cell.textContent = '❌';
                    } else if (currentValue === '❌') {
                        cell.textContent = '';
                    } else {
                        cell.textContent = '✅';
                    }
                }
            });
        });

        // Listener para opciones de imagen
        const opcionesImagen = document.querySelectorAll('.opcion-imagen-container');
        opcionesImagen.forEach(opcion => {
            opcion.addEventListener('click', () => {
                // Deseleccionar todas las opciones de la misma pregunta
                const parentGrid = opcion.closest('.opciones-imagenes-grid');
                parentGrid.querySelectorAll('.opcion-imagen-container').forEach(o => o.classList.remove('seleccionada'));
                // Seleccionar la actual
                opcion.classList.add('seleccionada');
            });
        });
    }


    completarBtn.addEventListener('click', () => {
        let puntajeTotal = 0;
        let puntajeMaximo = 0;
        let todasCalificadas = true;

        // Calcular el puntaje máximo real sumando los ejercicios de cada misión
        aventuraData.misiones.forEach((mision) => {
            if (mision.tipo === 'secuencia' && mision.ejercicios) {
                puntajeMaximo += mision.ejercicios.length;
            } else if (mision.tipo === 'operaciones' && mision.ejercicios) {
                puntajeMaximo += mision.ejercicios.length;
            } else if (mision.tipo === 'conteo-figuras' && mision.ejercicios) {
                puntajeMaximo += mision.ejercicios.length;
            } else if (mision.tipo === 'tabla-doble-entrada' && mision.data && mision.data.ejercicios) {
                puntajeMaximo += mision.data.ejercicios.length;
            } else {
                // Para otros tipos de misión (opción múltiple, geometría, etc.) cuenta como 1
                puntajeMaximo += 1;
            }
        });

        aventuraData.misiones.forEach((mision, index) => {
            let resultado = 0;
            const misionDiv = document.getElementById(`mision-${index}`);
            
            if (!misionDiv) {
                console.warn(`No se encontró el div de la misión ${index}`);
                return;
            }
            
            // Re-implementación del switch case para calificar
            switch (mision.tipo) {
                 case 'tabla-doble-entrada':
                    resultado = calificarMisionTabla(misionDiv, mision);
                    break;
                case 'operaciones':
                    resultado = calificarMisionOperaciones(misionDiv, mision);
                    break;
                case 'opcion-multiple':
                    resultado = calificarMisionOpcionMultiple(misionDiv, mision);
                    break;
                case 'secuencia':
                    resultado = calificarMisionSecuencia(misionDiv, mision);
                    break;
                case 'conteo-figuras':
                    resultado = calificarMisionConteo(misionDiv, mision);
                    break;
                case 'criptoaritmetica':
                    resultado = calificarMisionCripto(misionDiv, mision);
                    break;
                case 'desarrollo-cubos':
                    resultado = calificarMisionCubo(misionDiv, mision);
                    break;
                case 'balanza-logica':
                    resultado = calificarMisionBalanza(misionDiv, mision);
                    break;
                case 'geometria':
                    resultado = calificarMisionGeometria(misionDiv, mision);
                    break;
                case 'navegacion-mapa':
                    resultado = calificarMisionNavegacionMapa(misionDiv, mision);
                    break;
                // Misiones sin calificación automática no se cuentan o se marcan como completadas
                case 'palabra-del-dia':
                case 'numberblocks-dibujo':
                    resultado = 1; // Se considera completada al presionar el botón
                    marcarMisionCompleta(index);
                    break;
                default:
                    console.warn(`El tipo de misión "${mision.tipo}" no tiene una función de calificación.`);
                    resultado = -1; // Indicador para no calificar
                    todasCalificadas = false;
            }

            if (resultado !== -1) {
                puntajeTotal += resultado;
            }
        });
        
        if(todasCalificadas){
            mostrarMensajeFinal(puntajeTotal, puntajeMaximo);
            guardarProgreso(puntajeTotal, puntajeMaximo);
        }
    });

    function guardarProgreso(puntaje, maximo) {
        if (!diaAventura) return;
        const progreso = {
            completado: true,
            puntaje: puntaje,
            maximo: maximo,
            fecha: new Date().toISOString()
        };
        localStorage.setItem(`progreso_aventura_${diaAventura}`, JSON.stringify(progreso));
    }
    
    function revisarEstadoAventura() {
        if (!diaAventura) return;
        const progresoGuardado = localStorage.getItem(`progreso_aventura_${diaAventura}`);
        if (progresoGuardado) {
            const progreso = JSON.parse(progresoGuardado);
            if (progreso.completado) {
                mostrarMensajeFinal(progreso.puntaje, progreso.maximo, true);
            }
        }
    }


    function mostrarMensajeFinal(puntaje, maximo, yaCompletada = false) {
        const mensajeFinal = document.getElementById('mensaje-final');
        const navegacionFinal = document.getElementById('navegacion-final');
        
        let mensaje = `¡Aventura completada! Tu puntaje: ${puntaje} de ${maximo}.`;
        if (puntaje === maximo) {
            mensaje += " ¡Felicidades, lo hiciste perfecto! ✨";
        } else if (puntaje >= maximo * 0.7) {
            mensaje += " ¡Muy buen trabajo! 👍";
        } else {
            mensaje += " ¡Sigue esforzándote! 💪";
        }
        
        // Añadir botón de reintentar
        const botonReintentar = `<button id="reintentar-aventura-btn" class="boton-reintentar">🔄 Volver a Intentar</button>`;
        
        mensajeFinal.innerHTML = `<p>${mensaje}</p>${botonReintentar}`;
        mensajeFinal.style.display = 'block';
        navegacionFinal.classList.remove('hidden');
        completarBtn.style.display = 'none';
        
        // Event listener para el botón de reintentar
        setTimeout(() => {
            const reintentarBtn = document.getElementById('reintentar-aventura-btn');
            if (reintentarBtn) {
                reintentarBtn.addEventListener('click', () => {
                    // Limpiar progreso guardado
                    if (diaAventura) {
                        localStorage.removeItem(`progreso_aventura_${diaAventura}`);
                    }
                    // Recargar la página
                    window.location.reload();
                });
            }
        }, 100);
    }

    function marcarMisionCompleta(index) {
        const misionCard = document.getElementById(`mision-${index}`);
        if(misionCard){
            misionCard.classList.remove('incorrecto');
            misionCard.classList.add('correcto');
            misionCard.style.borderColor = '#2ECC71'; 
        }
    }

    // --- INICIO CÓDIGO INICIAL ---
    diaAventura = getDiaAventura();
    if (diaAventura) {
        cargarAventura(diaAventura);
    }
});

// Función global para el audio
function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(e => console.error('No se pudo reproducir el audio:', e));
}
