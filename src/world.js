import { W, H, GROUND } from './config.js';
import { THEMES } from './scenes/BootScene.js';
import { og } from './outline.js';

/** Cenário em camadas com paralaxe, por tema. update(dx) recebe quanto o mundo andou (px). */
export function buildBackground(scene, theme = 'bairro', depthBase = -100) {
  const t = THEMES[theme] || THEMES.bairro;
  const parts = [];
  const sky = scene.add.image(0, 0, 'sky_' + theme).setOrigin(0).setDisplaySize(W, H).setDepth(depthBase); parts.push(sky);
  const sunCol = { bairro: 0xfff0a0, praca: 0xfff0a0, floresta: 0xfff0a0, altura: 0xffa860, pre: 0xff8f3f }[theme] || 0xfff0a0;
  const sun = scene.add.image(W - 300, 150, 'sun').setTint(sunCol).setDepth(depthBase + 2).setScale(theme === 'pre' || theme === 'altura' ? 1.25 : 1.0); parts.push(sun);
  const rays = scene.add.graphics().setPosition(W - 300, 150).setDepth(depthBase + 3); rays.fillStyle(sunCol, 0.12);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; rays.fillTriangle(0, 0, Math.cos(a - 0.1) * 520, Math.sin(a - 0.1) * 520, Math.cos(a + 0.1) * 520, Math.sin(a + 0.1) * 520); }
  parts.push(rays);
  const clouds = [];
  for (let i = 0; i < 5; i++) { const c = scene.add.image(150 + i * 340, 90 + (i % 3) * 55, 'cloud').setAlpha(0.9).setScale(0.8 + (i % 2) * 0.4).setDepth(depthBase + 5); clouds.push(c); parts.push(c); }
  // bichinhos de cenário: dão vida ao fundo (pássaros, balão, pterossauros ao longe)
  const critters = [];
  const mkCritter = (i) => {
    const g = scene.add.graphics().setDepth(depthBase + 8);
    if (theme === 'altura') { g.fillStyle(0xe53935, 1); g.fillCircle(0, 0, 26); g.fillStyle(0xffd23f, 1); g.fillRect(-6, -26, 12, 52); g.lineStyle(3, 0x1b2a49, 1); g.strokeCircle(0, 0, 26); g.lineBetween(-10, 24, -8, 40); g.lineBetween(10, 24, 8, 40); g.fillStyle(0x8a5a35, 1); g.fillRect(-10, 40, 20, 12); }
    else if (theme === 'pre') { g.fillStyle(0x4a3a5a, 1); g.fillTriangle(-34, 0, 34, 0, 0, -18); g.fillTriangle(-34, 0, 0, 0, -12, 10); g.fillTriangle(34, 0, 0, 0, 12, 10); g.fillTriangle(-34, -2, -50, 4, -34, 6); }
    else { g.lineStyle(5, 0x2a3a5a, 1); g.beginPath(); g.arc(-9, 0, 9, Math.PI, 0, false); g.strokePath(); g.beginPath(); g.arc(9, 0, 9, Math.PI, 0, false); g.strokePath(); }
    const c = { g, x: 200 + i * 520 + Math.random() * 200, y: theme === 'altura' ? 170 + (i % 2) * 90 : 70 + (i % 3) * 60 + Math.random() * 40, vx: theme === 'altura' ? 14 : 40 + Math.random() * 30, ph: Math.random() * 6 };
    g.setPosition(c.x, c.y); critters.push(c); parts.push(g);
  };
  for (let i = 0; i < 3; i++) mkCritter(i);
  const far = scene.add.tileSprite(0, GROUND - t.farH + 20, W, t.farH, 'far_' + theme).setOrigin(0).setDepth(depthBase + 10); parts.push(far);
  const mid = scene.add.tileSprite(0, GROUND - t.midH + 10, W, t.midH, 'mid_' + theme).setOrigin(0).setDepth(depthBase + 20); parts.push(mid);
  const ground = scene.add.tileSprite(0, GROUND, W, H - GROUND, 'ground_' + theme).setOrigin(0).setDepth(depthBase + 30); parts.push(ground);
  return {
    theme, parts,
    update(dx, dt = 0) {
      critters.forEach((c) => { c.x -= dx * 0.1 + c.vx * dt; c.ph += dt * (theme === 'altura' ? 1.5 : 9); if (c.x < -120) c.x = W + 120 + Math.random() * 300; c.g.setPosition(c.x, c.y + Math.sin(c.ph * 0.6) * (theme === 'altura' ? 10 : 8)); if (theme !== 'altura') c.g.scaleY = 0.55 + Math.abs(Math.sin(c.ph)) * 0.6; });
      rays.rotation += dt * 0.08; sun.setScale(sun.scale + Math.sin(performance.now() / 900) * 0.0008);
      far.tilePositionX += dx * 0.12; mid.tilePositionX += dx * 0.4; ground.tilePositionX += dx;
      clouds.forEach((c) => { c.x -= (dx * 0.05 + 6 * dt); if (c.x < -140) c.x = W + 140; });
    },
    setAlpha(a) { parts.forEach((p) => p.setAlpha(p.texture && p.texture.key === 'cloud' ? a * 0.9 : a)); },
    destroy() { parts.forEach((p) => p.destroy()); },
  };
}

/** Buraco no chão (riacho na floresta/dino, vão entre prédios nas alturas). Origem = canto esquerdo no nível do chão. */
export function buildHole(scene, theme, w) {
  const g = og(scene);
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
  const g = og(scene);
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
  const g = og(scene);
  g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 2, 92, 12);
  g.lineStyle(5, 0x9aa0a8, 1); g.lineBetween(-30, -6, -18, -26); g.lineBetween(-18, -26, -30, -46); g.lineBetween(30, -6, 18, -26); g.lineBetween(18, -26, 30, -46);
  g.fillStyle(0xe53935, 1); g.fillRoundedRect(-46, -8, 92, 12, 5);
  g.fillStyle(0x2f9bff, 1); g.fillRoundedRect(-52, -58, 104, 16, 8); g.fillStyle(0xffffff, 0.5); g.fillRoundedRect(-44, -56, 60, 5, 3);
  return g;
}
