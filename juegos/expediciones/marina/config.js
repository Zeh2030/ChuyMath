/**
 * Configuración específica para la Expedición Marina
 * Viaja a Nueva York, conoce a Júpiter y resuelve el misterio del tiburón
 */

const expedicionMarinaConfig = {
    name: 'marina',
    title: '🌊 Expedición Marina',
    subtitle: 'Nueva York, Júpiter y Secretos del Tiburón',
    
    // === MISIÓN DE OPERACIONES ===
    math: {
        exercises: [
            { question: '34 + 17', answer: '51' },
            { question: '61 - 23', answer: '38' },
            { question: '9 × 4', answer: '36' },
            { question: '56 ÷ 8', answer: '7' },
            { question: '75 + 25', answer: '100' }
        ]
    },

    // === MISIÓN GEOGRÁFICA (NUEVA YORK) ===
    geography: {
        answer: 'ny',
        options: [
            { id: 'paris', value: 'paris', label: 'A) París' },
            { id: 'ny', value: 'ny', label: 'B) Nueva York' },
            { id: 'tokio', value: 'tokio', label: 'C) Tokio' }
        ],
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                La Estatua de la Libertad fue un regalo de Francia. ¡Su antorcha representa la libertad e ilumina el camino para todos los que llegan a la ciudad!
                <img src="https://images.pexels.com/photos/290386/pexels-photo-290386.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="Estatua de la Libertad">
            </div>
        `
    },

    // === MISIÓN CÓSMICA (JÚPITER) ===
    planets: {
        answer: 'gigante',
        options: [
            { id: 'pequeno', value: 'pequeno', label: 'A) Pequeño' },
            { id: 'rocoso', value: 'rocoso', label: 'B) Rocoso' },
            { id: 'gigante', value: 'gigante', label: 'C) Gigante' }
        ],
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                Júpiter tiene una tormenta gigante llamada la 'Gran Mancha Roja'. ¡Es más grande que todo el planeta Tierra!
                <img src="https://i.ytimg.com/vi/O1WLJTlESW4/maxresdefault.jpg" alt="La Gran Mancha Roja de Júpiter">
            </div>
        `
    },

    // === MISIÓN MARINA (TIBURÓN) ===
    animals: {
        answer: 'tiburon',
        clues: [
            'Soy un famoso cazador del océano.',
            'Tengo filas y filas de dientes afilados.',
            'No tengo huesos, mi esqueleto es de cartílago.'
        ],
        options: [
            { id: 'delfin', value: 'delfin', label: 'A) Delfín' },
            { id: 'tiburon', value: 'tiburon', label: 'B) Tiburón' },
            { id: 'ballena', value: 'ballena', label: 'C) Ballena' }
        ],
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                Los tiburones pueden tener miles de dientes en su vida. Si se les cae uno, ¡otro nuevo crece para reemplazarlo! 
                Por eso siempre tienen una sonrisa afilada.
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Tiger_shark_jaw_and_teeth_-_top_and_bottom.jpg/1280px-Tiger_shark_jaw_and_teeth_-_top_and_bottom.jpg" alt="Mandíbula y dientes de tiburón">
            </div>
        `
    },

    // === MISIÓN KAKOOMA (ELIMINADA) ===

    // === MISIÓN NUMBERBLOCKS ===
    numberblocks: {
        operation: 'Dibuja Numberblocks para 5 + 4 = ?',
        enabled: true
    }
};
