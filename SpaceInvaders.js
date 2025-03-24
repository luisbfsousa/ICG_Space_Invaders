document.getElementById("playButton").addEventListener("click", () => {
    setTimeout(startGame, 1000);
});

let currentLevel = 1; 
let enemyPhase = 1; 
let scene, camera, renderer;
let aliens = [];
let player;
let projectiles = [];
let playAreaLimit = 7;
let playerSpeed = 0.1;
const keys = {};

// Global variables for discrete alien movement
let alienDirection = 1;     // 1 means moving right, -1 means left
let lastAlienMoveTime = Date.now();
const alienMoveDelay = 1000;  // milliseconds between moves
const horizontalStep = 2;     // horizontal step per move
const verticalStep = 2;       // vertical step when boundary hit

// Global game scoring and lives
let points = 0;
let playerLives = 3;
let gameOver = false;

// Create a scoreboard element at the top right of the page
const scoreBoard = document.createElement("div");
scoreBoard.id = "scoreBoard";
scoreBoard.style.position = "absolute";
scoreBoard.style.top = "10px";
scoreBoard.style.right = "10px";
scoreBoard.style.color = "#fff";
scoreBoard.style.fontFamily = "Arial, sans-serif";
scoreBoard.style.fontSize = "16px";
scoreBoard.style.zIndex = "100";
document.body.appendChild(scoreBoard);
updateScoreBoard();

function updateScoreBoard() {
    scoreBoard.textContent = `Points: ${points}    Lives: ${playerLives}`;
}

// ========================== KEYBOARD EVENT HANDLING ==========================
document.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
    if (event.key === " ") {
        shootProjectile();
    }
});
document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

function startGame() {
    // Reset game variables
    points = 0;
    playerLives = 3;
    gameOver = false;
    updateScoreBoard();
    
    // ========================== THREE.JS SETUP ==========================
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    setCameraView();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ========================== LIGHTING ==========================
    const light = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(light);

    // ========================== PLAYER SETUP ==========================
    const playerGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = -3;
    scene.add(player);

    projectiles = [];
    resetAliens();
    createGameBox();
    animate();
}

function updatePlayerMovement() {
    if (keys["a"] || keys["arrowleft"]) {
        player.position.x = Math.max(-playAreaLimit, player.position.x - playerSpeed);
    }
    if (keys["d"] || keys["arrowright"]) {
        player.position.x = Math.min(playAreaLimit, player.position.x + playerSpeed);
    }
}

// ========================== PROJECTILE SETUP ==========================
const maxProjectiles = 3;
function shootProjectile() {
    if (projectiles.length >= maxProjectiles) return;
    const projectileGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
    const projectileMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.position.set(player.position.x, player.position.y + 0.5, 0);
    scene.add(projectile);
    projectiles.push(projectile);
}

// ========================== ALIEN MOVEMENT (DISCRETE STEPS) ==========================
function updateAliens() {
    const now = Date.now();
    if (now - lastAlienMoveTime < alienMoveDelay) return; // Wait until delay passes
    lastAlienMoveTime = now;

    const leftBoundary = -7;
    const rightBoundary = 7;
    let hitBoundary = false;
    aliens.forEach(alien => {
        if ((alien.position.x + horizontalStep * alienDirection) < leftBoundary ||
            (alien.position.x + horizontalStep * alienDirection) > rightBoundary) {
            hitBoundary = true;
        }
    });
    if (hitBoundary) {
        aliens.forEach(alien => {
            alien.position.y -= verticalStep;
        });
        alienDirection *= -1;
    } else {
        aliens.forEach(alien => {
            alien.position.x += horizontalStep * alienDirection;
        });
    }
}

function checkPlayerCollision() {
    // Use bounding box approximation:
    // Player: width 1 (half-width 0.5), height 0.5 (half-height 0.25)
    // Alien: sphere radius ~0.3
    for (let i = 0; i < aliens.length; i++) {
        const alien = aliens[i];
        const xDist = Math.abs(alien.position.x - player.position.x);
        const yDist = Math.abs(alien.position.y - player.position.y);
        if (xDist < (0.5 + 0.3) && yDist < (0.25 + 0.3)) {
            console.log("Player hit!");
            playerLives--;
            updateScoreBoard();
            if (playerLives <= 0) {
                console.log("Game Over!");
                gameOver = true;
                displayGameOverPopup();
            }
            // Optionally, add a brief cooldown here
            break;
        }
    }
}

