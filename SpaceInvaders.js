document.getElementById("playButton").addEventListener("click", () => {
    setTimeout(startGame, 1000); // Start game after menu transition
});

let currentLevel = 1; // Track level progression (for camera view)
let enemyPhase = 1;   // Track enemy formation phase (1 to 5)

let scene, camera, renderer;
let aliens = [];
let player;
let projectiles = [];
let playAreaLimit = 7;
let playerSpeed = 0.1;

// Global keys object to track pressed keys
const keys = {};

// ========================== KEYBOARD EVENT HANDLING ==========================
document.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
    // Fire projectile on spacebar press
    if (event.key === " ") {
        shootProjectile();
    }
});
document.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

function startGame() {
    // ========================== THREE.JS SETUP ==========================
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    setCameraView(); // Set initial camera view

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // ========================== LIGHTING (For Better Visibility) ==========================
    const light = new THREE.AmbientLight(0xffffff, 1.5); // White ambient light
    scene.add(light);

    // ========================== PLAYER SETUP ==========================
    const playerGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = -3;
    scene.add(player);

    // Clear any existing projectiles
    projectiles = [];

    resetAliens(); // Initialize first wave of aliens

    createGameBox(); // Draw visible boundaries

    animate();
}

// Smoothly update the player's movement every frame based on key states
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
    if (projectiles.length >= maxProjectiles) return; // Limit to 3 bullets at a time
    const projectileGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
    const projectileMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.position.set(player.position.x, player.position.y + 0.5, 0);
    scene.add(projectile);
    projectiles.push(projectile);
}

// ========================== GAME LOOP ==========================
function animate() {
    requestAnimationFrame(animate);

    // Update player's movement
    updatePlayerMovement();

    // Move projectiles and remove if out of play area
    for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        projectile.position.y += 0.1;
        if (projectile.position.y > 5) {
            scene.remove(projectile);
            projectiles.splice(pIndex, 1);
        }
    }

    // Collision detection (loop backwards)
    for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        for (let aIndex = aliens.length - 1; aIndex >= 0; aIndex--) {
            const alien = aliens[aIndex];
            const dx = projectile.position.x - alien.position.x;
            const dy = projectile.position.y - alien.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionThreshold = 0.4; // Adjust as needed
            if (distance < collisionThreshold) {
                scene.remove(alien);
                scene.remove(projectile);
                aliens.splice(aIndex, 1);
                projectiles.splice(pIndex, 1);
                break;
            }
        }
    }

    checkLevelCompletion();
    renderer.render(scene, camera);
}

// ========================== LEVEL PROGRESSION ==========================
function checkLevelCompletion() {
    if (aliens.length === 0) {
        // Clear any remaining projectiles
        projectiles.forEach(proj => scene.remove(proj));
        projectiles.length = 0;

        // Update level for camera view (if needed)
        currentLevel = (currentLevel % 2) + 1; // Cycle between levels: 1 and 2

        // Advance enemy formation phase if not already at phase 5
        if (enemyPhase < 5) {
            enemyPhase++;
        }
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
    // Remove existing aliens
    aliens.forEach(alien => scene.remove(alien));
    aliens.length = 0;
    
    let rows, cols;
    if (enemyPhase === 1) {
        rows = 2; cols = 3;
    } else if (enemyPhase === 2) {
        rows = 3; cols = 3;
    } else if (enemyPhase === 3) {
        rows = 4; cols = 4;
    } else if (enemyPhase === 4) {
        rows = 4; cols = 8;
    } else {
        rows = 5; cols = 8;
    }
    
    const alienSpacing = 1.5;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const alienGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const alienMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            const alien = new THREE.Mesh(alienGeometry, alienMaterial);
            alien.position.set((c - cols / 2) * alienSpacing, (r - rows / 2) * alienSpacing + 2, 0);
            scene.add(alien);
            aliens.push(alien);
        }
    }
    console.log("Aliens reset for phase " + enemyPhase);
}

// ========================== GAME BOX (VISIBLE BOUNDARIES) ==========================
function createGameBox() {
    const boxWidth = 16;   // Adjust for horizontal limits (Ship + Alien formation)
    const boxHeight = 12;  // Ensure all aliens fit inside
    const boxDepth = 1;    // Flat box for 2D gameplay

    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const edges = new THREE.EdgesGeometry(boxGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // RED for clear visibility
    const gameBox = new THREE.LineSegments(edges, lineMaterial);
    
    gameBox.position.set(0, 0, -1); // Slightly back to avoid covering player/aliens
    scene.add(gameBox);
}
