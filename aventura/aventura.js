document.addEventListener('DOMContentLoaded', () => {
    const aventuraTitulo = document.getElementById('aventura-titulo');
    const misionesContainer = document.getElementById('misiones-container');
    const aventuraFooter = document.getElementById('aventura-footer');
    const completarBtn = document.getElementById('completar-aventura-btn');
    const mensajeFinal = document.getElementById('mensaje-final');
    const navegacionFinal = document.getElementById('navegacion-final');

    let aventuraData = null;
    const PROGRESO_KEY = 'progresoChuy';

    function getDiaAventura() {
        const params = new URLSearchParams(window.location.search);
        return params.get('dia');
    }

    async function cargarAventura(dia) {
        try {
            if (!dia) throw new Error('No se especificó el día de la aventura.');
            
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) throw new Error(`No se pudo cargar el archivo de la aventura del día ${dia}.`);
            
            aventuraData = await response.json();
            renderizarAventura();
            
        } catch (error) {
            console.error('Error al cargar la aventura:', error);
            misionesContainer.innerHTML = `<div class="error-mensaje"><h2>¡Ups! Algo salió mal</h2><p>No se pudo cargar la aventura. Error: ${error.message}</p><a href="../dashboard/dashboard.html" class="back-button">Volver al Centro de Mando</a></div>`;
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
            if (misionData.instruccion) {
                contenidoMision += `<p class="mision-instruccion">${misionData.instruccion}</p>`;
            }
            
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
                case 'tabla-doble-entrada':
                    contenidoMision += renderizarMisionTabla(misionData);
                    break;
                case 'criptoaritmetica':
                    contenidoMision += renderizarMisionCripto(misionData);
                    break;
                case 'desarrollo-cubos':
                    contenidoMision += renderizarMisionCubo(misionData);
                    break;
                case 'balanza-logica':
                    contenidoMision += renderizarMisionBalanza(misionData);
                    break;
                case 'palabra-del-dia':
                    contenidoMision += renderizarPalabraDelDia(misionData);
                    break;
                default:
                    contenidoMision += `<p>Tipo de misión "${misionData.tipo}" no reconocido.</p>`;
            }
            misionDiv.innerHTML = contenidoMision;
            misionesContainer.appendChild(misionDiv);
        });
        
        // Add event listeners for interactive elements after they are in the DOM
        addGlobalEventListeners();
        aventuraFooter.classList.remove('hidden');
    }

    // --- FUNCIONES DE RENDERIZADO ---

    function renderizarMisionOperaciones(data) {
        let gridHTML = '<div class="operaciones-grid">';
        data.ejercicios.forEach((ej, index) => {
            gridHTML += `<div class="ejercicio" data-respuesta="${ej.respuesta}"><p>${ej.pregunta} =</p><input type="number" inputmode="numeric" id="op-${index}"></div>`;
        });
        return gridHTML + '</div>';
    }

    function renderizarMisionOpcionMultiple(data) {
        let opcionesHTML = '<ul class="opciones-lista">';
        data.opciones.forEach((opcion, index) => {
            const idUnico = `om-${data.id}-${index}`;
            opcionesHTML += `<li><input type="radio" name="opcion-multiple-${data.id}" id="${idUnico}" value="${opcion}"><label for="${idUnico}">${opcion}</label></li>`;
        });
        opcionesHTML += '</ul>';
        return `<p class="opcion-multiple-pregunta">${data.pregunta}</p>${data.imagen ? `<img src="${data.imagen}" alt="Imagen de la misión" class="opcion-multiple-imagen">` : ''}${opcionesHTML}`;
    }

    function renderizarMisionDibujo(data) {
        return `<p class="numberblocks-instruccion">${data.instruccion}</p><div class="canvas-placeholder">El lienzo de dibujo aparecerá aquí.</div>`;
    }

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

    function renderizarMisionConteo(data) {
        let ejerciciosHTML = '';
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

    function renderizarMisionTabla(data) {
        // Verificar si es el formato antiguo (con encabezados_fila y encabezados_columna)
        if (data.encabezados_fila && data.encabezados_columna) {
            // Formato antiguo con pregunta final - las propiedades están directamente en data
            let opcionesFinalHTML = '<ul class="opciones-lista">';
            data.opciones_finales.forEach((opcion, optIndex) => {
                const idUnico = `tabla-${data.id}-${optIndex}`;
                opcionesFinalHTML += `<li><input type="radio" name="tabla-final-${data.id}" id="${idUnico}" value="${opcion}"><label for="${idUnico}">${opcion}</label></li>`;
            });
            opcionesFinalHTML += '</ul>';
            
            return `
                <div class="tabla-logica">
                    <h3>${data.titulo}</h3>
                    <p>${data.instruccion}</p>
                    ${data.pistas ? `<ul class="pistas-lista">${data.pistas.map(pista => `<li>${pista}</li>`).join('')}</ul>` : ''}
                    <table>
                        <thead>
                            <tr>
                                <th></th>
                                ${data.encabezados_columna.map(opcion => `<th>${opcion}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.encabezados_fila.map(personaje => `
                                <tr>
                                    <td><strong>${personaje}</strong></td>
                                    ${data.encabezados_columna.map(opcion => `<td class="celda-logica" data-personaje="${personaje}" data-opcion="${opcion}"></td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p class="pregunta-final">${data.pregunta_final}</p>
                    ${opcionesFinalHTML}
                    <div class="feedback-container"></div>
                </div>
            `;
        } else {
            // Formato nuevo con ejercicios array
            let tablaHTML = '';
            data.ejercicios.forEach((ej, index) => {
                tablaHTML += `
                    <div class="tabla-logica">
                        <h3>${ej.titulo}</h3>
                        <p>${ej.instruccion}</p>
                        ${ej.pistas ? `<ul class="pistas-lista">${ej.pistas.map(pista => `<li>${pista}</li>`).join('')}</ul>` : ''}
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    ${ej.opciones.map(opcion => `<th>${opcion}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${ej.personajes.map(personaje => `
                                    <tr>
                                        <td><strong>${personaje}</strong></td>
                                        ${ej.opciones.map(opcion => `<td class="celda-logica" data-personaje="${personaje}" data-opcion="${opcion}"></td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="feedback-container"></div>
                    </div>
                `;
            });
            return tablaHTML;
        }
    }

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

    function renderizarMisionCubo(data) {
        let ejerciciosHTML = '';
        data.ejercicios.forEach((ej) => {
            const opcionesHTML = ej.opciones_svg.map((opcion_svg, optIndex) => 
                `<div class="cubo-opcion" data-opcion-index="${optIndex}">${opcion_svg}</div>`
            ).join('');
            ejerciciosHTML += `
                <div class="cubo-ejercicio" id="${ej.id}" data-respuesta="${ej.respuesta}">
                    <div class="cubo-plano">${ej.plano_svg}</div>
                    <div class="cubo-opciones-container">${opcionesHTML}</div>
                    <div class="feedback-container"></div>
                </div>
            `;
        });
        return ejerciciosHTML;
    }

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

    function renderizarPalabraDelDia(data) {
        return `
            <div class="palabra-container">
                <div class="palabra-ingles">
                    <span class="palabra-texto">${data.palabra_en}</span>
                    <button class="boton-audio" onclick="document.getElementById('audio-${data.id}').play()">🔊</button>
                    <audio id="audio-${data.id}" src="${data.audio_pronunciacion}"></audio>
                </div>
                <div class="palabra-icono">${data.icono}</div>
                <div class="palabra-espanol">${data.palabra_es}</div>
            </div>
        `;
    }

    // --- LÓGICA DE CALIFICACIÓN ---

    completarBtn.addEventListener('click', () => {
        let puntaje = 0;
        let totalPreguntas = 0;

        document.querySelectorAll('.mision').forEach(misionDiv => {
            const misionData = JSON.parse(misionDiv.dataset.info);
            
            // Ajuste para que la palabra del día no cuente como pregunta evaluable
            if (misionData.tipo !== 'palabra-del-dia') {
                if (misionData.tipo === 'tabla-doble-entrada' && misionData.encabezados_fila && misionData.encabezados_columna) {
                    // Formato antiguo: solo cuenta como 1 pregunta
                    totalPreguntas += 1;
                } else {
                    // Formato nuevo: cuenta ejercicios
                    const ejercicios = misionData.ejercicios || [misionData];
                    totalPreguntas += ejercicios.length;
                }
            }
            
            switch (misionData.tipo) {
                case 'operaciones': puntaje += calificarMisionOperaciones(misionDiv, misionData); break;
                case 'opcion-multiple': puntaje += calificarMisionOpcionMultiple(misionDiv, misionData); break;
                case 'numberblocks-dibujo': puntaje++; break; // Auto-pass
                case 'secuencia': puntaje += calificarMisionSecuencia(misionDiv, misionData); break;
                case 'conteo-figuras': puntaje += calificarMisionConteo(misionDiv, misionData); break;
                case 'tabla-doble-entrada': puntaje += calificarMisionTabla(misionDiv, misionData); break;
                case 'criptoaritmetica': puntaje += calificarMisionCripto(misionDiv, misionData); break;
                case 'desarrollo-cubos': puntaje += calificarMisionCubo(misionDiv, misionData); break;
                case 'balanza-logica': puntaje += calificarMisionBalanza(misionDiv, misionData); break;
                case 'palabra-del-dia': 
                    // No suma puntaje pero podría marcarse como vista
                    break;
            }
        });
        
        mensajeFinal.textContent = `¡Aventura terminada! Lograste ${puntaje} de ${totalPreguntas} aciertos. ¡Sigue así!`;
        completarBtn.style.display = 'none';
        if (navegacionFinal) navegacionFinal.classList.remove('hidden');
        guardarProgreso();
    });
    
    function calificarMisionOperaciones(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.ejercicio').forEach((ejDiv, index) => {
            const input = ejDiv.querySelector('input');
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

    function calificarMisionOpcionMultiple(misionDiv, misionData) {
        const selectedOption = document.querySelector(`input[name="opcion-multiple-${misionData.id}"]:checked`);
        if (!selectedOption) return 0;
        
        const esCorrecto = selectedOption.value === misionData.respuesta;
        const label = selectedOption.nextElementSibling;
        label.classList.toggle('correcto', esCorrecto);
        label.classList.toggle('incorrecto', !esCorrecto);
        
        return esCorrecto ? 1 : 0;
    }

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

    function calificarMisionConteo(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.conteo-ejercicio').forEach((ejDiv, index) => {
            const input = ejDiv.querySelector('input');
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

    function calificarMisionTabla(misionDiv, misionData) {
        let aciertos = 0;
        
        // Verificar si es formato antiguo con pregunta final
        if (misionData.encabezados_fila && misionData.encabezados_columna) {
            // Formato antiguo: solo calificar la pregunta final
            const tablaDiv = misionDiv.querySelector('.tabla-logica');
            const selectedOption = tablaDiv.querySelector(`input[name="tabla-final-${misionData.id}"]:checked`);
            if (selectedOption) {
                const esCorrecto = selectedOption.value === misionData.respuesta_final;
                const label = selectedOption.nextElementSibling;
                label.classList.toggle('correcto', esCorrecto);
                label.classList.toggle('incorrecto', !esCorrecto);
                
                const explicacion = esCorrecto ? misionData.explicacion_correcta : misionData.explicacion_incorrecta;
                mostrarFeedback(tablaDiv.querySelector('.feedback-container'), explicacion, esCorrecto ? 'correcto' : 'incorrecto');
                
                if (esCorrecto) aciertos++;
            }
        } else {
            // Formato nuevo: verificar cada celda
            misionDiv.querySelectorAll('.tabla-logica').forEach((tablaDiv, index) => {
                const ejercicio = misionData.ejercicios[index];
                const solucion = ejercicio.respuesta_final;
                let esCorrecto = true;
                
                Object.entries(solucion).forEach(([personaje, opcion]) => {
                    const celda = tablaDiv.querySelector(`[data-personaje="${personaje}"][data-opcion="${opcion}"]`);
                    if (celda && !celda.classList.contains('si')) {
                        esCorrecto = false;
                    }
                });
                
                if (esCorrecto) aciertos++;
            });
        }
        return aciertos;
    }

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

    function calificarMisionCubo(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.cubo-ejercicio').forEach((ejDiv, index) => {
            const respuestaCorrecta = parseInt(misionData.ejercicios[index].respuesta);
            const seleccionada = ejDiv.querySelector('.cubo-opcion.seleccionada');
            
            if (seleccionada) {
                const seleccionIndex = parseInt(seleccionada.dataset.opcionIndex);
                const esCorrecto = seleccionIndex === respuestaCorrecta;
                
                seleccionada.classList.toggle('correcto', esCorrecto);
                seleccionada.classList.toggle('incorrecto', !esCorrecto);
                
                const explicacion = esCorrecto ? 
                    misionData.ejercicios[index].explicacion_correcta : 
                    misionData.ejercicios[index].explicacion_incorrecta;
                mostrarFeedback(ejDiv.querySelector('.feedback-container'), explicacion, esCorrecto ? 'correcto' : 'incorrecto');
                
                if (esCorrecto) aciertos++;
            }
        });
        return aciertos;
    }

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

    
    function mostrarFeedback(container, texto, tipo) {
        if (container) container.innerHTML = `<div class="feedback-box ${tipo}">${texto}</div>`;
    }

    // --- EVENTOS DE INTERACCIÓN ---
    function addGlobalEventListeners() {
        misionesContainer.addEventListener('click', (e) => {
            const opcionCubo = e.target.closest('.cubo-opcion');
            const celdaLogica = e.target.closest('.celda-logica');
            
            if (opcionCubo) {
                const ejercicio = opcionCubo.closest('.cubo-ejercicio');
                ejercicio.querySelectorAll('.cubo-opcion').forEach(op => op.classList.remove('seleccionada'));
                opcionCubo.classList.add('seleccionada');
            }

            if (celdaLogica) {
                const estados = ['', '✅', '❌'];
                const clases = ['', 'si', 'no'];
                let indiceActual = estados.indexOf(celdaLogica.textContent);
                let nuevoIndice = (indiceActual + 1) % estados.length;
                celdaLogica.textContent = estados[nuevoIndice];
                celdaLogica.className = 'celda-logica'; // Reset
                if (clases[nuevoIndice]) celdaLogica.classList.add(clases[nuevoIndice]);
            }
        });
    }
    
    // --- GUARDAR PROGRESO ---
    function guardarProgreso() {
        const progresoActual = JSON.parse(localStorage.getItem(PROGRESO_KEY) || '{}');
        const hoy = new Date().toISOString().split('T')[0];
        
        if (!progresoActual.aventurasCompletadas) {
            progresoActual.aventurasCompletadas = [];
        }
        
        if (!progresoActual.aventurasCompletadas.includes(aventuraData.id)) {
            progresoActual.aventurasCompletadas.push(aventuraData.id);
        }
        
        progresoActual.ultimaAventura = aventuraData.id;
        progresoActual.ultimaFecha = hoy;
        
        localStorage.setItem(PROGRESO_KEY, JSON.stringify(progresoActual));
    }

    // --- INICIALIZACIÓN ---
    const dia = getDiaAventura();
    cargarAventura(dia);
});

// Función global para el audio (moved outside DOMContentLoaded for global access)
function playAudio(url) {
    const audio = new Audio(url);
    audio.play().catch(e => console.log('No se pudo reproducir el audio:', e));
}
