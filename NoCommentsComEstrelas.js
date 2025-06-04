document.getElementById("playButton").addEventListener("click", () => {
  setTimeout(startGame, 800);
});

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createOctopus, createSquid, createCrab } from './models/enemys.js';
import { createFullHeart } from './models/hearts.js';


window.THREE = THREE;

let currentLevel = 1; 
let enemyPhase = 1; 
let scene, camera, renderer;
let aliens = [];
let player;
let projectiles = [];
let playAreaLimit = 11;
let playerSpeed = 0.1;
const keys = {};
let alienProjectiles = [];
let shootingStars = [];
let lastShootingStarTime = 0;
const shootingStarInterval = 10000;

const horizontalOffset = -2; 

let particleSystems = [];
const PARTICLE_LIFETIME = 1000;

let cameraTargetPosition = new THREE.Vector3();
let cameraTargetLookAt = new THREE.Vector3();
let isCameraTransitioning = false;

let alienDirection = 1;
let lastAlienMoveTime = Date.now();
const alienMoveDelay = 1000;
const horizontalStep = 1;
const verticalStep = 1;

const PLAYER_PROJECTILE_SPEED = 0.1;
const PLAYER_PROJECTILE_RANGE = 7;

let points = 0;
let playerLives = 3;
let gameOver = false;

let heartGroup;
let uiScene, uiCamera;

const wanderingPlanets = [];
let lastPlanetSpawnTime = 0;
const planetSpawnInterval = 1000;
const planetFrustum = new THREE.Frustum();
const planetCamMatrix = new THREE.Matrix4();

let cameraShakeOffset = new THREE.Vector3(0, 0, 0);

const sounds = {
  shoot: new Audio('sounds/shoot.mp3'),
  impact: new Audio('sounds/impact.mp3'),
  death: new Audio('sounds/death.mp3')
};

Object.values(sounds).forEach(sound => {
  sound.preload = 'auto';
  sound.volume = 0.5;
});

async function loadShader(url) {
  const response = await fetch(url);
  return response.text();
}

function createExplosion(position, color, count = 50, type = "normal") {
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesMaterial = new THREE.PointsMaterial({
    color: color,
    size: type === "fire" ? 0.15 : 0.1,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending
  });

  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const opacities = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * (type === "fire" ? 1 : 0.5);
    positions[i * 3 + 1] = (Math.random() - 0.5) * (type === "fire" ? 1 : 0.5);
    positions[i * 3 + 2] = (Math.random() - 0.5) * (type === "fire" ? 1 : 0.5);

    velocities[i * 3] = (Math.random() - 0.5) * (type === "fire" ? 0.05 : 0.2);
    velocities[i * 3 + 1] = (Math.random() - 0.5) * (type === "fire" ? 0.05 : 0.2);
    velocities[i * 3 + 2] = (Math.random() - 0.5) * (type === "fire" ? 0.05 : 0.2);

    opacities[i] = 1;
    sizes[i] = (type === "fire" ? 0.15 : 0.1) + Math.random() * 0.1;
    
    if (type === "fire") {
      const r = 1.0;
      const g = 0.4 + Math.random() * 0.5;
      const b = Math.random() * 0.2;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    } else {
      const hexColor = new THREE.Color(color);
      colors[i * 3] = hexColor.r;
      colors[i * 3 + 1] = hexColor.g;
      colors[i * 3 + 2] = hexColor.b;
    }
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  particlesGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  particles.position.copy(position);
  particles.userData = {
    lifetime: 0,
    maxLifetime: type === "fire" ? PARTICLE_LIFETIME * 8 : PARTICLE_LIFETIME,
    velocities: velocities,
    opacities: opacities,
    sizes: sizes,
    type: type,
    flickerInterval: Math.random() * 100 + 50
  };
  
  scene.add(particles);
  particleSystems.push(particles);
  return particles;
}

function updateParticles() {
  const now = Date.now();
  
  for (let i = particleSystems.length - 1; i >= 0; i--) {
    const particles = particleSystems[i];
    const positions = particles.geometry.attributes.position.array;
    const velocities = particles.userData.velocities;
    const opacities = particles.userData.opacities;
    const sizes = particles.userData.sizes;
    const colors = particles.geometry.attributes.color.array;
    
    particles.userData.lifetime += 16;
    
    if (particles.userData.type === "fire") {
      for (let j = 0; j < positions.length; j += 3) {
        positions[j] += velocities[j] * 0.5;
        positions[j + 1] += velocities[j + 1] * 0.5 - 0.01;
        positions[j + 2] += velocities[j + 2] * 0.5;
        
        if (now % particles.userData.flickerInterval < 16) {
          colors[j + 1] = Math.min(1, colors[j + 1] * (0.9 + Math.random() * 0.2));
        }
      }
      
      const progress = particles.userData.lifetime / (PARTICLE_LIFETIME * 12);
      for (let j = 0; j < opacities.length; j++) {
        opacities[j] = 1 - progress * progress;
        sizes[j] *= 0.999;
      }
    } else {
      for (let j = 0; j < positions.length; j += 3) {
        positions[j] += velocities[j];
        positions[j + 1] += velocities[j + 1];
        positions[j + 2] += velocities[j + 2];
      }
      
      const progress = particles.userData.lifetime / PARTICLE_LIFETIME;
      for (let j = 0; j < opacities.length; j++) {
        opacities[j] = 1 - progress;
        sizes[j] *= 0.99;
      }
    }
    
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.opacity.needsUpdate = true;
    particles.geometry.attributes.size.needsUpdate = true;
    particles.geometry.attributes.color.needsUpdate = true;
    
    if (particles.userData.lifetime >= particles.userData.maxLifetime) {
      scene.remove(particles);
      particleSystems.splice(i, 1);
    }
  }
}

