import { gsap } from 'gsap';
import GameState from './gameState.js';
import { PlayingState } from './playingState.js';

export class MenuState extends GameState {
    enter() {
        const menu = document.getElementById('mainMenu');
        menu.style.display = 'flex';

        // Wire buttons (replace previous handlers cleanly)
        document.getElementById('startGame').onclick = () => {
            this._exitAnimate(() => this.game.setState(new PlayingState(this.game)));
        };
        document.getElementById('controlsButton').onclick = () => this.showControls();
        document.getElementById('aboutButton').onclick    = () => this.showAbout();

        this._enterAnimate();
        this._setupParallax();
    }

    exit() {
        document.getElementById('mainMenu').style.display = 'none';
    }

    _enterAnimate() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('#menuTitle', {
            y: -60, opacity: 0, duration: 0.75, skewY: -4
        })
        .from('#menuSubtitle', {
            opacity: 0, letterSpacing: '1.5em', duration: 0.6, ease: 'power2.out'
        }, '-=0.35')
        .from('.title-divider', {
            scaleX: 0, opacity: 0, duration: 0.5, transformOrigin: 'center'
        }, '-=0.3')
        .from('#menuButtons .menu-btn', {
            x: -48, opacity: 0, duration: 0.45, stagger: 0.1, ease: 'power2.out'
        }, '-=0.2')
        .from('.menu-footer', {
            opacity: 0, y: 8, duration: 0.4
        }, '-=0.15')
        .from('.panel-corner', {
            scale: 0, opacity: 0, duration: 0.35, stagger: 0.06, ease: 'back.out(2)'
        }, 0.1);
    }

    _exitAnimate(cb) {
        gsap.to('#menuButtons .menu-btn', {
            x: -40, opacity: 0, duration: 0.25, stagger: 0.06,
            ease: 'power2.in', onComplete: cb
        });
    }

    _setupParallax() {
        document.querySelectorAll('.parallax-layer').forEach((layer, i) => {
            layer.style.animationDuration = `${20 + i * 12}s`;
        });
    }

    showControls() {
        const overlay = document.createElement('div');
        overlay.className = 'sc-modal-overlay';
        overlay.innerHTML = `
            <div class="sc-modal glass-panel">
                <div class="panel-corner tl"></div>
                <div class="panel-corner tr"></div>
                <div class="panel-corner bl"></div>
                <div class="panel-corner br"></div>
                <h2 class="sc-modal-title">CONTROLS</h2>
                <div class="sc-divider"></div>
                <ul class="controls-list">
                    <li><span class="key-badge">ARROW KEYS</span>Move ship</li>
                    <li><span class="key-badge">SPACE</span>Fire weapons</li>
                    <li><span class="key-badge">SHIFT</span>Dash / evade</li>
                    <li><span class="key-badge">ESC</span>Pause mission</li>
                </ul>
                <button class="sc-modal-close">CLOSE</button>
            </div>`;

        document.body.appendChild(overlay);
        gsap.from(overlay.querySelector('.sc-modal'), {
            scale: 0.85, opacity: 0, duration: 0.35, ease: 'back.out(1.6)'
        });

        const close = () => {
            gsap.to(overlay.querySelector('.sc-modal'), {
                scale: 0.88, opacity: 0, duration: 0.22, ease: 'power2.in',
                onComplete: () => overlay.remove()
            });
        };
        overlay.querySelector('.sc-modal-close').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    }

    showAbout() {
        const overlay = document.createElement('div');
        overlay.className = 'sc-modal-overlay';
        overlay.innerHTML = `
            <div class="sc-modal glass-panel">
                <div class="panel-corner tl"></div>
                <div class="panel-corner tr"></div>
                <div class="panel-corner bl"></div>
                <div class="panel-corner br"></div>
                <h2 class="sc-modal-title">ABOUT</h2>
                <div class="sc-divider"></div>
                <div class="about-rows">
                    <div class="about-row">
                        <span class="about-row-label">GAME</span>
                        <span class="about-row-value">Stellar Conflict</span>
                    </div>
                    <div class="about-row">
                        <span class="about-row-label">VERSION</span>
                        <span class="about-row-value">1.0.0</span>
                    </div>
                    <div class="about-row">
                        <span class="about-row-label">ENGINE</span>
                        <span class="about-row-value">HTML5 Canvas + GSAP</span>
                    </div>
                    <div class="about-row">
                        <span class="about-row-label">ENEMIES</span>
                        <span class="about-row-value">Red, Green, Charger</span>
                    </div>
                    <div class="about-row">
                        <span class="about-row-label">BUILD</span>
                        <span class="about-row-value">Vite + Vanilla JS</span>
                    </div>
                </div>
                <button class="sc-modal-close">CLOSE</button>
            </div>`;

        document.body.appendChild(overlay);
        gsap.from(overlay.querySelector('.sc-modal'), {
            scale: 0.85, opacity: 0, duration: 0.35, ease: 'back.out(1.6)'
        });

        const close = () => {
            gsap.to(overlay.querySelector('.sc-modal'), {
                scale: 0.88, opacity: 0, duration: 0.22, ease: 'power2.in',
                onComplete: () => overlay.remove()
            });
        };
        overlay.querySelector('.sc-modal-close').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    }

    update() {}

    render() {
        const ctx = this.game.renderer.ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.game.renderer.drawStarfield(this.game.stars);
    }
}

export default MenuState;
