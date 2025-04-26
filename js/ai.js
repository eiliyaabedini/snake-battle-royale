/**
 * AI Opponent for Snake Battle Royale
 * Uses A* pathfinding to seek food and avoid collisions.
 * 
 * Usage:
 *   import { AI } from './ai.js';
 *   const ai = new AI({ ...options });
 *   ai.update(occupiedCellsSet, foodPosition);
 *   ai.render(ctx);
 */

import { randomInt, positionsEqual, GRID_WIDTH, GRID_HEIGHT } from './utils.js';

export class AI {
    /**
     * @param {Object} options
     *   - gridWidth, gridHeight, cellSize, initialLength, color, playerRef
     */
    constructor(options = {}) {
        this.gridWidth = options.gridWidth || GRID_WIDTH;
        this.gridHeight = options.gridHeight || GRID_HEIGHT;
        this.cellSize = options.cellSize || 20;
        this.color = options.color || '#FF9800';
        this.initialLength = options.initialLength || 4;
        this.playerRef = options.playerRef; // Reference to player snake

        // Initialize AI snake segments (start at bottom right)
        this.segments = [];
        const startX = this.gridWidth - 4;
        const startY = this.gridHeight - 4;
        for (let i = 0; i < this.initialLength; i++) {
            this.segments.push({ x: startX - i, y: startY });
        }
        this.direction = 'left';
        this.nextDirection = 'left';
        this.growAmount = 0;
        this.alive = true;
    }

    get head() {
        return this.segments[0];
    }

    /**
     * Check if the AI snake collides with itself
     * @returns {boolean}
     */
    checkSelfCollision() {
        const [head, ...body] = this.segments;
        return body.some(seg => seg.x === head.x && seg.y === head.y);
    }

    /**
     * Called every game tick. Decides next move and updates snake.
     * @param {Set<string>} occupiedCells - Set of "x,y" strings for all occupied cells
     * @param {Object} food - {x, y}
     */
    update(occupiedCells, food = null) {
        if (!this.alive) return;

        // Find food position if not provided
        if (!food && typeof window !== 'undefined' && window.game && window.game.food) {
            food = window.game.food.position;
        }
        if (!food) {
            // Fallback: move forward
            this._move();
            return;
        }

        // Compute path to food
        const path = this._findPath(this.head, food, occupiedCells);

        if (path && path.length > 1) {
            const next = path[1];
            const dx = next.x - this.head.x;
            const dy = next.y - this.head.y;
            if (dx === 1) this.nextDirection = 'right';
            else if (dx === -1) this.nextDirection = 'left';
            else if (dy === 1) this.nextDirection = 'down';
            else if (dy === -1) this.nextDirection = 'up';
        } else {
            // No path found, try to avoid immediate collision
            this.nextDirection = this._avoidCollision(occupiedCells) || this.direction;
        }

        this._move();
    }

    _move() {
        this.direction = this.nextDirection;
        const head = this.head;
        let newHead;
        switch (this.direction) {
            case 'up':    newHead = { x: head.x, y: head.y - 1 }; break;
            case 'down':  newHead = { x: head.x, y: head.y + 1 }; break;
            case 'left':  newHead = { x: head.x - 1, y: head.y }; break;
            case 'right': newHead = { x: head.x + 1, y: head.y }; break;
        }
        this.segments.unshift(newHead);

        if (this.growAmount > 0) {
            this.growAmount--;
        } else {
            this.segments.pop();
        }
    }

    grow(amount = 1) {
        this.growAmount += amount;
    }

    die() {
        this.alive = false;
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            ctx.globalAlpha = i === 0 ? 1.0 : 0.85;
            ctx.fillRect(seg.x * this.cellSize, seg.y * this.cellSize, this.cellSize, this.cellSize);
        }
        ctx.restore();
    }

    /**
     * A* pathfinding algorithm.
     * Returns an array of {x, y} from start to goal, or null if no path.
     */
    _findPath(start, goal, occupiedCells) {
        const openSet = [];
        const cameFrom = {};
        const gScore = {};
        const fScore = {};

        function key(pos) { return `${pos.x},${pos.y}`; }

        openSet.push(start);
        gScore[key(start)] = 0;
        fScore[key(start)] = this._heuristic(start, goal);

        while (openSet.length > 0) {
            // Get node with lowest fScore
            let currentIdx = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (fScore[key(openSet[i])] < fScore[key(openSet[currentIdx])]) {
                    currentIdx = i;
                }
            }
            const current = openSet[currentIdx];

            if (positionsEqual(current, goal)) {
                // Reconstruct path
                return this._reconstructPath(cameFrom, current);
            }

            openSet.splice(currentIdx, 1);

            for (const dir of [
                { x: 0, y: -1 }, // up
                { x: 1, y: 0 },  // right
                { x: 0, y: 1 },  // down
                { x: -1, y: 0 }  // left
            ]) {
                const neighbor = { x: current.x + dir.x, y: current.y + dir.y };
                if (!this._isValidCell(neighbor)) continue;
                const neighborKey = key(neighbor);
                // Allow goal cell even if occupied (so AI can eat food)
                if (occupiedCells.has(neighborKey) && !positionsEqual(neighbor, goal)) continue;

                const tentativeG = gScore[key(current)] + 1;
                if (tentativeG < (gScore[neighborKey] ?? Infinity)) {
                    cameFrom[neighborKey] = current;
                    gScore[neighborKey] = tentativeG;
                    fScore[neighborKey] = tentativeG + this._heuristic(neighbor, goal);
                    if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        return null; // No path found
    }

    _reconstructPath(cameFrom, current) {
        const path = [current];
        function key(pos) { return `${pos.x},${pos.y}`; }
        while (cameFrom[key(current)]) {
            current = cameFrom[key(current)];
            path.unshift(current);
        }
        return path;
    }

    _heuristic(a, b) {
        // Manhattan distance
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    _isValidCell(pos) {
        return (
            pos.x >= 0 &&
            pos.x < this.gridWidth &&
            pos.y >= 0 &&
            pos.y < this.gridHeight
        );
    }

    /**
     * If no path to food, try to avoid immediate collision.
     */
    _avoidCollision(occupiedCells) {
        const head = this.head;
        for (const dir of [
            { x: 0, y: -1, name: 'up' },
            { x: 1, y: 0, name: 'right' },
            { x: 0, y: 1, name: 'down' },
            { x: -1, y: 0, name: 'left' }
        ]) {
            const nx = head.x + dir.x;
            const ny = head.y + dir.y;
            const key = `${nx},${ny}`;
            if (this._isValidCell({ x: nx, y: ny }) && !occupiedCells.has(key)) {
                return dir.name;
            }
        }
        return null;
    }
}

