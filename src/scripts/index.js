import { Game } from './core/game.js';
import { audioManager, storage, achievementManager, utils } from './utils/index.js';
import * as gameStates from './states/index.js';
import * as entities from './entities/index.js';

// Setup error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showErrorMessage('An unexpected error occurred. Please refresh the page.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorMessage('Failed to load game resources. Please check your connection and refresh.');
});

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()">Refresh Page</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// Initialize game with configuration
async function startGame() {
    try {
        // Create and initialize game
        const game = new Game();
        await game.initialize();

        // Add event listeners for menu buttons
        document.getElementById('startGame').addEventListener('click', () => {
            if (game && game.currentState instanceof gameStates.MenuState) {
                game.setState(new gameStates.PlayingState(game));
            }
        });

        document.getElementById('restartGame').addEventListener('click', () => {
            if (game && game.currentState instanceof gameStates.GameOverState) {
                game.setState(new gameStates.PlayingState(game));
            }
        });

        // Make game instance globally available in debug mode
        const debugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
        if (debugMode) {
            window.game = game;
            window.debugTools = {
                states: gameStates,
                entities: entities,
                utils: utils,
                storage: storage,
                audio: audioManager,
                achievements: achievementManager
            };
        }

        // Setup mobile controls if needed
        if (utils.isTouchDevice()) {
            setupMobileControls(game);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            if (game && game.renderer) {
                const canvas = game.renderer.canvas;
                const gameContainer = document.getElementById('gameContainer');
                canvas.width = gameContainer.clientWidth;
                canvas.height = gameContainer.clientHeight;
            }
        });

        return game;

    } catch (error) {
        console.error('Failed to start game:', error);
        showErrorMessage('Failed to start game. Please refresh the page.');
        throw error;
    }
}

function setupMobileControls(game) {
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
                game.keys[control.key] = true;
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                game.keys[control.key] = false;
            });
        }
    });

    // Show mobile controls
    document.getElementById('mobileControls').style.display = 'flex';
}

// Start game when document is ready
document.addEventListener('DOMContentLoaded', () => {
    startGame().catch(error => {
        console.error('Failed to initialize game:', error);
    });
});

// Export game modules for development and testing
export {
    gameStates,
    entities,
    utils,
    storage,
    audioManager,
    achievementManager
};