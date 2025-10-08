import { SceneManager } from './SceneManager.js';
import { Player } from './Player.js';
import { ObstacleManager } from './ObstacleManager.js';
import { CoinManager } from './CoinManager.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { AudioManager } from '../audio/AudioManager.js';
import { InputHandler } from '../utils/InputHandler.js';
import { GAME_CONFIG, DIFFICULTY_LEVELS, GAME_MODES } from '../utils/Config.js';
import { CoinSystem } from '../systems/CoinSystem.js';

export class GameEngine {
    constructor() {
        this.sceneManager = new SceneManager();
        this.player = null;
        this.obstacleManager = null;
        this.coinManager = null;
        this.particleSystem = null;
        this.audioManager = new AudioManager();
        this.inputHandler = new InputHandler();
        this.coinSystem = new CoinSystem();
        
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.speed = GAME_CONFIG.BASE_SPEED;
        this.lastMoveTime = 0;
        this.lastParticleTime = 0;
        this.scoreMultiplier = 1;
        this.currentDifficulty = 2;
        this.difficultyConfig = DIFFICULTY_LEVELS[2];
        this.currentGameMode = 'avoid';
        this.collectedCoinsThisGame = 0;
        
        this.init();
    }

    async init() {
        if (!this.sceneManager.isWebGLAvailable || !this.sceneManager.renderer) {
            console.error('WebGL not available, game cannot start');
            return;
        }

        this.player = new Player(this.sceneManager.scene);
        this.obstacleManager = new ObstacleManager(this.sceneManager.scene);
        this.coinManager = new CoinManager(this.sceneManager.scene);
        this.particleSystem = new ParticleSystem(this.sceneManager.scene);
        
        await this.audioManager.init();
        
        this.updateHighScoreDisplay();
        this.updateDifficultyDisplay();
        this.animate();
    }

    setGameMode(mode) {
        this.currentGameMode = mode;
    }

    setDifficulty(level) {
        this.currentDifficulty = level;
        this.difficultyConfig = DIFFICULTY_LEVELS[level];
        this.obstacleManager.setDifficulty(
            this.difficultyConfig.spawnChance,
            this.difficultyConfig.maxObstacles
        );
        this.coinManager.setDifficulty(
            this.difficultyConfig.spawnChance,
            this.difficultyConfig.maxObstacles
        );
        this.updateDifficultyDisplay();
    }

    start() {
        if (!this.sceneManager.isWebGLAvailable) {
            console.error('Cannot start game: WebGL not available');
            return;
        }

        this.gameRunning = true;
        this.score = 0;
        this.collectedCoinsThisGame = 0;
        this.speed = GAME_CONFIG.BASE_SPEED * this.difficultyConfig.speedMultiplier;
        this.scoreMultiplier = 1;
        this.updateScore();
        this.updateCoinDisplay();
        this.audioManager.playBackgroundMusic();
    }

    restart() {
        this.obstacleManager.clear();
        this.coinManager.reset();
        this.particleSystem.clear();
        this.player.reset();
        this.start();
    }

