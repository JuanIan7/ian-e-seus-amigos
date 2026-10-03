import Phaser from 'phaser';
import { W, H, COLORS } from '../config.js';
import { load, save, DEFAULT_LOOK } from '../save.js';
import { buildBackground } from '../world.js';
import { roundButton, icons } from '../ui.js';
import { buildChild, poseChild, SKINS, HAIR_COLORS, EYE_COLORS, FACES, HAIR_STYLES, OUTFITS } from '../character.js';
import { sfx, unlock, speak } from '../audio.js';

const TABS = ['face', 'hair', 'shirt'];
const PX = 600, PY = 150, PW = 900, PH = 440;

export default class CharacterScene extends Phaser.Scene {
  constructor() { super('Character'); }

  create() {
    this.look = { ...DEFAULT_LOOK, ...load().look };
    this.tab = 0; this.pt = 0;
    this.bg = buildBackground(this, 'praca');

    // palco do personagem
    const stage = this.add.graphics().setDepth(2);
    stage.fillStyle(0x000000, 0.18); stage.fillEllipse(310, 628, 330, 50);
    stage.fillStyle(0xffffff, 0.85); stage.fillEllipse(310, 618, 330, 50);
    this.preview = null; this.buildPreview();

    // painel
    const panel = this.add.graphics().setDepth(3);
    panel.fillStyle(0x000000, 0.2); panel.fillRoundedRect(PX, PY + 8, PW, PH, 36);
    panel.fillStyle(0xffffff, 0.96); panel.fillRoundedRect(PX, PY, PW, PH, 36);

    // abas (ícones, sem texto)
    this.tabBtns = TABS.map((t, i) => roundButton(this, PX + 150 + i * 150, 96, 44, {
      color: COLORS.blue, depth: 30, iconScale: 1, icon: (g, s) => this.tabIcon(g, s, t),
      onDown: () => { unlock(); sfx.tap(); this.setTab(i); },
    }));
    this.content = this.add.container(0, 0).setDepth(10);
    this.setTab(0);

    this.homeBtn = roundButton(this, 80, 70, 46, { color: COLORS.blue, depth: 30, iconScale: 0.55, icon: (g, s) => icons.home(g, s), onDown: () => { unlock(); sfx.tap(); this.scene.start('Menu'); } });
    this.okBtn = roundButton(this, W - 110, 650, 58, { color: COLORS.green, depth: 30, iconScale: 0.8, icon: (g, s) => this.checkIcon(g, s), onDown: () => { unlock(); sfx.tap(); speak('Pronto!'); this.scene.start('Menu'); } });
    this.okBtn.pulse(true);
    this.diceBtn = roundButton(this, PX + PW - 70, 96, 44, { color: COLORS.orange, depth: 30, iconScale: 0.9, icon: (g, s) => this.diceIcon(g, s), onDown: () => { unlock(); sfx.tap(); this.randomize(); } });
    window.__ian = Object.assign(window.__ian || {}, { game: this.game, scene: this });
  }

