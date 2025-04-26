/**
 * Food class for Snake Battle Royale
 * Handles food generation, rendering, and collection detection.
 * 
 * Usage:
 *   const food = new Food(gridWidth, gridHeight, cellSize);
 *   food.spawn(occupiedCells);
 *   food.render(ctx);
 *   if (food.isCollected(snakeHead)) { ... }
 */

export class Food {
    /**
     * @param {number} gridWidth - Number of cells horizontally
     * @param {number} gridHeight - Number of cells vertically
     * @param {number} cellSize - Size of each cell in pixels
     * @param {string} color - Food color (optional)
     */
    constructor(gridWidth, gridHeight, cellSize, color = "#FF5252") {
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = cellSize;
        this.color = color;
        this.position = { x: 0, y: 0 };
    }

    /**
     * Spawns food at a random unoccupied cell.
     * @param {Set<string>} occupiedCells - Set of "x,y" strings representing occupied cells (snakes, powerups, etc)
     */
    spawn(occupiedCells = new Set()) {
        const freeCells = [];
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                const key = `${x},${y}`;
                if (!occupiedCells.has(key)) {
                    freeCells.push({ x, y });
                }
            }
        }
        if (freeCells.length === 0) {
            // No free cells, do not move food
            return;
        }
        const idx = Math.floor(Math.random() * freeCells.length);
        this.position = freeCells[idx];
    }

    /**
     * Renders the food on the canvas.
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.position.x * this.cellSize + this.cellSize / 2,
            this.position.y * this.cellSize + this.cellSize / 2,
            this.cellSize * 0.35,
            0,
            2 * Math.PI
        );
        ctx.fill();
        ctx.restore();
    }

    /**
     * Checks if the food is collected by a snake.
     * @param {{x: number, y: number}} snakeHead - The head position of the snake
     * @returns {boolean}
     */
    isCollected(snakeHead) {
        return (
            this.position.x === snakeHead.x &&
            this.position.y === snakeHead.y
        );
    }
}