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
    const autoDrawToggle = document.getElementById('auto-draw-toggle');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');

    // Add this code at the end of your DOMContentLoaded event handler in script.js

// Fix for persistent history modal
document.addEventListener('DOMContentLoaded', function() {
    // Ensure modals are hidden initially
    const historyModal = document.getElementById('history-modal');
    const historyModalBackdrop = document.getElementById('history-modal-backdrop');
    
    if (historyModal) {
        historyModal.classList.remove('active');
    }
    if (historyModalBackdrop) {
        historyModalBackdrop.classList.remove('active');
    }
    
    // Ensure all tab buttons use consistent styling
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.setAttribute('role', 'tab');
        const targetId = button.dataset.target;
        button.setAttribute('aria-controls', targetId);
        button.id = targetId.replace('-pane', '-tab');
        
        if (button.classList.contains('active')) {
            button.setAttribute('aria-selected', 'true');
        } else {
            button.setAttribute('aria-selected', 'false');
        }
    });
    
    // Add keyboard shortcuts info to settings if not already present
    if (!document.querySelector('.shortcuts-list') && document.querySelector('.settings-grid')) {
        const keyboardShortcutsInfo = `
        <div class="setting-item">
            <h3>Keyboard Shortcuts</h3>
            <div class="shortcuts-list">
                <p><strong>Space or D</strong>: Draw number</p>
                <p><strong>U</strong>: Undo last number</p>
                <p><strong>R</strong>: Repeat last number</p>
                <p><strong>H</strong>: Show history</p>
                <p><strong>V</strong>: Verify (on verify tab)</p>
                <p><strong>1-4</strong>: Switch tabs</p>
            </div>
        </div>`;
        document.querySelector('.settings-grid').insertAdjacentHTML('beforeend', keyboardShortcutsInfo);
    }
    
    // Add high contrast toggle if not already present
    if (!document.getElementById('high-contrast-toggle') && document.querySelector('.settings-grid')) {
        const highContrastToggleHtml = `
        <div class="setting-item toggle-control">
            <label for="high-contrast-toggle">High Contrast Mode</label>
            <label class="switch">
                <input type="checkbox" id="high-contrast-toggle">
                <span class="slider round"></span>
            </label>
        </div>`;
        document.querySelector('.settings-grid').insertAdjacentHTML('beforeend', highContrastToggleHtml);
        
        // Set up high contrast toggle
        const highContrastToggle = document.getElementById('high-contrast-toggle');
        if (highContrastToggle) {
            highContrastToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('high-contrast');
                    localStorage.setItem('tambolaHighContrast', 'true');
                } else {
                    document.body.classList.remove('high-contrast');
                    localStorage.setItem('tambolaHighContrast', 'false');
                }
            });
            
            // Load high contrast setting
            if (localStorage.getItem('tambolaHighContrast') === 'true') {
                document.body.classList.add('high-contrast');
                highContrastToggle.checked = true;
            }
        }
    }
    
    // Fix verification results styling
    const verifyBtn = document.getElementById('verify-btn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => {
            const verifyNumbersInput = document.getElementById('verify-numbers');
            const verifyResultDiv = document.getElementById('verify-result');
            
            if (!verifyNumbersInput || !verifyResultDiv) return;
            
            // Remove previous animation classes
            verifyResultDiv.classList.remove('verify-success', 'verify-error');
            
            const numbersToVerify = verifyNumbersInput.value.trim().split(/[\s,]+/).filter(Boolean).map(Number);
            
            if (numbersToVerify.length === 0) {
                verifyResultDiv.textContent = 'Please enter some numbers to verify.';
                verifyResultDiv.style.color = 'var(--danger-color)';
                verifyResultDiv.classList.add('verify-error');
                return;
            }
            
            // The rest of the verification logic will be handled by your existing event listener
        }, { once: true });
    }
    
    // Fix tab switching to ensure consistent UI update
    const tabBarContainer = document.querySelector('.tab-bar');
    if (tabBarContainer) {
        tabBarContainer.addEventListener('click', (event) => {
            const clickedTab = event.target.closest('.tab-btn');
            if (!clickedTab) return;
            
            // Update ARIA attributes
            document.querySelectorAll('.tab-btn').forEach(tab => {
                tab.setAttribute('aria-selected', 'false');
            });
            clickedTab.setAttribute('aria-selected', 'true');
            
            // Hide any open modals when switching tabs
            if (historyModal && historyModal.classList.contains('active')) {
                historyModal.classList.remove('active');
                historyModalBackdrop.classList.remove('active');
            }
        });
    }
});

