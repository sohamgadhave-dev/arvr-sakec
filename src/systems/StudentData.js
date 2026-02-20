/**
 * StudentData — localStorage persistence layer for all student data.
 * Stores: profile, experiment attempts, quiz scores, concept accuracy, tier, timestamps.
 */
export class StudentData {
    constructor() {
        this.STORAGE_KEY = 'ncte_lab_data';
        this.data = this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* corrupted data, reset */ }
        return this._defaultData();
    }

    _defaultData() {
        return {
            studentName: 'Student',
            tier: 'beginner', // beginner, intermediate, advanced, expert
            totalExperiments: 0,
            experiments: {
                projectile: { attempts: [], quizScores: [], conceptAccuracy: {}, totalTime: 0 },
                'ohms-law': { attempts: [], quizScores: [], conceptAccuracy: {}, totalTime: 0 },
                pendulum: { attempts: [], quizScores: [], conceptAccuracy: {}, totalTime: 0 }
            },
            achievements: [],
            challengeScores: [],
            storyProgress: { currentMission: 0, completed: [] },
            createdAt: Date.now(),
            lastActive: Date.now()
        };
    }

    _save() {
        this.data.lastActive = Date.now();
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) { /* storage full */ }
    }

    // ─── PROFILE ─────────────────────────────────────────
    getStudentName() { return this.data.studentName; }
    setStudentName(name) { this.data.studentName = name; this._save(); }
    getTier() { return this.data.tier; }
    setTier(tier) { this.data.tier = tier; this._save(); }

    // ─── EXPERIMENTS ─────────────────────────────────────
    saveAttempt(experimentId, params) {
        const exp = this.data.experiments[experimentId];
        if (!exp) return;
        exp.attempts.push({
            ...params,
            timestamp: Date.now()
        });
        // Keep last 50 attempts
        if (exp.attempts.length > 50) exp.attempts = exp.attempts.slice(-50);
        this.data.totalExperiments++;
        this._save();
    }

    getAttempts(experimentId) {
        return this.data.experiments[experimentId]?.attempts || [];
    }

    getLastAttempt(experimentId) {
        const attempts = this.getAttempts(experimentId);
        return attempts.length > 0 ? attempts[attempts.length - 1] : null;
    }

    // ─── QUIZ SCORES ────────────────────────────────────
    saveQuizScore(experimentId, score, total, conceptResults) {
        const exp = this.data.experiments[experimentId];
        if (!exp) return;
        exp.quizScores.push({ score, total, pct: (score / total) * 100, timestamp: Date.now() });
        if (exp.quizScores.length > 20) exp.quizScores = exp.quizScores.slice(-20);

        // Update concept accuracy
        if (conceptResults) {
            for (const [concept, correct] of Object.entries(conceptResults)) {
                if (!exp.conceptAccuracy[concept]) {
                    exp.conceptAccuracy[concept] = { correct: 0, total: 0 };
                }
                exp.conceptAccuracy[concept].total++;
                if (correct) exp.conceptAccuracy[concept].correct++;
            }
        }
        this._save();
    }

    getQuizScores(experimentId) {
        return this.data.experiments[experimentId]?.quizScores || [];
    }

    getAverageQuizScore(experimentId) {
        const scores = this.getQuizScores(experimentId);
        if (scores.length === 0) return 0;
        return scores.reduce((sum, s) => sum + s.pct, 0) / scores.length;
    }

    getOverallAccuracy() {
        let totalCorrect = 0, totalQuestions = 0;
        for (const exp of Object.values(this.data.experiments)) {
            exp.quizScores.forEach(s => { totalCorrect += s.score; totalQuestions += s.total; });
        }
        return totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    }

    getRecentAccuracy(count = 5) {
        const all = [];
        for (const exp of Object.values(this.data.experiments)) {
            all.push(...exp.quizScores);
        }
        all.sort((a, b) => b.timestamp - a.timestamp);
        const recent = all.slice(0, count);
        if (recent.length === 0) return 0;
        return recent.reduce((sum, s) => sum + s.pct, 0) / recent.length;
    }

    // ─── CONCEPT MASTERY ─────────────────────────────────
    getConceptAccuracy(experimentId) {
        return this.data.experiments[experimentId]?.conceptAccuracy || {};
    }

    getAllConceptAccuracy() {
        const all = {};
        for (const [expId, exp] of Object.entries(this.data.experiments)) {
            for (const [concept, data] of Object.entries(exp.conceptAccuracy)) {
                const key = `${expId}:${concept}`;
                all[key] = data.total > 0 ? (data.correct / data.total) * 100 : 0;
            }
        }
        return all;
    }

    // ─── ACHIEVEMENTS ────────────────────────────────────
    getAchievements() { return this.data.achievements; }
    hasAchievement(id) { return this.data.achievements.includes(id); }
    addAchievement(id) {
        if (!this.hasAchievement(id)) {
            this.data.achievements.push(id);
            this._save();
            return true;
        }
        return false;
    }

    // ─── CHALLENGES ──────────────────────────────────────
    saveChallengeScore(challengeId, score) {
        this.data.challengeScores.push({ challengeId, score, timestamp: Date.now() });
        if (this.data.challengeScores.length > 50) this.data.challengeScores = this.data.challengeScores.slice(-50);
        this._save();
    }

    getChallengeLeaderboard() {
        const board = {};
        this.data.challengeScores.forEach(s => {
            if (!board[s.challengeId] || s.score > board[s.challengeId].score) {
                board[s.challengeId] = s;
            }
        });
        return Object.values(board).sort((a, b) => b.score - a.score).slice(0, 10);
    }

    // ─── STORY ───────────────────────────────────────────
    getStoryProgress() { return this.data.storyProgress; }
    completeStoryMission(missionId) {
        if (!this.data.storyProgress.completed.includes(missionId)) {
            this.data.storyProgress.completed.push(missionId);
            this.data.storyProgress.currentMission++;
            this._save();
        }
    }

    // ─── STATS ───────────────────────────────────────────
    getStats() {
        const stats = { totalExperiments: this.data.totalExperiments, totalQuizzes: 0, avgAccuracy: 0, tier: this.data.tier };
        let totalScore = 0, totalQ = 0;
        for (const exp of Object.values(this.data.experiments)) {
            stats.totalQuizzes += exp.quizScores.length;
            exp.quizScores.forEach(s => { totalScore += s.score; totalQ += s.total; });
        }
        stats.avgAccuracy = totalQ > 0 ? ((totalScore / totalQ) * 100).toFixed(1) : 0;
        return stats;
    }

    // ─── ADMIN ───────────────────────────────────────────
    getAllData() { return JSON.parse(JSON.stringify(this.data)); }
    resetAll() {
        this.data = this._defaultData();
        this._save();
    }
}
