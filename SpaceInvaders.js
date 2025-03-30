document.getElementById("playButton").addEventListener("click", () => {
  setTimeout(startGame, 1000);
});

let currentLevel = 1; 
let enemyPhase = 1; 
let scene, camera, renderer;
let aliens = [];
let player;
let projectiles = [];
let playAreaLimit = 11;
let playerSpeed = 0.1;
const keys = {};

const horizontalOffset = -2; 

// Global variables for discrete alien movement
let alienDirection = 1;         // 1 means moving right, -1 means left
let lastAlienMoveTime = Date.now();
const alienMoveDelay = 1000;    // ms between moves
const horizontalStep = 2;
const verticalStep = 2;

// Global game scoring and lives
let points = 0;
let playerLives = 3;
let gameOver = false;

async function loadShader(url) {
  const response = await fetch(url);
  return response.text();
}

// ------------------- Leaderboard Setup -------------------
// Prefill the leaderboard with sample data for testing
function prefillLeaderboard() {
  const existing = getLeaderboardData();
  if (existing.length > 0) {
    return;
  }

  const initialData = [
    { name: "%app%", score: 10000 },
    { name: "Teste",  score: 90 },
    { name: "AHHHH",  score: 70 },
    { name: "Quart",  score: 60 },
    { name: "Quint",  score: 55 },
    { name: "Sexto",  score: 50 },
    { name: "Seti",   score: 40 },
    { name: "Oitav",  score: 30 },
    { name: "Non",    score: 25 },
  ];
  saveLeaderboardData(initialData);
}

function getLeaderboardData() {
  const stored = localStorage.getItem('leaderboard');
  return stored ? JSON.parse(stored) : [];
}

function saveLeaderboardData(data) {
  localStorage.setItem('leaderboard', JSON.stringify(data));
}

function storeNewScore(name, score) {
  const data = getLeaderboardData();
  data.push({ name, score });
  saveLeaderboardData(data);
}

function updateLeaderboard() {
  const data = getLeaderboardData();
  // Sort descending by score
  data.sort((a, b) => b.score - a.score);
  data.splice(9);

  const container = document.getElementById("leaderboardContent");
  container.innerHTML = "";

  data.forEach((entry, index) => {
    const rank = index + 1;
    let suffix;
    switch (rank) {
      case 1: suffix = "ST"; break;
      case 2: suffix = "ND"; break;
      case 3: suffix = "RD"; break;
      default: suffix = "TH"; break;
    }

    // Create row container
    const row = document.createElement("div");
    row.classList.add("leaderboard-row");

    // POS column
    const posDiv = document.createElement("div");
    posDiv.classList.add("leaderboard-pos");
    posDiv.textContent = `${rank}${suffix}`;
    row.appendChild(posDiv);

    // NAME column
    const nameDiv = document.createElement("div");
    nameDiv.classList.add("leaderboard-name");
    nameDiv.textContent = entry.name;
    if (rank === 1){ nameDiv.style.color = "blue"; } 
    else if (rank === 2){ nameDiv.style.color = "orange"; } 
    else if (rank === 3){ nameDiv.style.color = "green"; } 
    else { nameDiv.style.color = "yellow"; }
    row.appendChild(nameDiv);

    // SCORE column
    const scoreDiv = document.createElement("div");
    scoreDiv.classList.add("leaderboard-score");
    scoreDiv.textContent = entry.score;
    row.appendChild(scoreDiv);

    container.appendChild(row);
  });
}

// ------------------- Score Board & Lives Display -------------------
function updateScoreBoard() {
  const scoreBoard = document.getElementById("scoreBoard");
  scoreBoard.innerHTML = `Score : ${points}`;
}

// NEW: separate function to update the "lives" container
function updateLivesDisplay() {
  const livesEl = document.getElementById("livesContainer");
  livesEl.innerHTML = `Lifes: ${playerLives}`;
}

