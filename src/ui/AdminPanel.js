/**
 * AdminPanel — teacher/admin mode for viewing student data and managing the system.
 */
export class AdminPanel {
    constructor(studentData) {
        this.studentData = studentData;
        this._createUI();
    }

    _createUI() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'admin-overlay';
        this.overlay.style.display = 'none';
        this.overlay.innerHTML = `
      <div class="admin-modal">
        <div class="admin-header">
          <h2>🔒 Teacher / Admin Panel</h2>
          <button class="admin-close" id="admin-close">✕</button>
        </div>
        <div class="admin-body" id="admin-body"></div>
        <div class="admin-footer">
          <button class="btn btn-danger" id="admin-reset">🗑️ Reset All Data</button>
          <button class="btn btn-secondary" id="admin-export">📥 Export Data</button>
        </div>
      </div>
    `;
        document.body.appendChild(this.overlay);

        document.getElementById('admin-close')?.addEventListener('click', () => this.hide());
        document.getElementById('admin-reset')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset ALL student data? This cannot be undone.')) {
                this.studentData.resetAll();
                this._render();
            }
        });
        document.getElementById('admin-export')?.addEventListener('click', () => {
            const data = JSON.stringify(this.studentData.getAllData(), null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'ncte_lab_data.json'; a.click();
            URL.revokeObjectURL(url);
        });
    }

    show() {
        this.overlay.style.display = 'flex';
        this._render();
    }

    hide() { this.overlay.style.display = 'none'; }

    _render() {
        const body = document.getElementById('admin-body');
        if (!body) return;

        const data = this.studentData.getAllData();
        const stats = this.studentData.getStats();
        const expNames = { projectile: 'Projectile Motion', 'ohms-law': "Ohm's Law", pendulum: 'Pendulum' };

        let html = `
      <div class="admin-section">
        <h3>📊 Usage Statistics</h3>
        <div class="admin-stats">
          <div class="admin-stat"><strong>${stats.totalExperiments}</strong><br>Total Experiments</div>
          <div class="admin-stat"><strong>${stats.totalQuizzes}</strong><br>Quizzes Taken</div>
          <div class="admin-stat"><strong>${stats.avgAccuracy}%</strong><br>Avg Accuracy</div>
          <div class="admin-stat"><strong>${stats.tier}</strong><br>Current Tier</div>
        </div>
      </div>

      <div class="admin-section">
        <h3>🧪 Experiment Usage</h3>
        <table class="admin-table">
          <tr><th>Experiment</th><th>Attempts</th><th>Quizzes</th><th>Avg Score</th></tr>
          ${Object.entries(data.experiments).map(([id, exp]) => `
            <tr>
              <td>${expNames[id] || id}</td>
              <td>${exp.attempts.length}</td>
              <td>${exp.quizScores.length}</td>
              <td>${exp.quizScores.length > 0 ? (exp.quizScores.reduce((s, q) => s + q.pct, 0) / exp.quizScores.length).toFixed(0) + '%' : '—'}</td>
            </tr>`).join('')}
        </table>
      </div>

      <div class="admin-section">
        <h3>⚠️ Concept Weakness Summary</h3>
        ${this._renderWeaknesses(data)}
      </div>

      <div class="admin-section">
        <h3>🏆 Achievements Unlocked</h3>
        <p>${data.achievements.length > 0 ? data.achievements.join(', ') : 'None yet'}</p>
      </div>

      <div class="admin-section">
        <h3>📅 Recent Activity</h3>
        ${this._renderRecentActivity(data)}
      </div>
    `;

        body.innerHTML = html;
    }

    _renderWeaknesses(data) {
        const weak = [];
        for (const [expId, exp] of Object.entries(data.experiments)) {
            for (const [concept, acc] of Object.entries(exp.conceptAccuracy)) {
                const pct = acc.total > 0 ? (acc.correct / acc.total) * 100 : 0;
                if (pct < 60 && acc.total > 0) {
                    weak.push({ concept, pct: pct.toFixed(0), experiment: expId });
                }
            }
        }

        if (weak.length === 0) return '<p class="admin-ok">✅ No significant weaknesses detected.</p>';

        return `<div class="weakness-list">
      ${weak.map(w => `<div class="weakness-item">
        <span class="wi-concept">${w.concept}</span>
        <span class="wi-exp">${w.experiment}</span>
        <span class="wi-pct" style="color:#ef4444">${w.pct}%</span>
      </div>`).join('')}
    </div>`;
    }

    _renderRecentActivity(data) {
        const activity = [];
        for (const [expId, exp] of Object.entries(data.experiments)) {
            exp.attempts.slice(-3).forEach(a => activity.push({ type: 'experiment', exp: expId, time: a.timestamp }));
            exp.quizScores.slice(-3).forEach(q => activity.push({ type: 'quiz', exp: expId, score: q.pct, time: q.timestamp }));
        }
        activity.sort((a, b) => b.time - a.time);

        if (activity.length === 0) return '<p>No activity recorded yet.</p>';

        return `<div class="activity-list">
      ${activity.slice(0, 10).map(a => `
        <div class="activity-item">
          <span class="act-icon">${a.type === 'quiz' ? '📝' : '🧪'}</span>
          <span class="act-desc">${a.type === 'quiz' ? `Quiz: ${a.score?.toFixed(0)}%` : 'Experiment'} — ${a.exp}</span>
          <span class="act-time">${new Date(a.time).toLocaleString()}</span>
        </div>`).join('')}
    </div>`;
    }

    dispose() {
        if (this.overlay?.parentElement) this.overlay.remove();
    }
}
