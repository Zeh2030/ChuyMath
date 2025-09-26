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
                case 'geometria':
                    contenidoMision += renderizarMisionGeometria(misionData);
                    break;
                default:
                    contenidoMision += `<p>Tipo de misión "${misionData.tipo}" no reconocido.</p>`;
            }
            misionDiv.innerHTML = contenidoMision;
            misionesContainer.appendChild(misionDiv);
            
            // Agregar listeners para tablas después de renderizar
            if (misionData.tipo === 'tabla-doble-entrada') {
                setTimeout(() => {
                    addTableListeners(misionDiv);
                }, 100);
            }
        });
        
        // Add event listeners for interactive elements after they are in the DOM
        addGlobalEventListeners();
        
        aventuraFooter.classList.remove('hidden');
    }

    // --- FUNCIONES DE RENDERIZADO (solo las que no tienen archivo específico) ---

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
                case 'geometria': puntaje += calificarMisionGeometria(misionDiv, misionData); break;
            }
        });
        
        mensajeFinal.textContent = `¡Aventura terminada! Lograste ${puntaje} de ${totalPreguntas} aciertos. ¡Sigue así!`;
        completarBtn.style.display = 'none';
        if (navegacionFinal) navegacionFinal.classList.remove('hidden');
        guardarProgreso();
    });
    

    // --- EVENTOS DE INTERACCIÓN ---
    function addGlobalEventListeners() {
        misionesContainer.addEventListener('click', (e) => {
            const opcionCubo = e.target.closest('.cubo-opcion');
            
            if (opcionCubo) {
                const ejercicio = opcionCubo.closest('.cubo-ejercicio');
                ejercicio.querySelectorAll('.cubo-opcion').forEach(op => op.classList.remove('seleccionada'));
                opcionCubo.classList.add('seleccionada');
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
