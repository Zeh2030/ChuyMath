document.addEventListener('DOMContentLoaded', () => {
    const simuladorTitulo = document.getElementById('simulador-titulo');
    const problemasContainer = document.getElementById('problemas-container');
    const calificarBtn = document.getElementById('calificar-examen-btn');

    let examenData = null;

    function getExamenId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('examen');
    }

    async function cargarExamen(id) {
        try {
            if (!id) throw new Error('No se especificó un ID de examen.');
            
            const response = await fetch(`../../_contenido/${id}.json`);
            if (!response.ok) throw new Error(`No se pudo cargar el archivo del examen: ${id}.json`);
            
            examenData = await response.json();
            renderizarExamen();

        } catch (error) {
            console.error('Error al cargar el examen:', error);
            problemasContainer.innerHTML = `<p class="error">No se pudo cargar el simulacro. Por favor, intenta de nuevo.</p>`;
            simuladorTitulo.textContent = 'Error';
        }
    }

    function renderizarExamen() {
        if (!examenData) return;

        simuladorTitulo.textContent = examenData.titulo;
        problemasContainer.innerHTML = '';

        examenData.problemas.forEach((problema, index) => {
            const problemaDiv = document.createElement('div');
            // Usar 'mision-card' para consistencia de estilos con 'aventura'
            problemaDiv.className = 'mision-card'; 
            problemaDiv.id = `mision-${index}`;

            // Crear la misma estructura que en aventura.js
            const contenido = `
                <div class="mision-header">
                    <h3>Problema ${index + 1}</h3>
                </div>
                <div class="mision-content">
                    <div class="instrucciones">
                        <p>${problema.pregunta}</p>
                    </div>
                    <div class="ejercicio-container">
                        <!-- El contenido renderizado irá aquí -->
                    </div>
                </div>
            `;
            
            problemaDiv.innerHTML = contenido;
            
            // Renderizar el contenido específico del tipo de misión en el contenedor correcto
            const ejercicioContainer = problemaDiv.querySelector('.ejercicio-container');
            
            let renderFunctionName = `renderizarMision${capitalizeTipo(problema.tipo)}`;
            // Excepción para el simulador, usamos el módulo específico
            if (problema.tipo === 'opcion-multiple') {
                renderFunctionName = 'renderizarMisionOpcionMultipleSimulador';
            }
            
            console.log(`Buscando función: ${renderFunctionName} para tipo: ${problema.tipo}`);
            
            if (typeof window[renderFunctionName] === 'function') {
                ejercicioContainer.innerHTML = window[renderFunctionName](problema);
            } else {
                 ejercicioContainer.innerHTML = `<p class="error">Error: No se encontró la función de renderizado para el tipo "${problema.tipo}". Función buscada: ${renderFunctionName}</p>`;
            }

            problemasContainer.appendChild(problemaDiv);
        });
    }

    function capitalizeTipo(tipo) {
        // Convierte "navegacion-mapa" a "NavegacionMapa", "opcion-multiple" a "OpcionMultiple"
        return tipo.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    }

    function renderizarOpciones(problema, index) {
        // Esta función ahora es un legacy que será reemplazado por los renderizadores específicos.
        // La mantendremos por si algún JSON antiguo la necesita, pero la lógica principal
        // usará los renderizadores dinámicos.
        // La función renderizarMisionOpcionMultiple se encargará de esto.
        return '';
    }

    function calificarExamen() {
        if (!examenData) return;

        let puntaje = 0;
        examenData.problemas.forEach((problema, index) => {
            let calificarFunctionName = `calificarMision${capitalizeTipo(problema.tipo)}`;
            // Excepción para el simulador
            if (problema.tipo === 'opcion-multiple') {
                calificarFunctionName = 'calificarMisionOpcionMultipleSimulador';
            }
            let resultado = 0;

            if (typeof window[calificarFunctionName] === 'function') {
                // Obtener el div del problema para pasar a la función de calificación
                const problemaDiv = document.getElementById(`mision-${index}`);
                
                if (problemaDiv) {
                    // La función de calificación necesita el div del problema y los datos
                    resultado = window[calificarFunctionName](problemaDiv, problema);
                } else {
                    console.warn(`No se encontró el div del problema ${index}`);
                }
            } else {
                console.warn(`Función de calificación no encontrada: ${calificarFunctionName}`);
            }

            puntaje += resultado;
        });
        
        // Añadir una pequeña pausa para que el usuario vea la última calificación
        setTimeout(() => {
            const resultadoFinalHTML = `<div class="resultado-final-box"><h2>Resultado Final: ${puntaje} de ${examenData.problemas.length}</h2></div>`;
            problemasContainer.insertAdjacentHTML('beforeend', resultadoFinalHTML);
            
            calificarBtn.textContent = 'Intentar de Nuevo';
            calificarBtn.onclick = () => window.location.reload();
            
            // Hacer scroll hacia el resultado final
            const resultadoBox = problemasContainer.querySelector('.resultado-final-box');
            resultadoBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        }, 500);
    }
    
    calificarBtn.addEventListener('click', calificarExamen);

    // --- Iniciar Carga ---
    const examenId = getExamenId();
    cargarExamen(examenId);
});
