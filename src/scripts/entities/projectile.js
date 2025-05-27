import { GAME_CONFIG } from '../utils/constants.js';

export class Projectile {
    constructor(x, y, type, game, fromPool = false) {
        this.game = game;
        this.fromPool = fromPool;
        this.reset(x, y, type);
    }

    reset(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONFIG.PROJECTILE.WIDTH;
        this.height = GAME_CONFIG.PROJECTILE.HEIGHT;
        this.speed = type === 'player' ? 
            GAME_CONFIG.PROJECTILE.PLAYER_SPEED : 
            GAME_CONFIG.PROJECTILE.ENEMY_SPEED;
        this.type = type;
        this.active = true;
        
        // Get cached image based on type
        // Get cached image based on type
        this.image = this.game.assetManager.getImage(
            type === 'player' ? 'projectile_laser' : 'projectile_plasma'
        );
    }

    update() {
        this.y += this.speed;
        
        // Check if projectile is off screen
        const canvas = document.getElementById('gameCanvas');
        if (this.y < -this.height || this.y > canvas.height + this.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || !this.image) return;

        ctx.drawImage(
            this.image,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );

        // Add glow effect based on projectile type
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = this.type === 'player' ? '#0f0' : '#f00';
        ctx.fill();
        ctx.restore();
    }

    deactivate() {
        this.active = false;
        if (this.fromPool) {
            this.game.objectPools.returnToPool('projectiles', this);
        }
    }

    onHit(target, gameState) {
        // Create hit effect
        this.createHitEffect();
        
        // Apply damage
        if (this.type === 'player') {
            const destroyed = target.takeDamage(GAME_CONFIG.PROJECTILE.DAMAGE, gameState);
            if (destroyed) {
                // Target was destroyed, handle any additional effects
                this.onTargetDestroyed(target, gameState);
            }
        } else {
            // Enemy projectile hitting player
            target.takeDamage(GAME_CONFIG.PROJECTILE.DAMAGE, gameState);
        }

        // Deactivate projectile
        this.deactivate();
    }

    createHitEffect() {
        // Create a small particle effect at hit location
        const effect = document.createElement('div');
        effect.className = `hit-effect ${this.type}`;
        effect.style.left = `${this.x}px`;
        effect.style.top = `${this.y}px`;
        document.getElementById('gameContainer').appendChild(effect);
        
        // Remove after animation
        setTimeout(() => effect.remove(), 300);
    }

    onTargetDestroyed(target, gameState) {
        // Additional effects or logic when a target is destroyed
        // This could be overridden in derived classes if needed
    }
}

// Add projectile hit effect styles
const style = document.createElement('style');
style.textContent = `
    .hit-effect {
        position: absolute;
        width: 20px;
        height: 20px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        border-radius: 50%;
        animation: hit-flash 0.3s ease-out forwards;
    }

    .hit-effect.player {
        background: radial-gradient(circle, rgba(0,255,0,0.8) 0%, rgba(0,255,0,0) 70%);
    }

    .hit-effect.enemy {
        background: radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(255,0,0,0) 70%);
    }

    @keyframes hit-flash {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
        }
    }
`;

document.head.appendChild(style);

export default Projectile;