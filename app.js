document.addEventListener('DOMContentLoaded', function() {
    // 1. ✅ Código nuevo al principio (también funciona)
    lottie.loadAnimation({
        container: document.getElementById('lottie-container'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'Robot-Bot-3D.json'
    });

    // 2. Todo tu código ORIGINAL después...
    updateUI();
    showMessage('🎯 Guess the secret number!', 'info');
    // ... resto del código
});
// Game Configuration
const DIFFICULTIES = {
    easy: { min: 1, max: 10, name: 'Easy' },
    medium: { min: 1, max: 50, name: 'Medium' },
    hard: { min: 1, max: 100, name: 'Hard' }
};

const MODES = {
    classic: {
        name: 'Classic',
        description: 'Unlimited attempts',
        attempts: {
            easy: Infinity,
            medium: Infinity,
            hard: Infinity
        }
    },
    challenge: {
        name: 'Challenge',
        description: 'Limited attempts',
        attempts: {
            easy: 5,
            medium: 7,
            hard: 10
        }
    },
    expert: {
        name: 'Expert',
        description: 'Very few attempts',
        attempts: {
            easy: 3,
            medium: 5,
            hard: 7
        }
    }
};

// Game State
class SecretNumberGame {
    constructor() {
        this.difficulty = 'easy';
        this.mode = 'classic';
        this.maxNumber = DIFFICULTIES[this.difficulty].max;
        this.minNumber = DIFFICULTIES[this.difficulty].min;
        this.maxAttempts = MODES[this.mode].attempts[this.difficulty];
        this.reset();
        this.loadStats();
    }

    reset() {
        this.drawnNumbersList = [];
        this.attempts = 0;
        this.maxAttempts = MODES[this.mode].attempts[this.difficulty];
        this.secretNumber = this.generateSecretNumber();
        this.gameOver = false;
        this.gameWon = false;
        this.score = 0;
        this.updateProgress();
    }

    generateSecretNumber() {
        // If all possible numbers have been drawn
        if (this.drawnNumbersList.length >= this.maxNumber) {
            return null; // Indicate no more numbers are available
        }

        let generatedNumber;
        do {
            generatedNumber = Math.floor(Math.random() * this.maxNumber) + this.minNumber;
        } while (this.drawnNumbersList.includes(generatedNumber));

        this.drawnNumbersList.push(generatedNumber);
        return generatedNumber;
    }

    checkGuess(userNumber) {
        if (this.gameOver) return;

        this.attempts++;
        const remainingAttempts = this.maxAttempts - this.attempts;

        if (userNumber === this.secretNumber) {
            this.gameOver = true;
            this.gameWon = true;
            this.score = this.calculateScore();
            this.updateStatsWin();
            return {
                result: 'correct',
                message: `🎉 Excellent! You guessed it in ${this.attempts} ${this.attempts === 1 ? 'attempt' : 'attempts'}`,
                score: this.score,
                remainingAttempts: remainingAttempts
            };
        } else if (remainingAttempts <= 0 && this.maxAttempts !== Infinity) {
            // Out of attempts
            this.gameOver = true;
            this.gameWon = false;
            this.updateStatsLoss();
            return {
                result: 'loss',
                message: `💀 You're out of attempts! The number was ${this.secretNumber}`,
                secretNumber: this.secretNumber,
                remainingAttempts: 0
            };
        } else if (userNumber > this.secretNumber) {
            return {
                result: 'higher',
                message: `📉 The secret number is lower ${remainingAttempts === Infinity ? '' : `(${remainingAttempts} attempts left)`}`,
                hint: this.generateHint(userNumber),
                remainingAttempts: remainingAttempts
            };
        } else {
            return {
                result: 'lower',
                message: `📈 The secret number is higher ${remainingAttempts === Infinity ? '' : `(${remainingAttempts} attempts left)`}`,
                hint: this.generateHint(userNumber),
                remainingAttempts: remainingAttempts
            };
        }
    }

    generateHint(userNumber) {
        const difference = Math.abs(userNumber - this.secretNumber);
        const range = this.maxNumber - this.minNumber + 1;

        if (difference <= range * 0.1) {
            return "🔥 Very hot! You are super close";
        } else if (difference <= range * 0.2) {
            return "♨️ Hot, you're getting closer";
        } else if (difference <= range * 0.4) {
            return "🌡️ Warm, keep trying";
        } else {
            return "❄️ Cold, you are far away";
        }
    }

    calculateScore() {
        const baseScore = 1000;
        const difficultyBonus = {
            easy: 1,
            medium: 2,
            hard: 3
        };

        const modeBonus = {
            classic: 1,
            challenge: 1.5,
            expert: 2
        };

        const attemptPenalty = Math.max(0, (this.attempts - 1) * 50);
        const finalScore = Math.max(
            (baseScore - attemptPenalty) * difficultyBonus[this.difficulty] * modeBonus[this.mode],
            100
        );

        return Math.round(finalScore);
    }

    updateProgress() {
        const progress = (this.drawnNumbersList.length / this.maxNumber) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    changeDifficulty(newDifficulty) {
        this.difficulty = newDifficulty;
        this.maxNumber = DIFFICULTIES[newDifficulty].max;
        this.minNumber = DIFFICULTIES[newDifficulty].min;

        // Update the input
        const input = document.getElementById('userValue');
        input.min = this.minNumber;
        input.max = this.maxNumber;

        this.reset();
    }

    changeMode(newMode) {
        this.mode = newMode;
        this.reset();
    }

    loadStats() {
        const stats = JSON.parse(localStorage.getItem('gameStats') || '{}');
        this.stats = {
            highScore: stats.highScore || 0,
            gamesWon: stats.gamesWon || 0,
            totalGames: stats.totalGames || 0,
            gamesLost: stats.gamesLost || 0
        };
    }

    updateStatsWin() {
        this.stats.gamesWon++;
        this.stats.totalGames++;

        if (this.score > this.stats.highScore) {
            this.stats.highScore = this.score;
        }

        localStorage.setItem('gameStats', JSON.stringify(this.stats));
    }

    updateStatsLoss() {
        this.stats.gamesLost++;
        this.stats.totalGames++;
        localStorage.setItem('gameStats', JSON.stringify(this.stats));
    }
}

// Game instance
const game = new SecretNumberGame();

// UI Functions
function updateUI() {
    const config = DIFFICULTIES[game.difficulty];
    const modeConfig = MODES[game.mode];
    const maxAttempts = modeConfig.attempts[game.difficulty];

    document.getElementById('instructions').textContent =
        `Guess the number between ${config.min} and ${config.max} / Mode: ${modeConfig.name}`;

    document.getElementById('attempts-display').textContent = game.attempts;
    document.getElementById('score-display').textContent = game.score;
    document.getElementById('high-score').textContent = game.stats.highScore;
    document.getElementById('games-won').textContent = game.stats.gamesWon;

    // Update remaining attempts
    const remainingAttempts = maxAttempts === Infinity ? '∞' : (maxAttempts - game.attempts);
    document.getElementById('attempts-remaining').textContent = remainingAttempts;

    // Change color if few attempts are left
    const remainingAttemptsEl = document.getElementById('attempts-remaining');
    const statEl = remainingAttemptsEl.parentElement;

    statEl.className = 'stat';
    if (maxAttempts !== Infinity) {
        const remaining = maxAttempts - game.attempts;
        if (remaining <= 1) {
            statEl.classList.add('attempts-danger');
        } else if (remaining <= 2) {
            statEl.classList.add('attempts-warning');
        }
    }
}

function showMessage(text, type = 'info', showHint = null) {
    const messageEl = document.getElementById('message');
    const hintEl = document.getElementById('hint-container');

    messageEl.textContent = text;
    messageEl.className = `message ${type} bounce-in`;

    if (showHint) {
        hintEl.textContent = showHint;
        hintEl.style.display = 'block';
        hintEl.className = 'hint fade-in';
    } else {
        hintEl.style.display = 'none';
    }
}

function validateInput(value) {
    const input = document.getElementById('userValue');

    if (!value || isNaN(value)) {
        showMessage('❌ Please enter a valid number', 'error');
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
        return false;
    }

    if (value < game.minNumber || value > game.maxNumber) {
        showMessage(
            `❌ The number must be between ${game.minNumber} and ${game.maxNumber}`,
            'error'
        );
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
        return false;
    }

    input.classList.remove('error');
    return true;
}

function checkGuess() {
    const input = document.getElementById('userValue');
    const userNumber = parseInt(input.value);

    if (!validateInput(userNumber)) {
        input.focus();
        return;
    }

    if (game.secretNumber === null) {
        showMessage('🎊 You have completed all possible numbers!', 'success');
        document.getElementById('restart').disabled = false;
        return;
    }

    const result = game.checkGuess(userNumber);

    if (result.result === 'correct') {
        input.classList.add('success');
        showMessage(result.message, 'success');
        document.getElementById('restart').disabled = false;
        document.getElementById('btn-guess').disabled = true;

        // Celebration animation
        document.querySelector('.container').style.animation = 'pulse 0.6s ease-in-out';
        setTimeout(() => {
            document.querySelector('.container').style.animation = '';
        }, 600);

    } else if (result.result === 'loss') {
        input.classList.add('error');
        showMessage(result.message, 'error');
        document.getElementById('restart').disabled = false;
        document.getElementById('btn-guess').disabled = true;

        // Loss animation
        document.querySelector('.container').style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            document.querySelector('.container').style.animation = '';
        }, 500);

    } else {
        showMessage(result.message, 'error', result.hint);
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
    }

    game.updateProgress();
    updateUI();
    clearInputBox();
}

