export class InputHandler {
    constructor() {
        this.keys = {};
        this.touchStartX = 0;
        this.setupListeners();
    }

    setupListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - this.touchStartX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.keys['ArrowRight'] = true;
                    setTimeout(() => this.keys['ArrowRight'] = false, 100);
                } else {
                    this.keys['ArrowLeft'] = true;
                    setTimeout(() => this.keys['ArrowLeft'] = false, 100);
                }
            }
        });
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    reset() {
        this.keys = {};
    }
}
