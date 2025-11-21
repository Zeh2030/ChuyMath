/**
 * Configuración específica para la Expedición Ancestral
 * Explora Egipto, conoce a Saturno y descubre la inteligencia de los primates
 */

const expedicionAncestralConfig = {
    name: 'ancestral',
    title: '🏺 Expedición Ancestral',
    subtitle: 'Egipto, Saturno y Secretos de los Primates',
    
    // === MISIÓN DE OPERACIONES ===
    math: {
        exercises: [
            { question: '52 + 38', answer: '90' },
            { question: '75 - 26', answer: '49' },
            { question: '8 × 8', answer: '64' },
            { question: '45 ÷ 9', answer: '5' },
            { question: '67 + 33', answer: '100' }
        ]
    },

    // === MISIÓN GEOGRÁFICA (EGIPTO) ===
    geography: {
        answer: 'egipto',
        options: [
            { id: 'mexico', value: 'mexico', label: 'A) México' },
            { id: 'egipto', value: 'egipto', label: 'B) Egipto' },
            { id: 'china', value: 'china', label: 'C) China' }
        ],
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                Los faraones eran los reyes del antiguo Egipto y construyeron las pirámides como tumbas. 
                ¡La Gran Pirámide de Giza fue una de las Siete Maravillas del Mundo Antiguo!
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/1280px-Kheops-Pyramid.jpg" 
                     alt="Pirámides de Giza" 
                     onerror="this.onerror=null;this.src='https://placehold.co/400x300/d4af37/fff?text=Pirámides+de+Egipto';">
            </div>
        `
    },

    // === MISIÓN CÓSMICA (SATURNO) ===
    planets: {
        answer: 'anillos',
        options: [
            { id: 'volcanes', value: 'volcanes', label: 'A) Volcanes' },
            { id: 'anillos', value: 'anillos', label: 'B) Anillos' },
            { id: 'oceanos', value: 'oceanos', label: 'C) Océanos' }
        ],
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                Los anillos de Saturno están hechos de miles de millones de trozos de hielo y roca. 
                ¡Son tan delgados que si pudieras verlos de lado, apenas serían visibles!
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/1280px-Saturn_during_Equinox.jpg" 
                     alt="Saturno y sus anillos" 
                     onerror="this.onerror=null;this.src='https://placehold.co/400x300/ffd700/000?text=Saturno+y+sus+Anillos';">
            </div>
        `
    },

    // === MISIÓN DE LA SELVA (MONOS) ===
    animals: {
        answer: 'mono',
        clues: [
            'Soy un mamífero muy inteligente que vive en los árboles.',
            'Me encanta comer bananas y frutas dulces.',
            'Soy un pariente cercano de los humanos.',
            'Uso herramientas para conseguir comida.',
            'Me columpio de rama en rama usando mi cola.'
        ],
        options: [
            { id: 'leon', value: 'leon', label: 'A) León' },
            { id: 'serpiente', value: 'serpiente', label: 'B) Serpiente' },
            { id: 'mono', value: 'mono', label: 'C) Mono' }
        ],
        clueHTML: `
            <div class="clue-box visible">
                <strong>¡Pista Secreta!</strong> 
                Los monos pueden usar herramientas como palos para sacar termitas de los hormigueros. 
                ¡Son tan inteligentes que pueden aprender lenguaje de señas y resolver problemas complejos!
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Bonnet_macaque_%28Macaca_radiata%29_Photograph_By_Shantanu_Kuveskar.jpg/1280px-Bonnet_macaque_%28Macaca_radiata%29_Photograph_By_Shantanu_Kuveskar.jpg" 
                     alt="Mono en su hábitat" 
                     onerror="this.onerror=null;this.src='https://placehold.co/400x300/8B4513/fff?text=Mono+Inteligente';">
            </div>
        `
    },

    // === MISIÓN KAKOOMA (ELIMINADA) ===

    // === MISIÓN NUMBERBLOCKS ===
    numberblocks: {
        operation: 'Dibuja Numberblocks para 10 - 3 = ?',
        enabled: true
    }
};
