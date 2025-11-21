/* ===== FUNCIONES ESPECÍFICAS PARA DESARROLLO DE CUBOS ===== */

// Función para renderizar desarrollo de cubos
function renderizarMisionCubo(data) {
    let ejerciciosHTML = '';
    data.ejercicios.forEach((ej) => {
        const opcionesHTML = ej.opciones_svg.map((opcion_svg, optIndex) => 
            `<div class="cubo-opcion" data-opcion-index="${optIndex}">${opcion_svg}</div>`
        ).join('');
        ejerciciosHTML += `
            <div class="cubo-ejercicio" id="${ej.id}" data-respuesta="${ej.respuesta}">
                <div class="cubo-plano">${ej.plano_svg}</div>
                <div class="cubo-opciones-container">${opcionesHTML}</div>
                <div class="feedback-container"></div>
            </div>
        `;
    });
    return ejerciciosHTML;
}

// Función para calificar desarrollo de cubos
function calificarMisionCubo(misionDiv, misionData) {
    let aciertos = 0;
    misionDiv.querySelectorAll('.cubo-ejercicio').forEach((ejDiv, index) => {
        const respuestaCorrecta = parseInt(misionData.ejercicios[index].respuesta);
        const seleccionada = ejDiv.querySelector('.cubo-opcion.seleccionada');
        
        if (seleccionada) {
            const seleccionIndex = parseInt(seleccionada.dataset.opcionIndex);
            const esCorrecto = seleccionIndex === respuestaCorrecta;
            
            seleccionada.classList.toggle('correcto', esCorrecto);
            seleccionada.classList.toggle('incorrecto', !esCorrecto);
            
            const explicacion = esCorrecto ? 
                misionData.ejercicios[index].explicacion_correcta : 
                misionData.ejercicios[index].explicacion_incorrecta;
            mostrarFeedback(ejDiv.querySelector('.feedback-container'), explicacion, esCorrecto ? 'correcto' : 'incorrecto');
            
            if (esCorrecto) aciertos++;
        }
    });
    return aciertos;
}

// Función para mostrar feedback
function mostrarFeedback(container, texto, tipo) {
    if (container) container.innerHTML = `<div class="feedback-box ${tipo}">${texto}</div>`;
}