function prefillLeaderboard() {
  const existing = getLeaderboardData();
  if (existing.length > 0) return;

  const initialData = [{ name: "%app%",score: 10000 },{ name: "Teste",score: 90 },{ name: "AHHHH",score: 70 },{ name: "Quart",score: 60 },{ name: "Quint",score: 55 },{ name: "Sexto",score: 50 },{ name: "Seti",score: 40 },{ name: "Oitav",score: 30 },{ name: "Non",score: 25 }];
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

    const row = document.createElement("div");
    row.classList.add("leaderboard-row");

    const posDiv = document.createElement("div");
    posDiv.classList.add("leaderboard-pos");
    posDiv.textContent = `${rank}${suffix}`;
    row.appendChild(posDiv);

    const nameDiv = document.createElement("div");
    nameDiv.classList.add("leaderboard-name");
    nameDiv.textContent = entry.name;
    if (rank === 1){ nameDiv.style.color = "blue"; } 
    else if (rank === 2){ nameDiv.style.color = "orange"; } 
    else if (rank === 3){ nameDiv.style.color = "green"; } 
    else { nameDiv.style.color = "yellow"; }
    row.appendChild(nameDiv);

    const scoreDiv = document.createElement("div");
    scoreDiv.classList.add("leaderboard-score");
    scoreDiv.textContent = entry.score;
    row.appendChild(scoreDiv);

    container.appendChild(row);
  });
}

function updateScoreBoard() {
  const scoreBoard = document.getElementById("scoreBoard");
  scoreBoard.innerHTML = `Score : ${points}`;
}

//function updateLivesDisplay() {
//  const livesEl = document.getElementById("livesContainer");
//  livesEl.innerHTML = `Lifes: ${playerLives}`;
//}

function allAliensInPosition() {
  return aliens.every(alien => alien.userData.targetX === undefined);
}

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

function createColoredPlanet(size = 1, color = 0xaaaaaa, hasRing = false) {
  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.2,
    emissive: color,
    emissiveIntensity: 0.05
  });

  const planet = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(planet);

  if (hasRing) {
    const ringInner = size * 1.2;
    const ringOuter = size * 1.8;
    const ringGeometry = new THREE.RingGeometry(ringInner, ringOuter, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2.5;
    ring.rotation.z = Math.random() * Math.PI;
    ring.position.y = 0; // align with planet

    group.add(ring);
    group.userData.hasRing = true;
  }

  return group;
}

function applyCameraShake(duration = 300, magnitude = 0.02) {
  const shakeStartTime = Date.now();

  function shake() {
    const elapsed = Date.now() - shakeStartTime;
    if (elapsed < duration) {
      cameraShakeOffset.set(
        (Math.random() - 0.5) * magnitude,
        (Math.random() - 0.5) * magnitude,
        (Math.random() - 0.5) * magnitude
      );
      setTimeout(shake, 16);
    } else {
      cameraShakeOffset.set(0, 0, 0);
    }
  }

  shake();
}


function spawnRandomPlanet() {
  if (wanderingPlanets.length >= 5) return;

  const size = Math.random() * 2 + 1;
  const colors = [0x777777, 0x554433, 0x669999, 0x888888, 0x333366];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const hasRing = Math.random() < 0.3;

  const planet = createColoredPlanet(size, color, hasRing);

  let x = (Math.random() - 0.5) * 100;
  let y, z;

  if (currentLevel === 1) {
    // Z-based background
    y = 20;
    z = -30 - Math.random() * 20;
  } else {
    // Y-based deep sky background
    y = 60 + Math.random() * 20;
    z = -50 - Math.random() * 20;
  }

  planet.position.set(x, y, z);

  const direction = new THREE.Vector3(
    (Math.random() - 0.5),
    0,
    (Math.random() - 0.5)
  ).normalize();

  planet.userData.velocity = direction.multiplyScalar(0.15 + Math.random() * 0.05);
  scene.add(planet);
  wanderingPlanets.push(planet);
}


//function updateLivesPosition() {
//  const livesEl = document.getElementById('livesContainer');
//  livesEl.style.position = 'fixed';
//  livesEl.style.left = '20px';
//  livesEl.style.top = '20px';
//}

document.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;
  if (event.key === " ") {
    shootProjectile();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function createShootingStar() {
  const now = Date.now();
  if (now - lastShootingStarTime < 1000 || shootingStars.length > 0) return;
  lastShootingStarTime = now;

  const fixedZ = 4;
  const startX = (Math.random() * 20 - 10) + horizontalOffset; // wider X range
  const startY = 35;
  const midX = startX + (Math.random() * 8 - 4);
  const playerY = player?.position?.y || -5;
  const endX = startX + (Math.random() * 10 - 5);
  const endY = -20; // Behind player

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(startX, startY, fixedZ),
    new THREE.Vector3(midX, playerY, fixedZ),
    new THREE.Vector3(endX, endY, fixedZ)
  );

  const points = curve.getPoints(70);

  const fullPath = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({
      color: 0x88ccff,
      dashSize: 0.5,
      gapSize: 0.3,
      linewidth: 1,
      transparent: true,
      opacity: 0.5
    })
  );
  fullPath.computeLineDistances();
  scene.add(fullPath);

  const starLight = new THREE.PointLight(0xfff4e6, 0, 50, 2.5);
  starLight.position.set(startX, startY, fixedZ);
  starLight.castShadow = true;
  starLight.shadow.mapSize.width = 1024;
  starLight.shadow.mapSize.height = 1024;
  starLight.shadow.bias = -0.003;
  starLight.shadow.radius = 5;
  scene.add(starLight);

  const star = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfff4e6,
      emissive: 0xfff4e6,
      emissiveIntensity: 0,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0
    })
  );
  star.position.set(startX, startY, fixedZ);
  star.castShadow = true;
  star.receiveShadow = true;
  scene.add(star);

  const directionalLight = new THREE.DirectionalLight(0xfff4e6, 2.5);
  directionalLight.position.set(startX, startY, fixedZ + 5);
  directionalLight.target.position.set(startX, startY, fixedZ);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.bias = -0.002;
  directionalLight.shadow.radius = 6;
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  const trail = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.7,
      linewidth: 1.5
    })
  );
  scene.add(trail);

  shootingStars.push({
    light: starLight,
    directionalLight,
    star,
    trail,
    fullPath,
    points,
    currentPoint: 0,
    speed: 0.12 + Math.random() * 0.04,
    maxIntensity: 200
  });
}


