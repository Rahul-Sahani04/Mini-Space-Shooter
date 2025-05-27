import { GAME_CONFIG } from '../utils/constants.js';
import { Projectile } from './projectile.js';

export class Player {
    constructor(assetManager) {
        this.x = 0;
        this.y = 0;
        this.width = GAME_CONFIG.PLAYER.SIZE;
        this.height = GAME_CONFIG.PLAYER.SIZE;
        this.speed = GAME_CONFIG.PLAYER.SPEED;
        this.dashSpeed = GAME_CONFIG.PLAYER.DASH_SPEED;
        this.isDashing = false;
        this.currentSpeed = this.speed;
        this.dashDuration = GAME_CONFIG.PLAYER.DASH_DURATION;
        this.dashTimer = 0;
        this.dashTrail = [];

        // Animation properties
        this.frames = assetManager.getSprite('playerBlue');
        if (!this.frames || !Array.isArray(this.frames) || this.frames.length === 0) {
            console.error('Player sprite frames missing or empty. Using placeholder.');
            // Try to use any available sprite as fallback
            const allSprites = Array.from(assetManager.assets.sprites.values());
            this.frames = allSprites.length > 0 ? allSprites[0] : [document.createElement('canvas')];
        }

        this.currentFrame = 0;
        this.frameCount = this.frames.length;
        this.frameDelay = 25;
        this.frameTimer = 0;

        // Reset position
        this.resetPosition();
    }

    resetPosition() {
        // Position player at bottom center of screen
        const canvas = document.getElementById('gameCanvas');
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
    }

    update(gameState, keys) {
        // Update dash trail
        if (this.isDashing) {
            this.dashTrail.push({x: this.x, y: this.y});
            if (this.dashTrail.length > 5) {
                this.dashTrail.shift();
            }
        } else {
            this.dashTrail = [];
        }

        // Handle dash
        if ((keys.ShiftLeft || keys.ShiftRight) && gameState.dashCooldown === 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            gameState.dashCooldown = GAME_CONFIG.DASH.MAX_COOLDOWN;
        }

        if (this.isDashing) {
            this.currentSpeed = this.speed + (this.dashSpeed - this.speed) *
                              (this.dashTimer / this.dashDuration);
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            this.currentSpeed = this.speed;
        }

        // Update movement
        const canvas = document.getElementById('gameCanvas');
        if (keys.ArrowLeft && this.x > 0) this.x -= this.currentSpeed;
        if (keys.ArrowRight && this.x < canvas.width - this.width) this.x += this.currentSpeed;
        if (keys.ArrowUp && this.y > 0) this.y -= this.currentSpeed;
        if (keys.ArrowDown && this.y < canvas.height - this.height) this.y += this.currentSpeed;

        // Clamp position to canvas bounds
        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
        this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));

        // Ensure frames are valid
        if (!this.frames || !Array.isArray(this.frames) || this.frames.length === 0) return;

        // Update animation
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.frameTimer = 0;
        }
    }

    shoot(gameState, game) {
        if (gameState.energy >= GAME_CONFIG.PLAYER.SHOOT_COST) {
            // Get projectile from pool or create new one
            const projectile = game.objectPools.getFromPool('projectiles') ||
                new Projectile(this.x, this.y - this.height / 2, 'player', game);

            if (!projectile.fromPool) {
                projectile.reset(this.x, this.y - this.height / 2, 'player');
            }

            gameState.projectiles.push(projectile);
            gameState.energy = Math.max(0, gameState.energy - GAME_CONFIG.PLAYER.SHOOT_COST);

            // Update energy bar UI
            const energyBar = document.getElementById('energyBar');
            if (energyBar) {
                energyBar.style.width = `${gameState.energy}%`;
            }

            // Play sound effect
            const laserSound = game.assetManager.getAudio('laser');
            if (laserSound) {
                laserSound.volume = 0.5;
                laserSound.currentTime = 0;
                laserSound.play();
            }

            return true;
        }
        return false;
    }

    takeDamage(amount, gameState) {
        gameState.health = Math.max(0, gameState.health - amount);

        // Update health bar UI
        const healthBar = document.getElementById('healthBar');
        if (healthBar) {
            healthBar.style.width = `${gameState.health}%`;
        }

        // Add screen flash effect
        document.getElementById('gameContainer').classList.add('damage-flash');
        setTimeout(() => {
            document.getElementById('gameContainer').classList.remove('damage-flash');
        }, 100);

        // Show damage number
        this.showDamageNumber(amount);

        return gameState.health <= 0;
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
}

export default Player;