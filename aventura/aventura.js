document.addEventListener('DOMContentLoaded', () => {
    const aventuraTitulo = document.getElementById('aventura-titulo');
    const misionesContainer = document.getElementById('misiones-container');
    const aventuraFooter = document.getElementById('aventura-footer');
    const completarBtn = document.getElementById('completar-aventura-btn');
    const mensajeFinal = document.getElementById('mensaje-final');

    let aventuraData = null;
    const PROGRESO_KEY = 'progresoChuy';

    function getDiaAventura() {
        const params = new URLSearchParams(window.location.search);
        return params.get('dia');
    }

    async function cargarAventura(dia) {
        try {
            if (!dia) {
                throw new Error('No se especificó el día de la aventura');
            }
            
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) {
                throw new Error(`No se pudo cargar la aventura del día ${dia}`);
            }
            
            aventuraData = await response.json();
            renderizarAventura();
            
        } catch (error) {
            console.error('Error al cargar la aventura:', error);
            misionesContainer.innerHTML = `
                <div class="error-mensaje">
                    <h2>¡Ups! Algo salió mal</h2>
                    <p>No se pudo cargar la aventura del día ${dia || 'especificado'}.</p>
                    <p>Error: ${error.message}</p>
                    <a href="../index.html" class="back-button">Volver al Portal</a>
                </div>
            `;
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
                default:
                    contenidoMision += `<p>Tipo de misión no reconocido.</p>`;
            }
            misionDiv.innerHTML = contenidoMision;
            misionesContainer.appendChild(misionDiv);
        });
        aventuraFooter.classList.remove('hidden');
    }

    // --- FUNCIONES DE RENDERIZADO (ACTUALIZADA PARA SECUENCIAS) ---
    function renderizarMisionSecuencia(data) {
        let ejerciciosHTML = '';
        data.ejercicios.forEach((ej, index) => {
            const elementosHTML = ej.elementos.map(el => 
                el === '?' ? `<span class="placeholder">?</span>` : `<span class="elemento">${el}</span>`
            ).join('');

            let respuestaHTML = '';
            // ===== LÓGICA MEJORADA AQUÍ =====
            // Si el ejercicio tiene 'opciones', renderiza botones de radio.
            if (ej.opciones && ej.opciones.length > 0) {
                respuestaHTML = `
                    <div class="instrucciones-opciones">
                        <p>🔍 <strong>Elige la respuesta correcta:</strong></p>
                        <p>¿Qué figura viene después en el patrón?</p>
                    </div>
                    <ul class="secuencia-opciones">`;
                ej.opciones.forEach((opcion, optIndex) => {
                    const idUnico = `seq-${data.id}-${index}-${optIndex}`;
                    respuestaHTML += `
                        <li>
                            <input type="radio" name="secuencia-${data.id}-${index}" id="${idUnico}" value="${opcion}">
                            <label for="${idUnico}">${opcion}</label>
                        </li>
                    `;
                });
                respuestaHTML += '</ul>';
            } else {
                // Si no, renderiza el campo de texto como antes.
                respuestaHTML = `
                    <div class="secuencia-respuesta">
                        <input type="text" placeholder="Respuesta">
                    </div>
                `;
            }

            ejerciciosHTML += `
                <div class="secuencia-ejercicio" data-respuesta="${ej.respuesta}">
                    <div class="secuencia-elementos">${elementosHTML}</div>
                    ${respuestaHTML}
                </div>
            `;
        });
        return ejerciciosHTML;
    }
    
    // --- OTRAS FUNCIONES DE RENDERIZADO (SIN CAMBIOS) ---
    function renderizarMisionOperaciones(data) { /* ... */ 
        let gridHTML = '<div class="operaciones-grid">';
        data.ejercicios.forEach((ej, index) => {
            gridHTML += `<div class="ejercicio" data-respuesta="${ej.respuesta}"><p>${ej.pregunta} =</p><input type="number" inputmode="numeric" id="op-${index}"></div>`;
        });
        return gridHTML + '</div>';
    }
    function renderizarMisionOpcionMultiple(data) { /* ... */
        let opcionesHTML = '<ul class="opciones-lista">';
        data.opciones.forEach((opcion, index) => {
            opcionesHTML += `<li><input type="radio" name="opcion-multiple-${data.id}" id="om-${data.id}-${index}" value="${opcion}"><label for="om-${data.id}-${index}">${opcion}</label></li>`;
        });
        opcionesHTML += '</ul>';
        return `<p class="opcion-multiple-pregunta">${data.pregunta}</p>${data.imagen ? `<img src="${data.imagen}" alt="Imagen de la misión" class="opcion-multiple-imagen">` : ''}${opcionesHTML}`;
    }
    function renderizarMisionDibujo(data) { /* ... */
        return `<p class="numberblocks-instruccion">${data.instruccion}</p><div class="canvas-placeholder">El lienzo de dibujo aparecerá aquí.</div>`;
    }

    // --- LÓGICA DE CALIFICACIÓN (ACTUALIZADA PARA SECUENCIAS) ---
    function completarAventura() {
        let puntaje = 0;
        let totalPreguntas = 0;

        document.querySelectorAll('.mision').forEach(misionDiv => {
            const misionData = JSON.parse(misionDiv.dataset.info);
            if (misionData.ejercicios && misionData.ejercicios.length > 0) {
                totalPreguntas += misionData.ejercicios.length;
            } else {
                totalPreguntas++;
            }
            switch (misionData.tipo) {
                case 'operaciones':
                    puntaje += calificarMisionOperaciones(misionDiv, misionData);
                    break;
                case 'opcion-multiple':
                    puntaje += calificarMisionOpcionMultiple(misionDiv, misionData) ? 1 : 0;
                    break;
                case 'secuencia':
                    puntaje += calificarMisionSecuencia(misionDiv, misionData);
                    break;
                case 'numberblocks-dibujo':
                    puntaje++;
                    break;
            }
        });
        mensajeFinal.textContent = `¡Aventura terminada! Lograste ${puntaje} de ${totalPreguntas} aciertos. ¡Sigue así!`;
        completarBtn.style.display = 'none';
        guardarProgreso();
    }

    // ===== NUEVA FUNCIÓN PARA CALIFICAR SECUENCIAS (MÁS INTELIGENTE) =====
    function calificarMisionSecuencia(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.secuencia-ejercicio').forEach((ejDiv, index) => {
            const respuestaCorrecta = misionData.ejercicios[index].respuesta;
            
            // Revisa si hay opciones de radio
            const radioInput = ejDiv.querySelector('input[type="radio"]');
            if (radioInput) {
                const opcionSeleccionada = ejDiv.querySelector('input[type="radio"]:checked');
                if (opcionSeleccionada && opcionSeleccionada.value === respuestaCorrecta) {
                    opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-success)';
                    aciertos++;
                } else if (opcionSeleccionada) {
                    opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-danger)';
                }
            } else { // Si no, califica el campo de texto
                const textInput = ejDiv.querySelector('input[type="text"]');
                textInput.classList.remove('correct', 'incorrect');
                if (textInput.value.trim().toLowerCase() === respuestaCorrecta.toLowerCase()) {
                    textInput.classList.add('correct');
                    aciertos++;
                } else {
                    textInput.classList.add('incorrect');
                }
            }
        });
        return aciertos;
    }

    // --- OTRAS FUNCIONES DE CALIFICACIÓN Y GUARDADO (SIN CAMBIOS) ---
    function calificarMisionOperaciones(misionDiv, misionData) { /* ... */ 
        let aciertos = 0;
        misionDiv.querySelectorAll('.ejercicio').forEach((ej, index) => {
            const input = ej.querySelector('input');
            const respuestaCorrecta = misionData.ejercicios[index].respuesta;
            input.classList.remove('correct', 'incorrect');
            if (input.value.trim() === respuestaCorrecta) {
                input.classList.add('correct');
                aciertos++;
            } else {
                input.classList.add('incorrect');
            }
        });
        return aciertos;
    }
    function calificarMisionOpcionMultiple(misionDiv, misionData) { /* ... */
        const opcionSeleccionada = misionDiv.querySelector('input[type="radio"]:checked');
        if (opcionSeleccionada && opcionSeleccionada.value === misionData.respuesta) {
            opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-success)';
            return true;
        } else if (opcionSeleccionada) {
            opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-danger)';
        }
        return false;
    }
    function guardarProgreso() { /* ... */
        const diaAventura = getDiaAventura();
        if (!diaAventura) return;
        try {
            let progreso = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || { misionesCompletadas: [] };
            if (!progreso.misionesCompletadas.includes(diaAventura)) {
                progreso.misionesCompletadas.push(diaAventura);
            }
            localStorage.setItem(PROGRESO_KEY, JSON.stringify(progreso));
            console.log('Progreso guardado:', progreso);
        } catch (e) {
            console.error("No se pudo guardar el progreso en localStorage.", e);
        }
    }

    // --- INICIALIZACIÓN ---
    const dia = getDiaAventura();
    cargarAventura(dia);
    completarBtn.addEventListener('click', completarAventura);
});
