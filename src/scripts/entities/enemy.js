import { GAME_CONFIG } from '../utils/constants.js';
import { Projectile } from './projectile.js';
import { Explosion } from './explosion.js';
import { PowerUp } from './powerup.js';

export class Enemy {
    constructor(game, type = 'red') {
        this.game = game;
        this.frames = game.assetManager.getSprite(`enemy${type}`);
        if (!this.frames || !Array.isArray(this.frames) || this.frames.length === 0) {
            console.error(`Enemy sprite frames missing or empty for type: ${type}. Using placeholder.`);
            // Try to use any available sprite as fallback
            const allSprites = Array.from(game.assetManager.assets.sprites.values());
            this.frames = allSprites.length > 0 ? allSprites[0] : [document.createElement('canvas')];
        }

        // Initialize with reset
        this.reset(type);
    }

    reset(type) {
        const canvas = document.getElementById('gameCanvas');
        
        this.x = Math.random() * (canvas.width - GAME_CONFIG.ENEMY.WIDTH);
        this.y = -GAME_CONFIG.ENEMY.HEIGHT;
        this.width = GAME_CONFIG.ENEMY.SIZE;
        this.height = GAME_CONFIG.ENEMY.SIZE;
        this.speed = GAME_CONFIG.ENEMY.MIN_SPEED + 
                    Math.random() * (GAME_CONFIG.ENEMY.MAX_SPEED - GAME_CONFIG.ENEMY.MIN_SPEED);
        this.type = type;
        this.health = GAME_CONFIG.ENEMY.HEALTH;

        // Animation properties
        this.currentFrame = 0;
        this.frameCount = this.frames.length;
        this.frameDelay = 10;
        this.frameTimer = 0;
    }

    update(gameState) {
        // Move downward
        this.y += this.speed;

        // Clamp position to canvas bounds
        const canvas = document.getElementById('gameCanvas');
        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
        this.y = Math.max(-this.height, Math.min(this.y, canvas.height));

        // Ensure frames are valid
        // if (!this.frames || !Array.isArray(this.frames) || this.frames.length === 0) return;

        // Update animation
        // this.frameTimer++;
        // if (this.frameTimer >= this.frameDelay) {
        //     this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        //     this.frameTimer = 0;
        // }

        // Random shooting
        if (Math.random() < GAME_CONFIG.ENEMY.SHOOT_CHANCE) {
            this.shoot(gameState);
        }
    }

    shoot(gameState) {
        // Get projectile from pool or create new one
        const projectile = this.game.objectPools?.getFromPool('projectiles') ||
                         new Projectile(this.x, this.y + this.height / 2, 'enemy', this.game);
        
        projectile.reset(this.x, this.y + this.height / 2, 'enemy');
        
        gameState.projectiles.push(projectile);
    }

    takeDamage(amount, gameState) {
        this.health -= amount;
        
        // Show damage number
        this.showDamageNumber(amount);

        // Check if destroyed
        if (this.health <= 0) {
            // Update combo
            const now = Date.now();
            if (now - gameState.lastComboTime <= GAME_CONFIG.COMBO.TIMEOUT) {
                gameState.comboCount++;
            } else {
                gameState.comboCount = 1;
            }
            gameState.lastComboTime = now;

            // Calculate score with combo multiplier
            const comboMultiplier = Math.min(gameState.comboCount, GAME_CONFIG.COMBO.MAX_MULTIPLIER);
            const scoreGain = GAME_CONFIG.COMBO.BASE_SCORE * comboMultiplier;
            gameState.score += scoreGain;

            // Energy gain with combo bonus
            const energyGain = GAME_CONFIG.COMBO.ENERGY_GAIN * 
                             (1 + (comboMultiplier - 1) * 0.2); // 20% bonus per combo level
            gameState.energy = Math.min(200, gameState.energy + energyGain);

            // Create explosion effect
            this.createExplosion(gameState);

            // Chance to drop power-up
            this.tryDropPowerup(gameState);

            return true;
        }
        return false;
    }

    showDamageNumber(amount) {
        const damageText = document.createElement('div');
        damageText.className = 'damage-number';
        damageText.textContent = `-${amount}`;
        damageText.style.left = `${this.x}px`;
        damageText.style.top = `${this.y}px`;
        document.getElementById('gameContainer').appendChild(damageText);
        
        setTimeout(() => damageText.remove(), 800);
    }

    createExplosion(gameState) {
        const explosion = this.game.objectPools?.getFromPool('explosions') ||
                        new Explosion(this.x, this.y, this.game.assetManager);
        
        explosion.reset(this.x, this.y);
        
        gameState.explosions.push(explosion);

        // Add screen shake
        this.addScreenShake();

        // Play explosion sound
        const explosionSound = this.game.assetManager.getAudio('explosion');
        if (explosionSound) {
            explosionSound.volume = 0.5;
            explosionSound.currentTime = 0;
            explosionSound.play();
        }
    }

    addScreenShake() {
        const gameContainer = document.getElementById('gameContainer');
        const intensity = Math.min(this.health / GAME_CONFIG.ENEMY.HEALTH * 8, 8);
        
        gameContainer.style.transform = 
            `translate(${Math.random() * intensity - intensity/2}px, 
                      ${Math.random() * intensity - intensity/2}px)`;
        
        setTimeout(() => {
            gameContainer.style.transform = 'none';
        }, 50);
    }

    tryDropPowerup(gameState) {
        if (Math.random() < GAME_CONFIG.POWERUP.DROP_CHANCE) {
            const powerUpTypes = ['health', 'shield', 'ammo'];
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            const powerup = new PowerUp(this.x, this.y, randomType, this.game.assetManager);
            gameState.powerups.push(powerup);
        }
    }
}

export default Enemy;