function updateShootingStars() {
  let spawnNext = false;

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const starData = shootingStars[i];
    starData.currentPoint += starData.speed;

    if (starData.currentPoint >= starData.points.length) {
      scene.remove(
        starData.light,
        starData.directionalLight,
        starData.directionalLight.target,
        starData.star,
        starData.trail,
        starData.fullPath
      );
      shootingStars.splice(i, 1);
      spawnNext = true;
      continue;
    }

    const pointIndex = Math.min(Math.floor(starData.currentPoint), starData.points.length - 1);
    const progress = starData.currentPoint - pointIndex;
    const position = starData.points[pointIndex].clone().lerp(
      starData.points[Math.min(pointIndex + 1, starData.points.length - 1)],
      progress
    );

    starData.light.position.copy(position);
    starData.directionalLight.position.copy(position.clone().add(new THREE.Vector3(0, 0, 5)));
    starData.directionalLight.target.position.copy(position);
    starData.star.position.copy(position);

    const trailPoints = starData.points.slice(Math.max(0, pointIndex - 10), pointIndex + 1);
    trailPoints.push(position.clone());
    starData.trail.geometry.dispose();
    starData.trail.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);

    const progressRatio = starData.currentPoint / starData.points.length;
    starData.fullPath.material.opacity = 0.3 * (1 - progressRatio);

    const totalDist = starData.points[0].distanceTo(starData.points[starData.points.length - 1]);
    const curDist = starData.points[0].distanceTo(position);
    const fadeInDist = 12, fadeOutDist = 12;

    let fadeFactor = 1.0;
    if (curDist < fadeInDist) {
      fadeFactor = curDist / fadeInDist;
    } else if (totalDist - curDist < fadeOutDist) {
      fadeFactor = (totalDist - curDist) / fadeOutDist;
    }

    starData.light.intensity = starData.maxIntensity * fadeFactor;
    starData.directionalLight.intensity = 0;
    starData.star.material.emissiveIntensity = 1.5 * fadeFactor;
    starData.star.material.opacity = fadeFactor;
  }

  if (spawnNext) lastShootingStarTime = Date.now();

  if (shootingStars.length === 0 && Date.now() - lastShootingStarTime >= 1000) {
    createShootingStar();
  }
}


function updateHeartDisplay() {
  for (let i = 0; i < heartGroup.children.length; i++) {
    heartGroup.children[i].visible = i < playerLives;
  }
}

