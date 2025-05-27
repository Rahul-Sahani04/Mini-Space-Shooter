/**
 * @typedef {Object} Vector2D
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} GameState
 * @property {number} score - Current game score
 * @property {number} health - Player health
 * @property {number} energy - Player energy
 * @property {boolean} isGameOver - Game over flag
 * @property {Array<Entity>} entities - All game entities
 * @property {Array<Projectile>} projectiles - Active projectiles
 * @property {Array<Enemy>} enemies - Active enemies
 * @property {Array<PowerUp>} powerups - Active powerups
 * @property {Array<Explosion>} explosions - Active explosions
 * @property {number} lastSpawnTime - Last enemy spawn time
 * @property {number} spawnInterval - Enemy spawn interval
 * @property {number} animationFrame - Current animation frame
 * @property {number} dashCooldown - Dash cooldown timer
 * @property {number} maxDashCooldown - Maximum dash cooldown
 * @property {number} lastComboTime - Last combo hit time
 * @property {number} comboCount - Current combo count
 * @property {number} comboTimeout - Combo timeout duration
 */

/**
 * @typedef {Object} GameConfig
 * @property {number} width - Canvas width
 * @property {number} height - Canvas height
 * @property {boolean} debug - Debug mode flag
 * @property {Object} player - Player configuration
 * @property {Object} enemy - Enemy configuration
 * @property {Object} powerup - Powerup configuration
 */

/**
 * @typedef {Object} Entity
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Entity width
 * @property {number} height - Entity height
 * @property {boolean} active - Active state flag
 * @property {function} update - Update function
 * @property {function} draw - Draw function
 */

/**
 * @typedef {Object} Settings
 * @property {number} musicVolume - Music volume (0-1)
 * @property {number} sfxVolume - Sound effects volume (0-1)
 * @property {boolean} isMuted - Mute state
 * @property {boolean} showTutorial - Tutorial visibility
 * @property {'easy'|'normal'|'hard'} difficulty - Game difficulty
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id - Achievement ID
 * @property {string} title - Achievement title
 * @property {string} description - Achievement description
 * @property {string} icon - Achievement icon
 */

/**
 * @typedef {Object} HighScore
 * @property {number} score - Score value
 * @property {string} date - Score date
 * @property {string} [playerName] - Player name
 */

/**
 * @typedef {Object} GameStats
 * @property {number} gamesPlayed - Total games played
 * @property {number} totalScore - Total score across all games
 * @property {number} enemiesDefeated - Total enemies defeated
 * @property {number} powerupsCollected - Total powerups collected
 * @property {number} highestCombo - Highest combo achieved
 */

/**
 * @typedef {Object} ParticleOptions
 * @property {number} [life] - Particle lifetime
 * @property {number} [speed] - Particle speed
 * @property {string} [color] - Particle color
 * @property {number} [size] - Particle size
 * @property {number} [gravity] - Particle gravity
 * @property {'circle'|'square'|'star'|'spark'} [shape] - Particle shape
 */

// Export empty object to make this a module
export default {};