import Phaser from 'phaser';
import { W, H, GROUND } from '../config.js';
import { outline, vivid, OUT } from '../outline.js';

// Gera todas as texturas por código: arte 100% original, sem arquivos externos nem licenças a registrar.
// Cada tema tem: céu (sky_X), camada distante (far_X), camada do meio (mid_X) e chão (ground_X).
export const THEMES = {
  bairro:   { sky: [0x4fb6ff, 0xcfeeff], farH: 300, midH: 360 },
  praca:    { sky: [0x5cc0ff, 0xffeab0], farH: 300, midH: 360 },
  floresta: { sky: [0x55c4ff, 0xd6ffb5], farH: 340, midH: 420 },
  altura:   { sky: [0x3c8dff, 0xffc08a], farH: 360, midH: 420 },
  pre:      { sky: [0xffa94d, 0xffe9a8], farH: 360, midH: 400 },
};

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const mk = (key, w, h, fn, ol = 0) => { const g = this.make.graphics({ x: 0, y: 0, add: false }); if (/^(far|mid|ground)_/.test(key)) vivid(g, 1.4); if (ol) outline(g, 3, OUT, ol); fn(g); g.generateTexture(key, w, h); g.destroy(); };
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    // ---------- céus ----------
    Object.entries(THEMES).forEach(([k, t]) => mk('sky_' + k, 8, H, (g) => {
      const a = Phaser.Display.Color.ValueToColor(t.sky[0]), b = Phaser.Display.Color.ValueToColor(t.sky[1]);
      for (let y = 0; y < H; y += 4) { const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, H, y); g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1); g.fillRect(0, y, 8, 4); }
    }));
    mk('sun', 300, 300, (g) => { for (let r = 150; r > 20; r -= 10) { g.fillStyle(0xffffff, 0.035 + (150 - r) / 150 * 0.05); g.fillCircle(150, 150, r); } g.fillStyle(0xffffff, 1); g.fillCircle(150, 150, 46); });
    mk('cloud', 220, 108, (g) => { g.fillStyle(0xcfe6fa, 1); g.fillCircle(60, 68, 34); g.fillCircle(105, 54, 42); g.fillCircle(155, 66, 34); g.fillRoundedRect(40, 66, 140, 36, 18); g.fillStyle(0xffffff, 1); g.fillCircle(60, 60, 34); g.fillCircle(105, 44, 42); g.fillCircle(155, 58, 34); g.fillRoundedRect(40, 56, 140, 34, 17); });

    // ---------- camadas distantes ----------
    const hills = (g, c1, c2, h) => { g.fillStyle(c1, 1); for (let i = 0; i < 8; i++) g.fillCircle(100 + i * 215, h, 120 + (i % 3) * 30); g.fillStyle(c2, 1); for (let i = 0; i < 6; i++) g.fillCircle(190 + i * 280, h, 100 + (i % 2) * 40); };
    mk('far_bairro', W, 300, (g) => hills(g, 0x9ad9a0, 0x7fcb8c, 300));
    mk('far_praca', W, 300, (g) => hills(g, 0xb7e3a0, 0x95d58a, 300));
    mk('far_floresta', W, 340, (g) => { g.fillStyle(0x6fb98a, 1); for (let i = 0; i < 9; i++) g.fillTriangle(i * 190 - 40, 340, i * 190 + 110, 80 + (i % 3) * 40, i * 190 + 260, 340); g.fillStyle(0x4f9d6f, 1); for (let i = 0; i < 7; i++) g.fillTriangle(i * 250 + 30, 340, i * 250 + 170, 150 + (i % 2) * 40, i * 250 + 320, 340); });
    mk('far_altura', W, 360, (g) => { g.fillStyle(0x93a9d6, 1); for (let i = 0; i < 20; i++) { const w = 60 + (i % 4) * 24, h = 120 + ((i * 53) % 150); g.fillRect(i * 80 + 4, 360 - h, w, h); } g.fillStyle(0x7b92c4, 1); for (let i = 0; i < 12; i++) { const w = 70 + (i % 3) * 20, h = 80 + ((i * 71) % 120); g.fillRect(i * 130 + 30, 360 - h, w, h); } });
    mk('far_pre', W, 360, (g) => {
      g.fillStyle(0x9b6a4e, 1); g.fillTriangle(100, 360, 330, 90, 560, 360); g.fillTriangle(900, 360, 1130, 140, 1360, 360);
      g.fillStyle(0xff6a3a, 1); g.fillTriangle(300, 118, 330, 90, 360, 118); g.fillTriangle(1100, 166, 1130, 140, 1160, 166);
      g.fillStyle(0xe6d3c3, 0.85); g.fillCircle(330, 60, 26); g.fillCircle(354, 36, 20); g.fillCircle(1130, 112, 24); g.fillCircle(1152, 88, 18);
      g.fillStyle(0xb98a6a, 1); for (let i = 0; i < 6; i++) g.fillCircle(520 + i * 120, 360, 90 + (i % 2) * 30);
    });

    // ---------- camadas do meio (com contorno suave) ----------
    const mkMid = (key, w, h, fn) => mk(key, w, h, fn, 0.4);
    const tree = (g, base, x, s, c1 = 0x38b35a) => { g.fillStyle(0x8d5a3b, 1); g.fillRect(x - 6 * s, base - 60 * s, 12 * s, 60 * s); g.fillStyle(c1, 1); g.fillCircle(x, base - 78 * s, 38 * s); g.fillCircle(x - 24 * s, base - 62 * s, 26 * s); g.fillCircle(x + 24 * s, base - 62 * s, 26 * s); };
    const house = (g, base, x, w, h, wall, roof) => { g.fillStyle(wall, 1); g.fillRect(x, base - h, w, h); g.fillStyle(roof, 1); g.fillTriangle(x - 10, base - h, x + w + 10, base - h, x + w / 2, base - h - 55); g.fillStyle(0xffffff, 0.85); g.fillRect(x + w * 0.2, base - h * 0.62, w * 0.22, h * 0.28); g.fillRect(x + w * 0.62, base - h * 0.62, w * 0.22, h * 0.28); g.fillStyle(0x8d5a3b, 1); g.fillRect(x + w * 0.42, base - h * 0.34, w * 0.16, h * 0.34); };
    const tower = (g, base, x, w, h, col) => { g.fillStyle(col, 1); g.fillRect(x, base - h, w, h); g.fillStyle(0xfff2b0, 0.9); for (let yy = base - h + 18; yy < base - 24; yy += 32) for (let xx = x + 12; xx < x + w - 18; xx += 30) g.fillRect(xx, yy, 14, 18); };
    mkMid('mid_bairro', W, 360, (g) => {
      const b = 360; house(g, b, 20, 130, 110, 0xffd9a8, 0xd9534f); tree(g, b, 215, 1); tower(g, b, 290, 120, 250, 0x9fb4d6); house(g, b, 450, 150, 130, 0xc9e8ff, 0x3f7fd9);
      tree(g, b, 660, 1.1); tree(g, b, 740, 0.8); tower(g, b, 800, 140, 310, 0xe6a6b8); house(g, b, 985, 120, 105, 0xd7f2c0, 0xe08a2e); tower(g, b, 1140, 110, 220, 0xb9a7e6); tree(g, b, 1300, 1.15); house(g, b, 1360, 140, 120, 0xfff0a6, 0x8e5bd9);
    });
    mkMid('mid_praca', W, 360, (g) => {
      const b = 360;
      const shop = (x, w, h, wall, awn) => { g.fillStyle(wall, 1); g.fillRect(x, b - h, w, h); g.fillStyle(awn, 1); for (let i = 0; i < 5; i++) { g.fillStyle(i % 2 ? awn : 0xffffff, 1); g.fillRect(x + i * (w / 5), b - h * 0.62, w / 5, 26); } g.fillStyle(0x9fdcff, 1); g.fillRect(x + w * 0.12, b - h * 0.48, w * 0.76, h * 0.34); g.fillStyle(0xffffff, 0.8); g.fillRect(x + w * 0.12, b - h * 0.9, w * 0.76, 20); };
      shop(10, 190, 150, 0xffe3a8, 0xe53935); tree(g, b, 250, 1.1, 0x4fc46a); tree(g, b, 330, 0.8, 0x38b35a);
      // fonte da praça
      g.fillStyle(0xcfd8e3, 1); g.fillEllipse(520, b - 18, 180, 36); g.fillRect(500, b - 74, 40, 60); g.fillStyle(0xbfe6ff, 1); g.fillEllipse(520, b - 80, 110, 22); g.fillStyle(0x7ecbff, 1); g.fillCircle(520, b - 104, 8); g.fillCircle(500, b - 96, 5); g.fillCircle(540, b - 96, 5);
      shop(680, 200, 170, 0xc9e8ff, 0x2f9bff); tree(g, b, 940, 1.2, 0x4fc46a);
      g.fillStyle(0x5a4a3a, 1); g.fillRect(1010, b - 140, 8, 140); g.fillStyle(0xfff2b0, 1); g.fillCircle(1014, b - 146, 14);
      shop(1060, 190, 140, 0xffd1dc, 0x8e5bd9); tree(g, b, 1300, 0.9); tree(g, b, 1380, 1.1, 0x4fc46a);
      g.fillStyle(0x8d5a3b, 1); g.fillRect(1440, b - 40, 90, 12); g.fillRect(1448, b - 28, 8, 28); g.fillRect(1512, b - 28, 8, 28); g.fillRect(1440, b - 70, 90, 8);
    });
    mkMid('mid_floresta', W, 420, (g) => {
      const b = 420;
      const pine = (x, h, c) => { g.fillStyle(0x6e4527, 1); g.fillRect(x - 10, b - 80, 20, 80); g.fillStyle(c, 1); for (let i = 0; i < 4; i++) g.fillTriangle(x - 70 + i * 8, b - 60 - i * 62, x + 70 - i * 8, b - 60 - i * 62, x, b - 150 - i * 62 - h); };
      pine(80, 20, 0x2f8f4f); tree(g, b, 250, 1.8, 0x3fa65a); pine(450, 0, 0x2a7f46);
      g.fillStyle(0x8a8f99, 1); g.fillEllipse(590, b - 20, 120, 50); g.fillEllipse(640, b - 14, 80, 36);
      tree(g, b, 800, 2.1, 0x45b563); pine(1000, 30, 0x2f8f4f); tree(g, b, 1180, 1.6, 0x3fa65a);
      g.fillStyle(0x2f8f4f, 1); for (let i = 0; i < 9; i++) g.fillCircle(150 + i * 170, b - 6, 30 + (i % 3) * 8);
      g.fillStyle(0xff7eb6, 1); [[330, b - 20], [740, b - 14], [1250, b - 20]].forEach(([x, y]) => g.fillCircle(x, y, 7));
    });
    mkMid('mid_altura', W, 420, (g) => {
      const b = 420;
      const bld = (x, w, h, col, win) => { g.fillStyle(col, 1); g.fillRect(x, b - h, w, h); g.fillStyle(shadeC(col, 0.85), 1); g.fillRect(x, b - h, w, 10); g.fillStyle(win, 0.95); for (let yy = b - h + 26; yy < b - 20; yy += 36) for (let xx = x + 14; xx < x + w - 20; xx += 34) g.fillRect(xx, yy, 18, 22); };
      bld(10, 150, 300, 0x8aa3d8, 0xfff2b0); bld(190, 120, 380, 0xc79bd9, 0xffe3a8); g.fillStyle(0x5a6a7a, 1); g.fillRect(230, b - 410, 40, 30); g.fillRect(246, b - 440, 8, 30);
      bld(340, 170, 260, 0x7fc3e8, 0xfff2b0); bld(550, 130, 340, 0xf2a6a0, 0xfff6cc); bld(710, 160, 290, 0x9fd6b2, 0xfff2b0);
      g.fillStyle(0x9aa0a8, 1); g.fillCircle(790, b - 310, 14); g.fillRect(782, b - 300, 16, 20);
      bld(900, 140, 380, 0xb9a7e6, 0xfff2b0); bld(1070, 150, 250, 0x8aa3d8, 0xffe3a8); bld(1250, 130, 330, 0xffc98a, 0xfff6cc); bld(1400, 140, 270, 0x9fd6b2, 0xfff2b0);
    });
    mkMid('mid_pre', W, 400, (g) => {
      const b = 400;
      const fern = (x, s, c) => { g.fillStyle(0x6e4527, 1); g.fillRect(x - 6 * s, b - 110 * s, 12 * s, 110 * s); g.fillStyle(c, 1); for (let i = 0; i < 7; i++) { const a = -Math.PI + (i / 6) * Math.PI; g.fillTriangle(x, b - 110 * s, x + Math.cos(a - 0.16) * 100 * s, b - 110 * s + Math.sin(a - 0.16) * 70 * s + 20 * s, x + Math.cos(a + 0.16) * 100 * s, b - 110 * s + Math.sin(a + 0.16) * 70 * s + 20 * s); } };
      fern(90, 1.3, 0x3fa65a); fern(320, 1, 0x58b947);
      g.fillStyle(0x7a6a5a, 1); g.fillEllipse(520, b - 40, 220, 120); g.fillStyle(0x2b2118, 1); g.fillEllipse(520, b - 28, 90, 70);  // caverna
      fern(760, 1.5, 0x3fa65a); fern(980, 1.1, 0x58b947);
      g.fillStyle(0x8a8f99, 1); g.fillEllipse(1130, b - 26, 150, 60); g.fillEllipse(1190, b - 18, 90, 44);
      fern(1300, 1.4, 0x3fa65a); fern(1460, 0.9, 0x58b947);
      g.fillStyle(0xffe27a, 1); [[200, b - 12], [880, b - 14], [1380, b - 12]].forEach(([x, y]) => g.fillCircle(x, y, 8));
    });

    // ---------- chão (repete a cada 256 px): grama com borda recortada e camadas de terra, ou calçada/telhado ----------
    const groundH = H - GROUND;
    const grass = (g, o) => {
      // terra em faixas
      g.fillStyle(o.soil1, 1); g.fillRect(0, 0, 256, groundH);
      g.fillStyle(o.soil2, 1); for (let x = 0; x < 256; x += 8) { const y = 78 + Math.sin(x / 256 * Math.PI * 4) * 8; g.fillRect(x, y, 8, groundH - y); }
      g.fillStyle(o.soil3, 1); for (let x = 0; x < 256; x += 8) { const y = 118 + Math.sin(x / 256 * Math.PI * 2 + 1) * 6; g.fillRect(x, y, 8, groundH - y); }
      g.fillStyle(o.pebble, 1); [[24, 58], [92, 66], [176, 54], [228, 70], [60, 100], [150, 104], [214, 112]].forEach(([x, y]) => g.fillEllipse(x, y, 20, 11));
      g.fillStyle(o.soil2, 0.8); [[24, 60], [92, 68], [176, 56], [228, 72]].forEach(([x, y]) => g.fillEllipse(x + 2, y + 2, 14, 7));
      // grama com borda de dentes
      g.fillStyle(o.dark, 1); for (let x = 0; x < 256; x += 32) g.fillTriangle(x - 2, 34, x + 34, 34, x + 16, 54);
      g.fillStyle(o.mid, 1); g.fillRect(0, 0, 256, 38); for (let x = 0; x < 256; x += 32) g.fillTriangle(x, 36, x + 32, 36, x + 16, 50);
      g.fillStyle(o.light, 1); g.fillRect(0, 0, 256, 11);
      g.fillStyle(o.light, 0.7); for (let x = 6; x < 256; x += 32) g.fillTriangle(x, 11, x + 10, 11, x + 5, 22);
      g.fillStyle(OUT, 0.55); g.fillRect(0, 0, 256, 4);
    };
    mk('ground_floresta', 256, groundH, (g) => grass(g, { soil1: 0xb9824c, soil2: 0xa56f3c, soil3: 0x8a5a2e, pebble: 0xd9a86a, dark: 0x2f8a2a, mid: 0x4fc23a, light: 0x8be06a }));
    mk('ground_pre', 256, groundH, (g) => grass(g, { soil1: 0xc88a50, soil2: 0xb4763c, soil3: 0x985f2c, pebble: 0xe6c79a, dark: 0x5f8f2a, mid: 0x86c23a, light: 0xb5e05c }));
    const walk = (g, o) => {
      g.fillStyle(o.base, 1); g.fillRect(0, 0, 256, 50);
      g.fillStyle(o.light, 1); g.fillRect(0, 0, 256, 12);
      g.fillStyle(o.line, 1); for (let x = 0; x < 256; x += 64) g.fillRect(x, 12, 3, 38); g.fillRect(0, 30, 256, 3);
      g.fillStyle(o.edge, 1); g.fillRect(0, 44, 256, 8);
      g.fillStyle(OUT, 0.55); g.fillRect(0, 0, 256, 4); g.fillRect(0, 50, 256, 3);
      g.fillStyle(o.road, 1); g.fillRect(0, 53, 256, groundH - 53);
      g.fillStyle(o.road2, 1); g.fillRect(0, 53, 256, 12);
    };
    mk('ground_bairro', 256, groundH, (g) => { walk(g, { base: 0xe9e3d4, light: 0xf8f4e8, line: 0xcfc8b6, edge: 0xb8b09c, road: 0x5b6270, road2: 0x4a505c }); g.fillStyle(0xffe27a, 1); g.fillRoundedRect(20, 96, 90, 12, 5); g.fillRoundedRect(148, 96, 90, 12, 5); });
    mk('ground_praca', 256, groundH, (g) => { walk(g, { base: 0xf2e3c2, light: 0xfff6dc, line: 0xd9c79c, edge: 0xc2ad7c, road: 0x5b6270, road2: 0x4a505c }); g.fillStyle(0xffffff, 1); for (let x = 10; x < 256; x += 64) g.fillRoundedRect(x, 94, 40, 40, 5); });
    mk('ground_altura', 256, groundH, (g) => {
      g.fillStyle(0xb7bdc7, 1); g.fillRect(0, 0, 256, 46); g.fillStyle(0xdde1e8, 1); g.fillRect(0, 0, 256, 12);
      g.fillStyle(0x8e95a1, 1); for (let x = 0; x < 256; x += 64) g.fillRect(x, 12, 3, 34); g.fillRect(0, 36, 256, 10);
      g.fillStyle(OUT, 0.55); g.fillRect(0, 0, 256, 4); g.fillRect(0, 46, 256, 3);
      g.fillStyle(0x5b6270, 1); g.fillRect(0, 49, 256, groundH - 49);
      g.fillStyle(0x484e58, 1); for (let x = 0; x < 256; x += 64) g.fillRoundedRect(x + 8, 66, 44, 56, 6);
      g.fillStyle(0xffe27a, 1); for (let x = 0; x < 256; x += 64) g.fillRoundedRect(x + 16, 74, 28, 24, 4);
    });

    // ---------- itens ----------
    mk('drop', 16, 20, (g) => { g.fillStyle(0x4db8ff, 1); g.fillCircle(8, 12, 7); g.fillTriangle(8, 0, 2, 10, 14, 10); g.fillStyle(0xffffff, 0.7); g.fillCircle(6, 11, 2); });
    mk('star', 48, 48, (g) => {
      const pts = (cx, cy, ro, ri) => { const a = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? ri : ro; const ang = -Math.PI / 2 + i * Math.PI / 5; a.push(new Phaser.Math.Vector2(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r)); } return a; };
      g.lineStyle(5, 0x9a5a00, 1); g.fillStyle(0xffc21a, 1); const o = pts(24, 25, 21, 10); g.fillPoints(o, true); g.strokePoints(o, true);
      g.fillStyle(0xffe45c, 1); g.fillPoints(pts(24, 24, 15, 7.5), true);
      g.fillStyle(0xffffff, 0.85); g.fillEllipse(17, 15, 8, 5); g.fillCircle(30, 33, 1.8);
    });
    mk('puff', 40, 40, (g) => { g.fillStyle(0xffffff, 0.9); g.fillCircle(20, 20, 16); });
    mk('bone', 40, 20, (g) => { g.fillStyle(0xfff6e0, 1); g.fillRoundedRect(8, 6, 24, 8, 4); [[8, 5], [8, 15], [32, 5], [32, 15]].forEach(([x, y]) => g.fillCircle(x, y, 5)); });
    mk('heart', 28, 26, (g) => { g.fillStyle(0xff5a7a, 1); g.fillCircle(8, 9, 8); g.fillCircle(20, 9, 8); g.fillTriangle(1, 12, 27, 12, 14, 25); });
    mk('crate', 30, 30, (g) => { g.fillStyle(0xc99a5b, 1); g.fillRect(0, 0, 30, 30); g.lineStyle(3, 0x8a5a35, 1); g.strokeRect(1.5, 1.5, 27, 27); });
    mk('box', 34, 30, (g) => { g.fillStyle(0xffffff, 1); g.fillRoundedRect(2, 4, 30, 24, 4); g.fillStyle(0xe53935, 1); g.fillRect(14, 4, 6, 24); g.fillRect(2, 13, 30, 5); });
    mk('egg', 26, 34, (g) => { g.fillStyle(0xfff3dc, 1); g.fillEllipse(13, 18, 22, 30); g.fillStyle(0x7fcb8c, 1); g.fillCircle(9, 14, 3.5); g.fillCircle(17, 22, 4); });
    mk('spark', 24, 24, (g) => { g.fillStyle(0xfff3b0, 1); g.fillCircle(12, 12, 6); g.fillStyle(0xffd23f, 0.6); g.fillCircle(12, 12, 11); });

    this.scene.start('Menu');
  }
}

function shadeC(c, f) { return ((Math.round(((c >> 16) & 255) * f) << 16) | (Math.round(((c >> 8) & 255) * f) << 8) | Math.round((c & 255) * f)); }