function createSphericalMoon() {
  const moonRadius = 30;
  const moonGeometry = new THREE.SphereGeometry(moonRadius, 128, 128);

  const moonTexture = new THREE.TextureLoader().load('images/moon_texture.jpg', (texture) => {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    // Force a render update if needed
    renderer.renderLists.dispose();
  });

  const moonMaterial = new THREE.MeshStandardMaterial({ 
    map: moonTexture,
    roughness: 0.9,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(horizontalOffset, 0, -33);
  moon.receiveShadow = true;
  moon.castShadow = true;

  // ✅ Assign the rotation axis *after* moon is defined
  const rotationAxis = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  ).normalize();
  moon.userData.rotationAxis = rotationAxis;

  return moon;
}

async function startGame() {
  points = 0;
  playerLives = 3;
  gameOver = false;
  updateScoreBoard();

  document.getElementById("changeCameraButton").classList.remove("hidden");

  //const livesEl = document.getElementById("livesContainer");
  //livesEl.classList.remove("hidden");
  //updateLivesDisplay();

  scene = new THREE.Scene();
  scene.background = null;

  scene = new THREE.Scene();
  scene.background = null;

  uiScene = new THREE.Scene();
  uiCamera = new THREE.OrthographicCamera(
    -window.innerWidth / 2, window.innerWidth / 2,
    window.innerHeight / 2, -window.innerHeight / 2,
    0.1, 10
  );
  uiCamera.position.z = 1;

  heartGroup = new THREE.Group();

  for (let i = 0; i < 3; i++) {
    const heart = createFullHeart();
    const spacing = 60;

    for (let i = 0; i < 3; i++) {
      const heart = createFullHeart();
      heart.scale.setScalar(2.5);
      heart.position.set(i * spacing, 0, 0);
      heartGroup.add(heart);
    } 
    
    heartGroup.add(heart);
  }

  heartGroup.position.set(-window.innerWidth / 2 + 20,window.innerHeight / 2 - 50,-0.5);

  uiScene.add(heartGroup);

  //const debugBox = new THREE.Mesh(
  //  new THREE.BoxGeometry(200, 200, 1),
  //  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  //);
  //debugBox.position.set(0, 0, 0);
  //heartGroup.add(debugBox);

  //console.log("Hearts in group:", heartGroup.children.length);

  updateHeartDisplay();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  setCameraView();

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  const moon = createSphericalMoon();
  scene.add(moon);

  renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  document.body.appendChild(renderer.domElement);

  renderer.physicallyCorrectLights = true;
  scene.environment = new THREE.AmbientLight(0x404040, 0.5);

  const light = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Reduced intensity from 1.5 to 0.8
  directionalLight.position.set(0, 10, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024; // Reduced resolution for softer edges
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  // Add these properties for softer, more transparent shadows
  directionalLight.shadow.bias = -0.001; // Helps reduce shadow artifacts
  directionalLight.shadow.radius = 2; // Creates softer shadow edges
  directionalLight.shadow.darkness = 0.3; // Makes shadows more transparent (0-1, where 1 is darkest)

  scene.add(directionalLight);


  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync('models/spaceship.glb');
    player = gltf.scene;
    player.position.y = -5;
    player.position.x = horizontalOffset;
    player.scale.set(0.0025, 0.0025, 0.0025);
    player.traverse(function(node) {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    scene.add(player);

    if (currentLevel === 1) {
      player.rotation.set(-Math.PI/2, 0, Math.PI);
    }
  } catch (error) {
    console.error("Error loading spaceship:", error);
    const playerGeometry = new THREE.BoxGeometry(1, 0.5, 0.5);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = -5;
    player.position.x = horizontalOffset;
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player);
  }

  projectiles = [];
  resetAliens();
  //createGameBox();
  const asteroidBelt = createBelt();

  const fragmentShaderCode = await loadShader('space.txt');
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

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    backgroundMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
  
    backgroundMaterial.uniforms.u_time.value += clock.getDelta();

    updateParticles();
    updateShootingStars();
    createShootingStar();

    if (Date.now() - lastPlanetSpawnTime > planetSpawnInterval) {
      spawnRandomPlanet();
      lastPlanetSpawnTime = Date.now();
    }


    planetCamMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    planetFrustum.setFromProjectionMatrix(planetCamMatrix);

    for (let i = wanderingPlanets.length - 1; i >= 0; i--) {
      const planet = wanderingPlanets[i];
      planet.position.add(planet.userData.velocity);

      planet.rotation.y += 0.001;
      if (planet.userData.hasRing) {
        planet.rotation.z += 0.0005;
      }

      if (
        Math.abs(planet.position.x) > 120 ||
        Math.abs(planet.position.z) > 120
      ) {
        scene.remove(planet);
        wanderingPlanets.splice(i, 1);
      }
    }


    if (moon) {
      const axis = moon.userData.rotationAxis;
      moon.rotateOnAxis(axis, 0.001); // adjust speed if needed
    }

    if (!gameOver && asteroidBelt) {
      asteroidBelt.animate();
    }
  
    if (!gameOver) {
      updatePlayerMovement();
      updateParticles();

      if (currentLevel === 3 && !isCameraTransitioning) {
        const offset = new THREE.Vector3(0, 0.3, 0.5);
        camera.position.copy(player.position.clone().add(offset).add(cameraShakeOffset));
        const lookAt = player.position.clone().add(new THREE.Vector3(0, 500, 0));
        camera.lookAt(lookAt);
      }

      for (let i = alienProjectiles.length - 1; i >= 0; i--) {
        const bullet = alienProjectiles[i];
        bullet.position.y -= 0.1;
  
        if (bullet.position.y < -10) {
          scene.remove(bullet);
          alienProjectiles.splice(i, 1);
          continue;
        }
  
        const dx = bullet.position.x - player.position.x;
        const dy = bullet.position.y - player.position.y;
        const dz = bullet.position.z - player.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
        if (dist < 0.5 && !alienProjectiles[i].userData?.fromDodgingAlien) {
          scene.remove(bullet);
          alienProjectiles.splice(i, 1);
          playerLives--;
          //updateLivesDisplay();
          updateHeartDisplay();
          updateScoreBoard();
          sounds.impact.currentTime = 0;
          sounds.impact.play();
          if (playerLives > 0) {
            createExplosion(player.position.clone(), 0xffffff, 15);
            createExplosion(player.position.clone(), 0xff0000, 15);
          }
          if (currentLevel === 3 && playerLives > 0) {
            applyCameraShake();
          }
          if (playerLives <= 0) {
            createExplosion(player.position.clone(), 0xff0000, 500, "fire");
            createExplosion(player.position.clone(), 0xffffff, 500, "fire");
            scene.remove(player);
            player = null;
            gameOver = true;
            displayGameOverPopup();
            sounds.death.currentTime = 0;
            sounds.death.play();
          }
        }
      }
  
      for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        projectile.position.y += PLAYER_PROJECTILE_SPEED;
        if (projectile.position.y > PLAYER_PROJECTILE_RANGE) {
          scene.remove(projectile);
          projectiles.splice(pIndex, 1);
        }
      }

      //if (currentLevel === 3 && !isCameraTransitioning) {
      //  const offset = new THREE.Vector3(0, 0.3, 0.5);
      //  camera.position.copy(player.position.clone().add(offset));
      //  const lookAt = player.position.clone().add(new THREE.Vector3(0, 500, 0));
      //  camera.lookAt(lookAt);
      //}
      
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const playerBullet = projectiles[i];
        for (let j = alienProjectiles.length - 1; j >= 0; j--) {
          const alienBullet = alienProjectiles[j];
          const dx = playerBullet.position.x - alienBullet.position.x;
          const dy = playerBullet.position.y - alienBullet.position.y;
          const dz = playerBullet.position.z - alienBullet.position.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 0.3) {
            scene.remove(playerBullet);
            scene.remove(alienBullet);
            projectiles.splice(i, 1);
            alienProjectiles.splice(j, 1);
            break;
          }
        }
      }

      for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        projectile.position.y += PLAYER_PROJECTILE_SPEED;
      
        if (asteroidBelt.checkAsteroidHit(projectile)) {
          scene.remove(projectile);
          projectiles.splice(pIndex, 1);
          continue;
        }
      
        const projectileBox = new THREE.Box3().setFromObject(projectile);
        for (let aIndex = aliens.length - 1; aIndex >= 0; aIndex--) {
            const alien = aliens[aIndex];
            const alienBox = new THREE.Box3().setFromObject(alien);

            if (alienBox.intersectsBox(projectileBox) && !alien.userData.isDodging) {
                let explosionColor;
                switch(alien.userData.type) {
                    case 'octopus': explosionColor = 0xffee00; break;
                    case 'crab': explosionColor = 0x08ffff; break;
                    case 'squid': explosionColor = 0xec20eb; break;
                    default: explosionColor = 0xff0000; break;
                }

                createExplosion(alien.position.clone(), explosionColor, 30);

                scene.remove(alien);
                scene.remove(projectile);
                aliens.splice(aIndex, 1);
                projectiles.splice(pIndex, 1);
                points += 10;
                updateScoreBoard();
                sounds.impact.currentTime = 0;
                sounds.impact.play();
                break;
            }
        }
      
        if (projectile.position.y > PLAYER_PROJECTILE_RANGE) {
          scene.remove(projectile);
          projectiles.splice(pIndex, 1);
        }
      }
  
      updateAliens();
      aliens.forEach(alien => {
        if (alien.userData.targetX !== undefined) {
          alien.position.x = THREE.MathUtils.lerp(alien.position.x, alien.userData.targetX, 0.05);
          if (Math.abs(alien.position.x - alien.userData.targetX) < 0.05) {
            alien.position.x = alien.userData.targetX;
            delete alien.userData.targetX;
          }
        }
      });


      checkPlayerCollision();
      checkLevelCompletion();
      //updateLivesPosition();
    }
  
    if (isCameraTransitioning) {
      const currentPosition = camera.position.clone();
      const lerpSpeed = currentLevel === 3 ? 0.15 : 0.05;
          
      const newPosition = currentPosition.lerp(cameraTargetPosition, lerpSpeed);
      camera.position.copy(newPosition);
          
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      const newLook = currentLook.lerp(cameraTargetLookAt.clone().sub(camera.position).normalize(),lerpSpeed);
      camera.lookAt(camera.position.clone().add(newLook));
      camera.lookAt(camera.position.clone().add(newLook));
    
      const positionDiff = camera.position.distanceTo(cameraTargetPosition);
      const lookDiff = camera.getWorldDirection(new THREE.Vector3()).distanceTo(
        cameraTargetLookAt.clone().sub(camera.position).normalize()
      );
    
      if (positionDiff < 0.05 && lookDiff < 0.05) {
        camera.position.copy(cameraTargetPosition);
        camera.lookAt(cameraTargetLookAt);
        isCameraTransitioning = false;
        if (aliens.length === 0) {
          resetAliens();
        }
      }
    }

    renderer.autoClear = false;
    renderer.clear();
    renderer.render(backgroundScene, backgroundCamera);
    renderer.render(scene, camera);
    renderer.render(uiScene, uiCamera);
  }  

  animate();
}

