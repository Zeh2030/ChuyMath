/* ===== FUNCIONES ESPECÍFICAS PARA PALABRA DEL DÍA ===== */

// Función para renderizar palabra del día
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
