/* ===== FUNCIONES ESPECÍFICAS PARA BALANZA LÓGICA ===== */

// Función para renderizar balanza lógica
function renderizarMisionBalanza(data) {
    const opcionesHTML = data.opciones.map((opcion, index) => 
        `<li><input type="radio" name="balanza-${data.id}" id="balanza-${data.id}-${index}" value="${opcion}"><label for="balanza-${data.id}-${index}">${opcion}</label></li>`
    ).join('');
    return `
        <div class="balanza-ejercicio" data-respuesta="${data.respuesta}">
            <div class="balanza-pregunta-svg">${data.pregunta_svg}</div>
            <ul class="opciones-lista balanza-opciones">${opcionesHTML}</ul>
            <div class="feedback-container"></div>
        </div>
    `;
}

// Función para calificar balanza lógica
function calificarMisionBalanza(misionDiv, misionData) {
    const selectedOption = document.querySelector(`input[name="balanza-${misionData.id}"]:checked`);
    if (!selectedOption) return 0;
    
    const esCorrecto = selectedOption.value === misionData.respuesta;
    const label = selectedOption.nextElementSibling;
    label.classList.toggle('correcto', esCorrecto);
    label.classList.toggle('incorrecto', !esCorrecto);
    
    const explicacion = esCorrecto ? misionData.explicacion_correcta : misionData.explicacion_incorrecta;
    mostrarFeedback(misionDiv.querySelector('.feedback-container'), explicacion, esCorrecto ? 'correcto' : 'incorrecto');
    return esCorrecto ? 1 : 0;
}

// Función para mostrar feedback
function mostrarFeedback(container, texto, tipo) {
    if (container) container.innerHTML = `<div class="feedback-box ${tipo}">${texto}</div>`;
}