// Additional keyboard shortcuts (add to your existing keyboard shortcuts handling)
document.addEventListener('keydown', (event) => {
    // Close history modal with Escape key
    if (event.key === 'Escape') {
        const historyModal = document.getElementById('history-modal');
        const historyModalBackdrop = document.getElementById('history-modal-backdrop');
        
        if (historyModal && historyModal.classList.contains('active')) {
            historyModal.classList.remove('active');
            historyModalBackdrop.classList.remove('active');
        }
    }
});

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

    function applyFont(font) { document.documentElement.style.setProperty('--main-font', font); }
    function applyTheme(theme) { document.body.className = theme; }

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
                    <input type="text" inputmode="numeric" pattern="[0-9]*\.?[0-9]*" class="amount-input" data-id="${prize.id}" value="${prize.amount}" placeholder="₹" ${isDisabled}>
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
            let maxNum = 0;
            // Find the highest number among existing duplicates
            prizes.forEach(p => {
                if (p.name.startsWith(baseName)) {
                    const match = p.name.match(/ \((\d+)\)$/);
                    if (match) {
                        const num = parseInt(match[1]);
                        if (num > maxNum) maxNum = num;
                    }
                }
            });
            // If the original has no number, its implicit number is 1
            if (maxNum === 0 && prizes.some(p => p.name === baseName)) {
                maxNum = 1;
            }

            const newPrize = { ...prize, id: Date.now().toString(), name: `${baseName} (${maxNum + 1})`, claimed: false };
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
                cell.classList.add('called');
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
        currentNumberDisplay.classList.add('shake-animation');
        currentNumberDisplay.addEventListener('animationend', () => {
            currentNumberDisplay.classList.remove('shake-animation');
        }, { once: true });
        updateBoard(num, 'add');
        updateProgressTracker();
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
        updateProgressTracker();
        saveGameState();
    }
    
    function updateProgressTracker() {
        const calledCount = calledNumbers.length;
        progressText.textContent = `${calledCount} / 90 Numbers Called`;
        progressBar.value = calledCount;
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

    function initializeGame() {
        if (!confirm("Are you sure? This will reset the entire game, including prizes.")) return;
        stopAutoDraw();
        if(synth.speaking) synth.cancel();

        availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        calledNumbers = [];
        drawHistory = [];
        prizes = JSON.parse(JSON.stringify(defaultPrizes));

        // Targeted removal instead of clearing all storage
        localStorage.removeItem('calledNumbers');
        localStorage.removeItem('availableNumbers');
        localStorage.removeItem('drawHistory');
        localStorage.removeItem('tambolaPrizes');
            
        currentNumberDisplay.textContent = '--';
        drawButton.disabled = false;
        undoButton.disabled = true;
        repeatButton.disabled = true;
        entryFeeInput.value = '';
        ticketsSoldInput.value = '';
        totalCollectionDisplay.textContent = 'Total Prize Pool: ₹0';
        
        initializeBoard();
        renderPrizes();
        resetVerification();
        updateProgressTracker();
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
        
        const savedFont = localStorage.getItem('tambolaFont') || '"Poppins", sans-serif';
        applyFont(savedFont);
        fontSelector.value = savedFont;
        
        const savedTheme = localStorage.getItem('tambolaTheme') || 'theme-light';
        applyTheme(savedTheme);
        themeSelector.value = savedTheme;
        
        const savedVoiceEnabled = localStorage.getItem('tambolaVoiceEnabled');
        voiceEnabled = savedVoiceEnabled !== null ? savedVoiceEnabled === 'true' : true;
        voiceToggle.checked = voiceEnabled;
        
        const savedAutoDrawTime = localStorage.getItem('tambolaAutoDrawTime') || '5';
        autoDrawTimeInput.value = savedAutoDrawTime;
        autoDrawTimeValue.textContent = savedAutoDrawTime;

        const savedVoiceSpeed = localStorage.getItem('tambolaVoiceSpeed') || '0.9';
        voiceSpeedSlider.value = savedVoiceSpeed;
        voiceSpeedValue.textContent = savedVoiceSpeed;

        const savedVoicePitch = localStorage.getItem('tambolaVoicePitch') || '1.0';
        voicePitchSlider.value = savedVoicePitch;
        voicePitchValue.textContent = savedVoicePitch;
        
        // Load high contrast if enabled
        if (localStorage.getItem('tambolaHighContrast') === 'true') {
            document.body.classList.add('high-contrast');
            if (document.getElementById('high-contrast-toggle')) {
                document.getElementById('high-contrast-toggle').checked = true;
            }
        }
        
        initializeBoard();
        renderPrizes();
        updateProgressTracker();
    }

    function resetVerification() { verifyNumbersInput.value = ''; verifyResultDiv.innerHTML = '';}

    // --- KEYBOARD SHORTCUTS ---
    document.addEventListener('keydown', (event) => {
        // Don't trigger shortcuts if user is typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(event.key) {
            // Space or D for drawing number
            case ' ':
            case 'd':
            case 'D':
                if (!drawButton.disabled && document.getElementById('game-pane').classList.contains('active')) {
                    drawNumber();
                    event.preventDefault();
                }
                break;
                
            // U for undoing last number
            case 'u':
            case 'U':
                if (!undoButton.disabled && document.getElementById('game-pane').classList.contains('active')) {
                    undoLastNumber();
                    event.preventDefault();
                }
                break;
                
            // R for repeating last number
            case 'r':
            case 'R':
                if (!repeatButton.disabled && document.getElementById('game-pane').classList.contains('active')) {
                    if (drawHistory.length > 0) speakNumber(drawHistory[drawHistory.length - 1]);
                    event.preventDefault();
                }
                break;
                
            // H for history
            case 'h':
            case 'H':
                if (document.getElementById('game-pane').classList.contains('active')) {
                    openHistoryModal();
                    event.preventDefault();
                }
                break;
                
            // V for verify (when on verify tab)
            case 'v':
            case 'V':
                if (document.getElementById('verify-pane').classList.contains('active')) {
                    document.getElementById('verify-btn').click();
                    event.preventDefault();
                }
                break;
                
            // Number keys 1-4 for tab switching
            case '1':
                document.querySelector('.tab-btn[data-target="setup-pane"]').click();
                event.preventDefault();
                break;
            case '2':
                document.querySelector('.tab-btn[data-target="game-pane"]').click();
                event.preventDefault();
                break;
            case '3':
                document.querySelector('.tab-btn[data-target="verify-pane"]').click();
                event.preventDefault();
                break;
            case '4':
                document.querySelector('.tab-btn[data-target="settings-pane"]').click();
                event.preventDefault();
                break;
        }
    });

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
    
    // Updated verification with animation
    verifyBtn.addEventListener('click', () => {
        const numbersToVerify = verifyNumbersInput.value.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        
        // Remove previous animation classes
        verifyResultDiv.classList.remove('verify-success', 'verify-error');
        
        if (numbersToVerify.length === 0) {
            verifyResultDiv.textContent = 'Please enter some numbers to verify.';
            verifyResultDiv.style.color = 'var(--danger-color)';
            verifyResultDiv.classList.add('verify-error');
            return;
        }

        const notCalled = numbersToVerify.filter(num => !calledNumbers.includes(num));

        if (notCalled.length === 0) {
            verifyResultDiv.innerHTML = '✅ <strong>VALID!</strong> All numbers have been called.';
            verifyResultDiv.style.color = 'var(--success-color)';
            verifyResultDiv.classList.add('verify-success');
        } else {
            verifyResultDiv.innerHTML = `❌ <strong>INVALID!</strong> The following numbers have not been called yet: <br><strong>${notCalled.join(', ')}</strong>`;
            verifyResultDiv.style.color = 'var(--danger-color)';
            verifyResultDiv.classList.add('verify-error');
        }
    });
    
    verifyResetBtn.addEventListener('click', resetVerification);
    autoDrawTimeInput.addEventListener('input', e => { autoDrawTimeValue.textContent = e.target.value; localStorage.setItem('tambolaAutoDrawTime', e.target.value); });
    voiceToggle.addEventListener('change', e => { voiceEnabled = e.target.checked; localStorage.setItem('tambolaVoiceEnabled', voiceEnabled.toString()); });
    themeSelector.addEventListener('change', e => { applyTheme(e.target.value); localStorage.setItem('tambolaTheme', e.target.value); });
    fontSelector.addEventListener('change', e => { applyFont(e.target.value); localStorage.setItem('tambolaFont', e.target.value); });
    voiceSelector.addEventListener('change', e => localStorage.setItem('tambolaVoiceURI', e.target.value));
    voiceSpeedSlider.addEventListener('input', e => { voiceSpeedValue.textContent = e.target.value; localStorage.setItem('tambolaVoiceSpeed', e.target.value); });
    voicePitchSlider.addEventListener('input', e => { voicePitchValue.textContent = e.target.value; localStorage.setItem('tambolaVoicePitch', e.target.value); });
    
    // Add high contrast toggle to settings
    const accessibilitySettingHtml = `
    <div class="setting-item toggle-control">
        <label for="high-contrast-toggle">High Contrast Mode</label>
        <label class="switch">
            <input type="checkbox" id="high-contrast-toggle">
            <span class="slider round"></span>
        </label>
    </div>
    
    <div class="setting-item">
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcuts-list">
            <p><strong>Space or D</strong>: Draw number</p>
            <p><strong>U</strong>: Undo last number</p>
            <p><strong>R</strong>: Repeat last number</p>
            <p><strong>H</strong>: Show history</p>
            <p><strong>V</strong>: Verify (on verify tab)</p>
            <p><strong>1-4</strong>: Switch tabs</p>
        </div>
    </div>`;
    
    document.querySelector('.settings-grid').insertAdjacentHTML('beforeend', accessibilitySettingHtml);
    
    // Set up high contrast toggle
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    if (highContrastToggle) {
        highContrastToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('high-contrast');
                localStorage.setItem('tambolaHighContrast', 'true');
            } else {
                document.body.classList.remove('high-contrast');
                localStorage.setItem('tambolaHighContrast', 'false');
            }
        });
        
        // Load high contrast setting
        if (localStorage.getItem('tambolaHighContrast') === 'true') {
            document.body.classList.add('high-contrast');
            highContrastToggle.checked = true;
        }
    }
    
    // --- INITIAL LOAD ---
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    loadSavedState();
});

