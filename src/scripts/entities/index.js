import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Projectile } from './projectile.js';
import { PowerUp } from './powerup.js';
import { Explosion } from './explosion.js';

// Export individual entities
export {
    Player,
    Enemy,
    Projectile,
    PowerUp,
    Explosion
};

// Export entity types for type checking
export const EntityTypes = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    PROJECTILE: 'projectile',
    POWERUP: 'powerup',
    EXPLOSION: 'explosion'
};

// Export default object for convenience
export default {
    Player,
    Enemy,
    Projectile,
    PowerUp,
    Explosion,
    EntityTypes
};