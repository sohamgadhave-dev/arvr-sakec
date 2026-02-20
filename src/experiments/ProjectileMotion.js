import * as THREE from 'three';

export class ProjectileMotion {
    constructor(sceneManager, controlPanel, dataDisplay) {
        this.scene = sceneManager;
        this.controls = controlPanel;
        this.data = dataDisplay;
        this.group = new THREE.Group();
        this.projectile = null;
        this.trail = [];
        this.trailLine = null;
        this.previewLine = null;
        this.isFlying = false;
        this.flightTime = 0;
        this.launchParams = {};
        this.markers = [];
        this.shotHistory = [];
        this.launchParticles = [];
        this.impactParticles = [];
        this.smokeParticles = [];
        this.heightMarker = null;
        this.maxHeightReached = 0;
        this.hasReachedPeak = false;

        // Default parameters
        this.angle = 45;
        this.velocity = 20;
        this.gravity = 9.8;
        this.airResistance = false;
        this.dragCoeff = 0.01;
        this.showEnergy = true;

        // Energy tracking
        this.kineticEnergy = 0;
        this.potentialEnergy = 0;
        this.totalEnergy = 0;
        this.mass = 1; // 1 kg

        this._build();
        this._setupControls();
        this._setupData();
        this._updatePreview();

        // Audio
        this._initAudio();

        this.scene.addToScene(this.group);
        this.scene.setCameraPosition(4, 1.7, 6);
        this.scene.setCameraTarget(5, 1.0, 0);

        this._animateBound = this._animate.bind(this);
        this.scene.onAnimate(this._animateBound);
    }

    _build() {
        this._createGround();
        this._createLauncher();
        this._createProjectile();
        this._createTargetZone();
        this._createEnergyBars();
        this._createInfoBoard();
        this._createHeightMarkerLine();
        this._createVelocityArrow();
    }

