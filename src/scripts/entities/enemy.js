import { GAME_CONFIG } from '../utils/constants.js';
import { Projectile } from './projectile.js';
import { Explosion } from './explosion.js';
import { PowerUp } from './powerup.js';
import { showDamageNumber } from '../utils/helpers.js';
import particleSystem from '../utils/particles.js';

export class Enemy {
    constructor(game, type = 'red', difficultyMultiplier = 1) {
        this.game = game;
        this.canvas = document.getElementById('gameCanvas');
        this.frames = game.assetManager.getSprite(`enemy${type}`);
        if (!this.frames || !Array.isArray(this.frames) || this.frames.length === 0) {
            console.error(`Enemy sprite frames missing or empty for type: ${type}. Using placeholder.`);
            // Try to use any available sprite as fallback
            const allSprites = Array.from(game.assetManager.assets.sprites.values());
            this.frames = allSprites.length > 0 ? allSprites[0] : [document.createElement('canvas')];
        }

        // Initialize with reset
        this.reset(type, difficultyMultiplier);
    }

    reset(type, difficultyMultiplier = 1) {
        this.x = Math.random() * (this.canvas.width - GAME_CONFIG.ENEMY.WIDTH);
        this.y = -GAME_CONFIG.ENEMY.HEIGHT;
        this.type = type;
        this.dead = false;

        const speedMult = Math.min(2.0, difficultyMultiplier);
        const healthMult = Math.min(3.5, difficultyMultiplier);

        if (type === 'charger') {
            this.width = GAME_CONFIG.CHARGER.SIZE;
            this.height = GAME_CONFIG.CHARGER.SIZE;
            this.speed = GAME_CONFIG.CHARGER.SPEED * speedMult;
            this.health = GAME_CONFIG.CHARGER.HEALTH * healthMult;
        } else if (type === 'green') {
            // Weavers: sine-wave movement, fast, low HP, no shooting
            this.width = GAME_CONFIG.WEAVER.SIZE;
            this.height = GAME_CONFIG.WEAVER.SIZE;
            this.speed = GAME_CONFIG.WEAVER.SPEED * speedMult;
            this.health = GAME_CONFIG.WEAVER.HEALTH * healthMult;
            this.spawnX = this.x;
            this.weaverTime = Math.random() * Math.PI * 2;
        } else if (type === 'bomber') {
            this.width = GAME_CONFIG.BOMBER.SIZE;
            this.height = GAME_CONFIG.BOMBER.SIZE;
            this.speed = GAME_CONFIG.BOMBER.SPEED * speedMult;
            this.health = GAME_CONFIG.BOMBER.HEALTH;
        } else {
            this.width = GAME_CONFIG.ENEMY.SIZE;
            this.height = GAME_CONFIG.ENEMY.SIZE;
            this.speed = (GAME_CONFIG.ENEMY.MIN_SPEED +
                        Math.random() * (GAME_CONFIG.ENEMY.MAX_SPEED - GAME_CONFIG.ENEMY.MIN_SPEED)) * speedMult;
            this.health = GAME_CONFIG.ENEMY.HEALTH * healthMult;
        }

        // Animation properties
        this.currentFrame = 0;
        this.frameCount = this.frames.length;
        this.frameDelay = 10;
        this.frameTimer = 0;
    }

    update(gameState) {
        const slowFactor = gameState.bulletTimeActive ? GAME_CONFIG.POWERUP.BULLET_TIME_SPEED_FACTOR : 1;

        if (this.type === 'charger') {
            this.y += this.speed * slowFactor;
            if (this.game.player) {
                const dx = this.game.player.x - this.x;
                this.x += Math.sign(dx) * 2 * slowFactor;
            }
        } else if (this.type === 'green') {
            // Weaver: sine-wave oscillation
            this.y += this.speed * slowFactor;
            this.weaverTime += GAME_CONFIG.WEAVER.FREQUENCY * slowFactor;
            this.x = this.spawnX + Math.sin(this.weaverTime) * GAME_CONFIG.WEAVER.AMPLITUDE;
        } else if (this.type === 'bomber') {
            // Bomber: slow and straight, no shooting
            this.y += this.speed * slowFactor;
        } else {
            this.y += this.speed * slowFactor;
        }

        // Clamp position to canvas bounds
        this.x = Math.max(0, Math.min(this.x, this.canvas.width - this.width));
        this.y = Math.max(-this.height, Math.min(this.y, this.canvas.height));

        // Ensure frames are valid
        if (!this.frames || !Array.isArray(this.frames) || this.frames.length === 0) return;

        // Update animation
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.frameTimer = 0;
        }

