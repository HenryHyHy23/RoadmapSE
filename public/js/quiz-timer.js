// ===== QUIZ TIMER SYSTEM (SOUND REMOVED) =====
console.log('⏱️ Quiz Timer System Loading (Silent Mode)...');

// Global variables
let quizTimerInterval = null;
let quizStartTime = null;
let quizElapsedTime = 0;
let questionTimeLimit = 30;
let isTimerPaused = false; 
let autoNextTimeout = null; 


function startQuizTimer() {
    if (quizTimerInterval) return;

    quizStartTime = Date.now() - quizElapsedTime;
    isTimerPaused = false;

    if (autoNextTimeout) {
        clearTimeout(autoNextTimeout);
        autoNextTimeout = null;
    }

    // Tự động sang câu khác sau 30s
    autoNextTimeout = setTimeout(() => {
        console.log('Time out! Auto moving to next question...');
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

    if (autoNextTimeout) {
        clearTimeout(autoNextTimeout);
        autoNextTimeout = null;
    }

    isTimerPaused = false;
}

function resetQuizTimer() {
    stopQuizTimer();
    quizElapsedTime = 0;
    isTimerPaused = false;

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
    if (isTimerPaused) return;

    const totalSeconds = Math.floor(quizElapsedTime / 1000);
    const timerContainer = document.querySelector('.quiz-timer-container');

    if (!timerContainer) return;

    if (totalSeconds === 20) {
        timerContainer.classList.add('timer-warning');
    }

    if (totalSeconds === 25) {
        timerContainer.classList.remove('timer-warning');
        timerContainer.classList.add('timer-critical');
    }
}

// ===== CREATE TIMER UI  =====
function createQuizTimerUI() {
    const quizContentEl = document.getElementById('quiz-content');
    if (!quizContentEl) return;

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
        </div>
        <div class="timer-progress-container">
            <div class="timer-progress-bar" style="width: 0%"></div>
        </div>
    `;

    quizContentEl.insertAdjacentHTML('afterbegin', timerHTML);
}

// ===== WRAP FUNCTIONS =====

if (typeof window.loadQuestion !== 'undefined') {
    const originalLoadQuestion = window.loadQuestion;
    window.loadQuestion = function () {
        resetQuizTimer();
        originalLoadQuestion.apply(this, arguments);
        setTimeout(() => {
            createQuizTimerUI();
            startQuizTimer();
        }, 50);
    };
}

if (typeof window.selectAnswer !== 'undefined') {
    const originalSelectAnswer = window.selectAnswer;
    window.selectAnswer = function (userPick) {
        originalSelectAnswer.apply(this, arguments);
        pauseQuizTimer();
    };
}

if (typeof window.showResult !== 'undefined') {
    const originalShowResult = window.showResult;
    window.showResult = function () {
        stopQuizTimer();
        originalShowResult.apply(this, arguments);
    };
}

if (typeof window.closeQuiz !== 'undefined') {
    const originalCloseQuiz = window.closeQuiz;
    window.closeQuiz = function () {
        stopQuizTimer();
        resetQuizTimer();
        originalCloseQuiz.apply(this, arguments);
    };
}

window.pauseQuizTimer = pauseQuizTimer;