function updatePlayerMovement() {
  if (keys["a"] || keys["arrowleft"]) {
    player.position.x = Math.max(-playAreaLimit + horizontalOffset, player.position.x - playerSpeed);
  }
  if (keys["d"] || keys["arrowright"]) {
    player.position.x = Math.min(playAreaLimit + horizontalOffset, player.position.x + playerSpeed);
  }
}

const maxProjectiles = 5;

function shootProjectile() {
  if (projectiles.length >= maxProjectiles) return;

  sounds.shoot.currentTime = 0;
  sounds.shoot.play();
  
  const projectileGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const projectileMaterial = new THREE.MeshBasicMaterial({
    color: 0x30bdff,
    transparent: true,
    opacity: 0.9
  });
  
  const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
  projectile.position.set(player.position.x, player.position.y + 0.5, 0);
  
  const glowGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x30bdff,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  projectile.add(glowMesh);
  
  scene.add(projectile);
  projectiles.push(projectile);
}

function alienShoot(alien) {
  const bulletGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const bulletMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0101,
    transparent: true,
    opacity: 0.9
  });
  
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
  bullet.position.set(alien.position.x, alien.position.y - 0.5, alien.position.z);
  
  const glowGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0101,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  bullet.add(glowMesh);
  
  bullet.userData.fromDodgingAlien = currentLevel === 2 && alien.userData.isDodging;
  scene.add(bullet);
  alienProjectiles.push(bullet);
}

function updateAliens() {
  if (!allAliensInPosition()) return;

  const now = Date.now();
  if (now - lastAlienMoveTime < alienMoveDelay) return;
  lastAlienMoveTime = now;

  const leftBoundary = -11 + horizontalOffset;
  const rightBoundary = 11 + horizontalOffset;
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
  const playerBox = new THREE.Box3().setFromObject(player);
  
  for (let i = 0; i < aliens.length; i++) {
    const alien = aliens[i];
    const alienBox = new THREE.Box3().setFromObject(alien);
    
    if (playerLives <= 0) {
      gameOver = true;
      displayGameOverPopup();
      sounds.death.currentTime = 0;
      sounds.death.play();
    }
  }
}

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
    let playerName = input.innerText.replace(/\s+/g, ' ').trim();
    if (playerName === "") playerName = "???";
    
    particleSystems.forEach(particles => {
      scene.remove(particles);
    });
    particleSystems = [];
    
    storeNewScore(playerName, points);
    location.reload();
  };
}

