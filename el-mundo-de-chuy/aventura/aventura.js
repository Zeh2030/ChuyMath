document.addEventListener('DOMContentLoaded', () => {
    const aventuraTitulo = document.getElementById('aventura-titulo');
    const misionesContainer = document.getElementById('misiones-container');
    const aventuraFooter = document.getElementById('aventura-footer');
    const completarBtn = document.getElementById('completar-aventura-btn');
    const mensajeFinal = document.getElementById('mensaje-final');

    let aventuraData = null;

    // --- 1. OBTENER EL DÍA DE LA URL ---
    function getDiaAventura() {
        const params = new URLSearchParams(window.location.search);
        return params.get('dia'); // Devuelve el valor de 'dia' o null si no está
    }

    // --- 2. CARGAR LOS DATOS DE LA AVENTURA ---
    async function cargarAventura(dia) {
        if (!dia) {
            misionesContainer.innerHTML = `<div class="loader" style="color: red;">Error: No se especificó un día de aventura.</div>`;
            return;
        }

        try {
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) {
                throw new Error(`No se encontró la aventura para el día ${dia}.`);
            }
            aventuraData = await response.json();
            renderizarAventura();
        } catch (error) {
            console.error("Error al cargar la aventura:", error);
            misionesContainer.innerHTML = `<div class="loader" style="color: red;">¡Oh no! No pudimos cargar esta aventura.</div>`;
        }
    }

    // --- 3. RENDERIZAR LA AVENTURA EN LA PÁGINA ---
    function renderizarAventura() {
        // Limpiar el loader
        misionesContainer.innerHTML = '';
        
        // Actualizar título
        aventuraTitulo.textContent = aventuraData.titulo;

        // Crear y añadir cada misión
        aventuraData.misiones.forEach(misionData => {
            const misionDiv = document.createElement('div');
            misionDiv.className = `mision ${misionData.tipo}`;
            misionDiv.id = misionData.id;

            let contenidoMision = `<h2>${misionData.titulo}</h2>`;

            // Renderizar según el tipo de misión
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

        // Mostrar el footer con el botón de completar
        aventuraFooter.classList.remove('hidden');
    }

    // --- FUNCIONES AUXILIARES DE RENDERIZADO ---
    function renderizarMisionOperaciones(data) {
        let gridHTML = '<div class="operaciones-grid">';
        data.ejercicios.forEach((ej, index) => {
            gridHTML += `
                <div class="ejercicio" data-respuesta="${ej.respuesta}">
                    ${ej.pregunta} = 
                    <input type="number" inputmode="numeric" id="op-${index}">
                </div>
            `;
        });
        gridHTML += '</div>';
        return gridHTML;
    }

    function renderizarMisionOpcionMultiple(data) {
        let opcionesHTML = '<ul class="opciones-lista">';
        data.opciones.forEach((opcion, index) => {
            opcionesHTML += `
                <li>
                    <input type="radio" name="opcion-multiple-${data.id}" id="om-${data.id}-${index}" value="${opcion}">
                    <label for="om-${data.id}-${index}">${opcion}</label>
                </li>
            `;
        });
        opcionesHTML += '</ul>';

        return `
            <p class="opcion-multiple-pregunta">${data.pregunta}</p>
            ${data.imagen ? `<img src="${data.imagen}" alt="Imagen de la misión" class="opcion-multiple-imagen">` : ''}
            ${opcionesHTML}
        `;
    }
    
    function renderizarMisionDibujo(data) {
        return `
            <p class="numberblocks-instruccion">${data.instruccion}</p>
            <div class="canvas-placeholder">El lienzo de dibujo aparecerá aquí.</div>
        `;
    }

    // --- 4. LÓGICA DE COMPLETAR AVENTURA ---
    function completarAventura() {
        let puntaje = 0;
        let totalPreguntas = 0;

        // Calificar misión de operaciones
        document.querySelectorAll('.mision.operaciones .ejercicio').forEach(ej => {
            totalPreguntas++;
            const input = ej.querySelector('input');
            const respuestaCorrecta = ej.dataset.respuesta;
            if (input.value === respuestaCorrecta) {
                puntaje++;
                input.classList.remove('incorrect');
                input.classList.add('correct');
            } else {
                input.classList.add('incorrect');
            }
        });

        // (Aquí iría la lógica para calificar los otros tipos de misiones)

        // Mostrar mensaje final
        mensajeFinal.textContent = `¡Buen trabajo! Obtuviste ${puntaje} de ${totalPreguntas} respuestas correctas.`;

        // Guardar en localStorage (lógica futura)
        const diaAventura = getDiaAventura();
        console.log(`Aventura del día ${diaAventura} completada. Guardando progreso...`);
        // Aquí llamaríamos a una función para actualizar localStorage
    }

    // --- INICIALIZACIÓN ---
    const dia = getDiaAventura();
    cargarAventura(dia);

    completarBtn.addEventListener('click', completarAventura);
});
