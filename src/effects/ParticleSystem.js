import * as THREE from 'three';
import { VISUAL_CONFIG } from '../utils/Config.js';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createExplosion(position, color = 0xff0066, count = 20) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        
        for (let i = 0; i < count; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            const angle = (Math.PI * 2 * i) / count;
            const speed = 0.1 + Math.random() * 0.1;
            particle.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * 0.2,
                Math.sin(angle) * speed
            );
            particle.userData.lifetime = 1.0;
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createTrail(position) {
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const color = VISUAL_CONFIG.PARTICLE_COLORS[Math.floor(Math.random() * VISUAL_CONFIG.PARTICLE_COLORS.length)];
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.userData.lifetime = 0.5;
        particle.userData.velocity = new THREE.Vector3(0, 0, 0.05);
        
        this.scene.add(particle);
        this.particles.push(particle);
    }

    update(deltaTime = 0.016) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (particle.userData.velocity) {
                particle.position.add(particle.userData.velocity);
                particle.userData.velocity.y -= 0.005;
            }
            
            particle.userData.lifetime -= deltaTime;
            particle.material.opacity = Math.max(0, particle.userData.lifetime);
            
            if (particle.userData.lifetime <= 0) {
                this.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    clear() {
        this.particles.forEach(particle => {
            this.scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        });
        this.particles = [];
    }
}