// Add this function to your script.js file

/**
 * Ensures prize inputs only accept numeric values
 */
function setupPrizeInputValidation() {
    // Function to validate and format numeric input
    function validateNumericInput(input) {
        // Replace any non-numeric characters except decimal point
        let value = input.value.replace(/[^\d.]/g, '');
        
        // Ensure only one decimal point exists
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Update the input with cleaned value
        input.value = value;
        
        // Update the prize amount in the prizes array
        const id = input.dataset.id;
        if (id) {
            const prize = prizes.find(p => p.id === id);
            if (prize) {
                prize.amount = parseFloat(value) || 0;
                updateTotalPrizeMoney();
                localStorage.setItem('tambolaPrizes', JSON.stringify(prizes));
            }
        }
    }
    
    // Add event listener to prize list container for dynamic inputs
    prizeListContainer.addEventListener('input', function(event) {
        if (event.target.classList.contains('amount-input')) {
            validateNumericInput(event.target);
        }
    });
    
    // Handle paste events to clean pasted content
    prizeListContainer.addEventListener('paste', function(event) {
        if (event.target.classList.contains('amount-input')) {
            // Allow paste to happen, then clean it up
            setTimeout(() => validateNumericInput(event.target), 0);
        }
    });
}

// Call this function when DOM is loaded, after other initializations
document.addEventListener('DOMContentLoaded', function() {
    // Your existing code...
    
    // Add this line at the end of your initialization
    setupPrizeInputValidation();

    
});

