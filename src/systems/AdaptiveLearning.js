/**
 * AdaptiveLearning — Performance tiers, difficulty scaling, auto-hints.
 */
export class AdaptiveLearning {
    constructor(studentData) {
        this.studentData = studentData;
        this.tiers = ['beginner', 'intermediate', 'advanced', 'expert'];
        this.tierThresholds = { beginner: 0, intermediate: 40, advanced: 65, expert: 85 };
    }

    /**
     * Auto-update student tier based on recent quiz accuracy.
     * Returns { tier, changed, suggestion }.
     */
    updateTier() {
        const accuracy = this.studentData.getRecentAccuracy(5);
        const oldTier = this.studentData.getTier();
        let newTier = 'beginner';

        if (accuracy >= this.tierThresholds.expert) newTier = 'expert';
        else if (accuracy >= this.tierThresholds.advanced) newTier = 'advanced';
        else if (accuracy >= this.tierThresholds.intermediate) newTier = 'intermediate';

        const changed = oldTier !== newTier;
        if (changed) this.studentData.setTier(newTier);

        let suggestion = null;
        if (accuracy < 40 && this.studentData.getStats().totalQuizzes >= 2) {
            suggestion = 'practice';
        }

        return { tier: newTier, changed, accuracy: accuracy.toFixed(1), suggestion };
    }

    getTierInfo() {
        const tier = this.studentData.getTier();
        const tierData = {
            beginner: { label: 'Beginner', color: '#94a3b8', icon: '🌱', level: 1 },
            intermediate: { label: 'Intermediate', color: '#f59e0b', icon: '📈', level: 2 },
            advanced: { label: 'Advanced', color: '#22c55e', icon: '🚀', level: 3 },
            expert: { label: 'Expert', color: '#8b5cf6', icon: '🏆', level: 4 }
        };
        return tierData[tier] || tierData.beginner;
    }

    /**
     * Get difficulty settings for current tier.
     */
    getDifficulty() {
        const tier = this.studentData.getTier();
        const settings = {
            beginner: { hintDelay: 3000, showHints: true, challengeMargin: 5, timeLimit: 120 },
            intermediate: { hintDelay: 8000, showHints: true, challengeMargin: 3, timeLimit: 90 },
            advanced: { hintDelay: 15000, showHints: false, challengeMargin: 2, timeLimit: 60 },
            expert: { hintDelay: 30000, showHints: false, challengeMargin: 1, timeLimit: 45 }
        };
        return settings[tier] || settings.beginner;
    }

    /**
     * Should the system suggest practice mode?
     */
    shouldSuggestPractice() {
        const accuracy = this.studentData.getRecentAccuracy(3);
        return accuracy < 40 && this.studentData.getStats().totalQuizzes >= 2;
    }

    /**
     * Get weak concepts that need more practice.
     */
    getWeakConcepts() {
        const allConcepts = this.studentData.getAllConceptAccuracy();
        const weak = [];
        for (const [concept, accuracy] of Object.entries(allConcepts)) {
            if (accuracy < 60) weak.push({ concept, accuracy: accuracy.toFixed(0) });
        }
        return weak.sort((a, b) => a.accuracy - b.accuracy);
    }
}
