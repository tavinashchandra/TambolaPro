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
    
    const historyButton = document.getElementById('history-button');
    const historyModal = document.getElementById('history-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const historyListContainer = document.getElementById('history-list');
    const voiceSpeedSlider = document.getElementById('voice-speed');
    const voiceSpeedValue = document.getElementById('voice-speed-value');
    const voicePitchSlider = document.getElementById('voice-pitch');
    const voicePitchValue = document.getElementById('voice-pitch-value');
    const repeatButton = document.getElementById('repeat-button');


    // --- GAME STATE ---
    let voices = [];
    let availableNumbers = [], calledNumbers = [], prizes = [], drawHistory = [];
    let totalPrizePool = 0;
    let voiceEnabled = true;
    let autoDrawIntervalId = null;
    const defaultPrizes = [ 
        { id: 'early_5', name: 'Early 5', claimed: false, amount: 0 }, 
        { id: 'first_line', name: 'First Line', claimed: false, amount: 0 }, 
        { id: 'second_line', name: 'Second Line', claimed: false, amount: 0 }, 
        { id: 'third_line', name: 'Third Line', claimed: false, amount: 0 }, 
        // --- FIX 1: Renamed "Full Housie" to "Full Housie (1)" by default ---
        { id: 'full_housie_1', name: 'Full Housie (1)', claimed: false, amount: 0 }
    ];

    // --- Core Functions ---

    function getRandomInt(max) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        let randomNumber = randomBuffer[0] / (0xffffffff + 1);
        return Math.floor(randomNumber * max);
    }
    
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
        manualTotalDisplay.style.display = 'block';
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
            prizes.push({ id: Date.now().toString(), name, claimed: false, amount: 0 }); 
            newPrizeNameInput.value = ''; 
            savePrizesAndRender();
        } 
    }
    
    function updateManualTotal() { 
        let manualTotal = prizes.reduce((total, prize) => total + (parseFloat(prize.amount) || 0), 0);
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
            const prizeNameDisplay = prize.claimed ? `${prize.name} ✔️` : prize.name;
            const claimBtnClass = prize.claimed ? 'is-claimed' : '';

            item.innerHTML = `
                <span class="prize-name">${prizeNameDisplay}</span>
                <div class="prize-details">
                    <input type="text" inputmode="numeric" pattern="[0-9]*" data-id="${prize.id}" class="amount-input" value="${prize.amount}" placeholder="₹" ${isDisabled}>
                </div>
                <div class="prize-actions">
                    <button class="claim-btn primary-btn ${claimBtnClass}" data-id="${prize.id}">${claimBtnTxt}</button>
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
            prizes.push({ ...prize, id: Date.now().toString(), name: newName, claimed: false });
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
        if (!confirm("Are you sure you want to reset everything? This cannot be undone.")) return;
        stopAutoDraw(); 
        if (synth.speaking) synth.cancel(); 
        availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1); 
        calledNumbers = []; 
        drawHistory = []; 
        currentNumberDisplay.textContent = '--'; 
        calledNumbersList.innerHTML = ''; 
        drawButton.disabled = false; 
        undoButton.disabled = true; 
        repeatButton.disabled = true;
        initializeBoard(); 
        entryFeeInput.value = ''; 
        ticketsSoldInput.value = ''; 
        totalCollectionDisplay.innerHTML = ''; 
        totalPrizePool = 0; 
        prizes = JSON.parse(JSON.stringify(defaultPrizes)); 
        localStorage.clear(); 
        applyFont(fontSelector.value);
        applyTheme(themeSelector.value);
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
        const savedSpeed = localStorage.getItem('tambolaVoiceSpeed');
        const savedPitch = localStorage.getItem('tambolaVoicePitch');

        prizes = savedPrizes || JSON.parse(JSON.stringify(defaultPrizes));
        if (savedPool) totalPrizePool = savedPool;

        if (savedFont) { applyFont(savedFont); fontSelector.value = savedFont; }
        if (savedTheme) { applyTheme(savedTheme); themeSelector.value = savedTheme; }
        if (savedVoice !== null) { voiceEnabled = savedVoice === 'true'; voiceToggle.checked = voiceEnabled; }
        if (savedSpeed) { voiceSpeedSlider.value = savedSpeed; voiceSpeedValue.textContent = savedSpeed; }
        if (savedPitch) { voicePitchSlider.value = savedPitch; voicePitchValue.textContent = savedPitch; }

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
            repeatButton.disabled = drawHistory.length === 0;

            calledNumbers.forEach(num => {
                const cell = document.getElementById(`cell-${num}`);
                if (cell) cell.classList.add('called');
            });
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
    
    function speakNumber(num) {
        if (!voiceEnabled) return;
        if (voices.length === 0) {
            populateVoiceList();
        }
        if (synth.speaking) synth.cancel(); 
        const u = new SpeechSynthesisUtterance(num.toString());
        const selectedVoiceURI = voiceSelector.value || localStorage.getItem('tambolaVoiceURI');
        const selectedVoice = voices.find(voice => voice.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            u.voice = selectedVoice;
        }
        u.rate = parseFloat(voiceSpeedSlider.value);
        u.pitch = parseFloat(voicePitchSlider.value);
        synth.speak(u); 
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
        
        const currentCell = document.getElementById(`cell-${num}`);
        if(currentCell) {
            currentCell.classList.add('called');
            currentCell.classList.add('just-called');
            setTimeout(() => {
                currentCell.classList.remove('just-called');
            }, 600);
        }
        
        updateCalledNumbersList(); 
        undoButton.disabled = false; 
        repeatButton.disabled = false;
        
        speakNumber(num);

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
        const index = calledNumbers.indexOf(lastNumber);
        if (index > -1) calledNumbers.splice(index, 1);
        availableNumbers.push(lastNumber); 
        availableNumbers.sort((a,b) => a-b);
        
        const cell = document.getElementById(`cell-${lastNumber}`);
        if(cell) {
            cell.classList.remove('called');
        }

        const newLast = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--'; 
        currentNumberDisplay.textContent = newLast; 

        if (drawHistory.length === 0) {
            undoButton.disabled = true; 
            repeatButton.disabled = true;
        }
        drawButton.disabled = false; 
        updateCalledNumbersList();
        saveGameState(); 
    }
    
    function updateCalledNumbersList() {
        calledNumbersList.innerHTML = '';
        const lastFive = drawHistory.slice(-5);
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
             verifyResultDiv.innerHTML = '<p style="color: red;">No valid numbers entered (1-90 only).</p>';
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
            verifyResultDiv.innerHTML += '<p style="color: var(--success-color); font-weight: bold; margin-top: 10px;">✅ Valid claim! All numbers have been called.</p>';
        } else {
            verifyResultDiv.innerHTML += `<p style="color: var(--error-color); font-weight: bold; margin-top: 10px;">❌ Not all numbers have been called. Missing: ${missingNumbers.join(', ')}</p>`;
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
                alert("Please enter a valid time (in seconds)."); return;
            }
            if (availableNumbers.length === 0) {
                alert("Cannot start, all numbers have been called!"); return;
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
            if (availableNumbers.length > 0) drawButton.disabled = false;
        }
    }

    function enforceNumericInput(event) {
        const input = event.target;
        const regex = (input.id === 'verify-numbers') ? /[^0-9\s]/g : /[^0-9]/g;
        input.value = input.value.replace(regex, '');
    }

    // --- NEW & UPDATED FUNCTIONS ---
    function repeatLastNumber() {
        if (drawHistory.length > 0) {
            const lastNumber = drawHistory[drawHistory.length - 1];
            speakNumber(lastNumber);
        }
    }

    function openHistoryModal() {
        historyListContainer.innerHTML = '';
        if (drawHistory.length === 0) {
            historyListContainer.innerHTML = '<p>No numbers have been called yet.</p>';
        } else {
            // --- FIX 2: Removed .reverse() to show numbers in chronological order ---
            drawHistory.forEach(num => {
                const s = document.createElement('span');
                s.textContent = num;
                historyListContainer.appendChild(s);
            });
        }
        historyModal.style.display = 'flex';
    }

    function closeHistoryModal() {
        historyModal.style.display = 'none';
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
    
    repeatButton.addEventListener('click', repeatLastNumber);
    historyButton.addEventListener('click', openHistoryModal);
    modalCloseBtn.addEventListener('click', closeHistoryModal);
    historyModal.addEventListener('click', (e) => { 
        if (e.target === historyModal) closeHistoryModal();
    });
    voiceSpeedSlider.addEventListener('input', (e) => {
        voiceSpeedValue.textContent = e.target.value;
        localStorage.setItem('tambolaVoiceSpeed', e.target.value);
    });
    voicePitchSlider.addEventListener('input', (e) => {
        voicePitchValue.textContent = e.target.value;
        localStorage.setItem('tambolaVoicePitch', e.target.value);
    });

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
