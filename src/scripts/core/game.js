import { MenuState } from '../states/menuState.js';
import { PlayingState } from '../states/playingState.js';
import { GameOverState } from '../states/gameOverState.js';
import { PausedState } from '../states/pausedState.js';
import { GameRenderer } from './renderer.js';
import { AssetManager } from './assetManager.js';

export class Game {
    constructor() {
        this.currentState = null;
        this.gameState = null;
        this.player = null;
        this.tutorial = null;
        this.renderer = null;
        this.keys = {};
        this.objectPools = {
            projectiles: [],
            explosions: [],
            getFromPool: (poolName) => {
                if (this.objectPools[poolName]) {
                    return this.objectPools[poolName].find(obj => !obj.active);
                }
                return null;
            }
        };
        
        // Initialize keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape' && this.currentState instanceof PlayingState) {
                this.setState(new PausedState(this));
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());

        this.stars = [];
    }
    
    handleResize() {
        const canvas = document.getElementById('gameCanvas');
        const gameContainer = document.getElementById('gameContainer');
        if (canvas && gameContainer) {
            canvas.width = gameContainer.clientWidth;
            canvas.height = gameContainer.clientHeight;
        }
    }
    
    createStars() {
        const count = 100;
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 3 + 0.5,
                alpha: Math.random()
            });
        }
    }

    updateStars() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
    }

    async initialize() {
        try {
            // Show loading screen
            document.getElementById('loadingScreen').style.display = 'flex';
            document.getElementById('mainMenu').style.display = 'none';
            document.getElementById('gameOver').style.display = 'none';
            
            // Initialize canvas and renderer
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            const gameContainer = document.getElementById('gameContainer');
            canvas.width = gameContainer.clientWidth;
            canvas.height = gameContainer.clientHeight;

            // Initialize asset manager and load assets
            this.assetManager = new AssetManager();
            await this.assetManager.loadAll();

            // Create renderer
            this.renderer = new GameRenderer(canvas, ctx, this.assetManager);
            
            this.createStars();
            
            // Start game loop
            this.gameLoop();
            
            // Start with menu state
            this.setState(new MenuState(this));
            
            // Hide loading screen and show menu
            document.getElementById('loadingScreen').style.display = 'none';
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            document.getElementById('loadingText').textContent = 
                'Failed to initialize game. Please refresh the page.';
            document.getElementById('loadingProgress').style.backgroundColor = '#ef4444';
        }
    }

    setState(newState) {
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = newState;
        this.currentState.enter();
    }

    gameLoop = () => {
        this.updateStars();
        if (this.currentState) {
            this.currentState.update();
            this.currentState.render();
        }
        requestAnimationFrame(this.gameLoop);
    }
}

export default Game;