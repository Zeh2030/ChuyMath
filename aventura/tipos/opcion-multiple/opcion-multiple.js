/* ===== FUNCIONES ESPECÍFICAS PARA OPCIÓN MÚLTIPLE ===== */

// Función para renderizar opciones múltiples
function renderizarMisionOpcionMultiple(data) {
    let opcionesHTML = '';
    // --- NUEVO: Detectar si las opciones son imágenes ---
    if (data.opciones_son_imagenes) {
        opcionesHTML = data.opciones.map((opcion_svg, index) => 
            `<div class='opcion-imagen-container' data-value='${index}'>
                <img src="${opcion_svg}" alt="Opción ${index + 1}">
            </div>`
        ).join('');
    } else {
        opcionesHTML = data.opciones.map((opcion, index) => 
            `<li><input type="radio" name="op-mult-${data.id}" id="op-mult-${data.id}-${index}" value="${opcion}"><label for="op-mult-${data.id}-${index}">${opcion}</label></li>`
        ).join('');
    }

    const preguntaHTML = data.pregunta ? `<p class="pregunta-texto">${data.pregunta}</p>` : '';
    const imagenHTML = data.imagen ? `<div class="pregunta-imagen-container"><img src="${data.imagen}" alt="Pregunta"></div>` : '';
    
    // --- NUEVO: Envolver en un contenedor diferente si son imágenes ---
    const contenedorClase = data.opciones_son_imagenes ? 'opciones-imagenes-grid' : 'opciones-lista';

    return `
        <div class="opcion-multiple-container">
            ${preguntaHTML}
            ${imagenHTML}
            <div class="${contenedorClase}">${opcionesHTML}</div>
            <div class="feedback-container"></div>
        </div>
    `;
}

// Función para calificar opciones múltiples
function calificarMisionOpcionMultiple(misionDiv, misionData) {
    let aciertos = 0;
    
    // --- NUEVO: Lógica para calificar opciones de imagen ---
    if (misionData.opciones_son_imagenes) {
        const seleccionada = misionDiv.querySelector('.opcion-imagen-container.seleccionada');
        if (seleccionada) {
            const respuestaSeleccionada = seleccionada.dataset.value;
            const esCorrecto = respuestaSeleccionada == misionData.respuesta;
            
            seleccionada.classList.toggle('correcto', esCorrecto);
            seleccionada.classList.toggle('incorrecto', !esCorrecto);

            if (esCorrecto) {
                aciertos = 1;
            }
        }
    } else {
        // Lógica existente para opciones de texto
        const selectedOption = misionDiv.querySelector(`input[name="op-mult-${misionData.id}"]:checked`);
        if (selectedOption) {
            const esCorrecto = selectedOption.value === misionData.respuesta;
            const label = selectedOption.nextElementSibling;
            label.classList.toggle('correcto', esCorrecto);
            label.classList.toggle('incorrecto', !esCorrecto);
            if (esCorrecto) {
                aciertos = 1;
            }
        }
    }

    // --- Lógica de feedback (común para ambos) ---
    const esCorrectoGlobal = aciertos > 0;
    const explicacion = esCorrectoGlobal ? misionData.explicacion_correcta : misionData.explicacion_incorrecta;
    if (explicacion) {
        mostrarFeedbackOpcionMultiple(misionDiv.querySelector('.feedback-container'), explicacion, esCorrectoGlobal ? 'correcto' : 'incorrecto');
    }

    return aciertos;
}

// --- NUEVO: Event listener para seleccionar imágenes ---
document.addEventListener('click', function(e) {
    const opcionImagen = e.target.closest('.opcion-imagen-container');
    if (opcionImagen) {
        const grid = opcionImagen.closest('.opciones-imagenes-grid');
        // Deseleccionar otras opciones en el mismo grupo
        grid.querySelectorAll('.opcion-imagen-container').forEach(op => op.classList.remove('seleccionada'));
        // Seleccionar la actual
        opcionImagen.classList.add('seleccionada');
    }
});

function mostrarFeedbackOpcionMultiple(container, texto, tipo) {
    if (container) {
        container.innerHTML = `<div class="feedback-box ${tipo}">${texto}</div>`;
    }
}
