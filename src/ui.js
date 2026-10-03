import Phaser from 'phaser';

// Ícones desenhados em código (independem de fonte/emoji; legíveis sem saber ler).
export const icons = {
  jump(g, s, c = 0xffffff) {
    g.fillStyle(c, 1);
    g.fillTriangle(0, -s, s * 0.95, s * 0.1, -s * 0.95, s * 0.1);
    g.fillRoundedRect(-s * 0.32, s * 0.05, s * 0.64, s * 0.8, 6);
  },
  drop(g, s, c = 0xffffff) {
    g.fillStyle(c, 1);
    g.fillCircle(0, s * 0.25, s * 0.62);
    g.fillTriangle(0, -s, -s * 0.55, s * 0.05, s * 0.55, s * 0.05);
  },
  play(g, s, c = 0xffffff) { g.fillStyle(c, 1); g.fillTriangle(-s * 0.6, -s * 0.8, -s * 0.6, s * 0.8, s * 0.85, 0); },
  pause(g, s, c = 0xffffff) { g.fillStyle(c, 1); g.fillRoundedRect(-s * 0.7, -s * 0.8, s * 0.5, s * 1.6, 4); g.fillRoundedRect(s * 0.2, -s * 0.8, s * 0.5, s * 1.6, 4); },
  home(g, s, c = 0xffffff) {
    g.fillStyle(c, 1);
    g.fillTriangle(0, -s, -s * 1.05, 0, s * 1.05, 0);
    g.fillRect(-s * 0.7, -s * 0.05, s * 1.4, s * 0.95);
    g.fillStyle(0x1b2a49, 1); g.fillRect(-s * 0.2, s * 0.25, s * 0.4, s * 0.65);
  },
  sound(g, s, c = 0xffffff, on = true) {
    g.fillStyle(c, 1);
    g.fillRect(-s * 0.9, -s * 0.3, s * 0.45, s * 0.6);
    g.fillTriangle(-s * 0.5, -s * 0.3, -s * 0.5, s * 0.3, s * 0.1, 0);
    g.fillTriangle(-s * 0.5, -s * 0.3, s * 0.1, -s * 0.8, s * 0.1, 0.1);
    g.fillTriangle(-s * 0.5, s * 0.3, s * 0.1, s * 0.8, s * 0.1, -0.1);
    if (on) { g.lineStyle(s * 0.14, c, 1); g.beginPath(); g.arc(s * 0.1, 0, s * 0.5, -0.9, 0.9); g.strokePath(); g.beginPath(); g.arc(s * 0.1, 0, s * 0.85, -0.9, 0.9); g.strokePath(); }
    else { g.lineStyle(s * 0.2, 0xe53935, 1); g.lineBetween(-s * 0.9, -s * 0.9, s * 0.9, s * 0.9); }
  },
  star(g, s, c = 0xffd23f) {
    g.fillStyle(c, 1);
    const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.45 : s; const a = -Math.PI / 2 + i * Math.PI / 5; pts.push(new Phaser.Math.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
    g.fillPoints(pts, true);
  },
  hose(g, s, c = 0xe53935) {
    g.lineStyle(s * 0.28, c, 1); g.strokeCircle(0, 0, s * 0.62);
    g.lineStyle(s * 0.18, c, 1); g.strokeCircle(0, 0, s * 0.3);
    g.fillStyle(0xffd23f, 1); g.fillRoundedRect(s * 0.4, -s * 0.18, s * 0.8, s * 0.36, 5);
  },
  hand(g, s) { // dedo apontando (tutorial)
    g.fillStyle(0xffe0bd, 1); g.lineStyle(4, 0x1b2a49, 1);
    g.fillRoundedRect(-s * 0.3, -s * 0.2, s * 0.6, s * 0.95, 14); g.strokeRoundedRect(-s * 0.3, -s * 0.2, s * 0.6, s * 0.95, 14);
    g.fillRoundedRect(-s * 0.12, -s * 0.95, s * 0.24, s * 0.9, 12); g.strokeRoundedRect(-s * 0.12, -s * 0.95, s * 0.24, s * 0.9, 12);
  },
};

/**
 * Botão redondo grande. Reage ao TOQUE (pointerdown), não ao "clique": resposta imediata.
 * opts: { color, icon(g,s), onDown, depth }
 */
export function roundButton(scene, x, y, r, { color = 0x2f9bff, icon, onDown, depth = 50, iconScale = 0.5, ring = 0xffffff } = {}) {
  const root = scene.add.container(x, y).setDepth(depth);
  const base = scene.add.graphics();
  const draw = (col, alpha) => {
    base.clear();
    base.fillStyle(0x000000, 0.25); base.fillCircle(0, 8, r);
    base.fillStyle(col, alpha); base.fillCircle(0, 0, r);
    base.lineStyle(8, ring, alpha); base.strokeCircle(0, 0, r);
    base.fillStyle(0xffffff, 0.18 * alpha); base.fillEllipse(0, -r * 0.45, r * 1.2, r * 0.6);
  };
  const ig = scene.add.graphics();
  root.add([base, ig]);
  const api = { root, r, enabled: true, color, hit: null, pulseTween: null };
  api.setIcon = (fn) => { ig.clear(); fn(ig, r * iconScale); };
  api.setEnabled = (v) => { api.enabled = v; draw(color, v ? 1 : 0.35); ig.setAlpha(v ? 1 : 0.35); };
  api.setColor = (c) => { color = c; draw(color, api.enabled ? 1 : 0.35); };
  api.pulse = (v) => {
    if (v && !api.pulseTween) {
      api.pulseTween = scene.tweens.add({ targets: root, scale: { from: 1, to: 1.14 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    } else if (!v && api.pulseTween) { api.pulseTween.remove(); api.pulseTween = null; root.setScale(1); }
  };
  api.destroy = () => { api.pulse(false); api.hit.destroy(); root.destroy(); };
  draw(color, 1);
  if (icon) api.setIcon(icon);

  const pad = 16; // área de toque um pouco maior que o desenho (dedos pequenos)
  const hit = scene.add.zone(x, y, (r + pad) * 2, (r + pad) * 2).setDepth(depth + 1).setInteractive();
  api.hit = hit;
  hit.on('pointerdown', (p) => {
    if (!api.enabled) { scene.tweens.add({ targets: root, angle: { from: -5, to: 5 }, duration: 60, yoyo: true, repeat: 1, onComplete: () => root.setAngle(0) }); return; }
    scene.tweens.add({ targets: root, scale: 0.9, duration: 70, yoyo: true });
    onDown && onDown(p);
  });
  return api;
}
