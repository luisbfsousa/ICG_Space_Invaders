import * as THREE from 'three';

let joystickMoving, base, sphere, cylinder, button;
let isDragging = false;
let isButtonPressed = false;
let mouseX = 0, mouseY = 0;
let initialMouseX = 0, initialMouseY = 0;
let initialRotX = 0, initialRotZ = 0;
let buttonOriginalY = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let renderer, scene, camera;

function createArcadeMachine(scene) {
    const arcadeGroup = new THREE.Group();

    // Arcade body
    const bodyGeometry = new THREE.BoxGeometry(10, 20, 10);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 10, 0);
    arcadeGroup.add(body);

    // Screen
    const screenGeometry = new THREE.BoxGeometry(8, 6, 0.5);
    const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x111111 });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 15, 5.25);
    arcadeGroup.add(screen);

    // Panel
    const painelGeometry = new THREE.BoxGeometry(9.9, 6, 0.5);
    const painelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x111111 });
    const painel = new THREE.Mesh(painelGeometry, painelMaterial);
    painel.position.set(0, 10.5, 7);
    painel.rotation.x = Math.PI / 2;
    arcadeGroup.add(painel);

    // Topper
    const topoGeometry = new THREE.BoxGeometry(10, 1, 12);
    const topoMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x111111 });
    const topo = new THREE.Mesh(topoGeometry, topoMaterial);
    topo.position.set(0, 19.5, 1);
    arcadeGroup.add(topo);

    // ===================== JOYSTICK AREA =====================
    const joystickGroup = new THREE.Group();
    joystickGroup.scale.set(0.05, 0.05, 0.05); // Shrink to fit arcade
    joystickGroup.position.set(0, 10.5, 6.5);  // Place on control panel
    arcadeGroup.add(joystickGroup);

    // === FROM joystick.js (UNTOUCHED LOGIC) ===
    const baseGeometry = new THREE.CylinderGeometry(8, 8, 5, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.5 });
    base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(50, 4, 20);
    joystickGroup.add(base);

    const buttonGeometry = new THREE.CylinderGeometry(10, 10, 5, 32);
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.5 });
    button = new THREE.Mesh(buttonGeometry, buttonMaterial);
    button.position.set(-40, base.position.y + 30.5, 30);
    buttonOriginalY = button.position.y;
    joystickGroup.add(button);

    joystickMoving = new THREE.Group();
    joystickGroup.add(joystickMoving);

    const cylinderGeometry = new THREE.CylinderGeometry(5, 5, 70, 32);
    const greyMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.5 });
    cylinder = new THREE.Mesh(cylinderGeometry, greyMaterial);
    cylinder.position.set(50, 35, 20);
    joystickMoving.add(cylinder);

    const sphereGeometry = new THREE.SphereGeometry(20, 32, 32);
    const redMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, metalness: 0.5, roughness: 0.5 });
    sphere = new THREE.Mesh(sphereGeometry, redMaterial);
    sphere.position.set(50, 80, 20);
    joystickMoving.add(sphere);

    // Add to scene
    scene.add(arcadeGroup);
    return arcadeGroup;
}


function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 30, 20);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 100).normalize();
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    const arcadeMachine = createArcadeMachine(scene);
    arcadeMachine.position.set(0, 0, 0);
    arcadeMachine.rotation.y = Math.PI / 4;

    // Event listeners
    window.addEventListener('contextmenu', e => e.preventDefault(), false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup', onMouseUp, false);

    animate();
}

// ========== MOVEMENT SECTION ==========
function onMouseMove(event) {
  // For raycasting, keep normalized values.
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Update raw mouse coordinates only for joystick movement (right mouse)
  if (isDragging) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }
}

function onMouseDown(event) {
  // Right mouse for joystick movement
  if (event.button === 2) {
    raycaster.setFromCamera(mouse, camera);
    // Check if the sphere (joystick ball) is clicked
    const intersects = raycaster.intersectObject(sphere);
    if (intersects.length > 0) {
      isDragging = true;
      initialMouseX = event.clientX;
      initialMouseY = event.clientY;
      initialRotX = joystickMoving.rotation.x;
      initialRotZ = joystickMoving.rotation.z;
    }
  }
  // Left mouse for button press (no hover required)
  else if (event.button === 0) {
    isButtonPressed = true;
    button.position.y = buttonOriginalY - 2; // Simulate button press (adjust offset if needed)
  }
}

function onMouseUp(event) {
  // Stop joystick movement when right mouse is released
  if (event.button === 2) {
    isDragging = false;
  }
  // Release the button when left mouse is released
  else if (event.button === 0) {
    if (isButtonPressed) {
      isButtonPressed = false;
      button.position.y = buttonOriginalY;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const maxAngle = Math.PI / 4; // 45° maximum tilt

  if (isDragging) {
    // Calculate relative mouse movement from initial right-click (normalized)
    const deltaX = (mouseX - initialMouseX) / window.innerWidth;
    const deltaY = (mouseY - initialMouseY) / window.innerHeight;

    // Use horizontal mouse movement to control rotation around x-axis (tilt forward/back)
    // and vertical mouse movement to control rotation around z-axis (tilt left/right)
    let desiredRotX = initialRotX - deltaX * maxAngle;
    let desiredRotZ = initialRotZ - deltaY * maxAngle;

    desiredRotX = THREE.MathUtils.clamp(desiredRotX, -maxAngle, maxAngle);
    desiredRotZ = THREE.MathUtils.clamp(desiredRotZ, -maxAngle, maxAngle);

    joystickMoving.rotation.x = desiredRotX;
    joystickMoving.rotation.z = desiredRotZ;
  } else {
    // Smoothly return joystick to neutral when not dragging
    joystickMoving.rotation.x += (0 - joystickMoving.rotation.x) * 0.1;
    joystickMoving.rotation.z += (0 - joystickMoving.rotation.z) * 0.1;
  }
  // Render your joystick scene
  renderer.render(scene, camera);

  // NEW: Update the background's joystick uniform (if background is ready)
  if (window.bgController) {
    // 1) Get sphere’s position in world space
    const worldPos = new THREE.Vector3();
    sphere.getWorldPosition(worldPos);

    // 2) Project it into NDC
    worldPos.project(camera); 
    // Now worldPos.x and worldPos.y are in [-1..1]

    // 3) Convert to [0..1]
    const x = (worldPos.x + 1) / 2;
    const y = (1 - worldPos.y) / 2; // or 1 - ((worldPos.y + 1)/2)

    // 4) Pass that to background.js
    window.bgController.updateJoystick(new THREE.Vector2(x, y));
  }
}

init();
