import { PixelArt } from '../pixelArt.js';

export function createOctopus() {
    const customCoordsPos1 = [
        { x: 5, y: 1 },
        { x: 6, y: 1 },
        { x: 7, y: 1 },
        { x: 8, y: 1 },

        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 },
        { x: 6, y: 2 },
        { x: 7, y: 2 },
        { x: 8, y: 2 },
        { x: 9, y: 2 },
        { x: 10, y: 2 },
        { x: 11, y: 2 },

        { x: 1, y: 3 },
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 3 },
        { x: 7, y: 3 },
        { x: 8, y: 3 },
        { x: 9, y: 3 },
        { x: 10, y: 3 },
        { x: 11, y: 3 },
        { x: 12, y: 3 },

        { x: 1, y: 4 },
        { x: 2, y: 4 },
        { x: 3, y: 4 },
        { x: 6, y: 4 },
        { x: 7, y: 4 },
        { x: 10, y: 4 },
        { x: 11, y: 4 },
        { x: 12, y: 4 },

        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
        { x: 8, y: 5 },
        { x: 9, y: 5 },
        { x: 10, y: 5 },
        { x: 11, y: 5 },
        { x: 12, y: 5 },

        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 8, y: 6 },
        { x: 9, y: 6 },

        { x: 3, y: 7 },
        { x: 4, y: 7 },
        { x: 6, y: 7 },
        { x: 7, y: 7 },
        { x: 9, y: 7 },
        { x: 10, y: 7 },

        { x: 1, y: 8 },
        { x: 2, y: 8 },
        { x: 11, y: 8 },
        { x: 12, y: 8 },
      ];
      const customCoordsPos2 = [
        { x: 5, y: 1 },
        { x: 6, y: 1 },
        { x: 7, y: 1 },
        { x: 8, y: 1 },

        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 },
        { x: 6, y: 2 },
        { x: 7, y: 2 },
        { x: 8, y: 2 },
        { x: 9, y: 2 },
        { x: 10, y: 2 },
        { x: 11, y: 2 },

        { x: 1, y: 3 },
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 3 },
        { x: 7, y: 3 },
        { x: 8, y: 3 },
        { x: 9, y: 3 },
        { x: 10, y: 3 },
        { x: 11, y: 3 },
        { x: 12, y: 3 },
  
        { x: 1, y: 4 },
        { x: 2, y: 4 },
        { x: 3, y: 4 },
        { x: 6, y: 4 },
        { x: 7, y: 4 },
        { x: 10, y: 4 },
        { x: 11, y: 4 },
        { x: 12, y: 4 },
  
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
        { x: 8, y: 5 },
        { x: 9, y: 5 },
        { x: 10, y: 5 },
        { x: 11, y: 5 },
        { x: 12, y: 5 },

        { x: 3, y: 6 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 8, y: 6 },
        { x: 9, y: 6 },
        { x: 10, y: 6 },

        { x: 2, y: 7 },
        { x: 3, y: 7 },
        { x: 6, y: 7 },
        { x: 7, y: 7 },
        { x: 10, y: 7 },
        { x: 11, y: 7 },

        { x: 3, y: 8 },
        { x: 4, y: 8 },
        { x: 9, y: 8 },
        { x: 10, y: 8 },
      ];

  const pixelSize = 1.1;
  const pixelSpacing = 0.1;
  const color = 0xffee00;
  
  return new PixelArt(
    customCoordsPos1,
    customCoordsPos2,
    pixelSize,
    pixelSpacing,
    color,
    1500,
    true
  );
}

