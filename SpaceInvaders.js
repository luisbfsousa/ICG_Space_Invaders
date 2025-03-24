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
let alienDirection = 1;         // 1 means moving right, -1 means left
let lastAlienMoveTime = Date.now();
const alienMoveDelay = 1000;    // ms between moves
const horizontalStep = 2;
const verticalStep = 2;

// Global game scoring and lives
let points = 0;
let playerLives = 3;
let gameOver = false;

// Prefill the leaderboard with sample data for testing
function prefillLeaderboard() {
  const existing = getLeaderboardData();
  if (existing.length > 0) {
    return;
  }

  const initialData = [
    { name: "%app%", score: 10000 },
    { name: "Teste",  score: 90 },
    { name: "AHHHH", score: 70 },
    { name: "Quart",   score: 60 },
    { name: "Quint",   score: 55 },
    { name: "Sexto",    score: 50 },
    { name: "Seti",   score: 40 },
    { name: "Oitav",   score: 30 },
    { name: "Non",     score: 25 },
  ];
  saveLeaderboardData(initialData);
}

// ========================== SCOREBOARD ==========================
function updateScoreBoard() {
  const scoreBoard = document.getElementById("scoreBoard");
  scoreBoard.innerHTML = `Points<br>&nbsp;&nbsp;${points}<br><br>Lifes<br>&nbsp;&nbsp;${playerLives}`;
}

// ========================== LEADERBOARD STORAGE ==========================
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
    // Apply special colors for the top three
    if (rank === 1) {
      nameDiv.style.color = "blue";
    } else if (rank === 2) {
      nameDiv.style.color = "orange";
    } else if (rank === 3) {
      nameDiv.style.color = "green";
    } else {
      nameDiv.style.color = "yellow";
    }
    row.appendChild(nameDiv);

    // SCORE column
    const scoreDiv = document.createElement("div");
    scoreDiv.classList.add("leaderboard-score");
    scoreDiv.textContent = entry.score;
    row.appendChild(scoreDiv);

    container.appendChild(row);
  });
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

// ========================== GAME START ==========================
function startGame() {
  // Reset game variables
  points = 0;
  playerLives = 3;
  gameOver = false;
  updateScoreBoard();

  // Show scoreboard & leaderboard
  const scoreBoard = document.getElementById("scoreBoard");
  scoreBoard.classList.remove("hidden");
  const leaderboard = document.getElementById("leaderboard");
  leaderboard.classList.remove("hidden");
  updateLeaderboard();
  
  // THREE.JS SETUP
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  setCameraView();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // LIGHTING
  const light = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(light);

  // PLAYER SETUP
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

// ========================== PLAYER MOVEMENT ==========================
function updatePlayerMovement() {
  if (keys["a"] || keys["arrowleft"]) {
    player.position.x = Math.max(-playAreaLimit, player.position.x - playerSpeed);
  }
  if (keys["d"] || keys["arrowright"]) {
    player.position.x = Math.min(playAreaLimit, player.position.x + playerSpeed);
  }
}

// ========================== PROJECTILES ==========================
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
  if (now - lastAlienMoveTime < alienMoveDelay) return;
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
      break;
    }
  }
}

// ========================== GAME OVER POPUP ==========================
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

// ========================== GAME LOOP ==========================
function animate() {
  if (gameOver) return;
  requestAnimationFrame(animate);
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
  renderer.render(scene, camera);
}

// ========================== LEVEL PROGRESSION ==========================
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
      alien.position.set((c - cols / 2) * alienSpacing,
                         (r - rows / 2) * alienSpacing + baseYOffset,
                         0);
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

// For testing, prefill the leaderboard on load
prefillLeaderboard();
updateLeaderboard();