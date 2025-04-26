/**
 * Powerup System for Snake Battle Royale
 * Handles powerup spawning, rendering, and effect application.
 * ES6 module syntax.
 */

import { POWERUP_TYPES, GRID_WIDTH, GRID_HEIGHT, randomInt, getRandomEmptyCell, posToKey } from './utils.js';

const POWERUP_COLORS = {
    [POWERUP_TYPES.SPEED]: '#00bcd4',      // Teal
    [POWERUP_TYPES.SHIELD]: '#ff9800',     // Orange
    [POWERUP_TYPES.SLOW_ENEMY]: '#8bc34a', // Green
};

const POWERUP_DURATIONS = {
    [POWERUP_TYPES.SPEED]: 5000,       // ms
    [POWERUP_TYPES.SHIELD]: 5000,
    [POWERUP_TYPES.SLOW_ENEMY]: 5000,
};

const POWERUP_SYMBOLS = {
    [POWERUP_TYPES.SPEED]: '⚡',
    [POWERUP_TYPES.SHIELD]: '🛡️',
    [POWERUP_TYPES.SLOW_ENEMY]: '🐢',
};

export class PowerupSystem {
    constructor() {
        this.activePowerups = []; // {type, expiresAt}
        this.spawnedPowerup = null; // {type, pos}
        this.lastSpawnTime = 0;
        this.spawnInterval = 8000; // ms
    }

    /**
     * Call every frame to update timers and manage powerups.
     * @param {number} now - current timestamp (ms)
     * @param {Set<string>} occupiedCells - set of "x,y" strings
     */
    update(now, occupiedCells) {
        // Remove expired powerups
        this.activePowerups = this.activePowerups.filter(pu => pu.expiresAt > now);

        // Spawn new powerup if needed
        if (!this.spawnedPowerup && now - this.lastSpawnTime > this.spawnInterval) {
            this.spawnPowerup(occupiedCells);
            this.lastSpawnTime = now;
        }
    }

    /**
     * Spawns a new powerup at a random empty cell.
     * @param {Set<string>} occupiedCells
     */
    spawnPowerup(occupiedCells) {
        const types = Object.values(POWERUP_TYPES);
        const type = types[randomInt(0, types.length - 1)];
        const pos = getRandomEmptyCell(occupiedCells);
        if (pos) {
            this.spawnedPowerup = { type, pos };
        }
    }

    /**
     * Call when a snake collects a powerup.
     * @param {string} type
     * @param {number} now
     */
    activatePowerup(type, now) {
        this.activePowerups.push({
            type,
            expiresAt: now + POWERUP_DURATIONS[type]
        });
        this.spawnedPowerup = null;
    }

    /**
     * Checks if a powerup is currently active for a given type.
     * @param {string} type
     * @returns {boolean}
     */
    isActive(type) {
        return this.activePowerups.some(pu => pu.type === type);
    }

    /**
     * Checks if the given position matches the spawned powerup.
     * @param {{x:number, y:number}} pos
     * @returns {boolean}
     */
    isPowerupAt(pos) {
        if (!this.spawnedPowerup) return false;
        return pos.x === this.spawnedPowerup.pos.x && pos.y === this.spawnedPowerup.pos.y;
    }

    /**
     * Returns the type of the spawned powerup at the given position, or null.
     * @param {{x:number, y:number}} pos
     * @returns {string|null}
     */
    getPowerupTypeAt(pos) {
        if (this.isPowerupAt(pos)) {
            return this.spawnedPowerup.type;
        }
        return null;
    }

    /**
     * Draws the spawned powerup on the canvas.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} cellSize
     */
    draw(ctx, cellSize) {
        if (!this.spawnedPowerup) return;
        const { type, pos } = this.spawnedPowerup;
        ctx.save();
        ctx.font = `${Math.floor(cellSize * 0.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = POWERUP_COLORS[type] || '#fff';
        ctx.fillText(
            POWERUP_SYMBOLS[type] || '?',
            pos.x * cellSize + cellSize / 2,
            pos.y * cellSize + cellSize / 2
        );
        ctx.restore();
    }

    /**
     * For UI: returns a list of currently active powerups with their remaining time (ms).
     * @param {number} now
     * @returns {Array<{type: string, remaining: number}>}
     */
    getActivePowerups(now) {
        return this.activePowerups.map(pu => ({
            type: pu.type,
            remaining: Math.max(0, pu.expiresAt - now)
        }));
    }

    /**
     * Checks if a snake's head is on a powerup, collects it if so, and returns the type.
     * @param {{x:number, y:number}} pos - The position to check (usually snake head)
     * @param {number} now - Current timestamp
     * @returns {string|null} - The type of powerup collected, or null
     */
    collectIfPresent(pos, now) {
        if (this.isPowerupAt(pos)) {
            const type = this.spawnedPowerup.type;
            this.activatePowerup(type, now);
            return type;
        }
        return null;
    }

    /**
     * Returns an array of positions of all currently active powerups (for UI, etc).
     * @returns {Array<{x:number, y:number}>}
     */
    getActivePowerupPositions() {
        if (this.spawnedPowerup) {
            return [this.spawnedPowerup.pos];
        }
        return [];
    }
}
