document.addEventListener('DOMContentLoaded', () => {
    const toolbox = document.getElementById('toolbox');
    const checkButton = document.getElementById('check-button');
    const nextButton = document.getElementById('next-button');
    const constructionArea = document.getElementById('construction-area');
    const storyText = document.getElementById('story-text');
    const messageArea = document.getElementById('message-area');
    const challengeTitle = document.getElementById('challenge-title');
    const equationDisplay = document.getElementById('equation-display');

    let selectedBlocks = [];
    let currentChallengeIndex = -1;
    
    const challenges = [
        { target: 24, type: 'multiply', story: "¡Soy el Veinticuatro! Elige dos amigos de la caja que multiplicados me den 24." },
        { target: 36, type: 'multiply', story: "¡Soy el Treinta y Seis! ¡Soy un cuadrado perfecto! ¿Puedes construirme?" },
        { target: 48, type: 'divide', given: 4, story: "¡Soy un rectángulo de 48! Si un lado mide 4, elige el bloque que falta para completarme." },
        { target: 50, type: 'multiply', story: "¡Cincuenta! ¡Elige dos bloques para construir mi rectángulo!" },
        { target: 72, type: 'divide', given: 6, story: "¡Un gran rectángulo de 72! Un lado es 6, ¿cuál es el otro? ¡Encuéntralo en la caja!" },
    ];

    function createNumberblock(num) {
        const nbContainer = document.createElement('div');
        nbContainer.classList.add('numberblock');
        nbContainer.dataset.number = num;

        const faceContainer = document.createElement('div');
        faceContainer.classList.add('face-container');
        const eye1 = document.createElement('div');
        eye1.classList.add('eye');
        faceContainer.appendChild(eye1);
        
        if (num > 1) { 
            const eye2 = document.createElement('div');
            eye2.classList.add('eye');
            faceContainer.appendChild(eye2);
        }

        const stack = document.createElement('div');
        stack.style.display = 'flex';
        stack.style.flexDirection = 'column-reverse';

        if (num === 9) {
            nbContainer.classList.add('nb-9-shape');
            const nineColors = ['--nb-9-3', '--nb-9-2', '--nb-9-1'];
            for (let i = 0; i < 9; i++) {
                const block = document.createElement('div');
                block.classList.add('block');
                block.style.backgroundColor = `var(${nineColors[Math.floor(i/3)]})`;
                if (i === 8) {
                    block.appendChild(faceContainer);
                    nbContainer.classList.add('has-face');
                }
                nbContainer.appendChild(block);
            }
        } else if (num === 11) {
            nbContainer.classList.add('nb-11-shape');
            const leftLeg = document.createElement('div');
            leftLeg.classList.add('stack');
            for(let i=0; i<5; i++) {
                const block = document.createElement('div');
                block.classList.add('block', 'white-block');
                if (i === 0) { // Bottom block of left leg
                    const leftEyeContainer = document.createElement('div');
                    leftEyeContainer.classList.add('face-container');
                    const leftEye = document.createElement('div');
                    leftEye.classList.add('eye');
                    leftEyeContainer.appendChild(leftEye);
                    block.appendChild(leftEyeContainer);
                    nbContainer.classList.add('has-face');
                }
                leftLeg.appendChild(block);
            }
            
            const rightLeg = document.createElement('div');
            rightLeg.classList.add('stack');
            for(let i=0; i<6; i++) {
                const block = document.createElement('div');
                if(i === 5) {
                    block.classList.add('block', 'red-block');
                } else {
                    block.classList.add('block', 'white-block');
                }
                if (i === 0) { // Bottom block of right leg
                     const rightEyeContainer = document.createElement('div');
                    rightEyeContainer.classList.add('face-container');
                    const rightEye = document.createElement('div');
                    rightEye.classList.add('eye');
                    rightEyeContainer.appendChild(rightEye);
                    block.appendChild(rightEyeContainer);
                }
                rightLeg.appendChild(block);
            }
            nbContainer.append(leftLeg, rightLeg);
        } else if (num === 12) {
            nbContainer.classList.add('nb-12-shape');
            for (let i = 0; i < 12; i++) {
                const block = document.createElement('div');
                block.classList.add('block');
                block.style.borderColor = 'var(--nb-12-border)';
                const centralIndices = [4, 7];
                if (centralIndices.includes(i)) {
                    block.style.backgroundColor = 'var(--nb-12-center)';
                } else {
                    block.style.backgroundColor = 'var(--nb-12-main)';
                }
                
                if (i === 7) { // Top yellow block gets the face
                    block.appendChild(faceContainer);
                    nbContainer.classList.add('has-face');
                }
                nbContainer.appendChild(block);
            }
        } else { // For all other numbers
            const sevenColors = ['--nb-7-1', '--nb-7-2', '--nb-7-3', '--nb-7-4', '--nb-7-5', '--nb-7-6', '--nb-7-7'];
            for (let i = 0; i < num; i++) {
                const block = document.createElement('div');
                block.classList.add('block');
                if (num === 7) {
                    block.style.backgroundColor = `var(${sevenColors[i]})`;
                } else {
                    block.classList.add(`c${num}`);
                }
                if (i === num - 1) {
                    block.appendChild(faceContainer);
                    nbContainer.classList.add('has-face');
                }
                stack.appendChild(block);
            }
            nbContainer.appendChild(stack);
        }
        
        nbContainer.addEventListener('click', () => selectBlock(nbContainer));
        return nbContainer;
    }

    function populateToolbox() {
        toolbox.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            toolbox.appendChild(createNumberblock(i));
        }
    }

    function selectBlock(blockElement) {
        if (nextButton.classList.contains('hidden')) {
            const number = parseInt(blockElement.dataset.number);
            const challenge = challenges[currentChallengeIndex];
            const maxSelection = challenge.type === 'multiply' ? 2 : 1;

            if (selectedBlocks.includes(number)) {
                if (challenge.type === 'multiply' && selectedBlocks.length === 1 && selectedBlocks[0] === number) {
                    selectedBlocks.push(number);
                    blockElement.classList.add('double-selected');
                } else {
                    selectedBlocks = selectedBlocks.filter(n => n !== number);
                    blockElement.classList.remove('selected', 'double-selected');
                }
            } else if (selectedBlocks.length < maxSelection) {
                selectedBlocks.push(number);
                blockElement.classList.add('selected');
            }
        }
    }
    
    function buildRectangle(rows, cols) {
        constructionArea.innerHTML = '';
        const grid = document.createElement('div');
        grid.classList.add('rectangle-grid');
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        const targetNumber = rows * cols;
        const colorClass = `c${targetNumber}`;

        for(let i=0; i < targetNumber; i++) {
            const block = document.createElement('div');
            block.classList.add('block', colorClass);
            block.style.animationDelay = `${i * 0.02}s`;
            grid.appendChild(block);
        }
        constructionArea.appendChild(grid);
    }

    function launchConfetti() {
        for (let i = 0; i < 30; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            constructionArea.appendChild(confetti);
        }
    }

    function startChallenge(index) {
        currentChallengeIndex = index;
        const challenge = challenges[index];
        
        selectedBlocks = [];
        constructionArea.innerHTML = '';
        messageArea.textContent = '';
        equationDisplay.innerHTML = '';
        document.querySelectorAll('.numberblock.selected, .numberblock.double-selected').forEach(el => {
            el.classList.remove('selected', 'double-selected');
        });
        checkButton.classList.remove('hidden');
        nextButton.classList.add('hidden');

        challengeTitle.textContent = `Reto: El Numberblock ${challenge.target}`;
        storyText.textContent = challenge.story;
        
        if (challenge.type === 'multiply') {
            equationDisplay.innerHTML = `<span class="placeholder">?</span> × <span class="placeholder">?</span> = ${challenge.target}`;
        } else if (challenge.type === 'divide') {
            equationDisplay.innerHTML = `${challenge.given} × <span class="placeholder">?</span> = ${challenge.target}`;
        }
    }

    checkButton.addEventListener('click', () => {
        const challenge = challenges[currentChallengeIndex];
        let isCorrect = false;

        if (challenge.type === 'multiply' && selectedBlocks.length === 2) {
            if (selectedBlocks[0] * selectedBlocks[1] === challenge.target) {
                isCorrect = true;
                buildRectangle(selectedBlocks[0], selectedBlocks[1]);
            }
        } else if (challenge.type === 'divide' && selectedBlocks.length === 1) {
            if (challenge.given * selectedBlocks[0] === challenge.target) {
                isCorrect = true;
                buildRectangle(challenge.given, selectedBlocks[0]);
            }
        }

        if (isCorrect) {
            messageArea.textContent = '¡Fantástico! ¡Rectángulo construido!';
            messageArea.style.color = '#2ecc71';
            checkButton.classList.add('hidden');
            nextButton.classList.remove('hidden');
            launchConfetti();
        } else {
            messageArea.textContent = 'Oh, oh... Esos bloques no funcionan. ¡Intenta otra vez!';
            messageArea.style.color = '#e74c3c';
            document.querySelector('.game-container').animate([
                { transform: 'translateX(0px)' }, { transform: 'translateX(-10px)' },
                { transform: 'translateX(10px)' }, { transform: 'translateX(0px)' }
            ], { duration: 500, easing: 'ease-in-out' });
        }
    });

    nextButton.addEventListener('click', () => {
        const nextIndex = (currentChallengeIndex + 1) % challenges.length;
        startChallenge(nextIndex);
    });

    populateToolbox();
    nextButton.textContent = "¡Empezar!";
    nextButton.classList.remove('hidden');
    checkButton.classList.add('hidden');
});
