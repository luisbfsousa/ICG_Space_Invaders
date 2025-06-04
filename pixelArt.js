import * as THREE from 'three';

export class PixelArt {
  constructor(coordsPos1, coordsPos2, pixelSize, pixelSpacing, color, animationSpeed = 1000, animate = true) {
    this.mesh = new THREE.Group();
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.pixels = [];
    this.animationSpeed = animationSpeed;
    this.animate = animate;
    this.currentFrame = 0;
    this.frames = [coordsPos1, coordsPos2];
    this.lastFrameTime = 0;
    this.pixelSize = pixelSize;
    this.pixelSpacing = pixelSpacing;
    this.color = color;
    
    this.pixelMaterial = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.7,
      metalness: 0.1
    });
    
    this.createPixels(coordsPos1);
    
    if (this.animate) {
      this.animatePixels();
    }
  }

  createPixels(coords) {
    this.mesh.children = [];
    this.pixels = [];
    
    const geometry = new THREE.BoxGeometry(this.pixelSize, this.pixelSize, this.pixelSize);
    
    coords.forEach(coord => {
      const pixel = new THREE.Mesh(geometry, this.pixelMaterial);
      pixel.position.set(
        coord.x * (this.pixelSize + this.pixelSpacing),
        -coord.y * (this.pixelSize + this.pixelSpacing),
        0
      );
      
      pixel.castShadow = true;
      pixel.receiveShadow = true;
      
      this.mesh.add(pixel);
      this.pixels.push(pixel);
    });
  }

  animatePixels() {
    const now = Date.now();
    if (now - this.lastFrameTime > this.animationSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      this.createPixels(this.frames[this.currentFrame]);
      this.lastFrameTime = now;
    }
    
    if (this.animate) {
      requestAnimationFrame(() => this.animatePixels());
    }
  }
}