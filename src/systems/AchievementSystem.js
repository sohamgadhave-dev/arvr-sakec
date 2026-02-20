/**
 * AchievementSystem — badge definitions, unlock logic, animated popup.
 */
export class AchievementSystem {
    constructor(studentData) {
        this.studentData = studentData;
        this.badges = [
            { id: 'first_steps', icon: '👣', title: 'First Steps', desc: 'Complete your first experiment', check: d => d.totalExperiments >= 1 },
            { id: 'lab_explorer', icon: '🔬', title: 'Lab Explorer', desc: 'Try all 3 experiments', check: d => this._triedAll(d) },
            { id: 'quiz_ace', icon: '🎓', title: 'Quiz Ace', desc: 'Score 100% on any quiz', check: d => this._hasFullScore(d) },
            { id: 'perfect_launch', icon: '🎯', title: 'Perfect Launch', desc: 'Hit target within 1m accuracy', check: d => this._checkAttemptFlag(d, 'perfectLaunch') },
            { id: 'precision_master', icon: '🏹', title: 'Precision Master', desc: 'Complete 3 challenges successfully', check: d => (d.challengeScores || []).filter(s => s.score >= 80).length >= 3 },
            { id: 'concept_champion', icon: '🧠', title: 'Concept Champion', desc: 'Achieve 80%+ accuracy in all concepts', check: d => this._allConceptsStrong(d) },
            { id: 'symmetry_specialist', icon: '🪞', title: 'Symmetry Specialist', desc: 'Discover complementary angle symmetry', check: d => this._checkAttemptFlag(d, 'symmetryDiscovered') },
            { id: 'speed_demon', icon: '⚡', title: 'Speed Demon', desc: 'Complete a challenge under 30 seconds', check: d => (d.challengeScores || []).some(s => s.timeMs && s.timeMs < 30000) },
            { id: 'expert_tier', icon: '🏆', title: 'Expert Engineer', desc: 'Reach Expert performance tier', check: d => d.tier === 'expert' },
            { id: 'persistent', icon: '💪', title: 'Persistent Learner', desc: 'Complete 10 experiments', check: d => d.totalExperiments >= 10 }
        ];
    }

    _triedAll(d) {
        return Object.values(d.experiments).every(e => e.attempts.length > 0);
    }

    _hasFullScore(d) {
        return Object.values(d.experiments).some(e => e.quizScores.some(s => s.pct === 100));
    }

    _checkAttemptFlag(d, flag) {
        return Object.values(d.experiments).some(e => e.attempts.some(a => a[flag]));
    }

    _allConceptsStrong(d) {
        let hasConcepts = false;
        for (const exp of Object.values(d.experiments)) {
            for (const c of Object.values(exp.conceptAccuracy)) {
                hasConcepts = true;
                if (c.total === 0 || (c.correct / c.total) < 0.8) return false;
            }
        }
        return hasConcepts;
    }

    /**
     * Check all badges against current data. Returns array of newly unlocked badge IDs.
     */
    checkAndUnlock() {
        const data = this.studentData.getAllData();
        const newlyUnlocked = [];

        for (const badge of this.badges) {
            if (this.studentData.hasAchievement(badge.id)) continue;
            try {
                if (badge.check(data)) {
                    this.studentData.addAchievement(badge.id);
                    newlyUnlocked.push(badge);
                }
            } catch (e) { /* skip check errors */ }
        }

        // Show popup for each new badge
        newlyUnlocked.forEach((badge, i) => {
            setTimeout(() => this._showPopup(badge), i * 1500);
        });

        return newlyUnlocked;
    }

    _showPopup(badge) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
      <div class="achievement-icon">${badge.icon}</div>
      <div class="achievement-info">
        <div class="achievement-label">Achievement Unlocked!</div>
        <div class="achievement-title">${badge.title}</div>
        <div class="achievement-desc">${badge.desc}</div>
      </div>
    `;
        document.body.appendChild(popup);

        requestAnimationFrame(() => popup.classList.add('show'));
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 3500);
    }

    getBadgeInfo(id) {
        return this.badges.find(b => b.id === id);
    }

    getAllBadges() {
        return this.badges.map(b => ({
            ...b,
            unlocked: this.studentData.hasAchievement(b.id)
        }));
    }
}
