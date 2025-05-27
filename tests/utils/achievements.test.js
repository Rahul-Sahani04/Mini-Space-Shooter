import { describe, it, expect, beforeEach, vi } from 'vitest';
import achievementManager, { ACHIEVEMENTS } from '../../scripts/utils/achievements.js';
import storage from '../../scripts/utils/storage.js';

describe('Achievement System', () => {
    beforeEach(() => {
        // Clear achievements and mocks
        storage.clear();
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('Achievement Unlocking', () => {
        it('should unlock an achievement', () => {
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            expect(achievementManager.isUnlocked(ACHIEVEMENTS.FIRST_KILL.id)).toBe(true);
        });

        it('should not unlock the same achievement twice', () => {
            const showNotificationSpy = vi.spyOn(achievementManager, 'showNotification');
            
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            
            expect(showNotificationSpy).toHaveBeenCalledTimes(1);
        });

        it('should persist unlocked achievements', () => {
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            
            // Create new instance to test persistence
            const newManager = achievementManager.constructor();
            expect(newManager.isUnlocked(ACHIEVEMENTS.FIRST_KILL.id)).toBe(true);
        });
    });

    describe('Achievement Tracking', () => {
        it('should track enemy kills for FIRST_KILL achievement', () => {
            achievementManager.track('enemyKilled', { enemyType: 'basic' });
            expect(achievementManager.isUnlocked(ACHIEVEMENTS.FIRST_KILL.id)).toBe(true);
        });

        it('should track combo count for COMBO_MASTER achievement', () => {
            achievementManager.track('comboUpdated', 9);
            expect(achievementManager.isUnlocked(ACHIEVEMENTS.COMBO_MASTER.id)).toBe(false);
            
            achievementManager.track('comboUpdated', 10);
            expect(achievementManager.isUnlocked(ACHIEVEMENTS.COMBO_MASTER.id)).toBe(true);
        });

        it('should track survival time for SURVIVOR achievement', () => {
            achievementManager.track('timeUpdated', 299);
            expect(achievementManager.isUnlocked(ACHIEVEMENTS.SURVIVOR.id)).toBe(false);
            
            achievementManager.track('timeUpdated', 300);
            expect(achievementManager.isUnlocked(ACHIEVEMENTS.SURVIVOR.id)).toBe(true);
        });

        it('should track accuracy for SHARPSHOOTER achievement', () => {
            achievementManager.track('accuracyUpdated', { hits: 45, totalShots: 49 });
            expect(achievementManager.isUnlocked(ACHIEVEMENTS.SHARPSHOOTER.id)).toBe(false);
            
            achievementManager.track('accuracyUpdated', { hits: 45, totalShots: 50 });
            expect(achievementManager.isUnlocked(ACHIEVEMENTS.SHARPSHOOTER.id)).toBe(true);
        });
    });

    describe('Achievement Notifications', () => {
        it('should create notification element when achievement unlocked', () => {
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            
            const notification = document.querySelector('.achievement-notification');
            expect(notification).not.toBeNull();
            expect(notification.textContent).toContain(ACHIEVEMENTS.FIRST_KILL.title);
        });

        it('should remove notification after animation', async () => {
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            
            // Fast-forward time
            await new Promise(resolve => setTimeout(resolve, 3600));
            
            const notification = document.querySelector('.achievement-notification');
            expect(notification).toBeNull();
        });
    });

    describe('Achievement Progress', () => {
        it('should return 100% for unlocked achievements', () => {
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            expect(achievementManager.getProgress(ACHIEVEMENTS.FIRST_KILL.id)).toBe(100);
        });

        it('should return 0% for locked achievements', () => {
            expect(achievementManager.getProgress(ACHIEVEMENTS.FIRST_KILL.id)).toBe(0);
        });

        it('should return all achievements with progress', () => {
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            
            const allAchievements = achievementManager.getAllAchievements();
            const firstKill = allAchievements.find(a => a.id === ACHIEVEMENTS.FIRST_KILL.id);
            
            expect(firstKill.unlocked).toBe(true);
            expect(firstKill.progress).toBe(100);
        });
    });

    describe('Event Emission', () => {
        it('should emit event when achievement unlocked', () => {
            const listener = vi.fn();
            achievementManager.on('achievementUnlocked', listener);
            
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            
            expect(listener).toHaveBeenCalledWith(ACHIEVEMENTS.FIRST_KILL);
        });

        it('should not emit event for already unlocked achievement', () => {
            const listener = vi.fn();
            achievementManager.on('achievementUnlocked', listener);
            
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid achievement IDs gracefully', () => {
            expect(() => {
                achievementManager.unlock('INVALID_ACHIEVEMENT');
            }).not.toThrow();
        });

        it('should handle storage errors gracefully', () => {
            const mockStorage = vi.spyOn(storage, 'saveAchievement');
            mockStorage.mockImplementation(() => {
                throw new Error('Storage error');
            });

            expect(() => {
                achievementManager.unlock(ACHIEVEMENTS.FIRST_KILL.id);
            }).not.toThrow();
        });
    });
});