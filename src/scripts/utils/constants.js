// Game configuration
export const GAME_CONFIG = {
    PLAYER: {
        SIZE: 72,
        SPEED: 5,
        DASH_SPEED: 15,
        DASH_DURATION: 20,
        WIDTH: 72,
        HEIGHT: 72,
        DAMAGE: 15, // Player projectile damage
        INITIAL_HEALTH: 100,
        INITIAL_ENERGY: 100,
        ENERGY_REGEN: 0.2,
        SHOOT_COST: 10,
    },

    ENEMY: {
        SIZE: 68,
        MIN_SPEED: 2,
        MAX_SPEED: 4,
        WIDTH: 68,
        HEIGHT: 68,
        HEALTH: 45,
        DAMAGE: 15, // Enemy projectile damage
        SHOOT_CHANCE: 0.01,
        SPAWN_INTERVAL: 2000,
    },

    PROJECTILE: {
        PLAYER_SPEED: -10,
        ENEMY_SPEED: 5,
        WIDTH: 8,
        HEIGHT: 24,
        DAMAGE: 25,
    },

    POWERUP: {
        WIDTH: 32,
        HEIGHT: 32,
        SPEED: 1,
        DROP_CHANCE: 0.3,
        HEALTH_RESTORE: 30,
        SHIELD_RESTORE: 50,
        ENERGY_RESTORE: 100,
    },

    COMBO: {
        TIMEOUT: 2000,
        MAX_MULTIPLIER: 5,
        BASE_SCORE: 100,
        ENERGY_GAIN: 20,
    },

    DASH: {
        MAX_COOLDOWN: 100,
    },

    GRID_SIZE: 64, // For spatial partitioning
};

// Asset definitions
export const ASSETS = {
    player: {
        blue: [
            '/assets/PixelSpaceRage/128px/PlayerBlue_Frame_01_png_processed.png',
            '/assets/PixelSpaceRage/128px/PlayerBlue_Frame_02_png_processed.png',
            '/assets/PixelSpaceRage/128px/PlayerBlue_Frame_03_png_processed.png',
        ],
    },
    enemies: {
        red: [
            '/assets/PixelSpaceRage/128px/Enemy01_Red_Frame_1_png_processed.png',
            '/assets/PixelSpaceRage/128px/Enemy01_Red_Frame_2_png_processed.png',
            '/assets/PixelSpaceRage/128px/Enemy01_Red_Frame_3_png_processed.png',
        ],
        green: [
            '/assets/PixelSpaceRage/128px/Enemy01_Green_Frame_1_png_processed.png',
            '/assets/PixelSpaceRage/128px/Enemy01_Green_Frame_2_png_processed.png',
            '/assets/PixelSpaceRage/128px/Enemy01_Green_Frame_3_png_processed.png',
        ],
    },
    explosions: Array.from(
        { length: 9 },
        (_, i) => `/assets/PixelSpaceRage/128px/Explosion01_Frame_0${i + 1}_png_processed.png`
    ),
    powerups: {
        health: '/assets/PixelSpaceRage/128px/Powerup_Health_png_processed.png',
        shield: '/assets/PixelSpaceRage/128px/Powerup_Shields_png_processed.png',
        ammo: '/assets/PixelSpaceRage/128px/Powerup_Ammo_png_processed.png',
    },
    projectiles: {
        laser: '/assets/PixelSpaceRage/128px/Laser_Small_png_processed.png',
        plasma: '/assets/PixelSpaceRage/128px/Plasma_Small_png_processed.png',
    },
    audio: {
        bgMusic: '/assets/SpaceMusicPack/battle.wav',
        menuMusic: '/assets/SpaceMusicPack/menu.wav',
        laser: '/assets/laserSound.wav',
        explosion: '/assets/explosionSound.wav',
        powerup: '/assets/powerupSound.wav',
    },
};

// Console explosion
console.log('Explosions assets loaded:', ASSETS.explosions);

// CSS Colors
export const COLORS = {
    HEALTH: '#4f4',
    SHIELD: '#44f',
    ENERGY: '#4af',
    AMMO: '#f44',
    COMBO: '#f4f',
};

// Tutorial steps
export const TUTORIAL_STEPS = [
    {
        id: 'movement',
        text: 'Use ARROW KEYS to move',
        condition: () => true,
        position: 'center',
    },
    {
        id: 'shooting',
        text: 'Press SPACE to shoot',
        condition: () => true,
        position: 'bottom',
    },
    {
        id: 'dash',
        text: 'Press SHIFT to dash',
        condition: () => true,
        position: 'left',
    },
    {
        id: 'powerups',
        text: 'Collect power-ups to restore health and energy',
        condition: gameState => gameState.powerups.length > 0,
        position: 'right',
    },
    {
        id: 'combo',
        text: 'Destroy enemies quickly to build combos',
        condition: gameState => gameState.enemies.length >= 2,
        position: 'top',
    },
];

export const INITIAL_GAME_STATE = {
    score: 0,
    health: GAME_CONFIG.PLAYER.INITIAL_HEALTH,
    energy: GAME_CONFIG.PLAYER.INITIAL_ENERGY,
    isGameOver: false,
    entities: [],
    projectiles: [],
    enemies: [],
    powerups: [],
    explosions: [],
    lastSpawnTime: 0,
    spawnInterval: GAME_CONFIG.ENEMY.SPAWN_INTERVAL,
    animationFrame: 0,
    dashCooldown: 0,
    maxDashCooldown: GAME_CONFIG.DASH.MAX_COOLDOWN,
    lastComboTime: 0,
    comboCount: 0,
    comboTimeout: GAME_CONFIG.COMBO.TIMEOUT,
};