    _createGround() {
        // Floor measurement ruler strip (tape measure on floor)
        const rulerGeo = new THREE.PlaneGeometry(25, 0.08);
        const rulerMat = new THREE.MeshStandardMaterial({
            color: 0xf5c518,
            roughness: 0.6,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const ruler = new THREE.Mesh(rulerGeo, rulerMat);
        ruler.rotation.x = -Math.PI / 2;
        ruler.position.set(12.5, 0.006, 0);
        this.group.add(ruler);

        // Distance tick marks on floor
        for (let i = 0; i <= 25; i += 1) {
            const isMajor = i % 5 === 0;
            const tickGeo = new THREE.PlaneGeometry(0.02, isMajor ? 0.3 : 0.15);
            const tickMat = new THREE.MeshBasicMaterial({
                color: 0x1e293b,
                side: THREE.DoubleSide
            });
            const tick = new THREE.Mesh(tickGeo, tickMat);
            tick.rotation.x = -Math.PI / 2;
            tick.position.set(i, 0.007, 0);
            this.group.add(tick);

            if (isMajor && i > 0) {
                const label = this._makeLabel(`${i}m`, '#374151', 14);
                label.position.set(i, 0.05, 0.4);
                label.scale.set(1.0, 0.5, 1);
                this.group.add(label);
            }
        }

        // Height markers (faint)
        for (let h = 2; h <= 12; h += 2) {
            const hLabel = this._makeLabel(`${h}m`, '#64748b', 12);
            hLabel.position.set(-0.8, h, 0);
            hLabel.scale.set(0.8, 0.4, 1);
            this.group.add(hLabel);
        }
    }

    _createLauncher() {
        this.launcherGroup = new THREE.Group();
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.75, roughness: 0.22 });
        const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.8, roughness: 0.18 });
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.85, roughness: 0.15 });

        // Heavy steel base plate
        const platGeo = new THREE.BoxGeometry(1.2, 0.06, 1.2);
        const plat = new THREE.Mesh(platGeo, steelMat);
        plat.position.y = 0.03;
        plat.castShadow = true;
        plat.receiveShadow = true;
        this.launcherGroup.add(plat);

        // Corner bolts on base plate
        const boltGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 8);
        [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([bx, bz]) => {
            const bolt = new THREE.Mesh(boltGeo, boltMat);
            bolt.position.set(bx, 0.07, bz);
            this.launcherGroup.add(bolt);
        });

        // Riser column
        const riserGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.3, 16);
        const riser = new THREE.Mesh(riserGeo, darkSteelMat);
        riser.position.y = 0.21;
        riser.castShadow = true;
        this.launcherGroup.add(riser);

        // Pivot axle housing (cylindrical side bearing)
        const axleGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.28, 14);
        const axle = new THREE.Mesh(axleGeo, boltMat);
        axle.rotation.x = Math.PI / 2;
        axle.position.set(0, 0.36, 0);
        this.launcherGroup.add(axle);

        // Side bearing discs
        const discGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.015, 16);
        [-0.15, 0.15].forEach(z => {
            const disc = new THREE.Mesh(discGeo, steelMat);
            disc.rotation.x = Math.PI / 2;
            disc.position.set(0, 0.36, z);
            this.launcherGroup.add(disc);
        });

        // Barrel pivot group
        this.barrelPivot = new THREE.Group();
        this.barrelPivot.position.y = 0.36;

        // Main barrel (brushed steel tube)
        const barrelGeo = new THREE.CylinderGeometry(0.065, 0.085, 1.6, 16);
        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0x78838f,
            metalness: 0.7,
            roughness: 0.28
        });
        this.barrel = new THREE.Mesh(barrelGeo, barrelMat);
        this.barrel.position.y = 0.8;
        this.barrel.castShadow = true;
        this.barrelPivot.add(this.barrel);

        // Inner bore (dark)
        const boreGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.65, 10);
        const boreMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.05 });
        this.barrelPivot.add(new THREE.Mesh(boreGeo, boreMat).translateY(0.8));

        // Muzzle ring
        const muzzleGeo = new THREE.TorusGeometry(0.09, 0.02, 8, 20);
        const muzzle = new THREE.Mesh(muzzleGeo, boltMat);
        muzzle.position.y = 1.6;
        this.barrelPivot.add(muzzle);

        // Barrel clamp bands
        [0.3, 0.8, 1.2].forEach(y => {
            const clampGeo = new THREE.TorusGeometry(0.075, 0.01, 6, 16);
            const clamp = new THREE.Mesh(clampGeo, boltMat);
            clamp.position.y = y;
            this.barrelPivot.add(clamp);
        });

        // Side support brackets
        [-0.1, 0.1].forEach(z => {
            const bracketGeo = new THREE.BoxGeometry(0.02, 0.5, 0.08);
            const bracket = new THREE.Mesh(bracketGeo, darkSteelMat);
            bracket.position.set(0, 0.35, z);
            bracket.castShadow = true;
            this.barrelPivot.add(bracket);
        });

        // Graduated angle scale (protractor arc)
        this._createGraduatedScale();

        // Angle arc indicator
        this.angleArc = this._createAngleArc();
        this.launcherGroup.add(this.angleArc);

        this.launcherGroup.add(this.barrelPivot);
        this._updateBarrelAngle();

        // Equipment label plate
        const labelGroup = new THREE.Group();
        const labelBg = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.2 })
        );
        labelGroup.add(labelBg);
        const labelText = this._makeLabel('PM-200 LAUNCHER', '#94a3b8', 12);
        labelText.position.z = 0.01;
        labelText.scale.set(1, 0.5, 1);
        labelGroup.add(labelText);
        labelGroup.position.set(0, 0.08, 0.65);
        labelGroup.rotation.x = -Math.PI / 6;
        this.launcherGroup.add(labelGroup);

        this.group.add(this.launcherGroup);
    }

    _createGraduatedScale() {
        // Protractor arc attached to launcher base
        const scaleGroup = new THREE.Group();
        scaleGroup.position.y = 0.36;

        // Arc background
        const arcBgGeo = new THREE.RingGeometry(0.5, 0.58, 40, 1, 0, Math.PI / 2);
        const arcBgMat = new THREE.MeshBasicMaterial({
            color: 0xe5e7eb,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        scaleGroup.add(new THREE.Mesh(arcBgGeo, arcBgMat));

        // Degree tick marks
        for (let deg = 0; deg <= 90; deg += 5) {
            const rad = THREE.MathUtils.degToRad(deg);
            const isMajor = deg % 15 === 0;
            const r1 = isMajor ? 0.48 : 0.52;
            const r2 = 0.58;
            const pts = [
                new THREE.Vector3(Math.cos(rad) * r1, Math.sin(rad) * r1, 0),
                new THREE.Vector3(Math.cos(rad) * r2, Math.sin(rad) * r2, 0)
            ];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
            const lineMat = new THREE.LineBasicMaterial({
                color: isMajor ? 0x374151 : 0x9ca3af,
                transparent: true,
                opacity: isMajor ? 0.6 : 0.3
            });
            scaleGroup.add(new THREE.Line(lineGeo, lineMat));

            if (isMajor) {
                const label = this._makeLabel(`${deg}`, '#475569', 9);
                label.position.set(Math.cos(rad) * 0.43, Math.sin(rad) * 0.43, 0);
                label.scale.set(0.4, 0.2, 1);
                scaleGroup.add(label);
            }
        }

        // Highlight 45° with subtle indicator
        const r45 = THREE.MathUtils.degToRad(45);
        const h45Pts = [
            new THREE.Vector3(Math.cos(r45) * 0.46, Math.sin(r45) * 0.46, 0),
            new THREE.Vector3(Math.cos(r45) * 0.60, Math.sin(r45) * 0.60, 0)
        ];
        const h45Mat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
        scaleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(h45Pts), h45Mat));
        const optLabel = this._makeLabel('optimal', '#3b82f6', 8);
        optLabel.position.set(Math.cos(r45) * 0.65, Math.sin(r45) * 0.65, 0);
        optLabel.scale.set(0.5, 0.25, 1);
        scaleGroup.add(optLabel);

        this.launcherGroup.add(scaleGroup);
    }

    _createAngleArc() {
        const group = new THREE.Group();
        group.position.y = 0.36;

        // Arc showing current angle
        const arcGeo = new THREE.RingGeometry(0.7, 0.75, 32, 1, 0, THREE.MathUtils.degToRad(this.angle));
        const arcMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.arcMesh = new THREE.Mesh(arcGeo, arcMat);
        this.arcMesh.rotation.z = 0;
        group.add(this.arcMesh);

        // Angle label
        this.angleLabel = this._makeLabel(`${this.angle}°`, '#f59e0b', 24);
        this.angleLabel.position.set(0.9, 0.5, 0);
        this.angleLabel.scale.set(1, 0.5, 1);
        group.add(this.angleLabel);

        return group;
    }

    _createProjectile() {
        // Realistic metallic steel ball
        const sphereGeo = new THREE.SphereGeometry(0.12, 24, 24);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: 0x8a9199,
            metalness: 0.85,
            roughness: 0.15
        });
        this.projectile = new THREE.Mesh(sphereGeo, sphereMat);
        this.projectile.castShadow = true;
        this.projectile.visible = false;
        this.group.add(this.projectile);

        // Subtle specular highlight mesh
        const highlightGeo = new THREE.SphereGeometry(0.06, 10, 10);
        const highlightMat = new THREE.MeshBasicMaterial({
            color: 0xd1d5db,
            transparent: true,
            opacity: 0.2
        });
        this.projectile.add(new THREE.Mesh(highlightGeo, highlightMat));

        // Faint glow for visibility
        const glowGeo = new THREE.SphereGeometry(0.22, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x6b7280,
            transparent: true,
            opacity: 0.06,
            blending: THREE.AdditiveBlending
        });
        this.projectileGlow = new THREE.Mesh(glowGeo, glowMat);
        this.projectile.add(this.projectileGlow);

        // Point light on projectile (dim)
        this.projectileLight = new THREE.PointLight(0xe0e4e8, 0, 3);
        this.projectile.add(this.projectileLight);
    }

    _createTargetZone() {
        this.targetGroup = new THREE.Group();

        // Concentric rings
        const colors = [0xef4444, 0xffffff, 0xef4444];
        const sizes = [[0.5, 0.65], [0.3, 0.45], [0.1, 0.25]];
        colors.forEach((color, i) => {
            const ringGeo = new THREE.RingGeometry(sizes[i][0], sizes[i][1], 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.3 + i * 0.1,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.02 + i * 0.005;
            this.targetGroup.add(ring);
        });

        // Center dot
        const dotGeo = new THREE.CircleGeometry(0.08, 16);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.rotation.x = -Math.PI / 2;
        dot.position.y = 0.04;
        this.targetGroup.add(dot);

        this.targetGroup.position.set(20, 0, 0);
        this.group.add(this.targetGroup);
    }

    _createEnergyBars() {
        // Energy visualization as a wall-mounted digital panel
        this.energyGroup = new THREE.Group();
        this.energyGroup.position.set(-2, 1.2, 3.5);
        this.energyGroup.rotation.y = 0.25;

        // Panel frame
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.4, metalness: 0.3 });
        const frameGeo = new THREE.BoxGeometry(1.6, 2.2, 0.06);
        this.energyGroup.add(new THREE.Mesh(frameGeo, frameMat));

        // Screen background
        const screenGeo = new THREE.PlaneGeometry(1.4, 1.9);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.031;
        this.energyGroup.add(screen);

        // Title
        const title = this._makeLabel('ENERGY MONITOR', '#94a3b8', 12);
        title.position.set(0, 0.85, 0.04);
        title.scale.set(1.2, 0.5, 1);
        this.energyGroup.add(title);

        // KE bar
        const keBarGeo = new THREE.BoxGeometry(0.35, 0.01, 0.15);
        const keBarMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xd97706, emissiveIntensity: 0.3 });
        this.keBar = new THREE.Mesh(keBarGeo, keBarMat);
        this.keBar.position.set(-0.3, -0.3, 0.04);
        this.energyGroup.add(this.keBar);

        const keLabel = this._makeLabel('KE', '#d97706', 12);
        keLabel.position.set(-0.3, -0.7, 0.04);
        keLabel.scale.set(0.6, 0.3, 1);
        this.energyGroup.add(keLabel);

        // PE bar
        const peBarGeo = new THREE.BoxGeometry(0.35, 0.01, 0.15);
        const peBarMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, emissive: 0x16a34a, emissiveIntensity: 0.3 });
        this.peBar = new THREE.Mesh(peBarGeo, peBarMat);
        this.peBar.position.set(0.3, -0.3, 0.04);
        this.energyGroup.add(this.peBar);

        const peLabel = this._makeLabel('PE', '#16a34a', 12);
        peLabel.position.set(0.3, -0.7, 0.04);
        peLabel.scale.set(0.6, 0.3, 1);
        this.energyGroup.add(peLabel);

        // Value labels
        this.keValueLabel = this._makeLabel('0 J', '#d97706', 11);
        this.keValueLabel.position.set(-0.3, -0.1, 0.04);
        this.keValueLabel.scale.set(0.8, 0.35, 1);
        this.energyGroup.add(this.keValueLabel);

        this.peValueLabel = this._makeLabel('0 J', '#16a34a', 11);
        this.peValueLabel.position.set(0.3, -0.1, 0.04);
        this.peValueLabel.scale.set(0.8, 0.35, 1);
        this.energyGroup.add(this.peValueLabel);

        this.group.add(this.energyGroup);
    }

    _createInfoBoard() {
        // 3D info board showing real-time velocity components
        this.infoGroup = new THREE.Group();
        this.infoGroup.position.set(-3, 0, -4);

        const panelGeo = new THREE.PlaneGeometry(2.5, 3);
        const panelMat = new THREE.MeshBasicMaterial({
            color: 0x111827,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.y = 1.5;
        this.infoGroup.add(panel);

        const title = this._makeLabel('VELOCITY', '#a5b4fc', 18);
        title.position.set(0, 2.8, 0.01);
        title.scale.set(1.5, 0.75, 1);
        this.infoGroup.add(title);

        this.vxLabel = this._makeLabel('Vx: 0 m/s', '#06b6d4', 15);
        this.vxLabel.position.set(0, 2.2, 0.01);
        this.vxLabel.scale.set(2, 0.7, 1);
        this.infoGroup.add(this.vxLabel);

        this.vyLabel = this._makeLabel('Vy: 0 m/s', '#f59e0b', 15);
        this.vyLabel.position.set(0, 1.7, 0.01);
        this.vyLabel.scale.set(2, 0.7, 1);
        this.infoGroup.add(this.vyLabel);

        this.speedLabel = this._makeLabel('|V|: 0 m/s', '#ef4444', 15);
        this.speedLabel.position.set(0, 1.2, 0.01);
        this.speedLabel.scale.set(2, 0.7, 1);
        this.infoGroup.add(this.speedLabel);

        this.group.add(this.infoGroup);
    }

    _createHeightMarkerLine() {
        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 1, 0)
        ]);
        const mat = new THREE.LineDashedMaterial({
            color: 0x22c55e,
            transparent: true,
            opacity: 0.5,
            dashSize: 0.2,
            gapSize: 0.1
        });
        this.heightLine = new THREE.Line(geo, mat);
        this.heightLine.computeLineDistances();
        this.heightLine.visible = false;
        this.group.add(this.heightLine);

        // Max height label
        this.maxHeightLabel = this._makeLabel('H', '#22c55e', 16);
        this.maxHeightLabel.visible = false;
        this.group.add(this.maxHeightLabel);
    }

    _createVelocityArrow() {
        // Velocity vector arrows on projectile
        this.arrowGroup = new THREE.Group();
        this.arrowGroup.visible = false;

        // Vx arrow (cyan)
        const vxDir = new THREE.Vector3(1, 0, 0);
        this.vxArrow = new THREE.ArrowHelper(vxDir, new THREE.Vector3(), 1, 0x06b6d4, 0.15, 0.08);
        this.arrowGroup.add(this.vxArrow);

        // Vy arrow (yellow)
        const vyDir = new THREE.Vector3(0, 1, 0);
        this.vyArrow = new THREE.ArrowHelper(vyDir, new THREE.Vector3(), 1, 0xf59e0b, 0.15, 0.08);
        this.arrowGroup.add(this.vyArrow);

        // Resultant (red)
        this.vArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 1, 0).normalize(), new THREE.Vector3(), 1, 0xef4444, 0.15, 0.08);
        this.arrowGroup.add(this.vArrow);

        this.group.add(this.arrowGroup);
    }

    _updateBarrelAngle() {
        const rad = THREE.MathUtils.degToRad(this.angle);
        this.barrelPivot.rotation.z = rad;

        // Update angle arc
        if (this.arcMesh) {
            this.arcMesh.geometry.dispose();
            this.arcMesh.geometry = new THREE.RingGeometry(0.7, 0.75, 32, 1, 0, rad);
        }
        if (this.angleLabel) {
            this._updateLabelText(this.angleLabel, `${this.angle}°`, '#f59e0b');
        }
    }

    _setupControls() {
        this.controls.setSliders([
            { id: 'angle', label: '🎯 Launch Angle', min: 5, max: 85, step: 1, value: this.angle, unit: '°' },
            { id: 'velocity', label: '💨 Initial Velocity', min: 1, max: 50, step: 0.5, value: this.velocity, unit: 'm/s' },
            { id: 'gravity', label: '🌍 Gravity', min: 1, max: 20, step: 0.1, value: this.gravity, unit: 'm/s²' },
            { id: 'mass', label: '⚖️ Mass', min: 0.1, max: 10, step: 0.1, value: this.mass, unit: 'kg' }
        ], (id, val, all) => {
            this.angle = all.angle;
            this.velocity = all.velocity;
            this.gravity = all.gravity;
            this.mass = all.mass;
            this._updateBarrelAngle();
            this._updatePreview();
            this._updateCalculations();
        });

        this.controls.setActions([
            {
                id: 'launch',
                label: 'Launch 🚀',
                icon: '',
                className: 'btn-primary',
                onClick: () => this._launch()
            },
            {
                id: 'compare',
                label: 'Keep & Compare',
                icon: '📊',
                className: 'btn-secondary',
                onClick: () => this._saveShot()
            },
            {
                id: 'reset',
                label: 'Clear All',
                icon: '🔄',
                className: 'btn-secondary',
                onClick: () => this._reset()
            }
        ]);
    }

    _setupData() {
        this.data.setData([
            { id: 'range', label: 'Range (R)', value: '0.00', unit: 'm' },
            { id: 'max-height', label: 'Max Height (H)', value: '0.00', unit: 'm' },
            { id: 'flight-time', label: 'Flight Time (T)', value: '0.00', unit: 's' },
            { id: 'ke', label: 'Kinetic Energy', value: '0.00', unit: 'J' },
            { id: 'pe', label: 'Potential Energy', value: '0.00', unit: 'J' },
            { id: 'current-x', label: 'Position X', value: '—', unit: '' },
            { id: 'current-y', label: 'Position Y', value: '—', unit: '' },
            { id: 'speed', label: 'Speed', value: '—', unit: '' }
        ]);

        this.data.setFormulas([
            'x = v₀·cos(θ)·t',
            'y = v₀·sin(θ)·t − ½gt²',
            'R = v₀²·sin(2θ) / g',
            'H = v₀²·sin²(θ) / 2g',
            'T = 2·v₀·sin(θ) / g',
            'KE = ½mv²',
            'PE = mgh'
        ]);

        this._updateCalculations();
    }

    _updateCalculations() {
        const rad = THREE.MathUtils.degToRad(this.angle);
        const v = this.velocity;
        const g = this.gravity;

        const range = (v * v * Math.sin(2 * rad)) / g;
        const maxHeight = (v * v * Math.sin(rad) * Math.sin(rad)) / (2 * g);
        const flightTime = (2 * v * Math.sin(rad)) / g;
        const initialKE = 0.5 * this.mass * v * v;

        this.data.updateValue('range', range.toFixed(2), 'm');
        this.data.updateValue('max-height', maxHeight.toFixed(2), 'm');
        this.data.updateValue('flight-time', flightTime.toFixed(2), 's');
        this.data.updateValue('ke', initialKE.toFixed(1), 'J');
        this.data.updateValue('pe', '0.00', 'J');

        // Update target position
        this.targetGroup.position.x = Math.min(range, 55);
    }

    _updatePreview() {
        if (this.previewLine) {
            this.group.remove(this.previewLine);
            this.previewLine.geometry.dispose();
            this.previewLine.material.dispose();
        }

        const rad = THREE.MathUtils.degToRad(this.angle);
        const v = this.velocity;
        const g = this.gravity;
        const totalTime = (2 * v * Math.sin(rad)) / g;

        const points = [];
        const steps = 80;

        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * totalTime;
            const x = v * Math.cos(rad) * t;
            const y = v * Math.sin(rad) * t - 0.5 * g * t * t;
            if (y < 0 && i > 0) break;
            points.push(new THREE.Vector3(x, Math.max(y, 0), 0));
        }

        if (points.length > 1) {
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const mat = new THREE.LineDashedMaterial({
                color: 0xf59e0b,
                transparent: true,
                opacity: 0.25,
                dashSize: 0.3,
                gapSize: 0.15
            });
            this.previewLine = new THREE.Line(geo, mat);
            this.previewLine.computeLineDistances();
            this.group.add(this.previewLine);
        }
    }

    _launch() {
        if (this.isFlying) return;

        this._clearTrail();
        this.isFlying = true;
        this.flightTime = 0;
        this.maxHeightReached = 0;
        this.hasReachedPeak = false;

        const rad = THREE.MathUtils.degToRad(this.angle);
        this.launchParams = {
            angle: rad,
            vx: this.velocity * Math.cos(rad),
            vy: this.velocity * Math.sin(rad),
            gravity: this.gravity,
            mass: this.mass
        };

        this.projectile.visible = true;
        this.projectile.position.set(0, 0.36, 0);
        this.projectileLight.intensity = 2;
        this.arrowGroup.visible = true;
        this.trail = [new THREE.Vector3(0, 0.36, 0)];

        // Spawn launch particles
        this._spawnLaunchParticles();
        this._playLaunchSound();
    }

    _spawnLaunchParticles() {
        const count = 30;
        const rad = THREE.MathUtils.degToRad(this.angle);

        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.08 + Math.random() * 0.08, 1, 0.5 + Math.random() * 0.3),
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.set(0, 0.36, 0);

            // Particles go opposite to launch direction
            const spreadAngle = rad + Math.PI + (Math.random() - 0.5) * 1.5;
            const speed = 2 + Math.random() * 4;
            p.userData = {
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed + Math.random() * 2,
                vz: (Math.random() - 0.5) * 3,
                life: 0.5 + Math.random() * 0.5,
                age: 0
            };
            this.launchParticles.push(p);
            this.group.add(p);
        }

        // Smoke puffs
        for (let i = 0; i < 8; i++) {
            const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.4
            });
            const s = new THREE.Mesh(geo, mat);
            s.position.set(0, 0.36, 0);
            s.userData = {
                vx: (Math.random() - 0.5) * 1.5,
                vy: Math.random() * 2,
                vz: (Math.random() - 0.5) * 1.5,
                life: 1 + Math.random() * 0.5,
                age: 0,
                growRate: 1 + Math.random()
            };
            this.smokeParticles.push(s);
            this.group.add(s);
        }
    }

    _spawnImpactParticles(x, y) {
        const count = 25;
        for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 0.8, 0.4 + Math.random() * 0.3),
                transparent: true,
                opacity: 0.8
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.set(x, 0.15, 0);

            const angle = Math.random() * Math.PI;
            const speed = 1 + Math.random() * 4;
            p.userData = {
                vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -0.3),
                vy: Math.sin(angle) * speed,
                vz: (Math.random() - 0.5) * 3,
                life: 0.4 + Math.random() * 0.6,
                age: 0
            };
            this.impactParticles.push(p);
            this.group.add(p);
        }
    }

    _saveShot() {
        // Save current trail as a permanent ghost trail
        if (this.trail.length < 2) return;

        const geo = new THREE.BufferGeometry().setFromPoints(this.trail);
        const hue = this.shotHistory.length * 0.15;
        const color = new THREE.Color().setHSL(hue % 1, 0.7, 0.5);
        const mat = new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.4
        });
        const savedLine = new THREE.Line(geo, mat);
        this.group.add(savedLine);

        // Add shot label
        const label = this._makeLabel(`Shot ${this.shotHistory.length + 1}`, `hsl(${(hue % 1) * 360}, 70%, 60%)`, 14);
        const lastPoint = this.trail[this.trail.length - 1];
        label.position.set(lastPoint.x, lastPoint.y + 0.5, lastPoint.z);
        label.scale.set(1.2, 0.6, 1);
        this.group.add(label);

        this.shotHistory.push({ line: savedLine, label, params: { ...this.launchParams, angle: this.angle, velocity: this.velocity } });
    }

    _reset() {
        this.isFlying = false;
        this.flightTime = 0;
        this.projectile.visible = false;
        this.arrowGroup.visible = false;
        this.heightLine.visible = false;
        this.maxHeightLabel.visible = false;
        this.projectileLight.intensity = 0;
        this._clearTrail();
        this._clearParticles();

        // Clear shot history
        this.shotHistory.forEach(shot => {
            this.group.remove(shot.line);
            this.group.remove(shot.label);
            shot.line.geometry.dispose();
            shot.line.material.dispose();
        });
        this.shotHistory = [];

        this.data.updateValue('current-x', '—');
        this.data.updateValue('current-y', '—');
        this.data.updateValue('speed', '—');
    }

    _clearTrail() {
        if (this.trailLine) {
            this.group.remove(this.trailLine);
            this.trailLine.geometry.dispose();
            this.trailLine.material.dispose();
            this.trailLine = null;
        }
        this.markers.forEach(m => {
            this.group.remove(m);
            if (m.geometry) m.geometry.dispose();
            if (m.material) m.material.dispose();
        });
        this.markers = [];
    }

    _clearParticles() {
        [...this.launchParticles, ...this.impactParticles, ...this.smokeParticles].forEach(p => {
            this.group.remove(p);
            p.geometry.dispose();
            p.material.dispose();
        });
        this.launchParticles = [];
        this.impactParticles = [];
        this.smokeParticles = [];
    }

    _animate(delta) {
        // Animate particles
        this._animateParticles(delta, this.launchParticles);
        this._animateParticles(delta, this.impactParticles);
        this._animateSmokeParticles(delta);

        // Target pulsing
        if (this.targetGroup) {
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
            this.targetGroup.scale.set(scale, 1, scale);
        }

        if (!this.isFlying) return;

        this.flightTime += delta * 1.2;
        const t = this.flightTime;
        const p = this.launchParams;

        let vx = p.vx;
        let vy = p.vy - p.gravity * t;
        const x = p.vx * t;
        const y = p.vy * t - 0.5 * p.gravity * t * t + 0.36;
        const speed = Math.sqrt(vx * vx + vy * vy);

        // Energy calculations
        const height = Math.max(y - 0.36, 0);
        this.kineticEnergy = 0.5 * p.mass * speed * speed;
        this.potentialEnergy = p.mass * p.gravity * height;
        this.totalEnergy = this.kineticEnergy + this.potentialEnergy;

        // Update energy bars (scale to max height)
        const maxE = this.totalEnergy || 1;
        const keHeight = (this.kineticEnergy / maxE) * 3;
        const peHeight = (this.potentialEnergy / maxE) * 3;
        this.keBar.scale.y = Math.max(keHeight * 100, 1);
        this.keBar.position.y = 0.2 + keHeight / 2;
        this.peBar.scale.y = Math.max(peHeight * 100, 1);
        this.peBar.position.y = 0.2 + peHeight / 2;

        this._updateLabelText(this.keValueLabel, `${this.kineticEnergy.toFixed(0)} J`, '#f59e0b');
        this.keValueLabel.position.y = 0.5 + keHeight;
        this._updateLabelText(this.peValueLabel, `${this.potentialEnergy.toFixed(0)} J`, '#22c55e');
        this.peValueLabel.position.y = 0.5 + peHeight;

        // Update velocity info board
        this._updateLabelText(this.vxLabel, `Vx: ${vx.toFixed(1)} m/s`, '#06b6d4');
        this._updateLabelText(this.vyLabel, `Vy: ${vy.toFixed(1)} m/s`, '#f59e0b');
        this._updateLabelText(this.speedLabel, `|V|: ${speed.toFixed(1)} m/s`, '#ef4444');

        // Update data panel
        this.data.updateValue('ke', this.kineticEnergy.toFixed(1), 'J');
        this.data.updateValue('pe', this.potentialEnergy.toFixed(1), 'J');
        this.data.updateValue('speed', speed.toFixed(1), 'm/s');

        // Track max height
        if (height > this.maxHeightReached) {
            this.maxHeightReached = height;
        }
        if (vy < 0 && !this.hasReachedPeak) {
            this.hasReachedPeak = true;
            // Show height marker
            this.heightLine.visible = true;
            const pts = [new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, this.maxHeightReached + 0.36, 0)];
            this.heightLine.geometry.dispose();
            this.heightLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
            this.heightLine.computeLineDistances();

            this.maxHeightLabel.visible = true;
            this.maxHeightLabel.position.set(x + 0.8, (this.maxHeightReached + 0.36) / 2, 0);
            this._updateLabelText(this.maxHeightLabel, `H=${this.maxHeightReached.toFixed(1)}m`, '#22c55e');
        }

        // Update velocity arrows
        this.arrowGroup.position.copy(this.projectile.position);
        const arrowScale = 0.08;
        this.vxArrow.setLength(Math.abs(vx) * arrowScale, 0.15, 0.08);
        this.vxArrow.setDirection(new THREE.Vector3(vx >= 0 ? 1 : -1, 0, 0));
        this.vyArrow.setLength(Math.abs(vy) * arrowScale + 0.01, 0.15, 0.08);
        this.vyArrow.setDirection(new THREE.Vector3(0, vy >= 0 ? 1 : -1, 0));
        const vDir = new THREE.Vector3(vx, vy, 0).normalize();
        this.vArrow.setLength(speed * arrowScale, 0.15, 0.08);
        this.vArrow.setDirection(vDir);

        if (y <= 0.15 && t > 0.1) {
            // LANDED
            this.projectile.position.set(x, 0.15, 0);
            this.isFlying = false;
            this.arrowGroup.visible = false;
            this.projectileLight.intensity = 0;

            // Impact effects
            this._spawnImpactParticles(x, 0);
            this._playImpactSound();

            // Landing marker with distance
            const markerGroup = new THREE.Group();
            const ringGeo = new THREE.RingGeometry(0.2, 0.35, 24);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x22c55e,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            markerGroup.add(ring);

            const distLabel = this._makeLabel(`${x.toFixed(1)}m`, '#22c55e', 18);
            distLabel.position.set(0, 0.6, 0);
            distLabel.scale.set(1.5, 0.75, 1);
            markerGroup.add(distLabel);

            markerGroup.position.set(x, 0.03, 0);
            this.group.add(markerGroup);
            this.markers.push(markerGroup);

            this.data.updateValue('current-x', x.toFixed(2), 'm');
            this.data.updateValue('current-y', '0.00', 'm');
            return;
        }

        this.projectile.position.set(x, y, 0);
        this.data.updateValue('current-x', x.toFixed(2), 'm');
        this.data.updateValue('current-y', (y - 0.36).toFixed(2), 'm');

        // Projectile glow pulse
        this.projectileGlow.material.opacity = 0.1 + speed * 0.003;

        // Update trail
        this.trail.push(new THREE.Vector3(x, y, 0));
        if (this.trailLine) {
            this.group.remove(this.trailLine);
            this.trailLine.geometry.dispose();
            this.trailLine.material.dispose();
        }

        // Gradient trail using vertex colors
        const positions = [];
        const colors = [];
        this.trail.forEach((pt, i) => {
            positions.push(pt.x, pt.y, pt.z);
            const ratio = i / this.trail.length;
            const c = new THREE.Color().setHSL(0.08 - ratio * 0.04, 1, 0.4 + ratio * 0.2);
            colors.push(c.r, c.g, c.b);
        });
        const trailGeo = new THREE.BufferGeometry();
        trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        trailGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const trailMat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2 });
        this.trailLine = new THREE.Line(trailGeo, trailMat);
        this.group.add(this.trailLine);
    }

    _animateParticles(delta, arr) {
        for (let i = arr.length - 1; i >= 0; i--) {
            const p = arr[i];
            p.userData.age += delta;
            if (p.userData.age > p.userData.life) {
                this.group.remove(p);
                p.geometry.dispose();
                p.material.dispose();
                arr.splice(i, 1);
                continue;
            }
            p.position.x += p.userData.vx * delta;
            p.position.y += p.userData.vy * delta;
            p.position.z += p.userData.vz * delta;
            p.userData.vy -= 5 * delta; // gravity
            p.material.opacity = 1 - p.userData.age / p.userData.life;
            const s = 1 - p.userData.age / p.userData.life * 0.5;
            p.scale.set(s, s, s);
        }
    }

    _animateSmokeParticles(delta) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const s = this.smokeParticles[i];
            s.userData.age += delta;
            if (s.userData.age > s.userData.life) {
                this.group.remove(s);
                s.geometry.dispose();
                s.material.dispose();
                this.smokeParticles.splice(i, 1);
                continue;
            }
            s.position.x += s.userData.vx * delta;
            s.position.y += s.userData.vy * delta;
            s.position.z += s.userData.vz * delta;
            const grow = 1 + s.userData.age * s.userData.growRate;
            s.scale.set(grow, grow, grow);
            s.material.opacity = 0.4 * (1 - s.userData.age / s.userData.life);
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

    _initAudio() {
        this._audioCtx = null;
        // Lazily create AudioContext on first user interaction
        const initCtx = () => {
            if (!this._audioCtx) {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', initCtx);
        };
        document.addEventListener('click', initCtx);
    }

    _playLaunchSound() {
        if (!this._audioCtx) return;
        const ctx = this._audioCtx;
        const now = ctx.currentTime;

        // Noise burst (compressed air launch)
        const bufferLen = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferLen; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.8;
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(now);
    }

    _playImpactSound() {
        if (!this._audioCtx) return;
        const ctx = this._audioCtx;
        const now = ctx.currentTime;

        // Low thud
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);

        // Bounce noise
        const bufLen = ctx.sampleRate * 0.1;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
        }
        const ns = ctx.createBufferSource();
        ns.buffer = buf;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.08, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        ns.connect(ng).connect(ctx.destination);
        ns.start(now);
    }

    dispose() {
        this.scene.removeAnimateCallback(this._animateBound);
        this.scene.removeFromScene(this.group);
        this._clearParticles();
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        });
        if (this._audioCtx) {
            this._audioCtx.close();
        }
        this.controls.clear();
        this.data.clear();
    }
}