export function createCrab() {
    const customCoordsPos1 = [
        { x: 3, y: 1 },
        { x: 9, y: 1 },

        { x: 4, y: 2 },
        { x: 8, y: 2 },

        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 3 },
        { x: 7, y: 3 },
        { x: 8, y: 3 },
        { x: 9, y: 3 },

        { x: 2, y: 4 },
        { x: 3, y: 4 },
        { x: 5, y: 4 },
        { x: 6, y: 4 },
        { x: 7, y: 4 },
        { x: 9, y: 4 },
        { x: 10, y: 4 },

        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
        { x: 8, y: 5 },
        { x: 9, y: 5 },
        { x: 10, y: 5 },
        { x: 11, y: 5 },

        { x: 1, y: 6 },
        { x: 3, y: 6 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 7, y: 6 },
        { x: 8, y: 6 },
        { x: 9, y: 6 },
        { x: 11, y: 6 },

        { x: 1, y: 7 },
        { x: 3, y: 7 },
        { x: 9, y: 7 },
        { x: 11, y: 7 },

        { x: 4, y: 8 },
        { x: 5, y: 8 },
        { x: 7, y: 8 },
        { x: 8, y: 8 },
      ];
      const customCoordsPos2 = [
        { x: 3, y: 1 },
        { x: 9, y: 1 },

        { x: 1, y: 2 },
        { x: 4, y: 2 },
        { x: 8, y: 2 },
        { x: 11, y: 2 },

        { x: 1, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 3 },
        { x: 7, y: 3 },
        { x: 8, y: 3 },
        { x: 9, y: 3 },
        { x: 11, y: 3 },

        { x: 1, y: 4 },
        { x: 2, y: 4 },
        { x: 3, y: 4 },
        { x: 5, y: 4 },
        { x: 6, y: 4 },
        { x: 7, y: 4 },
        { x: 9, y: 4 },
        { x: 10, y: 4 },
        { x: 11, y: 4 },

        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
        { x: 8, y: 5 },
        { x: 9, y: 5 },
        { x: 10, y: 5 },
        { x: 11, y: 5 },

        { x: 2, y: 6 },
        { x: 3, y: 6 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 7, y: 6 },
        { x: 8, y: 6 },
        { x: 9, y: 6 },
        { x: 10, y: 6 },

        { x: 3, y: 7 },
        { x: 9, y: 7 },

        { x: 2, y: 8 },
        { x: 10, y: 8 },
      ];
      
    const pixelSize = 1.1;
    const pixelSpacing = 0.1;
    const color = 0x08ffff;
    
    return new PixelArt(
      customCoordsPos1,
      customCoordsPos2,
      pixelSize,
      pixelSpacing,
      color,
      1500,
      true
    );
}

export function createSquid() {
    const customCoordsPos1 = [
        { x: 4, y: 1 },
        { x: 5, y: 1 },

        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 },
        { x: 6, y: 2 },

        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 3 },
        { x: 7, y: 3 },

        { x: 1, y: 4 },
        { x: 2, y: 4 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 7, y: 4 },
        { x: 8, y: 4 },

        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
        { x: 8, y: 5 },

        { x: 3, y: 6 },
        { x: 6, y: 6 },

        { x: 2, y: 7 },
        { x: 4, y: 7 },
        { x: 5, y: 7 },
        { x: 7, y: 7 },

        { x: 1, y: 8 },
        { x: 3, y: 8 },
        { x: 6, y: 8 },
        { x: 8, y: 8 },
      ];
      const customCoordsPos2 = [
        { x: 4, y: 1 },
        { x: 5, y: 1 },

        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 },
        { x: 6, y: 2 },

        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 6, y: 3 },
        { x: 7, y: 3 },

        { x: 1, y: 4 },
        { x: 2, y: 4 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 7, y: 4 },
        { x: 8, y: 4 },

        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
        { x: 4, y: 5 },
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
        { x: 8, y: 5 },

        { x: 2, y: 6 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 7, y: 6 },

        { x: 1, y: 7 },
        { x: 8, y: 7 },

        { x: 2, y: 8 },
        { x: 7, y: 8 },
      ];
    const pixelSize = 1.1;
    const pixelSpacing = 0.1;
    const color = 0xec20eb;
    
    return new PixelArt(
      customCoordsPos1,
      customCoordsPos2,
      pixelSize,
      pixelSpacing,
      color,
      1500,
      true
    );
}