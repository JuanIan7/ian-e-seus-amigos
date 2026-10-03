import Phaser from 'phaser';
import { W, H, MODES, MODE_ORDER, COLORS, PHASES } from '../config.js';
import { load, save } from '../save.js';
import { buildBackground } from '../world.js';
import { roundButton, icons } from '../ui.js';
import { buildChild, poseChild, SKINS, HAIR_COLORS } from '../character.js';
import { THEMES } from './BootScene.js';
import { sfx, unlock, stopMusic, speak } from '../audio.js';

const PHASE_ICON = ['drop', 'bone', 'spring', 'wing', 'egg'];
const GROUND_COL = [0x8d8f99, 0xe9d7a8, 0x58b947, 0x9aa0a8, 0x7fb04a];

export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    stopMusic();
    const s = load();
    this.phaseSel = Math.max(1, Math.min(5, s.phase || 1));
    this.mode = MODES[s.mode] ? s.mode : 'facil';
    this.bg = buildBackground(this, PHASES[this.phaseSel - 1].theme);
    this.add.text(W / 2, 62, 'Ian e Seus Amigos', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '76px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 12 }).setOrigin(0.5);

    // ---------- dificuldade ----------
    this.cards = {};
    const cw = 330, ch = 170, gap = 40, startX = W / 2 - (cw * 3 + gap * 2) / 2;
    MODE_ORDER.forEach((id, i) => {
      const x = startX + i * (cw + gap) + cw / 2, y = 190;
      const root = this.add.container(x, y).setDepth(20);
      const bg = this.add.graphics();
      const m = MODES[id];
      const icon = this.add.graphics();
      for (let k = 0; k < 3; k++) { icon.save(); icon.translateCanvas(-60 + k * 60, -34); icons.star(icon, 22, k < m.stars ? COLORS.yellow : 0xb8c4d8); icon.restore(); }
      const label = this.add.text(0, 36, m.label, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '46px', color: '#1b2a49' }).setOrigin(0.5);
      const mark = this.add.graphics();
      root.add([bg, icon, label, mark]);
      const zone = this.add.zone(x, y, cw, ch).setDepth(21).setInteractive();
      zone.on('pointerdown', () => { unlock(); sfx.tap(); this.chooseMode(id); });
      this.cards[id] = { root, bg, mark, cw, ch };
    });
    this.chooseMode(this.mode);

    // ---------- fases ----------
    this.tiles = [];
    const tw = 220, th = 170, tg = 24, tx0 = W / 2 - (tw * 5 + tg * 4) / 2;
    PHASES.forEach((ph, i) => {
      const x = tx0 + i * (tw + tg) + tw / 2, y = 415;
      const root = this.add.container(x, y).setDepth(20);
      const g = this.add.graphics();
      const ic = this.add.graphics(); ic.y = -6; icons[PHASE_ICON[i]](ic, 36);
      const num = this.add.text(-tw / 2 + 18, -th / 2 + 6, String(i + 1), { fontFamily: 'Arial Black, Arial', fontSize: '54px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 9 });
      const nm = this.add.text(0, th / 2 - 22, ph.name.length > 20 ? ph.name.replace('Equipe de resgate na ', 'Resgate na ') : ph.name, { fontFamily: 'Arial', fontSize: '19px', fontStyle: 'bold', color: '#1b2a49', align: 'center', wordWrap: { width: tw - 16 } }).setOrigin(0.5);
      root.add([g, ic, num, nm]);
      const zone = this.add.zone(x, y, tw, th).setDepth(21).setInteractive();
      zone.on('pointerdown', () => { unlock(); sfx.tap(); this.choosePhase(i + 1); });
      this.tiles.push({ root, g, tw, th, theme: ph.theme });
    });
    this.choosePhase(this.phaseSel, true);

    // ---------- botões ----------
    this.play = roundButton(this, W / 2, 610, 90, { color: COLORS.green, depth: 30, iconScale: 0.6, icon: (g, sz) => icons.play(g, sz), onDown: () => { unlock(); sfx.tap(); this.start(); } });
    this.play.pulse(true);
    this.charBtn = roundButton(this, 240, 610, 78, { color: COLORS.orange, depth: 30, iconScale: 1, icon: (g, sz) => this.faceIcon(g, sz), onDown: () => { unlock(); sfx.tap(); this.scene.start('Character'); } });
    this.soundBtn = roundButton(this, W - 90, 70, 46, {
      color: COLORS.blue, depth: 30, iconScale: 0.55, icon: (g, sz) => icons.sound(g, sz, 0xffffff, load().sound),
      onDown: () => { unlock(); const on = !load().sound; save({ sound: on }); this.soundBtn.setIcon((g, sz) => icons.sound(g, sz, 0xffffff, on)); if (on) sfx.tap(); },
    });

    // personagem correndo no canto
    this.kid = buildChild(this).setPosition(W - 150, 665).setDepth(10).setScale(1.5);
    this.phaseT = 0;
    this.input.keyboard.on('keydown-ENTER', () => this.start());
    this.input.keyboard.on('keydown-SPACE', () => this.start());
    window.__ian = Object.assign(window.__ian || {}, { game: this.game, scene: this });
  }

  faceIcon(g, s) {
    const l = load().look;
    g.fillStyle(HAIR_COLORS[l.hairColor] ?? 0x4a2c17, 1); g.fillCircle(0, -s * 0.1, s * 0.82);
    g.fillStyle(SKINS[l.skin] ?? SKINS[3], 1); g.fillCircle(0, s * 0.05, s * 0.66);
    g.fillStyle(0x1b2a49, 1); g.fillCircle(-s * 0.24, 0, s * 0.09); g.fillCircle(s * 0.24, 0, s * 0.09);
    g.lineStyle(s * 0.07, 0x1b2a49, 1); g.beginPath(); g.arc(0, s * 0.2, s * 0.22, 0.3, Math.PI - 0.3); g.strokePath();
    g.lineStyle(s * 0.08, 0xffffff, 1); g.strokeCircle(0, -s * 0.1, s * 0.82);
  }

  chooseMode(id) {
    this.mode = id; save({ mode: id });
    for (const [k, c] of Object.entries(this.cards)) {
      const sel = k === id;
      c.bg.clear();
      c.bg.fillStyle(0x000000, 0.2); c.bg.fillRoundedRect(-c.cw / 2, -c.ch / 2 + 8, c.cw, c.ch, 32);
      c.bg.fillStyle(sel ? 0xfff3b0 : 0xffffff, 1); c.bg.fillRoundedRect(-c.cw / 2, -c.ch / 2, c.cw, c.ch, 32);
      c.bg.lineStyle(sel ? 12 : 4, sel ? COLORS.orange : 0xb8c4d8, 1); c.bg.strokeRoundedRect(-c.cw / 2, -c.ch / 2, c.cw, c.ch, 32);
      c.root.setScale(sel ? 1.06 : 1);
      c.mark.clear();
      if (sel) { c.mark.fillStyle(COLORS.green, 1); c.mark.fillCircle(c.cw / 2 - 26, -c.ch / 2 + 26, 24); c.mark.lineStyle(7, 0xffffff, 1); c.mark.beginPath(); c.mark.moveTo(c.cw / 2 - 38, -c.ch / 2 + 26); c.mark.lineTo(c.cw / 2 - 28, -c.ch / 2 + 36); c.mark.lineTo(c.cw / 2 - 12, -c.ch / 2 + 16); c.mark.strokePath(); }
    }
  }

  choosePhase(n, silent) {
    this.phaseSel = n; save({ phase: n });
    this.tiles.forEach((t, i) => {
      const sel = i + 1 === n, th = THEMES[t.theme];
      const g = t.g; g.clear();
      g.fillStyle(0x000000, 0.2); g.fillRoundedRect(-t.tw / 2, -t.th / 2 + 8, t.tw, t.th, 28);
      g.fillStyle(th.sky[0], 1); g.fillRoundedRect(-t.tw / 2, -t.th / 2, t.tw, t.th, 28);
      g.fillStyle(GROUND_COL[i], 1); g.fillRoundedRect(-t.tw / 2, 28, t.tw, t.th / 2 - 28, { tl: 0, tr: 0, bl: 28, br: 28 });
      g.fillStyle(0xffffff, 0.35); g.fillCircle(50, -40, 18); g.fillCircle(68, -46, 22); g.fillCircle(88, -40, 16);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(0, -6, 52);
      g.lineStyle(sel ? 12 : 4, sel ? COLORS.orange : 0xffffff, 1); g.strokeRoundedRect(-t.tw / 2, -t.th / 2, t.tw, t.th, 28);
      t.root.setScale(sel ? 1.07 : 1);
    });
    if (!silent) {
      if (this.bg) this.bg.destroy();
      this.bg = buildBackground(this, PHASES[n - 1].theme);
    }
  }

  start() { speak('Vamos lá!'); this.scene.start('Game', { mode: this.mode, phase: this.phaseSel }); }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.bg.update(120 * dt, dt);
    this.phaseT += dt * 11;
    poseChild(this.kid, 'run', this.phaseT, this.time.now / 1000);
  }
}
