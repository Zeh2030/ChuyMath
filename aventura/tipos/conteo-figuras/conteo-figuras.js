/* ===== FUNCIONES ESPECÍFICAS PARA CONTEO DE FIGURAS ===== */

// Función para renderizar conteo de figuras
function renderizarMisionConteo(data) {
    let ejerciciosHTML = '';
    data.ejercicios.forEach((ej, index) => {
        ejerciciosHTML += `
            <div class="conteo-ejercicio" data-respuesta="${ej.respuesta}">
                <p class="conteo-pregunta">${ej.pregunta}</p>
                <div class="conteo-figura-container">
                    ${ej.figura_svg}
                </div>
                <div class="conteo-respuesta">
                    <input type="number" inputmode="numeric" placeholder="Total">
                </div>
                <div class="feedback-container"></div>
            </div>
        `;
    });
    return ejerciciosHTML;
}

// Función para calificar conteo de figuras
function calificarMisionConteo(misionDiv, misionData) {
    let aciertos = 0;
    misionDiv.querySelectorAll('.conteo-ejercicio').forEach((ejDiv, index) => {
        const input = ejDiv.querySelector('input');
        const respuestaCorrecta = misionData.ejercicios[index].respuesta;
        input.classList.remove('correct', 'incorrect');
        const esCorrecto = input.value.trim() === respuestaCorrecta;
        
        if (esCorrecto) {
            input.classList.add('correct');
            aciertos++;
        } else {
            input.classList.add('incorrect');
        }
        
        // Mostrar explicaciones
        const explicacion = esCorrecto ? 
            misionData.ejercicios[index].explicacion_correcta : 
            misionData.ejercicios[index].explicacion_incorrecta;
        mostrarFeedbackConteo(ejDiv.querySelector('.feedback-container'), explicacion, esCorrecto ? 'correcto' : 'incorrecto');
    });
    return aciertos;
}

// Función para mostrar feedback
function mostrarFeedbackConteo(container, texto, tipo) {
    if (container) container.innerHTML = `<div class="feedback-box ${tipo}">${texto}</div>`;
}
