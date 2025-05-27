// Asset loading
const ASSETS = {
    player: {
        blue: [
            'assets/PixelSpaceRage/128px/PlayerBlue_Frame_01_png_processed.png',
            'assets/PixelSpaceRage/128px/PlayerBlue_Frame_02_png_processed.png',
            'assets/PixelSpaceRage/128px/PlayerBlue_Frame_03_png_processed.png'
        ]
    },
    enemies: {
        red: [
            'assets/PixelSpaceRage/128px/Enemy01_Red_Frame_1_png_processed.png',
            'assets/PixelSpaceRage/128px/Enemy01_Red_Frame_2_png_processed.png',
            'assets/PixelSpaceRage/128px/Enemy01_Red_Frame_3_png_processed.png'
        ],
        green: [
            'assets/PixelSpaceRage/128px/Enemy01_Green_Frame_1_png_processed.png',
            'assets/PixelSpaceRage/128px/Enemy01_Green_Frame_2_png_processed.png',
            'assets/PixelSpaceRage/128px/Enemy01_Green_Frame_3_png_processed.png'
        ]
    },
    asteroids: [
        'assets/PixelSpaceRage/128px/Asteroid 01_png_processed.png',
        'assets/PixelSpaceRage/128px/Asteroid 02_png_processed.png',
        'assets/PixelSpaceRage/128px/Asteroid 03_png_processed.png',
        'assets/PixelSpaceRage/128px/Asteroid 04_png_processed.png'
    ],
    explosions: Array.from({ length: 9 }, (_, i) => 
        `assets/PixelSpaceRage/128px/Explosion01_Frame_0${i + 1}_png_processed.png`
    ),
    powerups: {
        health: 'assets/PixelSpaceRage/128px/Powerup_Health_png_processed.png',
        shield: 'assets/PixelSpaceRage/128px/Powerup_Shields_png_processed.png',
        ammo: 'assets/PixelSpaceRage/128px/Powerup_Ammo_png_processed.png'
    },
    projectiles: {
        laser: 'assets/PixelSpaceRage/128px/Laser_Small_png_processed.png',
        plasma: 'assets/PixelSpaceRage/128px/Plasma_Small_png_processed.png'
    }
};

console.log('Assets loaded:', ASSETS['explosions']);

// Game state
let gameState = {
    score: 0,
    health: 100,
    energy: 100,
    isGameOver: false,
    entities: [],
    projectiles: [],
    enemies: [],
    powerups: [],
    explosions: [],
    lastSpawnTime: 0,
    spawnInterval: 2000,
    animationFrame: 0,
    dashCooldown: 0,
    maxDashCooldown: 100
};

// Initialize canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

// Set canvas size
function resizeCanvas() {
    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;
}

// Load image assets
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Preload all assets
async function preloadAssets() {
    const loadedAssets = {};
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingText = document.getElementById('loadingText');
    
    // Count total assets to load
    let totalAssets = 0;
    let loadedCount = 0;
    
    // First count total assets
    const assetsList = [];
    for (const [key, value] of Object.entries(ASSETS)) {
        if (Array.isArray(value)) {
            totalAssets += value.length;
            value.forEach(path => assetsList.push({ key, path }));
        } else if (typeof value === 'object') {
            for (const [subKey, paths] of Object.entries(value)) {
                if (Array.isArray(paths)) {
                    totalAssets += paths.length;
                    paths.forEach(path => assetsList.push({ key, subKey, path }));
                } else {
                    totalAssets++;
                    assetsList.push({ key, subKey, path: paths });
                }
            }
        } else {
            totalAssets++;
            assetsList.push({ key, path: value });
        }
    }
    
    // Function to update loading progress
    const updateProgress = () => {
        loadedCount++;
        const progress = (loadedCount / totalAssets) * 100;
        loadingProgress.style.width = `${progress}%`;
        loadingText.textContent = `Loading assets... ${Math.round(progress)}%`;
    };
    
    // Load assets sequentially to ensure progress updates correctly
    for (const asset of assetsList) {
        try {
            const img = await loadImage(asset.path);
            if (asset.subKey) {
                loadedAssets[asset.key] = loadedAssets[asset.key] || {};
                if (Array.isArray(ASSETS[asset.key][asset.subKey])) {
                    loadedAssets[asset.key][asset.subKey] = loadedAssets[asset.key][asset.subKey] || [];
                    loadedAssets[asset.key][asset.subKey].push(img);
                } else {
                    loadedAssets[asset.key][asset.subKey] = img;
                }
            } else {
                if (Array.isArray(ASSETS[asset.key])) {
                    loadedAssets[asset.key] = loadedAssets[asset.key] || [];
                    loadedAssets[asset.key].push(img);
                } else {
                    loadedAssets[asset.key] = img;
                }
            }
            updateProgress();
        } catch (error) {
            console.error(`Failed to load asset: ${asset.path}`, error);
            throw error;
        }
    }
    
    return loadedAssets;
}

