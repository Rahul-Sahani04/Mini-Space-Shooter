import GameState from './gameState.js';
import { Explosion } from '../entities/explosion.js';
import { PausedState } from './pausedState.js';
import { GameOverState } from './gameOverState.js';
import { Player } from '../entities/player.js';
import { Enemy } from '../entities/enemy.js';
import { PowerUp } from '../entities/powerup.js';
import { GAME_CONFIG, INITIAL_GAME_STATE } from '../utils/constants.js';
import { TutorialSystem } from '../utils/tutorial.js';
import particleSystem from '../utils/particles.js';
import { checkCollision } from '../utils/collision.js';

export class PlayingState extends GameState {
    enter() {
        // Initialize game entities
        this.game.player = new Player(this.game.assetManager);
        this.game.tutorial = new TutorialSystem(this.game);
        
        // Reset game state with deep copy for stats
        this.game.gameState = { 
            ...INITIAL_GAME_STATE,
            stats: { ...INITIAL_GAME_STATE.stats }
        };
        
        // Reset UI
        document.getElementById('score').textContent = '0';
        document.getElementById('healthBar').style.width = '100%';
        document.getElementById('energyBar').style.width = '100%';
        document.getElementById('dashCooldownBar').style.width = '100%';

        // Start game music
        const bgMusic = this.game.assetManager.getAudio('bgMusic');
        if (bgMusic) {
            bgMusic.volume = 0.2;
            bgMusic.loop = true;
            bgMusic.play().catch(err => console.warn('Game music autoplay prevented:', err));
        }

        // Initialize input handlers
        this.setupInputHandlers();

        // Play start sound
        const startSound = this.game.assetManager.getAudio('startMissionSound');
        if (startSound) {
            startSound.volume = 0.5;
            startSound.play().catch(err => console.warn('Start sound autoplay prevented:', err));
        }
    }

    exit() {
        // Stop game music
        const bgMusic = this.game.assetManager.getAudio('bgMusic');
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }

