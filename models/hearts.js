import * as THREE from 'three';
import { PixelHeart2 } from '../testes/pixelArt2.js';

function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

export function createFullHeart() {
  const halfHeartCoords = [
    { x: 3, y: 1 }, { x: 4, y: 1 },
    { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
    { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 },
    { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 },
    { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 },
    { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
    { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 },
    { x: 5, y: 8 }, { x: 6, y: 8 },
    { x: 6, y: 9 },
  ];

  const heart = new THREE.Group();
  const pixelSize = 1.1;
  const pixelSpacing = 0.1;
  const color = 0xff0000;

  const left = new PixelHeart2(halfHeartCoords, pixelSize, pixelSpacing, color).mesh;
  const right = new PixelHeart2(halfHeartCoords, pixelSize, pixelSpacing, color).mesh;


  //right.rotation.set(0, 0, degToRad(180));
  right.scale.x = -1;
  right.position.set(11.5, 11.5, 0); 
  left.position.y = 11.5;

  heart.add(left);
  heart.add(right);

  // Disable shadows
  heart.traverse(child => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  // Center the heart geometry
  const box = new THREE.Box3().setFromObject(heart);
  const center = box.getCenter(new THREE.Vector3());
  heart.position.sub(center);

  // Apply appropriate scale for UI display
  //heart.scale.setScalar(10); // Not too big, not too small

  return heart;
}