// Player class
class Player {
    constructor(assets) {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.width = 64;
        this.height = 64;
        this.speed = 5;
        this.dashSpeed = 15;
        this.isDashing = false;
        this.currentSpeed = this.speed;
        this.dashDuration = 20; // Duration of dash in frames
        this.dashTimer = 0;
        this.dashTrail = []; // Store previous positions for trail effect

        // Initialize player animation frames
        if (assets && assets.player && assets.player.blue) {
            this.frames = assets.player.blue;
        } else {
            console.error('Player assets not properly loaded:', assets);
            throw new Error('Player assets missing');
        }
        
        this.currentFrame = 0;
        this.frameCount = this.frames.length;
        this.frameDelay = 15;
        this.frameTimer = 0;
    }

    update() {
        // Store previous position for trail
        if (this.isDashing) {
            this.dashTrail.push({x: this.x, y: this.y});
            if (this.dashTrail.length > 5) {
                this.dashTrail.shift();
            }
        } else {
            this.dashTrail = [];
        }

        // Handle dash
        if (keys.ShiftLeft && gameState.dashCooldown === 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = this.dashDuration;
            gameState.dashCooldown = gameState.maxDashCooldown;
        }

        // Update dash state
        if (this.isDashing) {
            this.currentSpeed = this.speed + (this.dashSpeed - this.speed) * (this.dashTimer / this.dashDuration);
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            this.currentSpeed = this.speed;
        }

        // Update dash cooldown
        if (gameState.dashCooldown > 0) {
            gameState.dashCooldown--;
        }

        // Update movement with current speed
        if (keys.ArrowLeft && this.x > 0) this.x -= this.currentSpeed;
        if (keys.ArrowRight && this.x < canvas.width - this.width) this.x += this.currentSpeed;
        if (keys.ArrowUp && this.y > 0) this.y -= this.currentSpeed;
        if (keys.ArrowDown && this.y < canvas.height - this.height) this.y += this.currentSpeed;

        // Animation
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.frameTimer = 0;
        }
    }

    draw(ctx) {
        // Draw dash trail
        if (this.isDashing) {
            ctx.globalAlpha = 0.3;
            this.dashTrail.forEach((pos, i) => {
                const alpha = i / this.dashTrail.length;
                ctx.globalAlpha = alpha * 0.3;
                ctx.drawImage(
                    this.frames[this.currentFrame],
                    pos.x - this.width / 2,
                    pos.y - this.height / 2,
                    this.width,
                    this.height
                );
            });
            ctx.globalAlpha = 1;
        }

        // Draw player
        ctx.drawImage(
            this.frames[this.currentFrame],
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
    }

    shoot() {
        if (gameState.energy >= 10) {
            gameState.projectiles.push(new Projectile(
                this.x,
                this.y - this.height / 2,
                'player'
            ));
            gameState.energy = Math.max(0, gameState.energy - 10);
            document.getElementById('laserSound').volume = 0.5;
            document.getElementById('laserSound').play();
        }
    }
}

// Enemy class
class Enemy {
    constructor(assets, type = 'red') {
        this.x = Math.random() * (canvas.width - 64);
        this.y = -64;
        this.width = 64;
        this.height = 64;
        this.speed = 2 + Math.random() * 2;
        
        // Initialize enemy animation frames with error checking
        if (assets && assets.enemies && assets.enemies[type]) {
            this.frames = assets.enemies[type];
        } else {
            console.error('Enemy assets not properly loaded:', { assets, type });
            throw new Error('Enemy assets missing');
        }
        
        this.currentFrame = 0;
        this.frameCount = this.frames.length;
        this.frameDelay = 10;
        this.frameTimer = 0;
        this.health = 60;
    }

    update() {
        this.y += this.speed;
        
        // Animation
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.frameTimer = 0;
        }

        // Random shooting
        if (Math.random() < 0.01) {
            gameState.projectiles.push(new Projectile(this.x, this.y + this.height / 2, 'enemy'));
        }
    }

    draw(ctx) {
        ctx.drawImage(
            this.frames[this.currentFrame],
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
    }
}

