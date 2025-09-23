/**
 * Configuración específica para la Expedición Galáctica
 * Explora San Francisco, conoce a Marte y descifra el misterio del pulpo
 */

const expedicionGalacticaConfig = {
    name: 'galactica',
    title: '🌌 Expedición Galáctica',
    subtitle: 'San Francisco, Marte y Misterios Marinos',
    
    // === MISIÓN DE OPERACIONES ===
    math: {
        exercises: [
            { question: '15 + 8', answer: '23' },
            { question: '32 - 17', answer: '15' },
            { question: '6 × 3', answer: '18' },
            { question: '20 ÷ 5', answer: '4' },
            { question: '45 + 25', answer: '70' }
        ]
    },

    // === MISIÓN KAKOOMA (SIMPLIFICADA PARA 7 AÑOS) ===
    kakooma: {
        puzzles: [
            {
                target: 8,
                numbers: [2, 6, 8, 3, 5, 1, 4, 7, 9]
            },
            {
                target: 10,
                numbers: [3, 7, 10, 4, 6, 2, 5, 8, 1]
            }
        ]
    },

    // === MISIÓN GEOGRÁFICA (SAN FRANCISCO) ===
    geography: {
        answer: 'sf',
        options: [
            { id: 'paris', value: 'paris', label: 'A) París' },
            { id: 'sf', value: 'sf', label: 'B) San Francisco' },
            { id: 'tokio', value: 'tokio', label: 'C) Tokio' }
        ],
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                El Puente Golden Gate es famoso por su color rojo-naranja llamado "International Orange". 
                ¡Fue elegido para que el puente sea visible en la niebla típica de San Francisco!
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/1280px-GoldenGateBridge-001.jpg" alt="Golden Gate Bridge">
            </div>
        `
    },

    // === MISIÓN CÓSMICA (MARTE) ===
    planets: {
        answer: 'rojo',
        question: 'Hola, soy Marte. Soy conocido como el Planeta <span class="blank">____</span> porque mi suelo está lleno de hierro oxidado.',
        inputType: 'text', // Para distinguir de opción múltiple
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                Marte parece rojo porque tiene mucho hierro en su superficie, igual que cuando el hierro se oxida en la Tierra. 
                ¡Por eso también lo llaman el "Planeta Rojo"!
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/1280px-OSIRIS_Mars_true_color.jpg" alt="Marte visto desde el espacio">
            </div>
        `
    },

    // === MISIÓN MARINA (PULPO) ===
    animals: {
        answer: 'pulpo',
        clues: [
            'Tengo ocho brazos largos y flexibles.',
            'Puedo cambiar de color para esconderme.',
            'Soy muy inteligente y puedo resolver problemas.'
        ],
        inputType: 'text', // Para distinguir de opción múltiple
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                Los pulpos tienen tres corazones y sangre azul. ¡Dos corazones bombean sangre a las branquias y uno al resto del cuerpo!
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Octopus3.jpg/1280px-Octopus3.jpg" alt="Pulpo en su hábitat natural">
            </div>
        `
    },

    // === MISIÓN NUMBERBLOCKS ===
    numberblocks: {
        operation: 'Dibuja Numberblocks para 4 + 3 = 7',
        enabled: true
    }
};
