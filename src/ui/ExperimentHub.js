export class ExperimentHub {
    constructor(containerId, onSelect) {
        this.container = document.getElementById(containerId);
        this.onSelect = onSelect;

        this.experiments = [
            {
                id: 'projectile',
                icon: '🚀',
                title: 'Projectile Motion',
                description: 'Launch a projectile and study its trajectory. Explore how angle, velocity, and gravity affect range and height.',
                tags: ['Mechanics', 'Kinematics', '2D Motion'],
                color: '#f59e0b',
                glow: 'rgba(245, 158, 11, 0.3)'
            },
            {
                id: 'ohms-law',
                icon: '⚡',
                title: "Ohm's Law Circuit",
                description: 'Build a simple circuit and observe the relationship between voltage, resistance, and current flow.',
                tags: ['Electrical', 'DC Circuits', 'V-I Relation'],
                color: '#22c55e',
                glow: 'rgba(34, 197, 94, 0.3)'
            },
            {
                id: 'pendulum',
                icon: '🔔',
                title: 'Simple Pendulum',
                description: 'Swing a pendulum and measure its time period. Study the effect of string length and gravity on oscillation.',
                tags: ['Mechanics', 'Oscillation', 'SHM'],
                color: '#06b6d4',
                glow: 'rgba(6, 182, 212, 0.3)'
            }
        ];

        this._render();
    }

    _render() {
        this.container.innerHTML = '';

        this.experiments.forEach((exp, index) => {
            const card = document.createElement('div');
            card.className = 'experiment-card';
            card.style.setProperty('--card-accent', exp.color);
            card.style.setProperty('--card-glow', exp.glow);
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
        <div class="card-number">Experiment ${String(index + 1).padStart(2, '0')}</div>
        <div class="card-icon">${exp.icon}</div>
        <h3>${exp.title}</h3>
        <p>${exp.description}</p>
        <div class="card-tags">
          ${exp.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}
        </div>
        <div class="card-arrow">→</div>
      `;

            card.addEventListener('click', () => this.onSelect(exp.id));
            this.container.appendChild(card);
        });
    }

    getExperimentName(id) {
        const exp = this.experiments.find(e => e.id === id);
        return exp ? exp.title : id;
    }
}
