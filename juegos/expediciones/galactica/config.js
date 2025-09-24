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
                Marte tiene el volcán más grande del sistema solar, el Monte Olimpo. ¡Es 3 veces más alto que el Monte Everest!
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Olympus_Mons_alt.jpg/1280px-Olympus_Mons_alt.jpg" 
                     alt="Volcán Monte Olimpo en Marte"
                     onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiPjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOEI0NTEzIi8+PHRleHQgeD0iMjAwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiI+4p2VIE1vbnRlIE9saW1wbyBWb2xjw6FuPC90ZXh0Pjwvc3ZnPg==';">
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
