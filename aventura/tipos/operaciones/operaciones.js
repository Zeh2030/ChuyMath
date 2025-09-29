/* ===== FUNCIONES ESPECÍFICAS PARA OPERACIONES MATEMÁTICAS ===== */

// Función para renderizar operaciones matemáticas
function renderizarMisionOperaciones(data) {
    console.log('Datos recibidos en operaciones:', data);
    
    if (!data || !data.ejercicios) {
        return '<p class="error">Error: No se encontraron ejercicios de operaciones.</p>';
    }
    
    let gridHTML = '<div class="operaciones-grid">';
    data.ejercicios.forEach((ej, index) => {
        console.log(`Ejercicio ${index}:`, ej);
        gridHTML += `<div class="ejercicio" data-respuesta="${ej.respuesta}"><p>${ej.pregunta} =</p><input type="number" inputmode="numeric" id="op-${index}" placeholder="?"></div>`;
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

