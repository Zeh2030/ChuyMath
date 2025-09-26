/* ===== FUNCIONES ESPECÍFICAS PARA OPCIÓN MÚLTIPLE ===== */

// Función para renderizar opciones múltiples
function renderizarMisionOpcionMultiple(data) {
    let opcionesHTML = '<ul class="opciones-lista">';
    data.opciones.forEach((opcion, index) => {
        const idUnico = `om-${data.id}-${index}`;
        opcionesHTML += `<li><input type="radio" name="opcion-multiple-${data.id}" id="${idUnico}" value="${opcion}"><label for="${idUnico}">${opcion}</label></li>`;
    });
    opcionesHTML += '</ul>';
    return `<p class="opcion-multiple-pregunta">${data.pregunta}</p>${data.imagen ? `<img src="${data.imagen}" alt="Imagen de la misión" class="opcion-multiple-imagen">` : ''}${opcionesHTML}`;
}

// Función para calificar opciones múltiples
function calificarMisionOpcionMultiple(misionDiv, misionData) {
    const selectedOption = document.querySelector(`input[name="opcion-multiple-${misionData.id}"]:checked`);
    if (!selectedOption) return 0;
    
    const esCorrecto = selectedOption.value === misionData.respuesta;
    const label = selectedOption.nextElementSibling;
    label.classList.toggle('correcto', esCorrecto);
    label.classList.toggle('incorrecto', !esCorrecto);
    
    return esCorrecto ? 1 : 0;
}
