/* ===== FUNCIONES ESPECÍFICAS PARA CRIPTOARITMÉTICA ===== */

// Función para renderizar criptoaritmética
function renderizarMisionCripto(data) {
    let ejerciciosHTML = '';
    data.ejercicios.forEach((ej, index) => {
        const operacionHTML = `
            <div class="cripto-operacion">
                ${ej.operacion.linea1}<br>
                ${ej.operacion.linea2}<br>
                <hr>
                ${ej.operacion.resultado}
            </div>
        `;
        
        const respuestaHTML = ej.solucion.map(sol => 
            `<input type="number" class="cripto-input" data-figura="${sol.figura}" placeholder="${sol.figura}" min="0" max="9">`
        ).join('');
        
        ejerciciosHTML += `
            <div class="cripto-ejercicio" data-respuesta="${JSON.stringify(ej.solucion)}">
                ${operacionHTML}
                <div class="cripto-respuesta">
                    ${respuestaHTML}
                </div>
                <div class="feedback-container"></div>
            </div>
        `;
    });
    return ejerciciosHTML;
}

// Función para calificar criptoaritmética
function calificarMisionCripto(misionDiv, misionData) {
    let aciertos = 0;
    misionDiv.querySelectorAll('.cripto-ejercicio').forEach((ejDiv, index) => {
        const solucionCorrecta = misionData.ejercicios[index].solucion;
        let esCorrecto = true;
        
        solucionCorrecta.forEach(sol => {
            const input = ejDiv.querySelector(`[data-figura="${sol.figura}"]`);
            if (input && input.value !== sol.valor) {
                esCorrecto = false;
            }
        });
        
        if (esCorrecto) {
            ejDiv.querySelectorAll('.cripto-input').forEach(input => input.classList.add('correct'));
            aciertos++;
        } else {
            ejDiv.querySelectorAll('.cripto-input').forEach(input => input.classList.add('incorrect'));
        }
    });
    return aciertos;
}
