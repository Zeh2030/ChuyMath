document.addEventListener('DOMContentLoaded', () => {
    const aventuraTitulo = document.getElementById('aventura-titulo');
    const misionesContainer = document.getElementById('misiones-container');
    const aventuraFooter = document.getElementById('aventura-footer');
    const completarBtn = document.getElementById('completar-aventura-btn');
    const mensajeFinal = document.getElementById('mensaje-final');

    let aventuraData = null;
    const PROGRESO_KEY = 'progresoChuy';

    function getDiaAventura() {
        const params = new URLSearchParams(window.location.search);
        return params.get('dia');
    }

    async function cargarAventura(dia) {
        try {
            if (!dia) {
                throw new Error('No se especificó el día de la aventura');
            }
            
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) {
                throw new Error(`No se pudo cargar la aventura del día ${dia}`);
            }
            
            aventuraData = await response.json();
            renderizarAventura();
            
        } catch (error) {
            console.error('Error al cargar la aventura:', error);
            misionesContainer.innerHTML = `
                <div class="error-mensaje">
                    <h2>¡Ups! Algo salió mal</h2>
                    <p>No se pudo cargar la aventura del día ${dia || 'especificado'}.</p>
                    <p>Error: ${error.message}</p>
                    <a href="../index.html" class="back-button">Volver al Portal</a>
                </div>
            `;
        }
    }

    function renderizarAventura() {
        misionesContainer.innerHTML = '';
        aventuraTitulo.textContent = aventuraData.titulo;

        aventuraData.misiones.forEach(misionData => {
            const misionDiv = document.createElement('div');
            misionDiv.className = `mision ${misionData.tipo}`;
            misionDiv.id = misionData.id;
            misionDiv.dataset.info = JSON.stringify(misionData);

            let contenidoMision = `<h2>${misionData.titulo}</h2>`;
            switch (misionData.tipo) {
                case 'operaciones':
                    contenidoMision += renderizarMisionOperaciones(misionData);
                    break;
                case 'opcion-multiple':
                    contenidoMision += renderizarMisionOpcionMultiple(misionData);
                    break;
                case 'numberblocks-dibujo':
                    contenidoMision += renderizarMisionDibujo(misionData);
                    break;
                case 'secuencia':
                    contenidoMision += renderizarMisionSecuencia(misionData);
                    break;
                case 'conteo-figuras':
                    contenidoMision += renderizarMisionConteo(misionData);
                    break;
                // ===== NUEVO CASO PARA TABLAS DE DOBLE ENTRADA =====
                case 'tabla-doble-entrada':
                    contenidoMision += renderizarMisionTabla(misionData);
                    break;
                // ===== NUEVO CASO PARA CRIPTOARITMÉTICA =====
        case 'criptoaritmetica':
            contenidoMision += renderizarMisionCripto(misionData);
            break;
        case 'desarrollo-cubos':
            contenidoMision += renderizarMisionDesarrolloCubos(misionData);
            break;
        case 'balanza-logica':
            contenidoMision += renderizarMisionBalanza(misionData);
            break;
        default:
            contenidoMision += `<p>Tipo de misión no reconocido.</p>`;
            }
            misionDiv.innerHTML = contenidoMision;
            misionesContainer.appendChild(misionDiv);

        // Añadir listeners de eventos para tablas
        if (misionData.tipo === 'tabla-doble-entrada') {
            addTableListeners(misionDiv);
        }
        
        // Añadir listeners de eventos para desarrollo de cubos
        if (misionData.tipo === 'desarrollo-cubos') {
            addDesarrolloCubosListeners(misionDiv);
        }
        });
        aventuraFooter.classList.remove('hidden');
    }

    // --- FUNCIONES DE RENDERIZADO (ACTUALIZADA PARA SECUENCIAS) ---
    function renderizarMisionSecuencia(data) {
        let ejerciciosHTML = '';
        data.ejercicios.forEach((ej, index) => {
            const elementosHTML = ej.elementos.map(el => 
                el === '?' ? `<span class="placeholder">?</span>` : `<span class="elemento">${el}</span>`
            ).join('');

            let respuestaHTML = '';
            // ===== LÓGICA MEJORADA AQUÍ =====
            // Si el ejercicio tiene 'opciones', renderiza botones de radio.
            if (ej.opciones && ej.opciones.length > 0) {
                respuestaHTML = `
                    <div class="instrucciones-opciones">
                        <p>🔍 <strong>Elige la respuesta correcta:</strong></p>
                        <p>¿Qué figura viene después en el patrón?</p>
                    </div>
                    <ul class="secuencia-opciones">`;
                ej.opciones.forEach((opcion, optIndex) => {
                    const idUnico = `seq-${data.id}-${index}-${optIndex}`;
                    respuestaHTML += `
                        <li>
                            <input type="radio" name="secuencia-${data.id}-${index}" id="${idUnico}" value="${opcion}">
                            <label for="${idUnico}">${opcion}</label>
                        </li>
                    `;
                });
                respuestaHTML += '</ul>';
            } else {
                // Si no, renderiza el campo de texto como antes.
                respuestaHTML = `
                    <div class="secuencia-respuesta">
                        <input type="text" placeholder="Respuesta">
                    </div>
                `;
            }

            ejerciciosHTML += `
                <div class="secuencia-ejercicio" data-respuesta="${ej.respuesta}">
                    <div class="secuencia-elementos">${elementosHTML}</div>
                    ${respuestaHTML}
                </div>
            `;
        });
        return ejerciciosHTML;
    }

    // ===== NUEVA FUNCIÓN PARA RENDERIZAR CONTEO DE FIGURAS =====
    function renderizarMisionConteo(data) {
        let ejerciciosHTML = `
            <div class="instrucciones-conteo">
                <p>🔍 <strong>Cuenta con cuidado:</strong></p>
                <p>Observa cada figura y escribe el número total que encuentres.</p>
            </div>
        `;
        
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

    // ===== NUEVA FUNCIÓN PARA RENDERIZAR TABLAS DE DOBLE ENTRADA =====
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

    // ===== FUNCIÓN PARA AÑADIR INTERACTIVIDAD A LAS TABLAS =====
    function addTableListeners(misionDiv) {
        misionDiv.querySelectorAll('.celda-logica').forEach(celda => {
            celda.addEventListener('click', () => {
                const estados = ['', '✅', '❌'];
                const clases = ['', 'si', 'no'];
                
                let estadoActual = celda.textContent;
                let indiceActual = estados.indexOf(estadoActual);
                let nuevoIndice = (indiceActual + 1) % estados.length;

                celda.textContent = estados[nuevoIndice];
                celda.classList.remove('si', 'no');
                if (clases[nuevoIndice]) {
                    celda.classList.add(clases[nuevoIndice]);
                }
            });
        });
    }

    // ===== NUEVA FUNCIÓN PARA RENDERIZAR CRIPTOARITMÉTICA =====
    function renderizarMisionCripto(data) {
        const solucionHTML = data.solucion.map(item => `
            <div class="cripto-input-grupo">
                <span class="figura">${item.figura}</span> = 
                <input type="number" inputmode="numeric" data-figura="${item.figura}" placeholder="?">
            </div>
        `).join('');

        return `
            <div class="cripto-ejercicio">
                <p class="cripto-instruccion">${data.instruccion}</p>
                <div class="cripto-container">
                    <div class="cripto-operacion">
                        <div>${data.operacion.linea1}</div>
                        <div class="linea-suma">${data.operacion.linea2}</div>
                        <div>${data.operacion.resultado}</div>
                    </div>
                    <div class="cripto-solucion-area">
                        ${solucionHTML}
                    </div>
                </div>
            </div>
        `;
    }
    
    // --- OTRAS FUNCIONES DE RENDERIZADO (SIN CAMBIOS) ---
    function renderizarMisionOperaciones(data) { /* ... */ 
        let gridHTML = '<div class="operaciones-grid">';
        data.ejercicios.forEach((ej, index) => {
            gridHTML += `<div class="ejercicio" data-respuesta="${ej.respuesta}"><p>${ej.pregunta} =</p><input type="number" inputmode="numeric" id="op-${index}"></div>`;
        });
        return gridHTML + '</div>';
    }
    function renderizarMisionOpcionMultiple(data) { /* ... */
        let opcionesHTML = '<ul class="opciones-lista">';
        data.opciones.forEach((opcion, index) => {
            opcionesHTML += `<li><input type="radio" name="opcion-multiple-${data.id}" id="om-${data.id}-${index}" value="${opcion}"><label for="om-${data.id}-${index}">${opcion}</label></li>`;
        });
        opcionesHTML += '</ul>';
        return `<p class="opcion-multiple-pregunta">${data.pregunta}</p>${data.imagen ? `<img src="${data.imagen}" alt="Imagen de la misión" class="opcion-multiple-imagen">` : ''}${opcionesHTML}`;
    }
    function renderizarMisionDibujo(data) { /* ... */
        return `<p class="numberblocks-instruccion">${data.instruccion}</p><div class="canvas-placeholder">El lienzo de dibujo aparecerá aquí.</div>`;
    }

    // --- LÓGICA DE CALIFICACIÓN (ACTUALIZADA PARA SECUENCIAS) ---
    function completarAventura() {
        let puntaje = 0;
        let totalPreguntas = 0;

        document.querySelectorAll('.mision').forEach(misionDiv => {
            const misionData = JSON.parse(misionDiv.dataset.info);
            if (misionData.ejercicios && misionData.ejercicios.length > 0) {
                totalPreguntas += misionData.ejercicios.length;
            } else {
                totalPreguntas++;
            }
            switch (misionData.tipo) {
                case 'operaciones':
                    puntaje += calificarMisionOperaciones(misionDiv, misionData);
                    break;
                case 'opcion-multiple':
                    puntaje += calificarMisionOpcionMultiple(misionDiv, misionData) ? 1 : 0;
                    break;
                case 'secuencia':
                    puntaje += calificarMisionSecuencia(misionDiv, misionData);
                    break;
                case 'conteo-figuras':
                    puntaje += calificarMisionConteo(misionDiv, misionData);
                    break;
                // ===== NUEVO CASO DE CALIFICACIÓN PARA TABLAS =====
                case 'tabla-doble-entrada':
                    puntaje += calificarMisionTabla(misionDiv, misionData) ? 1 : 0;
                    break;
                // ===== NUEVO CASO DE CALIFICACIÓN PARA CRIPTOARITMÉTICA =====
        case 'criptoaritmetica':
            puntaje += calificarMisionCripto(misionDiv, misionData);
            break;
        case 'desarrollo-cubos':
            puntaje += calificarMisionDesarrolloCubos(misionDiv, misionData);
            break;
        case 'balanza-logica':
            puntaje += calificarMisionBalanza(misionDiv, misionData);
            break;
        case 'numberblocks-dibujo':
            puntaje++;
            break;
            }
        });
        mensajeFinal.textContent = `¡Aventura terminada! Lograste ${puntaje} de ${totalPreguntas} aciertos. ¡Sigue así!`;
        completarBtn.style.display = 'none';
        
        // Mostrar botones de navegación final
        const navegacionFinal = document.getElementById('navegacion-final');
        if (navegacionFinal) {
            navegacionFinal.classList.remove('hidden');
        }
        
        guardarProgreso();
    }

    // ===== NUEVA FUNCIÓN PARA CALIFICAR SECUENCIAS (MÁS INTELIGENTE) =====
    function calificarMisionSecuencia(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.secuencia-ejercicio').forEach((ejDiv, index) => {
            const respuestaCorrecta = misionData.ejercicios[index].respuesta;
            
            // Revisa si hay opciones de radio
            const radioInput = ejDiv.querySelector('input[type="radio"]');
            if (radioInput) {
                const opcionSeleccionada = ejDiv.querySelector('input[type="radio"]:checked');
                if (opcionSeleccionada && opcionSeleccionada.value === respuestaCorrecta) {
                    opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-success)';
                    aciertos++;
                } else if (opcionSeleccionada) {
                    opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-danger)';
                }
            } else { // Si no, califica el campo de texto
                const textInput = ejDiv.querySelector('input[type="text"]');
                textInput.classList.remove('correct', 'incorrect');
                if (textInput.value.trim().toLowerCase() === respuestaCorrecta.toLowerCase()) {
                    textInput.classList.add('correct');
                    aciertos++;
                } else {
                    textInput.classList.add('incorrect');
                }
            }
        });
        return aciertos;
    }

    // ===== NUEVA FUNCIÓN PARA CALIFICAR CONTEO DE FIGURAS =====
    function calificarMisionConteo(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.conteo-ejercicio').forEach((ejDiv, index) => {
            const input = ejDiv.querySelector('input[type="number"]');
            const respuestaCorrecta = misionData.ejercicios[index].respuesta;
            const ejercicio = misionData.ejercicios[index];
            
            // Limpiar explicaciones anteriores
            const explicacionAnterior = ejDiv.querySelector('.explicacion-feedback');
            if (explicacionAnterior) {
                explicacionAnterior.remove();
            }
            
            input.classList.remove('correct', 'incorrect');
            
            if (input.value.trim() === respuestaCorrecta) {
                input.classList.add('correct');
                aciertos++;
                
                // Mostrar explicación correcta
                if (ejercicio.explicacion_correcta) {
                    mostrarExplicacion(ejDiv, ejercicio.explicacion_correcta, 'correcta', '🎉');
                }
                
                // Mostrar botón de reintentar para permitir práctica adicional
                mostrarBotonReintentar(ejDiv);
            } else {
                input.classList.add('incorrect');
                
                // Mostrar explicación incorrecta
                if (ejercicio.explicacion_incorrecta) {
                    mostrarExplicacion(ejDiv, ejercicio.explicacion_incorrecta, 'incorrecta', '💡');
                }
                
                // Mostrar botón de reintentar para intentar de nuevo
                mostrarBotonReintentar(ejDiv);
            }
        });
        return aciertos;
    }

    // ===== FUNCIÓN PARA MOSTRAR EXPLICACIONES =====
    function mostrarExplicacion(ejercicioDiv, texto, tipo, icono) {
        const explicacionDiv = document.createElement('div');
        explicacionDiv.className = `explicacion-feedback ${tipo}`;
        explicacionDiv.innerHTML = `
            <span class="icono-explicacion">${icono}</span>
            ${texto}
        `;
        
        // Insertar después del input
        const inputContainer = ejercicioDiv.querySelector('.conteo-respuesta');
        inputContainer.appendChild(explicacionDiv);
    }

    // ===== FUNCIÓN PARA REINTENTAR EJERCICIO =====
    function reintentarEjercicio(ejercicioDiv) {
        // Limpiar explicaciones anteriores
        const explicacionAnterior = ejercicioDiv.querySelector('.explicacion-feedback');
        if (explicacionAnterior) {
            explicacionAnterior.remove();
        }
        
        // Limpiar botones anteriores
        const botonReintentarAnterior = ejercicioDiv.querySelector('.boton-reintentar');
        if (botonReintentarAnterior) {
            botonReintentarAnterior.remove();
        }
        
        const botonVerificarAnterior = ejercicioDiv.querySelector('.boton-verificar');
        if (botonVerificarAnterior) {
            botonVerificarAnterior.remove();
        }
        
        // Limpiar estilos del input
        const input = ejercicioDiv.querySelector('input[type="number"]');
        input.classList.remove('correct', 'incorrect');
        input.value = '';
        input.focus();
        
        // Mostrar botón de verificar
        mostrarBotonVerificar(ejercicioDiv);
    }

    // ===== FUNCIÓN PARA MOSTRAR BOTÓN DE REINTENTAR =====
    function mostrarBotonReintentar(ejercicioDiv) {
        // Verificar si ya existe un botón de reintentar
        if (ejercicioDiv.querySelector('.boton-reintentar')) {
            return;
        }
        
        const botonReintentar = document.createElement('button');
        botonReintentar.className = 'boton-reintentar';
        botonReintentar.innerHTML = `
            <span class="icono-reintentar">🔄</span>
            Intentar de nuevo
        `;
        
        // Agregar evento de clic
        botonReintentar.addEventListener('click', () => {
            reintentarEjercicio(ejercicioDiv);
        });
        
        // Insertar después de la explicación
        const inputContainer = ejercicioDiv.querySelector('.conteo-respuesta');
        inputContainer.appendChild(botonReintentar);
    }

    // ===== FUNCIÓN PARA MOSTRAR BOTÓN DE VERIFICAR =====
    function mostrarBotonVerificar(ejercicioDiv) {
        // Verificar si ya existe un botón de verificar
        if (ejercicioDiv.querySelector('.boton-verificar')) {
            return;
        }
        
        const botonVerificar = document.createElement('button');
        botonVerificar.className = 'boton-verificar';
        botonVerificar.innerHTML = `
            <span class="icono-verificar">✓</span>
            Verificar respuesta
        `;
        
        // Agregar evento de clic
        botonVerificar.addEventListener('click', () => {
            verificarEjercicioIndividual(ejercicioDiv);
        });
        
        // Insertar después del input
        const inputContainer = ejercicioDiv.querySelector('.conteo-respuesta');
        inputContainer.appendChild(botonVerificar);
    }

    // ===== FUNCIÓN PARA VERIFICAR EJERCICIO INDIVIDUAL =====
    function verificarEjercicioIndividual(ejercicioDiv) {
        const input = ejercicioDiv.querySelector('input[type="number"]');
        const respuestaCorrecta = ejercicioDiv.dataset.respuesta;
        const ejercicio = JSON.parse(ejercicioDiv.closest('.mision').dataset.info);
        
        // Encontrar el índice del ejercicio
        const index = Array.from(ejercicioDiv.parentElement.querySelectorAll('.conteo-ejercicio')).indexOf(ejercicioDiv);
        const ejercicioData = ejercicio.ejercicios[index];
        
        // Limpiar explicaciones anteriores
        const explicacionAnterior = ejercicioDiv.querySelector('.explicacion-feedback');
        if (explicacionAnterior) {
            explicacionAnterior.remove();
        }
        
        // Limpiar botón de verificar
        const botonVerificar = ejercicioDiv.querySelector('.boton-verificar');
        if (botonVerificar) {
            botonVerificar.remove();
        }
        
        input.classList.remove('correct', 'incorrect');
        
        if (input.value.trim() === respuestaCorrecta) {
            input.classList.add('correct');
            
            // Mostrar explicación correcta
            if (ejercicioData.explicacion_correcta) {
                mostrarExplicacion(ejercicioDiv, ejercicioData.explicacion_correcta, 'correcta', '🎉');
            }
        } else {
            input.classList.add('incorrect');
            
            // Mostrar explicación incorrecta
            if (ejercicioData.explicacion_incorrecta) {
                mostrarExplicacion(ejercicioDiv, ejercicioData.explicacion_incorrecta, 'incorrecta', '💡');
            }
        }
        
        // Mostrar botón de reintentar
        mostrarBotonReintentar(ejercicioDiv);
    }

    // --- OTRAS FUNCIONES DE CALIFICACIÓN Y GUARDADO (SIN CAMBIOS) ---
    function calificarMisionOperaciones(misionDiv, misionData) { /* ... */ 
        let aciertos = 0;
        misionDiv.querySelectorAll('.ejercicio').forEach((ej, index) => {
            const input = ej.querySelector('input');
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
    function calificarMisionOpcionMultiple(misionDiv, misionData) { /* ... */
        const opcionSeleccionada = misionDiv.querySelector('input[type="radio"]:checked');
        if (opcionSeleccionada && opcionSeleccionada.value === misionData.respuesta) {
            opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-success)';
            return true;
        } else if (opcionSeleccionada) {
            opcionSeleccionada.parentElement.querySelector('label').style.backgroundColor = 'var(--c-danger)';
        }
        return false;
    }

    // ===== NUEVA FUNCIÓN PARA CALIFICAR TABLAS DE DOBLE ENTRADA =====
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

    // ===== FUNCIÓN PARA MOSTRAR EXPLICACIONES EN TABLAS =====
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

    // ===== NUEVA FUNCIÓN PARA CALIFICAR CRIPTOARITMÉTICA =====
    function calificarMisionCripto(misionDiv, misionData) {
        let aciertos = 0;
        const inputs = misionDiv.querySelectorAll('.cripto-input-grupo input');
        const ejercicioDiv = misionDiv.querySelector('.cripto-ejercicio');
        
        // Verificar si todos los inputs están llenos
        let todosLlenos = true;
        inputs.forEach(input => {
            if (!input.value.trim()) {
                todosLlenos = false;
                input.style.borderColor = '#e74c3c';
                input.style.backgroundColor = '#fdf2f2';
            }
        });
        
        if (!todosLlenos) {
            // Mostrar mensaje si faltan respuestas
            mostrarMensajeCripto(ejercicioDiv, '¡Completa todos los valores!', 'error');
            return 0;
        }
        
        // Verificar cada respuesta
        misionData.solucion.forEach(solucion => {
            const input = misionDiv.querySelector(`input[data-figura="${solucion.figura}"]`);
            if (input && input.value.trim() === solucion.valor) {
                input.classList.add('correct');
                input.classList.remove('incorrect');
                aciertos++;
            } else {
                input.classList.add('incorrect');
                input.classList.remove('correct');
            }
        });
        
        // Mostrar explicación
        if (aciertos === misionData.solucion.length) {
            if (misionData.explicacion_correcta) {
                mostrarExplicacionCripto(ejercicioDiv, misionData.explicacion_correcta, 'correcta', '🎉');
            }
        } else {
            if (misionData.explicacion_incorrecta) {
                mostrarExplicacionCripto(ejercicioDiv, misionData.explicacion_incorrecta, 'incorrecta', '💡');
            }
        }
        
        return aciertos;
    }

    // ===== FUNCIÓN PARA MOSTRAR EXPLICACIONES EN CRIPTOARITMÉTICA =====
    function mostrarExplicacionCripto(ejercicioDiv, texto, tipo, icono) {
        const explicacionDiv = document.createElement('div');
        explicacionDiv.className = `explicacion-feedback ${tipo}`;
        explicacionDiv.style.marginTop = '20px';
        explicacionDiv.style.padding = '15px';
        explicacionDiv.style.borderRadius = '10px';
        explicacionDiv.style.fontSize = '1.1rem';
        explicacionDiv.style.fontWeight = '600';
        explicacionDiv.style.textAlign = 'center';
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
        
        ejercicioDiv.appendChild(explicacionDiv);
    }

    // ===== FUNCIÓN PARA MOSTRAR MENSAJES EN CRIPTOARITMÉTICA =====
    function mostrarMensajeCripto(ejercicioDiv, texto, tipo) {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.style.marginTop = '15px';
        mensajeDiv.style.padding = '10px';
        mensajeDiv.style.borderRadius = '8px';
        mensajeDiv.style.fontWeight = 'bold';
        mensajeDiv.style.textAlign = 'center';
        mensajeDiv.textContent = texto;
        
        if (tipo === 'error') {
            mensajeDiv.style.backgroundColor = '#fdf2f2';
            mensajeDiv.style.color = '#e74c3c';
            mensajeDiv.style.border = '2px solid #e74c3c';
        }
        
        ejercicioDiv.appendChild(mensajeDiv);
        
        // Remover el mensaje después de 3 segundos
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.parentNode.removeChild(mensajeDiv);
            }
        }, 3000);
    }

    function guardarProgreso() { /* ... */
        const diaAventura = getDiaAventura();
        if (!diaAventura) return;

        try {
            // Obtener progreso existente o crear uno nuevo con valores por defecto
            const defaults = { misionesCompletadas: [], ultimaVisita: null, racha: 0 };
            let progreso = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || defaults;
            progreso = { ...defaults, ...progreso };

            // Añadir la misión actual si no está ya en la lista
            if (!progreso.misionesCompletadas.includes(diaAventura)) {
                progreso.misionesCompletadas.push(diaAventura);
            }

            // --- Lógica para calcular la racha ---
            const hoy = new Date();
            const hoyStr = hoy.toISOString().split('T')[0];

            // Si es la primera vez que completa algo o es un día diferente al anterior
            if (!progreso.ultimaVisita || progreso.ultimaVisita !== hoyStr) {
                const ayer = new Date(hoy);
                ayer.setDate(hoy.getDate() - 1);
                const ayerStr = ayer.toISOString().split('T')[0];

                if (progreso.ultimaVisita === ayerStr) {
                    // Si la última visita fue ayer, incrementa la racha
                    progreso.racha += 1;
                } else if (!progreso.ultimaVisita) {
                    // Primera vez, establecer racha en 1
                    progreso.racha = 1;
                } else {
                    // Si pasó más de un día, reiniciar racha
                    progreso.racha = 1;
                }

                progreso.ultimaVisita = hoyStr; // Actualizar la fecha de la última visita
            }
            // Si ya visitó hoy, la racha no cambia.

            // Guardar el objeto actualizado en localStorage
            localStorage.setItem(PROGRESO_KEY, JSON.stringify(progreso));
            console.log('Progreso guardado:', progreso);

        } catch (e) {
            console.error("No se pudo guardar el progreso en localStorage.", e);
        }
    }

    // ===== FUNCIONES PARA DESARROLLO DE CUBOS =====
    function renderizarMisionDesarrolloCubos(data) {
        let ejerciciosHTML = '';
        
        data.ejercicios.forEach((ejercicio, index) => {
            ejerciciosHTML += `
                <div class="desarrollo-ejercicio" data-respuesta="${ejercicio.respuesta}">
                    <div class="desarrollo-instruccion">
                        <h4>📐 Ejercicio ${index + 1}</h4>
                        <p>${data.instruccion}</p>
                    </div>
                    
                    <div class="desarrollo-container">
                        <div class="plano-container">
                            <h5>🗺️ Plano del Cubo:</h5>
                            <div class="plano-svg">
                                ${ejercicio.plano_svg}
                            </div>
                        </div>
                        
                        <div class="opciones-cubos">
                            <h5>🎲 ¿Cuál cubo se puede armar?</h5>
                            <div class="opciones-grid">
                                ${ejercicio.opciones_svg.map((svg, optIndex) => `
                                    <div class="opcion-cubo" data-opcion="${optIndex}">
                                        <div class="cubo-svg">${svg}</div>
                                        <div class="opcion-numero">${optIndex + 1}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="resultado-desarrollo hidden">
                        <div class="explicacion-desarrollo"></div>
                    </div>
                </div>
            `;
        });
        
        return ejerciciosHTML;
    }

    function calificarMisionDesarrolloCubos(misionDiv, misionData) {
        let aciertos = 0;
        
        misionDiv.querySelectorAll('.desarrollo-ejercicio').forEach((ejercicioDiv, index) => {
            const respuestaCorrecta = parseInt(misionData.ejercicios[index].respuesta);
            const opcionSeleccionada = ejercicioDiv.querySelector('.opcion-cubo.seleccionada');
            
            ejercicioDiv.querySelectorAll('.opcion-cubo').forEach(opcion => {
                opcion.classList.remove('correcta', 'incorrecta');
            });
            
            if (opcionSeleccionada) {
                const opcionIndex = parseInt(opcionSeleccionada.dataset.opcion);
                
                if (opcionIndex === respuestaCorrecta) {
                    opcionSeleccionada.classList.add('correcta');
                    aciertos++;
                    mostrarExplicacionDesarrollo(ejercicioDiv, misionData.ejercicios[index].explicacion_correcta, 'correcta', '✅');
                } else {
                    opcionSeleccionada.classList.add('incorrecta');
                    mostrarExplicacionDesarrollo(ejercicioDiv, misionData.ejercicios[index].explicacion_incorrecta, 'incorrecta', '❌');
                }
            } else {
                mostrarMensajeDesarrollo(ejercicioDiv, '¡Selecciona una opción para continuar!', 'warning');
            }
        });
        
        return aciertos;
    }

    function calificarMisionBalanza(misionDiv, misionData) {
        let aciertos = 0;
        
        const balanzaDiv = misionDiv.querySelector('.balanza-ejercicio');
        const respuestaCorrecta = misionData.respuesta;
        const opcionSeleccionada = balanzaDiv.querySelector('input[name="balanza-respuesta"]:checked');
        
        if (opcionSeleccionada) {
            const respuestaUsuario = opcionSeleccionada.value;
            
            if (respuestaUsuario === respuestaCorrecta) {
                aciertos = 1;
                mostrarExplicacionBalanza(balanzaDiv, misionData.explicacion_correcta, 'correcta', '✅');
            } else {
                mostrarExplicacionBalanza(balanzaDiv, misionData.explicacion_incorrecta, 'incorrecta', '❌');
            }
        } else {
            mostrarMensajeBalanza(balanzaDiv, '¡Selecciona una opción para continuar!', 'warning');
        }
        
        return aciertos;
    }

    function mostrarExplicacionBalanza(balanzaDiv, texto, tipo, icono) {
        const resultadoDiv = balanzaDiv.querySelector('.resultado-balanza');
        const explicacionDiv = resultadoDiv.querySelector('.explicacion-balanza');
        
        explicacionDiv.innerHTML = `
            <div class="explicacion ${tipo}">
                <span class="icono">${icono}</span>
                <span class="texto">${texto}</span>
            </div>
        `;
        
        resultadoDiv.classList.remove('hidden');
    }

    function mostrarMensajeBalanza(balanzaDiv, texto, tipo) {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-balanza mensaje-${tipo}`;
        mensajeDiv.textContent = texto;
        
        balanzaDiv.appendChild(mensajeDiv);
        
        setTimeout(() => {
            mensajeDiv.remove();
        }, 3000);
    }

    function mostrarExplicacionDesarrollo(ejercicioDiv, texto, tipo, icono) {
        const resultadoDiv = ejercicioDiv.querySelector('.resultado-desarrollo');
        const explicacionDiv = resultadoDiv.querySelector('.explicacion-desarrollo');
        
        explicacionDiv.innerHTML = `
            <div class="explicacion ${tipo}">
                <span class="icono">${icono}</span>
                <span class="texto">${texto}</span>
            </div>
        `;
        
        resultadoDiv.classList.remove('hidden');
    }

    function mostrarMensajeDesarrollo(ejercicioDiv, texto, tipo) {
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje-desarrollo mensaje-${tipo}`;
        mensajeDiv.textContent = texto;
        
        ejercicioDiv.appendChild(mensajeDiv);
        
        setTimeout(() => {
            mensajeDiv.remove();
        }, 3000);
    }

    // ===== FUNCIONES PARA BALANZA LÓGICA =====
    function renderizarMisionBalanza(data) {
        return `
            <div class="balanza-ejercicio" data-respuesta="${data.respuesta}">
                <div class="balanza-instruccion">
                    <h4>⚖️ ${data.titulo}</h4>
                    <p>${data.instruccion}</p>
                </div>
                
                <div class="balanza-container">
                    <div class="balanza-svg">
                        ${data.pregunta_svg}
                    </div>
                    
                    <div class="balanza-opciones">
                        <h5>🤔 ¿Cuántos círculos (●) se necesitan para equilibrar un triángulo (▲)?</h5>
                        <div class="opciones-balanza">
                            ${data.opciones.map((opcion, index) => `
                                <label class="opcion-balanza">
                                    <input type="radio" name="balanza-respuesta" value="${opcion}">
                                    <span class="opcion-texto">${opcion}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="resultado-balanza hidden">
                    <div class="explicacion-balanza"></div>
                </div>
            </div>
        `;
    }

    function addDesarrolloCubosListeners(misionDiv) {
        misionDiv.querySelectorAll('.opcion-cubo').forEach(opcion => {
            opcion.addEventListener('click', function() {
                // Remover selección previa en este ejercicio
                const ejercicioDiv = this.closest('.desarrollo-ejercicio');
                ejercicioDiv.querySelectorAll('.opcion-cubo').forEach(opt => {
                    opt.classList.remove('seleccionada');
                });
                
                // Seleccionar esta opción
                this.classList.add('seleccionada');
                
                // Ocultar resultado previo si existe
                ejercicioDiv.querySelector('.resultado-desarrollo').classList.add('hidden');
            });
        });
    }

    // --- INICIALIZACIÓN ---
    const dia = getDiaAventura();
    cargarAventura(dia);
    completarBtn.addEventListener('click', completarAventura);
});
