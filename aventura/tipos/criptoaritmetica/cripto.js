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
    
    // Regex para detectar emojis y letras mayúsculas
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}]/gu;
    const letraRegex = /[A-Z]/g;
    
    [operacion.linea1, operacion.linea2, operacion.resultado].forEach(linea => {
        // Buscar emojis
        const emojis = linea.match(emojiRegex) || [];
        emojis.forEach(emoji => figuras.add(emoji));
        
        // Buscar letras mayúsculas
        const letras = linea.match(letraRegex) || [];
        letras.forEach(letra => figuras.add(letra));
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
