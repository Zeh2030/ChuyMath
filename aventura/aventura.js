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
        if (!dia) {
            misionesContainer.innerHTML = `<div class="loader" style="color: red;">Error: No se especificó un día de aventura.</div>`;
            return;
        }
        try {
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) throw new Error(`No se encontró la aventura para el día ${dia}.`);
            aventuraData = await response.json();
            renderizarAventura();
        } catch (error) {
            console.error("Error al cargar la aventura:", error);
            misionesContainer.innerHTML = `<div class="loader" style="color: red;">¡Oh no! No pudimos cargar esta aventura.</div>`;
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
                // ===== NUEVO CASO PARA SECUENCIAS =====
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

    // --- FUNCIONES DE RENDERIZADO ---
    function renderizarMisionOperaciones(data) { /* ... sin cambios ... */
        let gridHTML = '<div class="operaciones-grid">';
        data.ejercicios.forEach((ej, index) => {
            gridHTML += `<div class="ejercicio" data-respuesta="${ej.respuesta}"><p>${ej.pregunta} =</p><input type="number" inputmode="numeric" id="op-${index}"></div>`;
        });
        return gridHTML + '</div>';
    }

    function renderizarMisionOpcionMultiple(data) { /* ... sin cambios ... */
        let opcionesHTML = '<ul class="opciones-lista">';
        data.opciones.forEach((opcion, index) => {
            opcionesHTML += `<li><input type="radio" name="opcion-multiple-${data.id}" id="om-${data.id}-${index}" value="${opcion}"><label for="om-${data.id}-${index}">${opcion}</label></li>`;
        });
        opcionesHTML += '</ul>';
        return `<p class="opcion-multiple-pregunta">${data.pregunta}</p>${data.imagen ? `<img src="${data.imagen}" alt="Imagen de la misión" class="opcion-multiple-imagen">` : ''}${opcionesHTML}`;
    }
    
    function renderizarMisionDibujo(data) { /* ... sin cambios ... */
        return `<p class="numberblocks-instruccion">${data.instruccion}</p><div class="canvas-placeholder">El lienzo de dibujo aparecerá aquí.</div>`;
    }

    // ===== NUEVA FUNCIÓN PARA RENDERIZAR SECUENCIAS =====
    function renderizarMisionSecuencia(data) {
        let ejerciciosHTML = '';
        data.ejercicios.forEach((ej, index) => {
            const elementosHTML = ej.elementos.map(el => 
                el === '?' ? `<span class="placeholder">?</span>` : `<span class="elemento">${el}</span>`
            ).join('');

            ejerciciosHTML += `
                <div class="secuencia-ejercicio" data-respuesta="${ej.respuesta}">
                    <div class="secuencia-elementos">${elementosHTML}</div>
                    <div class="secuencia-respuesta">
                        <input type="text" placeholder="Respuesta">
                    </div>
                </div>
            `;
        });
        return ejerciciosHTML;
    }

    // --- LÓGICA DE COMPLETAR Y CALIFICAR ---
    function completarAventura() {
        let puntaje = 0;
        let totalPreguntas = 0;

        document.querySelectorAll('.mision').forEach(misionDiv => {
            const misionData = JSON.parse(misionDiv.dataset.info);
            
            // Para misiones con múltiples ejercicios, cada ejercicio cuenta como una pregunta
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
                // ===== NUEVO CASO DE CALIFICACIÓN PARA SECUENCIAS =====
                case 'secuencia':
                    puntaje += calificarMisionSecuencia(misionDiv, misionData);
                    break;
                case 'numberblocks-dibujo':
                    puntaje++; // Autocalificado como correcto
                    break;
            }
        });

        mensajeFinal.textContent = `¡Aventura terminada! Lograste ${puntaje} de ${totalPreguntas} aciertos. ¡Sigue así!`;
        completarBtn.style.display = 'none';
        guardarProgreso();
    }

    // --- FUNCIONES DE CALIFICACIÓN (ACTUALIZADAS) ---
    function calificarMisionOperaciones(misionDiv, misionData) {
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

    function calificarMisionOpcionMultiple(misionDiv, misionData) { /* ... sin cambios ... */
        const opcionSeleccionada = misionDiv.querySelector('input[type="radio"]:checked');
        if (opcionSeleccionada && opcionSeleccionada.value === misionData.respuesta) {
            opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-success)';
            return true;
        } else if (opcionSeleccionada) {
            opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-danger)';
        }
        return false;
    }

    // ===== NUEVA FUNCIÓN PARA CALIFICAR SECUENCIAS =====
    function calificarMisionSecuencia(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.secuencia-ejercicio').forEach((ej, index) => {
            const input = ej.querySelector('input');
            const respuestaCorrecta = misionData.ejercicios[index].respuesta;
            input.classList.remove('correct', 'incorrect');
            // Usamos trim() para quitar espacios y toLowerCase() para no diferenciar mayúsculas/minúsculas
            if (input.value.trim().toLowerCase() === respuestaCorrecta.toLowerCase()) {
                input.classList.add('correct');
                aciertos++;
            } else {
                input.classList.add('incorrect');
            }
        });
        return aciertos;
    }

    function guardarProgreso() { /* ... sin cambios ... */
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
