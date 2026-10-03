import { W, H, GROUND } from './config.js';

/** Cenário em camadas com paralaxe. update(dx) recebe quanto o mundo andou (px). */
export function buildBackground(scene) {
  scene.add.image(0, 0, 'sky').setOrigin(0).setDisplaySize(W, H).setDepth(-100);
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const c = scene.add.image(150 + i * 340, 90 + (i % 3) * 55, 'cloud').setAlpha(0.9).setScale(0.8 + (i % 2) * 0.4).setDepth(-95);
    clouds.push(c);
  }
  const hills = scene.add.tileSprite(0, GROUND - 330, W, 300, 'hills').setOrigin(0).setDepth(-90);
  const city = scene.add.tileSprite(0, GROUND - 350, W, 360, 'city').setOrigin(0).setDepth(-80);
  const ground = scene.add.tileSprite(0, GROUND, W, H - GROUND, 'ground').setOrigin(0).setDepth(-70);
  return {
    update(dx, dt = 0) {
      hills.tilePositionX += dx * 0.12;
      city.tilePositionX += dx * 0.4;
      ground.tilePositionX += dx;
      clouds.forEach((c) => { c.x -= (dx * 0.05 + 6 * dt); if (c.x < -140) c.x = W + 140; });
    },
  };
}
