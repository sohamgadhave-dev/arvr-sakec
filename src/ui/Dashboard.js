/**
 * Dashboard — concept heatmap, analytics, achievements, class board.
 */
export class Dashboard {
    constructor(studentData, achievementSystem, adaptiveLearning) {
        this.studentData = studentData;
        this.achievements = achievementSystem;
        this.adaptive = adaptiveLearning;
        this._createOverlay();
    }

    _createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'dashboard-overlay';
        this.overlay.style.display = 'none';
        this.overlay.innerHTML = `
      <div class="dashboard-modal">
        <div class="dash-header">
          <h2>📊 Student Dashboard</h2>
          <button class="dash-close" id="dash-close">✕</button>
        </div>
        <div class="dash-tabs">
          <button class="dash-tab active" data-tab="overview">Overview</button>
          <button class="dash-tab" data-tab="heatmap">Concept Map</button>
          <button class="dash-tab" data-tab="achievements">Badges</button>
          <button class="dash-tab" data-tab="class">Class Board</button>
          <button class="dash-tab" data-tab="leaderboard">Leaderboard</button>
        </div>
        <div class="dash-body" id="dash-body"></div>
      </div>
    `;
        document.body.appendChild(this.overlay);

        document.getElementById('dash-close')?.addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.hide(); });

        this.overlay.querySelectorAll('.dash-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.overlay.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._renderTab(tab.dataset.tab);
            });
        });
    }

    show() {
        this.overlay.style.display = 'flex';
        this._renderTab('overview');
    }

    hide() { this.overlay.style.display = 'none'; }

    _renderTab(tab) {
        const body = document.getElementById('dash-body');
        if (!body) return;

        switch (tab) {
            case 'overview': body.innerHTML = this._renderOverview(); break;
            case 'heatmap': body.innerHTML = this._renderHeatmap(); break;
            case 'achievements': body.innerHTML = this._renderAchievements(); break;
            case 'class': body.innerHTML = this._renderClassBoard(); break;
            case 'leaderboard': body.innerHTML = this._renderLeaderboard(); break;
        }
    }

    _renderOverview() {
        const stats = this.studentData.getStats();
        const tierInfo = this.adaptive.getTierInfo();
        const scores = [];
        ['projectile', 'ohms-law', 'pendulum'].forEach(exp => {
            const s = this.studentData.getQuizScores(exp);
            if (s.length > 0) scores.push({ exp, avg: this.studentData.getAverageQuizScore(exp).toFixed(0) });
        });

        return `
      <div class="dash-overview">
        <div class="dash-stat-grid">
          <div class="dash-stat-card">
            <div class="stat-icon">🧪</div>
            <div class="stat-value">${stats.totalExperiments}</div>
            <div class="stat-label">Experiments</div>
          </div>
          <div class="dash-stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">${stats.totalQuizzes}</div>
            <div class="stat-label">Quizzes Taken</div>
          </div>
          <div class="dash-stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">${stats.avgAccuracy}%</div>
            <div class="stat-label">Accuracy</div>
          </div>
          <div class="dash-stat-card">
            <div class="stat-icon">${tierInfo.icon}</div>
            <div class="stat-value" style="color:${tierInfo.color}">${tierInfo.label}</div>
            <div class="stat-label">Tier (Lv ${tierInfo.level})</div>
          </div>
        </div>
        <div class="dash-experiment-scores">
          <h3>Quiz Averages</h3>
          ${scores.length > 0 ? scores.map(s => `
            <div class="score-bar-row">
              <span class="score-label">${s.exp}</span>
              <div class="score-bar-bg"><div class="score-bar-fill" style="width:${s.avg}%; background:${s.avg >= 80 ? '#22c55e' : s.avg >= 50 ? '#f59e0b' : '#ef4444'}"></div></div>
              <span class="score-val">${s.avg}%</span>
            </div>`).join('') : '<p class="dash-empty">No quiz data yet. Take a quiz to see your scores!</p>'}
        </div>
      </div>`;
    }

    _renderHeatmap() {
        const concepts = {
            projectile: [
                { id: 'angle_understanding', label: 'Angle & Range' },
                { id: 'range_formula', label: 'Range Formula' },
                { id: 'symmetry', label: 'Symmetry (Complementary)' },
                { id: 'velocity_effect', label: 'Velocity Effect' },
                { id: 'trajectory_shape', label: 'Trajectory Shape' }
            ],
            'ohms-law': [
                { id: 'ohms_law_formula', label: "Ohm's Law (V=IR)" },
                { id: 'resistance_units', label: 'Resistance Units' },
                { id: 'power_formula', label: 'Power (P=I²R)' },
                { id: 'vi_graph', label: 'V-I Graph' },
                { id: 'current_flow', label: 'Current Flow' }
            ],
            pendulum: [
                { id: 'period_formula', label: 'Period Formula' },
                { id: 'length_effect', label: 'Length Effect' },
                { id: 'gravity_effect', label: 'Gravity Effect' },
                { id: 'small_angle', label: 'Small Angle Approx' },
                { id: 'energy_conversion', label: 'Energy Conversion' }
            ]
        };

        const allAccuracy = this.studentData.getAllConceptAccuracy();
        const expNames = { projectile: 'Projectile Motion', 'ohms-law': "Ohm's Law", pendulum: 'Pendulum' };

        let html = '<div class="heatmap-container">';
        for (const [exp, cs] of Object.entries(concepts)) {
            html += `<div class="heatmap-section"><h3>${expNames[exp]}</h3><div class="heatmap-grid">`;
            cs.forEach(c => {
                const key = `${exp}:${c.id}`;
                const acc = allAccuracy[key];
                const color = acc === undefined ? '#374151' : acc >= 80 ? '#22c55e' : acc >= 50 ? '#f59e0b' : '#ef4444';
                const label = acc !== undefined ? `${acc.toFixed(0)}%` : '—';
                html += `<div class="heatmap-cell" style="background:${color}20; border-left: 3px solid ${color}">
          <span class="hm-label">${c.label}</span>
          <span class="hm-value" style="color:${color}">${label}</span>
        </div>`;
            });
            html += '</div></div>';
        }
        html += '</div>';
        return html;
    }

    _renderAchievements() {
        const badges = this.achievements.getAllBadges();
        return `<div class="badge-grid">
      ${badges.map(b => `
        <div class="badge-card ${b.unlocked ? 'unlocked' : 'locked'}">
          <div class="badge-icon">${b.unlocked ? b.icon : '🔒'}</div>
          <div class="badge-title">${b.title}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>`).join('')}
    </div>`;
    }

    _renderClassBoard() {
        // Mock class data for institutional feel
        const studentAcc = parseFloat(this.studentData.getStats().avgAccuracy) || 0;
        const mockStudents = [];
        for (let i = 0; i < 30; i++) {
            mockStudents.push(Math.round(30 + Math.random() * 60));
        }
        mockStudents.sort((a, b) => b - a);
        const classAvg = (mockStudents.reduce((s, v) => s + v, 0) / mockStudents.length).toFixed(1);
        const rank = mockStudents.filter(s => s < studentAcc).length + 1;
        const percentile = ((rank / 31) * 100).toFixed(0);

        return `
      <div class="class-board">
        <div class="class-stat-grid">
          <div class="class-stat"><div class="cs-value">${classAvg}%</div><div class="cs-label">Class Average</div></div>
          <div class="class-stat"><div class="cs-value">${studentAcc.toFixed(0)}%</div><div class="cs-label">Your Score</div></div>
          <div class="class-stat"><div class="cs-value">#${rank}</div><div class="cs-label">Rank (of 31)</div></div>
          <div class="class-stat"><div class="cs-value">${percentile}th</div><div class="cs-label">Percentile</div></div>
        </div>
        <h3>Class Distribution</h3>
        <div class="class-histogram">
          ${['90-100', '80-89', '70-79', '60-69', '50-59', '40-49', '<40'].map(range => {
            const [lo, hi] = range.startsWith('<') ? [0, 39] : range.split('-').map(Number);
            const count = mockStudents.filter(s => s >= lo && s <= (hi || 100)).length;
            const isYou = studentAcc >= lo && studentAcc <= (hi || 100);
            return `<div class="hist-row">
              <span class="hist-label">${range}%</span>
              <div class="hist-bar-bg"><div class="hist-bar" style="width:${(count / 30) * 100}%">${count > 0 ? count : ''}</div></div>
              ${isYou ? '<span class="hist-you">← You</span>' : ''}
            </div>`;
        }).join('')}
        </div>
      </div>`;
    }

    _renderLeaderboard() {
        const board = this.studentData.getChallengeLeaderboard();
        if (board.length === 0) {
            return '<div class="dash-empty">No challenge scores yet. Try a challenge to see your leaderboard!</div>';
        }
        return `<div class="leaderboard">
      <table class="lb-table">
        <tr><th>#</th><th>Challenge</th><th>Score</th><th>Date</th></tr>
        ${board.map((s, i) => `<tr>
          <td>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
          <td>${s.challengeId}</td>
          <td><strong>${s.score}</strong></td>
          <td>${new Date(s.timestamp).toLocaleDateString()}</td>
        </tr>`).join('')}
      </table>
    </div>`;
    }

    dispose() {
        if (this.overlay?.parentElement) this.overlay.remove();
    }
}
