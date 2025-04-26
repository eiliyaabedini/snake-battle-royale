/**
 * UI handler for Snake Battle Royale.
 * Provides: showHomeScreen, showGameOverScreen, updateScore, updatePowerupLegend.
 * Assumes the following DOM elements exist:
 *   - #home-screen
 *   - #gameover-screen
 *   - #game-screen
 *   - #player-score
 *   - #ai-score
 *   - #game-over-score
 *   - #powerup-legend (multiple per screen)
 *   - .start-btn or .start (Start Game button)
 *   - .restart-btn or .restart (Restart button)
 *   - .home-btn or .home (Home button)
 */

const HOME_SCREEN_ID = "home-screen";
const GAMEOVER_SCREEN_ID = "gameover-screen";
const GAMESCREEN_ID = "game-screen";
const PLAYER_SCORE_ID = "player-score";
const AI_SCORE_ID = "ai-score";
const GAME_OVER_SCORE_ID = "game-over-score";
const POWERUP_LEGEND_ID = "powerup-legend";

// Powerup legend data (should match game logic)
const POWERUPS = [
    { name: "Speed Boost", color: "#00bfff", desc: "Faster movement" },
    { name: "Shield", color: "#ffd700", desc: "Temporary invincibility" },
    { name: "Slow Enemy", color: "#ff6600", desc: "Slows AI snake" }
];

function setScreenVisibility({ home = false, game = false, gameover = false }) {
    const homeEl = document.getElementById(HOME_SCREEN_ID);
    const gameEl = document.getElementById(GAMESCREEN_ID);
    const overEl = document.getElementById(GAMEOVER_SCREEN_ID);

    // Always remove 'active' from all screens first
    if (homeEl) homeEl.classList.remove("active");
    if (gameEl) gameEl.classList.remove("active");
    if (overEl) overEl.classList.remove("active");

    // Then add 'active' to the correct one(s)
    if (home && homeEl) homeEl.classList.add("active");
    if (game && gameEl) gameEl.classList.add("active");
    if (gameover && overEl) overEl.classList.add("active");
}

export function showHomeScreen() {
    setScreenVisibility({ home: true, game: false, gameover: false });
}

// Ensure home screen is shown by default on load
if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => {
        showHomeScreen();
    });
}

export function showGameOverScreen(playerScore) {
    setScreenVisibility({ home: false, game: false, gameover: true });
    // Set score in game over screen
    const scoreElem = document.getElementById(GAME_OVER_SCORE_ID);
    if (scoreElem) scoreElem.textContent = `Your Score: ${playerScore}`;
}

// Call this when the game starts to transition to the game screen
export function showGameScreen() {
    setScreenVisibility({ home: false, game: true, gameover: false });
}

export function updateScore(playerScore, aiScore) {
    const player = document.getElementById(PLAYER_SCORE_ID);
    const ai = document.getElementById(AI_SCORE_ID);
    if (player) player.textContent = `You: ${playerScore}`;
    if (ai) ai.textContent = `AI: ${aiScore}`;
}

export function updatePowerupLegend(powerups, container) {
    // powerups: array of {name, color, desc, active}
    // container: optional DOM element to update, otherwise updates all #powerup-legend
    const legends = container
        ? [container]
        : Array.from(document.querySelectorAll(`#${POWERUP_LEGEND_ID}`));
    legends.forEach(legend => {
        if (!legend) return;
        legend.innerHTML = "";
        legend.style.display = "";
        (powerups || POWERUPS).forEach(p => {
            const item = document.createElement("div");
            item.className = "legend-item";
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.marginBottom = "4px";
            const dot = document.createElement("span");
            dot.className = "legend-color";
            dot.style.display = "inline-block";
            dot.style.width = "14px";
            dot.style.height = "14px";
            dot.style.borderRadius = "50%";
            dot.style.background = p.color;
            dot.style.marginRight = "8px";
            item.appendChild(dot);
            const label = document.createElement("span");
            label.textContent = p.name + (p.desc ? ` – ${p.desc}` : "");
            if (p.active) label.style.fontWeight = "bold";
            item.appendChild(label);
            legend.appendChild(item);
        });
    });
}
