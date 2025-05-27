import { GAME_CONFIG, INITIAL_GAME_STATE, ASSETS, COLORS } from './constants.js';
import { SpatialGrid, checkCollision, checkCircleCollision } from './collision.js';
import { TutorialSystem } from './tutorial.js';
import audioManager from './audio.js';
import storage from './storage.js';
import achievementManager, { ACHIEVEMENTS } from './achievements.js';
import particleSystem, { Particle } from './particles.js';
import {
    requestAnimFrame,
    lerp,
    clamp,
    random,
    randomInt,
    distance,
    angle,
    toDegrees,
    toRadians,
    debounce,
    throttle,
    formatNumber,
    uuid,
    isMobile,
    isTouchDevice,
    formatTime,
    deepClone,
    ease,
    delay,
    sequence,
    EventEmitter
} from './helpers.js';

// Export configurations
export const config = {
    GAME_CONFIG,
    INITIAL_GAME_STATE,
    ASSETS,
    COLORS,
    ACHIEVEMENTS
};

// Export utility functions
export const utils = {
    lerp,
    clamp,
    random,
    randomInt,
    distance,
    angle,
    toDegrees,
    toRadians,
    debounce,
    throttle,
    formatNumber,
    uuid,
    isMobile,
    isTouchDevice,
    formatTime,
    deepClone,
    ease,
    delay,
    sequence
};

// Export collision utilities
export const collision = {
    SpatialGrid,
    checkCollision,
    checkCircleCollision
};

// Export classes and instances
export {
    TutorialSystem,
    audioManager,
    storage,
    achievementManager,
    particleSystem,
    Particle,
    EventEmitter,
    requestAnimFrame
};

// Export everything as a default object
export default {
    config,
    utils,
    collision,
    TutorialSystem,
    audioManager,
    storage,
    achievementManager,
    particleSystem,
    Particle,
    EventEmitter,
    requestAnimFrame
};

// Export type definitions for better IDE support
export const Types = {
    StorageKeys: {
        SETTINGS: 'settings',
        HIGH_SCORES: 'highScores',
        ACHIEVEMENTS: 'achievements',
        STATS: 'stats'
    },
    EventTypes: {
        ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',
        SCORE_UPDATED: 'scoreUpdated',
        COMBO_UPDATED: 'comboUpdated',
        POWERUP_COLLECTED: 'powerupCollected',
        ENEMY_KILLED: 'enemyKilled',
        PLAYER_HIT: 'playerHit',
        GAME_OVER: 'gameOver'
    },
    Difficulty: {
        EASY: 'easy',
        NORMAL: 'normal',
        HARD: 'hard'
    }
};