// ------------------- 3D to 2D Projection Helper -------------------
function toScreenPosition(obj, camera) {
  const vector = new THREE.Vector3();
  const widthHalf = window.innerWidth / 2;
  const heightHalf = window.innerHeight / 2;

  vector.copy(obj.position);
  vector.project(camera);

  vector.x = (vector.x * widthHalf) + widthHalf;
  vector.y = -(vector.y * heightHalf) + heightHalf;

  return { x: vector.x, y: vector.y };
}

// We'll call this in the render loop to position .lives-container
function updateLivesPosition() {
  const livesEl = document.getElementById('livesContainer');
  // Get the canvas's actual position and size
  const canvasRect = renderer.domElement.getBoundingClientRect();
  
  const vector = new THREE.Vector3();
  vector.copy(player.position);
  vector.project(camera);

  // Convert normalized device coordinates to canvas pixel coordinates
  const x = (vector.x + 1) / 2 * canvasRect.width + canvasRect.left;
  const y = (-vector.y + 1) / 2 * canvasRect.height + canvasRect.top;
  
  // Offsets so the lives display is positioned next to the ship
  const offsetX = 30;
  const offsetY = -10;
  
  livesEl.style.left = (x + offsetX) + 'px';
  livesEl.style.top = (y + offsetY) + 'px';
}


// ------------------- Keyboard Handling -------------------
document.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
  if (event.key === " ") {
    shootProjectile();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// ------------------- Game Initialization -------------------
async function startGame() {
  // Reset game variables
  points = 0;
  playerLives = 3;
  gameOver = false;
  updateScoreBoard();

  const livesEl = document.getElementById("livesContainer");
  livesEl.classList.remove("hidden");
  updateLivesDisplay();

  // THREE.JS SETUP (Main Game Scene)
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  setCameraView();

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // LIGHTING
  const light = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(light);

  // PLAYER SETUP
  const playerGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
  const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.position.y = -5;
  player.position.x = horizontalOffset; // apply horizontal offset
  scene.add(player);

  projectiles = [];
  resetAliens();
  createGameBox();

  // Load Shader Background
  const fragmentShaderCode = await loadShader('/shaders/space.glsl');
  const backgroundScene = new THREE.Scene();
  const backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  backgroundCamera.position.z = 1;

  const backgroundMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: fragmentShaderCode,
    depthWrite: false
  });

  const backgroundMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backgroundMaterial);
  backgroundScene.add(backgroundMesh);

  // Resize Handler
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    backgroundMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  // Main Render Loop (Shader always running)
  function animate() {
    requestAnimationFrame(animate);

    // Update Shader background continuously
    backgroundMaterial.uniforms.u_time.value += clock.getDelta();

    if (!gameOver) {
      updatePlayerMovement();

      for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        projectile.position.y += 0.1;
        if (projectile.position.y > 5) {
          scene.remove(projectile);
          projectiles.splice(pIndex, 1);
        }
      }

      for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        for (let aIndex = aliens.length - 1; aIndex >= 0; aIndex--) {
          const alien = aliens[aIndex];
          const dx = projectile.position.x - alien.position.x;
          const dy = projectile.position.y - alien.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 0.4) {
            scene.remove(alien);
            scene.remove(projectile);
            aliens.splice(aIndex, 1);
            projectiles.splice(pIndex, 1);
            points += 10;
            updateScoreBoard();
            break;
          }
        }
      }

      updateAliens();
      checkPlayerCollision();
      checkLevelCompletion();

      updateLivesPosition();
    }

    // Always render background and scene (even during Game Over)
    renderer.autoClear = false;
    renderer.clear();
    renderer.render(backgroundScene, backgroundCamera);
    renderer.render(scene, camera);
  }

  animate();
}


// ------------------- Player Movement -------------------
function updatePlayerMovement() {
  if (keys["a"] || keys["arrowleft"]) {
    player.position.x = Math.max(-playAreaLimit + horizontalOffset, player.position.x - playerSpeed);
  }
  if (keys["d"] || keys["arrowright"]) {
    player.position.x = Math.min(playAreaLimit + horizontalOffset, player.position.x + playerSpeed);
  }
}

