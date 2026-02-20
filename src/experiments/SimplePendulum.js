import * as THREE from 'three';

export class SimplePendulum {
    constructor(sceneManager, controlPanel, dataDisplay) {
        this.scene = sceneManager;
        this.controls = controlPanel;
        this.data = dataDisplay;
        this.group = new THREE.Group();

        // Parameters
        this.length = 2.0;
        this.gravity = 9.8;
        this.amplitude = 30;
        this.damping = 0;
        this.isSwinging = false;
        this.currentAngle = 0;
        this.angularVelocity = 0;
        this.elapsed = 0;
        this.periodTimer = 0;
        this.crossCount = 0;
        this.measuredPeriod = 0;
        this.tracePoints = [];
        this.oscillationCount = 0;
        this.maxSpeed = 0;

        // Energy tracking
        this.kineticEnergy = 0;
        this.potentialEnergy = 0;
        this.totalEnergy = 0;
        this.mass = 0.5; // kg

        // Phase portrait data
        this.phaseData = [];

        this._build();
        this._setupControls();
        this._setupData();
        this._updatePendulumGeometry();
        this._updateCalculations();
        this.currentAngle = THREE.MathUtils.degToRad(this.amplitude);
        this.pendulumGroup.rotation.z = this.currentAngle;

        this.scene.addToScene(this.group);
        this.scene.setCameraPosition(0, 4, 8);
        this.scene.setCameraTarget(0, 2.5, 0);

        this._animateBound = this._animate.bind(this);
        this.scene.onAnimate(this._animateBound);
    }

    _build() {
        this._createStand();
        this._createPendulum();
        this._createProtractor();
        this._createTraceArc();
        this._createEnergyBars();
        this._createAngleReadout();
        this._createShadowProjection();
        this._createPhaseGraph();
        this._createTimerDisplay();
        this._createSpeedometer();
    }

