import Phaser from 'phaser';
import { W, H, GROUND, COLORS } from '../config.js';

// Gera todas as texturas por código: arte 100% original, sem arquivos externos nem licenças a registrar.
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const mk = (key, w, h, fn) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      fn(g); g.generateTexture(key, w, h); g.destroy();
    };
    // seed simples para cenário determinístico
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    // céu em degradê
    mk('sky', 8, H, (g) => {
      const a = Phaser.Display.Color.ValueToColor(COLORS.sky1), b = Phaser.Display.Color.ValueToColor(COLORS.sky2);
      for (let y = 0; y < H; y += 4) {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, H, y);
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1); g.fillRect(0, y, 8, 4);
      }
    });
    mk('cloud', 220, 100, (g) => {
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(60, 60, 34); g.fillCircle(105, 44, 42); g.fillCircle(155, 58, 34); g.fillRoundedRect(40, 56, 140, 36, 18);
    });
    // colinas distantes (repetíveis: nada atravessa a borda)
    mk('hills', W, 300, (g) => {
      g.fillStyle(0x9ad9a0, 1);
      for (let i = 0; i < 7; i++) g.fillCircle(100 + i * 230, 300, 120 + (i % 3) * 30);
      g.fillStyle(0x7fcb8c, 1);
      for (let i = 0; i < 5; i++) g.fillCircle(210 + i * 320, 300, 100 + (i % 2) * 40);
    });
    // bairro: casas, prédios e árvores do parque
    mk('city', W, 360, (g) => {
      const base = 360;
      const house = (x, w, h, wall, roof) => {
        g.fillStyle(wall, 1); g.fillRect(x, base - h, w, h);
        g.fillStyle(roof, 1); g.fillTriangle(x - 10, base - h, x + w + 10, base - h, x + w / 2, base - h - 55);
        g.fillStyle(0xffffff, 0.85); g.fillRect(x + w * 0.2, base - h * 0.62, w * 0.22, h * 0.28); g.fillRect(x + w * 0.62, base - h * 0.62, w * 0.22, h * 0.28);
        g.fillStyle(0x8d5a3b, 1); g.fillRect(x + w * 0.42, base - h * 0.34, w * 0.16, h * 0.34);
      };
      const tower = (x, w, h, col) => {
        g.fillStyle(col, 1); g.fillRect(x, base - h, w, h);
        g.fillStyle(0xfff2b0, 0.9);
        for (let yy = base - h + 18; yy < base - 24; yy += 32) for (let xx = x + 12; xx < x + w - 18; xx += 30) g.fillRect(xx, yy, 14, 18);
      };
      const tree = (x, s) => {
        g.fillStyle(0x8d5a3b, 1); g.fillRect(x - 6 * s, base - 60 * s, 12 * s, 60 * s);
        g.fillStyle(0x38b35a, 1); g.fillCircle(x, base - 78 * s, 38 * s); g.fillCircle(x - 24 * s, base - 62 * s, 26 * s); g.fillCircle(x + 24 * s, base - 62 * s, 26 * s);
      };
      house(20, 130, 110, 0xffd9a8, 0xd9534f);
      tree(215, 1);
      tower(290, 120, 250, 0x9fb4d6);
      house(450, 150, 130, 0xc9e8ff, 0x3f7fd9);
      tree(660, 1.1); tree(740, 0.8);
      tower(800, 140, 310, 0xe6a6b8);
      house(985, 120, 105, 0xd7f2c0, 0xe08a2e);
      tower(1140, 110, 220, 0xb9a7e6);
      tree(1300, 1.15);
      house(1360, 140, 120, 0xfff0a6, 0x8e5bd9);
      void rnd;
    });
    // chão: calçada + rua (repete a cada 256 px)
    mk('ground', 256, H - GROUND, (g) => {
      const h = H - GROUND;
      g.fillStyle(0xe9e3d4, 1); g.fillRect(0, 0, 256, 44);
      g.fillStyle(0xcfc8b6, 1); g.fillRect(0, 0, 256, 6);
      g.fillStyle(0xcfc8b6, 1); g.fillRect(0, 22, 3, 22); g.fillRect(128, 22, 3, 22);
      g.fillStyle(0x5b6270, 1); g.fillRect(0, 44, 256, h - 44);
      g.fillStyle(0x9aa1ad, 1); g.fillRect(0, 44, 256, 6);
      g.fillStyle(0xffe27a, 1); g.fillRoundedRect(20, 86, 90, 10, 4); g.fillRoundedRect(148, 86, 90, 10, 4);
    });
    mk('drop', 16, 20, (g) => { g.fillStyle(0x4db8ff, 1); g.fillCircle(8, 12, 7); g.fillTriangle(8, 0, 2, 10, 14, 10); g.fillStyle(0xffffff, 0.7); g.fillCircle(6, 11, 2); });
    mk('star', 44, 44, (g) => {
      g.fillStyle(0xffd23f, 1); g.lineStyle(3, 0xf29a00, 1);
      const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 20; const a = -Math.PI / 2 + i * Math.PI / 5; pts.push(new Phaser.Math.Vector2(22 + Math.cos(a) * r, 22 + Math.sin(a) * r)); }
      g.fillPoints(pts, true); g.strokePoints(pts, true);
    });
    mk('puff', 40, 40, (g) => { g.fillStyle(0xffffff, 0.9); g.fillCircle(20, 20, 16); });

    this.scene.start('Menu');
  }
}
