import { quizData } from './quizData.js';

export class QuizManager {
    constructor() {
        this.overlay = document.getElementById('quiz-overlay');
        this.title = document.getElementById('quiz-title');
        this.progressFill = document.getElementById('quiz-progress-fill');
        this.progressText = document.getElementById('quiz-progress-text');
        this.questionEl = document.getElementById('quiz-question');
        this.optionsEl = document.getElementById('quiz-options');
        this.feedbackEl = document.getElementById('quiz-feedback');
        this.nextBtn = document.getElementById('quiz-next');
        this.closeBtn = document.getElementById('quiz-close');
        this.quizBody = document.getElementById('quiz-body');
        this.resultsEl = document.getElementById('quiz-results');
        this.resultsIcon = document.getElementById('results-icon');
        this.resultsTitle = document.getElementById('results-title');
        this.resultsScore = document.getElementById('results-score');
        this.resultsGrade = document.getElementById('results-grade');
        this.retryBtn = document.getElementById('quiz-retry');
        this.doneBtn = document.getElementById('quiz-done');

        this.currentQuiz = null;
        this.currentQuestion = 0;
        this.score = 0;
        this.answered = false;

        this._setupListeners();
    }

    _setupListeners() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.nextBtn.addEventListener('click', () => this._nextQuestion());
        this.retryBtn.addEventListener('click', () => this._retry());
        this.doneBtn.addEventListener('click', () => this.close());

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    open(experimentId) {
        const quiz = quizData[experimentId];
        if (!quiz) return;

        this.currentQuiz = quiz;
        this.currentQuestion = 0;
        this.score = 0;
        this.answered = false;

        this.title.textContent = quiz.title;
        this.quizBody.style.display = 'block';
        this.resultsEl.style.display = 'none';
        this.nextBtn.style.display = 'none';

        this._showQuestion();
        this.overlay.classList.add('active');
    }

    close() {
        this.overlay.classList.remove('active');
    }

    _showQuestion() {
        const q = this.currentQuiz.questions[this.currentQuestion];
        const total = this.currentQuiz.questions.length;

        this.answered = false;
        this.feedbackEl.classList.remove('show', 'correct', 'wrong');
        this.nextBtn.style.display = 'none';

        // Progress
        this.progressFill.style.width = `${((this.currentQuestion) / total) * 100}%`;
        this.progressText.textContent = `${this.currentQuestion + 1}/${total}`;

        // Question
        this.questionEl.textContent = q.question;

        // Options
        this.optionsEl.innerHTML = '';
        const letters = ['A', 'B', 'C', 'D'];
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.innerHTML = `
        <span class="option-letter">${letters[idx]}</span>
        <span>${opt}</span>
      `;
            btn.addEventListener('click', () => this._selectAnswer(idx));
            this.optionsEl.appendChild(btn);
        });
    }

    _selectAnswer(idx) {
        if (this.answered) return;
        this.answered = true;

        const q = this.currentQuiz.questions[this.currentQuestion];
        const options = this.optionsEl.querySelectorAll('.quiz-option');

        // Disable all options
        options.forEach(opt => opt.classList.add('disabled'));

        // Mark correct and wrong
        options[q.correct].classList.add('correct');
        if (idx !== q.correct) {
            options[idx].classList.add('wrong');
        } else {
            this.score++;
        }

        // Show feedback
        this.feedbackEl.textContent = q.explanation;
        this.feedbackEl.classList.add('show', idx === q.correct ? 'correct' : 'wrong');

        // Show next button
        const isLast = this.currentQuestion === this.currentQuiz.questions.length - 1;
        this.nextBtn.textContent = isLast ? 'See Results →' : 'Next →';
        this.nextBtn.style.display = 'inline-flex';
    }

    _nextQuestion() {
        this.currentQuestion++;

        if (this.currentQuestion >= this.currentQuiz.questions.length) {
            this._showResults();
        } else {
            this._showQuestion();
        }
    }

    _showResults() {
        const total = this.currentQuiz.questions.length;
        const pct = (this.score / total) * 100;

        this.quizBody.style.display = 'none';
        this.nextBtn.style.display = 'none';
        this.progressFill.style.width = '100%';

        let icon, title, gradeText, gradeClass;

        if (pct >= 80) {
            icon = '🏆'; title = 'Excellent!'; gradeText = 'A+'; gradeClass = 'excellent';
        } else if (pct >= 60) {
            icon = '🎉'; title = 'Good Job!'; gradeText = 'B'; gradeClass = 'good';
        } else if (pct >= 40) {
            icon = '👍'; title = 'Not Bad!'; gradeText = 'C'; gradeClass = 'average';
        } else {
            icon = '📖'; title = 'Keep Practicing!'; gradeText = 'D'; gradeClass = 'poor';
        }

        this.resultsIcon.textContent = icon;
        this.resultsTitle.textContent = title;
        this.resultsScore.textContent = `You scored ${this.score} out of ${total} (${pct.toFixed(0)}%)`;
        this.resultsGrade.textContent = gradeText;
        this.resultsGrade.className = `results-grade ${gradeClass}`;

        this.resultsEl.style.display = 'block';
    }

    _retry() {
        this.currentQuestion = 0;
        this.score = 0;
        this.quizBody.style.display = 'block';
        this.resultsEl.style.display = 'none';
        this._showQuestion();
    }
}
