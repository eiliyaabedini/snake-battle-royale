/**
 * collision.js
 * Collision detection utilities for Snake Battle Royale
 * Handles: wall collision, self-collision, snake-to-snake collision, food/powerup collection
 */

// Check if a position is outside the game bounds (wall collision)
export function isWallCollision(pos, cols, rows) {
    return (
        pos.x < 0 ||
        pos.y < 0 ||
        pos.x >= cols ||
        pos.y >= rows
    );
}

// Check if the head of the snake collides with its own body
export function isSelfCollision(segments) {
    const [head, ...body] = segments;
    return body.some(segment => segment.x === head.x && segment.y === head.y);
}

// Check if the head of one snake collides with any segment of another snake
export function isSnakeToSnakeCollision(head, otherSegments) {
    return otherSegments.some(segment => segment.x === head.x && segment.y === head.y);
}

// Check if the snake's head is on the food
export function isFoodCollision(head, food) {
    return head.x === food.x && head.y === food.y;
}

// Check if the snake's head is on a powerup
export function getPowerupCollision(head, powerups) {
    for (let i = 0; i < powerups.length; i++) {
        if (head.x === powerups[i].x && head.y === powerups[i].y) {
            return powerups[i];
        }
    }
    return null;
}
