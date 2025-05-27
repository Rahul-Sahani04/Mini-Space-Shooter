import GameState from './gameState.js';
import { PlayingState } from './playingState.js';
import { MenuState } from './menuState.js';
import storage from '../utils/storage.js';
import audioManager from '../utils/audio.js';

export class PausedState extends GameState {
    constructor(game) {
        super(game);
        this.savedGameState = null;
        this.overlay = null;
        this.bindedKeyHandler = this.handleKeyPress.bind(this);
    }

    enter() {
        // Save current game state
        this.savedGameState = { ...this.game.gameState };
        
        // Create and show pause menu
        this.createPauseOverlay();
        
        // Pause all sounds
        this.pauseSounds();
        
        // Add blur effect to game
        document.getElementById('gameContainer').classList.add('game-paused');

        // Add keyboard listener
        document.addEventListener('keydown', this.bindedKeyHandler);

        // Load current settings
        this.loadSettings();
    }

    exit() {
        // Remove pause overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // Remove blur effect
        document.getElementById('gameContainer').classList.remove('game-paused');
        
        // Remove keyboard listener
        document.removeEventListener('keydown', this.bindedKeyHandler);
    }

    handleKeyPress(event) {
        if (event.code === 'Escape') {
            this.resumeGame();
        }
    }

    createPauseOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'pause-overlay';
        this.overlay.innerHTML = `
            <div class="pause-menu">
                <h2>PAUSED</h2>
                <div class="menu-buttons">
                    <button id="resumeButton" class="pause-button">Resume Game</button>
                    <button id="optionsButton" class="pause-button">Options</button>
                    <button id="quitButton" class="pause-button">Quit to Menu</button>
                </div>
            </div>
        `;

        // Add event listeners
        this.overlay.querySelector('#resumeButton').addEventListener('click', () => this.resumeGame());
        this.overlay.querySelector('#optionsButton').addEventListener('click', () => this.showOptions());
        this.overlay.querySelector('#quitButton').addEventListener('click', () => this.quitToMenu());

        document.getElementById('gameContainer').appendChild(this.overlay);
    }

    resumeGame() {
        this.game.setState(new PlayingState(this.game));
        this.resumeSounds();
    }

    quitToMenu() {
        if (confirm('Are you sure you want to quit? All progress will be lost.')) {
            this.game.setState(new MenuState(this.game));
        }
    }

    showOptions() {
        const settings = storage.getSettings();
        
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'options-menu';
        optionsMenu.innerHTML = `
            <div class="options-content">
                <h3>Options</h3>
                <div class="option-item">
                    <label for="musicVolume">Music Volume</label>
                    <input type="range" id="musicVolume" min="0" max="100" value="${settings.musicVolume * 100}">
                </div>
                <div class="option-item">
                    <label for="sfxVolume">Sound Effects Volume</label>
                    <input type="range" id="sfxVolume" min="0" max="100" value="${settings.sfxVolume * 100}">
                </div>
                <div class="option-item">
                    <label>
                        <input type="checkbox" id="showTutorial" ${settings.showTutorial ? 'checked' : ''}>
                        Show Tutorial
                    </label>
                </div>
                <div class="option-item">
                    <label>Difficulty</label>
                    <select id="difficulty">
                        <option value="easy" ${settings.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                        <option value="normal" ${settings.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
                        <option value="hard" ${settings.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                    </select>
                </div>
                <button id="closeOptions" class="pause-button">Save & Close</button>
            </div>
        `;

        // Add event listeners
        optionsMenu.querySelector('#musicVolume').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            audioManager.setMusicVolume(volume);
        });

        optionsMenu.querySelector('#sfxVolume').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            audioManager.setSFXVolume(volume);
        });

        optionsMenu.querySelector('#closeOptions').addEventListener('click', () => {
            this.saveSettings(optionsMenu);
            optionsMenu.remove();
        });

        document.getElementById('gameContainer').appendChild(optionsMenu);
    }

    loadSettings() {
        const settings = storage.getSettings();
        audioManager.setMusicVolume(settings.musicVolume);
        audioManager.setSFXVolume(settings.sfxVolume);
    }

    saveSettings(optionsMenu) {
        const settings = {
            musicVolume: optionsMenu.querySelector('#musicVolume').value / 100,
            sfxVolume: optionsMenu.querySelector('#sfxVolume').value / 100,
            showTutorial: optionsMenu.querySelector('#showTutorial').checked,
            difficulty: optionsMenu.querySelector('#difficulty').value
        };
        
        storage.saveSettings(settings);
    }

    pauseSounds() {
        audioManager.pauseAll();
    }

    resumeSounds() {
        audioManager.resumeAll();
    }

    update() {
        // Still update visual effects like particles
        if (this.game.gameState.explosions.length > 0) {
            this.game.gameState.explosions.forEach(explosion => explosion.update());
        }
    }

    render() {
        // Keep rendering the paused game state
        this.game.renderer.render(this.savedGameState, this.game.player);

        // Add pause overlay effect
        const ctx = this.game.renderer.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export default PausedState;