document.addEventListener('DOMContentLoaded', function() {
    // ===== NUMERIC INPUT VALIDATION =====
    
    // Function to clean and format numeric input
    function cleanNumericInput(input) {
        // Get current cursor position before changing value
        const cursorPos = input.selectionStart;
        const oldValue = input.value;
        
        // Replace any non-numeric characters except decimal point
        let value = input.value.replace(/[^\d.]/g, '');
        
        // Ensure only one decimal point exists
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Update the input value only if it changed
        if (value !== oldValue) {
            input.value = value;
            
            // Adjust cursor position if value was modified
            const posDiff = value.length - oldValue.length;
            input.setSelectionRange(Math.max(0, cursorPos + posDiff), Math.max(0, cursorPos + posDiff));
        }
        
        return value;
    }
    
    // Apply numeric validation to specific inputs
    const entryFeeInput = document.getElementById('entry-fee');
    const ticketsSoldInput = document.getElementById('tickets-sold');
    
    // Add event listeners to main numeric fields
    if (entryFeeInput) {
        entryFeeInput.addEventListener('input', function() {
            cleanNumericInput(this);
        });
    }
    
    if (ticketsSoldInput) {
        ticketsSoldInput.addEventListener('input', function() {
            cleanNumericInput(this);
        });
    }
    
    // Use event delegation for prize amount fields (which are dynamically created)
    document.addEventListener('input', function(e) {
        if (e.target && e.target.classList.contains('amount-input')) {
            const value = cleanNumericInput(e.target);
            
            // Update prize amount in the prizes array
            const id = e.target.dataset.id;
            if (id) {
                const prize = prizes.find(p => p.id === id);
                if (prize) {
                    prize.amount = parseFloat(value) || 0;
                    updateTotalPrizeMoney();
                    localStorage.setItem('tambolaPrizes', JSON.stringify(prizes));
                }
            }
        }
    });
    
    // Handle paste events
    document.addEventListener('paste', function(e) {
        if (e.target && (e.target.classList.contains('amount-input') || 
                         e.target.id === 'entry-fee' || 
                         e.target.id === 'tickets-sold')) {
            // Wait for paste to complete then clean the input
            setTimeout(() => cleanNumericInput(e.target), 0);
        }
    });
    
    // ===== MODIFY RENDERPRIZES FUNCTION =====
    // Store original function reference if it exists
    const originalRenderPrizes = window.renderPrizes;
    
    // Replace with enhanced version
    window.renderPrizes = function() {
        if (originalRenderPrizes && typeof originalRenderPrizes === 'function') {
            // Call the original function first
            originalRenderPrizes();
        } else {
            // If no original function exists, use default implementation
            prizeListContainer.innerHTML = '';
            prizes.forEach(prize => {
                const item = document.createElement('div');
                item.className = 'prize-item';
                if (prize.claimed) item.classList.add('claimed');
                const isDisabled = prize.claimed ? 'disabled' : '';
                const claimBtnTxt = prize.claimed ? 'Unclaim' : 'Claim';
                const prizeNameDisplay = prize.claimed ? `${prize.name} ✔️` : prize.name;
                const claimBtnClass = prize.claimed ? 'is-claimed' : '';
                
                // Use numeric input field with improved attributes
                item.innerHTML = `
                    <span class="prize-name">${prizeNameDisplay}</span>
                    <div class="prize-actions">
                        <input type="text" inputmode="numeric" pattern="[0-9]*\\.?[0-9]*" class="amount-input" data-id="${prize.id}" value="${prize.amount}" placeholder="₹" ${isDisabled}>
                        <button class="claim-btn primary-btn ${claimBtnClass}" data-id="${prize.id}">${claimBtnTxt}</button>
                        <button class="icon-btn" data-action="duplicate" data-id="${prize.id}" title="Duplicate Prize" ${isDisabled}>📋</button>
                        <button class="icon-btn" data-action="delete" data-id="${prize.id}" title="Delete Prize" ${isDisabled}>🗑️</button>
                    </div>`;
                prizeListContainer.appendChild(item);
            });
            updateTotalPrizeMoney();
        }
    };
});

