document.addEventListener('DOMContentLoaded', () => {
    const aventuraTitulo = document.getElementById('aventura-titulo');
    const misionesContainer = document.getElementById('misiones-container');
    const aventuraFooter = document.getElementById('aventura-footer');
    const completarBtn = document.getElementById('completar-aventura-btn');
    const mensajeFinal = document.getElementById('mensaje-final');

    let aventuraData = null;
    const PROGRESO_KEY = 'progresoChuy'; // Clave para localStorage

    // --- 1. OBTENER EL DÍA DE LA URL ---
    function getDiaAventura() {
        const params = new URLSearchParams(window.location.search);
        return params.get('dia');
    }

    // --- 2. CARGAR LOS DATOS DE LA AVENTURA ---
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

    // --- 3. RENDERIZAR LA AVENTURA EN LA PÁGINA ---
    function renderizarAventura() {
        misionesContainer.innerHTML = '';
        aventuraTitulo.textContent = aventuraData.titulo;

        aventuraData.misiones.forEach(misionData => {
            const misionDiv = document.createElement('div');
            misionDiv.className = `mision ${misionData.tipo}`;
            misionDiv.id = misionData.id;
            // Guardamos los datos de la misión en el elemento para usarlos después
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
                default:
                    contenidoMision += `<p>Tipo de misión no reconocido.</p>`;
            }
            misionDiv.innerHTML = contenidoMision;
            misionesContainer.appendChild(misionDiv);
        });
        aventuraFooter.classList.remove('hidden');
    }

    // --- FUNCIONES AUXILIARES DE RENDERIZADO (Sin cambios) ---
    function renderizarMisionOperaciones(data) {
        let gridHTML = '<div class="operaciones-grid">';
        data.ejercicios.forEach((ej, index) => {
            gridHTML += `<div class="ejercicio" data-respuesta="${ej.respuesta}"><p>${ej.pregunta} =</p><input type="number" inputmode="numeric" id="op-${index}"></div>`;
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
        return `<p class="numberblocks-instruccion">${data.instruccion}</p><div class="canvas-placeholder">El lienzo de dibujo aparecerá aquí.</div>`;
    }

    // --- 4. LÓGICA DE COMPLETAR AVENTURA (MEJORADA) ---
    function completarAventura() {
        let puntaje = 0;
        let totalPreguntas = 0;

        // Calificar cada misión en la página
        document.querySelectorAll('.mision').forEach(misionDiv => {
            const misionData = JSON.parse(misionDiv.dataset.info);
            totalPreguntas++;

            let acierto = false;
            switch (misionData.tipo) {
                case 'operaciones':
                    acierto = calificarMisionOperaciones(misionDiv, misionData);
                    break;
                case 'opcion-multiple':
                    acierto = calificarMisionOpcionMultiple(misionDiv, misionData);
                    break;
                case 'numberblocks-dibujo':
                    // Por ahora, los dibujos se califican como correctos automáticamente
                    acierto = true;
                    break;
            }
            if (acierto) puntaje++;
        });

        mensajeFinal.textContent = `¡Aventura terminada! Lograste ${puntaje} de ${totalPreguntas} misiones. ¡Eres un genio!`;
        completarBtn.style.display = 'none'; // Ocultar botón después de calificar

        guardarProgreso();
    }

    // --- FUNCIONES DE CALIFICACIÓN ---
    function calificarMisionOperaciones(misionDiv, misionData) {
        let todasCorrectas = true;
        misionDiv.querySelectorAll('.ejercicio').forEach((ej, index) => {
            const input = ej.querySelector('input');
            const respuestaCorrecta = misionData.ejercicios[index].respuesta;
            input.classList.remove('correct', 'incorrect');
            if (input.value === respuestaCorrecta) {
                input.classList.add('correct');
            } else {
                input.classList.add('incorrect');
                todasCorrectas = false;
            }
        });
        return todasCorrectas;
    }

    function calificarMisionOpcionMultiple(misionDiv, misionData) {
        const opcionSeleccionada = misionDiv.querySelector('input[type="radio"]:checked');
        if (opcionSeleccionada && opcionSeleccionada.value === misionData.respuesta) {
            opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-success)';
            return true;
        } else if (opcionSeleccionada) {
            opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-danger)';
        }
        return false;
    }

    // --- 5. GUARDAR PROGRESO EN LOCALSTORAGE ---
    function guardarProgreso() {
        const diaAventura = getDiaAventura();
        if (!diaAventura) return;

        try {
            // Obtener progreso existente o crear uno nuevo
            let progreso = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || { misionesCompletadas: [] };
            
            // Añadir la misión actual si no está ya en la lista
            if (!progreso.misionesCompletadas.includes(diaAventura)) {
                progreso.misionesCompletadas.push(diaAventura);
            }

            // (Aquí podríamos añadir lógica para la racha de días)

            // Guardar el objeto actualizado en localStorage
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
