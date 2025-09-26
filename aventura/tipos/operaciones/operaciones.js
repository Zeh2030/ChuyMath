/* ===== FUNCIONES ESPECÍFICAS PARA OPERACIONES MATEMÁTICAS ===== */

// Función para renderizar operaciones matemáticas
function renderizarMisionOperaciones(data) {
    let gridHTML = '<div class="operaciones-grid">';
    data.ejercicios.forEach((ej, index) => {
        gridHTML += `<div class="ejercicio" data-respuesta="${ej.respuesta}"><p>${ej.pregunta} =</p><input type="number" inputmode="numeric" id="op-${index}"></div>`;
    });
    return gridHTML + '</div>';
}

// Función para calificar operaciones matemáticas
function calificarMisionOperaciones(misionDiv, misionData) {
    let aciertos = 0;
    misionDiv.querySelectorAll('.ejercicio').forEach((ejDiv, index) => {
        const input = ejDiv.querySelector('input');
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
