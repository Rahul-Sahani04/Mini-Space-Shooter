import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialGrid, checkCollision, checkCircleCollision } from '../../scripts/utils/collision.js';

describe('Collision Detection System', () => {
    describe('SpatialGrid', () => {
        let grid;

        beforeEach(() => {
            grid = new SpatialGrid();
        });

        it('should add entities to correct grid cells', () => {
            const entity = { x: 100, y: 100, width: 32, height: 32 };
            grid.add(entity);
            
            const nearby = grid.getNearby(100, 100);
            expect(nearby).toContain(entity);
        });

        it('should return nearby entities', () => {
            const entity1 = { x: 100, y: 100, width: 32, height: 32 };
            const entity2 = { x: 110, y: 110, width: 32, height: 32 };
            const farEntity = { x: 500, y: 500, width: 32, height: 32 };

            grid.add(entity1);
            grid.add(entity2);
            grid.add(farEntity);

            const nearby = grid.getNearby(100, 100);
            expect(nearby).toContain(entity1);
            expect(nearby).toContain(entity2);
            expect(nearby).not.toContain(farEntity);
        });

        it('should clear all entities from grid', () => {
            const entity = { x: 100, y: 100, width: 32, height: 32 };
            grid.add(entity);
            grid.clear();
            
            const nearby = grid.getNearby(100, 100);
            expect(nearby).toHaveLength(0);
        });

        it('should handle entities at grid cell boundaries', () => {
            const entity = { x: 64, y: 64, width: 32, height: 32 }; // At cell boundary
            grid.add(entity);
            
            // Check both adjacent cells
            expect(grid.getNearby(60, 60)).toContain(entity);
            expect(grid.getNearby(68, 68)).toContain(entity);
        });
    });

    describe('AABB Collision Detection', () => {
        it('should detect collision between overlapping rectangles', () => {
            const rect1 = { x: 100, y: 100, width: 50, height: 50 };
            const rect2 = { x: 125, y: 125, width: 50, height: 50 };
            
            expect(checkCollision(rect1, rect2)).toBe(true);
        });

        it('should not detect collision between non-overlapping rectangles', () => {
            const rect1 = { x: 100, y: 100, width: 50, height: 50 };
            const rect2 = { x: 200, y: 200, width: 50, height: 50 };
            
            expect(checkCollision(rect1, rect2)).toBe(false);
        });

        it('should detect collision at edges', () => {
            const rect1 = { x: 100, y: 100, width: 50, height: 50 };
            const rect2 = { x: 150, y: 100, width: 50, height: 50 };
            
            expect(checkCollision(rect1, rect2)).toBe(true);
        });

        it('should handle zero-sized rectangles', () => {
            const rect1 = { x: 100, y: 100, width: 0, height: 0 };
            const rect2 = { x: 100, y: 100, width: 50, height: 50 };
            
            expect(checkCollision(rect1, rect2)).toBe(true);
        });
    });

    describe('Circle Collision Detection', () => {
        it('should detect collision between overlapping circles', () => {
            const circle1 = { x: 100, y: 100, radius: 25 };
            const circle2 = { x: 120, y: 120, radius: 25 };
            
            expect(checkCircleCollision(circle1, circle2)).toBe(true);
        });

        it('should not detect collision between non-overlapping circles', () => {
            const circle1 = { x: 100, y: 100, radius: 25 };
            const circle2 = { x: 200, y: 200, radius: 25 };
            
            expect(checkCircleCollision(circle1, circle2)).toBe(false);
        });

        it('should detect collision at edges', () => {
            const circle1 = { x: 100, y: 100, radius: 25 };
            const circle2 = { x: 150, y: 100, radius: 25 };
            
            expect(checkCircleCollision(circle1, circle2)).toBe(true);
        });

        it('should handle zero-radius circles', () => {
            const circle1 = { x: 100, y: 100, radius: 0 };
            const circle2 = { x: 100, y: 100, radius: 25 };
            
            expect(checkCircleCollision(circle1, circle2)).toBe(true);
        });
    });

    describe('Performance', () => {
        it('should handle large numbers of entities efficiently', () => {
            const grid = new SpatialGrid();
            const entities = [];

            // Create 1000 random entities
            for (let i = 0; i < 1000; i++) {
                entities.push({
                    x: Math.random() * 1000,
                    y: Math.random() * 1000,
                    width: 32,
                    height: 32
                });
            }

            // Measure time to add all entities
            const startAdd = performance.now();
            entities.forEach(entity => grid.add(entity));
            const endAdd = performance.now();

            // Measure time to query nearby entities
            const startQuery = performance.now();
            grid.getNearby(500, 500);
            const endQuery = performance.now();

            // Adding should take less than 50ms
            expect(endAdd - startAdd).toBeLessThan(50);
            // Query should take less than 5ms
            expect(endQuery - startQuery).toBeLessThan(5);
        });
    });
});