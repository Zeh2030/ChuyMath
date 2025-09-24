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
            if (!dia) throw new Error('No se especificó el día de la aventura');
            
            const response = await fetch(`../_contenido/${dia}.json`);
            if (!response.ok) throw new Error(`No se pudo cargar la aventura del día ${dia}`);
            
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

            let contenidoMision = `<h2>${misionData.titulo}</h2><p class="mision-instruccion">${misionData.instruccion}</p>`;
            
            // Switch para renderizar cada tipo de misión
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
                default:
                    contenidoMision += `<p>Tipo de misión no reconocido.</p>`;
            }
            misionDiv.innerHTML = contenidoMision;
            misionesContainer.appendChild(misionDiv);
        });
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
            opcionesHTML += `<li><input type="radio" name="opcion-multiple-${data.id}" id="om-${data.id}-${index}" value="${opcion}"><label for="${opcion.id}">${opcion}</label></li>`;
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
            const elementosHTML = ej.elementos.map(el => 
                el === '?' ? `<span class="placeholder">?</span>` : `<span class="elemento">${el}</span>`
            ).join('');

            let respuestaHTML = '';
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
        let tablaHTML = '<div class="tabla-container">';
        tablaHTML += `<h4>${data.titulo}</h4>`;
        tablaHTML += `<p class="tabla-instruccion">${data.instruccion}</p>`;
        
        // Crear la tabla
        tablaHTML += '<table class="tabla-doble-entrada">';
        
        // Encabezados
        tablaHTML += '<thead><tr><th></th>';
        data.columnas.forEach(col => {
            tablaHTML += `<th>${col}</th>`;
        });
        tablaHTML += '</tr></thead>';
        
        // Filas
        tablaHTML += '<tbody>';
        data.filas.forEach((fila, index) => {
            tablaHTML += `<tr><th>${fila}</th>`;
            data.columnas.forEach((col, colIndex) => {
                const id = `tabla-${index}-${colIndex}`;
                tablaHTML += `<td><input type="text" id="${id}" data-fila="${fila}" data-columna="${col}"></td>`;
            });
            tablaHTML += '</tr>';
        });
        tablaHTML += '</tbody></table>';
        
        // Pistas
        if (data.pistas && data.pistas.length > 0) {
            tablaHTML += '<div class="tabla-pistas"><h5>💡 Pistas:</h5><ul>';
            data.pistas.forEach(pista => {
                tablaHTML += `<li>${pista}</li>`;
            });
            tablaHTML += '</ul></div>';
        }
        
        tablaHTML += '</div>';
        return tablaHTML;
    }

    function renderizarMisionCripto(data) {
        let criptoHTML = '<div class="cripto-container">';
        criptoHTML += `<h4>${data.titulo}</h4>`;
        criptoHTML += `<p class="cripto-instruccion">${data.instruccion}</p>`;
        
        // Mostrar la operación
        criptoHTML += `<div class="cripto-operacion">${data.operacion.visualizacion}</div>`;
        
        // Inputs para cada letra
        criptoHTML += '<div class="cripto-inputs">';
        data.letras.forEach(letra => {
            criptoHTML += `
                <div class="cripto-input-group">
                    <label>${letra}:</label>
                    <input type="number" min="0" max="9" class="cripto-input" data-letra="${letra}">
                </div>
            `;
        });
        criptoHTML += '</div>';
        
        // Botón de verificar
        criptoHTML += '<button class="cripto-verificar">Verificar</button>';
        
        // Área de resultados
        criptoHTML += '<div class="cripto-resultado"></div>';
        
        criptoHTML += '</div>';
        return criptoHTML;
    }

    // --- NUEVAS FUNCIONES DE RENDERIZADO MEJORADAS ---

    function renderizarMisionCubo(data) {
        let ejerciciosHTML = '';
        data.ejercicios.forEach((ej, index) => {
            const opcionesHTML = ej.opciones_svg.map((opcion_svg, optIndex) => `
                <div class="cubo-opcion" data-opcion-index="${optIndex}">
                    <div class="cubo-svg">${opcion_svg}</div>
                </div>
            `).join('');

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
        const opcionesHTML = data.opciones.map((opcion, index) => `
            <li>
                <input type="radio" name="balanza-${data.id}" id="balanza-${data.id}-${index}" value="${opcion}">
                <label for="balanza-${data.id}-${index}">${opcion}</label>
            </li>
        `).join('');

        return `
            <div class="balanza-ejercicio" data-respuesta="${data.respuesta}">
                <div class="balanza-pregunta-svg">${data.pregunta_svg}</div>
                <ul class="opciones-lista balanza-opciones">${opcionesHTML}</ul>
                <div class="feedback-container"></div>
            </div>
        `;
    }
    
    // --- LÓGICA DE CALIFICACIÓN ---

    function completarAventura() {
        let puntaje = 0;
        let totalPreguntas = 0;

        document.querySelectorAll('.mision').forEach(misionDiv => {
            const misionData = JSON.parse(misionDiv.dataset.info);
            
            // Contar preguntas
            if (misionData.ejercicios) {
                totalPreguntas += misionData.ejercicios.length;
            } else {
                totalPreguntas++;
            }

            // Calificar según el tipo
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
                case 'tabla-doble-entrada':
                    puntaje += calificarMisionTabla(misionDiv, misionData);
                    break;
                case 'criptoaritmetica':
                    puntaje += calificarMisionCripto(misionDiv, misionData);
                    break;
                case 'desarrollo-cubos':
                    puntaje += calificarMisionCubo(misionDiv, misionData);
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
        if (navegacionFinal) navegacionFinal.classList.remove('hidden');
        guardarProgreso();
    }

    // --- FUNCIONES DE CALIFICACIÓN ---

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
        const selectedOption = misionDiv.querySelector('input[type="radio"]:checked');
        return selectedOption && selectedOption.value === misionData.respuesta;
    }

    function calificarMisionSecuencia(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.secuencia-ejercicio').forEach((ejDiv, index) => {
            const respuestaCorrecta = misionData.ejercicios[index].respuesta;
            const selectedOption = ejDiv.querySelector('input[type="radio"]:checked');
            const textInput = ejDiv.querySelector('input[type="text"]');
            
            let esCorrecto = false;
            if (selectedOption) {
                esCorrecto = selectedOption.value === respuestaCorrecta;
            } else if (textInput) {
                esCorrecto = textInput.value.trim().toLowerCase() === respuestaCorrecta.toLowerCase();
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
        const inputs = misionDiv.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            const fila = input.dataset.fila;
            const columna = input.dataset.columna;
            const valor = input.value.trim().toLowerCase();
            
            // Buscar la respuesta correcta
            const respuestaCorrecta = misionData.respuesta_final.find(r => 
                r.fila.toLowerCase() === fila.toLowerCase() && 
                r.columna.toLowerCase() === columna.toLowerCase()
            );
            
            if (respuestaCorrecta && valor === respuestaCorrecta.valor.toLowerCase()) {
                input.classList.add('correct');
                aciertos++;
            } else {
                input.classList.add('incorrect');
            }
        });
        return aciertos;
    }

    function calificarMisionCripto(misionDiv, misionData) {
        let aciertos = 0;
        const inputs = misionDiv.querySelectorAll('.cripto-input');
        let valores = {};
        
        inputs.forEach(input => {
            valores[input.dataset.letra] = input.value;
        });
        
        // Verificar si la operación es correcta
        const operacion = misionData.operacion;
        const resultado = operacion.resultado;
        
        // Reemplazar letras por valores
        let operacionEvaluada = operacion.visualizacion;
        Object.keys(valores).forEach(letra => {
            operacionEvaluada = operacionEvaluada.replace(new RegExp(letra, 'g'), valores[letra]);
        });
        
        // Evaluar la operación
        try {
            const resultadoCalculado = eval(operacionEvaluada.replace('=', ''));
            if (resultadoCalculado == resultado) {
                aciertos = 1;
                misionDiv.querySelector('.cripto-resultado').innerHTML = 
                    `<div class="feedback-box correcto">${data.explicacion_correcta}</div>`;
            } else {
                misionDiv.querySelector('.cripto-resultado').innerHTML = 
                    `<div class="feedback-box incorrecto">${data.explicacion_incorrecta}</div>`;
            }
        } catch (e) {
            misionDiv.querySelector('.cripto-resultado').innerHTML = 
                `<div class="feedback-box incorrecto">Error en la operación</div>`;
        }
        
        return aciertos;
    }

    // --- NUEVAS FUNCIONES DE CALIFICACIÓN MEJORADAS ---

    function calificarMisionCubo(misionDiv, misionData) {
        let aciertos = 0;
        misionDiv.querySelectorAll('.cubo-ejercicio').forEach((ejDiv, index) => {
            const respuestaCorrecta = parseInt(ejDiv.dataset.respuesta);
            const opcionSeleccionada = ejDiv.querySelector('.cubo-opcion.seleccionada');
            const feedbackContainer = ejDiv.querySelector('.feedback-container');
            
            ejDiv.querySelectorAll('.cubo-opcion').forEach(op => op.classList.remove('correcto', 'incorrecto'));
            feedbackContainer.innerHTML = '';

            if (opcionSeleccionada) {
                const respuestaUsuario = parseInt(opcionSeleccionada.dataset.opcionIndex);
                const ejercicioData = misionData.ejercicios[index];

                if (respuestaUsuario === respuestaCorrecta) {
                    opcionSeleccionada.classList.add('correcto');
                    aciertos++;
                    mostrarFeedback(feedbackContainer, ejercicioData.explicacion_correcta, 'correcto');
                } else {
                    opcionSeleccionada.classList.add('incorrecto');
                    // Resaltar también la correcta
                    ejDiv.querySelector(`[data-opcion-index="${respuestaCorrecta}"]`).classList.add('correcto');
                    mostrarFeedback(feedbackContainer, ejercicioData.explicacion_incorrecta, 'incorrecto');
                }
            }
        });
        return aciertos;
    }

    function calificarMisionBalanza(misionDiv, misionData) {
        const opcionSeleccionada = misionDiv.querySelector('input[type="radio"]:checked');
        const feedbackContainer = misionDiv.querySelector('.feedback-container');
        
        feedbackContainer.innerHTML = '';
        misionDiv.querySelectorAll('label').forEach(l => l.classList.remove('correcto', 'incorrecto'));

        if (opcionSeleccionada) {
            const esCorrecto = opcionSeleccionada.value === misionData.respuesta;
            const label = opcionSeleccionada.nextElementSibling;

            if (esCorrecto) {
                label.classList.add('correcto');
                mostrarFeedback(feedbackContainer, misionData.explicacion_correcta, 'correcto');
                return 1; // 1 acierto
            } else {
                label.classList.add('incorrecto');
                // Resaltar la correcta
                const correctaLabel = misionDiv.querySelector(`input[value="${misionData.respuesta}"]`).nextElementSibling;
                correctaLabel.classList.add('correcto');
                mostrarFeedback(feedbackContainer, misionData.explicacion_incorrecta, 'incorrecto');
            }
        }
        return 0; // 0 aciertos
    }
    
    function mostrarFeedback(container, texto, tipo) {
        container.innerHTML = `<div class="feedback-box ${tipo}">${texto}</div>`;
    }

    function guardarProgreso() {
        const progreso = JSON.parse(localStorage.getItem(PROGRESO_KEY) || '{"misionesCompletadas": [], "ultimaVisita": null, "racha": 0}');
        const dia = getDiaAventura();
        
        if (!progreso.misionesCompletadas.includes(dia)) {
            progreso.misionesCompletadas.push(dia);
        }
        
        progreso.ultimaVisita = new Date().toISOString();
        progreso.racha = progreso.misionesCompletadas.length;
        
        localStorage.setItem(PROGRESO_KEY, JSON.stringify(progreso));
    }

    // --- EVENTOS DE INTERACCIÓN ---
    misionesContainer.addEventListener('click', (e) => {
        // Lógica para seleccionar opciones de cubos
        const opcionCubo = e.target.closest('.cubo-opcion');
        if (opcionCubo) {
            const ejercicio = opcionCubo.closest('.cubo-ejercicio');
            ejercicio.querySelectorAll('.cubo-opcion').forEach(op => op.classList.remove('seleccionada'));
            opcionCubo.classList.add('seleccionada');
        }
    });

    // --- INICIALIZACIÓN ---
    const dia = getDiaAventura();
    cargarAventura(dia);
    completarBtn.addEventListener('click', completarAventura);
});
