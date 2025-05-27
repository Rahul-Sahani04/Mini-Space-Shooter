import { TUTORIAL_STEPS } from './constants.js';

export class TutorialSystem {
    constructor(game) {
        this.game = game;
        this.shownHints = new Set();
        this.activeHints = new Map();
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tutorial-hint {
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                font-size: 16px;
                pointer-events: none;
                animation: hint-fade-in-out 3s forwards;
                z-index: 1000;
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .tutorial-hint.center {
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            }

            .tutorial-hint.top {
                left: 50%;
                top: 20%;
                transform: translateX(-50%);
            }

            .tutorial-hint.bottom {
                left: 50%;
                bottom: 20%;
                transform: translateX(-50%);
            }

            .tutorial-hint.left {
                left: 20%;
                top: 50%;
                transform: translateY(-50%);
            }

            .tutorial-hint.right {
                right: 20%;
                top: 50%;
                transform: translateY(-50%);
            }

            @keyframes hint-fade-in-out {
                0% {
                    opacity: 0;
                    transform: translate(var(--tx, -50%), var(--ty, -50%)) scale(0.8);
                }
                20% {
                    opacity: 1;
                    transform: translate(var(--tx, -50%), var(--ty, -50%)) scale(1);
                }
                80% {
                    opacity: 1;
                    transform: translate(var(--tx, -50%), var(--ty, -50%)) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(var(--tx, -50%), var(--ty, -50%)) scale(0.8);
                }
            }

            .tutorial-hint::before {
                content: '';
                position: absolute;
                width: 10px;
                height: 10px;
                background: inherit;
                border: inherit;
                transform: rotate(45deg);
            }

            .tutorial-hint.top::before {
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%) rotate(45deg);
            }

            .tutorial-hint.bottom::before {
                top: -6px;
                left: 50%;
                transform: translateX(-50%) rotate(45deg);
            }

            .tutorial-hint.left::before {
                right: -6px;
                top: 50%;
                transform: translateY(-50%) rotate(45deg);
            }

            .tutorial-hint.right::before {
                left: -6px;
                top: 50%;
                transform: translateY(-50%) rotate(45deg);
            }
        `;
        document.head.appendChild(style);
    }

    showHint(step) {
        if (this.shownHints.has(step.id)) return;

        const hint = document.createElement('div');
        hint.className = `tutorial-hint ${step.position}`;
        hint.textContent = step.text;
        
        // Set transform origin based on position
        switch (step.position) {
            case 'top':
                hint.style.setProperty('--tx', '-50%');
                hint.style.setProperty('--ty', '0%');
                break;
            case 'bottom':
                hint.style.setProperty('--tx', '-50%');
                hint.style.setProperty('--ty', '-100%');
                break;
            case 'left':
                hint.style.setProperty('--tx', '0%');
                hint.style.setProperty('--ty', '-50%');
                break;
            case 'right':
                hint.style.setProperty('--tx', '-100%');
                hint.style.setProperty('--ty', '-50%');
                break;
            default:
                hint.style.setProperty('--tx', '-50%');
                hint.style.setProperty('--ty', '-50%');
        }

        document.getElementById('gameContainer').appendChild(hint);

        this.shownHints.add(step.id);
        this.activeHints.set(step.id, hint);

        // Remove hint after animation
        setTimeout(() => {
            hint.remove();
            this.activeHints.delete(step.id);
        }, 3000);
    }

    update() {
        TUTORIAL_STEPS.forEach(step => {
            if (!this.shownHints.has(step.id) && step.condition(this.game.gameState)) {
                this.showHint(step);
            }
        });
    }

    reset() {
        this.shownHints.clear();
        this.activeHints.forEach(hint => hint.remove());
        this.activeHints.clear();
    }

    skip() {
        TUTORIAL_STEPS.forEach(step => {
            this.shownHints.add(step.id);
        });
        this.activeHints.forEach(hint => hint.remove());
        this.activeHints.clear();
    }
}

export default TutorialSystem;