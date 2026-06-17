import { gsap } from 'gsap';
import GameState from './gameState.js';
import { MenuState } from './menuState.js';
import { PlayingState } from './playingState.js';
import storage from '../utils/storage.js';
import achievementManager from '../utils/achievements.js';

export class GameOverState extends GameState {
    enter() {
        const screen = document.getElementById('gameOver');
        screen.style.display = 'flex';

        this._addEffects();
        this._updateHighScores();
        this._updateGameStats();
        this._setupButtons();
        this._animate();
    }

    exit() {
        document.getElementById('gameOver').style.display = 'none';
        this._cleanupEffects();
        document.getElementById('restartGame').onclick  = null;
        document.getElementById('returnToMenu').onclick = null;
        // Reset high score badge for next time
        document.getElementById('highScoresBadge').style.display = 'none';
    }

    _setupButtons() {
        document.getElementById('restartGame').onclick = () => {
            gsap.to('.gameover-panel', {
                scale: 0.88, opacity: 0, duration: 0.28, ease: 'power2.in',
                onComplete: () => this.game.setState(new PlayingState(this.game))
            });
        };
        document.getElementById('returnToMenu').onclick = () => {
            gsap.to('.gameover-panel', {
                scale: 0.88, opacity: 0, duration: 0.28, ease: 'power2.in',
                onComplete: () => this.game.setState(new MenuState(this.game))
            });
        };
    }

    _animate() {
        const score = this.game.gameState.score;
        const counter = { val: 0 };

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.gameover-panel', {
            scale: 1.08, opacity: 0, duration: 0.5
        })
        .from('#gameoverTitle', {
            y: -30, opacity: 0, duration: 0.55, ease: 'power4.out'
        }, '-=0.25')
        .from('.gameover-subtitle', {
            opacity: 0, duration: 0.4
        }, '-=0.2')
        .from('.final-score-label', {
            opacity: 0, y: 10, duration: 0.4
        }, '-=0.1')
        .to(counter, {
            val: score,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: () => {
                document.getElementById('finalScore').textContent =
                    Math.round(counter.val).toLocaleString();
            }
        }, '-=0.1')
        .from('.gameover-buttons .menu-btn', {
            y: 24, opacity: 0, stagger: 0.12, duration: 0.45, ease: 'back.out(1.6)'
        }, '-=0.6')
        .from('.panel-corner', {
            scale: 0, opacity: 0, duration: 0.3, stagger: 0.05, ease: 'back.out(2)'
        }, 0.1);

        // Glitch pulse on title
        gsap.to('#gameoverTitle', {
            textShadow: '0 0 40px rgba(255,45,85,0.8), 0 0 80px rgba(255,45,85,0.4)',
            duration: 0.8, repeat: -1, yoyo: true, delay: 0.6, ease: 'sine.inOut'
        });
    }

    _updateHighScores() {
        const score = this.game.gameState.score;
        if (storage.isNewHighScore(score)) {
            storage.saveHighScore(score);
            // Reveal badge with animation after score counts up
            gsap.delayedCall(1.6, () => {
                const badge = document.getElementById('highScoresBadge');
                badge.style.display = 'block';
                gsap.from(badge, {
                    scale: 0.5, opacity: 0, duration: 0.45, ease: 'back.out(1.8)'
                });
            });
        }
    }

    _updateGameStats() {
        const gs = this.game.gameState;
        storage.updateStats({
            gamesPlayed:       (storage.getStats().gamesPlayed || 0) + 1,
            totalScore:        (storage.getStats().totalScore  || 0) + gs.score,
            enemiesDefeated:   (storage.getStats().enemiesDefeated || 0) + (gs.enemiesDefeated || 0),
            powerupsCollected: (storage.getStats().powerupsCollected || 0) + (gs.powerupsCollected || 0),
            highestCombo:      Math.max(storage.getStats().highestCombo || 0, gs.maxCombo || 0)
        });
        this._checkAchievements();
    }

    _checkAchievements() {
        const score = this.game.gameState.score;
        if (score >= 1000) achievementManager.unlock('HIGH_SCORE_1000');
        if (score >= 5000) achievementManager.unlock('HIGH_SCORE_5000');
        if (this.game.gameState.damageTaken === 0) achievementManager.unlock('PERFECT_ROUND');
    }

    _addEffects() {
        document.getElementById('gameContainer').classList.add('game-over-effect');
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.style.cssText = `
            position: absolute; inset: 0; pointer-events: none;
            background: radial-gradient(ellipse at center, transparent 40%, rgba(255,45,85,0.08) 100%);
            z-index: 48;
        `;
        document.getElementById('gameContainer').appendChild(overlay);
    }

    _cleanupEffects() {
        document.getElementById('gameContainer').classList.remove('game-over-effect');
        document.querySelector('.game-over-overlay')?.remove();
        gsap.killTweensOf('#gameoverTitle');
    }

    update() {
        if (this.game.gameState.explosions.length > 0) {
            this.game.gameState.explosions = this.game.gameState.explosions.filter(ex => {
                ex.update();
                return !ex.isComplete;
            });
        }
    }

    render() {
        this.game.renderer.render(this.game.gameState, this.game.player);
        const ctx = this.game.renderer.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

export default GameOverState;
