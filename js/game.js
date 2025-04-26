/**
 * Snake Battle Royale - Game Controller
 * Manages game state, game loop, and coordinates between components.
 */

import { Food } from './food.js';
import { Snake } from './snake.js';
import { PowerupSystem } from './powerup.js';
import { AI } from './ai.js';
import * as Collision from './collision.js';
import * as UI from './ui.js';
import * as Utils from './utils.js';

const DEFAULT_CONFIG = {
    gridWidth: Utils.GRID_WIDTH || 20,
    gridHeight: Utils.GRID_HEIGHT || 20,
    cellSize: Utils.CELL_SIZE || 24,
    initialSnakeLength: 4,
    gameSpeed: 120, // ms per tick
    countdownSeconds: 3,
};

export class Game {
    /**
     * @param {Object} callbacks - { onGameOver, onScoreUpdate, onPowerupUpdate }
     * @param {Object} config - Optional game config overrides
     */
    constructor(callbacks = {}, config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.callbacks = callbacks;
        this.state = 'HOME'; // HOME, COUNTDOWN, PLAYING, GAME_OVER

        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'game-canvas';
            document.body.appendChild(this.canvas);
        }
        this.canvas.width = this.config.gridWidth * this.config.cellSize;
        this.canvas.height = this.config.gridHeight * this.config.cellSize;
        this.ctx = this.canvas.getContext('2d');

        // Entities
        this.player = null;
        this.ai = null;
        this.food = null;
        this.powerupSystem = null;

        // State
        this.score = 0;
        this.activePowerups = [];
        this._gameLoopHandle = null;
        this._countdownHandle = null;
        this._countdownValue = this.config.countdownSeconds;

