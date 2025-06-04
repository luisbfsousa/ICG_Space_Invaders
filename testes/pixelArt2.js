import * as THREE from 'three';

export class PixelHeart2 {
  constructor(coords, pixelSize, pixelSpacing, color) {
    this.mesh = new THREE.Group();

    const geometry = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);
    const material = new THREE.MeshBasicMaterial({color});

    coords.forEach(coord => {
      const pixel = new THREE.Mesh(geometry, material);
      pixel.position.set(
        coord.x * (pixelSize + pixelSpacing),
        -coord.y * (pixelSize + pixelSpacing),
        0
      );
      pixel.geometry.computeBoundingBox();
      pixel.geometry.computeBoundingSphere();
      this.mesh.add(pixel);
    });

    console.log("Added pixels:", coords.length);


    // Optional: center the mesh
    const box = new THREE.Box3().setFromObject(this.mesh);
    const center = box.getCenter(new THREE.Vector3());
    this.mesh.position.sub(center);
  }
}

