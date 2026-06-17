import { gsap } from 'gsap';
import { UPGRADE_CATALOG } from '../utils/upgradeData.js';

export class UpgradePicker {
    constructor(game, onPick) {
        this.game   = game;
        this.onPick = onPick;
        this._el    = null;
        this._build();
        this._animateIn();
    }

    _sample(gameState) {
        const pool = UPGRADE_CATALOG.filter(u =>
            !u.available || u.available(gameState)
        );
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(3, shuffled.length));
    }

    _build() {
        const gs    = this.game.gameState;
        const picks = this._sample(gs);

        this._el = document.createElement('div');
        this._el.className = 'upgrade-overlay';
        this._el.innerHTML = `
            <div class="upgrade-header">
                <div class="upgrade-header-eyebrow">Level Up</div>
                <div class="upgrade-header-level">LEVEL ${gs.playerLevel}</div>
                <div class="upgrade-header-sub">Choose an upgrade</div>
            </div>
            <div class="upgrade-cards"></div>`;

        const cardsEl = this._el.querySelector('.upgrade-cards');
        picks.forEach(upgrade => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.style.setProperty('--uc', upgrade.color);
            card.innerHTML = `
                <div class="uc-stripe"></div>
                <i class="fas ${upgrade.icon} uc-icon"></i>
                <div class="uc-label">${upgrade.label}</div>
                <div class="uc-desc">${upgrade.desc}</div>
                <div class="uc-rarity rarity-${upgrade.rarity}">${upgrade.rarity}</div>`;
            card.onclick = () => this._select(card, upgrade);
            cardsEl.appendChild(card);
        });

        document.getElementById('gameContainer').appendChild(this._el);
    }

    _animateIn() {
        gsap.from(this._el, { opacity: 0, duration: 0.3 });
        gsap.from(this._el.querySelector('.upgrade-header'), {
            y: -24, opacity: 0, duration: 0.45, ease: 'power3.out', delay: 0.1
        });
        gsap.from(this._el.querySelectorAll('.upgrade-card'), {
            y: 56, opacity: 0, scale: 0.86, duration: 0.5,
            stagger: 0.1, ease: 'back.out(1.7)', delay: 0.18
        });
    }

    _select(cardEl, upgrade) {
        // Prevent double-click during animation
        this._el.querySelectorAll('.upgrade-card').forEach(c => (c.onclick = null));

        const others = [...this._el.querySelectorAll('.upgrade-card')].filter(c => c !== cardEl);
        const tl = gsap.timeline({
            onComplete: () => {
                this.onPick(upgrade);
                this._el.remove();
            }
        });

        tl.to(others, { opacity: 0, scale: 0.9, y: 10, duration: 0.22 }, 0)
          .to(cardEl,  { scale: 1.08, duration: 0.18, ease: 'power2.out' }, 0)
          .to(cardEl,  { scale: 0.88, opacity: 0, duration: 0.28, ease: 'power2.in' }, '+=0.08')
          .to(this._el, { opacity: 0, duration: 0.22 }, '-=0.15');
    }

    remove() {
        this._el?.remove();
    }
}
