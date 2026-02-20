/**
 * StoryMode — guided narrative with step-by-step missions.
 */
export class StoryMode {
    constructor(studentData) {
        this.studentData = studentData;
        this.active = false;
        this.currentStep = 0;
        this.currentMission = null;
        this._createOverlay();

        this.missions = [
            {
                id: 'mission_projectile',
                experiment: 'projectile',
                title: 'Mission 1: Projectile Science',
                steps: [
                    { text: "Welcome, Engineer! Today you'll explore the science of projectile motion.", action: 'read' },
                    { text: "Set the launch angle to 45° — this gives maximum range on flat ground.", action: 'set_angle_45' },
                    { text: "Now launch the projectile and observe its parabolic trajectory.", action: 'launch' },
                    { text: "Excellent! Notice the symmetry — the launch and landing angles are equal. Now try the quiz to test your understanding.", action: 'quiz' }
                ]
            },
            {
                id: 'mission_ohms',
                experiment: 'ohms-law',
                title: "Mission 2: Ohm's Law Discovery",
                steps: [
                    { text: "Welcome back! In this mission, you'll discover the relationship between voltage, current, and resistance.", action: 'read' },
                    { text: "Start with 10Ω resistance and 12V. Observe the current reading.", action: 'set_params' },
                    { text: "Now double the resistance to 20Ω. What happens to the current?", action: 'observe' },
                    { text: "You've discovered Ohm's Law: I = V/R. Current halves when resistance doubles! Try the quiz.", action: 'quiz' }
                ]
            },
            {
                id: 'mission_pendulum',
                experiment: 'pendulum',
                title: 'Mission 3: Pendulum Rhythms',
                steps: [
                    { text: "Final mission, Engineer! You'll study the elegant physics of a simple pendulum.", action: 'read' },
                    { text: "Set the string length to 1m and start the pendulum. Measure the period.", action: 'set_length' },
                    { text: "Now change the length to 4m. How does the period change?", action: 'observe' },
                    { text: "The period doubles when length quadruples! T = 2π√(L/g). Take the quiz to complete your training.", action: 'quiz' }
                ]
            }
        ];
    }

    _createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'story-overlay';
        this.overlay.style.display = 'none';
        this.overlay.innerHTML = `
      <div class="story-panel glass">
        <div class="story-header">
          <span class="story-badge">📖 Story Mode</span>
          <button class="story-skip" id="story-skip">Skip →</button>
        </div>
        <div class="story-content">
          <div class="story-avatar">🤖</div>
          <p class="story-text" id="story-text"></p>
        </div>
        <div class="story-footer">
          <div class="story-progress">
            <div class="story-progress-fill" id="story-progress-fill"></div>
          </div>
          <button class="btn btn-primary story-next" id="story-next">Continue →</button>
        </div>
      </div>
    `;
        document.body.appendChild(this.overlay);

        document.getElementById('story-skip')?.addEventListener('click', () => this.skip());
        document.getElementById('story-next')?.addEventListener('click', () => this.nextStep());
    }

    /**
     * Start a mission.
     */
    startMission(missionIndex) {
        if (missionIndex >= this.missions.length) return;
        this.currentMission = this.missions[missionIndex];
        this.currentStep = 0;
        this.active = true;
        this._showStep();
    }

    _showStep() {
        if (!this.currentMission || this.currentStep >= this.currentMission.steps.length) {
            this.completeMission();
            return;
        }

        const step = this.currentMission.steps[this.currentStep];
        const total = this.currentMission.steps.length;

        this.overlay.style.display = 'flex';
        const textEl = document.getElementById('story-text');
        const progressEl = document.getElementById('story-progress-fill');

        // Typewriter effect
        if (textEl) {
            textEl.textContent = '';
            let i = 0;
            const typewriter = () => {
                if (i < step.text.length) {
                    textEl.textContent += step.text[i];
                    i++;
                    setTimeout(typewriter, 25);
                }
            };
            typewriter();
        }

        if (progressEl) {
            progressEl.style.width = `${((this.currentStep + 1) / total) * 100}%`;
        }

        const nextBtn = document.getElementById('story-next');
        if (nextBtn) {
            nextBtn.textContent = this.currentStep === total - 1 ? 'Complete Mission ✓' : 'Continue →';
        }
    }

    nextStep() {
        this.currentStep++;
        this._showStep();
    }

    completeMission() {
        this.active = false;
        this.overlay.style.display = 'none';
        if (this.currentMission) {
            this.studentData.completeStoryMission(this.currentMission.id);
        }
    }

    skip() {
        this.active = false;
        this.overlay.style.display = 'none';
    }

    /**
     * Get next uncompleted mission index.
     */
    getNextMission() {
        const progress = this.studentData.getStoryProgress();
        for (let i = 0; i < this.missions.length; i++) {
            if (!progress.completed.includes(this.missions[i].id)) return i;
        }
        return -1; // all complete
    }

    isAllComplete() {
        return this.getNextMission() === -1;
    }

    getMissionForExperiment(experimentId) {
        return this.missions.findIndex(m => m.experiment === experimentId);
    }

    dispose() {
        if (this.overlay?.parentElement) this.overlay.remove();
    }
}
