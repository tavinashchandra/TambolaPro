document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const voiceSelector = document.getElementById('voice-selector');
    const fontSelector = document.getElementById('font-selector');
    const themeSelector = document.getElementById('theme-selector');
    const voiceToggle = document.getElementById('voice-toggle');
    const entryFeeInput = document.getElementById('entry-fee');
    const ticketsSoldInput = document.getElementById('tickets-sold');
    const calculateBtn = document.getElementById('calculate-btn');
    const totalCollectionDisplay = document.getElementById('total-collection');
    const addPrizeBtn = document.getElementById('add-prize-btn');
    const newPrizeNameInput = document.getElementById('new-prize-name');
    const currentNumberDisplay = document.getElementById('current-number');
    const drawButton = document.getElementById('draw-button');
    const resetButton = document.getElementById('reset-game-btn');
    const board = document.getElementById('tambola-board');
    const calledNumbersList = document.getElementById('called-numbers-list');
    const prizeListContainer = document.getElementById('prize-list');
    const manualTotalDisplay = document.getElementById('manual-total-display');
    const prizesTotalBanner = document.getElementById('prizes-total-banner');
    const modeSelectors = document.querySelectorAll('input[name="prize-mode"]');
    const synth = window.speechSynthesis;
    const undoButton = document.getElementById('undo-button');
    const verifyBtn = document.getElementById('verify-btn');
    const verifyNumbersInput = document.getElementById('verify-numbers');
    const verifyResultDiv = document.getElementById('verify-result');
    const verifyResetBtn = document.getElementById('verify-reset-btn');
    const tabBar = document.querySelector('.tab-bar');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const autoDrawBtn = document.getElementById('auto-draw-btn');
    const autoDrawTimeInput = document.getElementById('auto-draw-time');

    // --- GAME STATE ---
    let voices = [];
    let availableNumbers = [], calledNumbers = [], prizes = [], drawHistory = [];
    let totalPrizePool = 0;
    let calculationMode = 'manual';
    let voiceEnabled = true;
    let autoDrawIntervalId = null;
    const defaultPrizes = [ 
        { id: 'early_5', name: 'Early 5', weight: 1, claimed: false, winner: '', amount: 25 }, 
        { id: 'first_line', name: 'First Line', weight: 2, claimed: false, winner: '', amount: 50 }, 
        { id: 'second_line', name: 'Second Line', weight: 2, claimed: false, winner: '', amount: 50 }, 
        { id: 'third_line', name: 'Third Line', weight: 2, claimed: false, winner: '', amount: 50 }, 
        { id: 'full_housie_1', name: 'Full Housie (1)', weight: 4, claimed: false, winner: '', amount: 100 }
    ];

    // --- Core Functions ---

    // Uses Cryptographically Secure Random Number Generator for fair draws
    function getRandomInt(max) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        let randomNumber = randomBuffer[0] / (0xffffffff + 1);
        return Math.floor(randomNumber * max);
    }
    
    // Populates the voice dropdown in settings with English and Telugu voices
    function populateVoiceList() {
        voices = synth.getVoices().filter(voice => voice.lang.startsWith('en') || voice.lang.startsWith('te'));
        const selectedVoiceURI = localStorage.getItem('tambolaVoiceURI');
        voiceSelector.innerHTML = '';
        if (voices.length === 0) {
            const defaultOption = document.createElement('option');
            defaultOption.textContent = 'No voices available';
            voiceSelector.appendChild(defaultOption);
            return;
        }
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.voiceURI;
            if (voice.voiceURI === selectedVoiceURI) {
                option.selected = true;
            }
            voiceSelector.appendChild(option);
        });
    }

    function handleTabClick(event) {
        const clickedTab = event.target.closest('.tab-btn');
        if (!clickedTab) return;
        tabBar.querySelector('.active')?.classList.remove('active');
        document.querySelector('.tab-pane.active')?.classList.remove('active');
        clickedTab.classList.add('active');
        document.getElementById(clickedTab.dataset.target).classList.add('active');
    }

    function applyFont(font) { document.documentElement.style.setProperty('--main-font', font); }
    function applyTheme(theme) { document.body.className = theme; }
    function handleFontChange(event) { const selectedFont = event.target.value; applyFont(selectedFont); localStorage.setItem('tambolaFont', selectedFont); }
    function handleThemeChange(event) { const selectedTheme = event.target.value; applyTheme(selectedTheme); localStorage.setItem('tambolaTheme', selectedTheme); }
    function handleVoiceToggle(event) { voiceEnabled = event.target.checked; localStorage.setItem('tambolaVoiceEnabled', voiceEnabled); }
    
    function updateUIVisibility() {
        const prizesCard = document.querySelector('.prizes-card');
        if (prizesCard) {
            prizesCard.classList.add('manual-mode'); 
            prizesCard.classList.remove('auto-mode');
            manualTotalDisplay.style.display = 'block';
        }
        const modeSelectorDiv = document.getElementById('prize-mode-selector');
        if (modeSelectorDiv) {
            modeSelectorDiv.style.display = 'none';
        }
    }

    function calculatePrizePool() { 
        const entryFee = parseFloat(entryFeeInput.value) || 0; 
        const ticketsSold = parseInt(ticketsSoldInput.value) || 0; 
        if (entryFee <= 0 || ticketsSold <= 0) { 
            alert("Please enter a valid entry fee and number of tickets."); 
            return; 
        } 
        totalPrizePool = entryFee * ticketsSold; 
        totalCollectionDisplay.innerHTML = `Total Prize Pool: <strong>₹${totalPrizePool}</strong>`; 
        savePrizesAndRender(); 
    }
    
    function handleAddPrize() { 
        const name = newPrizeNameInput.value.trim(); 
        if (name) { 
            prizes.push({ id: Date.now().toString(), name, weight: 0, claimed: false, winner: '', amount: 0 }); 
            newPrizeNameInput.value = ''; 
            savePrizesAndRender();
        } 
    }
    
    function redistributeAndRender() { 
        savePrizesAndRender(); 
    }
    
    function updateManualTotal() { 
        let manualTotal = 0; 
        prizes.forEach(prize => { 
            const amount = parseFloat(prize.amount);
            if (!isNaN(amount)) { 
                manualTotal += amount; 
            } 
        }); 
        manualTotalDisplay.textContent = `Total Prize Money: ₹${manualTotal}`;
        prizesTotalBanner.textContent = `Total Prize Money: ₹${manualTotal}`;
    }
    
    function renderPrizes() {
        prizeListContainer.innerHTML = '';
        prizes.forEach(prize => {
            const item = document.createElement('div');
            item.className = 'prize-item';
            if (prize.claimed) item.classList.add('claimed');
            const isDisabled = prize.claimed ? 'disabled' : '';
            const claimBtnTxt = prize.claimed ? 'Unclaim' : 'Claim';
            
            item.innerHTML = `
                <span class="prize-name">${prize.name}</span>
                <div class="prize-details">
                    <input type="text" inputmode="numeric" pattern="[0-9]*" data-id="${prize.id}" class="amount-input" value="${prize.amount}" placeholder="₹" ${isDisabled}>
                </div>
                <div class="prize-actions">
                    <button class="claim-btn primary-btn" data-id="${prize.id}">${claimBtnTxt}</button>
                    <button class="icon-btn-small duplicate-btn" data-id="${prize.id}" title="Duplicate Prize" ${isDisabled}>📋</button>
                    <button class="icon-btn-small delete-btn" data-id="${prize.id}" title="Delete Prize" ${isDisabled}>🗑️</button>
                </div>
            `;
            prizeListContainer.appendChild(item);
        });
        updateManualTotal();
        updateUIVisibility();
    }
    
    function handlePrizeListEvents(event) {
        const target = event.target;
        const id = target.dataset.id;
        const prize = prizes.find(p => p.id === id);

        if (!prize) return;

        if (target.classList.contains('claim-btn')) {
            prize.claimed = !prize.claimed;
            savePrizesAndRender();
        } else if (target.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to delete the prize '${prize.name}'?`)) {
                prizes = prizes.filter(p => p.id !== id);
                savePrizesAndRender();
            }
        } else if (target.classList.contains('duplicate-btn')) {
            const baseName = prize.name.replace(/ \(\d+\)$/, '');
            const existingCopies = prizes.filter(p => p.name.startsWith(baseName)).length;
            const newName = `${baseName} (${existingCopies + 1})`;
            const newPrize = { ...prize, id: Date.now().toString(), name: newName };
            prizes.push(newPrize);
            savePrizesAndRender();
        } else if (target.classList.contains('amount-input')) {
            if (event.type === 'change') {
                const newAmount = parseFloat(target.value) || 0;
                if (newAmount >= 0) {
                    prize.amount = newAmount;
                    updateManualTotal();
                    savePrizesAndRender();
                }
            }
        }
    }
    
    function savePrizesAndRender() { 
        localStorage.setItem('tambolaPrizes', JSON.stringify(prizes)); 
        localStorage.setItem('tambolaPrizePool', totalPrizePool);
        renderPrizes(); 
    }
    
    function initializeGame() { 
        stopAutoDraw(); 
        if (synth.speaking) synth.cancel(); 
        availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1); 
        calledNumbers = []; 
        drawHistory = []; 
        currentNumberDisplay.textContent = '--'; 
        calledNumbersList.innerHTML = ''; 
        drawButton.disabled = false; 
        undoButton.disabled = true; 
        initializeBoard(); 
        entryFeeInput.value = ''; 
        ticketsSoldInput.value = ''; 
        totalCollectionDisplay.innerHTML = ''; 
        totalPrizePool = 0; 
        prizes = JSON.parse(JSON.stringify(defaultPrizes)); 
        localStorage.clear(); 
        calculationMode = 'manual';
        document.getElementById('manual-mode').checked = true; 
        document.querySelectorAll('.mode-selector label').forEach(label => label.classList.remove('selected'));
        document.getElementById('manual-mode').parentElement.classList.add('selected');
        updateUIVisibility(); 
        renderPrizes(); 
        resetVerification(); 
    }
    
    function loadSavedState() {
        const savedPrizes = JSON.parse(localStorage.getItem('tambolaPrizes'));
        const savedPool = parseFloat(localStorage.getItem('tambolaPrizePool'));
        const savedFont = localStorage.getItem('tambolaFont');
        const savedTheme = localStorage.getItem('tambolaTheme');
        const savedVoice = localStorage.getItem('tambolaVoiceEnabled');

        prizes = savedPrizes || JSON.parse(JSON.stringify(defaultPrizes));
        if (savedPool) totalPrizePool = savedPool;

        calculationMode = 'manual';
        const manualModeRadio = document.getElementById('manual-mode');
        if (manualModeRadio) {
            manualModeRadio.checked = true;
            manualModeRadio.parentElement.classList.add('selected');
        }


        if (savedFont) { applyFont(savedFont); fontSelector.value = savedFont; } else { applyFont(fontSelector.value); }
        if (savedTheme) { applyTheme(savedTheme); themeSelector.value = savedTheme; } else { applyTheme(themeSelector.value); }
        if (savedVoice !== null) { voiceEnabled = savedVoice === 'true'; voiceToggle.checked = voiceEnabled; }

        totalCollectionDisplay.innerHTML = `Total Prize Pool: <strong>₹${totalPrizePool || 0}</strong>`;
        updateUIVisibility();
        renderPrizes();

        if (localStorage.getItem('calledNumbers')) {
            calledNumbers = JSON.parse(localStorage.getItem('calledNumbers'));
            availableNumbers = JSON.parse(localStorage.getItem('availableNumbers'));
            drawHistory = JSON.parse(localStorage.getItem('drawHistory'));
            updateCalledNumbersList();
            currentNumberDisplay.textContent = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--';
            drawButton.disabled = availableNumbers.length === 0;
            undoButton.disabled = drawHistory.length === 0;

            calledNumbers.forEach(num => {
                const cell = document.getElementById(`cell-${num}`);
                if (cell) cell.classList.add('called');
            });
            if (drawHistory.length > 0) {
                const latestNum = drawHistory[drawHistory.length - 1];
                calledNumbers.forEach(num => {
                    const cell = document.getElementById(`cell-${num}`);
                    if (cell) {
                        cell.classList.add('called');
                        cell.style.opacity = (num === latestNum) ? '1.0' : '0.5';
                    }
                });
            }

        } else {
            availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
            calledNumbers = [];
            drawHistory = [];
        }
        initializeBoard();
        calledNumbers.forEach(num => {
            const cell = document.getElementById(`cell-${num}`);
            if (cell) cell.classList.add('called');
        });
        if (drawHistory.length > 0) {
            const latestNum = drawHistory[drawHistory.length - 1];
            calledNumbers.forEach(num => {
                const cell = document.getElementById(`cell-${num}`);
                if (cell) {
                    cell.classList.add('called');
                    cell.style.opacity = (num === latestNum) ? '1.0' : '0.5';
                }
            });
        }
    }
    
    function initializeBoard() { 
        board.innerHTML = ''; 
        for (let i = 0; i < 9; i++) { 
            const row = board.insertRow(); 
            for (let j = 1; j <= 10; j++) { 
                const num = i * 10 + j; 
                const cell = row.insertCell(); 
                cell.textContent = num; 
                cell.id = `cell-${num}`; 
            } 
        } 
    }
    
    function drawNumber() { 
        if (availableNumbers.length === 0) { 
            stopAutoDraw(); 
            alert("All numbers have been called!");
            return; 
        } 
        const i = getRandomInt(availableNumbers.length); 
        const num = availableNumbers.splice(i, 1)[0]; 
        calledNumbers.push(num); 
        drawHistory.push(num); 
        currentNumberDisplay.textContent = num; 
        
        const prevCalledCells = document.querySelectorAll('.tambola-board td.called');
        prevCalledCells.forEach(cell => cell.style.opacity = '0.5');
        
        const currentCell = document.getElementById(`cell-${num}`);
        if(currentCell) {
            currentCell.classList.add('called');
            currentCell.style.opacity = '1.0';
        }
        
        updateCalledNumbersList(); 
        undoButton.disabled = false; 
        if (voiceEnabled) { 
            if (synth.speaking) synth.cancel(); 
            const u = new SpeechSynthesisUtterance(num.toString());
            const selectedVoiceURI = voiceSelector.value || localStorage.getItem('tambolaVoiceURI');
            if (selectedVoiceURI) {
                u.voice = voices.find(voice => voice.voiceURI === selectedVoiceURI);
            }
            u.rate = 0.9;
            synth.speak(u); 
        } 
        if (availableNumbers.length === 0) { 
            currentNumberDisplay.textContent = 'End'; 
            drawButton.disabled = true; 
            stopAutoDraw(); 
        } 
        saveGameState(); 
    }
    
    function undoLastNumber() { 
        stopAutoDraw(); 
        if (drawHistory.length === 0) return; 
        const lastNumber = drawHistory.pop(); 
        calledNumbers.pop();
        availableNumbers.push(lastNumber); 
        availableNumbers.sort((a,b) => a-b);
        
        const cell = document.getElementById(`cell-${lastNumber}`);
        if(cell) {
            cell.classList.remove('called');
            cell.style.opacity = '';
        }

        const newLast = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--'; 
        currentNumberDisplay.textContent = newLast; 
        
        if(newLast !== '--') {
            const newLastCell = document.getElementById(`cell-${newLast}`);
            if(newLastCell) newLastCell.style.opacity = '1.0';
        }

        if (drawHistory.length === 0) undoButton.disabled = true; 
        drawButton.disabled = false; 
        updateCalledNumbersList();
        saveGameState(); 
    }
    
    function updateCalledNumbersList() {
        calledNumbersList.innerHTML = '';
        const lastFive = calledNumbers.slice(-5);
        lastFive.forEach(num => {
            const s = document.createElement('span');
            s.textContent = num;
            calledNumbersList.appendChild(s);
        });
    }

    function verifyClaim() {
        const numbersString = verifyNumbersInput.value.trim();
        if (!numbersString) {
            verifyResultDiv.innerHTML = '<p style="color: red;">Please enter numbers to verify.</p>';
            return;
        }

        const numbersToVerify = [...new Set(numbersString.split(/\s+/).map(Number))].filter(n => !isNaN(n) && n > 0 && n <= 90);
        
        if (numbersToVerify.length === 0) {
             verifyResultDiv.innerHTML = '<p style="color: red;">No valid numbers entered for verification (only numbers 1-90 are allowed).</p>';
             return;
        }
        
        const missingNumbers = numbersToVerify.filter(num => !calledNumbers.includes(num));

        verifyResultDiv.innerHTML = '<h4>Verification Result:</h4>';
        numbersToVerify.forEach(num => {
            const span = document.createElement('span');
            span.className = 'num';
            span.textContent = num;
            if (calledNumbers.includes(num)) {
                span.classList.add('called');
            } else {
                span.classList.add('not-called');
            }
            verifyResultDiv.appendChild(span);
        });

        if (missingNumbers.length === 0) {
            verifyResultDiv.innerHTML += '<p style="color: var(--success-color); font-weight: bold; margin-top: 10px;">✅ All numbers have been called! Valid claim!</p>';
        } else {
            verifyResultDiv.innerHTML += `<p style="color: var(--error-color); font-weight: bold; margin-top: 10px;">❌ Not all numbers have been called. ${missingNumbers.length} missing.</p>`;
        }
    }
    function resetVerification() { 
        verifyNumbersInput.value = ''; 
        verifyResultDiv.innerHTML = '';
    }
    function saveGameState() { 
        localStorage.setItem('calledNumbers', JSON.stringify(calledNumbers));
        localStorage.setItem('availableNumbers', JSON.stringify(availableNumbers));
        localStorage.setItem('drawHistory', JSON.stringify(drawHistory));
    }
    function handleAutoDraw() {
        if (autoDrawIntervalId) {
            stopAutoDraw();
        } else {
            const time = parseInt(autoDrawTimeInput.value) || 5;
            if (time <= 0) {
                alert("Please enter a valid time (in seconds) for auto-draw.");
                return;
            }
            if (availableNumbers.length === 0) {
                alert("Cannot start auto-draw, all numbers have been called!");
                return;
            }
            autoDrawIntervalId = setInterval(drawNumber, time * 1000);
            autoDrawBtn.textContent = 'Stop Auto-Draw';
            autoDrawBtn.classList.add('danger-btn');
            drawButton.disabled = true;
        }
    }
    function stopAutoDraw() { 
        if (autoDrawIntervalId) {
            clearInterval(autoDrawIntervalId);
            autoDrawIntervalId = null;
            autoDrawBtn.textContent = 'Start Auto-Draw';
            autoDrawBtn.classList.remove('danger-btn');
            if (availableNumbers.length > 0) {
                drawButton.disabled = false;
            }
        }
    }
    function enforceNumericInput(event) {
        const input = event.target;
        const regex = (input.id === 'verify-numbers') ? /[^0-9\s]/g : /[^0-9]/g;
        if (regex.test(input.value)) {
            input.value = input.value.replace(regex, '');
        }
    }

    // --- EVENT LISTENERS ---
    fontSelector.addEventListener('change', handleFontChange);
    themeSelector.addEventListener('change', handleThemeChange);
    voiceToggle.addEventListener('change', handleVoiceToggle);
    voiceSelector.addEventListener('change', (e) => localStorage.setItem('tambolaVoiceURI', e.target.value));
    calculateBtn.addEventListener('click', calculatePrizePool);
    addPrizeBtn.addEventListener('click', handleAddPrize);
    drawButton.addEventListener('click', drawNumber);
    undoButton.addEventListener('click', undoLastNumber);
    resetButton.addEventListener('click', initializeGame);
    verifyBtn.addEventListener('click', verifyClaim);
    verifyResetBtn.addEventListener('click', resetVerification);
    tabBar.addEventListener('click', handleTabClick);
    autoDrawBtn.addEventListener('click', handleAutoDraw);

    prizeListContainer.addEventListener('click', handlePrizeListEvents);
    prizeListContainer.addEventListener('change', handlePrizeListEvents);
    prizeListContainer.addEventListener('input', enforceNumericInput);

    entryFeeInput.addEventListener('input', enforceNumericInput);
    ticketsSoldInput.addEventListener('input', enforceNumericInput);
    autoDrawTimeInput.addEventListener('input', enforceNumericInput);
    verifyNumbersInput.addEventListener('input', enforceNumericInput);

    // --- INITIAL LOAD ---
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    loadSavedState();
});
