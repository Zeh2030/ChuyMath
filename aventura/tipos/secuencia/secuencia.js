/* ===== FUNCIONES ESPECÍFICAS PARA SECUENCIAS ===== */

// Función para renderizar secuencias
function renderizarMisionSecuencia(data) {
    let ejerciciosHTML = '';
    data.ejercicios.forEach((ej, index) => {
        const elementosHTML = ej.elementos.map(el => el === '?' ? `<span class="placeholder">?</span>` : `<span class="elemento">${el}</span>`).join('');
        let respuestaHTML = '';
        if (ej.opciones && ej.opciones.length > 0) {
            respuestaHTML = '<ul class="secuencia-opciones">';
            ej.opciones.forEach((opcion, optIndex) => {
                const idUnico = `seq-${data.id}-${index}-${optIndex}`;
                respuestaHTML += `<li><input type="radio" name="secuencia-${data.id}-${index}" id="${idUnico}" value="${opcion}"><label for="${idUnico}">${opcion}</label></li>`;
            });
            respuestaHTML += '</ul>';
        } else {
            respuestaHTML = `<div class="secuencia-respuesta"><input type="text" placeholder="Respuesta"></div>`;
        }
        ejerciciosHTML += `<div class="secuencia-ejercicio" data-respuesta="${ej.respuesta}"><div class="secuencia-elementos">${elementosHTML}</div>${respuestaHTML}</div>`;
    });
    return ejerciciosHTML;
}

// Función para calificar secuencias
function calificarMisionSecuencia(misionDiv, misionData) {
    let aciertos = 0;
    misionDiv.querySelectorAll('.secuencia-ejercicio').forEach((ejDiv, index) => {
        const respuestaCorrecta = misionData.ejercicios[index].respuesta;
        let esCorrecto = false;
        
        // Buscar input de texto o radio seleccionado
        const textInput = ejDiv.querySelector('input[type="text"]');
        const radioInput = ejDiv.querySelector('input[type="radio"]:checked');
        
        if (textInput && textInput.value.trim() === respuestaCorrecta) {
            textInput.classList.add('correct');
            esCorrecto = true;
        } else if (radioInput && radioInput.value === respuestaCorrecta) {
            const label = radioInput.nextElementSibling;
            label.classList.add('correcto');
            esCorrecto = true;
        } else {
            if (textInput) textInput.classList.add('incorrect');
            if (radioInput) radioInput.nextElementSibling.classList.add('incorrecto');
        }
        
        if (esCorrecto) aciertos++;
    });
    return aciertos;
}