    _createStand() {
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x5a6070,
            metalness: 0.7,
            roughness: 0.25
        });

        // Vertical pole (tapered)
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.08, 5.2, 14);
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.set(0, 2.6, 0);
        pole.castShadow = true;
        this.group.add(pole);

        // Top horizontal arm with reinforcement
        const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 10);
        const arm = new THREE.Mesh(armGeo, metalMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(0, 5.2, 0);
        arm.castShadow = true;
        this.group.add(arm);

        // Diagonal brace
        const braceGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
        const brace = new THREE.Mesh(braceGeo, metalMat);
        brace.position.set(-0.35, 4.75, 0);
        brace.rotation.z = Math.PI / 4;
        brace.castShadow = true;
        this.group.add(brace);

        // Heavy base (more detailed)
        const baseGeo = new THREE.BoxGeometry(2.5, 0.2, 1.5);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x3a3520,
            roughness: 0.55,
            metalness: 0.15
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.1;
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);

        // Base feet
        const footMat = new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.8, roughness: 0.2 });
        [[-1, 0, -0.5], [1, 0, -0.5], [-1, 0, 0.5], [1, 0, 0.5]].forEach(pos => {
            const footGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.05, 10);
            const foot = new THREE.Mesh(footGeo, footMat);
            foot.position.set(...pos);
            this.group.add(foot);
        });

        // Scale ruler on base
        for (let i = -5; i <= 5; i++) {
            const tickGeo = new THREE.BoxGeometry(0.01, 0.02, i % 5 === 0 ? 0.4 : 0.2);
            const tickMat = new THREE.MeshBasicMaterial({
                color: i % 5 === 0 ? 0xf59e0b : 0x666,
                transparent: true,
                opacity: 0.6
            });
            const tick = new THREE.Mesh(tickGeo, tickMat);
            tick.position.set(i * 0.2, 0.21, 0);
            this.group.add(tick);
        }
    }

    _createPendulum() {
        this.pendulumGroup = new THREE.Group();
        this.pendulumGroup.position.set(0, 5.2, 0);

        // String (thin rod)
        const stringGeo = new THREE.CylinderGeometry(0.012, 0.012, this.length, 8);
        const stringMat = new THREE.MeshStandardMaterial({
            color: 0xccc4a8,
            roughness: 0.7,
            metalness: 0.1
        });
        this.string = new THREE.Mesh(stringGeo, stringMat);
        this.string.position.y = -this.length / 2;
        this.string.castShadow = true;
        this.pendulumGroup.add(this.string);

        // Bob (metallic sphere with specular highlight)
        const bobGeo = new THREE.SphereGeometry(0.22, 24, 24);
        const bobMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.1
        });
        this.bob = new THREE.Mesh(bobGeo, bobMat);
        this.bob.position.y = -this.length;
        this.bob.castShadow = true;
        this.pendulumGroup.add(this.bob);

        // Inner glow
        const innerGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.3
        });
        this.bob.add(new THREE.Mesh(innerGeo, innerMat));

        // Bob glow aura
        const glowGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.06,
            blending: THREE.AdditiveBlending
        });
        this.bobGlow = new THREE.Mesh(glowGeo, glowMat);
        this.bob.add(this.bobGlow);

        // Point light on bob
        this.bobLight = new THREE.PointLight(0x06b6d4, 0.3, 3);
        this.bob.add(this.bobLight);

        // Pivot mechanism (detailed)
        const pivotGeo = new THREE.SphereGeometry(0.06, 14, 14);
        const pivotMat = new THREE.MeshStandardMaterial({ color: 0x999, metalness: 0.9, roughness: 0.1 });
        const pivot = new THREE.Mesh(pivotGeo, pivotMat);
        this.pendulumGroup.add(pivot);

        // Pivot ring
        const ringGeo = new THREE.TorusGeometry(0.08, 0.015, 8, 16);
        const ring = new THREE.Mesh(ringGeo, pivotMat);
        ring.rotation.x = Math.PI / 2;
        this.pendulumGroup.add(ring);

        this.group.add(this.pendulumGroup);
    }

    _createProtractor() {
        const protractorGroup = new THREE.Group();
        protractorGroup.position.set(0, 5.2, 0.02);

        // Full semicircular protractor
        const arcGeo = new THREE.RingGeometry(0.8, 0.85, 48, 1, -Math.PI / 2, Math.PI);
        const arcMat = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        protractorGroup.add(new THREE.Mesh(arcGeo, arcMat));

        // Degree markings
        for (let deg = -90; deg <= 90; deg += 10) {
            const rad = THREE.MathUtils.degToRad(deg);
            const isMain = deg % 30 === 0;
            const innerR = isMain ? 0.72 : 0.76;
            const outerR = 0.85;

            const points = [
                new THREE.Vector3(Math.sin(rad) * innerR, -Math.cos(rad) * innerR, 0),
                new THREE.Vector3(Math.sin(rad) * outerR, -Math.cos(rad) * outerR, 0)
            ];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: isMain ? 0xa78bfa : 0x6d28d9,
                transparent: true,
                opacity: isMain ? 0.6 : 0.3
            });
            protractorGroup.add(new THREE.Line(lineGeo, lineMat));

            // Degree labels for major ticks
            if (isMain && deg !== 0) {
                const label = this._makeLabel(`${Math.abs(deg)}°`, '#a78bfa', 10);
                label.position.set(Math.sin(rad) * 0.65, -Math.cos(rad) * 0.65, 0.01);
                label.scale.set(0.5, 0.25, 1);
                protractorGroup.add(label);
            }
        }

        // Vertical reference line
        const refPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1.0, 0)];
        const refGeo = new THREE.BufferGeometry().setFromPoints(refPoints);
        const refMat = new THREE.LineDashedMaterial({
            color: 0x475569,
            transparent: true,
            opacity: 0.4,
            dashSize: 0.05,
            gapSize: 0.03
        });
        const refLine = new THREE.Line(refGeo, refMat);
        refLine.computeLineDistances();
        protractorGroup.add(refLine);

        // Current angle indicator line
        this.angleIndicator = new THREE.Group();
        const indicatorPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.9, 0)];
        const indicatorGeo = new THREE.BufferGeometry().setFromPoints(indicatorPoints);
        const indicatorMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 });
        this.angleIndicator.add(new THREE.Line(indicatorGeo, indicatorMat));
        protractorGroup.add(this.angleIndicator);

        this.group.add(protractorGroup);
    }

    _createTraceArc() {
        this.traceGeometry = new THREE.BufferGeometry();
        this.traceMaterial = new THREE.LineBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.5
        });
        this.traceLine = new THREE.Line(this.traceGeometry, this.traceMaterial);
        this.group.add(this.traceLine);
    }

    _createEnergyBars() {
        this.energyGroup = new THREE.Group();
        this.energyGroup.position.set(3, 0, 0);

        // Panel background
        const panelGeo = new THREE.PlaneGeometry(2, 5);
        const panelMat = new THREE.MeshBasicMaterial({
            color: 0x111827,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.y = 2.5;
        this.energyGroup.add(panel);

        // Title
        const title = this._makeLabel('ENERGY', '#a5b4fc', 16);
        title.position.set(0, 4.7, 0.01);
        title.scale.set(1.5, 0.75, 1);
        this.energyGroup.add(title);

        // KE bar
        const keBarGeo = new THREE.BoxGeometry(0.4, 0.01, 0.25);
        const keBarMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        this.keBar = new THREE.Mesh(keBarGeo, keBarMat);
        this.keBar.position.set(-0.4, 0.5, 0.01);
        this.energyGroup.add(this.keBar);

        const keLabel = this._makeLabel('KE', '#f59e0b', 14);
        keLabel.position.set(-0.4, 0.1, 0.01);
        keLabel.scale.set(0.8, 0.4, 1);
        this.energyGroup.add(keLabel);

        this.keValueLabel = this._makeLabel('0 J', '#f59e0b', 12);
        this.keValueLabel.position.set(-0.4, 0.6, 0.01);
        this.keValueLabel.scale.set(0.8, 0.4, 1);
        this.energyGroup.add(this.keValueLabel);

        // PE bar
        const peBarGeo = new THREE.BoxGeometry(0.4, 0.01, 0.25);
        const peBarMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        this.peBar = new THREE.Mesh(peBarGeo, peBarMat);
        this.peBar.position.set(0.4, 0.5, 0.01);
        this.energyGroup.add(this.peBar);

        const peLabel = this._makeLabel('PE', '#22c55e', 14);
        peLabel.position.set(0.4, 0.1, 0.01);
        peLabel.scale.set(0.8, 0.4, 1);
        this.energyGroup.add(peLabel);

        this.peValueLabel = this._makeLabel('0 J', '#22c55e', 12);
        this.peValueLabel.position.set(0.4, 0.6, 0.01);
        this.peValueLabel.scale.set(0.8, 0.4, 1);
        this.energyGroup.add(this.peValueLabel);

        // Total energy line
        this.totalELabel = this._makeLabel('Total: 0 J', '#ef4444', 12);
        this.totalELabel.position.set(0, 4.3, 0.01);
        this.totalELabel.scale.set(1.5, 0.6, 1);
        this.energyGroup.add(this.totalELabel);

        this.group.add(this.energyGroup);
    }

    _createAngleReadout() {
        // Floating angle readout near bob
        this.angleReadout = this._makeLabel('0.0°', '#f59e0b', 22);
        this.angleReadout.position.set(0, 5.2, 0.5);
        this.angleReadout.scale.set(1.5, 0.75, 1);
        this.group.add(this.angleReadout);
    }

    _createShadowProjection() {
        // Ground projection showing pendulum shadow/position
        this.shadowDot = new THREE.Mesh(
            new THREE.CircleGeometry(0.1, 16),
            new THREE.MeshBasicMaterial({
                color: 0x06b6d4,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            })
        );
        this.shadowDot.rotation.x = -Math.PI / 2;
        this.shadowDot.position.y = 0.02;
        this.group.add(this.shadowDot);

        // Shadow line (vertical projection)
        const shadowLinePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5, 0)];
        const shadowLineGeo = new THREE.BufferGeometry().setFromPoints(shadowLinePoints);
        const shadowLineMat = new THREE.LineDashedMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.1,
            dashSize: 0.1,
            gapSize: 0.05
        });
        this.shadowLine = new THREE.Line(shadowLineGeo, shadowLineMat);
        this.shadowLine.computeLineDistances();
        this.group.add(this.shadowLine);
    }

    _createPhaseGraph() {
        // Phase portrait graph (θ vs ω)
        this.phaseCanvas = document.createElement('canvas');
        this.phaseCanvas.width = 220;
        this.phaseCanvas.height = 120;
        this.phaseCtx = this.phaseCanvas.getContext('2d');

        const container = document.getElementById('data-display');
        if (container) {
            const graphDiv = document.createElement('div');
            graphDiv.className = 'graph-container';
            graphDiv.appendChild(this.phaseCanvas);
            container.appendChild(graphDiv);
            this.phaseGraphDiv = graphDiv;
        }
        this._drawPhaseGraph();
    }

    _createTimerDisplay() {
        // Oscillation counter & timer in 3D
        this.timerGroup = new THREE.Group();
        this.timerGroup.position.set(-3.5, 3, 0);

        const panelGeo = new THREE.PlaneGeometry(2.5, 2);
        const panelMat = new THREE.MeshBasicMaterial({
            color: 0x111827,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.timerGroup.add(new THREE.Mesh(panelGeo, panelMat));

        const title = this._makeLabel('OSCILLATION', '#a5b4fc', 14);
        title.position.set(0, 0.75, 0.01);
        title.scale.set(1.5, 0.7, 1);
        this.timerGroup.add(title);

        this.oscCountLabel = this._makeLabel('Count: 0', '#06b6d4', 18);
        this.oscCountLabel.position.set(0, 0.2, 0.01);
        this.oscCountLabel.scale.set(2, 0.8, 1);
        this.timerGroup.add(this.oscCountLabel);

        this.elapsedLabel = this._makeLabel('Time: 0.0s', '#94a3b8', 14);
        this.elapsedLabel.position.set(0, -0.3, 0.01);
        this.elapsedLabel.scale.set(1.8, 0.7, 1);
        this.timerGroup.add(this.elapsedLabel);

        this.measuredTLabel = this._makeLabel('T: —', '#22c55e', 18);
        this.measuredTLabel.position.set(0, -0.8, 0.01);
        this.measuredTLabel.scale.set(2, 0.8, 1);
        this.timerGroup.add(this.measuredTLabel);

        this.group.add(this.timerGroup);
    }

    _createSpeedometer() {
        // Speed indicator near bob
        this.speedGroup = new THREE.Group();
        this.speedGroup.position.set(-3.5, 1, 0);

        const panelGeo = new THREE.PlaneGeometry(2.5, 1.2);
        const panelMat = new THREE.MeshBasicMaterial({
            color: 0x111827,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.speedGroup.add(new THREE.Mesh(panelGeo, panelMat));

        const title = this._makeLabel('BOB SPEED', '#a5b4fc', 12);
        title.position.set(0, 0.4, 0.01);
        title.scale.set(1.5, 0.6, 1);
        this.speedGroup.add(title);

        this.speedValueLabel = this._makeLabel('0.00 m/s', '#ef4444', 20);
        this.speedValueLabel.position.set(0, -0.1, 0.01);
        this.speedValueLabel.scale.set(2, 0.8, 1);
        this.speedGroup.add(this.speedValueLabel);

        this.group.add(this.speedGroup);
    }

    _updatePendulumGeometry() {
        this.string.geometry.dispose();
        this.string.geometry = new THREE.CylinderGeometry(0.012, 0.012, this.length, 8);
        this.string.position.y = -this.length / 2;
        this.bob.position.y = -this.length;
    }

    _drawPhaseGraph() {
        const ctx = this.phaseCtx;
        const w = 220, h = 120;
        const pad = 25;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0f1e';
        ctx.fillRect(0, 0, w, h);

        // Axes
        const cx = w / 2, cy = h / 2;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad, cy); ctx.lineTo(w - pad, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, pad); ctx.lineTo(cx, h - pad); ctx.stroke();

        // Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('θ (angle)', w - 35, cy - 5);
        ctx.save();
        ctx.translate(cx + 8, pad + 5);
        ctx.fillText('ω', 0, 0);
        ctx.restore();

        // Title
        ctx.fillStyle = '#8b5cf6';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText('Phase Portrait', w / 2, pad - 8);

        // Draw phase data
        if (this.phaseData.length > 1) {
            const maxT = Math.PI / 2;
            const maxW = Math.max(...this.phaseData.map(d => Math.abs(d.omega)), 1);
            const scaleX = (w - 2 * pad) / (2 * maxT);
            const scaleY = (h - 2 * pad) / (2 * maxW);

            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 3;
            ctx.beginPath();
            this.phaseData.forEach((d, i) => {
                const px = cx + d.theta * scaleX;
                const py = cy - d.omega * scaleY;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Current point
            const last = this.phaseData[this.phaseData.length - 1];
            const lpx = cx + last.theta * scaleX;
            const lpy = cy - last.omega * scaleY;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath(); ctx.arc(lpx, lpy, 4, 0, Math.PI * 2); ctx.fill();
        }
    }

    _setupControls() {
        this.controls.setSliders([
            { id: 'length', label: '📏 String Length', min: 0.3, max: 4, step: 0.1, value: this.length, unit: 'm' },
            { id: 'gravity', label: '🌍 Gravity', min: 1, max: 20, step: 0.1, value: this.gravity, unit: 'm/s²' },
            { id: 'amplitude', label: '📐 Amplitude', min: 5, max: 80, step: 1, value: this.amplitude, unit: '°' },
            { id: 'damping', label: '💧 Damping', min: 0, max: 0.5, step: 0.01, value: this.damping, unit: '' },
            { id: 'mass', label: '⚖️ Bob Mass', min: 0.1, max: 5, step: 0.1, value: this.mass, unit: 'kg' }
        ], (id, val, all) => {
            this.length = all.length;
            this.gravity = all.gravity;
            this.amplitude = all.amplitude;
            this.damping = all.damping;
            this.mass = all.mass;
            this._updatePendulumGeometry();
            this._updateCalculations();
            if (!this.isSwinging) {
                this.currentAngle = THREE.MathUtils.degToRad(this.amplitude);
                this.pendulumGroup.rotation.z = this.currentAngle;
            }
            // Update bob size based on mass
            const scale = 0.7 + this.mass * 0.2;
            this.bob.scale.set(scale, scale, scale);
        });

        this.controls.setActions([
            {
                id: 'start',
                label: 'Start ▶️',
                icon: '',
                className: 'btn-success',
                onClick: () => this._toggleSwing()
            },
            {
                id: 'reset',
                label: 'Reset 🔄',
                icon: '',
                className: 'btn-secondary',
                onClick: () => this._reset()
            }
        ]);
    }

    _setupData() {
        this.data.setData([
            { id: 'period', label: 'Period (T)', value: '0.000', unit: 's' },
            { id: 'frequency', label: 'Frequency (f)', value: '0.000', unit: 'Hz' },
            { id: 'omega', label: 'ω (natural)', value: '0.000', unit: 'rad/s' },
            { id: 'current-angle', label: 'Current Angle', value: '0.0', unit: '°' },
            { id: 'angular-vel', label: 'Angular Vel.', value: '0.000', unit: 'rad/s' },
            { id: 'bob-speed', label: 'Bob Speed', value: '0.000', unit: 'm/s' },
            { id: 'ke', label: 'Kinetic Energy', value: '0.000', unit: 'J' },
            { id: 'pe', label: 'Potential Energy', value: '0.000', unit: 'J' },
            { id: 'measured-period', label: 'Measured T', value: '—', unit: '' }
        ]);

        this.data.setFormulas([
            'T = 2π√(L/g)',
            'f = 1/T',
            'ω₀ = √(g/L)',
            'α = −(g/L)·sin(θ)',
            'KE = ½mv²',
            'PE = mgL(1−cos θ)',
            'E = KE + PE = const'
        ]);
    }

    _updateCalculations() {
        const T = 2 * Math.PI * Math.sqrt(this.length / this.gravity);
        const f = 1 / T;
        const omega0 = Math.sqrt(this.gravity / this.length);

        this.data.updateValue('period', T.toFixed(3), 's');
        this.data.updateValue('frequency', f.toFixed(3), 'Hz');
        this.data.updateValue('omega', omega0.toFixed(3), 'rad/s');
    }

    _toggleSwing() {
        if (this.isSwinging) {
            this.isSwinging = false;
            const btn = document.getElementById('action-start');
            if (btn) btn.innerHTML = 'Start ▶️';
        } else {
            this.isSwinging = true;
            this.currentAngle = THREE.MathUtils.degToRad(this.amplitude);
            this.angularVelocity = 0;
            this.elapsed = 0;
            this.periodTimer = 0;
            this.crossCount = 0;
            this.oscillationCount = 0;
            this.maxSpeed = 0;
            this.tracePoints = [];
            this.phaseData = [];
            const btn = document.getElementById('action-start');
            if (btn) btn.innerHTML = 'Pause ⏸️';
        }
    }

    _reset() {
        this.isSwinging = false;
        this.currentAngle = THREE.MathUtils.degToRad(this.amplitude);
        this.angularVelocity = 0;
        this.elapsed = 0;
        this.crossCount = 0;
        this.oscillationCount = 0;
        this.measuredPeriod = 0;
        this.maxSpeed = 0;
        this.tracePoints = [];
        this.phaseData = [];

        this.pendulumGroup.rotation.z = this.currentAngle;
        this.data.updateValue('current-angle', this.amplitude.toFixed(1), '°');
        this.data.updateValue('angular-vel', '0.000', 'rad/s');
        this.data.updateValue('bob-speed', '0.000', 'm/s');
        this.data.updateValue('ke', '0.000', 'J');
        this.data.updateValue('pe', '0.000', 'J');
        this.data.updateValue('measured-period', '—');

        this._updateLabelText(this.oscCountLabel, 'Count: 0', '#06b6d4');
        this._updateLabelText(this.elapsedLabel, 'Time: 0.0s', '#94a3b8');
        this._updateLabelText(this.measuredTLabel, 'T: —', '#22c55e');

        // Clear trace
        this.traceGeometry.dispose();
        this.traceGeometry = new THREE.BufferGeometry();
        this.traceLine.geometry = this.traceGeometry;

        this._drawPhaseGraph();

        const btn = document.getElementById('action-start');
        if (btn) btn.innerHTML = 'Start ▶️';
    }

    _animate(delta) {
        // Update angle indicator
        this.angleIndicator.rotation.z = this.currentAngle;

        // Update angle readout
        const angleDeg = THREE.MathUtils.radToDeg(this.currentAngle);
        this._updateLabelText(this.angleReadout, `${angleDeg.toFixed(1)}°`, '#f59e0b');

        // Shadow projection
        const bobWorldPos = new THREE.Vector3();
        this.bob.getWorldPosition(bobWorldPos);
        this.shadowDot.position.set(bobWorldPos.x, 0.02, bobWorldPos.z);

        const shadowLinePoints = [
            new THREE.Vector3(bobWorldPos.x, 0.02, 0),
            new THREE.Vector3(bobWorldPos.x, bobWorldPos.y, 0)
        ];
        this.shadowLine.geometry.dispose();
        this.shadowLine.geometry = new THREE.BufferGeometry().setFromPoints(shadowLinePoints);
        this.shadowLine.computeLineDistances();

        if (!this.isSwinging) return;

        const dt = Math.min(delta, 0.04);
        this.elapsed += dt;

        // Physics: angular acceleration = -(g/L) * sin(theta) - damping * omega
        const angularAcceleration = -(this.gravity / this.length) * Math.sin(this.currentAngle) - this.damping * this.angularVelocity;
        const prevAngle = this.currentAngle;

        this.angularVelocity += angularAcceleration * dt;
        this.currentAngle += this.angularVelocity * dt;

        // Bob linear speed
        const bobSpeed = Math.abs(this.angularVelocity) * this.length;
        if (bobSpeed > this.maxSpeed) this.maxSpeed = bobSpeed;

        // Energy calculations
        const height = this.length * (1 - Math.cos(this.currentAngle));
        this.kineticEnergy = 0.5 * this.mass * bobSpeed * bobSpeed;
        this.potentialEnergy = this.mass * this.gravity * height;
        this.totalEnergy = this.kineticEnergy + this.potentialEnergy;

        // Detect zero crossings for period measurement
        if (prevAngle * this.currentAngle < 0 && this.angularVelocity > 0) {
            this.crossCount++;
            if (this.crossCount === 1) {
                this.periodTimer = this.elapsed;
            } else if (this.crossCount === 3) {
                this.measuredPeriod = this.elapsed - this.periodTimer;
                this.data.updateValue('measured-period', this.measuredPeriod.toFixed(3), 's');
                this._updateLabelText(this.measuredTLabel, `T: ${this.measuredPeriod.toFixed(3)}s`, '#22c55e');
                this.crossCount = 1;
                this.periodTimer = this.elapsed;
                this.oscillationCount++;
            }
        }

        // Update rotation
        this.pendulumGroup.rotation.z = this.currentAngle;

        // Update data display
        this.data.updateValue('current-angle', angleDeg.toFixed(1), '°');
        this.data.updateValue('angular-vel', this.angularVelocity.toFixed(3), 'rad/s');
        this.data.updateValue('bob-speed', bobSpeed.toFixed(3), 'm/s');
        this.data.updateValue('ke', this.kineticEnergy.toFixed(3), 'J');
        this.data.updateValue('pe', this.potentialEnergy.toFixed(3), 'J');

        // Update 3D labels
        this._updateLabelText(this.oscCountLabel, `Count: ${this.oscillationCount}`, '#06b6d4');
        this._updateLabelText(this.elapsedLabel, `Time: ${this.elapsed.toFixed(1)}s`, '#94a3b8');
        this._updateLabelText(this.speedValueLabel, `${bobSpeed.toFixed(2)} m/s`, '#ef4444');

        // Update energy bars
        const maxE = this.totalEnergy || 1;
        const keH = (this.kineticEnergy / maxE) * 3.5;
        const peH = (this.potentialEnergy / maxE) * 3.5;
        this.keBar.scale.y = Math.max(keH * 100, 1);
        this.keBar.position.y = 0.5 + keH / 2;
        this.peBar.scale.y = Math.max(peH * 100, 1);
        this.peBar.position.y = 0.5 + peH / 2;
        this._updateLabelText(this.keValueLabel, `${this.kineticEnergy.toFixed(2)} J`, '#f59e0b');
        this.keValueLabel.position.y = 0.7 + keH;
        this._updateLabelText(this.peValueLabel, `${this.potentialEnergy.toFixed(2)} J`, '#22c55e');
        this.peValueLabel.position.y = 0.7 + peH;
        this._updateLabelText(this.totalELabel, `Total: ${this.totalEnergy.toFixed(2)} J`, '#ef4444');

        // Bob glow based on speed
        this.bobGlow.material.opacity = 0.04 + bobSpeed * 0.04;
        this.bobLight.intensity = 0.2 + bobSpeed * 0.15;

        // Update trace
        this.tracePoints.push(new THREE.Vector3(bobWorldPos.x, 0.03, bobWorldPos.z));
        if (this.tracePoints.length > 500) this.tracePoints.shift();
        if (this.tracePoints.length > 1) {
            this.traceGeometry.dispose();
            this.traceGeometry = new THREE.BufferGeometry().setFromPoints(this.tracePoints);
            this.traceLine.geometry = this.traceGeometry;
        }

        // Phase portrait
        this.phaseData.push({ theta: this.currentAngle, omega: this.angularVelocity });
        if (this.phaseData.length > 600) this.phaseData.shift();
        if (this.phaseData.length % 3 === 0) {
            this._drawPhaseGraph();
        }
    }

    _makeLabel(text, color, fontSize = 20) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(1.5, 0.75, 1);
        sprite.userData = { canvas, ctx, texture: tex, color, fontSize };
        return sprite;
    }

    _updateLabelText(sprite, text, color) {
        const d = sprite.userData;
        d.ctx.clearRect(0, 0, d.canvas.width, d.canvas.height);
        d.ctx.fillStyle = color || d.color;
        d.ctx.font = `bold ${d.fontSize || 20}px Inter, sans-serif`;
        d.ctx.textAlign = 'center';
        d.ctx.textBaseline = 'middle';
        d.ctx.fillText(text, 128, 64);
        d.texture.needsUpdate = true;
    }

    dispose() {
        this.scene.removeAnimateCallback(this._animateBound);
        this.scene.removeFromScene(this.group);

        if (this.phaseGraphDiv && this.phaseGraphDiv.parentElement) {
            this.phaseGraphDiv.remove();
        }

        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        });
        this.controls.clear();
        this.data.clear();
    }
}
