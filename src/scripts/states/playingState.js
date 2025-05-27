import GameState from './gameState.js';
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
        
        // Reset game state
        this.game.gameState = { ...INITIAL_GAME_STATE };
        
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

        // Spawn enemies
        if (Date.now() - gameState.lastSpawnTime > gameState.spawnInterval) {
            const enemy = new Enemy(
                this.game,
                Math.random() < 0.5 ? 'red' : 'green'
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
                        enemy.takeDamage(GAME_CONFIG.PLAYER.DAMAGE, gameState);
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
                powerup.applyEffect(gameState);
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
        gameState.energy = Math.min(200, gameState.energy + GAME_CONFIG.PLAYER.ENERGY_REGEN);
        document.getElementById('energyBar').style.width = `${gameState.energy}%`;
    }

    handleGameOver() {
        this.game.gameState.isGameOver = true;

        // Create final explosion
        const explosion = new this.game.Explosion(
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

    cleanupEffects() {
        const effects = document.querySelectorAll(
            '.damage-number, .powerup-collection, .hit-effect'
        );
        effects.forEach(effect => effect.remove());
    }

    render() {
        this.game.renderer.render(this.game.gameState, this.game.player);
        particleSystem.draw(this.game.renderer.ctx);
    }
}

export default PlayingState;