// --- DOM ELEMENTS ---
const headerTitle = document.getElementById('header-title');
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
let availableNumbers = [], calledNumbers = [], prizes = [], drawHistory = [];
let totalPrizePool = 0;
let calculationMode = 'auto', voiceEnabled = true;
let autoDrawIntervalId = null;

const defaultPrizes = [ { id: 'early_5', name: 'Early 5', weight: 1, claimed: false, winner: '', amount: '' }, { id: 'first_line', name: 'First Line', weight: 2, claimed: false, winner: '', amount: '' }, { id: 'second_line', name: 'Second Line', weight: 2, claimed: false, winner: '', amount: '' }, { id: 'third_line', name: 'Third Line', weight: 2, claimed: false, winner: '', amount: '' }, { id: 'corners', name: 'Corners', weight: 1, claimed: false, winner: '', amount: '' }, { id: 'full_housie', name: 'Full Housie', weight: 4, claimed: false, winner: '', amount: '' }];

function handleTabClick(event) {
    const clickedTab = event.target.closest('.tab-btn');
    if (!clickedTab) return;
    tabBar.querySelector('.active').classList.remove('active');
    clickedTab.classList.add('active');
    tabPanes.forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(clickedTab.dataset.target).classList.add('active');
}

function applyFont(font) { document.documentElement.style.setProperty('--main-font', font); }
function applyTheme(theme) { document.body.className = theme; }
function handleFontChange(event) { const selectedFont = event.target.value; applyFont(selectedFont); localStorage.setItem('tambolaFont', selectedFont); }
function handleThemeChange(event) { const selectedTheme = event.target.value; applyTheme(selectedTheme); localStorage.setItem('tambolaTheme', selectedTheme); }
function handleVoiceToggle(event) { voiceEnabled = event.target.checked; localStorage.setItem('tambolaVoiceEnabled', voiceEnabled); }
function handleModeChange(event) { calculationMode = event.target.value; localStorage.setItem('tambolaCalcMode', calculationMode); updateUIVisibility(); renderPrizes(); }
function updateUIVisibility() {
    const prizesCard = document.querySelector('.prizes-card');
    if (prizesCard) {
        if (calculationMode === 'auto') {
            manualTotalDisplay.style.display = 'none';
            prizesCard.classList.add('auto-mode');
            prizesCard.classList.remove('manual-mode');
        } else {
            manualTotalDisplay.style.display = 'block';
            prizesCard.classList.remove('auto-mode');
            prizesCard.classList.add('manual-mode');
        }
    }
}
function calculatePrizePool() { const entryFee = parseFloat(entryFeeInput.value) || 0; const ticketsSold = parseInt(ticketsSoldInput.value) || 0; if (entryFee <= 0 || ticketsSold <= 0) { alert("Please enter a valid entry fee and number of tickets."); return; } totalPrizePool = entryFee * ticketsSold; totalCollectionDisplay.innerHTML = `Total Prize Pool: <strong>₹${totalPrizePool}</strong>`; redistributeAndRender(); }
function handleAddPrize() { const name = newPrizeNameInput.value.trim(); if (name) { prizes.push({ id: Date.now().toString(), name, weight: 1, claimed: false, winner: '', amount: '' }); newPrizeNameInput.value = ''; if (calculationMode === 'auto') { redistributeAndRender(); } else { savePrizesAndRender(); } } }
function redistributeAndRender() { if (calculationMode === 'auto' && prizes.length > 0) { const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0); if (totalWeight > 0) { const valuePerWeight = totalPrizePool / totalWeight; prizes.forEach(p => p.amount = Math.round(p.weight * valuePerWeight)); } } savePrizesAndRender(); }
function updateManualTotal() { let manualTotal = 0; prizes.forEach(prize => { if (prize.amount && !isNaN(prize.amount)) { manualTotal += parseFloat(prize.amount); } }); manualTotalDisplay.textContent = `Total Prize Money: ₹${manualTotal}`; }
function renderPrizes() {
    prizeListContainer.innerHTML = '';
    if (prizes.length === 0) {
        prizeListContainer.innerHTML = `<p class="subtle-text" style="text-align:center;">Add a prize to begin.</p>`;
    }
    prizes.forEach(prize => {
        const item = document.createElement('div');
        item.className = 'prize-item';
        if (prize.claimed) item.classList.add('claimed');
        const isReadOnly = calculationMode === 'auto' ? 'readonly' : '';
        const isDisabled = prize.claimed ? 'disabled' : '';
        const claimBtnTxt = prize.claimed ? 'Unclaim' : 'Claim';
        const claimBtnClass = prize.claimed ? 'unclaim primary-btn' : '';

        item.innerHTML = `
            <span class="prize-name">${prize.name}</span>
            <div class="prize-details">
                <div class="weight-container" style="display: ${calculationMode === 'auto' ? 'flex' : 'none'};">
                    <label for="weight-${prize.id}">(W:</label>
                    <input type="number" id="weight-${prize.id}" data-id="${prize.id}" class="weight-input" value="${prize.weight}" min="1" ${isDisabled}>
                    <span>)</span>
                </div>
                <input type="number" data-id="${prize.id}" class="amount-input" value="${prize.amount}" placeholder="₹" ${isReadOnly} ${isDisabled}>
            </div>
            <div class="prize-actions">
                <button class="claim-btn ${claimBtnClass}" data-id="${prize.id}">${claimBtnTxt}</button>
                <button class="icon-btn-small duplicate-btn" data-id="${prize.id}" title="Duplicate Prize" ${isDisabled}>📋</button>
                <button class="icon-btn-small delete-btn" data-id="${prize.id}" title="Delete Prize" ${isDisabled}>🗑️</button>
            </div>
        `;
        prizeListContainer.appendChild(item);
    });
    if (calculationMode === 'manual') updateManualTotal();
    updateUIVisibility();
}
function handlePrizeListEvents(event) {
    const target = event.target.closest('button, input');
    if (!target) return;
    const prizeId = target.dataset.id;
    if (!prizeId) return;
    const prize = prizes.find(p => p.id === prizeId);
    if (!prize) return;

    if (target.classList.contains('claim-btn')) {
        prize.claimed = !prize.claimed;
        savePrizesAndRender();
    } else if (target.classList.contains('delete-btn') && !prize.claimed) {
        prizes = prizes.filter(p => p.id !== prizeId);
        if (calculationMode === 'auto') redistributeAndRender();
        else savePrizesAndRender();
    } else if (target.classList.contains('duplicate-btn') && !prize.claimed) {
        const index = prizes.findIndex(p => p.id === prizeId);
        const newPrize = { ...prize, id: Date.now().toString(), claimed: false, winner: '' };
        prizes.splice(index + 1, 0, newPrize);
        if (calculationMode === 'auto') redistributeAndRender();
        else savePrizesAndRender();
    } else if (target.classList.contains('weight-input') && !prize.claimed) {
        prize.weight = parseInt(target.value) || 1;
        if (calculationMode === 'auto') redistributeAndRender();
        else localStorage.setItem('tambolaPrizes', JSON.stringify(prizes));
    } else if (target.classList.contains('amount-input') && calculationMode === 'manual' && !prize.claimed) {
        prize.amount = target.value;
        localStorage.setItem('tambolaPrizes', JSON.stringify(prizes));
        updateManualTotal();
    }
}
function savePrizesAndRender() { localStorage.setItem('tambolaPrizes', JSON.stringify(prizes)); localStorage.setItem('tambolaPrizePool', totalPrizePool); renderPrizes(); }
function initializeGame() { stopAutoDraw(); if (synth.speaking) synth.cancel(); availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1); calledNumbers = []; drawHistory = []; currentNumberDisplay.textContent = '--'; calledNumbersList.innerHTML = ''; drawButton.disabled = false; undoButton.disabled = true; initializeBoard(); entryFeeInput.value = ''; ticketsSoldInput.value = ''; totalCollectionDisplay.innerHTML = ''; totalPrizePool = 0; prizes = JSON.parse(JSON.stringify(defaultPrizes)); localStorage.clear(); calculationMode = 'auto'; document.getElementById('auto-mode').checked = true; updateUIVisibility(); renderPrizes(); resetVerification(); }
function loadSavedState() { 
    const savedPrizes = JSON.parse(localStorage.getItem('tambolaPrizes')); 
    const savedPool = parseFloat(localStorage.getItem('tambolaPrizePool')); 
    const savedMode = localStorage.getItem('tambolaCalcMode'); 
    const savedFont = localStorage.getItem('tambolaFont'); 
    const savedTheme = localStorage.getItem('tambolaTheme'); 
    const savedVoice = localStorage.getItem('tambolaVoiceEnabled'); 
    
    prizes = savedPrizes || JSON.parse(JSON.stringify(defaultPrizes)); 
    if (savedPool) totalPrizePool = savedPool; 
    
    if (savedMode) { 
        calculationMode = savedMode; 
        document.getElementById(savedMode + '-mode').checked = true; 
    } else {
        calculationMode = 'auto';
        document.getElementById('auto-mode').checked = true;
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
        initializeBoard(); 
        calledNumbers.forEach(num => { const cell = document.getElementById(`cell-${num}`); if (cell) cell.classList.add('called'); }); 
        updateCalledNumbersList(); 
        currentNumberDisplay.textContent = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--'; 
        drawButton.disabled = availableNumbers.length === 0; 
        undoButton.disabled = drawHistory.length === 0; 
    } else { 
        initializeBoard(); 
    } 
}
function initializeBoard() { board.innerHTML = ''; for (let i = 0; i < 9; i++) { const row = board.insertRow(); for (let j = 1; j <= 10; j++) { const num = i * 10 + j; const cell = row.insertCell(); cell.textContent = num; cell.id = `cell-${num}`; } } }
function drawNumber() { if (availableNumbers.length === 0) { stopAutoDraw(); return; } const i = Math.floor(Math.random() * availableNumbers.length); const num = availableNumbers.splice(i, 1)[0]; calledNumbers.push(num); drawHistory.push(num); currentNumberDisplay.textContent = num; document.getElementById(`cell-${num}`).classList.add('called'); updateCalledNumbersList(); undoButton.disabled = false; if (voiceEnabled) { if (synth.speaking) synth.cancel(); const u = new SpeechSynthesisUtterance(num.toString()); u.lang = 'en-IN'; u.rate = 0.9; synth.speak(u); } if (availableNumbers.length === 0) { currentNumberDisplay.textContent = 'End'; drawButton.disabled = true; stopAutoDraw(); } saveGameState(); }
function undoLastNumber() { stopAutoDraw(); if (drawHistory.length === 0) return; const lastNumber = drawHistory.pop(); calledNumbers = calledNumbers.filter(n => n !== lastNumber); availableNumbers.push(lastNumber); document.getElementById(`cell-${lastNumber}`).classList.remove('called'); updateCalledNumbersList(); const newLast = drawHistory.length > 0 ? drawHistory[drawHistory.length - 1] : '--'; currentNumberDisplay.textContent = newLast; if (drawHistory.length === 0) undoButton.disabled = true; drawButton.disabled = false; saveGameState(); }
function verifyClaim() { const numbersText = verifyNumbersInput.value; const numbersToVerify = numbersText.match(/\d+/g); verifyResultDiv.innerHTML = ''; if (!numbersToVerify || numbersToVerify.length === 0) { verifyResultDiv.innerHTML = '<p class="subtle-text">Please enter some numbers to verify.</p>'; return; } let allCalled = true; let resultHTML = '<h4>Verification Result:</h4>'; numbersToVerify.forEach(numStr => { const num = parseInt(numStr); let statusClass = 'not-called'; let statusText = '(Not Called)'; if (calledNumbers.includes(num)) { statusClass = 'called'; statusText = '(Called)'; } else { allCalled = false; } resultHTML += `<span class="num ${statusClass}">${num} ${statusText}</span>`; }); let finalMessage = allCalled ? '<h4 style="color: var(--success-color);">✔️ VALID CLAIM!</h4>' : '<h4 style="color: var(--error-color);">❌ INVALID CLAIM!</h4>'; verifyResultDiv.innerHTML = finalMessage + resultHTML; }
function resetVerification() { verifyNumbersInput.value = ''; verifyResultDiv.innerHTML = ''; }
function updateCalledNumbersList() {
    calledNumbersList.innerHTML = '';
    // Shows numbers in the order they were drawn
    calledNumbers.forEach(num => {
        const s = document.createElement('span');
        s.textContent = num;
        calledNumbersList.appendChild(s);
    });
}
function saveGameState() { localStorage.setItem('calledNumbers', JSON.stringify(calledNumbers)); localStorage.setItem('availableNumbers', JSON.stringify(availableNumbers)); localStorage.setItem('drawHistory', JSON.stringify(drawHistory)); }
function handleAutoDraw() {
    if (autoDrawIntervalId) {
        stopAutoDraw();
    } else {
        const time = parseInt(autoDrawTimeInput.value) * 1000;
        if (isNaN(time) || time < 2000) { alert('Please enter an interval of 2 seconds or more.'); return; }
        autoDrawIntervalId = setInterval(drawNumber, time);
        autoDrawBtn.textContent = 'Pause Auto-Draw';
        autoDrawBtn.classList.add('danger-btn');
        drawButton.disabled = true;
    }
}
function stopAutoDraw() {
    clearInterval(autoDrawIntervalId);
    autoDrawIntervalId = null;
    autoDrawBtn.textContent = 'Start Auto-Draw';
    autoDrawBtn.classList.remove('danger-btn');
    if (availableNumbers.length > 0) {
        drawButton.disabled = false;
    }
}

// --- EVENT LISTENERS ---
fontSelector.addEventListener('change', handleFontChange);
themeSelector.addEventListener('change', handleThemeChange);
voiceToggle.addEventListener('change', handleVoiceToggle);
calculateBtn.addEventListener('click', calculatePrizePool);
addPrizeBtn.addEventListener('click', handleAddPrize);
drawButton.addEventListener('click', drawNumber);
undoButton.addEventListener('click', undoLastNumber);
resetButton.addEventListener('click', initializeGame);
verifyBtn.addEventListener('click', verifyClaim);
verifyResetBtn.addEventListener('click', resetVerification);
prizeListContainer.addEventListener('click', handlePrizeListEvents);
prizeListContainer.addEventListener('input', handlePrizeListEvents);
modeSelectors.forEach(radio => radio.addEventListener('change', handleModeChange));
tabBar.addEventListener('click', handleTabClick);
autoDrawBtn.addEventListener('click', handleAutoDraw);

// --- INITIAL LOAD ---
loadSavedState();
