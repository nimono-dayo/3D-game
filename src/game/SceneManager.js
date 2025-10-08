import * as THREE from 'three';
import { GAME_CONFIG, VISUAL_CONFIG } from '../utils/Config.js';

export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.lights = [];
        this.isWebGLAvailable = true;
        this.setupScene();
    }

    setupScene() {
        this.scene.fog = new THREE.Fog(
            VISUAL_CONFIG.FOG_COLOR,
            GAME_CONFIG.FOG_NEAR,
            GAME_CONFIG.FOG_FAR
        );

        this.camera = new THREE.PerspectiveCamera(
            GAME_CONFIG.CAMERA_FOV,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(
            GAME_CONFIG.CAMERA_POSITION.x,
            GAME_CONFIG.CAMERA_POSITION.y,
            GAME_CONFIG.CAMERA_POSITION.z
        );
        this.camera.lookAt(0, 0, 0);

        try {
            const canvas = document.createElement('canvas');
            const contextOptions = {
                alpha: false,
                antialias: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false
            };
            
            const gl = canvas.getContext('webgl2', contextOptions) || 
                       canvas.getContext('webgl', contextOptions) || 
                       canvas.getContext('experimental-webgl', contextOptions);
            
            if (!gl) {
                throw new Error('WebGL not supported');
            }

            this.renderer = new THREE.WebGLRenderer({ 
                canvas: canvas,
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
            });
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.setClearColor(VISUAL_CONFIG.FOG_COLOR);
            
            const container = document.getElementById('game-container');
            if (container) {
                container.appendChild(this.renderer.domElement);
            } else {
                document.body.appendChild(this.renderer.domElement);
            }
        } catch (error) {
            console.error('WebGL initialization failed:', error);
            this.isWebGLAvailable = false;
            this.handleWebGLError();
            return;
        }

        this.setupLights();
        this.createGround();
        this.createLaneMarkers();
        this.createEnvironment();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }

    handleWebGLError() {
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.remove();
        }
        
        const gameOver = document.getElementById('game-over-screen');
        if (gameOver) {
            gameOver.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.id = 'webgl-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%);
            color: white;
            z-index: 10000;
            text-align: center;
            padding: 20px;
        `;
        errorDiv.innerHTML = `
            <h1 style="color: #ff0066; font-size: 48px; margin-bottom: 20px;">WebGL未対応</h1>
            <div style="background: rgba(255, 0, 102, 0.2); padding: 30px; border-radius: 15px; max-width: 600px;">
                <p style="font-size: 20px; margin: 15px 0;">お使いの環境は3Dグラフィックスに対応していません。</p>
                <p style="font-size: 18px; margin: 15px 0;">このゲームをプレイするには：</p>
                <ul style="list-style: none; padding: 0; font-size: 16px;">
                    <li style="margin: 10px 0;">✓ Chrome、Firefox、Edgeなどの最新ブラウザを使用</li>
                    <li style="margin: 10px 0;">✓ ハードウェアアクセラレーションを有効化</li>
                    <li style="margin: 10px 0;">✓ 別のデバイスで試す</li>
                </ul>
                <button onclick="location.reload()" style="
                    margin-top: 30px;
                    padding: 15px 40px;
                    font-size: 18px;
                    background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
                    color: #000;
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    font-weight: bold;
                ">再読み込み</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    setupLights() {
        if (!this.isWebGLAvailable) return;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        this.lights.push(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = GAME_CONFIG.SHADOW_MAP_SIZE;
        directionalLight.shadow.mapSize.height = GAME_CONFIG.SHADOW_MAP_SIZE;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);
        this.lights.push(directionalLight);

        const pointLight1 = new THREE.PointLight(VISUAL_CONFIG.PLAYER_COLOR, 1, 20);
        pointLight1.position.set(-5, 3, -10);
        this.scene.add(pointLight1);
        this.lights.push(pointLight1);

        const pointLight2 = new THREE.PointLight(VISUAL_CONFIG.OBSTACLE_COLOR, 1, 20);
        pointLight2.position.set(5, 3, -10);
        this.scene.add(pointLight2);
        this.lights.push(pointLight2);
    }

    createGround() {
        if (!this.isWebGLAvailable) return;

        const groundGeometry = new THREE.PlaneGeometry(20, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: VISUAL_CONFIG.GROUND_COLOR,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const gridHelper = new THREE.GridHelper(
            100,
            50,
            VISUAL_CONFIG.GRID_COLOR_1,
            VISUAL_CONFIG.GRID_COLOR_2
        );
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);
    }

    createLaneMarkers() {
        if (!this.isWebGLAvailable) return;

        const markerGeometry = new THREE.BoxGeometry(0.1, 0.1, 2);
        const markerMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });

        for (let i = 0; i < 20; i++) {
            for (let lane = -2; lane <= 2; lane++) {
                if (lane !== 0) {
                    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                    marker.position.set(
                        lane * GAME_CONFIG.LANE_WIDTH,
                        0.1,
                        -i * 5
                    );
                    marker.userData.isMarker = true;
                    this.scene.add(marker);
                }
            }
        }
    }

    createEnvironment() {
        if (!this.isWebGLAvailable) return;

        const buildingGeometry = new THREE.BoxGeometry(2, 8, 2);
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a3e,
            emissive: 0x1a1a2e,
            emissiveIntensity: 0.2
        });

        for (let i = 0; i < 10; i++) {
            const building1 = new THREE.Mesh(buildingGeometry, buildingMaterial);
            building1.position.set(-10, 4, -i * 10);
            building1.castShadow = true;
            this.scene.add(building1);

            const building2 = new THREE.Mesh(buildingGeometry, buildingMaterial);
            building2.position.set(10, 4, -i * 10);
            building2.castShadow = true;
            this.scene.add(building2);
        }
    }

    updateMarkers(speed) {
        if (!this.isWebGLAvailable) return;

        this.scene.children.forEach(child => {
            if (child.userData.isMarker) {
                child.position.z += speed;
                if (child.position.z > 10) {
                    child.position.z -= 100;
                }
            }
        });
    }

    render() {
        if (this.renderer && this.scene && this.camera && this.isWebGLAvailable) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        if (this.camera && this.renderer && this.isWebGLAvailable) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}
