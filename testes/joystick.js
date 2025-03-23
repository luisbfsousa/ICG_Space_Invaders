import * as THREE from 'three';

let joystickMoving, base, sphere, cylinder, button;
let isDragging = false;        // For joystick movement (right mouse)
let isButtonPressed = false;   // For button press (left mouse)
let mouseX = 0, mouseY = 0;
let initialMouseX = 0, initialMouseY = 0;
let initialRotX = 0, initialRotZ = 0;
let buttonOriginalY = 0;
let renderer, scene, camera;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(180, 180, 60);
  camera.lookAt(scene.position);
  scene.add(camera);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(100, 100, 100).normalize();
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
  pointLight.position.set(50, 50, 50);
  scene.add(pointLight);

  // Fixed base
  const baseGeometry = new THREE.CylinderGeometry(8, 8, 5, 32);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.5 });
  base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(0, 2.5, 0);
  scene.add(base);

  // Add a button on the side (separate from the joystick)
  const buttonGeometry = new THREE.CylinderGeometry(10, 10, 5, 32);
  const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.5 });
  button = new THREE.Mesh(buttonGeometry, buttonMaterial);
  // Position the button at the level of the base but to the right (adjust as needed)
  button.position.set(-20, base.position.y + 2.5, 80);
  buttonOriginalY = button.position.y;
  scene.add(button);

  // Moving joystick group (stick and ball) - DON'T CHANGE THIS PART
  joystickMoving = new THREE.Group();
  scene.add(joystickMoving);

  const cylinderGeometry = new THREE.CylinderGeometry(5, 5, 70, 32);
  const greyMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.5 });
  cylinder = new THREE.Mesh(cylinderGeometry, greyMaterial);
  cylinder.position.set(0, 35, 0);
  joystickMoving.add(cylinder);

  const sphereGeometry = new THREE.SphereGeometry(20, 32, 32);
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, metalness: 0.5, roughness: 0.5 });
  sphere = new THREE.Mesh(sphereGeometry, redMaterial);
  sphere.position.set(0, 80, 0);
  joystickMoving.add(sphere);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(new THREE.Color(0x000000));
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Prevent default context menu to allow right-click usage
  window.addEventListener('contextmenu', e => e.preventDefault(), false);
  
  // Movement event listeners
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mouseup', onMouseUp, false);

  animate();
}

// --- MOVEMENT SECTION START ---
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

  renderer.render(scene, camera);
}
// --- MOVEMENT SECTION END ---

window.onload = init;