// ------------------- Projectiles -------------------
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

// ------------------- Alien Movement (Discrete Steps) -------------------
function updateAliens() {
  const now = Date.now();
  if (now - lastAlienMoveTime < alienMoveDelay) return;
  lastAlienMoveTime = now;

  const leftBoundary = -11 + horizontalOffset; // apply horizontal offset
  const rightBoundary = 11 + horizontalOffset; // apply horizontal offset
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
  for (let i = 0; i < aliens.length; i++) {
    const alien = aliens[i];
    const xDist = Math.abs(alien.position.x - player.position.x);
    const yDist = Math.abs(alien.position.y - player.position.y);
    if (xDist < (0.5 + 0.3) && yDist < (0.25 + 0.3)) {
      console.log("Player hit!");
      playerLives--;
      updateScoreBoard();
      updateLivesDisplay();  // <--- Refresh lives UI
      if (playerLives <= 0) {
        console.log("Game Over!");
        gameOver = true;
        displayGameOverPopup();
      }
      break;
    }
  }
}

// ------------------- Game Over Popup -------------------
function displayGameOverPopup() {
  const overlay = document.getElementById("gameOverOverlay");
  overlay.classList.remove("hidden");

  const input = document.getElementById("gameOverInput");
  input.innerText = "";
  input.focus();

  const newInputHandler = function enforceMaxLength() {
    if (input.innerText.length > 5) {
      input.innerText = input.innerText.substring(0, 5);
      placeCaretAtEnd(input);
    }
  };
  input.removeEventListener("input", newInputHandler);
  input.addEventListener("input", newInputHandler);

  function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  const submitButton = document.getElementById("gameOverSubmit");
  submitButton.onclick = function () {
    const playerName = input.innerText.trim();
    console.log("Player Name:", playerName);
    storeNewScore(playerName, points);
    location.reload();
  };
}

// ------------------- Main Render Loop -------------------
function animate() {
  if (gameOver) return;
  requestAnimationFrame(animate);

  updatePlayerMovement();

  // Update projectile positions
  for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
    const projectile = projectiles[pIndex];
    projectile.position.y += 0.1;
    if (projectile.position.y > 5) {
      scene.remove(projectile);
      projectiles.splice(pIndex, 1);
    }
  }

  // Check collisions with aliens
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
        points += 10;
        updateScoreBoard();
        break;
      }
    }
  }

  updateAliens();
  checkPlayerCollision();
  checkLevelCompletion();

  // Render the scene
  renderer.render(scene, camera);

  // Move the "Lives" display to follow the ship
  updateLivesPosition();
}

// ------------------- Level Progression -------------------
function checkLevelCompletion() {
  if (aliens.length === 0) {
    points += 50;
    updateScoreBoard();
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
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    console.log("2D");
  } else if (currentLevel === 2) {
    camera.position.set(0, -15, 3);
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
  
  const baseYOffset = 4;
  const alienSpacing = 1.5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const alienGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const alienMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const alien = new THREE.Mesh(alienGeometry, alienMaterial);
      alien.position.set(
        (c - cols / 2) * alienSpacing + horizontalOffset, // apply horizontal offset
        (r - rows / 2) * alienSpacing + baseYOffset,
        0
      );
      scene.add(alien);
      aliens.push(alien);
    }
  }
  console.log("Aliens reset for phase " + enemyPhase);
}

// ------------------- Game Box (Visible Boundaries) -------------------
function createGameBox() {
  const boxWidth = 22;
  const boxHeight = 16;
  const boxDepth = 1;
  const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  const edges = new THREE.EdgesGeometry(boxGeometry);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const gameBox = new THREE.LineSegments(edges, lineMaterial);
  gameBox.position.set(horizontalOffset, 0, -1);  // apply horizontal offset
  scene.add(gameBox);
}


// Prefill leaderboard data on load
prefillLeaderboard();
updateLeaderboard();