// This script directly targets and replaces the heart emoji
document.addEventListener('DOMContentLoaded', function() {
    // Function to apply the fix
    function fixHeartColor() {
        // Find all text nodes in the document
        const walker = document.createTreeWalker(
            document.body, 
            NodeFilter.SHOW_TEXT, 
            null, 
            false
        );
        
        // Look for the text node containing "Coded with ❤️"
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes('❤️') || node.textContent.includes('♥')) {
                // Found the node with heart, now replace it
                const parent = node.parentNode;
                const text = node.textContent;
                
                // Split text around the heart and create elements
                const parts = text.split(/(❤️|♥)/);
                parent.removeChild(node);
                
                parts.forEach(part => {
                    if (part === '❤️' || part === '♥') {
                        // Create styled span for the heart
                        const heartSpan = document.createElement('span');
                        heartSpan.className = 'theme-heart';
                        heartSpan.textContent = part;
                        heartSpan.style.color = 'var(--primary-color)';
                        parent.appendChild(heartSpan);
                    } else if (part) {
                        // Re-add the text parts
                        parent.appendChild(document.createTextNode(part));
                    }
                });
            }
        }
    }
    
    // Run immediately
    fixHeartColor();
    
    // Also run after theme changes
    document.getElementById('theme-selector')?.addEventListener('change', function() {
        // Small delay to allow theme to apply
        setTimeout(fixHeartColor, 100);
    });
    
    // Direct fix for reset button
    const resetButtons = document.querySelectorAll('button');
    resetButtons.forEach(button => {
        if (button.textContent.includes('Reset Entire Game')) {
            button.style.backgroundColor = 'var(--primary-color)';
            button.style.color = 'white';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Theme application function - applies theme to elements that might resist CSS variables
    function applyThemeToResistantElements() {
        // Get computed style values for current theme
        const computedStyle = getComputedStyle(document.documentElement);
        const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
        const textColor = computedStyle.getPropertyValue('--text-color').trim();
        const bgColor = computedStyle.getPropertyValue('--bg-color').trim();
        const cardBgColor = computedStyle.getPropertyValue('--card-bg-color').trim();
        const dangerColor = computedStyle.getPropertyValue('--danger-color').trim();
        
        // Apply to elements that might have inline styles
        document.querySelectorAll('[style*="color"], [style*="background"]').forEach(el => {
            // Check if element has inline style that should be converted to use theme
            const style = el.getAttribute('style');
            if (style.includes('#') || style.includes('rgb')) {
                // Replace with theme variables where appropriate
                el.style.color = '';
                el.style.backgroundColor = '';
                // Add appropriate classes based on element's role
                if (el.classList.contains('danger-btn') || el.id === 'reset-game-btn') {
                    el.style.backgroundColor = `var(--danger-color)`;
                    el.style.color = 'white';
                }
                else if (el.classList.contains('primary-btn') || el.classList.contains('action-btn')) {
                    el.style.backgroundColor = `var(--primary-color)`;
                    el.style.color = 'white';
                }
            }
        });
        
        // Special handling for footer with heart icon
        const footerCredit = document.querySelector('.footer-credit');
        if (footerCredit) {
            // Replace the heart emoji with a themed span
            if (!footerCredit.querySelector('.heart-icon-wrapper')) {
                footerCredit.innerHTML = footerCredit.innerHTML.replace(
                    /❤️|♥/g, 
                    `<span class="heart-icon-wrapper" style="color:${primaryColor}!important;">❤️</span>`
                );
            }
        }
        
        // Fix reset button specifically
        const resetButton = document.getElementById('reset-game-btn');
        if (resetButton) {
            resetButton.style.backgroundColor = dangerColor;
            resetButton.style.color = 'white';
        }
    }
    
    // Run on load
    applyThemeToResistantElements();
    
    // Listen for theme changes
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', function() {
            // Allow time for CSS variables to update
            setTimeout(applyThemeToResistantElements, 100);
        });
    }
});

