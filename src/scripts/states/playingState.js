import { gsap } from 'gsap';
import GameState from './gameState.js';
import { UpgradePicker } from './upgradePicker.js';
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
    constructor(game, { resume = false } = {}) {
        super(game);
        this._resume = resume;
    }

    enter() {
        // Resuming from pause: keep existing gameState, player, upgrades and
        // input handlers intact. Only the background music needs restarting.
        if (this._resume) {
            const bgMusic = this.game.assetManager.getAudio('bgMusic');
            if (bgMusic) {
                bgMusic.volume = 0.2;
                bgMusic.loop = true;
                bgMusic.play().catch(err => console.warn('Game music autoplay prevented:', err));
            }
            return;
        }

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
        const lvlEl = document.getElementById('levelDisplay');
        if (lvlEl) lvlEl.textContent = '01';

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
        if (this._upgradePicker) return;  // freeze while upgrade screen is open

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
                gameState.shootCooldown = gameState.stats.fireRate;
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

        // Difficulty Scaling (logarithmic — much gentler than linear)
        const score = gameState.score || 0;
        const difficultyMultiplier = 1 + Math.log10(1 + score / 500) * 1.5;

        // Check for milestone wave events
        this.checkMilestone(gameState, difficultyMultiplier);

        // Expire bullet time
        if (gameState.bulletTimeActive && Date.now() > gameState.bulletTimeEndTime) {
            gameState.bulletTimeActive = false;
        }

        if (gameState.waveEvent) {
            // Wave event replaces normal spawning
            this.updateWaveEvent(gameState, difficultyMultiplier);
        } else {
            // Milestone-gated spawn interval: breathing room between milestones
            const milestone = Math.floor(score / GAME_CONFIG.ENEMY.MILESTONE_INTERVAL);
            const base = Math.max(600, 2000 - milestone * 175);
            gameState.spawnInterval = base + base * (0.25 / (1 + (score % GAME_CONFIG.ENEMY.MILESTONE_INTERVAL) * 0.001));

            if (Date.now() - gameState.lastSpawnTime > gameState.spawnInterval) {
                let type = Math.random() < 0.5 ? 'red' : 'green';

                if (score > 300) {
                    const chargerChance = Math.min(0.45, 0.1 + (score / 7000));
                    if (Math.random() < chargerChance) type = 'charger';
                }
                if (score > 1200 && Math.random() < 0.10) {
                    type = 'bomber';
                }

                const enemy = new Enemy(this.game, type, difficultyMultiplier);
                gameState.enemies.push(enemy);
                gameState.lastSpawnTime = Date.now();
            }
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
            projectile.update(gameState);
            return projectile.active;
        });

        // --- PROJECTILE COLLISION LOGIC ---
        const player = this.game.player;
        gameState.projectiles.forEach(projectile => {
            if (projectile.type === 'player') {
                gameState.enemies.forEach(enemy => {
                    if (projectile.active && checkCollision(projectile, enemy)) {
                        if (!gameState.stats.piercingShots) projectile.active = false;
                        enemy.takeDamage(gameState.stats.damage, gameState);
                    }
                });
            }
            // Enemy projectiles hit player — also check for close calls
            if (projectile.type === 'enemy') {
                if (projectile.active && checkCollision(projectile, player)) {
                    projectile.active = false;
                    player.takeDamage(GAME_CONFIG.ENEMY.DAMAGE, gameState);
                } else if (projectile.active && !projectile._closeCallChecked && player) {
                    const dist = Math.hypot(projectile.x - player.x, projectile.y - player.y);
                    // 20px gap outside the player hitbox (~27px half-size)
                    if (dist < 47 && dist > 27) {
                        projectile._closeCallChecked = true;
                        gameState.score += 50;
                        const scoreElem = document.getElementById('score');
                        if (scoreElem) scoreElem.textContent = gameState.score;
                        this._showCloseCallText(projectile.x, projectile.y);
                    }
                }
            }
        });

        // Update powerups
        // Keep a reference to detect powerups pushed mid-filter (e.g., nova bomb enemy drops)
        const _pwRef = gameState.powerups;
        const _pwStartLen = _pwRef.length;
        gameState.powerups = _pwRef.filter(powerup => {
            powerup.update();
            if (checkCollision(powerup, this.game.player)) {
                powerup.applyEffect(gameState, this.game.player);
                return false;
            }
            return powerup.y < this.game.renderer.canvas.height + 32;
        });
        // Append any powerups pushed during filter (nova bomb drops, etc.)
        for (let i = _pwStartLen; i < _pwRef.length; i++) {
            gameState.powerups.push(_pwRef[i]);
        }

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

        gameState.playerLevel++;
        const steps = GAME_CONFIG.PLAYER.UPGRADE_STEPS;
        const stepIdx = Math.min(gameState.playerLevel - 1, steps.length - 1);
        gameState.nextUpgradeScore += steps[stepIdx];

        const levelEl = document.getElementById('levelDisplay');
        if (levelEl) {
            levelEl.textContent = String(gameState.playerLevel).padStart(2, '0');
            gsap.from(levelEl, { scale: 1.6, opacity: 0, duration: 0.4, ease: 'back.out(2)' });
        }

        this._upgradePicker = new UpgradePicker(this.game, (upgrade) => {
            upgrade.apply(gameState);
            this._upgradePicker = null;

            // Notify which upgrade was taken
            this._showUpgradeToast(upgrade.label);

            const snd = this.game.assetManager.getAudio('powerup');
            if (snd) { snd.volume = 0.6; snd.currentTime = 0; snd.play().catch(() => {}); }
        });
    }

    _showUpgradeToast(label) {
        const el = document.createElement('div');
        el.className = 'upgrade-notification';
        el.textContent = label;
        document.getElementById('gameContainer').appendChild(el);

        gsap.timeline({ onComplete: () => el.remove() })
            .from(el, { y: 20, opacity: 0, scale: 0.85, duration: 0.35, ease: 'back.out(1.8)' })
            .to(el,   { y: -40, opacity: 0, duration: 0.5, ease: 'power2.in', delay: 1.2 });
    }

    cleanupEffects() {
        const effects = document.querySelectorAll(
            '.damage-number, .powerup-collection, .hit-effect, .upgrade-notification, .wave-announcement, .close-call-text, .nova-flash'
        );
        effects.forEach(effect => effect.remove());
    }

    checkMilestone(gameState, difficultyMultiplier) {
        if (gameState.score < GAME_CONFIG.ENEMY.MILESTONE_INTERVAL) return;
        const currentMilestone = Math.floor(gameState.score / GAME_CONFIG.ENEMY.MILESTONE_INTERVAL);
        if (currentMilestone <= gameState.lastMilestone || gameState.waveEvent !== null || this._upgradePicker) return;

        gameState.lastMilestone = currentMilestone;
        const types = ['rush', 'elite', 'formation'];
        const type = types[Math.floor(Math.random() * types.length)];
        gameState.waveEvent = {
            type,
            startTime: Date.now(),
            endTime: Date.now() + GAME_CONFIG.WAVE.DURATION_MS,
            spawned: 0,
            eliteSpawned: false,
            formationSpawned: false,
            eliteEnemy: null,
        };
        gameState.lastSpawnTime = Date.now();
        this._showWaveAnnouncement(type);
    }

    updateWaveEvent(gameState, difficultyMultiplier) {
        const wave = gameState.waveEvent;
        const now = Date.now();

        if (now > wave.endTime) {
            gameState.waveEvent = null;
            gameState.lastSpawnTime = Date.now();
            return;
        }

        if (wave.type === 'rush') {
            const rushCount = GAME_CONFIG.WAVE.RUSH_COUNT + Math.min(8, Math.floor(gameState.playerLevel / 2));
            const elapsed = now - wave.startTime;
            const expectedSpawns = Math.floor(elapsed / GAME_CONFIG.WAVE.RUSH_INTERVAL_MS);
            if (expectedSpawns > wave.spawned && wave.spawned < rushCount) {
                const r = Math.random();
                const type = (gameState.score > 300 && r < 0.2) ? 'charger' : (r < 0.6 ? 'red' : 'green');
                gameState.enemies.push(new Enemy(this.game, type, difficultyMultiplier));
                wave.spawned++;
            }
            if (wave.spawned >= rushCount && now > wave.startTime + 4000) {
                gameState.waveEvent = null;
                gameState.lastSpawnTime = Date.now();
            }
        } else if (wave.type === 'elite') {
            if (!wave.eliteSpawned) {
                const elite = new Enemy(this.game, 'charger', difficultyMultiplier * 2.5);
                gameState.enemies.push(elite);
                wave.eliteEnemy = elite;
                wave.eliteSpawned = true;
            }
            if (wave.eliteEnemy && wave.eliteEnemy.dead) {
                gameState.waveEvent = null;
                gameState.lastSpawnTime = Date.now();
            }
        } else if (wave.type === 'formation') {
            if (!wave.formationSpawned) {
                const canvas = this.game.renderer.canvas;
                const cx = canvas.width / 2;
                const positions = [
                    { x: cx,       y: -40 },
                    { x: cx - 60,  y: -80 },
                    { x: cx + 60,  y: -80 },
                    { x: cx - 120, y: -120 },
                    { x: cx + 120, y: -120 },
                ];
                // Wider pyramid as the player levels up: +2 ships per extra row, up to +6.
                const extraRows = Math.min(3, Math.floor(gameState.playerLevel / 3));
                for (let i = 1; i <= extraRows; i++) {
                    const offset = 120 + i * 60;
                    const y = -120 - i * 40;
                    positions.push({ x: cx - offset, y });
                    positions.push({ x: cx + offset, y });
                }
                positions.forEach(pos => {
                    const enemy = new Enemy(this.game, 'red', difficultyMultiplier);
                    enemy.x = pos.x;
                    enemy.y = pos.y;
                    gameState.enemies.push(enemy);
                });
                wave.formationSpawned = true;
            }
        }
    }

    _showWaveAnnouncement(type) {
        const labels = {
            rush: 'ENEMY RUSH!',
            elite: 'ELITE ENCOUNTERED!',
            formation: 'FORMATION INCOMING!',
        };
        const colors = {
            rush: '#f44',
            elite: '#c0f',
            formation: '#ff0',
        };
        const el = document.createElement('div');
        el.className = 'wave-announcement';
        el.textContent = labels[type] || 'INCOMING!';
        el.style.color = colors[type] || '#fff';
        document.getElementById('gameContainer').appendChild(el);

        gsap.timeline({ onComplete: () => el.remove() })
            .from(el, { y: -50, opacity: 0, duration: 0.4, ease: 'back.out(1.5)' })
            .to(el, { opacity: 0, duration: 0.4, delay: 2.0 });
    }

    _showCloseCallText(x, y) {
        const el = document.createElement('div');
        el.className = 'close-call-text';
        el.textContent = 'CLOSE CALL! +50';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.getElementById('gameContainer').appendChild(el);

        gsap.timeline({ onComplete: () => el.remove() })
            .from(el, { opacity: 0, scale: 0.7, duration: 0.2, ease: 'back.out(2)' })
            .to(el, { y: -50, opacity: 0, duration: 0.6, delay: 0.4 });
    }

    render() {
        this.game.renderer.render(this.game.gameState, this.game.player, this.game.stars);
        particleSystem.draw(this.game.renderer.ctx);
    }
}

// Inject styles for wave announcements and close call bonus
const _playingStyles = document.createElement('style');
_playingStyles.textContent = `
    .wave-announcement {
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 22px;
        font-weight: bold;
        letter-spacing: 3px;
        text-shadow: 0 0 12px currentColor;
        pointer-events: none;
        white-space: nowrap;
        z-index: 50;
    }

    .close-call-text {
        position: absolute;
        transform: translate(-50%, -50%);
        color: #ff0;
        font-weight: bold;
        font-size: 13px;
        pointer-events: none;
        text-shadow: 0 0 8px #f80;
        white-space: nowrap;
        z-index: 50;
    }
`;
document.head.appendChild(_playingStyles);

export default PlayingState;