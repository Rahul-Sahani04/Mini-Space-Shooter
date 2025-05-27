class StorageManager {
    constructor() {
        this.prefix = 'stellar-conflict:';
        this.isAvailable = this.checkStorageAvailability();
    }

    checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('Local storage is not available:', e);
            return false;
        }
    }

    getKey(key) {
        return this.prefix + key;
    }

    set(key, value) {
        if (!this.isAvailable) return false;
        
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.getKey(key), serializedValue);
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        if (!this.isAvailable) return defaultValue;
        
        try {
            const value = localStorage.getItem(this.getKey(key));
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('Failed to load from storage:', error);
            return defaultValue;
        }
    }

    remove(key) {
        if (!this.isAvailable) return false;
        
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Failed to remove from storage:', error);
            return false;
        }
    }

    clear() {
        if (!this.isAvailable) return false;
        
        try {
            // Only clear items with our prefix
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    // High score management
    saveHighScore(score) {
        const highScores = this.getHighScores();
        highScores.push({
            score,
            date: new Date().toISOString()
        });
        
        // Sort by score descending and keep top 10
        highScores.sort((a, b) => b.score - a.score);
        const topScores = highScores.slice(0, 10);
        
        return this.set('highScores', topScores);
    }

    getHighScores() {
        return this.get('highScores', []);
    }

    isNewHighScore(score) {
        const highScores = this.getHighScores();
        if (highScores.length < 10) return true;
        return score > highScores[highScores.length - 1].score;
    }

    // Game settings management
    saveSettings(settings) {
        return this.set('settings', settings);
    }

    getSettings() {
        return this.get('settings', {
            musicVolume: 0.2,
            sfxVolume: 0.5,
            isMuted: false,
            showTutorial: true,
            difficulty: 'normal'
        });
    }

    // Game progress management
    saveProgress(data) {
        return this.set('gameProgress', {
            ...data,
            lastSaved: new Date().toISOString()
        });
    }

    getProgress() {
        return this.get('gameProgress', null);
    }

    clearProgress() {
        return this.remove('gameProgress');
    }

    // Achievement tracking
    saveAchievement(achievementId) {
        const achievements = this.getAchievements();
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            return this.set('achievements', achievements);
        }
        return true;
    }

    getAchievements() {
        return this.get('achievements', []);
    }

    hasAchievement(achievementId) {
        const achievements = this.getAchievements();
        return achievements.includes(achievementId);
    }

    // Game statistics
    updateStats(stats) {
        const currentStats = this.getStats();
        const updatedStats = {
            ...currentStats,
            ...stats,
            lastUpdated: new Date().toISOString()
        };
        return this.set('stats', updatedStats);
    }

    getStats() {
        return this.get('stats', {
            gamesPlayed: 0,
            totalScore: 0,
            totalTime: 0,
            enemiesDefeated: 0,
            powerupsCollected: 0,
            highestCombo: 0
        });
    }
}

// Create singleton instance
const storage = new StorageManager();
export default storage;