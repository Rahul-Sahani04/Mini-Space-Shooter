import { GAME_CONFIG } from '../utils/constants.js';

export class Explosion {
    constructor(x, y, assetManager, fromPool = false) {
        this.frames = assetManager.getSprite('explosions');
        if (!this.frames || !Array.isArray(this.frames) || this.frames.length === 0) {
            console.error('Explosion sprite frames missing or empty. Using placeholder.');
            // Use a single blank canvas as a fallback
            this.frames = [document.createElement('canvas')];
        }

        this.fromPool = fromPool;
        this.reset(x, y);
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 128;
        this.currentFrame = 0;
        this.frameDelay = 3;
        this.frameTimer = 0;
        this.isComplete = false;

        // Create initial screen shake
        this.addScreenShake();

        // Create light flash effect
        this.createLightFlash();
    }

    update() {
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.currentFrame++;
            if (this.currentFrame >= this.frames.length) {
                this.isComplete = true;
            }
            this.frameTimer = 0;

            // Add smaller screen shakes during animation
            if (this.currentFrame < this.frames.length / 2) {
                this.addScreenShake(0.5);
            }
        }
    }

    draw(ctx) {
        if (!this.isComplete && this.frames[this.currentFrame]) {
            // Draw glow effect
            ctx.save();
            ctx.globalAlpha = 0.3 * (1 - (this.currentFrame / this.frames.length));
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.width / 2
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw explosion frame
            ctx.drawImage(
                this.frames[this.currentFrame],
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }
    }

    addScreenShake(intensity = 1) {
        const gameContainer = document.getElementById('gameContainer');
        const shakeAmount = 8 * intensity;
        
        gameContainer.style.transform = 
            `translate(${Math.random() * shakeAmount - shakeAmount/2}px, 
                      ${Math.random() * shakeAmount - shakeAmount/2}px)`;
        
        setTimeout(() => {
            gameContainer.style.transform = 'none';
        }, 50);
    }

    createLightFlash() {
        const flash = document.createElement('div');
        flash.className = 'explosion-flash';
        document.getElementById('gameContainer').appendChild(flash);
        
        // Remove after animation
        setTimeout(() => flash.remove(), 200);
    }

    cleanup() {
        if (this.fromPool) {
            window.game.objectPools.returnToPool('explosions', this);
        }
    }
}

// Add explosion effect styles
const style = document.createElement('style');
style.textContent = `
    .explosion-flash {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 200, 50, 0.2);
        pointer-events: none;
        animation: flash-fade 0.2s ease-out forwards;
    }

    @keyframes flash-fade {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
`;

document.head.appendChild(style);

export default Explosion;