function checkLevelCompletion() {
  if (aliens.length === 0 && !gameOver && !isCameraTransitioning) {
    points += 50;
    updateScoreBoard();
    
    projectiles.forEach(proj => scene.remove(proj));
    projectiles.length = 0;
    alienProjectiles.forEach(proj => scene.remove(proj));
    alienProjectiles.length = 0;

    //currentLevel = (currentLevel % 3) + 1;
    
    if (enemyPhase < 5) {
      enemyPhase++;
    }

    console.log("Progressing to Level", currentLevel, "Phase", enemyPhase);
    
    setCameraView();
    resetAliens();
  }
}

function setCameraView() {
  if (!camera) return;

  isCameraTransitioning = true;

  if (currentLevel === 1) {
    cameraTargetPosition.set(0, 0, 10);
    cameraTargetLookAt.set(0, 0, 0);
  } else if (currentLevel === 2) {
    cameraTargetPosition.set(-1, -13, 2);
    cameraTargetLookAt.set(-1, 0, 0);
  } else if (currentLevel === 3) {
    cameraTargetPosition.copy(player.position.clone().add(new THREE.Vector3(0, 0.3, 0.5)));
    cameraTargetLookAt.copy(player.position.clone().add(new THREE.Vector3(0, 500, 0)));
  }

  aliens.forEach(alien => {
    if (currentLevel === 1) {
      alien.rotation.set(0, 0, 0);
      if (alien.userData?.originalZ !== undefined) {
        alien.position.z = alien.userData.originalZ;
      }
    } else {
      alien.rotation.set(Math.PI/2+0.2, 0, 0);
      alien.position.z = 0;
    }
    alien.userData.isDodging = false;
  });
}

function resetAliens() {
  if (!scene) return;
  aliens.forEach(alien => scene.remove(alien));
  aliens.length = 0;
  
  let rows, cols;
  if (enemyPhase === 1) { rows = 1; cols = 3; } 
  else if (enemyPhase === 2) { rows = 2; cols = 3; } 
  else if (enemyPhase === 3) { rows = 3; cols = 3; } 
  else{rows = 4; cols = 4; }
  //else if (enemyPhase === 4) { rows = 4; cols = 4; }  TODO demasiado lag, otimizar depois
  //else { rows = 5; cols = 5; }
  
  const baseYOffset = 7;
  const alienSpacing = 1.5;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let alienMesh;
      if (r < Math.floor(rows / 3)) {
          const octopus = createOctopus();
          alienMesh = octopus.mesh;
          alienMesh.userData = { 
              pixelArt: octopus,
              type: 'octopus',
              isDodging: false,
              originalZ: 0
          };
          alienMesh.castShadow = true;
          alienMesh.receiveShadow = true;
      } else if (r < Math.floor(rows * 2 / 3)) {
          const crab = createCrab();
          alienMesh = crab.mesh;
          alienMesh.userData = {
              pixelArt: crab,
              type: 'crab',
              isDodging: false,
              originalZ: 0
          };
          alienMesh.castShadow = true;
          alienMesh.receiveShadow = true;
      } else {
          const squid = createSquid();
          alienMesh = squid.mesh;
          alienMesh.userData = {
              pixelArt: squid,
              type: 'squid',
              isDodging: false,
              originalZ: 0
          };
          alienMesh.castShadow = true;
          alienMesh.receiveShadow = true;
      }

      const finalX = (c - cols / 2) * alienSpacing + horizontalOffset;
      const finalY = baseYOffset - (r * alienSpacing * 0.8);
      alienMesh.position.set(
        Math.random() < 0.5 ? -30 : 30, // spawn from left or right
        finalY,
        0
      );
      alienMesh.userData.targetX = finalX;
      
      alienMesh.scale.set(0.1, 0.1, 0.1);
      alienMesh.castShadow = true;
      alienMesh.receiveShadow = true;

      if (currentLevel !== 1) {
        alienMesh.rotation.set(Math.PI/2, 0, 0);
      }

      scene.add(alienMesh);
      aliens.push(alienMesh);

      alienMesh.userData.pixelArt = alienMesh.parent;

      alienMesh.userData.isDodging = false;
      alienMesh.userData.originalZ = alienMesh.position.z;

      const tryDodge = () => {
        if (gameOver || (currentLevel !== 2 && currentLevel !== 3) || !aliens.includes(alienMesh)) return;
        
        alienMesh.userData.isDodging = true;
        alienMesh.position.z += (Math.random() < 0.5 ? 1.5 : -1.5);
        
        setTimeout(() => {
          if (aliens.includes(alienMesh)) {
            alienMesh.position.z = alienMesh.userData.originalZ;
            alienMesh.userData.isDodging = false;
            setTimeout(tryDodge, 2000 + Math.random() * 3000);
          }
        }, 100 + Math.random() * 3900);
      };
      setTimeout(tryDodge, 1000 + Math.random() * 2000);

      const shootRandomly = () => {
        if (!gameOver && aliens.includes(alienMesh)) {
          alienShoot(alienMesh);
          setTimeout(shootRandomly, 3000 + Math.random() * 4000);
        }
      };
      setTimeout(shootRandomly, 1000 + Math.random() * 2000);
    }
  }
}

