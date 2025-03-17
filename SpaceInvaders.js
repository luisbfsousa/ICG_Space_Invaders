document.getElementById("playButton").addEventListener("click", () => {
    setTimeout(startGame, 1000); // Start game after menu transition
});

let currentLevel = 1; // Track level progression
let scene, camera, renderer, aliens = [];

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
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = -3;
    scene.add(player);

    const playAreaLimit = 5; // Expanded player movement area

    resetAliens(); // Initialize first wave of aliens

    // ========================== PROJECTILE SETUP ==========================
    const projectiles = [];
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

    // ========================== MOVEMENT HANDLING ==========================
    const playerSpeed = 0.1;
    document.addEventListener("keydown", (event) => {
        if (event.key === "a" || event.key === "A") {
            player.position.x = Math.max(-playAreaLimit, player.position.x - playerSpeed);
        } else if (event.key === "d" || event.key === "D") {
            player.position.x = Math.min(playAreaLimit, player.position.x + playerSpeed);
        } else if (event.key === " ") { // Spacebar
            shootProjectile();
        }
    });

    // ========================== GAME LOOP ==========================
    function animate() {
        requestAnimationFrame(animate);
        projectiles.forEach((projectile, index) => {
            projectile.position.y += 0.1;
            if (projectile.position.y > 5) {
                scene.remove(projectile);
                projectiles.splice(index, 1);
            }
        });
        checkLevelCompletion();
        renderer.render(scene, camera);
    }
    animate();
}

// ========================== LEVEL PROGRESSION ==========================
function checkLevelCompletion() {
    if (aliens.length === 0) {
        currentLevel = (currentLevel % 2) + 1; // Cycle through levels: 1 -> 2 -> 3 -> 1
        setCameraView();
        resetAliens();
    }
}

function setCameraView() {
    if (!camera) return;
    if (currentLevel === 1) {
        camera.position.set(0, 0, 10); // Classic 2D View
        camera.lookAt(0, 0, 0);
    } else if (currentLevel === 2) {
        camera.position.set(0, -15, 4); // Almost Flat POV
        camera.lookAt(0, 0, 0);
    }
    console.log(`Switched to Level ${currentLevel}`);
}

function resetAliens() {
    if (!scene) return;
    aliens.forEach(alien => scene.remove(alien));
    aliens.length = 0;
    const rows = 5;
    const cols = 8;
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
    console.log("Aliens reset for new level");
}