// Explosion class
class Explosion {
    constructor(x, y, assets) {
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 128;
        
        // Initialize explosion animation frames with error checking
        if (assets && assets.explosions) {
            this.frames = assets.explosions;
        } else {
            console.error('Explosion assets not properly loaded:', assets);
            throw new Error('Explosion assets missing');
        }
        
        this.currentFrame = 0;
        this.frameDelay = 3;
        this.frameTimer = 0;
        this.isComplete = false;
    }

    update() {
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.currentFrame++;
            if (this.currentFrame >= this.frames.length) {
                this.isComplete = true;
            }
            this.frameTimer = 0;
        }
    }

    draw(ctx) {
        if (!this.isComplete && this.frames[this.currentFrame]) {
            ctx.drawImage(
                this.frames[this.currentFrame],
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }
    }
}

// Projectile class
class Projectile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 24;
        this.speed = type === 'player' ? -10 : 5;
        this.type = type;
    }

    update() {
        this.y += this.speed;
    }

    draw(ctx) {
        // ctx.fillStyle = this.type === 'player' ? '#00ff00' : '#ff0000';
        // ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Draw projectile image based on type
        const imgSrc = this.type === 'player' ? ASSETS.projectiles.laser : ASSETS.projectiles.plasma;
        const img = new Image();


        img.src = imgSrc;
        ctx.drawImage(
            img,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
        img.onload = () => {
            ctx.drawImage(
                img,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        };
        img.onerror = () => {
            console.error(`Failed to load projectile image: ${imgSrc}`);
        };
        ctx.globalAlpha = 1; // Reset alpha after drawing
    }
}

// Input handling
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        player.shoot();
    }
});
document.addEventListener('keyup', e => keys[e.code] = false);

// Mobile controls
document.getElementById('leftBtn').addEventListener('touchstart', () => keys.ArrowLeft = true);
document.getElementById('rightBtn').addEventListener('touchstart', () => keys.ArrowRight = true);
document.getElementById('upBtn').addEventListener('touchstart', () => keys.ArrowUp = true);
document.getElementById('downBtn').addEventListener('touchstart', () => keys.ArrowDown = true);
document.getElementById('fireBtn').addEventListener('touchstart', () => player.shoot());

document.getElementById('leftBtn').addEventListener('touchend', () => keys.ArrowLeft = false);
document.getElementById('rightBtn').addEventListener('touchend', () => keys.ArrowRight = false);
document.getElementById('upBtn').addEventListener('touchend', () => keys.ArrowUp = false);
document.getElementById('downBtn').addEventListener('touchend', () => keys.ArrowDown = false);

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x - rect1.width/2 < rect2.x + rect2.width/2 &&
           rect1.x + rect1.width/2 > rect2.x - rect2.width/2 &&
           rect1.y - rect1.height/2 < rect2.y + rect2.height/2 &&
           rect1.y + rect1.height/2 > rect2.y - rect2.height/2;
}

// Game initialization
let player;
let loadedAssets;

async function initGame() {
    resizeCanvas();
    
    // Show loading screen
    document.getElementById('loadingScreen').style.display = 'flex';
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    try {
        // Load assets first
        loadedAssets = await preloadAssets();
        
        // Hide loading screen and show main menu
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
        
        // Start background menu music
        const bgMenuMusic = document.getElementById('bgMenuMusic');
        bgMenuMusic.volume = 0.2;
        bgMenuMusic.play();
    } catch (error) {
        console.error('Failed to load assets:', error);
        document.getElementById('loadingText').textContent = 'Error loading assets. Please refresh the page.';
        document.getElementById('loadingProgress').style.backgroundColor = '#ef4444';  // Red background to indicate error
        throw error; // Re-throw to prevent game from continuing with missing assets
    }
}