        // Bindings
        this._handleKeydown = this._handleKeydown.bind(this);
    }

    start() {
        if (typeof UI.showGameScreen === 'function') {
            UI.showGameScreen();
        }
        this._reset();
        this.state = 'COUNTDOWN';
        this._draw();
        this._startCountdown();
        document.addEventListener('keydown', this._handleKeydown);
    }

    destroy() {
        this._stopGameLoop();
        this._stopCountdown();
        document.removeEventListener('keydown', this._handleKeydown);
        // Optionally clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    _reset() {
        // Initialize player snake
        this.player = new Snake(
            { x: Math.floor(this.config.gridWidth / 4), y: Math.floor(this.config.gridHeight / 2) },
            'right',
            '#009688'
        );
        this.player.grow(this.config.initialSnakeLength - 1);

        // Initialize AI snake
        this.ai = new AI({
            gridWidth: this.config.gridWidth,
            gridHeight: this.config.gridHeight,
            cellSize: this.config.cellSize,
            initialLength: this.config.initialSnakeLength,
            color: '#FF9800',
            // Optionally, you can add playerRef: this.player if needed by AI
        });

        // Initialize powerup system FIRST
        this.powerupSystem = new PowerupSystem(
            this.config.gridWidth,
            this.config.gridHeight,
            this.config.cellSize
        );

        // Initialize food
        this.food = new Food(
            this.config.gridWidth,
            this.config.gridHeight,
            this.config.cellSize
        );
        this._spawnFood();

        this.score = 0;
        this.activePowerups = [];
    }

    _startCountdown() {
        this._countdownValue = this.config.countdownSeconds;
        this._draw();
        this._countdownHandle = setInterval(() => {
            this._countdownValue--;
            this._draw();
            if (this._countdownValue <= 0) {
                this._stopCountdown();
                this.state = 'PLAYING';
                this._draw(); // Draw "GO!" frame
                setTimeout(() => {
                    this._startGameLoop();
                }, 500);
            }
        }, 1000);
    }

    _stopCountdown() {
        if (this._countdownHandle) {
            clearInterval(this._countdownHandle);
            this._countdownHandle = null;
        }
    }

    _startGameLoop() {
        let lastTick = performance.now();
        const loop = (now) => {
            if (this.state !== 'PLAYING') return;
            if (now - lastTick >= this.config.gameSpeed) {
                this._update();
                this._draw();
                lastTick = now;
            }
            this._gameLoopHandle = requestAnimationFrame(loop);
        };
        this._gameLoopHandle = requestAnimationFrame(loop);
    }

    _stopGameLoop() {
        if (this._gameLoopHandle) {
            cancelAnimationFrame(this._gameLoopHandle);
            this._gameLoopHandle = null;
        }
    }

    _update() {
        // Move player and AI
        if (this.player.alive) {
            this.player.move();
        }
        if (this.ai.alive) {
            this.ai.update(this._getOccupiedCells(), this.food.position, this.player.segments);
        }

        // Powerup system update
        if (this.powerupSystem && typeof this.powerupSystem.update === 'function') {
            this.powerupSystem.update();
        }

        // Check collisions
        const playerHead = this.player.getHead();
        const aiHead = this.ai.head;

        // Wall collision
        if (
            Collision.isWallCollision(playerHead, this.config.gridWidth, this.config.gridHeight) ||
            this.player.checkSelfCollision() ||
            Collision.isSnakeToSnakeCollision(playerHead, this.ai.segments)
        ) {
            this.player.die();
        }

        if (
            Collision.isWallCollision(aiHead, this.config.gridWidth, this.config.gridHeight) ||
            this.ai.checkSelfCollision() ||
            Collision.isSnakeToSnakeCollision(aiHead, this.player.segments)
        ) {
            this.ai.die();
        }

        // Handle food collection
        if (this.food.isCollected(playerHead)) {
            this.player.grow();
            this.score += 10;
            this._spawnFood();
            if (this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.score);
            if (typeof UI.updateScore === 'function') UI.updateScore(this.score);
        } else if (this.food.isCollected(aiHead)) {
            this.ai.grow();
            this._spawnFood();
        }

        // Handle powerup collection
        if (this.powerupSystem && typeof this.powerupSystem.collectIfPresent === 'function') {
            const collectedPowerup = this.powerupSystem.collectIfPresent(playerHead);
            if (collectedPowerup) {
                this.activePowerups.push(collectedPowerup);
                if (this.callbacks.onPowerupUpdate) this.callbacks.onPowerupUpdate(this.activePowerups);
                if (typeof UI.updatePowerupLegend === 'function') UI.updatePowerupLegend(this.activePowerups);
            }
        }

        // Check for game over
        if (!this.player.alive) {
            this._gameOver();
        }
    }

    _draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid (optional for minimalist look)
        // this._drawGrid();

        // Draw food
        this.food.render(this.ctx);

        // Draw powerups
        this.powerupSystem.draw(this.ctx, this.config.cellSize);

        // Draw snakes
        this.ai.render(this.ctx, this.config.cellSize);
        this.player.render(this.ctx, this.config.cellSize);

        // Draw countdown if in COUNTDOWN state
        if (this.state === 'COUNTDOWN') {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 64px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                this._countdownValue > 0 ? this._countdownValue : 'GO!',
                this.canvas.width / 2,
                this.canvas.height / 2
            );
            this.ctx.restore();
        }
    }

    _drawGrid() {
        const { ctx, config } = this;
        ctx.save();
        ctx.strokeStyle = '#e0e0e0';
        for (let x = 0; x <= config.gridWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * config.cellSize, 0);
            ctx.lineTo(x * config.cellSize, config.gridHeight * config.cellSize);
            ctx.stroke();
        }
        for (let y = 0; y <= config.gridHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * config.cellSize);
            ctx.lineTo(config.gridWidth * config.cellSize, y * config.cellSize);
            ctx.stroke();
        }
        ctx.restore();
    }

    _spawnFood() {
        const occupied = this._getOccupiedCells();
        this.food.spawn(occupied);
    }

    _getOccupiedCells() {
        // Returns a Set of "x,y" strings for all occupied cells (player, ai, powerups)
        const occupied = new Set();
        if (this.player && this.player.segments) {
            for (const seg of this.player.segments) {
                occupied.add(`${seg.x},${seg.y}`);
            }
        }
        if (this.ai && this.ai.segments) {
            for (const seg of this.ai.segments) {
                occupied.add(`${seg.x},${seg.y}`);
            }
        }
        if (this.powerupSystem && typeof this.powerupSystem.getActivePowerupPositions === 'function') {
            for (const p of this.powerupSystem.getActivePowerupPositions()) {
                occupied.add(`${p.x},${p.y}`);
            }
        }
        return occupied;
    }

    _handleKeydown(e) {
        if (this.state !== 'PLAYING') return;
        // Pass input to player snake
        if (typeof this.player.setDirection === 'function') {
            // Arrow keys
            if (e.key === 'ArrowUp') this.player.setDirection('up');
            else if (e.key === 'ArrowDown') this.player.setDirection('down');
            else if (e.key === 'ArrowLeft') this.player.setDirection('left');
            else if (e.key === 'ArrowRight') this.player.setDirection('right');
        }
    }

    _gameOver() {
        this.state = 'GAME_OVER';
        this._stopGameLoop();
        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver(this.score);
        } else if (typeof UI.showGameOverScreen === 'function') {
            UI.showGameOverScreen(this.score);
        }
    }
}