function createBelt() {
  const radius = 20;
  const segments = 75;
  const belt = new THREE.Group();
  
  const sizeTiers = [{ min: 0.2, max: 0.3, speedMult: 3.5, type: 'small' }, 
                     { min: 0.4, max: 0.6, speedMult: 1.7, type: 'medium' },
                     { min: 0.7, max: 1.0, speedMult: 1, type: 'large' }];
  
  const launchProbabilities = {small: 0.1,medium: 0.1,large: 0.1};

  const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x888888,roughness: 0.8,metalness: 0.2});
  const attackMaterial = new THREE.MeshStandardMaterial({ color: 0xff66aa,roughness: 0.7,metalness: 0.2});

  try {
    const textureLoader = new THREE.TextureLoader();
    const asteroidTexture = textureLoader.load('images/asteroid_texture.jpg');
    asteroidTexture.wrapS = THREE.RepeatWrapping;
    asteroidTexture.wrapT = THREE.RepeatWrapping;
    asteroidTexture.repeat.set(1, 1);
    beltMaterial.map = asteroidTexture;
    attackMaterial.map = asteroidTexture;
  } catch (e) {
    console.log("Using fallback materials - texture not found");
  }

  const launchedAsteroids = [];
  let lastLaunchCheck = Date.now();

  for (let i = 0; i <= segments; i++) {
    createBeltAsteroid();
  }

  function createBeltAsteroid() {
    const theta = (Math.random() * Math.PI) - (Math.PI / 2);
    
    const tierRoll = Math.random();
    let tierIndex;
    if (tierRoll < 0.6) tierIndex = 0;
    else if (tierRoll < 0.9) tierIndex = 1;
    else tierIndex = 2;
    
    const tier = sizeTiers[tierIndex];
    const size = tier.min + Math.random() * (tier.max - tier.min);
    
    const geometry = tierIndex === 2 
      ? new THREE.IcosahedronGeometry(size, 1) 
      : new THREE.SphereGeometry(size, 8, 6);
    
    const zOffset = (Math.random() - 0.5) * (2 - tierIndex * 0.6);
    
    const asteroid = new THREE.Mesh(geometry, beltMaterial);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    
    asteroid.position.set(Math.cos(theta) * radius + horizontalOffset, Math.sin(theta) * radius, zOffset);
    
    asteroid.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    
    asteroid.userData = {
      speed: 0.005 + Math.random() * 0.01,
      direction: Math.random() < 0.5 ? 1 : -1,
      horizontalSpeed: (Math.random() - 0.5) * 0.08,
      rotationSpeed: 0.005 + Math.random() * 0.01,
      sizeType: tier.type
    };
    
    belt.add(asteroid);
    return asteroid;
  }

  belt.position.set(0, 0, 1);
  belt.position.x += horizontalOffset;
  belt.rotation.z = Math.PI / 2;
  scene.add(belt);
  
  function animateBelt() {
    const now = Date.now();
    if (now - lastLaunchCheck > 100) {
      lastLaunchCheck = now;
      
      if (Math.random() < launchProbabilities.small * 0.1) {launchNewAsteroid(0);}
      if (Math.random() < launchProbabilities.medium * 0.1) {launchNewAsteroid(1);}
      if (Math.random() < launchProbabilities.large * 0.1) {launchNewAsteroid(2);}
    }

    for (let i = launchedAsteroids.length - 1; i >= 0; i--) {
      const asteroid = launchedAsteroids[i];
      
      asteroid.position.y -= 0.10;
      asteroid.position.x += asteroid.userData.horizontalSpeed;
      asteroid.userData.horizontalSpeed *= 1.01;
      
      asteroid.rotation.x += asteroid.userData.rotationSpeed;
      asteroid.rotation.y += asteroid.userData.rotationSpeed * 0.7;
      asteroid.rotation.z += asteroid.userData.rotationSpeed * 0.5;
      
      if (asteroid.position.y < -10 || Math.abs(asteroid.position.x - horizontalOffset) > 15) {
        removeAsteroid(asteroid, launchedAsteroids, i);
        continue;
      }
      
      const playerDist = Math.sqrt(Math.pow(asteroid.position.x - player.position.x, 2) + Math.pow(asteroid.position.y - player.position.y, 2));
      
      if (asteroid.position.x === 1000) {
        removeAsteroid(asteroid, launchedAsteroids, i);
        continue;
      }

      if (playerDist < 0.8) {
        playerLives--;
        //updateLivesDisplay();
        updateHeartDisplay();
        sounds.impact.currentTime = 0;
        sounds.impact.play();

        createExplosion(player.position.clone(), 0xffffff, 15);
        createExplosion(player.position.clone(), 0xff0000, 15);

        if (currentLevel === 3 && playerLives > 0) {
          applyCameraShake();
        }

        createExplosion(asteroid.position.clone(), 0x802e47, 30);
        removeAsteroid(asteroid, launchedAsteroids, i);

        if (playerLives <= 0) {
          createExplosion(player.position.clone(), 0xff0000, 500, "fire");
          createExplosion(player.position.clone(), 0xffffff, 500, "fire");
          scene.remove(player);
          player = null;
          gameOver = true;
          displayGameOverPopup();
          sounds.death.currentTime = 0;
          sounds.death.play();
        }
      }

      
      for (let j = aliens.length - 1; j >= 0; j--) {
        const alien = aliens[j];
        const alienDist = Math.sqrt(Math.pow(asteroid.position.x - alien.position.x, 2) + Math.pow(asteroid.position.y - alien.position.y, 2));
        
        if (alienDist < 0.7) {
          let explosionColor;
          switch(alien.userData.type) {
              case 'octopus': explosionColor = 0xffee00; break;
              case 'crab': explosionColor = 0x08ffff; break;
              case 'squid': explosionColor = 0xec20eb; break;
              default: explosionColor = 0xff0000; break;
          }

          createExplosion(alien.position.clone(), explosionColor, 20);
          scene.remove(alien);
          aliens.splice(j, 1);
          sounds.impact.currentTime = 0;
          sounds.impact.play();
          if (asteroid.userData.sizeType === 'small') {
              removeAsteroid(asteroid, launchedAsteroids, i);
          } else if (asteroid.userData.sizeType === 'medium') {
              const pos = asteroid.position.clone();
              removeAsteroid(asteroid, launchedAsteroids, i);
              createSplitAsteroid(pos, 'small', Math.PI/4);
              createSplitAsteroid(pos, 'small', -Math.PI/4);
          }
          break;
        }
      }
    }

    belt.children.forEach(asteroid => {
      const data = asteroid.userData;
      const angle = Math.atan2(asteroid.position.y, asteroid.position.x - horizontalOffset);
      const newAngle = angle + (data.speed * data.direction);
      
      asteroid.position.set(Math.cos(newAngle) * radius + horizontalOffset, Math.sin(newAngle) * radius, asteroid.position.z);
      
      asteroid.rotation.x += data.rotationSpeed;
      asteroid.rotation.y += data.rotationSpeed * 0.7;
    });
  }
  
  function launchNewAsteroid(tierIndex) {
    const tier = sizeTiers[tierIndex];
    const size = tier.min + Math.random() * (tier.max - tier.min);
    
    const geometry = tierIndex === 2 
      ? new THREE.IcosahedronGeometry(size, 1) 
      : new THREE.SphereGeometry(size, 8, 6);
    
    const asteroid = new THREE.Mesh(geometry, attackMaterial);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    
    const startX = (Math.random() * 16 - 8) + horizontalOffset;
    asteroid.position.set(startX, 10, 0);
    
    asteroid.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    
    asteroid.userData = {
      horizontalSpeed: (Math.random() - 0.5) * 0.07,
      rotationSpeed: 0.005 + Math.random() * 0.01,
      curveFactor: 1 + Math.random() * 0.02,
      sizeType: tier.type,
      health: tierIndex + 1
    };
    
    scene.add(asteroid);
    launchedAsteroids.push(asteroid);
  }
  
  function removeAsteroid(asteroid, array, index) {
    if (asteroid.userData.sizeType === 'small' && asteroid.position.y > -20) {
      createExplosion(asteroid.position.clone(), 0x802e47, 30);
    }
    
    asteroid.position.set(1000, 1000, 1000);
    scene.remove(asteroid);
    if (array && index !== undefined) {
      array.splice(index, 1);
    }
}

  function splitAsteroid(asteroid) {
    const position = asteroid.position.clone();
    const sizeType = asteroid.userData.sizeType;
  
    removeAsteroid(asteroid, launchedAsteroids);
    
    if (sizeType === 'large') {
      createSplitAsteroid(position, 'medium', Math.random() * Math.PI * 2);
      createSplitAsteroid(position, 'medium', Math.random() * Math.PI * 2);
    } else if (sizeType === 'medium') {
      createSplitAsteroid(position, 'small', Math.random() * Math.PI * 2);
      createSplitAsteroid(position, 'small', Math.random() * Math.PI * 2);
    }
  }

  function createSplitAsteroid(position, sizeType, angle) {
    const tierIndex = sizeType === 'small' ? 0 : (sizeType === 'medium' ? 1 : 2);
    const tier = sizeTiers[tierIndex];
    const size = tier.min + Math.random() * (tier.max - tier.min);
    const geometry = tierIndex === 2 
      ? new THREE.IcosahedronGeometry(size, 1) 
      : new THREE.SphereGeometry(size, 8, 6);
    
    const asteroid = new THREE.Mesh(geometry, attackMaterial);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
    asteroid.position.copy(position);
    
    asteroid.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    
    const baseSpeed = sizeType === 'medium' ? 0.05 : 0.07;
    const speedVariation = 0.7 + Math.random() * 0.6;
    
    asteroid.userData = {
      horizontalSpeed: Math.cos(angle) * baseSpeed * speedVariation,
      verticalSpeed: -baseSpeed * (0.5 + Math.abs(Math.sin(angle)) * speedVariation),
      rotationSpeed: 0.01 + Math.random() * 0.02,
      sizeType: sizeType,
      health: 1,
      isFragment: true
    };
    
    scene.add(asteroid);
    launchedAsteroids.push(asteroid);
  }

  function checkAsteroidHit(projectile) {
    for (let i = launchedAsteroids.length - 1; i >= 0; i--) {
      const asteroid = launchedAsteroids[i];
      
      if (asteroid.position.x === 1000) continue;
      
      const dist = Math.sqrt(
        Math.pow(projectile.position.x - asteroid.position.x, 2) + 
        Math.pow(projectile.position.y - asteroid.position.y, 2)
      );
      
      if (dist < 0.5) {
        scene.remove(projectile);
        splitAsteroid(asteroid);
        sounds.impact.currentTime = 0;
        sounds.impact.play();
        return true;
      }
    }
    return false;
  }
  return {group: belt,animate: animateBelt,checkAsteroidHit: checkAsteroidHit};
}

prefillLeaderboard();
updateLeaderboard();

//function createGameBox() {
//  const boxWidth = 22;
//  const boxHeight = 16;
//  const boxDepth = 1;
//  const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
//  const edges = new THREE.EdgesGeometry(boxGeometry);
//  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
//  const gameBox = new THREE.LineSegments(edges, lineMaterial);
//  gameBox.position.set(horizontalOffset, 0, -1);
//  scene.add(gameBox);
//}

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "p") {
    currentLevel = (currentLevel % 3) + 1;
    setCameraView();
  }
});

document.getElementById("changeCameraButton").addEventListener("click", (e) => {
  e.currentTarget.blur();
  currentLevel = (currentLevel % 3) + 1;
  setCameraView();
});

