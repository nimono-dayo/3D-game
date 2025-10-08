import { AUDIO_CONFIG } from '../utils/Config.js';

export class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = {};
        this.musicGain = null;
        this.sfxGain = null;
        this.initialized = false;
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = AUDIO_CONFIG.MUSIC_VOLUME;
            this.musicGain.connect(this.context.destination);
            
            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = AUDIO_CONFIG.SFX_VOLUME;
            this.sfxGain.connect(this.context.destination);
            
            this.generateSounds();
            this.initialized = true;
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    generateSounds() {
        this.sounds.jump = this.createTone(400, 0.1, 'sine');
        this.sounds.hit = this.createTone(100, 0.2, 'sawtooth');
        this.sounds.score = this.createTone(600, 0.15, 'square');
    }

    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.context) return;
            
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        };
    }

    playSound(soundName) {
        if (this.sounds[soundName] && this.initialized) {
            this.sounds[soundName]();
        }
    }

    playBackgroundMusic() {
        if (!this.context || !this.initialized) return;
        
        const playBeat = () => {
            if (!this.context) return;
            
            const bass = this.context.createOscillator();
            const bassGain = this.context.createGain();
            
            bass.type = 'sine';
            bass.frequency.value = 80;
            
            bassGain.gain.setValueAtTime(0.1, this.context.currentTime);
            bassGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
            
            bass.connect(bassGain);
            bassGain.connect(this.musicGain);
            
            bass.start(this.context.currentTime);
            bass.stop(this.context.currentTime + 0.5);
        };
        
        this.musicInterval = setInterval(playBeat, 500);
    }

    stopBackgroundMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
        }
    }

    setMasterVolume(volume) {
        if (this.musicGain && this.sfxGain) {
            this.musicGain.gain.value = volume * AUDIO_CONFIG.MUSIC_VOLUME;
            this.sfxGain.gain.value = volume * AUDIO_CONFIG.SFX_VOLUME;
        }
    }
}