function clearInputBox() {
    const input = document.getElementById('userValue');
    input.value = '';
    input.classList.remove('error', 'success');
    if (!game.gameOver) {
        input.focus();
    }
}

function restartGame() {
    game.reset();

    document.getElementById('restart').disabled = true;
    document.getElementById('btn-guess').disabled = false;

    showMessage('🎯 New game started!', 'info');

    updateUI();
    clearInputBox();

    document.querySelector('.container').classList.add('fade-in');
    setTimeout(() => {
        document.querySelector('.container').classList.remove('fade-in');
    }, 500);
}

function changeDifficulty(difficulty) {
    // Update buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');

    // Change difficulty in the game
    game.changeDifficulty(difficulty);

    showMessage(`🎮 Difficulty: ${DIFFICULTIES[difficulty].name}`, 'info');
    updateUI();
    clearInputBox();
}

function changeMode(mode) {
    // Update buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Change mode in the game
    game.changeMode(mode);

    const modeConfig = MODES[mode];
    const maxAttempts = modeConfig.attempts[game.difficulty];
    const attemptsText = maxAttempts === Infinity ? 'no limit' : `${maxAttempts} attempts`;

    showMessage(`🎮 Mode: ${modeConfig.name} (${attemptsText})`, 'info');
    updateUI();
    clearInputBox();
}

function handleSubmit(event) {
    event.preventDefault();
    checkGuess();
    return false;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    showMessage('🎯 Guess the secret number!', 'info');
    document.getElementById('userValue').focus();

    // Allow Enter to play
    document.getElementById('userValue').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !game.gameOver) {
            checkGuess();
        }
    });
});
