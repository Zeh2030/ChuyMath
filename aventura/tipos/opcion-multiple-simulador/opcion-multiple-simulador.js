/* ===== FUNCIONES ESPECÍFICAS PARA OPCIÓN MÚLTIPLE (SIMULADOR) ===== */

// Función para renderizar opciones múltiples
function renderizarMisionOpcionMultipleSimulador(data) {
    let opcionesHTML = '';
    
    const safeId = data.id.replace(/[^a-zA-Z0-9]/g, ''); // Crea un ID seguro
    
    // Verificar si las opciones son imágenes
    if (data.opciones_son_imagenes) {
        opcionesHTML = data.opciones.map((opcion, index) => {
            const uniqueId = `op-mult-sim-${safeId}-${index}`;
            return `<label for="${uniqueId}" class="opcion-label opcion-imagen">
                        <input type="radio" name="op-mult-sim-${safeId}" id="${uniqueId}" value="${index}">
                        <div class="opcion-imagen-container">${opcion}</div>
                    </label>`;
        }).join('');
    } else {
        // Las opciones son de texto
        opcionesHTML = data.opciones.map((opcion, index) => {
            const uniqueId = `op-mult-sim-${safeId}-${index}`;
            return `<label for="${uniqueId}" class="opcion-label">
                        <input type="radio" name="op-mult-sim-${safeId}" id="${uniqueId}" value="${index}">
                        <span>${opcion}</span>
                    </label>`;
        }).join('');
    }

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
        // Comparar el índice seleccionado con la respuesta (que es un string del índice)
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
