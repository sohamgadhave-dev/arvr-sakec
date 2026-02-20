import { SceneManager } from './core/SceneManager.js';
import { LabEnvironment } from './core/LabEnvironment.js';
import { ExperimentHub } from './ui/ExperimentHub.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { DataDisplay } from './ui/DataDisplay.js';
import { QuizManager } from './quiz/QuizManager.js';
import { ProjectileMotion } from './experiments/ProjectileMotion.js';
import { OhmsLaw } from './experiments/OhmsLaw.js';
import { SimplePendulum } from './experiments/SimplePendulum.js';

// ─── New Ecosystem Modules ─────────────────────────────
import { StudentData } from './systems/StudentData.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { AdaptiveLearning } from './systems/AdaptiveLearning.js';
import { ChallengeMode } from './systems/ChallengeMode.js';
import { ReplayManager } from './systems/ReplayManager.js';
import { LabReportGenerator } from './systems/LabReportGenerator.js';
import { StoryMode } from './systems/StoryMode.js';
import { DigitalTwinPlaceholder } from './systems/DigitalTwinPlaceholder.js';
import { AIAssistant } from './ui/AIAssistant.js';
import { Dashboard } from './ui/Dashboard.js';
import { AdminPanel } from './ui/AdminPanel.js';

class App {
    constructor() {
        this.currentExperiment = null;
        this.currentExperimentId = null;
        this.sceneManager = null;
        this.labEnv = null;

        // ─── Core Systems ──────────────────────────────────
        this.studentData = new StudentData();
        this.achievements = new AchievementSystem(this.studentData);
        this.adaptive = new AdaptiveLearning(this.studentData);
        this.challengeMode = new ChallengeMode(this.studentData);
        this.replayManager = new ReplayManager(this.studentData);
        this.reportGenerator = new LabReportGenerator(this.studentData);
        this.storyMode = new StoryMode(this.studentData);
        this.digitalTwin = new DigitalTwinPlaceholder();

        // ─── UI ────────────────────────────────────────────
        this.hubScreen = document.getElementById('hub-screen');
        this.experimentScreen = document.getElementById('experiment-screen');
        this.experimentTitle = document.getElementById('experiment-title');
        this.canvas = document.getElementById('lab-canvas');

        this.controlPanel = new ControlPanel('panel-controls', 'panel-actions');
        this.dataDisplay = new DataDisplay('data-display', 'formula-display');
        this.quizManager = new QuizManager();
        this.aiAssistant = new AIAssistant(this.studentData, this.adaptive);
        this.dashboard = new Dashboard(this.studentData, this.achievements, this.adaptive);
        this.adminPanel = new AdminPanel(this.studentData);

        // Hub
        this.hub = new ExperimentHub('experiment-cards', (id) => this.loadExperiment(id));

        // ─── Nav listeners ─────────────────────────────────
        document.getElementById('back-btn').addEventListener('click', () => this.goToHub());
        document.getElementById('quiz-btn').addEventListener('click', () => {
            if (this.currentExperimentId) {
                this.quizManager.open(this.currentExperimentId);
            }
        });

        // Panel toggle
        const panelToggle = document.getElementById('panel-toggle');
        const controlPanelEl = document.getElementById('control-panel');
        panelToggle.addEventListener('click', () => {
            controlPanelEl.classList.toggle('collapsed');
        });

        // ─── New Nav Buttons ───────────────────────────────
        document.getElementById('dashboard-btn')?.addEventListener('click', () => this.dashboard.show());
        document.getElementById('report-btn')?.addEventListener('click', () => this._generateReport());
        document.getElementById('challenge-btn')?.addEventListener('click', () => this._showChallengeList());
        document.getElementById('story-btn')?.addEventListener('click', () => this._startStory());
        document.getElementById('twin-btn')?.addEventListener('click', () => this.digitalTwin.toggle());

        // Admin toggle (Ctrl+Shift+A)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.adminPanel.show();
            }
        });

        // ─── Quiz Integration ──────────────────────────────
        this._hookQuizManager();

        // ─── Student Name ──────────────────────────────────
        this._promptStudentName();

        // ─── Lab Ambience Audio ────────────────────────────
        this._initAmbience();

        this._showToast('Welcome to NCTE-Tech Virtual Lab! 🔬');
    }

    _promptStudentName() {
        const name = this.studentData.getStudentName();
        if (name === 'Student') {
            // Show inline name input on hub
            const nameInput = document.getElementById('student-name-input');
            if (nameInput) {
                nameInput.value = name;
                nameInput.addEventListener('change', (e) => {
                    const newName = e.target.value.trim();
                    if (newName) {
                        this.studentData.setStudentName(newName);
                        this._showToast(`Welcome, ${newName}! 👋`);
                    }
                });
            }
        }
    }

    _hookQuizManager() {
        // Override quiz results to integrate with our systems
        const origShowResults = this.quizManager._showResults.bind(this.quizManager);
        this.quizManager._showResults = () => {
            origShowResults();

            const quiz = this.quizManager.currentQuiz;
            const score = this.quizManager.score;
            const total = quiz.questions.length;

            // Save quiz data
            const conceptResults = {};
            quiz.questions.forEach((q, i) => {
                const conceptId = q.concept || `q${i}`;
                conceptResults[conceptId] = i < total; // simplified
            });
            this.studentData.saveQuizScore(
                this.currentExperimentId, score, total, conceptResults
            );

            // Update tier
            const tierUpdate = this.adaptive.updateTier();
            if (tierUpdate.changed) {
                this._showToast(`🎯 Performance tier: ${tierUpdate.tier.toUpperCase()}!`, 'success');
            }

            // Check achievements
            this.achievements.checkAndUnlock();

            // AI assistant feedback
            this.aiAssistant.onQuizComplete(score, total);
            this.aiAssistant.checkStruggle();
        };
    }

    loadExperiment(id) {
        // Cleanup previous
        if (this.currentExperiment) {
            this.currentExperiment.dispose();
            this.currentExperiment = null;
        }
        if (this.labEnv) {
            this.labEnv.dispose();
            this.labEnv = null;
        }

        // Initialize scene manager if needed
        if (!this.sceneManager) {
            this.sceneManager = new SceneManager(this.canvas);
        } else {
            this.sceneManager.clearScene();
        }

        // Switch screens
        this.hubScreen.classList.remove('active');
        this.experimentScreen.classList.add('active');
        this.experimentTitle.textContent = this.hub.getExperimentName(id);
        this.currentExperimentId = id;

        // Create lab environment
        this.labEnv = new LabEnvironment(this.sceneManager.scene);
        this.sceneManager.onAnimate((delta, elapsed) => {
            if (this.labEnv) this.labEnv.update(elapsed);
        });

        // Load experiment
        switch (id) {
            case 'projectile':
                this.currentExperiment = new ProjectileMotion(
                    this.sceneManager, this.controlPanel, this.dataDisplay
                );
                break;
            case 'ohms-law':
                this.currentExperiment = new OhmsLaw(
                    this.sceneManager, this.controlPanel, this.dataDisplay
                );
                break;
            case 'pendulum':
                this.currentExperiment = new SimplePendulum(
                    this.sceneManager, this.controlPanel, this.dataDisplay
                );
                break;
        }

        this.sceneManager.start();

        // ─── Wire AI Assistant ─────────────────────────────
        this.aiAssistant.setExperiment(id);

        // Save attempt
        this.studentData.saveAttempt(id, { experiment: id });

        // Check achievements
        this.achievements.checkAndUnlock();

        // story mode check
        const missionIdx = this.storyMode.getMissionForExperiment(id);
        const progress = this.studentData.getStoryProgress();
        if (missionIdx >= 0 && !progress.completed.includes(this.storyMode.missions[missionIdx].id)) {
            // Offer story mode
            setTimeout(() => {
                this.storyMode.startMission(missionIdx);
            }, 1500);
        }

        this._showToast(`Loaded: ${this.hub.getExperimentName(id)}`);
    }

    goToHub() {
        // Clean up
        if (this.currentExperiment) {
            this.currentExperiment.dispose();
            this.currentExperiment = null;
        }
        if (this.labEnv) {
            this.labEnv.dispose();
            this.labEnv = null;
        }
        if (this.sceneManager) {
            this.sceneManager.stop();
            this.sceneManager.clearScene();
        }

        this.currentExperimentId = null;
        this.challengeMode.cancel();

        // Switch screens
        this.experimentScreen.classList.remove('active');
        this.hubScreen.classList.add('active');
    }

    _generateReport() {
        if (!this.currentExperimentId) return;
        const name = this.hub.getExperimentName(this.currentExperimentId);
        const params = this.controlPanel.getAllValues();
        const results = {}; // from data display
        document.querySelectorAll('.data-row').forEach(row => {
            const label = row.querySelector('.data-label')?.textContent;
            const value = row.querySelector('.data-value')?.textContent;
            if (label && value) results[label] = value;
        });
        const quizScores = this.studentData.getQuizScores(this.currentExperimentId);
        const lastQuiz = quizScores.length > 0 ? quizScores[quizScores.length - 1] : undefined;
        const aiRemarks = this.aiAssistant.getRemarks();
        this.reportGenerator.openReport(
            this.currentExperimentId, name, params, results,
            lastQuiz ? { score: lastQuiz.score || 0, total: lastQuiz.total || 5 } : undefined,
            aiRemarks || null
        );
        this._showToast('📝 Lab report generated!');
    }

    _showChallengeList() {
        if (!this.currentExperimentId) return;
        const challenges = this.challengeMode.getChallenges(this.currentExperimentId);
        if (challenges.length === 0) return;

        // Create challenge picker
        const picker = document.createElement('div');
        picker.className = 'challenge-picker-overlay';
        picker.innerHTML = `
            <div class="challenge-picker glass">
                <h3>🎯 Choose a Challenge</h3>
                <div class="challenge-list">
                    ${challenges.map(ch => `
                        <button class="challenge-option" data-id="${ch.id}">
                            <span class="co-label">${ch.label}</span>
                            <span class="co-time">⏱ ${ch.timeLimit}s</span>
                        </button>
                    `).join('')}
                </div>
                <button class="btn btn-secondary challenge-picker-close">Cancel</button>
            </div>
        `;
        document.body.appendChild(picker);

        picker.querySelectorAll('.challenge-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const ch = challenges.find(c => c.id === btn.dataset.id);
                if (ch) this.challengeMode.start(ch);
                picker.remove();
            });
        });
        picker.querySelector('.challenge-picker-close')?.addEventListener('click', () => picker.remove());
        picker.addEventListener('click', (e) => { if (e.target === picker) picker.remove(); });
    }

    _startStory() {
        const nextMission = this.storyMode.getNextMission();
        if (nextMission >= 0) {
            this.storyMode.startMission(nextMission);
        } else {
            this._showToast('🎉 All story missions completed!');
        }
    }

    _initAmbience() {
        this._ambienceCtx = null;
        const init = () => {
            if (this._ambienceCtx) return;
            try {
                this._ambienceCtx = new (window.AudioContext || window.webkitAudioContext)();
                this._playAmbience();
            } catch (e) { }
            document.removeEventListener('click', init);
        };
        document.addEventListener('click', init);
    }

    _playAmbience() {
        if (!this._ambienceCtx) return;
        const ctx = this._ambienceCtx;

        // Gentle low-frequency hum (simulates lab AC equipment)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 60;
        const gain = ctx.createGain();
        gain.gain.value = 0.008; // very subtle
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 100;
        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start();
        this._ambienceOsc = osc;
    }

    _showToast(message, type = '') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 3000);
    }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
