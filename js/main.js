/**
 * Snake Battle Royale - main.js
 * Responsible for initializing the game and handling main event listeners.
 */

// Import game controller and UI system
import { Game } from './game.js';
import { showHomeScreen, showGameOverScreen, updateScore, updatePowerupLegend } from './ui.js';

// Game instance
let game = null;

/**
 * Button and keyboard event handling for UI
 */
document.addEventListener('DOMContentLoaded', () => {
    // Show the home screen initially
    showHomeScreen();

    // Listen for Enter key to start the game from home screen
    document.addEventListener('keydown', handleGlobalKeydown);

    // Button event listeners
    // Start Game button (on home screen)
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            startGame();
        });
    }

    // Game Over screen: Restart and Home buttons
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            startGame();
        });
    }
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            showHomeScreen();
            if (game) {
                game.destroy && game.destroy();
                game = null;
            }
        });
    }
});

function handleGlobalKeydown(e) {
    if (!game || game.state === 'HOME') {
        if (e.key === 'Enter') {
            startGame();
        }
    } else if (game.state === 'GAME_OVER') {
        if (e.key === 'r' || e.key === 'R') {
            startGame();
        } else if (e.key === 'h' || e.key === 'H') {
            showHomeScreen();
            game = null;
        }
    }
    // Arrow keys and other gameplay input are handled by the game controller
}

function startGame() {
    // Remove any previous game instance
    if (game) {
        game.destroy && game.destroy();
        game = null;
    }
    // Create a new game instance
    game = new Game({
        onGameOver: (score) => {
            showGameOverScreen(score);
        },
        onScoreUpdate: (score) => {
            updateScore(score);
        },
        onPowerupUpdate: (powerups) => {
            updatePowerupLegend(powerups);
        }
    });
    game.start();
}
