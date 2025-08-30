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
    const autoDrawTimeInput = document.getElementById('auto-draw-time');
    const autoDrawTimeValue = document.getElementById('auto-draw-time-value');
    const voiceSpeedSlider = document.getElementById('voice-speed');
    const voiceSpeedValue = document.getElementById('voice-speed-value');
    const voicePitchSlider = document.getElementById('voice-pitch');
    const voicePitchValue = document.getElementById('voice-pitch-value');
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const historyModalBackdrop = document.getElementById('history-modal-backdrop');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const historyListContainer = document.getElementById('history-list-container');
    const desktopCalledNumbersList = document.getElementById('called-numbers-list');
    const autoDrawToggle = document.getElementById('auto-draw-toggle');

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
        { id: 'fh1', name: 'Full Housie (1)', claimed: false, amount: 0 }
    ];

    // --- CORE LOGIC ---
    function handleTabClick(event) {
        const clickedTab = event.target.closest('.tab-btn');
        if (!clickedTab) return;
        if (autoDrawIntervalId && clickedTab.dataset.target !== 'game-pane') stopAutoDraw();
        
        document.querySelector('.tab-pane.active')?.classList.remove('active');
        document.querySelector('.tab-btn.active')?.classList.remove('active');
        clickedTab.classList.add('active');
        document.getElementById(clickedTab.dataset.target).classList.add('active');
    }
    
    function populateVoiceList() {
        voices = synth.getVoices().filter(v => v.lang.startsWith('en') || v.lang.startsWith('te'));
        const selectedVoiceURI = localStorage.getItem('tambolaVoiceURI');
        voiceSelector.innerHTML = '';
        if (voices.length === 0) {
            voiceSelector.innerHTML = '<option>No voices found</option>';
            return;
        }
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.voiceURI === selectedVoiceURI) option.selected = true;
            voiceSelector.appendChild(option);
        });
    }

    // --- PRIZE FUNCTIONS ---
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
                    <input type="text" inputmode="numeric" class="amount-input" data-id="${prize.id}" value="${prize.amount}" placeholder="₹" ${isDisabled}>
                    <button class="claim-btn primary-btn ${claimBtnClass}" data-id="${prize.id}">${claimBtnTxt}</button>
                    <button class="icon-btn" data-action="duplicate" data-id="${prize.id}" title="Duplicate Prize" ${isDisabled}>📋</button>
                    <button class="icon-btn" data-action="delete" data-id="${prize.id}" title="Delete Prize" ${isDisabled}>🗑️</button>
                </div>`;
            prizeListContainer.appendChild(item);
        });
        updateTotalPrizeMoney();
    }

    function updateTotalPrizeMoney() {
        const totalPrizeMoney = prizes.reduce((total, p) => total + (parseFloat(p.amount) || 0), 0);
        prizesTotalBanner.textContent = `Total Prize Money: ₹${totalPrizeMoney}`;
    }

    function handlePrizeClick(event) {
        const target = event.target.closest('button');
        if (!target || !target.dataset.id) return;

        const id = target.dataset.id;
        let prize = prizes.find(p => p.id === id);
        if (!prize) return;

        if (target.classList.contains('claim-btn')) prize.claimed = !prize.claimed;
        if (target.dataset.action === 'delete') {
            if (confirm(`Delete '${prize.name}'?`)) prizes = prizes.filter(p => p.id !== id);
        }
        if (target.dataset.action === 'duplicate') {
            const baseName = prize.name.replace(/ \(\d+\)$/, '');
            const count = prizes.filter(p => p.name.startsWith(baseName)).length;
            const newPrize = { ...prize, id: Date.now().toString(), name: `${baseName} (${count + 1})`, claimed: false };
            prizes.push(newPrize);
        }
        savePrizesAndRender();
    }

    function handlePrizeInput(event) {
        const target = event.target;
        if (!target.classList.contains('amount-input')) return;

        const id = target.dataset.id;
        let prize = prizes.find(p => p.id === id);
        if (prize) {
            prize.amount = parseFloat(target.value) || 0;
            updateTotalPrizeMoney();
            localStorage.setItem('tambolaPrizes', JSON.stringify(prizes));
        }
    }
    
    // --- GAME FUNCTIONS ---
    function initializeBoard() {
        board.innerHTML = '';
        let row;
        for (let i = 1; i <= 90; i++) {
            if ((i - 1) % 10 === 0) row = board.insertRow();
            const cell = row.insertCell();
            cell.textContent = i;
            cell.dataset.number = i;
            if (calledNumbers.includes(i)) cell.classList.add('called');
        }
    }

    function updateBoard(number, action = 'add') {
        const cell = board.querySelector(`[data-number="${number}"]`);
        if (cell) {
            if (action === 'add') {
                cell.classList.add('called', 'just-called');
                setTimeout(() => cell.classList.remove('just-called'), 600);
            } else {
                cell.classList.remove('called');
            }
        }
    }
    
    function drawNumber() {
        if (availableNumbers.length === 0) {
            stopAutoDraw();
            return alert("All numbers have been called!");
        }
        const i = Math.floor(Math.random() * availableNumbers.length);
        const num = availableNumbers.splice(i, 1)[0];
        calledNumbers.push(num);
        drawHistory.push(num);
        currentNumberDisplay.textContent = num;
        updateBoard(num, 'add');
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
        availableNumbers.sort((a, b) => a - b);
        updateBoard(lastNumber, 'remove');
        currentNumberDisplay.textContent = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--';
        if (drawHistory.length === 0) {
            undoButton.disabled = true;
            repeatButton.disabled = true;
        }
        updateCalledNumbersList();
        saveGameState();
    }

    function updateCalledNumbersList() {
        desktopCalledNumbersList.innerHTML = '';
        drawHistory.slice(-5).reverse().forEach(num => {
            const s = document.createElement('span');
            s.textContent = num;
            desktopCalledNumbersList.appendChild(s);
        });
    }

    function openHistoryModal() {
        historyListContainer.innerHTML = '';
        if (drawHistory.length === 0) {
            historyListContainer.textContent = 'No numbers have been called yet.';
        } else {
            drawHistory.forEach(num => {
                const s = document.createElement('span');
                s.textContent = num;
                historyListContainer.appendChild(s);
            });
        }
        historyModal.classList.add('active');
        historyModalBackdrop.classList.add('active');
    }
    
    function closeHistoryModal() {
        historyModal.classList.remove('active');
        historyModalBackdrop.classList.remove('active');
    }

    // --- AUTO-DRAW ---
    function handleAutoDrawToggle() {
        if (autoDrawToggle.checked) {
            const time = parseInt(autoDrawTimeInput.value) || 5;
            autoDrawIntervalId = setInterval(drawNumber, time * 1000);
            drawButton.disabled = true;
        } else {
            stopAutoDraw();
        }
    }
    
    function stopAutoDraw() {
        clearInterval(autoDrawIntervalId);
        autoDrawIntervalId = null;
        autoDrawToggle.checked = false;
        if(drawButton) {
            drawButton.disabled = availableNumbers.length === 0;
        }
    }

    // --- OTHER CORE FUNCTIONS ---
    function savePrizesAndRender() { localStorage.setItem('tambolaPrizes', JSON.stringify(prizes)); renderPrizes(); }
    function saveGameState() { localStorage.setItem('calledNumbers', JSON.stringify(calledNumbers)); localStorage.setItem('availableNumbers', JSON.stringify(availableNumbers)); localStorage.setItem('drawHistory', JSON.stringify(drawHistory)); }
    function speakNumber(num) { 
        if (!voiceEnabled) return; 
        if(synth.speaking) synth.cancel(); 
        const u = new SpeechSynthesisUtterance(num.toString());
        const selectedVoiceURI = voiceSelector.value || localStorage.getItem('tambolaVoiceURI');
        const selectedVoice = voices.find(voice => voice.voiceURI === selectedVoiceURI);
        if (selectedVoice) u.voice = selectedVoice;
        u.rate = parseFloat(voiceSpeedSlider.value);
        u.pitch = parseFloat(voicePitchSlider.value);
        synth.speak(u); 
    }

    // --- INIT & LOAD ---
    function initializeGame() {
        if (!confirm("Are you sure? This will reset the entire game, including prizes.")) return;
        stopAutoDraw();
        if(synth.speaking) synth.cancel();
        
        availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        calledNumbers = [];
        drawHistory = [];
        prizes = JSON.parse(JSON.stringify(defaultPrizes));
        localStorage.clear();
        
        currentNumberDisplay.textContent = '--';
        updateCalledNumbersList();
        drawButton.disabled = false;
        undoButton.disabled = true;
        repeatButton.disabled = true;
        entryFeeInput.value = '';
        ticketsSoldInput.value = '';
        totalCollectionDisplay.textContent = 'Total Prize Pool: ₹0';
        
        initializeBoard();
        renderPrizes();
        resetVerification();
    }

    function loadSavedState() {
        prizes = JSON.parse(localStorage.getItem('tambolaPrizes')) || JSON.parse(JSON.stringify(defaultPrizes));
        if (localStorage.getItem('calledNumbers')) {
            calledNumbers = JSON.parse(localStorage.getItem('calledNumbers'));
            availableNumbers = JSON.parse(localStorage.getItem('availableNumbers'));
            drawHistory = JSON.parse(localStorage.getItem('drawHistory'));
        } else {
            availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        }
        currentNumberDisplay.textContent = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--';
        undoButton.disabled = drawHistory.length === 0;
        repeatButton.disabled = drawHistory.length === 0;
        
        const savedVoiceEnabled = localStorage.getItem('tambolaVoiceEnabled');
        voiceEnabled = savedVoiceEnabled !== null ? savedVoiceEnabled === 'true' : true;
        voiceToggle.checked = voiceEnabled;
        
        initializeBoard();
        updateCalledNumbersList();
        renderPrizes();
    }
    function resetVerification() { verifyNumbersInput.value = ''; verifyResultDiv.innerHTML = '';}

    // --- EVENT LISTENERS ---
    drawButton.addEventListener('click', drawNumber);
    resetButton.addEventListener('click', initializeGame);
    undoButton.addEventListener('click', undoLastNumber);
    repeatButton.addEventListener('click', () => { if (drawHistory.length > 0) speakNumber(drawHistory[drawHistory.length - 1]); });
    tabBar.addEventListener('click', handleTabClick);
    historyBtn.addEventListener('click', openHistoryModal);
    modalCloseBtn.addEventListener('click', closeHistoryModal);
    historyModalBackdrop.addEventListener('click', closeHistoryModal);
    autoDrawToggle.addEventListener('change', handleAutoDrawToggle);
    prizeListContainer.addEventListener('click', handlePrizeClick);
    prizeListContainer.addEventListener('input', handlePrizeInput);
    calculateBtn.addEventListener('click', () => { const total = (entryFeeInput.value || 0) * (ticketsSoldInput.value || 0); totalCollectionDisplay.textContent = `Total Prize Pool: ₹${total}`; });
    addPrizeBtn.addEventListener('click', () => { const name = newPrizeNameInput.value.trim(); if (name) { prizes.push({ id: Date.now().toString(), name, claimed: false, amount: 0 }); newPrizeNameInput.value = ''; savePrizesAndRender(); } });
    verifyBtn.addEventListener('click', () => { /* verify logic */ });
    verifyResetBtn.addEventListener('click', resetVerification);
    autoDrawTimeInput.addEventListener('input', e => { autoDrawTimeValue.textContent = e.target.value; localStorage.setItem('tambolaAutoDrawTime', e.target.value); });
    voiceToggle.addEventListener('change', e => { voiceEnabled = e.target.checked; localStorage.setItem('tambolaVoiceEnabled', voiceEnabled.toString()); });
    themeSelector.addEventListener('change', e => { document.body.className = e.target.value; localStorage.setItem('tambolaTheme', e.target.value); });
    fontSelector.addEventListener('change', e => { document.documentElement.style.setProperty('--main-font', e.target.value); localStorage.setItem('tambolaFont', e.target.value); });
    
    // --- INITIAL LOAD ---
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    loadSavedState();
});
