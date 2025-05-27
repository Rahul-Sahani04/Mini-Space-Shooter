import { GAME_CONFIG } from './constants.js';

// Grid-based spatial partitioning
export class SpatialGrid {
    constructor() {
        this.grid = new Map();
        this.cellSize = GAME_CONFIG.GRID_SIZE;
    }

    clear() {
        this.grid.clear();
    }

    add(entity) {
        const cellX = Math.floor(entity.x / this.cellSize);
        const cellY = Math.floor(entity.y / this.cellSize);
        const key = `${cellX},${cellY}`;
        
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }

    getNearby(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        const nearby = [];

        // Check surrounding cells
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const key = `${cellX + i},${cellY + j}`;
                if (this.grid.has(key)) {
                    nearby.push(...this.grid.get(key));
                }
            }
        }

        return nearby;
    }
}

// Basic AABB collision detection
export function checkCollision(rect1, rect2) {
    return rect1.x - rect1.width/2 < rect2.x + rect2.width/2 &&
           rect1.x + rect1.width/2 > rect2.x - rect2.width/2 &&
           rect1.y - rect1.height/2 < rect2.y + rect2.height/2 &&
           rect1.y + rect1.height/2 > rect2.y - rect2.height/2;
}

// Circle collision detection for more accurate powerup collection
export function checkCircleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.radius + circle2.radius);
}

export default {
    SpatialGrid,
    checkCollision,
    checkCircleCollision
};