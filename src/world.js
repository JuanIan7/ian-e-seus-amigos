import { W, H, GROUND } from './config.js';
import { THEMES } from './scenes/BootScene.js';

/** Cenário em camadas com paralaxe, por tema. update(dx) recebe quanto o mundo andou (px). */
export function buildBackground(scene, theme = 'bairro', depthBase = -100) {
  const t = THEMES[theme] || THEMES.bairro;
  const parts = [];
  const sky = scene.add.image(0, 0, 'sky_' + theme).setOrigin(0).setDisplaySize(W, H).setDepth(depthBase); parts.push(sky);
  const clouds = [];
  for (let i = 0; i < 5; i++) { const c = scene.add.image(150 + i * 340, 90 + (i % 3) * 55, 'cloud').setAlpha(0.9).setScale(0.8 + (i % 2) * 0.4).setDepth(depthBase + 5); clouds.push(c); parts.push(c); }
  const far = scene.add.tileSprite(0, GROUND - t.farH + 20, W, t.farH, 'far_' + theme).setOrigin(0).setDepth(depthBase + 10); parts.push(far);
  const mid = scene.add.tileSprite(0, GROUND - t.midH + 10, W, t.midH, 'mid_' + theme).setOrigin(0).setDepth(depthBase + 20); parts.push(mid);
  const ground = scene.add.tileSprite(0, GROUND, W, H - GROUND, 'ground_' + theme).setOrigin(0).setDepth(depthBase + 30); parts.push(ground);
  return {
    theme, parts,
    update(dx, dt = 0) {
      far.tilePositionX += dx * 0.12; mid.tilePositionX += dx * 0.4; ground.tilePositionX += dx;
      clouds.forEach((c) => { c.x -= (dx * 0.05 + 6 * dt); if (c.x < -140) c.x = W + 140; });
    },
    setAlpha(a) { parts.forEach((p) => p.setAlpha(p.texture && p.texture.key === 'cloud' ? a * 0.9 : a)); },
    destroy() { parts.forEach((p) => p.destroy()); },
  };
}

/** Buraco no chão (riacho na floresta/dino, vão entre prédios nas alturas). Origem = canto esquerdo no nível do chão. */
export function buildHole(scene, theme, w) {
  const g = scene.add.graphics();
  const h = H - GROUND;
  if (theme === 'altura') {
    g.fillStyle(0x2a3350, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(0x3b476b, 1); for (let i = 0; i < 4; i++) g.fillRect(8 + i * (w / 4), 20, w / 4 - 16, h - 20);
    g.fillStyle(0xfff2b0, 0.8); for (let i = 0; i < 4; i++) g.fillRect(14 + i * (w / 4), 30 + (i % 2) * 24, 10, 14);
    g.fillStyle(0x9aa0a8, 1); g.fillRect(-6, 0, 10, h); g.fillRect(w - 4, 0, 10, h);
    g.fillStyle(0xc6cbd3, 1); g.fillRect(-6, 0, 10, 8); g.fillRect(w - 4, 0, 10, 8);
  } else {
    g.fillStyle(0x2f8fdc, 1); g.fillRect(0, 0, w, h);
    g.fillStyle(0x4db8ff, 1); for (let x = 6; x < w - 20; x += 44) { g.fillRoundedRect(x, 16 + ((x / 44) % 2) * 26, 30, 8, 4); }
    g.fillStyle(0x1f6fb8, 1); g.fillRect(0, h - 26, w, 26);
    g.fillStyle(0x8a5a35, 1); g.fillTriangle(-8, 0, 20, 0, -8, 46); g.fillTriangle(w + 8, 0, w - 20, 0, w + 8, 46);
    g.fillStyle(0x58b947, 1); g.fillRect(-8, 0, 20, 10); g.fillRect(w - 12, 0, 20, 10);
  }
  return g;
}

/** Plataforma suspensa: folha gigante (floresta/dinos) ou marquise/andaime (alturas). Origem = topo, canto esquerdo. */
export function buildPlatform(scene, theme, w) {
  const g = scene.add.graphics();
  if (theme === 'altura') {
    g.fillStyle(0x2b3a5e, 1); g.fillRoundedRect(0, 0, w, 16, 6);
    g.fillStyle(0xffd23f, 1); for (let x = 6; x < w - 10; x += 30) g.fillRect(x, 0, 14, 16);
    g.lineStyle(5, 0x586380, 1); g.lineBetween(14, 16, 14, 90); g.lineBetween(w - 14, 16, w - 14, 90);
  } else {
    g.fillStyle(0x2d9a52, 1); g.fillEllipse(w / 2, 10, w, 36);
    g.fillStyle(0x58c06f, 1); g.fillEllipse(w / 2, 6, w - 14, 26);
    g.lineStyle(3, 0x2d9a52, 1); g.lineBetween(14, 8, w - 14, 8);
    for (let i = 1; i < 5; i++) { g.lineBetween(w * i / 5, 8, w * i / 5 - 14, 20); g.lineBetween(w * i / 5, 8, w * i / 5 - 14, -4); }
    g.lineStyle(5, 0x6e4527, 1); g.lineBetween(w / 2, 20, w / 2, 70);
  }
  return g;
}

/** Trampolim. Origem = chão, centro. */
export function buildPad(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 2, 92, 12);
  g.lineStyle(5, 0x9aa0a8, 1); g.lineBetween(-30, -6, -18, -26); g.lineBetween(-18, -26, -30, -46); g.lineBetween(30, -6, 18, -26); g.lineBetween(18, -26, 30, -46);
  g.fillStyle(0xe53935, 1); g.fillRoundedRect(-46, -8, 92, 12, 5);
  g.fillStyle(0x2f9bff, 1); g.fillRoundedRect(-52, -58, 104, 16, 8); g.fillStyle(0xffffff, 0.5); g.fillRoundedRect(-44, -56, 60, 5, 3);
  return g;
}
