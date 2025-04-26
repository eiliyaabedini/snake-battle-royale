/**
 * Utility functions and constants for Snake Battle Royale
 * ES6 module syntax
 */

// --- Constants ---

export const CELL_SIZE = 20; // Size of each grid cell in pixels
export const GRID_WIDTH = 24; // Number of cells horizontally
export const GRID_HEIGHT = 20; // Number of cells vertically

export const DIRECTIONS = {
    ArrowUp:    { x: 0,  y: -1 },
    ArrowDown:  { x: 0,  y: 1 },
    ArrowLeft:  { x: -1, y: 0 },
    ArrowRight: { x: 1,  y: 0 }
};

export const GAME_STATES = {
    HOME: 'HOME',
    COUNTDOWN: 'COUNTDOWN',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

export const POWERUP_TYPES = {
    SPEED: 'SPEED',
    SHIELD: 'SHIELD',
    SLOW_ENEMY: 'SLOW_ENEMY'
};

// --- Helper Functions ---

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random empty cell from a set of occupied cells
 * @param {Set<string>} occupied - Set of "x,y" strings representing occupied cells
 * @returns {{x: number, y: number}|null}
 */
export function getRandomEmptyCell(occupied) {
    const emptyCells = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            const key = `${x},${y}`;
            if (!occupied.has(key)) {
                emptyCells.push({ x, y });
            }
        }
    }
    if (emptyCells.length === 0) return null;
    return emptyCells[randomInt(0, emptyCells.length - 1)];
}

/**
 * Checks if two positions are equal
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {boolean}
 */
export function positionsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
}

/**
 * Clamps a value between min and max
 */
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

/**
 * Wraps a position around the grid (for toroidal movement, if needed)
 * @param {{x: number, y: number}} pos
 * @returns {{x: number, y: number}}
 */
export function wrapPosition(pos) {
    return {
        x: (pos.x + GRID_WIDTH) % GRID_WIDTH,
        y: (pos.y + GRID_HEIGHT) % GRID_HEIGHT
    };
}

/**
 * Converts a position to a unique string key
 * @param {{x: number, y: number}} pos
 * @returns {string}
 */
export function posToKey(pos) {
    return `${pos.x},${pos.y}`;
}

/**
 * Converts a string key to a position object
 * @param {string} key
 * @returns {{x: number, y: number}}
 */
export function keyToPos(key) {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
}