        // Random shooting — weavers and bombers don't shoot
        if (this.type !== 'green' && this.type !== 'bomber') {
            if (Math.random() < GAME_CONFIG.ENEMY.SHOOT_CHANCE) {
                this.shoot(gameState);
            }
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
        if (this.dead) return false;
        this.health -= amount;

        // Show damage number
        this.showDamageNumber(amount);

        // Check if destroyed
        if (this.health <= 0) {
            this.dead = true;

            // Update combo
            const now = Date.now();
            if (now - gameState.lastComboTime <= GAME_CONFIG.COMBO.TIMEOUT) {
                gameState.comboCount++;
            } else {
                gameState.comboCount = 1;
            }
            gameState.lastComboTime = now;

            // Calculate score with combo multiplier
            let multiplier = 1;
            if (gameState.comboCount >= 4) {
                multiplier = 1.5;
            } else if (gameState.comboCount >= 2) {
                multiplier = 1.25;
            }
            // Bombers are worth double score
            const baseScore = this.type === 'bomber' ? GAME_CONFIG.COMBO.BASE_SCORE * 2 : GAME_CONFIG.COMBO.BASE_SCORE;
            const scoreGain = Math.round(baseScore * multiplier);
            gameState.score += scoreGain;
            // Update score UI
            const scoreElem = document.getElementById('score');
            if (scoreElem) {
                scoreElem.textContent = gameState.score;
            }

            // Energy gain with combo bonus
            const energyGain = GAME_CONFIG.COMBO.ENERGY_GAIN *
                                 (1 + (multiplier - 1) * 0.2);
            gameState.energy = Math.min(gameState.stats.maxEnergy, gameState.energy + energyGain);

            // Bomber AoE before explosion
            if (this.type === 'bomber') {
                this.triggerBomberAoE(gameState);
            }

            // Create explosion effect
            this.createExplosion(gameState);

            // Chance to drop power-up
            this.tryDropPowerup(gameState);

            return true;
        }
        return false;
    }

    triggerBomberAoE(gameState) {
        const radius = GAME_CONFIG.BOMBER.AOE_RADIUS;
        gameState.enemies.forEach(other => {
            if (other === this || other.dead) return;
            const dist = Math.hypot(other.x - this.x, other.y - this.y);
            if (dist < radius) {
                other.takeDamage(GAME_CONFIG.BOMBER.AOE_DAMAGE, gameState);
            }
        });
        // Large particle burst to indicate AoE
        if (particleSystem && typeof particleSystem.createExplosion === 'function') {
            particleSystem.createExplosion(this.x, this.y, { count: 40, color: '#f80', size: 6, speed: 8, life: 45 });
        }
    }

    showDamageNumber(amount) {
        showDamageNumber(amount, this.x, this.y);
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
        const intensity = this.type === 'bomber' ? 8 : 5;

        gameContainer.style.transform =
            `translate(${Math.random() * intensity - intensity / 2}px,
                      ${Math.random() * intensity - intensity / 2}px)`;

        setTimeout(() => {
            gameContainer.style.transform = 'none';
        }, 50);
    }

    tryDropPowerup(gameState) {
        // Bombers have a higher base drop chance
        const dropChance = this.type === 'bomber'
            ? GAME_CONFIG.POWERUP.DROP_CHANCE + 0.2
            : GAME_CONFIG.POWERUP.DROP_CHANCE;

        if (Math.random() < dropChance) {
            const powerUpTypes = ['health', 'shield', 'ammo', 'multishot'];
            if (gameState.score > 1500) powerUpTypes.push('bullettime');
            if (gameState.score > 2500) powerUpTypes.push('novabomb');

            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            const powerup = new PowerUp(this.x, this.y, randomType, this.game.assetManager);
            gameState.powerups.push(powerup);
        }
    }
}

export default Enemy;