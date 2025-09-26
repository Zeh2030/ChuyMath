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
        if (input.value.trim() === respuestaCorrecta) {
            input.classList.add('correct');
            aciertos++;
        } else {
            input.classList.add('incorrect');
        }
    });
    return aciertos;
}
