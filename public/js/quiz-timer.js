// ===== QUIZ TIMER & SOUND EFFECTS =====
console.log('🎵 Quiz Timer & Sound System Loading...');

// Global variables
let quizTimerInterval = null;
let quizStartTime = null;
let quizElapsedTime = 0;
let isSoundEnabled = true;
let questionTimeLimit = 30;
let hasPlayedWarning20 = false;
let hasPlayedWarning25 = false;
let isTimerPaused = false; // THÊM FLAG ĐỂ BIẾT TIMER CÓ BỊ TẠM DỪNG
let autoNextTimeout = null; // THÊM TIMEOUT ĐỂ AUTO NEXT SAU 30S

let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// ===== SOUND EFFECTS =====

function createTickSound() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
}

function createCorrectSound() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);

    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
}

function createWrongSound() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
}

function createWarningSound() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 880;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
}

function createCompleteSound() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();

    const notes = [
        { freq: 523.25, time: 0 },
        { freq: 659.25, time: 0.15 },
        { freq: 783.99, time: 0.3 },
        { freq: 1046.50, time: 0.45 }
    ];

    notes.forEach(note => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';

        const startTime = ctx.currentTime + note.time;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
    });
}

function createStartSound() {
    if (!isSoundEnabled) return;
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(392, ctx.currentTime);
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime + 0.1);

    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
}

function playSound(soundType) {
    try {
        switch (soundType) {
            case 'tick': createTickSound(); break;
            case 'correct': createCorrectSound(); break;
            case 'wrong': createWrongSound(); break;
            case 'warning': createWarningSound(); break;
            case 'complete': createCompleteSound(); break;
            case 'start': createStartSound(); break;
        }
    } catch (error) {
        console.log('Sound error:', error);
    }
}

// ===== TIMER FUNCTIONS =====

function startQuizTimer() {
    if (quizTimerInterval) return;

    quizStartTime = Date.now() - quizElapsedTime;
    playSound('start');
    hasPlayedWarning20 = false;
    hasPlayedWarning25 = false;
    isTimerPaused = false;

    // XÓA AUTO NEXT TIMEOUT CŨ NẾU CÓ
    if (autoNextTimeout) {
        clearTimeout(autoNextTimeout);
        autoNextTimeout = null;
    }

    // TẠO AUTO NEXT TIMEOUT MỚI - TỰ ĐỘNG SANG CÂU KHÁC SAU 30S
    autoNextTimeout = setTimeout(() => {
        console.log('⏰ Time out! Auto moving to next question...');
        if (typeof nextQuestion === 'function') {
            nextQuestion();
        }
    }, questionTimeLimit * 1000);

    quizTimerInterval = setInterval(() => {
        if (!isTimerPaused) {
            quizElapsedTime = Date.now() - quizStartTime;
            updateQuizTimerDisplay();
            updateQuizProgressBar();
            checkQuizTimeWarnings();
        }
    }, 100);
}

function pauseQuizTimer() {
    isTimerPaused = true;

    // HỦY AUTO NEXT TIMEOUT KHI ĐÃ CHỌN ĐÁP ÁN
    if (autoNextTimeout) {
        clearTimeout(autoNextTimeout);
        autoNextTimeout = null;
    }

    const timerContainer = document.querySelector('.quiz-timer-container');
    if (timerContainer) {
        timerContainer.classList.add('timer-paused');
        timerContainer.classList.remove('timer-warning', 'timer-critical');
    }
}

function stopQuizTimer() {
    if (quizTimerInterval) {
        clearInterval(quizTimerInterval);
        quizTimerInterval = null;
    }

    // HỦY AUTO NEXT TIMEOUT
    if (autoNextTimeout) {
        clearTimeout(autoNextTimeout);
        autoNextTimeout = null;
    }

    isTimerPaused = false;
}

function resetQuizTimer() {
    stopQuizTimer();
    quizElapsedTime = 0;
    hasPlayedWarning20 = false;
    hasPlayedWarning25 = false;
    isTimerPaused = false;

    // Reset UI
    const timerContainer = document.querySelector('.quiz-timer-container');
    if (timerContainer) {
        timerContainer.classList.remove('timer-warning', 'timer-critical', 'timer-paused');
    }

    updateQuizTimerDisplay();
    updateQuizProgressBar();
}

