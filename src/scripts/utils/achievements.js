import storage from './storage.js';
import { EventEmitter } from './helpers.js';

// Define achievements
export const ACHIEVEMENTS = {
    FIRST_KILL: {
        id: 'FIRST_KILL',
        title: 'First Blood',
        description: 'Destroy your first enemy',
        icon: '🎯'
    },
    COMBO_MASTER: {
        id: 'COMBO_MASTER',
        title: 'Combo Master',
        description: 'Achieve a 10x combo',
        icon: '⚡'
    },
    SURVIVOR: {
        id: 'SURVIVOR',
        title: 'Survivor',
        description: 'Survive for 5 minutes',
        icon: '🛡️'
    },
    SHARPSHOOTER: {
        id: 'SHARPSHOOTER',
        title: 'Sharpshooter',
        description: 'Achieve 90% accuracy with 50+ shots',
        icon: '🎯'
    },
    POWERUP_COLLECTOR: {
        id: 'POWERUP_COLLECTOR',
        title: 'Power Hungry',
        description: 'Collect 20 power-ups in one game',
        icon: '⭐'
    },
    HIGH_SCORE_1000: {
        id: 'HIGH_SCORE_1000',
        title: 'Score Master',
        description: 'Reach a score of 1,000 points',
        icon: '🏆'
    },
    HIGH_SCORE_5000: {
        id: 'HIGH_SCORE_5000',
        title: 'Score Legend',
        description: 'Reach a score of 5,000 points',
        icon: '👑'
    },
    PERFECT_ROUND: {
        id: 'PERFECT_ROUND',
        title: 'Perfect Round',
        description: 'Complete a level without taking damage',
        icon: '✨'
    }
};

class AchievementManager extends EventEmitter {
    constructor() {
        super();
        this.achievements = new Map(Object.entries(ACHIEVEMENTS));
        this.unlockedAchievements = new Set(storage.getAchievements());
        this.trackers = new Map();
        this.setupTrackers();
    }

    setupTrackers() {
        // Track enemy kills
        this.addTracker('enemyKilled', (data) => {
            const stats = storage.getStats();
            if (stats.enemiesDefeated === 0) {
                this.unlock('FIRST_KILL');
            }
        });

        // Track combos
        this.addTracker('comboUpdated', (comboCount) => {
            if (comboCount >= 10) {
                this.unlock('COMBO_MASTER');
            }
        });

        // Track survival time
        this.addTracker('timeUpdated', (timeInSeconds) => {
            if (timeInSeconds >= 300) { // 5 minutes
                this.unlock('SURVIVOR');
            }
        });

        // Track accuracy
        this.addTracker('accuracyUpdated', (data) => {
            if (data.totalShots > 50 && (data.hits / data.totalShots) >= 0.9) {
                this.unlock('SHARPSHOOTER');
            }
        });

        // Track power-ups
        this.addTracker('powerupCollected', (data) => {
            if (data.totalCollected >= 20) {
                this.unlock('POWERUP_COLLECTOR');
            }
        });

        // Track score
        this.addTracker('scoreUpdated', (score) => {
            if (score >= 1000) {
                this.unlock('HIGH_SCORE_1000');
            }
            if (score >= 5000) {
                this.unlock('HIGH_SCORE_5000');
            }
        });

        // Track perfect rounds
        this.addTracker('roundComplete', (data) => {
            if (data.damageTaken === 0) {
                this.unlock('PERFECT_ROUND');
            }
        });
    }

    addTracker(eventName, callback) {
        this.trackers.set(eventName, callback);
    }

    track(eventName, data) {
        const tracker = this.trackers.get(eventName);
        if (tracker) {
            tracker(data);
        }
    }

    unlock(achievementId) {
        if (this.unlockedAchievements.has(achievementId)) return;

        const achievement = this.achievements.get(achievementId);
        if (!achievement) return;

        this.unlockedAchievements.add(achievementId);
        storage.saveAchievement(achievementId);

        // Show achievement notification
        this.showNotification(achievement);

        // Emit achievement unlocked event
        this.emit('achievementUnlocked', achievement);
    }

    showNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Add animation class after a brief delay
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    isUnlocked(achievementId) {
        return this.unlockedAchievements.has(achievementId);
    }

    getProgress(achievementId) {
        // Implementation depends on specific achievement requirements
        return this.isUnlocked(achievementId) ? 100 : 0;
    }

    getAllAchievements() {
        return Array.from(this.achievements.values()).map(achievement => ({
            ...achievement,
            unlocked: this.isUnlocked(achievement.id),
            progress: this.getProgress(achievement.id)
        }));
    }
}

// Add achievement notification styles
const style = document.createElement('style');
style.textContent = `
    .achievement-notification {
        position: fixed;
        top: 20px;
        right: -300px;
        width: 280px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #4338ca;
        border-radius: 8px;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 15px;
        transition: transform 0.5s ease-in-out;
        z-index: 2000;
        backdrop-filter: blur(4px);
    }

    .achievement-notification.show {
        transform: translateX(-320px);
    }

    .achievement-icon {
        font-size: 32px;
        min-width: 40px;
        text-align: center;
    }

    .achievement-info {
        flex-grow: 1;
    }

    .achievement-title {
        color: #4338ca;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .achievement-description {
        color: #fff;
        font-size: 14px;
    }
`;

document.head.appendChild(style);

// Create singleton instance
const achievementManager = new AchievementManager();
export default achievementManager;