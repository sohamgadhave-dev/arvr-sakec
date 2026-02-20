import * as THREE from 'three';

export class LabEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this._build();
        scene.add(this.group);
    }

    _build() {
        this._createFloor();
        this._createWalls();
        this._createCeiling();
        this._createCeilingLights();
        this._createWorkbench();
        this._createStorageCabinet();
        this._createComputerStation();
        this._createMeasurementStand();
        this._createSafetyCone();
        this._createLabBoard();
        this._createSafetyPoster();
        this._createWallScale();
        this._createBaseboards();
        this._createDoorFrame();
        this._createDustMotes();
    }

    // ─── FLOOR ─────────────────────────────────────────────
    _createFloor() {
        const SIZE = 30;
        const geo = new THREE.PlaneGeometry(SIZE, SIZE);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xb8bcc5,
            roughness: 0.65,
            metalness: 0.08
        });
        const floor = new THREE.Mesh(geo, mat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);

        // Tile grid lines
        this._addTileLines(SIZE);
    }

    _addTileLines(size) {
        const tileSize = 1.5;
        const halfSize = size / 2;
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x9a9ea8,
            transparent: true,
            opacity: 0.2
        });

        for (let i = -halfSize; i <= halfSize; i += tileSize) {
            // X-direction
            const hPts = [new THREE.Vector3(-halfSize, 0.003, i), new THREE.Vector3(halfSize, 0.003, i)];
            this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hPts), lineMat));
            // Z-direction
            const vPts = [new THREE.Vector3(i, 0.003, -halfSize), new THREE.Vector3(i, 0.003, halfSize)];
            this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(vPts), lineMat));
        }
    }

    // ─── WALLS ─────────────────────────────────────────────
    _createWalls() {
        const wallH = 8;
        const halfW = 15;
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0xd5d8de,
            roughness: 0.85,
            metalness: 0.02,
            side: THREE.DoubleSide
        });

        const wallDarkMat = new THREE.MeshStandardMaterial({
            color: 0xc2c6ce,
            roughness: 0.82,
            metalness: 0.02,
            side: THREE.DoubleSide
        });

        // Back wall
        const back = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, wallH), wallMat);
        back.position.set(0, wallH / 2, -halfW);
        back.receiveShadow = true;
        this.group.add(back);

        // Left wall
        const left = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, wallH), wallDarkMat);
        left.position.set(-halfW, wallH / 2, 0);
        left.rotation.y = Math.PI / 2;
        left.receiveShadow = true;
        this.group.add(left);

        // Right wall
        const right = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, wallH), wallDarkMat);
        right.position.set(halfW, wallH / 2, 0);
        right.rotation.y = -Math.PI / 2;
        right.receiveShadow = true;
        this.group.add(right);

        // Front wall (behind camera, with gap for door area)
        const front = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, wallH), wallMat);
        front.position.set(0, wallH / 2, halfW);
        front.rotation.y = Math.PI;
        front.receiveShadow = true;
        this.group.add(front);

        // Wall stripe (accent band)
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0x37587a,
            roughness: 0.5,
            metalness: 0.1
        });
        const stripeH = 0.08;
        [[-halfW + 0.01, Math.PI / 2], [halfW - 0.01, -Math.PI / 2], [0, 0]].forEach(([x, ry]) => {
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, stripeH), stripeMat);
            stripe.position.set(x === 0 ? 0 : x, 1.2, x === 0 ? -halfW + 0.01 : 0);
            stripe.rotation.y = ry;
            this.group.add(stripe);
        });
    }

    // ─── CEILING ───────────────────────────────────────────
    _createCeiling() {
        const ceilGeo = new THREE.PlaneGeometry(30, 30);
        const ceilMat = new THREE.MeshStandardMaterial({
            color: 0xe8eaef,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 8;
        this.group.add(ceiling);

        // Ceiling panel grid
        const panelMat = new THREE.LineBasicMaterial({ color: 0xc0c4cc, transparent: true, opacity: 0.3 });
        for (let i = -14; i <= 14; i += 2.5) {
            const h = [new THREE.Vector3(-15, 7.99, i), new THREE.Vector3(15, 7.99, i)];
            this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(h), panelMat));
            const v = [new THREE.Vector3(i, 7.99, -15), new THREE.Vector3(i, 7.99, 15)];
            this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(v), panelMat));
        }
    }

    // ─── CEILING LIGHT FIXTURES ────────────────────────────
    _createCeilingLights() {
        const positions = [
            [0, 0], [8, 0], [-8, 0],
            [0, -6], [8, -6], [-8, -6],
            [0, 6], [8, 6]
        ];

        positions.forEach(([x, z]) => {
            const fixtureGroup = new THREE.Group();

            // Housing
            const housingGeo = new THREE.BoxGeometry(1.8, 0.08, 0.5);
            const housingMat = new THREE.MeshStandardMaterial({
                color: 0xaab0bb,
                metalness: 0.6,
                roughness: 0.3
            });
            const housing = new THREE.Mesh(housingGeo, housingMat);
            fixtureGroup.add(housing);

            // Diffuser panel (emissive)
            const diffGeo = new THREE.PlaneGeometry(1.6, 0.35);
            const diffMat = new THREE.MeshStandardMaterial({
                color: 0xf8f4ee,
                emissive: 0xf0ebe0,
                emissiveIntensity: 0.6,
                roughness: 0.2,
                metalness: 0.0,
                side: THREE.DoubleSide
            });
            const diff = new THREE.Mesh(diffGeo, diffMat);
            diff.rotation.x = Math.PI / 2;
            diff.position.y = -0.045;
            fixtureGroup.add(diff);

            fixtureGroup.position.set(x, 7.92, z);
            this.group.add(fixtureGroup);
        });
    }

    // ─── WORKBENCH ─────────────────────────────────────────
    _createWorkbench() {
        const bench = new THREE.Group();

        // Countertop — satin grey laminate
        const topGeo = new THREE.BoxGeometry(5, 0.08, 1.8);
        const topMat = new THREE.MeshStandardMaterial({
            color: 0x505860,
            roughness: 0.4,
            metalness: 0.15
        });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = 0.86;
        top.castShadow = true;
        top.receiveShadow = true;
        bench.add(top);

        // Front edge strip
        const edgeGeo = new THREE.BoxGeometry(5, 0.04, 0.04);
        const edgeMat = new THREE.MeshStandardMaterial({ color: 0x37587a, roughness: 0.3, metalness: 0.3 });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.position.set(0, 0.84, 0.9);
        bench.add(edge);

        // Steel legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0x8a8f98, metalness: 0.7, roughness: 0.25 });
        const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.82, 10);
        [[-2.3, -0.7], [-2.3, 0.7], [2.3, -0.7], [2.3, 0.7]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(lx, 0.41, lz);
            leg.castShadow = true;
            bench.add(leg);
        });

        // Cross brace
        const braceGeo = new THREE.BoxGeometry(4.6, 0.03, 0.03);
        const brace = new THREE.Mesh(braceGeo, legMat);
        brace.position.set(0, 0.2, 0);
        bench.add(brace);

        bench.position.set(-5, 0, -8);
        this.group.add(bench);
    }

    // ─── STORAGE CABINET ───────────────────────────────────
    _createStorageCabinet() {
        const cabinet = new THREE.Group();

        const bodyGeo = new THREE.BoxGeometry(1.2, 2.0, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.5,
            metalness: 0.25
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        body.castShadow = true;
        cabinet.add(body);

        // Door lines
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x555b65 });
        const lineGeo = new THREE.BoxGeometry(0.008, 1.8, 0.01);
        const doorLine = new THREE.Mesh(lineGeo, lineMat);
        doorLine.position.set(0, 1.0, 0.31);
        cabinet.add(doorLine);

        // Handle
        const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xccc, metalness: 0.8, roughness: 0.2 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.set(0.2, 1.2, 0.32);
        cabinet.add(handle);

        // Vent slits
        for (let i = 0; i < 4; i++) {
            const ventGeo = new THREE.BoxGeometry(0.6, 0.015, 0.01);
            const vent = new THREE.Mesh(ventGeo, lineMat);
            vent.position.set(0, 0.15 + i * 0.06, 0.31);
            cabinet.add(vent);
        }

        cabinet.position.set(-12, 0, -10);
        this.group.add(cabinet);
    }

    // ─── COMPUTER MONITOR ──────────────────────────────────
    _createComputerStation() {
        const station = new THREE.Group();

        // Monitor
        const bezelGeo = new THREE.BoxGeometry(0.8, 0.5, 0.03);
        const bezelMat = new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.3, metalness: 0.2 });
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        bezel.position.set(0, 1.2, 0);
        bezel.castShadow = true;
        station.add(bezel);

        // Screen
        const screenGeo = new THREE.PlaneGeometry(0.7, 0.4);
        const screenMat = new THREE.MeshStandardMaterial({
            color: 0x0d1b2a,
            emissive: 0x1a3a5c,
            emissiveIntensity: 0.15,
            roughness: 0.1,
            metalness: 0.0
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 1.2, 0.016);
        station.add(screen);

        // Screen text
        const dataCanvas = document.createElement('canvas');
        dataCanvas.width = 256;
        dataCanvas.height = 128;
        const ctx = dataCanvas.getContext('2d');
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = '#22c55e';
        ctx.font = '11px monospace';
        ctx.fillText('LAB MONITOR v2.4', 10, 20);
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('STATUS: ACTIVE', 10, 40);
        ctx.fillText('TEMP: 22°C', 10, 55);
        ctx.fillText('HUMIDITY: 45%', 10, 70);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('EXPERIMENT: PROJECTILE', 10, 92);
        ctx.fillText('MODE: SIMULATION', 10, 107);
        const screenTex = new THREE.CanvasTexture(dataCanvas);
        const screenOverlay = new THREE.Mesh(
            new THREE.PlaneGeometry(0.68, 0.38),
            new THREE.MeshBasicMaterial({ map: screenTex, transparent: true })
        );
        screenOverlay.position.set(0, 1.2, 0.017);
        station.add(screenOverlay);

        // Monitor stand
        const standGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.3, 8);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x444, metalness: 0.7, roughness: 0.3 });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.set(0, 0.95, 0);
        station.add(stand);

        // Base
        const baseGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16);
        const base = new THREE.Mesh(baseGeo, standMat);
        base.position.set(0, 0.8, 0);
        station.add(base);

        station.position.set(-5, 0.07, -8.3);
        station.rotation.y = 0.15;
        this.group.add(station);
    }

    // ─── MEASUREMENT SCALE STAND ───────────────────────────
    _createMeasurementStand() {
        const standGroup = new THREE.Group();

        // Pole
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x888e98, metalness: 0.6, roughness: 0.3 });
        const poleGeo = new THREE.CylinderGeometry(0.02, 0.025, 1.6, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 0.8;
        pole.castShadow = true;
        standGroup.add(pole);

        // Weighted base
        const baseGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.06, 14);
        const base = new THREE.Mesh(baseGeo, poleMat);
        base.position.y = 0.03;
        standGroup.add(base);

        // Scale plate
        const plateGeo = new THREE.PlaneGeometry(0.3, 1.2);
        const plateCanvas = document.createElement('canvas');
        plateCanvas.width = 64;
        plateCanvas.height = 256;
        const ctx = plateCanvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 64, 256);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const y = 12 + i * 12;
            ctx.beginPath();
            ctx.moveTo(i % 5 === 0 ? 5 : 20, y);
            ctx.lineTo(44, y);
            ctx.stroke();
            if (i % 5 === 0) {
                ctx.fillStyle = '#333';
                ctx.font = '10px sans-serif';
                ctx.fillText(`${i * 5}`, 46, y + 4);
            }
        }
        const plateTex = new THREE.CanvasTexture(plateCanvas);
        const plateMat = new THREE.MeshStandardMaterial({
            map: plateTex,
            roughness: 0.7,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.set(0.02, 0.8, 0.01);
        standGroup.add(plate);

        standGroup.position.set(12, 0, -5);
        this.group.add(standGroup);
    }

    // ─── SAFETY CONE ───────────────────────────────────────
    _createSafetyCone() {
        const coneGroup = new THREE.Group();

        const coneGeo = new THREE.ConeGeometry(0.15, 0.55, 12);
        const coneMat = new THREE.MeshStandardMaterial({
            color: 0xe65100,
            roughness: 0.6,
            metalness: 0.05
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = 0.32;
        cone.castShadow = true;
        coneGroup.add(cone);

        // White stripe
        const stripeGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.06, 12);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 0.35;
        coneGroup.add(stripe);

        // Square base
        const baseGeo = new THREE.BoxGeometry(0.35, 0.04, 0.35);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.7, metalness: 0.05 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.02;
        coneGroup.add(base);

        coneGroup.position.set(10, 0, 3);
        this.group.add(coneGroup);

        // Second cone
        const cone2 = coneGroup.clone();
        cone2.position.set(10, 0, -3);
        cone2.rotation.y = 0.5;
        this.group.add(cone2);
    }

    // ─── LAB BOARD ─────────────────────────────────────────
    _createLabBoard() {
        const boardGroup = new THREE.Group();

        // Frame
        const frameGeo = new THREE.BoxGeometry(3, 1.2, 0.06);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x37587a,
            roughness: 0.4,
            metalness: 0.2
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.castShadow = true;
        boardGroup.add(frame);

        // White background
        const bgGeo = new THREE.PlaneGeometry(2.8, 1.0);
        const bgMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = 0.031;
        boardGroup.add(bg);

        // Board text
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 512;
        textCanvas.height = 192;
        const ctx = textCanvas.getContext('2d');
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, 512, 192);

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 22px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Engineering Lab', 256, 40);

        ctx.font = '16px Inter, Arial, sans-serif';
        ctx.fillStyle = '#37587a';
        ctx.fillText('Projectile Motion Station', 256, 70);

        ctx.font = '12px Inter, Arial, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('g = 9.81 m/s²    |    Air Resistance: Negligible', 256, 105);
        ctx.fillText('Safety glasses required during launch', 256, 130);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px Inter, Arial, sans-serif';
        ctx.fillText('⚠ KEEP CLEAR OF LAUNCH ZONE', 256, 165);

        const textTex = new THREE.CanvasTexture(textCanvas);
        const textMat = new THREE.MeshBasicMaterial({ map: textTex, transparent: true });
        const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.78, 0.98), textMat);
        textMesh.position.z = 0.032;
        boardGroup.add(textMesh);

        boardGroup.position.set(0, 4.5, -14.96);
        this.group.add(boardGroup);
    }

    // ─── SAFETY POSTER ─────────────────────────────────────
    _createSafetyPoster() {
        const posterCanvas = document.createElement('canvas');
        posterCanvas.width = 256;
        posterCanvas.height = 384;
        const ctx = posterCanvas.getContext('2d');

        // Yellow background
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, 0, 256, 384);

        // Warning triangle
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠', 128, 80);

        ctx.font = 'bold 18px Arial';
        ctx.fillText('SAFETY', 128, 120);
        ctx.fillText('FIRST', 128, 145);

        ctx.font = '11px Arial';
        ctx.fillStyle = '#333';
        const rules = [
            '• Wear safety glasses',
            '• Stand behind line',
            '• Report incidents',
            '• Know exits',
            '• No running'
        ];
        rules.forEach((r, i) => {
            ctx.textAlign = 'left';
            ctx.fillText(r, 30, 185 + i * 22);
        });

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EMERGENCY: DIAL 100', 128, 360);

        const posterTex = new THREE.CanvasTexture(posterCanvas);
        const posterMat = new THREE.MeshBasicMaterial({ map: posterTex });
        const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), posterMat);
        poster.position.set(-14.96, 3.5, -4);
        poster.rotation.y = Math.PI / 2;
        this.group.add(poster);
    }

    // ─── WALL MEASUREMENT SCALE ────────────────────────────
    _createWallScale() {
        const scaleCanvas = document.createElement('canvas');
        scaleCanvas.width = 64;
        scaleCanvas.height = 512;
        const ctx = scaleCanvas.getContext('2d');

        ctx.fillStyle = '#d5d8de';
        ctx.fillRect(0, 0, 64, 512);

        ctx.strokeStyle = '#1e293b';
        ctx.fillStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 40; i++) {
            const y = 512 - i * 12;
            const isMajor = i % 5 === 0;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(isMajor ? 35 : 18, y);
            ctx.stroke();
            if (isMajor) {
                ctx.font = '10px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`${i * 10}`, 38, y + 4);
            }
        }

        // cm label
        ctx.font = 'bold 9px monospace';
        ctx.fillText('cm', 38, 18);

        const scaleTex = new THREE.CanvasTexture(scaleCanvas);
        const scaleMat = new THREE.MeshBasicMaterial({ map: scaleTex });
        const scaleMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 3), scaleMat);
        scaleMesh.position.set(14.96, 2.5, -8);
        scaleMesh.rotation.y = -Math.PI / 2;
        this.group.add(scaleMesh);
    }

    // ─── BASEBOARDS ────────────────────────────────────────
    _createBaseboards() {
        const bbMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.5,
            metalness: 0.1
        });
        const bbGeo = new THREE.BoxGeometry(30, 0.12, 0.03);

        // Back
        const back = new THREE.Mesh(bbGeo, bbMat);
        back.position.set(0, 0.06, -14.98);
        this.group.add(back);

        // Front
        const front = new THREE.Mesh(bbGeo.clone(), bbMat);
        front.position.set(0, 0.06, 14.98);
        this.group.add(front);

        // Sides
        const sideGeo = new THREE.BoxGeometry(0.03, 0.12, 30);
        const leftBb = new THREE.Mesh(sideGeo, bbMat);
        leftBb.position.set(-14.98, 0.06, 0);
        this.group.add(leftBb);

        const rightBb = new THREE.Mesh(sideGeo.clone(), bbMat);
        rightBb.position.set(14.98, 0.06, 0);
        this.group.add(rightBb);
    }

    // ─── DOOR FRAME ────────────────────────────────────────
    _createDoorFrame() {
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x6b7280,
            roughness: 0.4,
            metalness: 0.2
        });

        // Vertical posts
        const postGeo = new THREE.BoxGeometry(0.08, 2.4, 0.08);
        const leftPost = new THREE.Mesh(postGeo, frameMat);
        leftPost.position.set(1, 1.2, 14.97);
        leftPost.castShadow = true;
        this.group.add(leftPost);

        const rightPost = new THREE.Mesh(postGeo.clone(), frameMat);
        rightPost.position.set(-1, 1.2, 14.97);
        rightPost.castShadow = true;
        this.group.add(rightPost);

        // Lintel
        const lintelGeo = new THREE.BoxGeometry(2.16, 0.08, 0.08);
        const lintel = new THREE.Mesh(lintelGeo, frameMat);
        lintel.position.set(0, 2.4, 14.97);
        this.group.add(lintel);

        // Door (dark)
        const doorGeo = new THREE.PlaneGeometry(2, 2.35);
        const doorMat = new THREE.MeshStandardMaterial({
            color: 0x3a3f4a,
            roughness: 0.6,
            metalness: 0.15,
            side: THREE.DoubleSide
        });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 1.175, 14.95);
        door.rotation.y = Math.PI;
        this.group.add(door);

        // Door handle
        const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xccc, metalness: 0.8, roughness: 0.2 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(-0.6, 1.1, 14.93);
        this.group.add(handle);
    }

    // ─── DUST MOTES ────────────────────────────────────────
    _createDustMotes() {
        const count = 120;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 1] = 1 + Math.random() * 6;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xe8dcc8,
            size: 0.02,
            transparent: true,
            opacity: 0.25,
            depthWrite: false
        });

        this.dustMotes = new THREE.Points(geo, mat);
        this.group.add(this.dustMotes);
    }

    update(elapsed) {
        if (this.dustMotes) {
            this.dustMotes.rotation.y = elapsed * 0.008;
            this.dustMotes.position.y = Math.sin(elapsed * 0.3) * 0.05;
        }
    }

    dispose() {
        this.scene.remove(this.group);
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
    }
}