// Main game loop
function gameLoop(assets) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Continue updating explosions even after game over
    gameState.explosions = gameState.explosions.filter(explosion => {
        explosion.update();
        explosion.draw(ctx);
        return !explosion.isComplete;
    });

    if (!gameState.isGameOver) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Spawn enemies
        if (Date.now() - gameState.lastSpawnTime > gameState.spawnInterval) {
            gameState.enemies.push(new Enemy(assets, Math.random() < 0.5 ? 'red' : 'green'));
            gameState.lastSpawnTime = Date.now();
        }
        
        // Update and draw player
        player.update();
        player.draw(ctx);

        // Update and draw explosions
        gameState.explosions = gameState.explosions.filter(explosion => {
            explosion.update();
            explosion.draw(ctx);
            return !explosion.isComplete;
        });
        
        // Update and draw enemies
        gameState.enemies = gameState.enemies.filter(enemy => {
            enemy.update();
            enemy.draw(ctx);
            return enemy.y < canvas.height + 64;
        });
        
        // Update and draw projectiles
        gameState.projectiles = gameState.projectiles.filter(projectile => {
            projectile.update();
            projectile.draw(ctx);
            return projectile.y > 0 && projectile.y < canvas.height;
        });
        
        // Collision detection
        gameState.projectiles = gameState.projectiles.filter(projectile => {
            // Check player projectiles hitting enemies
            if (projectile.type === 'player') {
                for (let i = gameState.enemies.length - 1; i >= 0; i--) {
                    const enemy = gameState.enemies[i];
                    if (checkCollision(projectile, enemy)) {
                        enemy.health -= 25; // Each hit does 25 damage
                        if (enemy.health <= 0) {
                            gameState.explosions.push(new Explosion(enemy.x, enemy.y, assets));
                            gameState.enemies.splice(i, 1);
                            gameState.score += 100;
                            document.getElementById('score').textContent = gameState.score;

                            document.getElementById('explosionSound').volume = 0.5;
                            document.getElementById('explosionSound').play();
                        }
                        return false; // Remove projectile after hit
                    }
                }
                return true; // Keep projectile if it didn't hit anything
            }
            
            // Check enemy projectiles hitting player
            if (projectile.type === 'enemy' && checkCollision(projectile, player)) {
                gameState.health = Math.max(0, gameState.health - 10);
                document.getElementById('healthBar').style.width = `${gameState.health}%`;
                document.getElementById('explosionSound').volume = 0.5;
                document.getElementById('explosionSound').play();
                
                if (gameState.health <= 0) {
                    gameState.explosions.push(new Explosion(player.x, player.y, assets));
                    gameOver();
                }
                return false; // Remove projectile after hit
            }
            
            return true; // Keep projectile if it didn't hit anything
        });
        
        // Energy regeneration
        gameState.energy = Math.min(200, gameState.energy + 0.2);
        document.getElementById('energyBar').style.width = `${gameState.energy}%`;

        // Update dash cooldown bar
        const dashCooldownPercent = ((gameState.maxDashCooldown - gameState.dashCooldown) / gameState.maxDashCooldown) * 100;
        document.getElementById('dashCooldownBar').style.width = `${dashCooldownPercent}%`;
        
        requestAnimationFrame(() => gameLoop(assets));
    }
}

// Game over handling
async function gameOver() {
    // Set game over state but don't show screen yet
    gameState.isGameOver = true;
    
    // Wait for explosion animation to complete (about 1 second)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Show game over screen
    document.getElementById('gameOver').style.display = 'flex';
    document.getElementById('finalScore').textContent = gameState.score;
}

// Event listeners
window.addEventListener('resize', resizeCanvas);

function startGameWithAssets(assets) {
    if (!assets) {
        console.error('No assets provided to start game');
        throw new Error('Assets not loaded');
    }
    // Initialize player with assets
    player = new Player(assets);
    
    gameState = {
        score: 0,
        health: 100,
        energy: 100,
        isGameOver: false,
        entities: [],
        projectiles: [],
        enemies: [],
        powerups: [],
        explosions: [],
        lastSpawnTime: 0,
        spawnInterval: 2000,
        animationFrame: 0,
        dashCooldown: 0,
        maxDashCooldown: 100
    };
    
    document.getElementById('score').textContent = '0';
    document.getElementById('healthBar').style.width = '100%';
    document.getElementById('energyBar').style.width = '100%';
    document.getElementById('dashCooldownBar').style.width = '100%';
    
    // Start game loop with assets
    gameLoop(assets);
}

document.getElementById('startGame').addEventListener('click', () => {
    document.getElementById('mainMenu').style.display = 'none';
    
    // Switch from menu music to game music
    document.getElementById('bgMenuMusic').pause();
    document.getElementById('bgMenuMusic').currentTime = 0;
    
    const bgMusic = document.getElementById('bgMusic');
    bgMusic.volume = 0.2;
    bgMusic.play();
    
    // Start game with loaded assets
    startGameWithAssets(loadedAssets);
});

document.getElementById('restartGame').addEventListener('click', () => {
    // Reset game state and start with existing assets
    document.getElementById('gameOver').style.display = 'none';
    if (!loadedAssets) {
        console.error('No assets available for restart');
        initGame(); // Reload assets if they're missing
        return;
    }
    startGameWithAssets(loadedAssets);
});

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', initGame);
