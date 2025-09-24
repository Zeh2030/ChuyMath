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

    async function cargarAventura(dia) {
        try {
            if (!dia) throw new Error('No se especificó el día de la aventura.');
            
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) throw new Error(`No se pudo cargar el archivo de la aventura del día ${dia}.`);
            
            aventuraData = await response.json();
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
            
            switch (misionData.tipo) {
                case 'operaciones':
                    contenidoMision += renderizarMisionOperaciones(misionData);
                    break;
                case 'opcion-multiple':
                    contenidoMision += renderizarMisionOpcionMultiple(misionData);
                    break;
                case 'numberblocks-dibujo':
                    contenidoMision += renderizarMisionDibujo(misionData);
                    break;
                case 'secuencia':
                    contenidoMision += renderizarMisionSecuencia(misionData);
                    break;
                case 'conteo-figuras':
                    contenidoMision += renderizarMisionConteo(misionData);
                    break;
                case 'tabla-doble-entrada':
                    contenidoMision += renderizarMisionTabla(misionData);
                    break;
                case 'criptoaritmetica':
                    contenidoMision += renderizarMisionCripto(misionData);
                    break;
                case 'desarrollo-cubos':
                    contenidoMision += renderizarMisionCubo(misionData);
                    break;
                case 'balanza-logica':
                    contenidoMision += renderizarMisionBalanza(misionData);
                    break;
                case 'palabra-del-dia':
                    contenidoMision += renderizarPalabraDelDia(misionData);
                    break;
                default:
                    contenidoMision += `<p>Tipo de misión "${misionData.tipo}" no reconocido.</p>`;
            }
            misionDiv.innerHTML = contenidoMision;
            misionesContainer.appendChild(misionDiv);
        });
        
        // Add event listeners for interactive elements after they are in the DOM
        addGlobalEventListeners();
        aventuraFooter.classList.remove('hidden');
    }

    // --- RENDERIZADO DE MISIONES ---

    function renderizarMisionOperaciones(data) {
        let gridHTML = '<div class="operaciones-grid">';
        data.ejercicios.forEach((ej, index) => {
            gridHTML += `<div class="ejercicio" data-respuesta="${ej.respuesta}"><p>${ej.pregunta} =</p><input type="number" inputmode="numeric" placeholder="?"></div>`;
        });
        return gridHTML + '</div>';
    }
    
    function renderizarMisionOpcionMultiple(data) {
        let opcionesHTML = '<ul class="opciones-lista">';
        data.opciones.forEach((opcion, index) => {
            opcionesHTML += `<li><input type="radio" name="opcion-multiple-${data.id}" id="om-${data.id}-${index}" value="${opcion}"><label for="om-${data.id}-${index}">${opcion}</label></li>`;
        });
        opcionesHTML += '</ul>';
        return `<p class="opcion-multiple-pregunta">${data.pregunta}</p>${data.imagen ? `<img src="${data.imagen}" alt="Imagen de la misión" class="opcion-multiple-imagen">` : ''}${opcionesHTML}`;
    }

    function renderizarMisionDibujo(data) {
        return `<div class="canvas-placeholder">El lienzo de dibujo aparecerá aquí (función en desarrollo).</div>`;
    }

    function renderizarMisionSecuencia(data) {
        let ejerciciosHTML = '';
        data.ejercicios.forEach((ej, index) => {
            const elementosHTML = ej.elementos.map(el => el === '?' ? `<span class="placeholder">?</span>` : `<span class="elemento">${el}</span>`).join('');
            let respuestaHTML = '';
            if (ej.opciones && ej.opciones.length > 0) {
                respuestaHTML = '<ul class="secuencia-opciones">';
                ej.opciones.forEach((opcion, optIndex) => {
                    const idUnico = `seq-${data.id}-${index}-${optIndex}`;
                    respuestaHTML += `<li><input type="radio" name="secuencia-${data.id}-${index}" id="${idUnico}" value="${opcion}"><label for="${idUnico}">${opcion}</label></li>`;
                });
                respuestaHTML += '</ul>';
            } else {
                respuestaHTML = `<div class="secuencia-respuesta"><input type="text" placeholder="Respuesta"></div>`;
            }
            ejerciciosHTML += `<div class="secuencia-ejercicio" data-respuesta="${ej.respuesta}"><div class="secuencia-elementos">${elementosHTML}</div>${respuestaHTML}</div>`;
        });
        return ejerciciosHTML;
    }

    function renderizarMisionConteo(data) {
        let ejerciciosHTML = '';
        data.ejercicios.forEach((ej, index) => {
            ejerciciosHTML += `
                <div class="conteo-ejercicio" data-respuesta="${ej.respuesta}">
                    <p class="conteo-pregunta">${ej.pregunta}</p>
                    <div class="conteo-figura-container">${ej.figura_svg}</div>
                    <div class="conteo-respuesta"><input type="number" inputmode="numeric" placeholder="Total"></div>
                    <div class="feedback-container"></div>
                </div>`;
        });
        return ejerciciosHTML;
    }
    
    function renderizarMisionTabla(data) {
        const pistasHTML = data.pistas.map(pista => `<li>${pista}</li>`).join('');
        const headersColumnasHTML = data.encabezados_columna.map(header => `<th>${header}</th>`).join('');
        let filasTablaHTML = '';
        data.encabezados_fila.forEach(headerFila => {
            let celdasHTML = data.encabezados_columna.map(() => `<td class="celda-logica"></td>`).join('');
            filasTablaHTML += `<tr><th>${headerFila}</th>${celdasHTML}</tr>`;
        });
        const opcionesFinalesHTML = data.opciones_finales.map((opcion, index) => {
            const idUnico = `tabla-final-${data.id}-${index}`;
            return `<li><input type="radio" name="tabla-final-${data.id}" id="${idUnico}" value="${opcion}"><label for="${idUnico}">${opcion}</label></li>`;
        }).join('');
        return `
            <div class="tabla-logica-container">
                <div class="tabla-pistas"><h3>Pistas 🕵️</h3><ul>${pistasHTML}</ul></div>
                <div class="tabla-interactiva-container">
                    <table class="tabla-interactiva">
                        <thead><tr><th class="header-vacio"></th>${headersColumnasHTML}</tr></thead>
                        <tbody>${filasTablaHTML}</tbody>
                    </table>
                </div>
            </div>
            <div class="pregunta-final-container" data-respuesta="${data.respuesta_final}">
                <p class="pregunta-final-texto">${data.pregunta_final}</p>
                <ul class="opciones-lista">${opcionesFinalesHTML}</ul>
                <div class="feedback-container"></div>
            </div>`;
    }
    
    function renderizarMisionCripto(data) {
        const solucionHTML = data.solucion.map(item => `
            <div class="cripto-input-grupo">
                <span class="figura">${item.figura}</span> = 
                <input type="number" inputmode="numeric" data-figura="${item.figura}" data-valor="${item.valor}" placeholder="?">
            </div>`).join('');
        return `
            <div class="cripto-ejercicio">
                <div class="cripto-container">
                    <div class="cripto-operacion">
                        <div>${data.operacion.linea1}</div><div class="linea-suma">${data.operacion.linea2}</div><div>${data.operacion.resultado}</div>
                    </div>
                    <div class="cripto-solucion-area">${solucionHTML}</div>
                </div>
                <div class="feedback-container"></div>
            </div>`;
    }

    function renderizarMisionCubo(data) {
        let ejerciciosHTML = '';
        data.ejercicios.forEach((ej) => {
            const opcionesHTML = ej.opciones_svg.map((opcion_svg, optIndex) => `<div class="cubo-opcion" data-opcion-index="${optIndex}">${opcion_svg}</div>`).join('');
            ejerciciosHTML += `<div class="cubo-ejercicio" id="${ej.id}" data-respuesta="${ej.respuesta}"><div class="cubo-plano">${ej.plano_svg}</div><div class="cubo-opciones-container">${opcionesHTML}</div><div class="feedback-container"></div></div>`;
        });
        return ejerciciosHTML;
    }

    function renderizarMisionBalanza(data) {
        const opcionesHTML = data.opciones.map((opcion, index) => `<li><input type="radio" name="balanza-${data.id}" id="balanza-${data.id}-${index}" value="${opcion}"><label for="balanza-${data.id}-${index}">${opcion}</label></li>`).join('');
        return `<div class="balanza-ejercicio" data-respuesta="${data.respuesta}"><div class="balanza-pregunta-svg">${data.pregunta_svg}</div><ul class="opciones-lista balanza-opciones">${opcionesHTML}</ul><div class="feedback-container"></div></div>`;
    }

    function renderizarPalabraDelDia(data) {
        return `
            <div class="palabra-container">
                <div class="palabra-ingles">
                    <span class="palabra-texto">${data.palabra_en}</span>
                    <button class="boton-audio" onclick="document.getElementById('audio-${data.id}').play()">🔊</button>
                    <audio id="audio-${data.id}" src="${data.audio_pronunciacion}"></audio>
                </div>
                <div class="palabra-icono">${data.icono}</div>
                <div class="palabra-espanol">${data.palabra_es}</div>
            </div>
        `;
    }

    // --- LÓGICA DE CALIFICACIÓN ---

    completarBtn.addEventListener('click', () => {
        let puntaje = 0;
        let totalPreguntas = 0;

        document.querySelectorAll('.mision').forEach(misionDiv => {
            const misionData = JSON.parse(misionDiv.dataset.info);
            
            // Ajuste para que la palabra del día no cuente como pregunta evaluable
            if (misionData.tipo !== 'palabra-del-dia') {
                 const ejercicios = misionData.ejercicios || [misionData];
                 totalPreguntas += ejercicios.length;
            }
            
            switch (misionData.tipo) {
                case 'operaciones': puntaje += calificarMisionOperaciones(misionDiv, misionData); break;
                case 'opcion-multiple': puntaje += calificarMisionOpcionMultiple(misionDiv, misionData); break;
                case 'numberblocks-dibujo': puntaje++; break; // Auto-pass
                case 'secuencia': puntaje += calificarMisionSecuencia(misionDiv, misionData); break;
                case 'conteo-figuras': puntaje += calificarMisionConteo(misionDiv, misionData); break;
                case 'tabla-doble-entrada': puntaje += calificarMisionTabla(misionDiv, misionData); break;
                case 'criptoaritmetica': puntaje += calificarMisionCripto(misionDiv, misionData); break;
                case 'desarrollo-cubos': puntaje += calificarMisionCubo(misionDiv, misionData); break;
                case 'balanza-logica': puntaje += calificarMisionBalanza(misionDiv, misionData); break;
                case 'palabra-del-dia': 
                    // No suma puntaje pero podría marcarse como vista
                    break;
            }
        });
        
        mensajeFinal.textContent = `¡Aventura terminada! Lograste ${puntaje} de ${totalPreguntas} aciertos. ¡Sigue así!`;
        completarBtn.style.display = 'none';
        if (navegacionFinal) navegacionFinal.classList.remove('hidden');
        guardarProgreso();
    });
    
    function calificarMisionOperaciones(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.ejercicio').forEach((ej, index) => {
            const input = ej.querySelector('input');
            const esCorrecto = input.value.trim() === misionData.ejercicios[index].respuesta;
            input.classList.toggle('correct', esCorrecto);
            input.classList.toggle('incorrect', !esCorrecto);
            if (esCorrecto) aciertos++;
        });
        return aciertos;
    }

    function calificarMisionOpcionMultiple(misionDiv, misionData) {
        const opcionSeleccionada = misionDiv.querySelector('input[type="radio"]:checked');
        if (opcionSeleccionada && opcionSeleccionada.value === misionData.respuesta) {
             opcionSeleccionada.nextElementSibling.classList.add('correcto');
            return 1;
        }
        if(opcionSeleccionada) opcionSeleccionada.nextElementSibling.classList.add('incorrecto');
        return 0;
    }
    
    function calificarMisionSecuencia(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.secuencia-ejercicio').forEach((ejDiv, index) => {
            const respuestaCorrecta = misionData.ejercicios[index].respuesta;
            const radioSeleccionado = ejDiv.querySelector('input[type="radio"]:checked');
            const inputTexto = ejDiv.querySelector('input[type="text"]');
            
            if (radioSeleccionado) {
                if (radioSeleccionado.value === respuestaCorrecta) aciertos++;
                radioSeleccionado.nextElementSibling.classList.toggle('correcto', radioSeleccionado.value === respuestaCorrecta);
                radioSeleccionado.nextElementSibling.classList.toggle('incorrecto', radioSeleccionado.value !== respuestaCorrecta);
            } else if (inputTexto) {
                const esCorrecto = inputTexto.value.trim().toLowerCase() === respuestaCorrecta.toLowerCase();
                if(esCorrecto) aciertos++;
                inputTexto.classList.toggle('correct', esCorrecto);
                inputTexto.classList.toggle('incorrect', !esCorrecto);
            }
        });
        return aciertos;
    }

    function calificarMisionConteo(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.conteo-ejercicio').forEach((ejDiv, index) => {
             const input = ejDiv.querySelector('input');
             const ejercicioData = misionData.ejercicios[index];
             const esCorrecto = input.value.trim() === ejercicioData.respuesta;
             input.classList.toggle('correct', esCorrecto);
             input.classList.toggle('incorrect', !esCorrecto);
             if(esCorrecto) aciertos++;
             mostrarFeedback(ejDiv.querySelector('.feedback-container'), esCorrecto ? ejercicioData.explicacion_correcta : ejercicioData.explicacion_incorrecta, esCorrecto ? 'correcto' : 'incorrecto');
        });
        return aciertos;
    }

    function calificarMisionTabla(misionDiv, misionData) {
        const contenedorPregunta = misionDiv.querySelector('.pregunta-final-container');
        const opcionSeleccionada = contenedorPregunta.querySelector('input[type="radio"]:checked');
        if (!opcionSeleccionada) return 0;

        const esCorrecto = opcionSeleccionada.value === contenedorPregunta.dataset.respuesta;
        opcionSeleccionada.nextElementSibling.classList.toggle('correcto', esCorrecto);
        opcionSeleccionada.nextElementSibling.classList.toggle('incorrecto', !esCorrecto);
        
        if (esCorrecto) {
             mostrarFeedback(contenedorPregunta.querySelector('.feedback-container'), misionData.explicacion_correcta, 'correcto');
            return 1;
            } else {
             mostrarFeedback(contenedorPregunta.querySelector('.feedback-container'), misionData.explicacion_incorrecta, 'incorrecto');
            return 0;
        }
    }

    function calificarMisionCripto(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.cripto-input-grupo input').forEach(input => {
            const esCorrecto = input.value.trim() === input.dataset.valor;
            input.classList.toggle('correct', esCorrecto);
            input.classList.toggle('incorrect', !esCorrecto);
            if(esCorrecto) aciertos++;
        });
        const todosCorrectos = aciertos === misionData.solucion.length;
        mostrarFeedback(misionDiv.querySelector('.feedback-container'), todosCorrectos ? misionData.explicacion_correcta : misionData.explicacion_incorrecta, todosCorrectos ? 'correcto' : 'incorrecto');
        return todosCorrectos ? misionData.solucion.length : 0; // O puntaje parcial: `return aciertos;`
    }

    function calificarMisionCubo(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.cubo-ejercicio').forEach((ejDiv, index) => {
            const respuestaCorrecta = parseInt(ejDiv.dataset.respuesta);
            const opcionSeleccionada = ejDiv.querySelector('.cubo-opcion.seleccionada');
            if (opcionSeleccionada) {
                const esCorrecto = parseInt(opcionSeleccionada.dataset.opcionIndex) === respuestaCorrecta;
                if(esCorrecto) aciertos++;
                opcionSeleccionada.classList.toggle('correcto', esCorrecto);
                opcionSeleccionada.classList.toggle('incorrecto', !esCorrecto);
                if(!esCorrecto) ejDiv.querySelector(`[data-opcion-index="${respuestaCorrecta}"]`).classList.add('correcto');
                const explicacion = esCorrecto ? misionData.ejercicios[index].explicacion_correcta : misionData.ejercicios[index].explicacion_incorrecta;
                mostrarFeedback(ejDiv.querySelector('.feedback-container'), explicacion, esCorrecto ? 'correcto' : 'incorrecto');
            }
        });
        return aciertos;
    }

    function calificarMisionBalanza(misionDiv, misionData) {
        const opcionSeleccionada = misionDiv.querySelector('input[type="radio"]:checked');
        if (!opcionSeleccionada) return 0;
        const esCorrecto = opcionSeleccionada.value === misionData.respuesta;
        opcionSeleccionada.nextElementSibling.classList.toggle('correcto', esCorrecto);
        opcionSeleccionada.nextElementSibling.classList.toggle('incorrecto', !esCorrecto);
        if(!esCorrecto) misionDiv.querySelector(`input[value="${misionData.respuesta}"]`).nextElementSibling.classList.add('correcto');
        const explicacion = esCorrecto ? misionData.explicacion_correcta : misionData.explicacion_incorrecta;
        mostrarFeedback(misionDiv.querySelector('.feedback-container'), explicacion, esCorrecto ? 'correcto' : 'incorrecto');
        return esCorrecto ? 1 : 0;
    }

    
    function mostrarFeedback(container, texto, tipo) {
        if (container) container.innerHTML = `<div class="feedback-box ${tipo}">${texto}</div>`;
    }

    // --- EVENTOS DE INTERACCIÓN ---
    function addGlobalEventListeners() {
        misionesContainer.addEventListener('click', (e) => {
            const opcionCubo = e.target.closest('.cubo-opcion');
            const celdaLogica = e.target.closest('.celda-logica');
            
            if (opcionCubo) {
                const ejercicio = opcionCubo.closest('.cubo-ejercicio');
                ejercicio.querySelectorAll('.cubo-opcion').forEach(op => op.classList.remove('seleccionada'));
                opcionCubo.classList.add('seleccionada');
            }

            if (celdaLogica) {
                const estados = ['', '✅', '❌'];
                const clases = ['', 'si', 'no'];
                let indiceActual = estados.indexOf(celdaLogica.textContent);
                let nuevoIndice = (indiceActual + 1) % estados.length;
                celdaLogica.textContent = estados[nuevoIndice];
                celdaLogica.className = 'celda-logica'; // Reset
                if (clases[nuevoIndice]) celdaLogica.classList.add(clases[nuevoIndice]);
            }
        });
    }
    
    // --- GUARDAR PROGRESO ---
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
            const hoyStr = new Date().toISOString().split('T')[0];
            if (progreso.ultimaVisita !== hoyStr) {
                const ayer = new Date();
                ayer.setDate(ayer.getDate() - 1);
                progreso.racha = progreso.ultimaVisita === ayer.toISOString().split('T')[0] ? progreso.racha + 1 : 1;
                progreso.ultimaVisita = hoyStr;
            }
            localStorage.setItem(PROGRESO_KEY, JSON.stringify(progreso));
        } catch (e) {
            console.error("No se pudo guardar el progreso en localStorage.", e);
        }
    }

    // --- FUNCIÓN DE AUDIO ---
    function playAudio(url) {
        const audio = new Audio(url);
        audio.play().catch(e => console.log('No se pudo reproducir el audio:', e));
    }

    // --- INICIALIZACIÓN ---
    const dia = getDiaAventura();
    cargarAventura(dia);
});

// Función global para el audio
function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(e => console.log('No se pudo reproducir el audio:', e));
}
