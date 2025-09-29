document.addEventListener('DOMContentLoaded', () => {
    const simuladorTitulo = document.getElementById('simulador-titulo');
    const problemasContainer = document.getElementById('problemas-container');
    const calificarBtn = document.getElementById('calificar-examen-btn');

    let examenData = null;

    function getExamenId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('examen');
    }

    async function cargarExamen(id) {
        try {
            if (!id) throw new Error('No se especificó un ID de examen.');
            
            const response = await fetch(`../../_contenido/${id}.json`);
            if (!response.ok) throw new Error(`No se pudo cargar el archivo del examen: ${id}.json`);
            
            examenData = await response.json();
            renderizarExamen();

        } catch (error) {
            console.error('Error al cargar el examen:', error);
            problemasContainer.innerHTML = `<p class="error">No se pudo cargar el simulacro. Por favor, intenta de nuevo.</p>`;
            simuladorTitulo.textContent = 'Error';
        }
    }

    function renderizarExamen() {
        if (!examenData) return;

        simuladorTitulo.textContent = examenData.titulo;
        problemasContainer.innerHTML = '';

        examenData.problemas.forEach((problema, index) => {
            const problemaDiv = document.createElement('div');
            problemaDiv.className = 'problema-card';
            problemaDiv.id = `problema-${index}`;

            let contenido = `
                <div class="problema-header">
                    <h3>Problema ${index + 1}</h3>
                </div>
                <div class="problema-contenido">
                    <p class="pregunta-texto">${problema.pregunta}</p>
                    ${problema.imagen ? `<img src="../../${problema.imagen}" alt="Imagen del problema ${index + 1}" class="pregunta-imagen">` : ''}
            `;

            if (problema.tipo === 'opcion-multiple') {
                contenido += renderizarOpciones(problema, index);
            }

            contenido += `</div><div class="feedback-container"></div>`;
            problemaDiv.innerHTML = contenido;
            problemasContainer.appendChild(problemaDiv);
        });
    }

    function renderizarOpciones(problema, index) {
        let opcionesHTML = '<ul class="opciones-lista">';
        const opcionesLetras = ['a', 'b', 'c', 'd', 'e'];

        problema.opciones.forEach((opcion, i) => {
            const idUnico = `p${index}-op${i}`;
            opcionesHTML += `
                <li>
                    <input type="radio" id="${idUnico}" name="problema-${index}" value="${opcion}">
                    <label for="${idUnico}"><strong>(${opcionesLetras[i]})</strong> ${opcion}</label>
                </li>
            `;
        });

        opcionesHTML += '</ul>';
        return opcionesHTML;
    }

    function calificarExamen() {
        if (!examenData) return;

        let puntaje = 0;
        examenData.problemas.forEach((problema, index) => {
            const problemaCard = document.getElementById(`problema-${index}`);
            const feedbackContainer = problemaCard.querySelector('.feedback-container');
            const selector = `input[name="problema-${index}"]:checked`;
            const opcionSeleccionada = document.querySelector(selector);

            problemaCard.classList.remove('correcto', 'incorrecto');

            if (opcionSeleccionada) {
                if (opcionSeleccionada.value === problema.respuesta) {
                    puntaje++;
                    problemaCard.classList.add('correcto');
                    feedbackContainer.innerHTML = `<p class="feedback correcto">¡Correcto!</p>`;
                } else {
                    problemaCard.classList.add('incorrecto');
                    feedbackContainer.innerHTML = `<p class="feedback incorrecto">Incorrecto. La respuesta correcta era: <strong>${problema.respuesta}</strong></p>`;
                }
            } else {
                problemaCard.classList.add('incorrecto');
                feedbackContainer.innerHTML = `<p class="feedback incorrecto">No se seleccionó respuesta. La respuesta correcta era: <strong>${problema.respuesta}</strong></p>`;
            }
        });
        
        simuladorTitulo.textContent = `Resultado Final: ${puntaje} de ${examenData.problemas.length}`;
        calificarBtn.textContent = 'Intentar de Nuevo';
        calificarBtn.onclick = () => window.location.reload();
        window.scrollTo(0, 0);
    }
    
    calificarBtn.addEventListener('click', calificarExamen);

    // --- Iniciar Carga ---
    const examenId = getExamenId();
    cargarExamen(examenId);
});
