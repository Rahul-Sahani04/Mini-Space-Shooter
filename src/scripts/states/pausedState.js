import { gsap } from 'gsap';
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
        this._keyHandler = this._handleKey.bind(this);
    }

    enter() {
        this.savedGameState = { ...this.game.gameState };
        this._createOverlay();
        this._pauseSounds();
        document.getElementById('gameContainer').classList.add('game-paused');
        document.addEventListener('keydown', this._keyHandler);
        this._loadSettings();
    }

    exit() {
        if (this.overlay) { this.overlay.remove(); this.overlay = null; }
        document.getElementById('gameContainer').classList.remove('game-paused');
        document.removeEventListener('keydown', this._keyHandler);
    }

    _handleKey(e) {
        if (e.code === 'Escape') this._resume();
    }

    _createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'pause-overlay';
        this.overlay.innerHTML = `
            <div class="glass-panel pause-panel" id="pausePanel">
                <div class="panel-corner tl"></div>
                <div class="panel-corner tr"></div>
                <div class="panel-corner bl"></div>
                <div class="panel-corner br"></div>
                <h1 class="pause-title">PAUSED</h1>
                <p class="pause-subtitle">Mission Suspended</p>
                <div class="menu-buttons">
                    <button class="menu-btn btn-primary" id="resumeBtn">
                        <i class="fas fa-play btn-icon"></i>
                        <span>Resume Mission</span>
                        <div class="btn-glow"></div>
                    </button>
                    <button class="menu-btn" id="optionsBtn">
                        <i class="fas fa-sliders-h btn-icon"></i>
                        <span>Tactical Options</span>
                        <div class="btn-glow"></div>
                    </button>
                    <button class="menu-btn" id="quitBtn">
                        <i class="fas fa-door-open btn-icon"></i>
                        <span>Abort Mission</span>
                        <div class="btn-glow"></div>
                    </button>
                </div>
            </div>`;

        this.overlay.querySelector('#resumeBtn').onclick  = () => this._resume();
        this.overlay.querySelector('#optionsBtn').onclick = () => this._showOptions();
        this.overlay.querySelector('#quitBtn').onclick    = () => this._quit();

        document.getElementById('gameContainer').appendChild(this.overlay);

        // Entrance animation
        const panel = this.overlay.querySelector('#pausePanel');
        gsap.from(panel, { scale: 0.82, opacity: 0, duration: 0.38, ease: 'back.out(1.7)' });
        gsap.from(this.overlay.querySelectorAll('.menu-btn'), {
            x: -36, opacity: 0, stagger: 0.1, duration: 0.38, delay: 0.15, ease: 'power2.out'
        });
        gsap.from(this.overlay.querySelectorAll('.panel-corner'), {
            scale: 0, opacity: 0, stagger: 0.05, duration: 0.3, delay: 0.05, ease: 'back.out(2)'
        });
    }

    _resume() {
        gsap.to(this.overlay.querySelector('#pausePanel'), {
            scale: 0.88, opacity: 0, duration: 0.22, ease: 'power2.in',
            onComplete: () => {
                this._resumeSounds();
                this.game.setState(new PlayingState(this.game));
            }
        });
    }

    _quit() {
        if (confirm('Abort mission? All progress will be lost.')) {
            this.game.setState(new MenuState(this.game));
        }
    }

    _showOptions() {
        const settings = storage.getSettings();
        const panel = document.createElement('div');
        panel.className = 'pause-overlay';
        panel.innerHTML = `
            <div class="glass-panel options-panel" id="optionsPanel">
                <div class="panel-corner tl"></div>
                <div class="panel-corner tr"></div>
                <div class="panel-corner bl"></div>
                <div class="panel-corner br"></div>
                <h2 class="options-title">OPTIONS</h2>
                <div class="options-grid">
                    <div class="option-row">
                        <label class="option-label" for="musicVolume">MUSIC VOLUME</label>
                        <input type="range" id="musicVolume" min="0" max="100"
                            value="${(settings.musicVolume || 0.5) * 100}">
                    </div>
                    <div class="option-row">
                        <label class="option-label range-purple" for="sfxVolume"
                            style="color: var(--c-purple)">SFX VOLUME</label>
                        <input type="range" id="sfxVolume" min="0" max="100"
                            class="range-purple" value="${(settings.sfxVolume || 0.8) * 100}">
                    </div>
                    <div class="option-row">
                        <label class="option-label" for="difficulty">DIFFICULTY</label>
                        <select id="difficulty">
                            <option value="easy"   ${settings.difficulty === 'easy'   ? 'selected' : ''}>Easy</option>
                            <option value="normal" ${settings.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="hard"   ${settings.difficulty === 'hard'   ? 'selected' : ''}>Hard</option>
                        </select>
                    </div>
                    <div class="toggle-row">
                        <input type="checkbox" id="showTutorial" ${settings.showTutorial ? 'checked' : ''}>
                        <label for="showTutorial">Show Tutorial</label>
                    </div>
                </div>
                <button class="sc-modal-close" id="saveOptions">SAVE & CLOSE</button>
            </div>`;

        panel.querySelector('#musicVolume').addEventListener('input', (e) => {
            audioManager.setMusicVolume(e.target.value / 100);
        });
        panel.querySelector('#sfxVolume').addEventListener('input', (e) => {
            audioManager.setSFXVolume(e.target.value / 100);
        });
        panel.querySelector('#saveOptions').onclick = () => {
            storage.saveSettings({
                musicVolume:  panel.querySelector('#musicVolume').value  / 100,
                sfxVolume:    panel.querySelector('#sfxVolume').value    / 100,
                showTutorial: panel.querySelector('#showTutorial').checked,
                difficulty:   panel.querySelector('#difficulty').value
            });
            gsap.to(panel.querySelector('#optionsPanel'), {
                scale: 0.88, opacity: 0, duration: 0.2, ease: 'power2.in',
                onComplete: () => panel.remove()
            });
        };

        document.getElementById('gameContainer').appendChild(panel);
        gsap.from(panel.querySelector('#optionsPanel'), {
            scale: 0.84, opacity: 0, duration: 0.35, ease: 'back.out(1.7)'
        });
    }

    _loadSettings() {
        const settings = storage.getSettings();
        audioManager.setMusicVolume(settings.musicVolume ?? 0.5);
        audioManager.setSFXVolume(settings.sfxVolume ?? 0.8);
    }

    _pauseSounds()  { audioManager.pauseAll(); }
    _resumeSounds() { audioManager.resumeAll(); }

    update() {
        this.game.gameState.explosions.forEach(ex => ex.update());
    }

    render() {
        this.game.renderer.render(this.savedGameState, this.game.player);
        const ctx = this.game.renderer.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export default PausedState;