function updateQuizTimerDisplay() {
    const timerTextEl = document.querySelector('.timer-text');
    if (!timerTextEl) return;

    const totalSeconds = Math.floor(quizElapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timerTextEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateQuizProgressBar() {
    const progressBar = document.querySelector('.timer-progress-bar');
    if (!progressBar) return;

    const totalSeconds = Math.floor(quizElapsedTime / 1000);
    const percentage = Math.min((totalSeconds / questionTimeLimit) * 100, 100);

    progressBar.style.width = `${percentage}%`;

    // KHÔNG THAY ĐỔI MÀU KHI TIMER BỊ TẠM DỪNG
    if (!isTimerPaused) {
        if (percentage >= 80) {
            progressBar.classList.add('critical');
            progressBar.classList.remove('warning');
        } else if (percentage >= 60) {
            progressBar.classList.add('warning');
            progressBar.classList.remove('critical');
        } else {
            progressBar.classList.remove('warning', 'critical');
        }
    }
}

function checkQuizTimeWarnings() {
    // KHÔNG PHÁT CẢNH BÁO KHI TIMER BỊ TẠM DỪNG
    if (isTimerPaused) return;

    const totalSeconds = Math.floor(quizElapsedTime / 1000);
    const timerContainer = document.querySelector('.quiz-timer-container');

    if (!timerContainer) return;

    if (totalSeconds === 20 && !hasPlayedWarning20) {
        timerContainer.classList.add('timer-warning');
        playSound('warning');
        hasPlayedWarning20 = true;
    }

    if (totalSeconds === 25 && !hasPlayedWarning25) {
        timerContainer.classList.remove('timer-warning');
        timerContainer.classList.add('timer-critical');
        playSound('warning');
        hasPlayedWarning25 = true;
    }
}

// ===== CREATE TIMER UI =====
function createQuizTimerUI() {
    const quizContentEl = document.getElementById('quiz-content');
    if (!quizContentEl) return;

    // Remove existing timer if any
    const existingTimer = document.querySelector('.quiz-timer-container');
    const existingProgress = document.querySelector('.timer-progress-container');
    if (existingTimer) existingTimer.remove();
    if (existingProgress) existingProgress.remove();

    const timerHTML = `
        <div class="quiz-timer-container">
            <div class="timer-display">
                <span class="timer-icon">⏱️</span>
                <span class="timer-text">0:00</span>
            </div>
            <button class="sound-toggle" onclick="toggleQuizSound()" title="Bật/tắt âm thanh">
                <i class="bi bi-volume-up-fill"></i>
                <span class="sound-wave">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>
        </div>
        <div class="timer-progress-container">
            <div class="timer-progress-bar" style="width: 0%"></div>
        </div>
    `;

    quizContentEl.insertAdjacentHTML('afterbegin', timerHTML);
}

// ===== SOUND TOGGLE =====
function toggleQuizSound() {
    isSoundEnabled = !isSoundEnabled;
    const soundBtn = document.querySelector('.sound-toggle');
    const soundIcon = soundBtn?.querySelector('i');
    const soundWave = soundBtn?.querySelector('.sound-wave');

    if (!soundBtn) return;

    if (isSoundEnabled) {
        soundBtn.classList.remove('muted');
        if (soundIcon) soundIcon.className = 'bi bi-volume-up-fill';
        if (soundWave) soundWave.style.display = 'flex';
        playSound('tick');
    } else {
        soundBtn.classList.add('muted');
        if (soundIcon) soundIcon.className = 'bi bi-volume-mute-fill';
        if (soundWave) soundWave.style.display = 'none';
    }
}

// ===== WRAP EXISTING FUNCTIONS =====

// Wrap loadQuestion để tạo timer và bắt đầu
if (typeof window.loadQuestion !== 'undefined') {
    const originalLoadQuestion = window.loadQuestion;
    window.loadQuestion = function () {
        // Reset và dừng timer trước
        resetQuizTimer();

        // Gọi function gốc
        originalLoadQuestion.apply(this, arguments);

        // Tạo UI và bắt đầu timer sau khi load xong
        setTimeout(() => {
            createQuizTimerUI();
            startQuizTimer();
        }, 50);
    };
}

// Wrap selectAnswer để play sound và TẠM DỪNG TIMER
if (typeof window.selectAnswer !== 'undefined') {
    const originalSelectAnswer = window.selectAnswer;
    window.selectAnswer = function (userPick) {
        // Gọi function gốc trước
        originalSelectAnswer.apply(this, arguments);

        // TẠM DỪNG TIMER KHI ĐÃ CHỌN ĐÁP ÁN
        pauseQuizTimer();

        // Check if correct và play sound
        if (typeof questions !== 'undefined' && typeof currentIdx !== 'undefined') {
            const q = questions[currentIdx];
            if (q && userPick === q.correct) {
                playSound('correct');
            } else {
                playSound('wrong');
            }
        }
    };
}

// Wrap showResult để dừng timer và play complete sound
if (typeof window.showResult !== 'undefined') {
    const originalShowResult = window.showResult;
    window.showResult = function () {
        stopQuizTimer();
        playSound('complete');
        originalShowResult.apply(this, arguments);
    };
}

// Wrap closeQuiz để dừng timer
if (typeof window.closeQuiz !== 'undefined') {
    const originalCloseQuiz = window.closeQuiz;
    window.closeQuiz = function () {
        stopQuizTimer();
        resetQuizTimer();
        originalCloseQuiz.apply(this, arguments);
    };
}

// Export functions
window.toggleQuizSound = toggleQuizSound;
window.playQuizSound = playSound;
window.pauseQuizTimer = pauseQuizTimer; // EXPORT THÊM HÀM NÀY

