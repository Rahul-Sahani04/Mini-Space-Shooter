import { describe, it, expect, beforeEach, vi } from 'vitest';
import storage from '../../scripts/utils/storage.js';

describe('StorageManager', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('basic storage operations', () => {
        it('should save and retrieve data', () => {
            const testData = { test: 'value' };
            expect(storage.set('test', testData)).toBe(true);
            expect(storage.get('test')).toEqual(testData);
        });

        it('should return default value when key not found', () => {
            const defaultValue = { default: true };
            expect(storage.get('nonexistent', defaultValue)).toEqual(defaultValue);
        });

        it('should remove data', () => {
            storage.set('test', 'value');
            expect(storage.remove('test')).toBe(true);
            expect(storage.get('test')).toBeNull();
        });

        it('should clear all data', () => {
            storage.set('test1', 'value1');
            storage.set('test2', 'value2');
            expect(storage.clear()).toBe(true);
            expect(storage.get('test1')).toBeNull();
            expect(storage.get('test2')).toBeNull();
        });
    });

    describe('high scores', () => {
        it('should save and retrieve high scores', () => {
            const score = 1000;
            storage.saveHighScore(score);
            const highScores = storage.getHighScores();
            expect(highScores).toHaveLength(1);
            expect(highScores[0].score).toBe(score);
        });

        it('should maintain only top 10 scores', () => {
            // Add 15 scores
            for (let i = 0; i < 15; i++) {
                storage.saveHighScore(i);
            }
            const highScores = storage.getHighScores();
            expect(highScores).toHaveLength(10);
            // Should keep highest scores
            expect(Math.min(...highScores.map(s => s.score))).toBe(5);
        });

        it('should correctly identify new high scores', () => {
            // Fill with 10 scores
            for (let i = 0; i < 10; i++) {
                storage.saveHighScore(i * 100);
            }
            expect(storage.isNewHighScore(950)).toBe(true);
            expect(storage.isNewHighScore(50)).toBe(false);
        });
    });

    describe('game settings', () => {
        it('should save and retrieve settings', () => {
            const settings = {
                musicVolume: 0.5,
                sfxVolume: 0.7,
                isMuted: false
            };
            expect(storage.saveSettings(settings)).toBe(true);
            expect(storage.getSettings()).toEqual(settings);
        });

        it('should return default settings when none saved', () => {
            const settings = storage.getSettings();
            expect(settings).toEqual({
                musicVolume: 0.2,
                sfxVolume: 0.5,
                isMuted: false,
                showTutorial: true,
                difficulty: 'normal'
            });
        });
    });

    describe('error handling', () => {
        it('should handle localStorage errors gracefully', () => {
            // Mock localStorage.setItem to throw error
            const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
            mockSetItem.mockImplementation(() => {
                throw new Error('Storage full');
            });

            expect(storage.set('test', 'value')).toBe(false);
            expect(storage.get('test', 'default')).toBe('default');
        });

        it('should handle JSON parse errors', () => {
            // Set invalid JSON in localStorage
            localStorage.setItem(storage.getKey('test'), 'invalid json');
            expect(storage.get('test', 'default')).toBe('default');
        });
    });

    describe('achievements', () => {
        it('should save and check achievements', () => {
            const achievementId = 'TEST_ACHIEVEMENT';
            expect(storage.hasAchievement(achievementId)).toBe(false);
            storage.saveAchievement(achievementId);
            expect(storage.hasAchievement(achievementId)).toBe(true);
        });

        it('should not duplicate achievements', () => {
            const achievementId = 'TEST_ACHIEVEMENT';
            storage.saveAchievement(achievementId);
            storage.saveAchievement(achievementId);
            expect(storage.getAchievements()).toHaveLength(1);
        });
    });

    describe('game statistics', () => {
        it('should update and retrieve stats', () => {
            const initialStats = storage.getStats();
            expect(initialStats.gamesPlayed).toBe(0);

            const update = {
                gamesPlayed: 1,
                totalScore: 1000
            };

            storage.updateStats(update);
            const updatedStats = storage.getStats();
            expect(updatedStats.gamesPlayed).toBe(1);
            expect(updatedStats.totalScore).toBe(1000);
        });

        it('should merge new stats with existing ones', () => {
            storage.updateStats({ gamesPlayed: 1 });
            storage.updateStats({ totalScore: 1000 });

            const stats = storage.getStats();
            expect(stats.gamesPlayed).toBe(1);
            expect(stats.totalScore).toBe(1000);
        });
    });
});