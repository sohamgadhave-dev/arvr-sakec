import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.animationCallbacks = [];
        this.isRunning = false;

        // Realistic fog for depth
        this.scene.fog = new THREE.FogExp2(0x1a1d2e, 0.012);

        // Renderer — realistic tone mapping
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.9;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Camera — eye-level immersive
        this.camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            200
        );
        this.camera.position.set(5, 1.7, 8);

        // Controls
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.06;
        this.controls.minDistance = 1.5;
        this.controls.maxDistance = 25;
        this.controls.maxPolarAngle = Math.PI * 0.88;
        this.controls.minPolarAngle = 0.2;
        this.controls.target.set(3, 1.0, 0);
        this.controls.enablePan = true;
        this.controls.panSpeed = 0.5;

        // Lighting
        this._setupLighting();

        // Resize
        this._boundResize = this._onResize.bind(this);
        window.addEventListener('resize', this._boundResize);
    }

    _setupLighting() {
        // Low ambient for indoor realism
        const ambient = new THREE.AmbientLight(0xc8cfe0, 0.25);
        this.scene.add(ambient);

        // Hemisphere light — ceiling white, floor dark
        const hemi = new THREE.HemisphereLight(0xe8ecf0, 0x2a2e3a, 0.3);
        this.scene.add(hemi);

        // Main overhead panel light (simulating ceiling fluorescent)
        this.dirLight = new THREE.DirectionalLight(0xf5f0e8, 1.0);
        this.dirLight.position.set(5, 8, 4);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.set(2048, 2048);
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 30;
        this.dirLight.shadow.camera.left = -18;
        this.dirLight.shadow.camera.right = 18;
        this.dirLight.shadow.camera.top = 12;
        this.dirLight.shadow.camera.bottom = -12;
        this.dirLight.shadow.bias = -0.001;
        this.dirLight.shadow.normalBias = 0.02;
        this.scene.add(this.dirLight);

        // Secondary fill from the side (soft)
        const fill = new THREE.DirectionalLight(0xbcc5d6, 0.2);
        fill.position.set(-6, 6, -2);
        this.scene.add(fill);

        // Overhead spot lights (ceiling panels)
        const spotPositions = [
            [0, 7.8, 0], [8, 7.8, 0], [16, 7.8, 0],
            [0, 7.8, -5], [8, 7.8, -5], [16, 7.8, -5]
        ];
        spotPositions.forEach(pos => {
            const spot = new THREE.PointLight(0xf0ebe0, 0.4, 18, 1.5);
            spot.position.set(...pos);
            this.scene.add(spot);
        });
    }

    setCameraPosition(x, y, z) {
        this.camera.position.set(x, y, z);
        this.controls.update();
    }

    setCameraTarget(x, y, z) {
        this.controls.target.set(x, y, z);
        this.controls.update();
    }

    addToScene(object) {
        this.scene.add(object);
    }

    removeFromScene(object) {
        this.scene.remove(object);
    }

    clearScene() {
        const children = [...this.scene.children];
        for (const child of children) {
            if (!(child instanceof THREE.Light) && child !== this.scene.fog) {
                this.scene.remove(child);
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        }
        this.animationCallbacks = [];
    }

    onAnimate(callback) {
        this.animationCallbacks.push(callback);
    }

    removeAnimateCallback(callback) {
        this.animationCallbacks = this.animationCallbacks.filter(cb => cb !== callback);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this._animate();
    }

    stop() {
        this.isRunning = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    _animate() {
        if (!this.isRunning) return;
        this._rafId = requestAnimationFrame(() => this._animate());

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        this.controls.update();

        for (const cb of this.animationCallbacks) {
            cb(delta, elapsed);
        }

        this.renderer.render(this.scene, this.camera);
    }

    _onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    dispose() {
        this.stop();
        window.removeEventListener('resize', this._boundResize);
        this.controls.dispose();
        this.renderer.dispose();
    }
}