// ========================== GAME OVER POPUP ==========================
function displayGameOverPopup() {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "gameOverOverlay";
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "200";
    
    // Create title text
    const title = document.createElement("div");
    title.textContent = "Game Over";
    title.style.fontFamily = "'Press Start 2P', cursive";
    title.style.fontSize = "48px";
    title.style.color = "yellow";
    title.style.marginBottom = "30px";
    overlay.appendChild(title);
    
    // Container for typed text (contenteditable) + underscore
    const textContainer = document.createElement("div");
    textContainer.style.marginBottom = "30px"; // space before button

    // Contenteditable div for user’s text
    const inputContainer = document.createElement("div");
    inputContainer.style.display = "inline-block";
    inputContainer.style.whiteSpace = "nowrap";
    inputContainer.style.color = "yellow";
    inputContainer.style.fontFamily = "'Press Start 2P', cursive";
    inputContainer.style.fontSize = "24px";
    inputContainer.style.outline = "none";
    inputContainer.contentEditable = "true";  // Make it editable
    inputContainer.setAttribute("tabindex", "0"); // Make it focusable
    // Remove box/border, hide normal caret, disable spellcheck
    inputContainer.style.border = "none";
    inputContainer.style.background = "none";
    inputContainer.style.caretColor = "transparent";
    inputContainer.spellcheck = false;
    
    // Enforce max 8 characters
    inputContainer.addEventListener("input", () => {
      if (inputContainer.innerText.length > 8) {
        // Truncate to 8
        inputContainer.innerText = inputContainer.innerText.substring(0, 8);
        // Place cursor at end if needed (though we are hiding the caret anyway)
        placeCaretAtEnd(inputContainer);
      }
    });

    // Optional helper to place caret at end
    function placeCaretAtEnd(el) {
      el.focus();
      if (typeof window.getSelection != "undefined" 
          && typeof document.createRange != "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    // Blinking underscore
    const underscore = document.createElement("span");
    underscore.textContent = "_";
    underscore.style.fontFamily = "'Press Start 2P', cursive";
    underscore.style.fontSize = "24px";
    underscore.style.color = "yellow";
    underscore.style.marginLeft = "8px"; // space between text and underscore

    // Basic blink animation
    const styleTag = document.createElement("style");
    styleTag.type = "text/css";
    styleTag.innerHTML = `
        @keyframes blink {
            0%   { opacity: 1; }
            50%  { opacity: 0; }
            100% { opacity: 1; }
        }
        .blinking {
            animation: blink 1s infinite;
        }
    `;
    document.head.appendChild(styleTag);

    underscore.classList.add("blinking");

    // Append the contenteditable and underscore into textContainer
    textContainer.appendChild(inputContainer);
    textContainer.appendChild(underscore);
    overlay.appendChild(textContainer);
    
    // Create arcade-style submit button
    const button = document.createElement("button");
    button.textContent = "Submit";
    button.style.fontFamily = "'Press Start 2P', cursive";
    button.style.fontSize = "24px";
    button.style.padding = "10px 20px";
    button.style.cursor = "pointer";
    button.style.background = "yellow";
    button.style.color = "black";
    button.style.border = "none";
    button.style.boxShadow = "0 0 10px yellow";
    overlay.appendChild(button);
    
    document.body.appendChild(overlay);

    // Focus the contenteditable div so you can type right away
    inputContainer.focus();
    
    button.addEventListener("click", () => {
        // Retrieve typed text from the contenteditable div
        const playerName = inputContainer.innerText.trim();
        console.log("Player Name:", playerName);
        // You can save the player's name or display high scores here.
        location.reload();
    });
}


// ========================== GAME LOOP ==========================
function animate() {
    if (gameOver) return; // Stop the game loop if game over

    requestAnimationFrame(animate);
    updatePlayerMovement();

    // Update projectiles and remove those out of bounds
    for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        projectile.position.y += 0.1;
        if (projectile.position.y > 5) {
            scene.remove(projectile);
            projectiles.splice(pIndex, 1);
        }
    }

    // Collision detection between projectiles and aliens (iterate backwards)
    for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        for (let aIndex = aliens.length - 1; aIndex >= 0; aIndex--) {
            const alien = aliens[aIndex];
            const dx = projectile.position.x - alien.position.x;
            const dy = projectile.position.y - alien.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionThreshold = 0.4;
            if (distance < collisionThreshold) {
                scene.remove(alien);
                scene.remove(projectile);
                aliens.splice(aIndex, 1);
                projectiles.splice(pIndex, 1);
                points += 10;  // 10 points per kill
                updateScoreBoard();
                break;
            }
        }
    }

    updateAliens();
    checkPlayerCollision();
    checkLevelCompletion();
    renderer.render(scene, camera);
}

// ========================== LEVEL PROGRESSION ==========================
function checkLevelCompletion() {
    if (aliens.length === 0) {
        // Award bonus points for level completion
        points += 50;
        updateScoreBoard();
        
        // Remove any remaining projectiles
        projectiles.forEach(proj => scene.remove(proj));
        projectiles.length = 0;
        
        currentLevel = (currentLevel % 2) + 1;
        if (enemyPhase < 5) { enemyPhase++; }
        setCameraView();
        resetAliens();
    }
}

function setCameraView() {
    if (!camera) return;
    if (currentLevel === 1) {
        camera.position.set(0, 0, 10); // Classic 2D View
        camera.lookAt(0, 0, 0);
        console.log("2D");
    } else if (currentLevel === 2) {
        camera.position.set(0, -15, 3); // Almost Flat POV
        camera.lookAt(0, 0, 0);
        console.log("POV");
    }
}

function resetAliens() {
    if (!scene) return;
    aliens.forEach(alien => scene.remove(alien));
    aliens.length = 0;
    
    let rows, cols;
    if (enemyPhase === 1) { rows = 2; cols = 3; } 
    else if (enemyPhase === 2) { rows = 3; cols = 3; } 
    else if (enemyPhase === 3) { rows = 4; cols = 4; } 
    else if (enemyPhase === 4) { rows = 4; cols = 8; } 
    else { rows = 5; cols = 8; }
    
    // Increase vertical offset for more space between aliens and the ship
    const baseYOffset = 4;
    const alienSpacing = 1.5;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const alienGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const alienMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            const alien = new THREE.Mesh(alienGeometry, alienMaterial);
            alien.position.set((c - cols / 2) * alienSpacing, (r - rows / 2) * alienSpacing + baseYOffset, 0);
            scene.add(alien);
            aliens.push(alien);
        }
    }
    console.log("Aliens reset for phase " + enemyPhase);
}

// ========================== GAME BOX (VISIBLE BOUNDARIES) ==========================
function createGameBox() {
    const boxWidth = 16;
    const boxHeight = 12;
    const boxDepth = 1;

    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const edges = new THREE.EdgesGeometry(boxGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const gameBox = new THREE.LineSegments(edges, lineMaterial);
    
    gameBox.position.set(0, 0, -1);
    scene.add(gameBox);
}
