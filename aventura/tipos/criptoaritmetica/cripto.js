/* ===== FUNCIONES ESPECÍFICAS PARA CRIPTOARITMÉTICA ===== */

// Función para renderizar criptoaritmética
function renderizarMisionCripto(data) {
    let ejerciciosHTML = '';
    data.ejercicios.forEach(ej => {
        const figurasUnicas = obtenerFigurasUnicas(ej.operacion);
        const inputsHTML = figurasUnicas.map(figura => `
            <div class="cripto-input-group">
                <label>${figura}</label>
                <input type="number" class="cripto-input" data-figura="${figura}" min="0" max="9">
            </div>
        `).join('');

        ejerciciosHTML += `
            <div class="cripto-ejercicio-container">
                <div class="cripto-operacion">
                    <pre>${ej.operacion.linea1}\n${ej.operacion.linea2}\n<hr>\n${ej.operacion.resultado}</pre>
                </div>
                <div class="cripto-inputs">${inputsHTML}</div>
                <div class="feedback-container"></div>
            </div>
        `;
    });
    return ejerciciosHTML;
}

function obtenerFigurasUnicas(operacion) {
    const figuras = new Set();
    operacion.linea1.split('').forEach(char => {
        if (char.match(/[A-Z]/)) figuras.add(char);
    });
    operacion.linea2.split('').forEach(char => {
        if (char.match(/[A-Z]/)) figuras.add(char);
    });
    operacion.resultado.split('').forEach(char => {
        if (char.match(/[A-Z]/)) figuras.add(char);
    });
    return Array.from(figuras);
}

// Función para calificar criptoaritmética
function calificarMisionCripto(misionDiv, misionData) {
    let todosCorrectos = true;
    misionDiv.querySelectorAll('.cripto-input').forEach(input => {
        const figura = input.dataset.figura;
        const valorUsuario = input.value;
        const solucionCorrecta = misionData.ejercicios[0].solucion.find(s => s.figura === figura);

        input.classList.remove('correcto', 'incorrecto');

        if (solucionCorrecta && valorUsuario === solucionCorrecta.valor) {
            input.classList.add('correcto');
        } else {
            input.classList.add('incorrecto');
            todosCorrectos = false;
        }
    });

    const explicacion = todosCorrectos ? 
        misionData.ejercicios[0].explicacion_correcta :
        misionData.ejercicios[0].explicacion_incorrecta;

    mostrarFeedbackCripto(misionDiv.querySelector('.feedback-container'), explicacion, todosCorrectos ? 'correcto' : 'incorrecto');

    return todosCorrectos ? 1 : 0;
}

function mostrarFeedbackCripto(container, texto, tipo) {
    if (container) {
        container.innerHTML = `<div class="feedback-box ${tipo}">${texto}</div>`;
    }
}
