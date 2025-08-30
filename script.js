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
    const prizesTotalBanner = document.getElementById('prizes-total-banner');
    const synth = window.speechSynthesis;
    const undoButton = document.getElementById('undo-button');
    const repeatButton = document.getElementById('repeat-button');
    const verifyBtn = document.getElementById('verify-btn');
    const verifyNumbersInput = document.getElementById('verify-numbers');
    const verifyResultDiv = document.getElementById('verify-result');
    const verifyResetBtn = document.getElementById('verify-reset-btn');
    const tabBar = document.querySelector('.tab-bar');
    const autoDrawBtn = document.getElementById('auto-draw-btn');
    const autoDrawTimeInput = document.getElementById('auto-draw-time');
    const voiceSpeedSlider = document.getElementById('voice-speed');
    const voiceSpeedValue = document.getElementById('voice-speed-value');
    const voicePitchSlider = document.getElementById('voice-pitch');
    const voicePitchValue = document.getElementById('voice-pitch-value');

    // NEW Mobile UI Elements
    const showBoardBtn = document.getElementById('show-board-btn');
    const boardModal = document.getElementById('board-modal');
    const boardModalBackdrop = document.getElementById('board-modal-backdrop');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBoardContainer = document.getElementById('modal-board-container');
    const modalCalledNumbersList = document.getElementById('modal-called-numbers-list');


    // --- GAME STATE ---
    let voices = [];
    let availableNumbers = [], calledNumbers = [], prizes = [], drawHistory = [];
    let voiceEnabled = true;
    let autoDrawIntervalId = null;
    const defaultPrizes = [ 
        { id: 'early_5', name: 'Early 5', claimed: false, amount: 0 }, 
        { id: 'first_line', name: 'First Line', claimed: false, amount: 0 }, 
        { id: 'second_line', name: 'Second Line', claimed: false, amount: 0 }, 
        { id: 'third_line', name: 'Third Line', claimed: false, amount: 0 }, 
        { id: 'full_housie_1', name: 'Full Housie (1)', claimed: false, amount: 0 }
    ];

    // --- Core Functions ---
    const isMobile = () => window.innerWidth <= 500;

    function setupGameBoardLayout() {
        if (isMobile()) {
            // If the board is not already in the modal, move it.
            if (!modalBoardContainer.contains(board)) {
                modalBoardContainer.appendChild(board);
            }
        } else {
            // If the board is not in its desktop location, move it back.
            const desktopContainer = document.querySelector('.desktop-board');
            if (desktopContainer && !desktopContainer.contains(board)) {
                desktopContainer.appendChild(board);
            }
        }
    }

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
        document.querySelector('.tab-pane.active')?.classList.remove('active');
        document.querySelector('.tab-btn.active')?.classList.remove('active');
        clickedTab.classList.add('active');
        document.getElementById(clickedTab.dataset.target).classList.add('active');
    }

    function applyFont(font) { document.documentElement.style.setProperty('--main-font', font); }
    function applyTheme(theme) { document.body.className = theme; }

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
                <div class="prize-actions">
                    <input type="text" inputmode="numeric" pattern="[0-9]*" data-id="${prize.id}" class="amount-input" value="${prize.amount}" placeholder="₹" ${isDisabled}>
                    <button class="claim-btn primary-btn ${claimBtnClass}" data-id="${prize.id}">${claimBtnTxt}</button>
                </div>
            `;
            prizeListContainer.appendChild(item);
        });
        prizesTotalBanner.textContent = `Total Prize Money: ₹${prizes.reduce((total, prize) => total + (parseFloat(prize.amount) || 0), 0)}`;
    }

    function handlePrizeListEvents(event) {
        const target = event.target;
        const id = target.dataset.id;
        if (!id) return;
        const prize = prizes.find(p => p.id === id);
        if (!prize) return;

        if (target.classList.contains('claim-btn')) {
            prize.claimed = !prize.claimed;
        } else if (target.classList.contains('amount-input') && event.type === 'change') {
            prize.amount = parseFloat(target.value) || 0;
        }
        savePrizesAndRender();
    }

    function savePrizesAndRender() { 
        localStorage.setItem('tambolaPrizes', JSON.stringify(prizes)); 
        renderPrizes(); 
    }

    function initializeGame() { 
        if (!confirm("Are you sure? This will reset the entire game.")) return;
        stopAutoDraw(); 
        if (synth.speaking) synth.cancel(); 
        availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1); 
        calledNumbers = []; 
        drawHistory = []; 
        currentNumberDisplay.textContent = '--'; 
        updateCalledNumbersList();
        drawButton.disabled = false; 
        undoButton.disabled = true; 
        repeatButton.disabled = true;
        initializeBoard(); 
        entryFeeInput.value = ''; 
        ticketsSoldInput.value = ''; 
        localStorage.clear(); 
        prizes = JSON.parse(JSON.stringify(defaultPrizes)); 
        applyFont(fontSelector.value);
        applyTheme(themeSelector.value);
        renderPrizes(); 
        verifyResultDiv.innerHTML = '';
    }
    
    function loadSavedState() {
        const savedPrizes = JSON.parse(localStorage.getItem('tambolaPrizes'));
        prizes = savedPrizes || JSON.parse(JSON.stringify(defaultPrizes));
        
        const savedFont = localStorage.getItem('tambolaFont');
        if (savedFont) { applyFont(savedFont); fontSelector.value = savedFont; }
        const savedTheme = localStorage.getItem('tambolaTheme');
        if (savedTheme) { applyTheme(savedTheme); themeSelector.value = savedTheme; }

        if (localStorage.getItem('calledNumbers')) {
            calledNumbers = JSON.parse(localStorage.getItem('calledNumbers'));
            availableNumbers = JSON.parse(localStorage.getItem('availableNumbers'));
            drawHistory = JSON.parse(localStorage.getItem('drawHistory'));
            currentNumberDisplay.textContent = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--';
            undoButton.disabled = drawHistory.length === 0;
            repeatButton.disabled = drawHistory.length === 0;
        } else {
            availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        }
        initializeBoard();
        updateCalledNumbersList();
        renderPrizes();
    }
    
    function initializeBoard() { 
        board.innerHTML = ''; 
        let row;
        for (let i = 1; i <= 90; i++) {
            if ((i - 1) % 10 === 0) {
                row = board.insertRow();
            }
            const cell = row.insertCell();
            cell.textContent = i;
            cell.id = `cell-${i}`;
            if (calledNumbers.includes(i)) {
                cell.classList.add('called');
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
            currentCell.classList.add('called', 'just-called');
            setTimeout(() => currentCell.classList.remove('just-called'), 600);
        }
        
        updateCalledNumbersList(); 
        undoButton.disabled = false; 
        repeatButton.disabled = false;
        speakNumber(num);
        saveGameState(); 
    }
    
    function undoLastNumber() { 
        if (drawHistory.length === 0) return; 
        const lastNumber = drawHistory.pop(); 
        calledNumbers.pop();
        availableNumbers.push(lastNumber); 
        availableNumbers.sort((a,b) => a-b);
        
        document.getElementById(`cell-${lastNumber}`)?.classList.remove('called');
        currentNumberDisplay.textContent = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--'; 

        if (drawHistory.length === 0) {
            undoButton.disabled = true; 
            repeatButton.disabled = true;
        }
        updateCalledNumbersList();
        saveGameState(); 
    }
    
    function updateCalledNumbersList() {
        const lists = [calledNumbersList, modalCalledNumbersList];
        lists.forEach(list => {
            if (!list) return;
            list.innerHTML = '';
            const lastFive = drawHistory.slice(-5).reverse();
            lastFive.forEach(num => {
                const s = document.createElement('span');
                s.textContent = num;
                list.appendChild(s);
            });
        });
    }

    function verifyClaim() {
        const numbersString = verifyNumbersInput.value.trim();
        if (!numbersString) {
            verifyResultDiv.innerHTML = '<p style="color: red;">Please enter numbers to verify.</p>';
            return;
        }
        const numbersToVerify = [...new Set(numbersString.split(/\s+/).map(Number))].filter(n => !isNaN(n) && n > 0 && n <= 90);
        const missingNumbers = numbersToVerify.filter(num => !calledNumbers.includes(num));
        verifyResultDiv.innerHTML = numbersToVerify.map(num => 
            `<span class="num ${calledNumbers.includes(num) ? 'called' : 'not-called'}">${num}</span>`
        ).join('');
        
        if (missingNumbers.length === 0) {
            verifyResultDiv.innerHTML += '<p style="color: var(--success-color); font-weight: bold; margin-top: 10px;">✅ Valid claim!</p>';
        } else {
            verifyResultDiv.innerHTML += `<p style="color: var(--error-color); font-weight: bold; margin-top: 10px;">❌ Missing: ${missingNumbers.join(', ')}</p>`;
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
            autoDrawIntervalId = setInterval(drawNumber, time * 1000);
            autoDrawBtn.textContent = 'Stop Auto-Draw';
            drawButton.disabled = true;
        }
    }
    
    function stopAutoDraw() { 
        clearInterval(autoDrawIntervalId);
        autoDrawIntervalId = null;
        autoDrawBtn.textContent = 'Start Auto-Draw';
        drawButton.disabled = availableNumbers.length > 0;
    }

    function openBoardModal() {
        boardModal.classList.add('active');
        boardModalBackdrop.classList.add('active');
    }

    function closeBoardModal() {
        boardModal.classList.remove('active');
        boardModalBackdrop.classList.remove('active');
    }

    // --- EVENT LISTENERS ---
    drawButton.addEventListener('click', drawNumber);
    resetButton.addEventListener('click', initializeGame);
    undoButton.addEventListener('click', undoLastNumber);
    repeatButton.addEventListener('click', () => {
        if(drawHistory.length > 0) speakNumber(drawHistory[drawHistory.length-1]);
    });
    
    fontSelector.addEventListener('change', (e) => { applyFont(e.target.value); localStorage.setItem('tambolaFont', e.target.value); });
    themeSelector.addEventListener('change', (e) => { applyTheme(e.target.value); localStorage.setItem('tambolaTheme', e.target.value); });
    tabBar.addEventListener('click', handleTabClick);

    showBoardBtn.addEventListener('click', openBoardModal);
    modalCloseBtn.addEventListener('click', closeBoardModal);
    boardModalBackdrop.addEventListener('click', closeBoardModal);

    voiceToggle.addEventListener('change', (e) => { voiceEnabled = e.target.checked; localStorage.setItem('tambolaVoiceEnabled', voiceEnabled.toString()); });
    voiceSelector.addEventListener('change', (e) => localStorage.setItem('tambolaVoiceURI', e.target.value));
    voiceSpeedSlider.addEventListener('input', (e) => { voiceSpeedValue.textContent = e.target.value; localStorage.setItem('tambolaVoiceSpeed', e.target.value); });
    voicePitchSlider.addEventListener('input', (e) => { voicePitchValue.textContent = e.target.value; localStorage.setItem('tambolaPitchSpeed', e.target.value); });

    calculateBtn.addEventListener('click', calculatePrizePool);
    addPrizeBtn.addEventListener('click', handleAddPrize);
    prizeListContainer.addEventListener('click', handlePrizeListEvents);
    prizeListContainer.addEventListener('change', handlePrizeListEvents);
    verifyBtn.addEventListener('click', verifyClaim);
    verifyResetBtn.addEventListener('click', resetVerification);
    autoDrawBtn.addEventListener('click', handleAutoDraw);
    window.addEventListener('resize', setupGameBoardLayout);

    // --- INITIAL LOAD ---
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    setupGameBoardLayout();
    loadSavedState();
});
