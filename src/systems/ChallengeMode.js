/**
 * ChallengeMode — target distance, time limits, scoring, leaderboard.
 */
export class ChallengeMode {
    constructor(studentData) {
        this.studentData = studentData;
        this.active = false;
        this.currentChallenge = null;
        this.startTime = 0;
        this.overlay = null;
        this._createUI();
    }

    _createUI() {
        // Challenge banner (injected into experiment screen)
        this.banner = document.createElement('div');
        this.banner.className = 'challenge-banner';
        this.banner.style.display = 'none';
        this.banner.innerHTML = `
      <div class="challenge-info">
        <span class="challenge-icon">🎯</span>
        <span class="challenge-text" id="challenge-text"></span>
      </div>
      <div class="challenge-timer" id="challenge-timer">--</div>
      <button class="btn btn-sm challenge-cancel" id="challenge-cancel">Cancel</button>
    `;
        document.body.appendChild(this.banner);

        document.getElementById('challenge-cancel')?.addEventListener('click', () => this.cancel());
    }

    /**
     * Available challenge definitions per experiment.
     */
    getChallenges(experimentId) {
        const challenges = {
            projectile: [
                { id: 'hit_20m', type: 'target', label: 'Hit 20m target', target: 20, margin: 2, timeLimit: 60 },
                { id: 'hit_30m', type: 'target', label: 'Hit 30m target', target: 30, margin: 2, timeLimit: 60 },
                { id: 'max_height_15', type: 'maxHeight', label: 'Max height under 15m', limit: 15, timeLimit: 45 },
                { id: 'speed_run', type: 'speedRun', label: 'Speed run: 3 launches in 30s', count: 3, timeLimit: 30 }
            ],
            'ohms-law': [
                { id: 'target_current_2A', type: 'targetValue', label: 'Set current to exactly 2A', target: 2, margin: 0.1, timeLimit: 30 },
                { id: 'max_power', type: 'maxValue', label: 'Max power under 100W', limit: 100, timeLimit: 30 }
            ],
            pendulum: [
                { id: 'match_period_2s', type: 'targetValue', label: 'Set period to 2.0s', target: 2.0, margin: 0.1, timeLimit: 45 },
                { id: 'energy_conservation', type: 'observation', label: 'Observe energy conservation for 10 swings', count: 10, timeLimit: 60 }
            ]
        };
        return challenges[experimentId] || [];
    }

    start(challenge) {
        this.active = true;
        this.currentChallenge = challenge;
        this.startTime = Date.now();
        this.launchCount = 0;

        this.banner.style.display = 'flex';
        document.getElementById('challenge-text').textContent = challenge.label;
        this._updateTimer();
        this._timerInterval = setInterval(() => this._updateTimer(), 100);
    }

    _updateTimer() {
        if (!this.active) return;
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, (this.currentChallenge.timeLimit || 60) - elapsed);
        const timerEl = document.getElementById('challenge-timer');
        if (timerEl) {
            timerEl.textContent = remaining.toFixed(1) + 's';
            if (remaining <= 10) timerEl.classList.add('urgent');
            else timerEl.classList.remove('urgent');
        }
        if (remaining <= 0) this.fail('Time expired!');
    }

    /**
     * Called by experiment when a result is achieved.
     */
    checkResult(value, type = 'range') {
        if (!this.active || !this.currentChallenge) return null;

        const ch = this.currentChallenge;
        const elapsed = (Date.now() - this.startTime) / 1000;

        if (ch.type === 'target' || ch.type === 'targetValue') {
            const diff = Math.abs(value - ch.target);
            if (diff <= ch.margin) {
                return this._success(elapsed, 100 - (diff / ch.margin) * 20);
            }
        } else if (ch.type === 'maxHeight') {
            if (value <= ch.limit && value > 0) {
                return this._success(elapsed, 90);
            }
        } else if (ch.type === 'speedRun') {
            this.launchCount = (this.launchCount || 0) + 1;
            if (this.launchCount >= ch.count) {
                return this._success(elapsed, 100);
            }
        }
        return null;
    }

    _success(timeTaken, accuracy) {
        this.active = false;
        clearInterval(this._timerInterval);

        const timeLimit = this.currentChallenge.timeLimit || 60;
        const speedBonus = Math.max(0, ((timeLimit - timeTaken) / timeLimit) * 30);
        const score = Math.round(accuracy + speedBonus);

        this.studentData.saveChallengeScore(this.currentChallenge.id, score);
        this._showResult(true, score, timeTaken);
        return { success: true, score, time: timeTaken };
    }

    fail(reason) {
        this.active = false;
        clearInterval(this._timerInterval);
        this._showResult(false, 0, 0, reason);
    }

    cancel() {
        this.active = false;
        clearInterval(this._timerInterval);
        this.banner.style.display = 'none';
    }

    _showResult(success, score, time, reason = '') {
        this.banner.style.display = 'none';

        const popup = document.createElement('div');
        popup.className = `challenge-result ${success ? 'success' : 'fail'}`;
        popup.innerHTML = `
      <div class="cr-icon">${success ? '🏆' : '❌'}</div>
      <div class="cr-title">${success ? 'Challenge Complete!' : 'Challenge Failed'}</div>
      ${success ? `<div class="cr-score">Score: ${score}</div><div class="cr-time">Time: ${time.toFixed(1)}s</div>` : `<div class="cr-reason">${reason}</div>`}
      <button class="btn btn-primary cr-close">OK</button>
    `;
        document.body.appendChild(popup);
        requestAnimationFrame(() => popup.classList.add('show'));

        popup.querySelector('.cr-close').addEventListener('click', () => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        });
    }

    isActive() { return this.active; }

    dispose() {
        this.cancel();
        if (this.banner?.parentElement) this.banner.remove();
    }
}
