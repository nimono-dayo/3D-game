import * as THREE from 'three';
import { GAME_CONFIG, VISUAL_CONFIG } from '../utils/Config.js';

export class CoinManager {
    constructor(scene) {
        this.scene = scene;
        this.coins = [];
        this.spawnChance = GAME_CONFIG.OBSTACLE_SPAWN_CHANCE;
        this.maxCoins = GAME_CONFIG.MAX_OBSTACLES;
        this.lastCoinZ = -30;
        this.lastOccupiedLane = null;
    }

    setDifficulty(spawnChance, maxCoins) {
        this.spawnChance = spawnChance;
        this.maxCoins = maxCoins;
    }

    getLanePositions() {
        const lanes = [];
        const startX = -((GAME_CONFIG.NUM_LANES - 1) * GAME_CONFIG.LANE_WIDTH) / 2;
        for (let i = 0; i < GAME_CONFIG.NUM_LANES; i++) {
            lanes.push(startX + (i * GAME_CONFIG.LANE_WIDTH));
        }
        return lanes;
    }

    canSpawnCoin() {
        if (this.coins.length >= this.maxCoins) {
            return false;
        }
        
        const nearestCoin = this.coins.reduce((nearest, coin) => {
            return (!nearest || coin.position.z > nearest.position.z) ? coin : nearest;
        }, null);

        if (nearestCoin && nearestCoin.position.z > (this.lastCoinZ - GAME_CONFIG.MIN_OBSTACLE_DISTANCE)) {
            return false;
        }

        return true;
    }

    createCoin() {
        if (!this.canSpawnCoin()) {
            return;
        }

        const geometry = new THREE.TorusGeometry(0.5, 0.15, 16, 32);
        const material = new THREE.MeshStandardMaterial({
            color: VISUAL_CONFIG.COIN_COLOR,
            emissive: VISUAL_CONFIG.COIN_COLOR,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2
        });

        const coin = new THREE.Mesh(geometry, material);

        const lanes = this.getLanePositions();
        let availableLanes = lanes;
        
        if (this.lastOccupiedLane !== null) {
            availableLanes = lanes.filter((_, index) => index !== this.lastOccupiedLane);
        }
        
        const selectedLaneIndex = availableLanes.length > 0 
            ? lanes.indexOf(availableLanes[Math.floor(Math.random() * availableLanes.length)])
            : Math.floor(Math.random() * lanes.length);
        
        const selectedLane = lanes[selectedLaneIndex];

        coin.position.set(selectedLane, 1, -30);
        coin.rotation.x = Math.PI / 2;
        coin.castShadow = true;
        coin.userData.isCoin = true;
        coin.userData.rotationSpeed = 0.05;

        this.scene.add(coin);
        this.coins.push(coin);
        this.lastCoinZ = -30;
        this.lastOccupiedLane = selectedLaneIndex;
    }

    update(speed) {
        if (Math.random() < this.spawnChance) {
            this.createCoin();
        }

        let missedCoin = false;

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.position.z += speed;
            
            coin.rotation.z += coin.userData.rotationSpeed;

            if (coin.position.z > 10) {
                missedCoin = true;
                this.scene.remove(coin);
                coin.geometry.dispose();
                coin.material.dispose();
                this.coins.splice(i, 1);
            }
        }

        return missedCoin;
    }

    checkCollision(playerMesh) {
        const playerBox = new THREE.Box3().setFromObject(playerMesh);
        
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const coinBox = new THREE.Box3().setFromObject(coin);
            
            if (playerBox.intersectsBox(coinBox)) {
                this.scene.remove(coin);
                coin.geometry.dispose();
                coin.material.dispose();
                this.coins.splice(i, 1);
                return true;
            }
        }
        
        return false;
    }

    reset() {
        for (const coin of this.coins) {
            this.scene.remove(coin);
            coin.geometry.dispose();
            coin.material.dispose();
        }
        this.coins = [];
        this.lastCoinZ = -30;
        this.lastOccupiedLane = null;
    }

    destroy() {
        this.reset();
    }
}