// Direct fix for reset button color - add this to your JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Function to fix reset button
    function fixResetButton() {
        // Find all possible reset buttons
        const resetButtons = document.querySelectorAll('#reset-game-btn, .reset-game-btn, button:contains("Reset Entire Game")');
        
        // Get computed style for primary color from current theme
        const computedStyle = getComputedStyle(document.documentElement);
        const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
        
        // Apply the primary color to each button
        resetButtons.forEach(button => {
            button.style.backgroundColor = primaryColor;
            button.style.color = 'white';
            button.style.border = 'none';
        });
    }
    
    // Fix on page load
    fixResetButton();
    
    // Also fix after theme changes
    document.getElementById('theme-selector')?.addEventListener('change', function() {
        // Wait for theme to apply
        setTimeout(fixResetButton, 100);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Function to safely get elements (prevents errors if not found)
    function safeQuerySelector(selector) {
        try {
            return document.querySelector(selector);
        } catch (e) {
            console.log('Invalid selector:', selector);
            return null;
        }
    }
    
    // Function to fix the reset button color
    function fixResetButton() {
        // Find the reset button by ID or text content (without using :contains)
        const resetButton = safeQuerySelector('#reset-game-btn') || 
                          safeQuerySelector('.reset-game-btn');
        
        // Also try to find by text content through iteration
        if (!resetButton) {
            const allButtons = document.querySelectorAll('button');
            for (let btn of allButtons) {
                if (btn.textContent.includes('Reset Entire Game')) {
                    applyButtonStyle(btn);
                    break;
                }
            }
        } else {
            applyButtonStyle(resetButton);
        }
        
        function applyButtonStyle(button) {
            if (!button) return;
            
            // Get computed style for primary color
            const computedStyle = getComputedStyle(document.documentElement);
            const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
            
            // Apply style
            button.style.backgroundColor = primaryColor;
            button.style.color = 'white';
            button.style.border = 'none';
        }
    }
    
    // Function to fix heart in footer
    function fixFooterHeart() {
        const footerCredit = safeQuerySelector('.footer-credit');
        if (footerCredit && footerCredit.textContent.includes('❤️')) {
            // Get computed primary color
            const computedStyle = getComputedStyle(document.documentElement);
            const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
            
            // Only create the wrapper if it doesn't exist yet
            if (!footerCredit.querySelector('.heart-icon-wrapper')) {
                const heartRegex = /(❤️|♥)/;
                const parts = footerCredit.innerHTML.split(heartRegex);
                
                if (parts.length >= 3) {
                    footerCredit.innerHTML = 
                        parts[0] + 
                        `<span class="heart-icon-wrapper" style="color:${primaryColor}!important;">` + 
                        (parts[1] || '❤️') + 
                        '</span>' + 
                        parts.slice(2).join('');
                }
            }
        }
    }
    
    // Run fixes on page load
    setTimeout(() => {
        fixResetButton();
        fixFooterHeart();
    }, 200);
    
    // Fix on theme change if theme selector exists
    const themeSelector = safeQuerySelector('#theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', function() {
            setTimeout(() => {
                fixResetButton();
                fixFooterHeart();
            }, 200);
        });
    }
});