    pause() {
        this.gamePaused = true;
        this.audioManager.stopBackgroundMusic();
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) {
            pauseScreen.classList.remove('hidden');
        }
    }

    resume() {
        this.gamePaused = false;
        this.audioManager.playBackgroundMusic();
        const pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) {
            pauseScreen.classList.add('hidden');
        }
    }

    togglePause() {
        if (!this.gameRunning) return;
        if (this.gamePaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    stop() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.audioManager.stopBackgroundMusic();
        
        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('highScore', this.highScore);
            this.updateHighScoreDisplay();
        }
    }

    update() {
        if (!this.gameRunning || this.gamePaused || !this.sceneManager.isWebGLAvailable) return;

        const currentTime = Date.now();
        
        if (this.inputHandler.isKeyPressed('ArrowLeft') || this.inputHandler.isKeyPressed('a') || this.inputHandler.isKeyPressed('A')) {
            if (currentTime - this.lastMoveTime > 150) {
                this.player.moveLeft();
                this.audioManager.playSound('jump');
                this.lastMoveTime = currentTime;
            }
        }
        
        if (this.inputHandler.isKeyPressed('ArrowRight') || this.inputHandler.isKeyPressed('d') || this.inputHandler.isKeyPressed('D')) {
            if (currentTime - this.lastMoveTime > 150) {
                this.player.moveRight();
                this.audioManager.playSound('jump');
                this.lastMoveTime = currentTime;
            }
        }

        this.player.update();
        this.sceneManager.updateMarkers(this.speed);
        this.particleSystem.update();

        if (currentTime - this.lastParticleTime > 50) {
            const playerPos = this.player.getPosition();
            const trailPos = playerPos.clone();
            trailPos.y -= 0.5;
            this.particleSystem.createTrail(trailPos);
            this.lastParticleTime = currentTime;
        }

        if (this.currentGameMode === 'avoid') {
            this.obstacleManager.update(this.speed);
            
            const hitObstacle = this.obstacleManager.checkCollision(this.player.getPosition());
            if (hitObstacle) {
                this.particleSystem.createExplosion(hitObstacle.position, 0xff0066, 30);
                this.audioManager.playSound('hit');
                this.gameOver();
                return;
            }

            this.score += this.speed * 2 * this.scoreMultiplier;
        } else if (this.currentGameMode === 'collect') {
            const missedCoin = this.coinManager.update(this.speed);
            
            if (missedCoin) {
                const playerPos = this.player.getPosition();
                this.particleSystem.createExplosion(playerPos, 0xff0066, 30);
                this.audioManager.playSound('hit');
                this.gameOver();
                return;
            }
            
            const hitCoin = this.coinManager.checkCollision(this.player.mesh);
            if (hitCoin) {
                const coinPos = this.player.getPosition();
                this.particleSystem.createExplosion(coinPos, 0xffd700, 20);
                this.audioManager.playSound('score');
                this.score += 100 * this.scoreMultiplier;
                this.collectedCoinsThisGame++;
                this.coinSystem.addCoins(10);
                this.updateCoinDisplay();
            } else {
                this.score += this.speed * 2 * this.scoreMultiplier;
            }
        }

        this.speed = GAME_CONFIG.BASE_SPEED * this.difficultyConfig.speedMultiplier + (this.score * GAME_CONFIG.SPEED_INCREMENT);
        this.scoreMultiplier = 1 + Math.floor(this.score / 1000) * 0.1;
        
        this.updateScore();

        if (Math.floor(this.score) % 100 === 0 && Math.floor(this.score) > 0) {
            this.audioManager.playSound('score');
        }
    }

    gameOver() {
        this.stop();
        const finalScoreElement = document.getElementById('final-score');
        const gameOverScreen = document.getElementById('game-over-screen');
        const completedDifficultyElement = document.getElementById('completed-difficulty');
        const finalCoinsElement = document.getElementById('final-coins');
        
        if (finalScoreElement) {
            finalScoreElement.textContent = Math.floor(this.score);
        }
        if (completedDifficultyElement) {
            completedDifficultyElement.textContent = this.difficultyConfig.nameJa;
        }
        if (finalCoinsElement) {
            finalCoinsElement.textContent = this.collectedCoinsThisGame;
        }
        const finalCoinsCurrencyElement = document.getElementById('final-coins-currency');
        if (finalCoinsCurrencyElement) {
            finalCoinsCurrencyElement.textContent = this.collectedCoinsThisGame * 10;
        }
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
        }
        
        if (typeof window.showGameMenuElements === 'function') {
            window.showGameMenuElements();
        }
    }

    updateScore() {
        const scoreElement = document.getElementById('score');
        const speedElement = document.getElementById('speed');
        
        if (scoreElement) {
            scoreElement.textContent = Math.floor(this.score);
        }
        if (speedElement) {
            speedElement.textContent = (this.speed / (GAME_CONFIG.BASE_SPEED * this.difficultyConfig.speedMultiplier)).toFixed(1) + 'x';
        }
    }

    updateHighScoreDisplay() {
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
    }

    updateDifficultyDisplay() {
        const difficultyElement = document.getElementById('difficulty');
        if (difficultyElement) {
            difficultyElement.textContent = this.difficultyConfig.nameJa;
        }
    }

    updateCoinDisplay() {
        const coinElement = document.getElementById('total-coins');
        if (coinElement) {
            coinElement.textContent = this.coinSystem.getCoins();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.sceneManager.render();
    }

    dispose() {
        this.sceneManager.dispose();
        this.player?.dispose();
        this.obstacleManager?.clear();
        this.coinManager?.destroy();
        this.particleSystem?.clear();
        this.audioManager.stopBackgroundMusic();
    }
}
