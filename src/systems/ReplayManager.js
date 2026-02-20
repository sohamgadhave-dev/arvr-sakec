/**
 * ReplayManager — store/replay previous experiment attempts with ghost trails.
 */
export class ReplayManager {
    constructor(studentData) {
        this.studentData = studentData;
        this.ghostTrails = [];
    }

    /**
     * Get previous attempts for comparison.
     */
    getPreviousAttempts(experimentId, limit = 5) {
        return this.studentData.getAttempts(experimentId).slice(-limit);
    }

    /**
     * Calculate improvement percentage between two attempts.
     */
    getImprovement(experimentId) {
        const attempts = this.studentData.getAttempts(experimentId);
        if (attempts.length < 2) return null;

        const recent = attempts[attempts.length - 1];
        const previous = attempts[attempts.length - 2];

        if (!recent.accuracy || !previous.accuracy) return null;

        const improvement = ((recent.accuracy - previous.accuracy) / Math.max(previous.accuracy, 1)) * 100;
        return {
            improvement: improvement.toFixed(1),
            recentAccuracy: recent.accuracy,
            previousAccuracy: previous.accuracy,
            trend: improvement > 0 ? 'improving' : improvement < 0 ? 'declining' : 'stable'
        };
    }

    /**
     * Get trajectory data for ghost trail rendering.
     */
    getGhostTrajectory(experimentId, attemptIndex = -1) {
        const attempts = this.studentData.getAttempts(experimentId);
        if (attempts.length === 0) return null;

        const idx = attemptIndex < 0 ? attempts.length + attemptIndex : attemptIndex;
        const attempt = attempts[idx];
        if (!attempt || !attempt.trajectory) return null;

        return {
            trajectory: attempt.trajectory,
            params: attempt,
            label: `Attempt ${idx + 1}`
        };
    }

    /**
     * Get comparison summary between best and latest.
     */
    getComparisonSummary(experimentId) {
        const attempts = this.studentData.getAttempts(experimentId);
        if (attempts.length < 2) return null;

        const latest = attempts[attempts.length - 1];
        const best = attempts.reduce((b, a) => (!b || (a.accuracy || 0) > (b.accuracy || 0)) ? a : b, null);

        return {
            latest,
            best,
            attemptCount: attempts.length,
            improvementFromBest: best && latest ? ((latest.accuracy || 0) - (best.accuracy || 0)).toFixed(1) : null
        };
    }
}
