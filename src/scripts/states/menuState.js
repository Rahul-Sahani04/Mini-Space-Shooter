import GameState from './gameState.js';
import { PlayingState } from './playingState.js';

export class MenuState extends GameState {
    enter() {
        // Show menu UI
        document.getElementById('mainMenu').style.display = 'flex';
        document.getElementById('gameOver').style.display = 'none';
        
        // Menu initialization code

        // Set up event listeners
        this.setupEventListeners();
        
        // Add menu animations
        this.setupMenuAnimation();
    }

    exit() {
        // Hide menu UI
        document.getElementById('mainMenu').style.display = 'none';
        
        // Menu cleanup code
    }

    setupEventListeners() {
        // Start game button
        document.getElementById('startGame').addEventListener('click', () => {
            this.game.setState(new PlayingState(this.game));
        });

        // Add other menu button listeners here
        // Controls button
        document.getElementById('controlsButton')?.addEventListener('click', () => {
            this.showControls();
        });

        // About button
        document.getElementById('aboutButton')?.addEventListener('click', () => {
            this.showAbout();
        });
    }

    setupMenuAnimation() {
        // Add parallax background effect
        const layers = document.querySelectorAll('.parallax-layer');
        layers.forEach((layer, index) => {
            layer.style.animationDuration = `${20 + index * 10}s`;
        });

        // Add title glow animation
        const title = document.querySelector('h1');
        if (title) {
            title.classList.add('glow-effect');
        }
    }

    showControls() {
        const controls = document.createElement('div');
        controls.className = 'modal';
        controls.innerHTML = `
            <div class="modal-content">
                <h2
                style="color: #4CAF50; font-size: 24px; text-align: center;"
                >Controls</h2>
                <ul>
                    <li>Arrow Keys: Move ship</li>
                    <li>Space: Fire</li>
                    <li>Shift: Dash</li>
                    <li>Esc: Pause game</li>
                </ul>
                <button class="close-button" style="margin-top: 20px; padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 5px;">Close</button>
            </div>
        `;
        document.body.appendChild(controls);

        controls.querySelector('.close-button').addEventListener('click', () => {
            controls.remove();
        });
    }

    showAbout() {
        const about = document.createElement('div');
        about.className = 'modal';
        about.innerHTML = `
            <div class="modal-content">
                <h2 style="color: #4CAF50; font-size: 24px; text-align: center;" >About</h2>
                <p>A space shooter game built with modern JavaScript.</p>
                <p>Version 1.2.0</p>
                <button class="close-button" style="margin-top: 20px; padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 5px;">Close</button>
            </div>
        `;
        document.body.appendChild(about);

        about.querySelector('.close-button').addEventListener('click', () => {
            about.remove();
        });
    }

    update() {
        // Update any menu animations or effects
    }

    render() {
        // Render menu background effects if any
        const ctx = this.game.renderer.ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export default MenuState;