        // Clean up effects
        particleSystem.clear();
        this.cleanupEffects();
    }

    setupInputHandlers() {
        // Keyboard handlers
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Touch handlers for mobile
        if ('ontouchstart' in window) {
            this.setupMobileControls();
        }
    }

    handleKeyDown(event) {
        if (event.code === 'Escape') {
            this.game.setState(new PausedState(this.game));
        }
    }

    handleKeyUp(event) {
        // Handle key up events if needed
    }

    setupMobileControls() {
        const controls = {
            leftBtn: { key: 'ArrowLeft' },
            rightBtn: { key: 'ArrowRight' },
            upBtn: { key: 'ArrowUp' },
            downBtn: { key: 'ArrowDown' },
            fireBtn: { key: 'Space' },
            dashBtn: { key: 'ShiftLeft' }
        };

        Object.entries(controls).forEach(([btnId, control]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.game.keys[control.key] = true;
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.game.keys[control.key] = false;
                });
            }
        });
    }

    update() {
        if (this.game.gameState.isGameOver) return;

        // Update tutorial
        this.game.tutorial.update();

        // Update all game entities
        this.updateEntities();

        // Check for game over condition
        if (this.game.gameState.health <= 0) {
            this.handleGameOver();
        }

        // Update particle effects
        particleSystem.update();
    }

    updateEntities() {
        const gameState = this.game.gameState;

        // --- SHOOTING LOGIC ---
        if (typeof gameState.shootCooldown === 'undefined') {
            gameState.shootCooldown = 0;
        }
        if (this.game.keys['Space'] && gameState.shootCooldown === 0) {
            if (this.game.player.shoot(gameState, this.game)) {
                gameState.shootCooldown = GAME_CONFIG.PLAYER.SHOOT_COOLDOWN || 10;
            }
        }
        if (gameState.shootCooldown > 0) {
            gameState.shootCooldown--;
        }

        // --- DASH COOLDOWN LOGIC ---
        if (typeof gameState.dashCooldown === 'undefined') {
            gameState.dashCooldown = 0;
        }
        if (gameState.dashCooldown > 0) {
            gameState.dashCooldown--;
            document.getElementById('dashCooldownBar').style.width = `${100 - (gameState.dashCooldown / (GAME_CONFIG.DASH.MAX_COOLDOWN || 60)) * 100}%`;
        } else {
            document.getElementById('dashCooldownBar').style.width = '100%';
        }

        // --- UPGRADE SYSTEM ---
        if (gameState.score >= gameState.nextUpgradeScore) {
            this.handlePlayerUpgrade();
        }

        // Spawn enemies
        // Difficulty Scaling
        const score = gameState.score || 0;
        const difficultyMultiplier = 1 + (score / 1000); // +10% stats every 100 points
        
        // Dynamic spawn rate
        const minSpawnInterval = 600;
        const variableInterval = Math.max(
            minSpawnInterval, 
            GAME_CONFIG.ENEMY.SPAWN_INTERVAL - (score * 0.8) // Reduce interval by 0.8ms per point
        );
        gameState.spawnInterval = variableInterval;

        // Spawn enemies
        if (Date.now() - gameState.lastSpawnTime > gameState.spawnInterval) {
            // Determine enemy type based on score
            let type = Math.random() < 0.5 ? 'red' : 'green';
            
            // Introduce Chargers after 500 points
            if (score > 500) {
                // 20% chance for charger, increases slightly with difficulty
                if (Math.random() < 0.2 + (score / 5000)) {
                    type = 'charger';
                }
            }

            const enemy = new Enemy(
                this.game,
                type,
                difficultyMultiplier
            );
            gameState.enemies.push(enemy);
            gameState.lastSpawnTime = Date.now();
        }

        // Update player
        this.game.player.update(gameState, this.game.keys);

        // Update enemies
        gameState.enemies = gameState.enemies.filter(enemy => {
            enemy.update(gameState);
            // Remove enemy if destroyed or off screen
            return enemy.health > 0 && enemy.y < this.game.renderer.canvas.height;
        });

        // Update projectiles
        gameState.projectiles = gameState.projectiles.filter(projectile => {
            projectile.update();
            return projectile.active;
        });

        // --- PROJECTILE COLLISION LOGIC ---
        // Player projectiles hit enemies
        gameState.projectiles.forEach(projectile => {
            if (projectile.type === 'player') {
                gameState.enemies.forEach(enemy => {
                    if (
                        projectile.active &&
                        checkCollision(projectile, enemy)
                    ) {
                        projectile.active = false;
                        enemy.takeDamage(gameState.stats.damage, gameState);
                    }
                });
            }
            // Enemy projectiles hit player
            if (projectile.type === 'enemy') {
                if (
                    projectile.active &&
                    checkCollision(projectile, this.game.player)
                ) {
                    projectile.active = false;
                    this.game.player.takeDamage(GAME_CONFIG.ENEMY.DAMAGE, gameState);
                }
            }
        });

        // Update powerups
        gameState.powerups = gameState.powerups.filter(powerup => {
            powerup.update();
            if (checkCollision(powerup, this.game.player)) {
                powerup.applyEffect(gameState, this.game.player);
                return false;
            }
            return powerup.y < this.game.renderer.canvas.height + 32;
        });

        // Update explosions
        gameState.explosions = gameState.explosions.filter(explosion => {
            explosion.update();
            return !explosion.isComplete;
        });

        // Update energy regeneration
        // Use dynamic max energy from stats
        const maxEnergy = gameState.stats.maxEnergy;
        gameState.energy = Math.min(maxEnergy, gameState.energy + gameState.stats.energyRegen);
        document.getElementById('energyBar').style.width = `${(gameState.energy / maxEnergy) * 100}%`;
        
        // Update health bar based on dynamic max health
        const maxHealth = gameState.stats.maxHealth;
        document.getElementById('healthBar').style.width = `${(gameState.health / maxHealth) * 100}%`;
    }

    handleGameOver() {
        this.game.gameState.isGameOver = true;

        // Create final explosion
        const explosion = new Explosion(
            this.game.player.x,
            this.game.player.y,
            this.game.assetManager
        );
        this.game.gameState.explosions.push(explosion);

        // Transition to game over state after explosion
        setTimeout(() => {
            this.game.setState(new GameOverState(this.game));
        }, 1000);
    }

    handlePlayerUpgrade() {
        const gameState = this.game.gameState;
        
        // Increase requirement for next upgrade
        gameState.nextUpgradeScore += GAME_CONFIG.PLAYER.UPGRADE_THRESHOLD;
        gameState.playerLevel++;

        // Randomly select upgrade type
        const upgradeTypes = ['damage', 'fireRate', 'maxStats', 'energyRegen'];
        const type = upgradeTypes[Math.floor(Math.random() * upgradeTypes.length)];
        
        let message = '';
        
        switch(type) {
            case 'damage':
                gameState.stats.damage += 5;
                message = 'WEAPON DAMAGE UPGRADED';
                break;
            case 'fireRate':
                gameState.stats.fireRate = Math.max(5, gameState.stats.fireRate - 1);
                message = 'FIRE RATE INCREASED';
                break;
            case 'maxStats':
                gameState.stats.maxHealth += 20;
                gameState.stats.maxEnergy += 20;
                gameState.health += 20; // Heal amount added
                gameState.energy += 20;
                message = 'HULL & ENERGY CAPACITY EXPANDED';
                break;
            case 'energyRegen':
                gameState.stats.energyRegen += 0.1;
                message = 'ENERGY REGENERATION BOOSTED';
                break;
        }

        // Show upgrade notification
        this.showUpgradeNotification(message);
        
        // Play upgrade sound
        const powerupSound = this.game.assetManager.getAudio('powerup');
        if (powerupSound) {
            powerupSound.volume = 0.6;
            powerupSound.currentTime = 0;
            powerupSound.play().catch(() => {});
        }
    }

    showUpgradeNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'upgrade-notification';
        notification.textContent = text;
        
        // Style handled in CSS or JS, injecting basic style here ensuring visibility
        notification.style.position = 'absolute';
        notification.style.top = '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.color = '#00f3ff';
        notification.style.fontSize = '24px';
        notification.style.fontWeight = 'bold';
        notification.style.textShadow = '0 0 10px #00f3ff';
        notification.style.zIndex = '100';
        notification.style.pointerEvents = 'none';
        notification.style.animation = 'fadeUp 2s ease-out forwards';
        
        document.getElementById('gameContainer').appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }

    cleanupEffects() {
        const effects = document.querySelectorAll(
            '.damage-number, .powerup-collection, .hit-effect, .upgrade-notification'
        );
        effects.forEach(effect => effect.remove());
    }

    render() {
        this.game.renderer.render(this.game.gameState, this.game.player, this.game.stars);
        particleSystem.draw(this.game.renderer.ctx);
    }
}

export default PlayingState;