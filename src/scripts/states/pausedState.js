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
        this.overlay.className = 'absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50';
        this.overlay.innerHTML = `
            <div class="glass-panel flex flex-col items-center">
                <div class="title-container">
                    <h1 class="main-title" style="font-size: 4rem;">PAUSED</h1>
                    <div class="subtitle">Mission Suspended</div>
                </div>
                <div class="flex flex-col space-y-6 w-72">
                    <button id="resumeButton" class="menu-button">Resume Mission</button>
                    <button id="optionsButton" class="menu-button">Tactical Options</button>
                    <button id="quitButton" class="menu-button">Abort Mission</button>
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
        optionsMenu.className = 'absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80';
        optionsMenu.innerHTML = `
            <div class="glass-panel flex flex-col items-center">
                <div class="title-container">
                    <h2 class="main-title" style="font-size: 3rem;">OPTIONS</h2>
                </div>
                
                <div class="w-full space-y-6 mb-8 text-white">
                    <div class="flex flex-col space-y-2">
                        <label for="musicVolume" class="text-cyan-400 font-bold tracking-wider">MUSIC VOLUME</label>
                        <input type="range" id="musicVolume" min="0" max="100" value="${settings.musicVolume * 100}" class="w-full accent-cyan-500">
                    </div>
                    
                    <div class="flex flex-col space-y-2">
                        <label for="sfxVolume" class="text-secondary font-bold tracking-wider" style="color: #bc13fe;">SFX VOLUME</label>
                        <input type="range" id="sfxVolume" min="0" max="100" value="${settings.sfxVolume * 100}" class="w-full accent-purple-500">
                    </div>
                    
                    <div class="flex items-center space-x-3 mt-4">
                        <input type="checkbox" id="showTutorial" ${settings.showTutorial ? 'checked' : ''} class="w-6 h-6 accent-cyan-500">
                        <label for="showTutorial" class="text-white font-bold tracking-wider">SHOW TUTORIAL</label>
                    </div>

                    <div class="flex flex-col space-y-2">
                        <label class="text-cyan-400 font-bold tracking-wider">DIFFICULTY</label>
                        <select id="difficulty" class="bg-gray-900 border border-cyan-500 text-white p-2 rounded">
                            <option value="easy" ${settings.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                            <option value="normal" ${settings.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="hard" ${settings.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                        </select>
                    </div>
                </div>

                <button id="closeOptions" class="menu-button">Save & Close</button>
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