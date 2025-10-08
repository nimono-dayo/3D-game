import * as THREE from 'three';
import { GAME_CONFIG, VISUAL_CONFIG } from '../utils/Config.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.glow = null;
        this.targetX = 0;
        this.currentLane = 2;
        this.create();
    }

    create() {
        const playerGeometry = new THREE.ConeGeometry(0.5, 1.5, 4);
        const playerMaterial = new THREE.MeshStandardMaterial({
            color: VISUAL_CONFIG.PLAYER_COLOR,
            emissive: VISUAL_CONFIG.PLAYER_COLOR,
            emissiveIntensity: 0.3,
            metalness: 0.5,
            roughness: 0.3
        });
        
        this.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.mesh.position.set(0, 0.75, GAME_CONFIG.PLAYER_START_Z);
        this.mesh.rotation.x = Math.PI;
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: VISUAL_CONFIG.PLAYER_COLOR,
            transparent: true,
            opacity: 0.3
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow.position.copy(this.mesh.position);
        this.scene.add(this.glow);

        this.targetX = 0;
    }

    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.targetX = (this.currentLane - 2) * GAME_CONFIG.LANE_WIDTH;
        }
    }

    moveRight() {
        if (this.currentLane < 4) {
            this.currentLane++;
            this.targetX = (this.currentLane - 2) * GAME_CONFIG.LANE_WIDTH;
        }
    }

    update() {
        const smoothing = 0.15;
        this.mesh.position.x += (this.targetX - this.mesh.position.x) * smoothing;
        
        this.mesh.rotation.z = Math.sin(Date.now() * 0.005) * 0.1;
        
        if (this.glow) {
            this.glow.position.copy(this.mesh.position);
            this.glow.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.1);
        }
    }

    getPosition() {
        return this.mesh.position;
    }

    updateSkin(color, shape) {
        const oldMesh = this.mesh;
        const oldGlow = this.glow;
        
        let geometry;
        switch (shape) {
            case 'cone':
                geometry = new THREE.ConeGeometry(0.5, 1.5, 4);
                break;
            case 'box':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(0.5, 0.25, 8, 12);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(0.6);
                break;
            default:
                geometry = new THREE.ConeGeometry(0.5, 1.5, 4);
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            metalness: 0.5,
            roughness: 0.3
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(oldMesh.position);
        if (shape === 'cone') {
            this.mesh.rotation.x = Math.PI;
        }
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        this.glow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), glowMaterial);
        this.glow.position.copy(this.mesh.position);
        this.scene.add(this.glow);
        
        if (oldMesh) {
            this.scene.remove(oldMesh);
            oldMesh.geometry.dispose();
            oldMesh.material.dispose();
        }
        if (oldGlow) {
            this.scene.remove(oldGlow);
            oldGlow.geometry.dispose();
            oldGlow.material.dispose();
        }
    }

    reset() {
        this.mesh.position.set(0, 0.75, GAME_CONFIG.PLAYER_START_Z);
        this.currentLane = 2;
        this.targetX = 0;
    }

    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.glow) {
            this.scene.remove(this.glow);
            this.glow.geometry.dispose();
            this.glow.material.dispose();
        }
    }
}
