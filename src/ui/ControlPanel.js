export class ControlPanel {
    constructor(controlsContainerId, actionsContainerId) {
        this.controlsContainer = document.getElementById(controlsContainerId);
        this.actionsContainer = document.getElementById(actionsContainerId);
        this.sliders = {};
        this.callbacks = {};
    }

    /**
     * Set up sliders from config array:
     * [{ id, label, min, max, step, value, unit }]
     */
    setSliders(configs, onChange) {
        this.controlsContainer.innerHTML = '';
        this.sliders = {};
        this.callbacks.onChange = onChange;

        configs.forEach(cfg => {
            const group = document.createElement('div');
            group.className = 'slider-group';

            const label = document.createElement('div');
            label.className = 'slider-label';
            label.innerHTML = `
        <span>${cfg.label}</span>
        <span class="slider-value" id="val-${cfg.id}">${cfg.value} ${cfg.unit || ''}</span>
      `;

            const input = document.createElement('input');
            input.type = 'range';
            input.id = `slider-${cfg.id}`;
            input.min = cfg.min;
            input.max = cfg.max;
            input.step = cfg.step;
            input.value = cfg.value;

            input.addEventListener('input', () => {
                const val = parseFloat(input.value);
                document.getElementById(`val-${cfg.id}`).textContent = `${val} ${cfg.unit || ''}`;
                this.sliders[cfg.id] = val;
                if (this.callbacks.onChange) {
                    this.callbacks.onChange(cfg.id, val, this.getAllValues());
                }
            });

            this.sliders[cfg.id] = cfg.value;

            group.appendChild(label);
            group.appendChild(input);
            this.controlsContainer.appendChild(group);
        });
    }

    /**
     * Set action buttons:
     * [{ id, label, icon, className, onClick }]
     */
    setActions(actions) {
        this.actionsContainer.innerHTML = '';

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `btn ${action.className || 'btn-primary'} btn-block`;
            btn.id = `action-${action.id}`;
            btn.innerHTML = `${action.icon || ''} ${action.label}`;
            btn.addEventListener('click', action.onClick);
            this.actionsContainer.appendChild(btn);
        });
    }

    getAllValues() {
        return { ...this.sliders };
    }

    getValue(id) {
        return this.sliders[id];
    }

    setButtonLabel(id, label) {
        const btn = document.getElementById(`action-${id}`);
        if (btn) {
            const icon = btn.innerHTML.match(/^[^\s]+ /)?.[0] || '';
            btn.innerHTML = `${icon}${label}`;
        }
    }

    /**
     * Set toggle switches:
     * [{ id, label, value, onChange }]
     */
    setToggles(configs) {
        configs.forEach(cfg => {
            const group = document.createElement('div');
            group.className = 'toggle-group';

            const label = document.createElement('span');
            label.className = 'toggle-label';
            label.textContent = cfg.label;

            const switchEl = document.createElement('label');
            switchEl.className = 'toggle-switch';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `toggle-${cfg.id}`;
            input.checked = !!cfg.value;
            const slider = document.createElement('span');
            slider.className = 'toggle-slider';
            switchEl.appendChild(input);
            switchEl.appendChild(slider);

            input.addEventListener('change', () => {
                if (cfg.onChange) cfg.onChange(input.checked);
            });

            group.appendChild(label);
            group.appendChild(switchEl);
            this.controlsContainer.appendChild(group);
        });
    }

    /**
     * Set preset buttons:
     * label: group title, presets: [{ id, text, value, onClick }]
     */
    setPresets(label, presets, groupId) {
        const group = document.createElement('div');
        group.className = 'preset-group';
        if (groupId) group.id = `preset-group-${groupId}`;

        const title = document.createElement('span');
        title.className = 'preset-label';
        title.textContent = label;
        group.appendChild(title);

        const row = document.createElement('div');
        row.className = 'preset-row';

        presets.forEach((p, idx) => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.id = `preset-${p.id}`;
            btn.textContent = p.text;
            if (idx === 0) btn.classList.add('active');
            btn.addEventListener('click', () => {
                row.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (p.onClick) p.onClick(p.value);
            });
            row.appendChild(btn);
        });

        group.appendChild(row);
        this.controlsContainer.appendChild(group);
    }

    /**
     * Programmatically update a slider value (syncs UI + internal state)
     */
    updateSlider(id, value) {
        const input = document.getElementById(`slider-${id}`);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input'));
        }
    }

    clear() {
        this.controlsContainer.innerHTML = '';
        this.actionsContainer.innerHTML = '';
        this.sliders = {};
    }
}
