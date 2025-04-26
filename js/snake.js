/**
 * Snake class for Snake Battle Royale
 * Handles movement, growth, rendering, and powerup effects.
 * 
 * Usage:
 *   const snake = new Snake({x: 5, y: 5}, 'right', '#008080');
 *   snake.move();
 *   snake.grow();
 *   snake.render(ctx, cellSize);
 *   snake.applyPowerup('speed', 3000);
 */

export class Snake {
    /**
     * @param {Object} startPos - {x, y} starting position
     * @param {string} direction - initial direction ('up', 'down', 'left', 'right')
     * @param {string} color - color for rendering
     */
    constructor(startPos, direction, color) {
        this.segments = [ { x: startPos.x, y: startPos.y } ];
        this.direction = direction;
        this.nextDirection = direction;
        this.growAmount = 0;
        this.color = color;
        this.alive = true;
        this.powerups = {
            speed: false,
            shield: false,
            slow: false
        };
        this.powerupTimers = {};
    }

    /**
     * Set the next direction for the snake (prevents reversing)
     * @param {string} dir - 'up', 'down', 'left', 'right'
     */
    setDirection(dir) {
        const opposites = {
            up: 'down',
            down: 'up',
            left: 'right',
            right: 'left'
        };
        if (dir !== opposites[this.direction]) {
            this.nextDirection = dir;
        }
    }

    /**
     * Move the snake one step in the current direction
     */
    move() {
        if (!this.alive) return;

        this.direction = this.nextDirection;
        const head = this.segments[0];
        let newHead;
        switch (this.direction) {
            case 'up':
                newHead = { x: head.x, y: head.y - 1 };
                break;
            case 'down':
                newHead = { x: head.x, y: head.y + 1 };
                break;
            case 'left':
                newHead = { x: head.x - 1, y: head.y };
                break;
            case 'right':
                newHead = { x: head.x + 1, y: head.y };
                break;
        }
        this.segments.unshift(newHead);

        if (this.growAmount > 0) {
            this.growAmount--;
        } else {
            this.segments.pop();
        }
    }

    /**
     * Grow the snake by a certain amount (default 1)
     * @param {number} amount 
     */
    grow(amount = 1) {
        this.growAmount += amount;
    }

    /**
     * Check if the snake collides with itself
     * @returns {boolean}
     */
    checkSelfCollision() {
        const [head, ...body] = this.segments;
        return body.some(seg => seg.x === head.x && seg.y === head.y);
    }

    /**
     * Check if the snake collides with a given position
     * @param {Object} pos - {x, y}
     * @returns {boolean}
     */
    collidesWith(pos) {
        return this.segments.some(seg => seg.x === pos.x && seg.y === pos.y);
    }

    /**
     * Render the snake on the canvas
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} cellSize 
     */
    render(ctx, cellSize) {
        ctx.save();
        ctx.fillStyle = this.color;
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            ctx.globalAlpha = i === 0 ? 1.0 : 0.85;
            ctx.fillRect(seg.x * cellSize, seg.y * cellSize, cellSize, cellSize);
        }
        // Draw shield effect if active
        if (this.powerups.shield) {
            const head = this.segments[0];
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(
                head.x * cellSize + cellSize / 2,
                head.y * cellSize + cellSize / 2,
                cellSize * 0.7,
                0, 2 * Math.PI
            );
            ctx.fillStyle = '#00e6e6';
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Apply a powerup effect to the snake
     * @param {string} type - 'speed', 'shield', 'slow'
     * @param {number} duration - in ms
     */
    applyPowerup(type, duration) {
        if (!this.powerups[type]) {
            this.powerups[type] = true;
            if (duration > 0) {
                if (this.powerupTimers[type]) clearTimeout(this.powerupTimers[type]);
                this.powerupTimers[type] = setTimeout(() => {
                    this.powerups[type] = false;
                }, duration);
            }
        } else if (duration > 0) {
            // Refresh timer if already active
            clearTimeout(this.powerupTimers[type]);
            this.powerupTimers[type] = setTimeout(() => {
                this.powerups[type] = false;
            }, duration);
        }
    }

    /**
     * Remove all powerup effects
     */
    clearPowerups() {
        for (const type in this.powerups) {
            this.powerups[type] = false;
            if (this.powerupTimers[type]) {
                clearTimeout(this.powerupTimers[type]);
                this.powerupTimers[type] = null;
            }
        }
    }

    /**
     * Get the current head position
     * @returns {Object} {x, y}
     */
    getHead() {
        return this.segments[0];
    }

    /**
     * Kill the snake
     */
    die() {
        this.alive = false;
        this.clearPowerups();
    }
}

