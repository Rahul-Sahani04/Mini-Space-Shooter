import { Game } from './game.js';
import { GameRenderer } from './renderer.js';
import { AssetManager } from './assetManager.js';

// Export classes individually
export {
    Game,
    GameRenderer,
    AssetManager
};

// Export core game constants
export const CoreConfig = {
    // Default canvas size
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
    
    // Game loop settings
    TARGET_FPS: 60,
    TIME_STEP: 1000 / 60,
    MAX_FRAME_SKIP: 10,
    
    // Debug settings
    DEBUG_MODE: false,
    SHOW_FPS: false,
    SHOW_HITBOXES: false,
    SHOW_GRID: false,
    
    // Rendering settings
    PIXEL_RATIO: window.devicePixelRatio || 1,
    SMOOTH_IMAGES: false,
    USE_WEBGL: false, // Future implementation
    
    // Asset settings
    ASSET_PATH: './assets/',
    AUDIO_ENABLED: true,
    PRELOAD_ASSETS: true,
    
    // Performance settings
    MAX_PARTICLES: 1000,
    MAX_POOLED_OBJECTS: 100,
    SPATIAL_GRID_SIZE: 64,
    CULL_DISTANCE: 100
};

// Export performance monitoring utilities
export const Performance = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    renderTime: 0,
    particleCount: 0,
    entityCount: 0,
    drawCalls: 0,
    
    reset() {
        this.fps = 0;
        this.frameTime = 0;
        this.updateTime = 0;
        this.renderTime = 0;
        this.particleCount = 0;
        this.entityCount = 0;
        this.drawCalls = 0;
    },
    
    startFrame() {
        this.frameStart = performance.now();
    },
    
    endFrame() {
        this.frameTime = performance.now() - this.frameStart;
        this.fps = Math.round(1000 / this.frameTime);
    }
};

// Export initialization helper
export async function initializeGame(config = {}) {
    try {
        // Create game instance
        const game = new Game({
            ...CoreConfig,
            ...config
        });

        // Create and initialize asset manager
        const assetManager = new AssetManager();
        await assetManager.loadAll();

        // Create renderer
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const renderer = new GameRenderer(canvas, ctx);

        // Initialize game with dependencies
        game.initialize(assetManager, renderer);

        return game;
    } catch (error) {
        console.error('Failed to initialize game:', error);
        throw error;
    }
}

// Export core components as default object
export default {
    Game,
    GameRenderer,
    AssetManager,
    CoreConfig,
    Performance,
    initializeGame
};