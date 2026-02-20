import * as THREE from 'three';

export class OhmsLaw {
    constructor(sceneManager, controlPanel, dataDisplay, challengeMode) {
        this.scene = sceneManager;
        this.controls = controlPanel;
        this.data = dataDisplay;
        this.group = new THREE.Group();
        this.electrons = [];
        this.sparkParticles = [];
        this.wireGlowMeshes = [];
        this.circuitOn = true;

        // Parameters
        this.voltage = 12;
        this.resistance = 10;

        this._build();
        this._setupControls();
        this._setupData();
        this._updateCalculations();
        this._setupInteraction();

        this.scene.addToScene(this.group);
        this.scene.setCameraPosition(0, 7, 9);
        this.scene.setCameraTarget(0, 1.5, -0.5);

        this._animateBound = this._animate.bind(this);
        this.scene.onAnimate(this._animateBound);
    }

    _build() {
        this._createCircuitBoard();
        this._createBattery();
        this._createResistor();
        this._createAmmeter();
        this._createVoltmeter();
        this._createWires();
        this._createElectrons();
        this._createVIGraph();
        this._createPowerMeter();
        this._createDangerIndicator();
        this._createCircuitSwitch();
    }

    _createCircuitBoard() {
        // Enhanced circuit board with PCB-like texture
        const boardGeo = new THREE.BoxGeometry(8, 0.12, 5.5);
        const boardMat = new THREE.MeshStandardMaterial({
            color: 0x0a3a2a,
            roughness: 0.7,
            metalness: 0.15
        });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(0, 0.5, -0.25);
        board.receiveShadow = true;
        board.castShadow = true;
        this.group.add(board);

        // PCB trace pattern
        const traceGeo = new THREE.PlaneGeometry(7.5, 5);
        const traceCanvas = document.createElement('canvas');
        traceCanvas.width = 512;
        traceCanvas.height = 340;
        const ctx = traceCanvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 512, 340);
        // Draw faint circuit traces
        ctx.strokeStyle = 'rgba(50, 180, 100, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 512, Math.random() * 340);
            for (let j = 0; j < 3; j++) {
                if (Math.random() > 0.5) ctx.lineTo(ctx.canvas.width * Math.random(), ctx.canvas.height * Math.random());
                else ctx.lineTo(ctx.canvas.width * Math.random(), ctx.canvas.height * Math.random());
            }
            ctx.stroke();
        }
        const traceTex = new THREE.CanvasTexture(traceCanvas);
        const traceMat = new THREE.MeshBasicMaterial({ map: traceTex, transparent: true, side: THREE.DoubleSide });
        const traces = new THREE.Mesh(traceGeo, traceMat);
        traces.rotation.x = -Math.PI / 2;
        traces.position.set(0, 0.57, -0.25);
        this.group.add(traces);

        // Board label
        const boardLabel = this._createLabel('NCTE-Tech Circuit Lab', '#1a6b45', 14);
        boardLabel.position.set(0, 0.58, 2.3);
        boardLabel.scale.set(3, 1.5, 1);
        this.group.add(boardLabel);
    }

    _createBattery() {
        const batteryGroup = new THREE.Group();

        // Battery body (detailed cell)
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 20);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x1e40af,
            metalness: 0.4,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        batteryGroup.add(body);

        // Battery wrapper
        const wrapGeo = new THREE.CylinderGeometry(0.31, 0.31, 1.0, 20);
        const wrapMat = new THREE.MeshStandardMaterial({
            color: 0x2563eb,
            metalness: 0.2,
            roughness: 0.6,
            emissive: 0x2563eb,
            emissiveIntensity: 0.05
        });
        const wrap = new THREE.Mesh(wrapGeo, wrapMat);
        wrap.rotation.z = Math.PI / 2;
        batteryGroup.add(wrap);

        // Positive nub
        const posGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 14);
        const posMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xef4444,
            emissiveIntensity: 0.4,
            metalness: 0.7,
            roughness: 0.2
        });
        const pos = new THREE.Mesh(posGeo, posMat);
        pos.rotation.z = Math.PI / 2;
        pos.position.x = 0.78;
        batteryGroup.add(pos);

        // Negative end cap
        const negGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16);
        const negMat = new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.9, roughness: 0.1 });
        const neg = new THREE.Mesh(negGeo, negMat);
        neg.rotation.z = Math.PI / 2;
        neg.position.x = -0.72;
        batteryGroup.add(neg);

        // + and - labels
        const plusSprite = this._createLabel('+', '#ef4444', 28);
        plusSprite.position.set(0.78, 0.5, 0);
        plusSprite.scale.set(0.6, 0.3, 1);
        batteryGroup.add(plusSprite);

        const minusSprite = this._createLabel('−', '#94a3b8', 28);
        minusSprite.position.set(-0.72, 0.5, 0);
        minusSprite.scale.set(0.6, 0.3, 1);
        batteryGroup.add(minusSprite);

        // Voltage label (dynamic)
        this.voltageLabel = this._createLabel(`${this.voltage} V`, '#60a5fa', 22);
        this.voltageLabel.position.set(0, -0.55, 0);
        this.voltageLabel.scale.set(1.5, 0.75, 1);
        batteryGroup.add(this.voltageLabel);

        // Battery glow (intensity varies with voltage)
        const glowGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending
        });
        this.batteryGlow = new THREE.Mesh(glowGeo, glowMat);
        this.batteryGlow.rotation.z = Math.PI / 2;
        batteryGroup.add(this.batteryGlow);

        batteryGroup.position.set(-2.5, 1.3, 0.5);
        this.group.add(batteryGroup);
        this.batteryGroup = batteryGroup;
    }

    _createResistor() {
        this.resistorGroup = new THREE.Group();

        // Ceramic body
        const bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.4, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xdbb68a,
            roughness: 0.65,
            metalness: 0.05
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        this.resistorGroup.add(body);

        // Color bands (more realistic)
        const bandData = [
            { color: 0x8b4513, pos: -0.45 },
            { color: 0x000000, pos: -0.25 },
            { color: 0xff0000, pos: -0.05 },
            { color: 0xffd700, pos: 0.30 }
        ];
        bandData.forEach(b => {
            const bandGeo = new THREE.CylinderGeometry(0.235, 0.235, 0.06, 16);
            const bandMat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.4, metalness: 0.1 });
            const band = new THREE.Mesh(bandGeo, bandMat);
            band.rotation.z = Math.PI / 2;
            band.position.x = b.pos;
            this.resistorGroup.add(band);
        });

        // Wire leads
        const leadMat = new THREE.MeshStandardMaterial({ color: 0xaaa, metalness: 0.8, roughness: 0.2 });
        [-1, 1].forEach(side => {
            const leadGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8);
            const lead = new THREE.Mesh(leadGeo, leadMat);
            lead.rotation.z = Math.PI / 2;
            lead.position.x = side * 0.95;
            this.resistorGroup.add(lead);
        });

        // Resistance label
        this.resistanceLabel = this._createLabel(`${this.resistance} Ω`, '#f59e0b', 22);
        this.resistanceLabel.position.set(0, -0.55, 0);
        this.resistanceLabel.scale.set(1.5, 0.75, 1);
        this.resistorGroup.add(this.resistanceLabel);

        // Heat glow (scales with power)
        const heatGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16);
        const heatMat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        this.resistorGlow = new THREE.Mesh(heatGeo, heatMat);
        this.resistorGlow.rotation.z = Math.PI / 2;
        this.resistorGroup.add(this.resistorGlow);

        // Point light for heat
        this.heatLight = new THREE.PointLight(0xff4400, 0, 3);
        this.resistorGroup.add(this.heatLight);

        this.resistorGroup.position.set(2.5, 1.3, 0.5);
        this.group.add(this.resistorGroup);
    }

    _createAmmeter() {
        const ammeterGroup = new THREE.Group();

        // Outer casing
        const casingGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.25, 28);
        const casingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.5 });
        const casing = new THREE.Mesh(casingGeo, casingMat);
        casing.rotation.x = Math.PI / 2;
        casing.castShadow = true;
        ammeterGroup.add(casing);

        // Face
        const faceGeo = new THREE.CircleGeometry(0.55, 36);
        const faceMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.3, metalness: 0.1 });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.z = 0.13;
        ammeterGroup.add(face);

        // Scale markings
        for (let i = 0; i <= 10; i++) {
            const angle = -Math.PI * 0.4 + (i / 10) * Math.PI * 0.8;
            const len = i % 5 === 0 ? 0.12 : 0.06;
            const inner = 0.42 - len;

            const markGeo = new THREE.PlaneGeometry(0.015, len);
            const markMat = new THREE.MeshBasicMaterial({ color: 0x475569, side: THREE.DoubleSide });
            const mark = new THREE.Mesh(markGeo, markMat);
            mark.position.set(
                Math.sin(angle) * (inner + len / 2),
                Math.cos(angle) * (inner + len / 2),
                0.14
            );
            mark.rotation.z = -angle;
            ammeterGroup.add(mark);
        }

        // 'A' label
        const aLabel = this._createLabel('A', '#22c55e', 24);
        aLabel.position.set(0, -0.2, 0.15);
        aLabel.scale.set(0.5, 0.25, 1);
        ammeterGroup.add(aLabel);

        // Needle
        const needleGeo = new THREE.PlaneGeometry(0.015, 0.4);
        const needleMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
        this.needle = new THREE.Mesh(needleGeo, needleMat);
        this.needle.position.set(0, 0.05, 0.14);
        ammeterGroup.add(this.needle);

        // Needle pivot dot
        const pivotGeo = new THREE.CircleGeometry(0.03, 12);
        const pivotMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const pivotDot = new THREE.Mesh(pivotGeo, pivotMat);
        pivotDot.position.z = 0.15;
        ammeterGroup.add(pivotDot);

        // Current display label
        this.currentLabel = this._createLabel('0.00 A', '#22c55e', 20);
        this.currentLabel.position.set(0, 0.8, 0);
        this.currentLabel.scale.set(1.5, 0.75, 1);
        ammeterGroup.add(this.currentLabel);

        ammeterGroup.position.set(0, 1.3, -2);
        this.group.add(ammeterGroup);
    }

    _createVoltmeter() {
        // Voltmeter display (digital style)
        const vmGroup = new THREE.Group();

        const boxGeo = new THREE.BoxGeometry(1.2, 0.8, 0.15);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.2, roughness: 0.6 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.castShadow = true;
        vmGroup.add(box);

        // Screen
        const screenGeo = new THREE.PlaneGeometry(1.0, 0.5);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x0a1628 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.08;
        vmGroup.add(screen);

        // V label
        const vLabel = this._createLabel('V', '#3b82f6', 16);
        vLabel.position.set(0.4, 0.25, 0.09);
        vLabel.scale.set(0.4, 0.2, 1);
        vmGroup.add(vLabel);

        // Voltage reading (dynamic)
        this.voltmeterDisplay = this._createLabel(`${this.voltage.toFixed(1)} V`, '#3b82f6', 26);
        this.voltmeterDisplay.position.set(0, 0, 0.09);
        this.voltmeterDisplay.scale.set(1.2, 0.6, 1);
        vmGroup.add(this.voltmeterDisplay);

        vmGroup.position.set(-2.5, 1.3, -2);
        vmGroup.rotation.y = 0.3;
        this.group.add(vmGroup);
    }

    _createWires() {
        const wireRadius = 0.035;

        // Wire path segments: Battery+ → Resistor → Ammeter → Battery-
        this.wirePaths = [
            // Top: Battery+ to Resistor
            { points: [[-1.72, 1.3, 0.5], [1.3, 1.3, 0.5]], color: 0xef4444 },
            // Right: Resistor to Ammeter
            { points: [[3.7, 1.3, 0.5], [3.7, 1.3, -2], [0.6, 1.3, -2]], color: 0x22c55e },
            // Bottom: Ammeter to Battery-
            { points: [[-0.6, 1.3, -2], [-3.5, 1.3, -2], [-3.5, 1.3, 0.5], [-3.28, 1.3, 0.5]], color: 0x3b82f6 }
        ];

        this.wirePaths.forEach(path => {
            const wireMat = new THREE.MeshStandardMaterial({
                color: path.color,
                metalness: 0.6,
                roughness: 0.3,
                emissive: path.color,
                emissiveIntensity: 0.05
            });

            for (let i = 0; i < path.points.length - 1; i++) {
                const start = new THREE.Vector3(...path.points[i]);
                const end = new THREE.Vector3(...path.points[i + 1]);
                const dir = new THREE.Vector3().subVectors(end, start);
                const len = dir.length();
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

                const geo = new THREE.CylinderGeometry(wireRadius, wireRadius, len, 8);
                const wire = new THREE.Mesh(geo, wireMat);
                wire.position.copy(mid);
                wire.lookAt(end);
                wire.rotateX(Math.PI / 2);
                wire.castShadow = true;
                this.group.add(wire);

                // Glow tube around wire
                const glowGeo = new THREE.CylinderGeometry(wireRadius * 2.5, wireRadius * 2.5, len, 8);
                const glowMat = new THREE.MeshBasicMaterial({
                    color: path.color,
                    transparent: true,
                    opacity: 0,
                    blending: THREE.AdditiveBlending
                });
                const glow = new THREE.Mesh(glowGeo, glowMat);
                glow.position.copy(mid);
                glow.lookAt(end);
                glow.rotateX(Math.PI / 2);
                this.group.add(glow);
                this.wireGlowMeshes.push(glow);
            }

            // Corner connectors (solder joints)
            path.points.forEach(pt => {
                const jointGeo = new THREE.SphereGeometry(wireRadius * 1.5, 8, 8);
                const jointMat = new THREE.MeshStandardMaterial({ color: 0xaaa, metalness: 0.9, roughness: 0.1 });
                const joint = new THREE.Mesh(jointGeo, jointMat);
                joint.position.set(...pt);
                this.group.add(joint);
            });
        });
    }

    _createElectrons() {
        // Electron path (full circuit loop)
        this.electronPath = [
            new THREE.Vector3(-1.72, 1.3, 0.5),
            new THREE.Vector3(1.3, 1.3, 0.5),
            new THREE.Vector3(3.7, 1.3, 0.5),
            new THREE.Vector3(3.7, 1.3, -2),
            new THREE.Vector3(0.6, 1.3, -2),
            new THREE.Vector3(-0.6, 1.3, -2),
            new THREE.Vector3(-3.5, 1.3, -2),
            new THREE.Vector3(-3.5, 1.3, 0.5),
            new THREE.Vector3(-3.28, 1.3, 0.5)
        ];

        // Calculate path segments
        this.pathSegments = [];
        this.totalPathLength = 0;
        for (let i = 0; i < this.electronPath.length - 1; i++) {
            const len = this.electronPath[i].distanceTo(this.electronPath[i + 1]);
            this.pathSegments.push({
                start: this.electronPath[i],
                end: this.electronPath[i + 1],
                length: len,
                cumLength: this.totalPathLength
            });
            this.totalPathLength += len;
        }

        // Create electrons with better visuals
        const electronCount = 24;
        for (let i = 0; i < electronCount; i++) {
            const eGroup = new THREE.Group();

            // Core
            const coreGeo = new THREE.SphereGeometry(0.055, 10, 10);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0x60a5fa,
                transparent: true,
                opacity: 0.9
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            eGroup.add(core);

            // Glow shell
            const glowGeo = new THREE.SphereGeometry(0.1, 8, 8);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0x60a5fa,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending
            });
            eGroup.add(new THREE.Mesh(glowGeo, glowMat));

            // Tiny point light
            const light = new THREE.PointLight(0x60a5fa, 0.1, 0.8);
            eGroup.add(light);

            eGroup.userData = {
                progress: i / electronCount,
                coreMat
            };
            this.electrons.push(eGroup);
            this.group.add(eGroup);
        }
    }

    _createVIGraph() {
        this.graphCanvas = document.createElement('canvas');
        this.graphCanvas.width = 230;
        this.graphCanvas.height = 140;
        this.graphCtx = this.graphCanvas.getContext('2d');

        const container = document.getElementById('data-display');
        if (container) {
            const graphDiv = document.createElement('div');
            graphDiv.className = 'graph-container';
            graphDiv.appendChild(this.graphCanvas);
            container.appendChild(graphDiv);
            this.graphDiv = graphDiv;
        }
        this._drawGraph();
    }

    _createPowerMeter() {
        // 3D power consumption visualization
        this.powerGroup = new THREE.Group();
        this.powerGroup.position.set(2.5, 1.3, -2);

        // Pod
        const podGeo = new THREE.BoxGeometry(1, 0.7, 0.15);
        const podMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.2, roughness: 0.5 });
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.castShadow = true;
        this.powerGroup.add(pod);

        const screenGeo = new THREE.PlaneGeometry(0.85, 0.45);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x0a1020 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.08;
        this.powerGroup.add(screen);

        const pLabel = this._createLabel('POWER', '#f59e0b', 12);
        pLabel.position.set(0, 0.28, 0.09);
        pLabel.scale.set(0.8, 0.35, 1);
        this.powerGroup.add(pLabel);

        this.powerDisplay = this._createLabel('0.00 W', '#f59e0b', 24);
        this.powerDisplay.position.set(0, -0.02, 0.09);
        this.powerDisplay.scale.set(1.2, 0.6, 1);
        this.powerGroup.add(this.powerDisplay);

        this.powerGroup.rotation.y = -0.3;
        this.group.add(this.powerGroup);
    }

    _createDangerIndicator() {
        // Danger warning for high power
        this.dangerSprite = this._createLabel('⚠ HIGH POWER', '#ef4444', 16);
        this.dangerSprite.position.set(2.5, 2.3, 0.5);
        this.dangerSprite.scale.set(2, 1, 1);
        this.dangerSprite.visible = false;
        this.group.add(this.dangerSprite);

        // Danger light
        this.dangerLight = new THREE.PointLight(0xef4444, 0, 4);
        this.dangerLight.position.set(2.5, 2, 0.5);
        this.group.add(this.dangerLight);
    }

    _drawGraph() {
        const ctx = this.graphCtx;
        const w = 230, h = 140;
        const pad = 28;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0f1e';
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 6; i++) {
            const gx = pad + (i / 6) * (w - 2 * pad);
            ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, h - pad); ctx.stroke();
            const gy = pad + (i / 6) * (h - 2 * pad);
            ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(w - pad, gy); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad, h - pad); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(pad, pad); ctx.stroke();

        // Arrow heads
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.moveTo(w - pad, h - pad); ctx.lineTo(w - pad - 5, h - pad - 4); ctx.lineTo(w - pad - 5, h - pad + 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad - 4, pad + 5); ctx.lineTo(pad + 4, pad + 5); ctx.fill();

        // Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Voltage (V)', w / 2, h - 6);
        ctx.save();
        ctx.translate(10, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Current (A)', 0, 0);
        ctx.restore();

        // Axis values
        ctx.font = '8px Inter, sans-serif';
        ctx.fillStyle = '#64748b';
        const maxV = 24;
        for (let v = 0; v <= maxV; v += 6) {
            const px = pad + (v / maxV) * (w - 2 * pad);
            ctx.fillText(v.toString(), px, h - pad + 12);
        }

        // V-I line
        const maxI = 24 / Math.max(this.resistance, 1);
        const scaleI = Math.max(maxI, 3);

        // Draw multiple R lines for context
        [10, 50, 100].forEach(r => {
            if (r === this.resistance) return;
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            for (let v = 0; v <= maxV; v += 1) {
                const cv = v / r;
                const px = pad + (v / maxV) * (w - 2 * pad);
                const py = h - pad - (cv / scaleI) * (h - 2 * pad);
                if (v === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Active R line
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        for (let v = 0; v <= maxV; v += 0.5) {
            const cv = v / this.resistance;
            const px = pad + (v / maxV) * (w - 2 * pad);
            const py = h - pad - (cv / scaleI) * (h - 2 * pad);
            if (v === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Current operating point
        const current = this.voltage / this.resistance;
        const px = pad + (this.voltage / maxV) * (w - 2 * pad);
        const py = h - pad - (current / scaleI) * (h - 2 * pad);

        // Crosshairs
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, h - pad); ctx.lineTo(px, py); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(px, py); ctx.stroke();
        ctx.setLineDash([]);

        // Point glow
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();

        // Point
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();

        // Point label
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 9px Inter, sans-serif';
        const labelText = `(${this.voltage}V, ${current.toFixed(2)}A)`;
        ctx.fillText(labelText, Math.min(px + 5, w - pad - 40), py - 10);

        // R label
        ctx.fillStyle = '#22c55e';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`R = ${this.resistance}Ω`, w - pad - 30, pad + 15);
    }

    _createLabel(text, color, fontSize = 20) {
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
        sprite.scale.set(1, 0.5, 1);
        sprite.userData = { canvasCtx: ctx, canvas, texture: tex, color, fontSize };
        return sprite;
    }

    _updateLabel(sprite, text) {
        const d = sprite.userData;
        d.canvasCtx.clearRect(0, 0, d.canvas.width, d.canvas.height);
        d.canvasCtx.fillStyle = d.color;
        d.canvasCtx.font = `bold ${d.fontSize}px Inter, sans-serif`;
        d.canvasCtx.textAlign = 'center';
        d.canvasCtx.textBaseline = 'middle';
        d.canvasCtx.fillText(text, 128, 64);
        d.texture.needsUpdate = true;
    }

    _getPositionOnPath(progress) {
        const targetDist = (progress % 1) * this.totalPathLength;
        for (const seg of this.pathSegments) {
            if (targetDist <= seg.cumLength + seg.length) {
                const segProgress = (targetDist - seg.cumLength) / seg.length;
                return new THREE.Vector3().lerpVectors(seg.start, seg.end, Math.max(0, Math.min(1, segProgress)));
            }
        }
        return this.electronPath[0].clone();
    }

    _setupControls() {
        this.controls.setSliders([
            { id: 'voltage', label: '🔋 Voltage (EMF)', min: 0, max: 24, step: 0.5, value: this.voltage, unit: 'V' },
            { id: 'resistance', label: '🔧 Resistance', min: 1, max: 100, step: 1, value: this.resistance, unit: 'Ω' }
        ], (id, val, all) => {
            this.voltage = all.voltage;
            this.resistance = all.resistance;
            this._updateCalculations();
            this._drawGraph();
        });

        // Resistance presets
        this.controls.setPresets('⚡ Resistance Presets', [
            { id: 'r10', text: '10Ω', value: 10, onClick: (v) => { this.controls.updateSlider('resistance', v); } },
            { id: 'r47', text: '47Ω', value: 47, onClick: (v) => { this.controls.updateSlider('resistance', v); } },
            { id: 'r100', text: '100Ω', value: 100, onClick: (v) => { this.controls.updateSlider('resistance', v); } },
            {
                id: 'r220', text: '220Ω', value: 220, onClick: () => {
                    // 220 is beyond slider max, clamp to 100
                    this.controls.updateSlider('resistance', 100);
                }
            }
        ], 'resistance-presets');

        // Circuit power toggle
        this.controls.setToggles([
            {
                id: 'circuit-power', label: '🔌 Circuit Power', value: true, onChange: (on) => {
                    this.circuitOn = on;
                    this._toggleCircuit(on);
                }
            }
        ]);

        this.controls.setActions([
            {
                id: 'reset',
                label: 'Reset Defaults',
                icon: '🔄',
                className: 'btn-secondary',
                onClick: () => {
                    this.voltage = 12;
                    this.resistance = 10;
                    this.controls.updateSlider('voltage', 12);
                    this.controls.updateSlider('resistance', 10);
                    this._updateCalculations();
                    this._drawGraph();
                }
            }
        ]);
    }

    // ─── CIRCUIT SWITCH ─────────────────────────────────
    _createCircuitSwitch() {
        this.switchGroup = new THREE.Group();

        // Switch base
        const baseGeo = new THREE.BoxGeometry(0.6, 0.15, 0.4);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.3, roughness: 0.5 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.castShadow = true;
        this.switchGroup.add(base);

        // Switch lever
        const leverGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
        const leverMat = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x22c55e,
            emissiveIntensity: 0.3,
            metalness: 0.5,
            roughness: 0.3
        });
        this.switchLever = new THREE.Mesh(leverGeo, leverMat);
        this.switchLever.position.y = 0.18;
        this.switchGroup.add(this.switchLever);
        this.switchLeverMat = leverMat;

        // ON/OFF label
        this.switchLabel = this._createLabel('ON', '#22c55e', 14);
        this.switchLabel.position.set(0, 0.5, 0);
        this.switchLabel.scale.set(0.6, 0.3, 1);
        this.switchGroup.add(this.switchLabel);

        // Light indicator
        const lightGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        this.switchLight = new THREE.Mesh(lightGeo, lightMat);
        this.switchLight.position.set(0.35, 0.08, 0);
        this.switchGroup.add(this.switchLight);
        this.switchLightMat = lightMat;

        this.switchGroup.position.set(0, 0.58, 1.5);
        this.group.add(this.switchGroup);
    }

    _toggleCircuit(on) {
        if (on) {
            this.switchLever.position.y = 0.18;
            this.switchLeverMat.color.setHex(0x22c55e);
            this.switchLeverMat.emissive.setHex(0x22c55e);
            this.switchLightMat.color.setHex(0x22c55e);
            this._updateLabel(this.switchLabel, 'ON');
            this.switchLabel.userData.color = '#22c55e';
        } else {
            this.switchLever.position.y = 0.10;
            this.switchLeverMat.color.setHex(0xef4444);
            this.switchLeverMat.emissive.setHex(0xef4444);
            this.switchLightMat.color.setHex(0x991b1b);
            this._updateLabel(this.switchLabel, 'OFF');
            this.switchLabel.userData.color = '#ef4444';
        }
        this._updateCalculations();
    }

    // ─── CLICK TO HIGHLIGHT & INFO ─────────────────────
    _setupInteraction() {
        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();
        this._tooltip = null;

        // Component info definitions
        this._componentInfo = {
            battery: { name: '🔋 Battery (EMF)', desc: 'Provides electromotive force to drive current through the circuit.', getValue: () => `${this.voltage} V` },
            resistor: { name: '🔧 Resistor', desc: 'Opposes current flow. Converts electrical energy to heat.', getValue: () => `${this.resistance} Ω` },
            switch: { name: '🔌 Circuit Switch', desc: 'Click to toggle circuit ON/OFF.', getValue: () => this.circuitOn ? 'ON' : 'OFF' }
        };

        const canvas = this.scene.canvas;

        this._onClick = (e) => {
            this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this._raycaster.setFromCamera(this._mouse, this.scene.camera);

            // Check switch click
            const switchHits = this._raycaster.intersectObject(this.switchGroup, true);
            if (switchHits.length > 0) {
                this.circuitOn = !this.circuitOn;
                const toggle = document.getElementById('toggle-circuit-power');
                if (toggle) toggle.checked = this.circuitOn;
                this._toggleCircuit(this.circuitOn);
                this._showComponentTooltip(e, this._componentInfo.switch);
                return;
            }

            // Check battery click
            if (this.batteryGroup) {
                const batteryHits = this._raycaster.intersectObject(this.batteryGroup, true);
                if (batteryHits.length > 0) {
                    this._showComponentTooltip(e, this._componentInfo.battery);
                    return;
                }
            }

            // Check resistor click
            if (this.resistorGroup) {
                const resistorHits = this._raycaster.intersectObject(this.resistorGroup, true);
                if (resistorHits.length > 0) {
                    this._showComponentTooltip(e, this._componentInfo.resistor);
                    return;
                }
            }

            // Click elsewhere: hide tooltip
            this._hideTooltip();
        };

        this._onHover = (e) => {
            this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this._raycaster.setFromCamera(this._mouse, this.scene.camera);

            const interactables = [this.switchGroup, this.batteryGroup, this.resistorGroup].filter(Boolean);
            let hit = false;
            for (const obj of interactables) {
                if (this._raycaster.intersectObject(obj, true).length > 0) { hit = true; break; }
            }
            canvas.classList.toggle('hovering-interactive', hit);
        };

        canvas.addEventListener('click', this._onClick);
        canvas.addEventListener('pointermove', this._onHover);
    }

    _showComponentTooltip(e, info) {
        this._hideTooltip();
        const tip = document.createElement('div');
        tip.className = 'component-tooltip';
        tip.innerHTML = `
            <h4>${info.name}</h4>
            <p>${info.desc}</p>
            <div class="tooltip-value">${info.getValue()}</div>
        `;
        tip.style.left = `${Math.min(e.clientX + 15, window.innerWidth - 280)}px`;
        tip.style.top = `${Math.min(e.clientY - 10, window.innerHeight - 120)}px`;
        document.body.appendChild(tip);
        this._tooltip = tip;

        // Auto-hide after 3s
        this._tooltipTimer = setTimeout(() => this._hideTooltip(), 3000);
    }

    _hideTooltip() {
        if (this._tooltip) {
            this._tooltip.remove();
            this._tooltip = null;
        }
        if (this._tooltipTimer) clearTimeout(this._tooltipTimer);
    }

    _setupData() {
        this.data.setData([
            { id: 'current', label: 'Current (I)', value: '0.000', unit: 'A' },
            { id: 'power', label: 'Power (P)', value: '0.00', unit: 'W' },
            { id: 'voltage-drop', label: 'Voltage Drop', value: '0.0', unit: 'V' },
            { id: 'energy', label: 'Energy/sec', value: '0.00', unit: 'J/s' },
            { id: 'conductance', label: 'Conductance', value: '0.000', unit: 'S' },
            { id: 'charge-rate', label: 'Charge Rate', value: '0.000', unit: 'C/s' }
        ]);

        this.data.setFormulas([
            'V = I × R',
            'I = V / R',
            'P = V × I = V²/R',
            'P = I² × R',
            'G = 1/R  (Siemens)',
            'Q = I × t  (Coulombs)'
        ]);
    }

    _updateCalculations() {
        const effectiveCurrent = this.circuitOn ? this.voltage / this.resistance : 0;
        const current = effectiveCurrent;
        const power = this.voltage * current;
        const conductance = 1 / this.resistance;

        this.data.updateValue('current', current.toFixed(3), 'A');
        this.data.updateValue('power', power.toFixed(2), 'W');
        this.data.updateValue('voltage-drop', this.voltage.toFixed(1), 'V');
        this.data.updateValue('energy', power.toFixed(2), 'J/s');
        this.data.updateValue('conductance', conductance.toFixed(4), 'S');
        this.data.updateValue('charge-rate', current.toFixed(3), 'C/s');

        // Update 3D labels
        this._updateLabel(this.voltageLabel, `${this.voltage} V`);
        this._updateLabel(this.resistanceLabel, `${this.resistance} Ω`);
        this._updateLabel(this.currentLabel, `${current.toFixed(2)} A`);
        this._updateLabel(this.voltmeterDisplay, `${this.voltage.toFixed(1)} V`);
        this._updateLabel(this.powerDisplay, `${power.toFixed(1)} W`);

        // Needle angle
        const maxCurrent = 24;
        const needleAngle = -(current / maxCurrent) * Math.PI * 0.8;
        this.needle.rotation.z = needleAngle;

        // Heat effects on resistor
        const heatIntensity = Math.min(power / 80, 0.6);
        this.resistorGlow.material.opacity = heatIntensity;
        this.heatLight.intensity = heatIntensity * 3;

        // Battery glow
        this.batteryGlow.material.opacity = Math.min(this.voltage / 24 * 0.15, 0.15);

        // Wire glow intensity
        const wireGlowVal = Math.min(current / 5, 0.25);
        this.wireGlowMeshes.forEach(g => { g.material.opacity = wireGlowVal; });

        // Danger indicator
        const isDangerous = power > 50;
        this.dangerSprite.visible = isDangerous;
        this.dangerLight.intensity = isDangerous ? 2 : 0;

        // Spark particles at high power
        if (power > 40 && Math.random() < 0.1) {
            this._spawnSpark();
        }
    }

    _spawnSpark() {
        const geo = new THREE.SphereGeometry(0.02 + Math.random() * 0.02, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.1 * Math.random(), 1, 0.8),
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        const spark = new THREE.Mesh(geo, mat);
        spark.position.set(
            2.5 + (Math.random() - 0.5) * 0.5,
            1.3 + Math.random() * 0.5,
            0.5 + (Math.random() - 0.5) * 0.3
        );
        spark.userData = {
            vx: (Math.random() - 0.5) * 3,
            vy: 1 + Math.random() * 3,
            vz: (Math.random() - 0.5) * 3,
            life: 0.3 + Math.random() * 0.3,
            age: 0
        };
        this.sparkParticles.push(spark);
        this.group.add(spark);
    }

    _animate(delta) {
        const effectiveCurrent = this.circuitOn ? this.voltage / this.resistance : 0;
        const current = effectiveCurrent;
        const power = this.circuitOn ? this.voltage * current : 0;
        const speed = Math.max(current * 0.08, 0.001);

        // Animate electrons
        this.electrons.forEach(e => {
            if (!this.circuitOn) {
                // Electrons dim and stop when circuit is off
                e.userData.coreMat.opacity = 0.15;
                e.scale.set(0.3, 0.3, 0.3);
                return;
            }
            e.userData.progress += speed * delta;
            if (e.userData.progress > 1) e.userData.progress -= 1;
            const pos = this._getPositionOnPath(e.userData.progress);
            e.position.copy(pos);

            // Brightness based on current
            const brightness = Math.min(current / 3, 1);
            e.userData.coreMat.opacity = 0.3 + brightness * 0.7;
            const pulse = 0.8 + Math.sin(e.userData.progress * Math.PI * 6 + Date.now() * 0.005) * 0.2;
            e.scale.set(pulse * brightness + 0.3, pulse * brightness + 0.3, pulse * brightness + 0.3);
        });

        // Sparks
        for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
            const s = this.sparkParticles[i];
            s.userData.age += delta;
            if (s.userData.age > s.userData.life) {
                this.group.remove(s);
                s.geometry.dispose();
                s.material.dispose();
                this.sparkParticles.splice(i, 1);
                continue;
            }
            s.position.x += s.userData.vx * delta;
            s.position.y += s.userData.vy * delta;
            s.position.z += s.userData.vz * delta;
            s.userData.vy -= 8 * delta;
            s.material.opacity = 1 - s.userData.age / s.userData.life;
        }

        // Danger flash
        if (this.dangerSprite.visible) {
            this.dangerSprite.material.opacity = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
            this.dangerLight.intensity = 1 + Math.sin(Date.now() * 0.01) * 1;
        }

        // Continuous spark generation at high power
        if (power > 40 && Math.random() < delta * 5) {
            this._spawnSpark();
        }
    }

    dispose() {
        this.scene.removeAnimateCallback(this._animateBound);
        this.scene.removeFromScene(this.group);

        if (this.graphDiv && this.graphDiv.parentElement) {
            this.graphDiv.remove();
        }

        // Remove interaction listeners
        const canvas = this.scene.canvas;
        if (this._onClick) canvas.removeEventListener('click', this._onClick);
        if (this._onHover) canvas.removeEventListener('pointermove', this._onHover);
        canvas.classList.remove('hovering-interactive');
        this._hideTooltip();

        // Clean up sparks
        this.sparkParticles.forEach(s => {
            this.group.remove(s);
            s.geometry.dispose();
            s.material.dispose();
        });

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
