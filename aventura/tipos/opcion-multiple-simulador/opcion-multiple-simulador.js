/* ===== FUNCIONES ESPECÍFICAS PARA OPCIÓN MÚLTIPLE (SIMULADOR) ===== */

// Función para renderizar opciones múltiples
function renderizarMisionOpcionMultipleSimulador(data) {
    let opcionesHTML = '';
    
    // Las opciones son siempre de texto en este contexto
    const safeId = data.id.replace(/[^a-zA-Z0-9]/g, ''); // Crea un ID seguro
    opcionesHTML = data.opciones.map((opcion, index) => {
        const uniqueId = `op-mult-sim-${safeId}-${index}`;
        // Estructura simplificada: label contiene el input
        return `<label for="${uniqueId}" class="opcion-label">
                    <input type="radio" name="op-mult-sim-${safeId}" id="${uniqueId}" value="${opcion}">
                    <span>${opcion}</span>
                </label>`;
    }).join('');

    const imagenHTML = data.imagen ? `<div class="pregunta-imagen-container">${data.imagen}</div>` : '';
    
    return `
        <div class="opcion-multiple-container">
            ${imagenHTML}
            <div class="opciones-lista-simulador">${opcionesHTML}</div>
            <div class="feedback-container"></div>
        </div>
    `;
}

// Función para calificar opciones múltiples
function calificarMisionOpcionMultipleSimulador(misionDiv, misionData) {
    let aciertos = 0;
    
    const safeId = misionData.id.replace(/[^a-zA-Z0-9]/g, '');
    const selectedOption = misionDiv.querySelector(`input[name="op-mult-sim-${safeId}"]:checked`);
    
    if (selectedOption) {
        const esCorrecto = selectedOption.value === misionData.respuesta;
        const label = selectedOption.closest('.opcion-label');
        if (label) {
            label.classList.add(esCorrecto ? 'correcto' : 'incorrecto');
        }
        if (esCorrecto) {
            aciertos = 1;
        }
    }
    
    return aciertos;
}
