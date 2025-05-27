import GameState from './gameState.js';
import { MenuState } from './menuState.js';
import { PlayingState } from './playingState.js';
import storage from '../utils/storage.js';
import achievementManager from '../utils/achievements.js';

export class GameOverState extends GameState {
    enter() {
        // Show game over screen
        document.getElementById('gameOver').style.display = 'flex';
        document.getElementById('finalScore').textContent = this.game.gameState.score;
        
        // Add game over effects
        this.addGameOverEffects();

        // Stop game music and play game over sound
        const bgMusic = this.game.assetManager.getAudio('bgMusic');
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }

        // Update high scores
        this.updateHighScores();

        // Update game statistics
        this.updateGameStats();

        // Setup event listeners
        this.setupEventListeners();
    }

    exit() {
        // Hide game over screen
        document.getElementById('gameOver').style.display = 'none';

        // Clean up effects
        this.cleanupEffects();

        // Remove event listeners
        this.removeEventListeners();
    }

    setupEventListeners() {
        // Restart button
        this.restartHandler = () => this.game.setState(new PlayingState(this.game));
        document.getElementById('restartGame').addEventListener('click', this.restartHandler);

        // Menu button
        this.menuHandler = () => this.game.setState(new MenuState(this.game));
        document.getElementById('returnToMenu')?.addEventListener('click', this.menuHandler);
    }

    removeEventListeners() {
        document.getElementById('restartGame').removeEventListener('click', this.restartHandler);
        document.getElementById('returnToMenu')?.removeEventListener('click', this.menuHandler);
    }

    updateHighScores() {
        const score = this.game.gameState.score;
        
        // Check if it's a new high score
        if (storage.isNewHighScore(score)) {
            storage.saveHighScore(score);
            this.showNewHighScoreEffect();
        }

        // Update high scores display
        this.updateHighScoresDisplay();
    }

    updateGameStats() {
        const gameState = this.game.gameState;
        
        storage.updateStats({
            gamesPlayed: storage.getStats().gamesPlayed + 1,
            totalScore: storage.getStats().totalScore + gameState.score,
            enemiesDefeated: storage.getStats().enemiesDefeated + gameState.enemiesDefeated,
            powerupsCollected: storage.getStats().powerupsCollected + gameState.powerupsCollected,
            highestCombo: Math.max(storage.getStats().highestCombo, gameState.maxCombo)
        });

        // Check for achievements
        this.checkAchievements();
    }

    checkAchievements() {
        const gameState = this.game.gameState;
        
        // Check score achievements
        if (gameState.score >= 1000) {
            achievementManager.unlock('HIGH_SCORE_1000');
        }
        if (gameState.score >= 5000) {
            achievementManager.unlock('HIGH_SCORE_5000');
        }

        // Check perfect round achievement
        if (gameState.damageTaken === 0) {
            achievementManager.unlock('PERFECT_ROUND');
        }
    }

    showNewHighScoreEffect() {
        const highScoreEffect = document.createElement('div');
        highScoreEffect.className = 'new-high-score';
        highScoreEffect.textContent = 'NEW HIGH SCORE!';
        document.getElementById('gameOver').appendChild(highScoreEffect);
    }

    updateHighScoresDisplay() {
        const highScores = storage.getHighScores();
        const highScoresList = document.getElementById('highScores');
        
        if (highScoresList) {
            highScoresList.innerHTML = highScores
                .slice(0, 5)
                .map((score, index) => `
                    <li class="high-score-item">
                        <span class="rank">#${index + 1}</span>
                        <span class="score">${score.score}</span>
                        <span class="date">${new Date(score.date).toLocaleDateString()}</span>
                    </li>
                `)
                .join('');
        }
    }

    addGameOverEffects() {
        // Add slow-motion effect
        document.getElementById('gameContainer').classList.add('game-over-effect');

        // Add screen darkening
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        document.getElementById('gameContainer').appendChild(overlay);
    }

    cleanupEffects() {
        document.getElementById('gameContainer').classList.remove('game-over-effect');
        const overlay = document.querySelector('.game-over-overlay');
        const highScoreEffect = document.querySelector('.new-high-score');
        
        if (overlay) overlay.remove();
        if (highScoreEffect) highScoreEffect.remove();
    }

    update() {
        // Update any remaining explosions or effects
        if (this.game.gameState.explosions.length > 0) {
            this.game.gameState.explosions = this.game.gameState.explosions.filter(explosion => {
                explosion.update();
                return !explosion.isComplete;
            });
        }
    }

    render() {
        // Keep rendering the final game state
        this.game.renderer.render(this.game.gameState, this.game.player);

        // Add game over overlay effect
        const ctx = this.game.renderer.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export default GameOverState;