import * as THREE from 'three';
import { GAME_CONFIG, VISUAL_CONFIG } from '../utils/Config.js';

export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.obstacleTypes = ['box', 'pyramid', 'cylinder', 'torus', 'octahedron'];
        this.spawnChance = GAME_CONFIG.OBSTACLE_SPAWN_CHANCE;
        this.maxObstacles = GAME_CONFIG.MAX_OBSTACLES;
        this.lastObstacleZ = -30;
        this.lastOccupiedLanes = new Set();
    }

    setDifficulty(spawnChance, maxObstacles) {
        this.spawnChance = spawnChance;
        this.maxObstacles = maxObstacles;
    }

    getLanePositions() {
        return [
            -2 * GAME_CONFIG.LANE_WIDTH,
            -1 * GAME_CONFIG.LANE_WIDTH,
            0,
            1 * GAME_CONFIG.LANE_WIDTH,
            2 * GAME_CONFIG.LANE_WIDTH
        ];
    }

    canSpawnObstacle() {
        if (this.obstacles.length >= this.maxObstacles) {
            return false;
        }
        
        const nearestObstacle = this.obstacles.reduce((nearest, obs) => {
            return (!nearest || obs.position.z > nearest.position.z) ? obs : nearest;
        }, null);

        if (nearestObstacle && nearestObstacle.position.z > (this.lastObstacleZ - GAME_CONFIG.MIN_OBSTACLE_DISTANCE)) {
            return false;
        }

        return true;
    }

    createObstacle() {
        if (!this.canSpawnObstacle()) {
            return;
        }

        const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        let geometry;

        switch (type) {
            case 'box':
                geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                break;
            case 'pyramid':
                geometry = new THREE.ConeGeometry(0.8, 2, 4);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 8);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(0.6, 0.3, 16, 32);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(0.8);
                break;
        }

        const material = new THREE.MeshStandardMaterial({
            color: VISUAL_CONFIG.OBSTACLE_COLOR,
            emissive: VISUAL_CONFIG.OBSTACLE_COLOR,
            emissiveIntensity: 0.4,
            metalness: 0.6,
            roughness: 0.4
        });

        const obstacle = new THREE.Mesh(geometry, material);

        const lanes = this.getLanePositions();
        const availableLanes = lanes.filter((_, index) => !this.lastOccupiedLanes.has(index));
        
        let selectedLaneIndex;
        let selectedLane;
        
        if (availableLanes.length > 0) {
            selectedLaneIndex = lanes.indexOf(availableLanes[Math.floor(Math.random() * availableLanes.length)]);
            selectedLane = lanes[selectedLaneIndex];
        } else {
            selectedLaneIndex = Math.floor(Math.random() * lanes.length);
            selectedLane = lanes[selectedLaneIndex];
            this.lastOccupiedLanes.clear();
        }

        const numObstaclesInRow = Math.min(Math.floor(Math.random() * 4) + 1, 4);
        const occupiedInThisRow = new Set([selectedLaneIndex]);
        
        obstacle.position.set(selectedLane, 1, -30);
        obstacle.castShadow = true;
        obstacle.userData.isObstacle = true;
        obstacle.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.1,
            z: (Math.random() - 0.5) * 0.05
        };

        this.scene.add(obstacle);
        this.obstacles.push(obstacle);
        this.lastObstacleZ = -30;
        
        for (let i = 1; i < numObstaclesInRow; i++) {
            if (this.obstacles.length >= this.maxObstacles) break;
            
            const remainingLanes = lanes
                .map((lane, idx) => idx)
                .filter(idx => !occupiedInThisRow.has(idx));
            
            if (remainingLanes.length === 0) break;
            
            const newLaneIndex = remainingLanes[Math.floor(Math.random() * remainingLanes.length)];
            const newLane = lanes[newLaneIndex];
            occupiedInThisRow.add(newLaneIndex);
            
            const extraObstacle = new THREE.Mesh(geometry.clone(), material.clone());
            extraObstacle.position.set(newLane, 1, -30);
            extraObstacle.castShadow = true;
            extraObstacle.userData.isObstacle = true;
            extraObstacle.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.05,
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.05
            };
            
            this.scene.add(extraObstacle);
            this.obstacles.push(extraObstacle);
        }
        
        this.lastOccupiedLanes = occupiedInThisRow;
    }

    update(speed) {
        if (Math.random() < this.spawnChance) {
            this.createObstacle();
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.position.z += speed;
            
            obstacle.rotation.x += obstacle.userData.rotationSpeed.x;
            obstacle.rotation.y += obstacle.userData.rotationSpeed.y;
            obstacle.rotation.z += obstacle.userData.rotationSpeed.z;

            if (obstacle.position.z > 10) {
                this.scene.remove(obstacle);
                obstacle.geometry.dispose();
                obstacle.material.dispose();
                this.obstacles.splice(i, 1);
            }
        }
    }

    checkCollision(playerPosition) {
        for (let obstacle of this.obstacles) {
            const dx = playerPosition.x - obstacle.position.x;
            const dz = playerPosition.z - obstacle.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < 1.2) {
                return obstacle;
            }
        }
        return null;
    }

    clear() {
        this.obstacles.forEach(obstacle => {
            this.scene.remove(obstacle);
            obstacle.geometry.dispose();
            obstacle.material.dispose();
        });
        this.obstacles = [];
        this.lastObstacleZ = -30;
        this.lastOccupiedLanes.clear();
    }

    getObstacles() {
        return this.obstacles;
    }
}