  // ---------- ícones das abas ----------
  tabIcon(g, s, t) {
    const l = this.look;
    if (t === 'face') {
      g.fillStyle(SKINS[l.skin], 1); g.fillCircle(0, 0, s * 0.8); g.lineStyle(s * 0.1, 0xffffff, 1); g.strokeCircle(0, 0, s * 0.8);
      g.fillStyle(0x1b2a49, 1); g.fillCircle(-s * 0.28, -s * 0.05, s * 0.1); g.fillCircle(s * 0.28, -s * 0.05, s * 0.1);
      g.lineStyle(s * 0.08, 0x1b2a49, 1); g.beginPath(); g.arc(0, s * 0.18, s * 0.26, 0.3, Math.PI - 0.3); g.strokePath();
    } else if (t === 'hair') {
      g.fillStyle(HAIR_COLORS[l.hairColor], 1); g.fillCircle(0, -s * 0.1, s * 0.85); g.fillCircle(-s * 0.7, s * 0.2, s * 0.35); g.fillCircle(s * 0.7, s * 0.2, s * 0.35);
      g.fillStyle(SKINS[l.skin], 1); g.fillEllipse(0, s * 0.15, s * 1.0, s * 1.0);
      g.fillStyle(HAIR_COLORS[l.hairColor], 1); g.fillEllipse(0, -s * 0.38, s * 1.2, s * 0.5);
    } else {
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(-s * 0.4, -s * 0.8, -s * 1.0, -s * 0.2, -s * 0.7, s * 0.15); g.fillTriangle(s * 0.4, -s * 0.8, s * 1.0, -s * 0.2, s * 0.7, s * 0.15);
      g.fillRoundedRect(-s * 0.7, -s * 0.8, s * 1.4, s * 1.6, 8);
      g.fillStyle(COLORS.blue, 1); g.fillTriangle(-s * 0.3, -s * 0.8, s * 0.3, -s * 0.8, 0, -s * 0.4);
    }
  }
  checkIcon(g, s) { g.lineStyle(s * 0.28, 0xffffff, 1); g.beginPath(); g.moveTo(-s * 0.7, 0); g.lineTo(-s * 0.15, s * 0.55); g.lineTo(s * 0.8, -s * 0.5); g.strokePath(); }
  diceIcon(g, s) { g.fillStyle(0xffffff, 1); g.fillRoundedRect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6, 10); g.fillStyle(COLORS.orange, 1); [[-0.4, -0.4], [0.4, -0.4], [0, 0], [-0.4, 0.4], [0.4, 0.4]].forEach(([x, y]) => g.fillCircle(x * s, y * s, s * 0.14)); }

  // ---------- personagem ao vivo ----------
  buildPreview() {
    if (this.preview) this.preview.destroy();
    this.preview = buildChild(this, this.look).setPosition(310, 612).setDepth(8).setScale(3.1);
    this.preview.parts.hoseBack.visible = false;
  }
  setLook(patch) {
    this.look = { ...this.look, ...patch };
    save({ look: this.look });
    this.buildPreview();
    this.render();
    this.tabBtns.forEach((b, i) => { b.setIcon((g, s) => this.tabIcon(g, s, TABS[i])); });
    this.tweens.add({ targets: this.preview, scaleY: { from: 2.8, to: 3.1 }, duration: 220, ease: 'Back.out' });
  }
  randomize() {
    const r = (n) => Math.floor(Math.random() * n);
    this.setLook({ skin: r(SKINS.length), face: r(FACES.length), hair: r(HAIR_STYLES.length), hairColor: r(HAIR_COLORS.length), eyes: r(EYE_COLORS.length), outfit: this.look.outfit });
  }

  setTab(i) {
    this.tab = i;
    this.tabBtns.forEach((b, k) => b.setColor(k === i ? COLORS.orange : COLORS.blue));
    this.render();
  }

  // ---------- painel ----------
  clearContent() { this.content.removeAll(true); }
  swatches(y, list, sel, onPick, opts = {}) {
    const r = opts.r || 34, step = opts.step || 96, n = list.length;
    const x0 = PX + PW / 2 - ((n - 1) * step) / 2;
    list.forEach((col, i) => {
      const x = x0 + i * step, g = this.add.graphics();
      g.fillStyle(0x000000, 0.2); g.fillCircle(x, y + 4, r);
      g.fillStyle(col, 1); g.fillCircle(x, y, r);
      if (opts.eye) { g.fillStyle(0xffffff, 1); g.fillEllipse(x, y, r * 1.5, r * 0.9); g.fillStyle(col, 1); g.fillCircle(x, y, r * 0.38); g.fillStyle(0x000000, 1); g.fillCircle(x, y, r * 0.18); }
      g.lineStyle(i === sel ? 9 : 3, i === sel ? COLORS.orange : 0xb8c4d8, 1); g.strokeCircle(x, y, r + (i === sel ? 5 : 0));
      const z = this.add.zone(x, y, r * 2 + 20, r * 2 + 20).setInteractive();
      z.on('pointerdown', () => { unlock(); sfx.tap(); onPick(i); });
      this.content.add([g, z]);
    });
  }
  thumbs(y, count, sel, onPick, mk, opts = {}) {
    const tw = opts.tw || 110, th = opts.th || 120, step = opts.step || (tw + 14), per = opts.per || count;
    const rows = Math.ceil(count / per);
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / per), col = i % per, inRow = Math.min(per, count - row * per);
      const x = PX + PW / 2 - ((inRow - 1) * step) / 2 + col * step, yy = y + row * (th + 14);
      const bg = this.add.graphics();
      bg.fillStyle(i === sel ? 0xfff3b0 : 0xf1f4fa, 1); bg.fillRoundedRect(x - tw / 2, yy - th / 2, tw, th, 18);
      bg.lineStyle(i === sel ? 9 : 3, i === sel ? COLORS.orange : 0xb8c4d8, 1); bg.strokeRoundedRect(x - tw / 2, yy - th / 2, tw, th, 18);
      const rt = this.add.renderTexture(x - tw / 2, yy - th / 2, tw, th).setOrigin(0, 0);
      const c = mk(i); rt.draw(c, tw / 2, opts.feet ?? th / 2); c.destroy();
      const z = this.add.zone(x, yy, tw, th).setInteractive();
      z.on('pointerdown', () => { unlock(); sfx.tap(); onPick(i); });
      this.content.add([bg, rt, z]);
    }
  }
  label(y, txt) { this.content.add(this.add.text(PX + 40, y, txt, { fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold', color: '#5a6b8c' })); }

  render() {
    this.clearContent();
    const L = this.look;
    if (this.tab === 0) {
      this.label(176, 'Pele'); this.swatches(250, SKINS, L.skin, (i) => this.setLook({ skin: i }), { r: 36, step: 100 });
      this.label(310, 'Rosto');
      this.thumbs(400, FACES.length, L.face, (i) => this.setLook({ face: i }), (i) => { const c = buildChild(this, { ...L, face: i, outfit: 9 }); c.setScale(0.8); return c; }, { tw: 130, th: 120, step: 150, feet: 146 });
      this.label(480, 'Olhos'); this.swatches(540, EYE_COLORS, L.eyes, (i) => this.setLook({ eyes: i }), { r: 32, step: 96, eye: true });
    } else if (this.tab === 1) {
      this.label(176, 'Penteado');
      this.thumbs(262, HAIR_STYLES.length, L.hair, (i) => this.setLook({ hair: i }), (i) => { const c = buildChild(this, { ...L, hair: i, outfit: 9 }); c.setScale(0.8); return c; }, { tw: 120, th: 110, step: 134, per: 4, feet: 142 });
      this.label(480, 'Cor do cabelo'); this.swatches(545, HAIR_COLORS, L.hairColor, (i) => this.setLook({ hairColor: i }), { r: 32, step: 96 });
    } else {
      this.label(172, 'Roupa');
      this.thumbs(280, OUTFITS.length, L.outfit, (i) => this.setLook({ outfit: i }), (i) => { const c = buildChild(this, { ...L, outfit: i }); c.setScale(0.74); c.parts.hoseBack.visible = false; return c; }, { tw: 150, th: 190, step: 164, per: 5, feet: 168 });
    }
  }

  // usado nos testes: desenha o personagem em todas as poses
  cycleStates() {
    for (const st of ['run', 'jump', 'glide', 'fly', 'spray', 'throw', 'idle']) poseChild(this.preview, st, 1.3, 0.7);
  }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.pt += dt;
    poseChild(this.preview, 'run', this.pt * 6, this.pt);
    this.preview.y = 612 - Math.abs(Math.sin(this.pt * 6)) * 6;
  }
}
