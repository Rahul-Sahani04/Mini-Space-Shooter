import { GAME_CONFIG, COLORS } from '../utils/constants.js';

export class PowerUp {
    constructor(x, y, type, assetManager) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONFIG.POWERUP.WIDTH;
        this.height = GAME_CONFIG.POWERUP.HEIGHT;
        this.type = type;
        this.speed = GAME_CONFIG.POWERUP.SPEED;
        
        // Load sprite
        this.sprite = assetManager.getImage(`powerup_${type}`);
        if (!this.sprite) {
            console.error(`PowerUp assets missing for type: ${type}. Using placeholder.`);
            this.sprite = document.createElement('canvas');
        }

        // Create and add indicator element
        this.createIndicator();

        // Add pulsing glow effect
        this.glowIntensity = 0;
        this.glowDirection = 1;
        this.assetManager = assetManager;
    }

    createIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = `powerup-indicator ${this.type}`;
        document.getElementById('gameContainer').appendChild(this.indicator);
    }

    update() {
        this.y += this.speed;
        
        // Update indicator position
        if (this.indicator) {
            this.indicator.style.left = `${this.x - 20}px`;
            this.indicator.style.top = `${this.y - 20}px`;
        }

        // Update glow effect
        this.glowIntensity += 0.05 * this.glowDirection;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
    }

    draw(ctx) {
        // Draw glow effect
        ctx.save();
        ctx.globalAlpha = 0.2 + (this.glowIntensity * 0.3);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = this.getGlowColor();
        ctx.fill();
        ctx.restore();

        // Draw powerup sprite
        ctx.drawImage(
            this.sprite,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
    }

    getGlowColor() {
        switch(this.type) {
            case 'health': return COLORS.HEALTH;
            case 'shield': return COLORS.SHIELD;
            case 'ammo': return COLORS.AMMO;
            default: return '#fff';
        }
    }

    applyEffect(gameState) {
        switch(this.type) {
            case 'health':
                gameState.health = Math.min(100, gameState.health + GAME_CONFIG.POWERUP.HEALTH_RESTORE);
                break;
            case 'shield':
                gameState.health = Math.min(150, gameState.health + GAME_CONFIG.POWERUP.SHIELD_RESTORE);
                break;
            case 'ammo':
                gameState.energy = Math.min(200, gameState.energy + GAME_CONFIG.POWERUP.ENERGY_RESTORE);
                break;
        }

        // Update UI
        document.getElementById('healthBar').style.width = `${gameState.health}%`;
        document.getElementById('energyBar').style.width = `${gameState.energy}%`;

        // Play sound effect
        const powerupSound = this.assetManager.getAudio('powerup');
        if (powerupSound) {
            powerupSound.volume = 0.5;
            powerupSound.currentTime = 0;
            powerupSound.play();
        }
        
        // Show collection effect
        this.showCollectionEffect();

        // Remove indicator
        if (this.indicator) {
            this.indicator.remove();
            this.indicator = null;
        }
    }

    showCollectionEffect() {
        // Create floating text effect
        const effect = document.createElement('div');
        effect.className = 'powerup-collection';
        effect.textContent = this.getCollectionText();
        effect.style.left = `${this.x}px`;
        effect.style.top = `${this.y}px`;
        effect.style.color = this.getGlowColor();
        document.getElementById('gameContainer').appendChild(effect);

        // Create particle burst effect
        this.createParticleBurst();

        // Remove effect after animation
        setTimeout(() => effect.remove(), 1000);
    }

    getCollectionText() {
        switch(this.type) {
            case 'health': return `+${GAME_CONFIG.POWERUP.HEALTH_RESTORE} HP`;
            case 'shield': return `+${GAME_CONFIG.POWERUP.SHIELD_RESTORE} SHIELD`;
            case 'ammo': return `+${GAME_CONFIG.POWERUP.ENERGY_RESTORE} ENERGY`;
            default: return '';
        }
    }

    createParticleBurst() {
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'powerup-particle';
            particle.style.backgroundColor = this.getGlowColor();
            
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            particle.style.setProperty('--angle', angle + 'rad');
            particle.style.setProperty('--speed', speed);
            
            document.getElementById('gameContainer').appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    }

    cleanup() {
        if (this.indicator) {
            this.indicator.remove();
            this.indicator = null;
        }
    }
}

// Add powerup effect styles
const style = document.createElement('style');
style.textContent = `
    .powerup-collection {
        position: absolute;
        transform: translate(-50%, -50%);
        font-weight: bold;
        font-size: 16px;
        pointer-events: none;
        animation: float-up 1s ease-out forwards;
        text-shadow: 0 0 5px currentColor;
    }

    .powerup-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        pointer-events: none;
        animation: particle-burst 1s ease-out forwards;
    }

    @keyframes float-up {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -100%) scale(1.5);
            opacity: 0;
        }
    }

    @keyframes particle-burst {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: 
                translate(
                    calc(-50% + cos(var(--angle)) * var(--speed) * 50px),
                    calc(-50% + sin(var(--angle)) * var(--speed) * 50px)
                )
                scale(0);
            opacity: 0;
        }
    }
`;

document.head.appendChild(style);

export default PowerUp;