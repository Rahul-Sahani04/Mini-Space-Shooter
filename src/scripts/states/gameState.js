/**
 * Base class for all game states
 * @class GameState
 */
export class GameState {
    /**
     * Create a new game state
     * @param {Game} game - Reference to the main game instance
     */
    constructor(game) {
        if (!game) {
            throw new Error('Game instance must be provided to GameState');
        }
        this.game = game;
    }
    
    /**
     * Called when entering this state
     * @virtual
     */
    enter() {}

    /**
     * Called when exiting this state
     * @virtual
     */
    exit() {}

    /**
     * Update state logic
     * @virtual
     */
    update() {}

    /**
     * Render state
     * @virtual
     */
    render() {}
}

export default GameState;