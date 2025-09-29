function renderizarMisionNavegacionMapa(data) {
    const config = data.configuracion_mapa;
    if (!config) return '<p class="error">Error: No se encontró la configuración del mapa.</p>';

    // Reiniciar estado para la misión
    posicionActual = { ...config.punto_inicio };
    historialMovimientos = [posicionActual];

    let celdasHTML = '';
    const totalCeldas = config.filas * config.columnas;

    for (let i = 0; i < totalCeldas; i++) {
        celdasHTML += `<div class="mapa-celda" id="celda-${i}"></div>`;
    }

    // Crear el contenedor del mapa
    const mapaHTML = `
        <div class="mapa-wrapper">
            <div class="mapa-container" style="grid-template-columns: repeat(${config.columnas}, 40px);">
                ${celdasHTML}
            </div>
            <div class="controles-mapa">
                <p>Haz clic en los botones para moverte por el mapa:</p>
                <div class="botones-direccion">
                    <button class="control-btn" data-direccion="norte">Norte ↑</button>
                    <button class="control-btn" data-direccion="sur">Sur ↓</button>
                    <button class="control-btn" data-direccion="este">Este →</button>
                    <button class="control-btn" data-direccion="oeste">← Oeste</button>
                    <button id="reset-mapa-btn" class="control-btn reset">Reiniciar</button>
                </div>
            </div>
            <div id="resultado-mapa" class="resultado-mapa"></div>
        </div>
    `;
    
    // Usamos un pequeño delay para asegurarnos de que el HTML está en el DOM
    setTimeout(() => {
        colocarIconosEnMapa(config);
        addMapaEventListeners(data); // Añadir listeners después de renderizar
    }, 0);

    return mapaHTML;
}

function colocarIconosEnMapa(config) {
    // Colocar punto de inicio
    const inicioIndex = (config.punto_inicio.fila * config.columnas) + config.punto_inicio.columna;
    const celdaInicio = document.getElementById(`celda-${inicioIndex}`);
    if (celdaInicio) {
        celdaInicio.innerHTML = `<span class="mapa-icono">${config.punto_inicio.icono}</span>`;
        celdaInicio.classList.add('inicio');
    }

    // Colocar puntos de interés
    config.puntos_interes.forEach(punto => {
        const puntoIndex = (punto.fila * config.columnas) + punto.columna;
        const celdaPunto = document.getElementById(`celda-${puntoIndex}`);
        if (celdaPunto) {
            celdaPunto.innerHTML = `<span class="mapa-icono" title="${punto.nombre}">${punto.icono}</span>`;
            celdaPunto.dataset.nombre = punto.nombre;
        }
    });
}

function addMapaEventListeners(data) {
    const config = data.configuracion_mapa;

    document.querySelectorAll('.control-btn[data-direccion]').forEach(btn => {
        btn.addEventListener('click', () => moverPersonaje(btn.dataset.direccion, config));
    });

    document.getElementById('reset-mapa-btn').addEventListener('click', () => {
        // Esto requiere volver a renderizar la misión. Por ahora, recargamos.
        // Una mejor implementación futura podría reiniciar el estado sin recargar.
        renderizarMisionNavegacionMapa(data); 
        // Para que funcione bien, necesitaríamos re-renderizar solo el mapa.
        // Por simplicidad momentánea, el usuario puede reintentar.
        const misionCard = document.querySelector('.problema-card'); // Asumiendo que es la única misión de mapa visible
        misionCard.querySelector('.ejercicio-container').innerHTML = renderizarMisionNavegacionMapa(data);
    });
}

function moverPersonaje(direccion, config) {
    const nuevaPosicion = { ...posicionActual };

    switch (direccion) {
        case 'norte':
            if (nuevaPosicion.fila > 0) nuevaPosicion.fila--;
            break;
        case 'sur':
            if (nuevaPosicion.fila < config.filas - 1) nuevaPosicion.fila++;
            break;
        case 'este':
            if (nuevaPosicion.columna < config.columnas - 1) nuevaPosicion.columna++;
            break;
        case 'oeste':
            if (nuevaPosicion.columna > 0) nuevaPosicion.columna--;
            break;
    }

    // Actualizar la posición y el historial
    posicionActual = nuevaPosicion;
    historialMovimientos.push(posicionActual);
    
    actualizarVistaMapa(config);
    verificarLlegada(config);
}

function actualizarVistaMapa(config) {
    // Limpiar celdas de camino anteriores
    document.querySelectorAll('.mapa-celda.camino').forEach(c => c.classList.remove('camino'));

    // Dibujar nuevo camino
    historialMovimientos.forEach(pos => {
        const index = (pos.fila * config.columnas) + pos.columna;
        const celda = document.getElementById(`celda-${index}`);
        if (celda && !celda.classList.contains('inicio')) {
            celda.classList.add('camino');
        }
    });

    // Marcar la posición actual
    document.querySelectorAll('.mapa-celda.actual').forEach(c => c.classList.remove('actual'));
    const actualIndex = (posicionActual.fila * config.columnas) + posicionActual.columna;
    const celdaActual = document.getElementById(`celda-${actualIndex}`);
    if(celdaActual) {
        celdaActual.classList.add('actual');
    }
}

function verificarLlegada(config) {
    const resultadoDiv = document.getElementById('resultado-mapa');
    const puntoLlegada = config.puntos_interes.find(
        p => p.fila === posicionActual.fila && p.columna === posicionActual.columna
    );

    if (puntoLlegada) {
        resultadoDiv.innerHTML = `Llegaste a: <strong>${puntoLlegada.nombre}</strong>`;
        resultadoDiv.dataset.lugarLlegada = puntoLlegada.nombre;
    } else {
        resultadoDiv.innerHTML = '';
        resultadoDiv.dataset.lugarLlegada = '';
    }
}

function calificarMisionNavegacionMapa(index, data) {
    const config = data.configuracion_mapa;
    const resultadoDiv = document.getElementById('resultado-mapa');
    const lugarLlegada = resultadoDiv.dataset.lugarLlegada;

    // Simplificado: por ahora solo verificamos el destino final.
    // Una calificación más compleja podría verificar toda la ruta.
    const movimientosSimulados = simularMovimientos(config.punto_inicio, config.movimientos, config);
    const destinoFinal = config.puntos_interes.find(
        p => p.fila === movimientosSimulados.fila && p.columna === movimientosSimulados.columna
    );

    if (destinoFinal && lugarLlegada === destinoFinal.nombre && lugarLlegada === config.respuesta_correcta) {
        return 1;
    }
    
    return 0;
}

function simularMovimientos(inicio, movimientos, config) {
    let pos = { ...inicio };
    movimientos.forEach(mov => {
        switch (mov) {
            case 'norte': if (pos.fila > 0) pos.fila--; break;
            case 'sur': if (pos.fila < config.filas - 1) pos.fila++; break;
            case 'este': if (pos.columna < config.columnas - 1) pos.columna++; break;
            case 'oeste': if (pos.columna > 0) pos.columna--; break;
        }
    });
    return pos;
}
