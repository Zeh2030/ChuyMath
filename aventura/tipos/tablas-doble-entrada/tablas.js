/* ===== FUNCIONES ESPECÍFICAS PARA TABLAS DE DOBLE ENTRADA ===== */

// Función para renderizar tablas de doble entrada
function renderizarMisionTabla(data) {
    const pistasHTML = data.pistas.map(pista => `<li>${pista}</li>`).join('');
    const headersColumnasHTML = data.encabezados_columna.map(header => `<th>${header}</th>`).join('');
    
    let filasTablaHTML = '';
    data.encabezados_fila.forEach(headerFila => {
        let celdasHTML = '';
        data.encabezados_columna.forEach(() => {
            celdasHTML += `<td class="celda-logica"></td>`;
        });
        filasTablaHTML += `<tr><th>${headerFila}</th>${celdasHTML}</tr>`;
    });

    const opcionesFinalesHTML = data.opciones_finales.map((opcion, index) => {
        const idUnico = `tabla-final-${data.id}-${index}`;
        return `<li><input type="radio" name="tabla-final-${data.id}" id="${idUnico}" value="${opcion}"><label for="${idUnico}">${opcion}</label></li>`;
    }).join('');

    return `
        <p class="tabla-instruccion">${data.instruccion}</p>
        <div class="tabla-logica-container">
            <div class="tabla-pistas">
                <h3>Pistas 🕵️</h3>
                <ul>${pistasHTML}</ul>
            </div>
            <div class="tabla-interactiva-container">
                <table class="tabla-interactiva">
                    <thead>
                        <tr>
                            <th class="header-vacio"></th>
                            ${headersColumnasHTML}
                        </tr>
                    </thead>
                    <tbody>${filasTablaHTML}</tbody>
                </table>
            </div>
        </div>
        <div class="pregunta-final-container">
            <p class="pregunta-final-texto">${data.pregunta_final}</p>
            <ul class="opciones-lista">${opcionesFinalesHTML}</ul>
        </div>
    `;
}

// Función para agregar interactividad a las tablas
function addTableListeners(misionDiv) {
    misionDiv.querySelectorAll('.celda-logica').forEach(celda => {
        celda.addEventListener('click', function() {
            const estados = ['', '✅', '❌'];
            const clases = ['', 'si', 'no'];
            
            let estadoActual = this.textContent;
            let indiceActual = estados.indexOf(estadoActual);
            let nuevoIndice = (indiceActual + 1) % estados.length;

            this.textContent = estados[nuevoIndice];
            this.className = 'celda-logica';
            if (clases[nuevoIndice]) {
                this.classList.add(clases[nuevoIndice]);
            }
        });
    });
}

// Función para calificar tablas de doble entrada
function calificarMisionTabla(misionDiv, misionData) {
    const opcionSeleccionada = misionDiv.querySelector('input[type="radio"]:checked');
    
    if (!opcionSeleccionada) {
        // Mostrar mensaje si no se seleccionó ninguna opción
        const preguntaContainer = misionDiv.querySelector('.pregunta-final-container');
        if (preguntaContainer) {
            const mensaje = document.createElement('div');
            mensaje.style.color = '#e74c3c';
            mensaje.style.fontWeight = 'bold';
            mensaje.style.marginTop = '10px';
            mensaje.textContent = '¡Selecciona una respuesta!';
            preguntaContainer.appendChild(mensaje);
        }
        return false;
    }

    const esCorrecta = opcionSeleccionada.value === misionData.respuesta_final;
    const label = opcionSeleccionada.parentElement.querySelector('label');
    
    // Aplicar estilos de feedback
    if (esCorrecta) {
        label.style.backgroundColor = 'var(--c-success)';
        label.style.color = 'white';
        label.style.borderColor = 'var(--c-success)';
        
        // Mostrar explicación correcta si existe
        if (misionData.explicacion_correcta) {
            mostrarExplicacionTabla(misionDiv, misionData.explicacion_correcta, 'correcta', '🎉');
        }
    } else {
        label.style.backgroundColor = 'var(--c-danger)';
        label.style.color = 'white';
        label.style.borderColor = 'var(--c-danger)';
        
        // Mostrar explicación incorrecta si existe
        if (misionData.explicacion_incorrecta) {
            mostrarExplicacionTabla(misionDiv, misionData.explicacion_incorrecta, 'incorrecta', '💡');
        }
    }

    return esCorrecta;
}

// Función para mostrar explicaciones en tablas
function mostrarExplicacionTabla(misionDiv, texto, tipo, icono) {
    const explicacionDiv = document.createElement('div');
    explicacionDiv.className = `explicacion-feedback ${tipo}`;
    explicacionDiv.style.marginTop = '20px';
    explicacionDiv.style.padding = '15px';
    explicacionDiv.style.borderRadius = '10px';
    explicacionDiv.style.fontSize = '1.1rem';
    explicacionDiv.style.fontWeight = '600';
    explicacionDiv.innerHTML = `
        <span class="icono-explicacion">${icono}</span>
        ${texto}
    `;
    
    if (tipo === 'correcta') {
        explicacionDiv.style.backgroundColor = '#e8f8f5';
        explicacionDiv.style.color = '#27ae60';
        explicacionDiv.style.border = '2px solid #2ecc71';
    } else {
        explicacionDiv.style.backgroundColor = '#fdf2f2';
        explicacionDiv.style.color = '#e74c3c';
        explicacionDiv.style.border = '2px solid #e74c3c';
    }
    
    const preguntaContainer = misionDiv.querySelector('.pregunta-final-container');
    if (preguntaContainer) {
        preguntaContainer.appendChild(explicacionDiv);
    }
}
