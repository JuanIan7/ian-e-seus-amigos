import Phaser from 'phaser';
import { W, H, MODES, MODE_ORDER, COLORS } from '../config.js';
import { load, save } from '../save.js';
import { buildBackground } from '../world.js';
import { roundButton, icons } from '../ui.js';
import { buildChild, poseChild } from '../character.js';
import { sfx, unlock, stopMusic, speak } from '../audio.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    stopMusic();
    this.bg = buildBackground(this);
    this.add.text(W / 2, 78, 'Ian e Seus Amigos', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '84px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 12 }).setOrigin(0.5);

    const s = load();
    this.mode = MODES[s.mode] ? s.mode : 'facil';
    this.cards = {};
    const cw = 330, ch = 250, gap = 40, startX = W / 2 - (cw * 3 + gap * 2) / 2;
    MODE_ORDER.forEach((id, i) => {
      const x = startX + i * (cw + gap) + cw / 2, y = 330;
      const root = this.add.container(x, y).setDepth(20);
      const bg = this.add.graphics();
      const m = MODES[id];
      const icon = this.add.graphics();
      for (let k = 0; k < 3; k++) { icon.save(); icon.translateCanvas(-60 + k * 60, -50); icons.star(icon, 24, k < m.stars ? COLORS.yellow : 0xb8c4d8); icon.restore(); }
      const label = this.add.text(0, 50, m.label, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '50px', color: '#1b2a49' }).setOrigin(0.5);
      const mark = this.add.graphics(); // selo "marcado"
      root.add([bg, icon, label, mark]);
      const zone = this.add.zone(x, y, cw, ch).setDepth(21).setInteractive();
      zone.on('pointerdown', () => { unlock(); sfx.tap(); this.choose(id); });
      this.cards[id] = { root, bg, mark, cw, ch };
    });
    this.choose(this.mode, true);

    // Personagem de boas-vindas correndo
    this.kid = buildChild(this).setPosition(110, 640).setDepth(10).setScale(1.5);
    this.phase = 0;

    this.play = roundButton(this, W / 2, 575, 105, {
      color: COLORS.green, depth: 30, iconScale: 0.6,
      icon: (g, sz) => icons.play(g, sz),
      onDown: () => { unlock(); sfx.tap(); this.start(); },
    });
    this.play.pulse(true);

    this.soundBtn = roundButton(this, W - 90, 80, 46, {
      color: COLORS.blue, depth: 30, iconScale: 0.55,
      icon: (g, sz) => icons.sound(g, sz, 0xffffff, load().sound),
      onDown: () => { unlock(); const on = !load().sound; save({ sound: on }); this.soundBtn.setIcon((g, sz) => icons.sound(g, sz, 0xffffff, on)); if (on) sfx.tap(); },
    });
    this.input.keyboard.on('keydown-ENTER', () => this.start());
    this.input.keyboard.on('keydown-SPACE', () => this.start());
  }

  choose(id, silent) {
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
    void silent;
  }

  start() { speak('Vamos lá!'); this.scene.start('Game', { mode: this.mode }); }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.bg.update(120 * dt, dt);
    this.phase += dt * 11;
    poseChild(this.kid, 'run', this.phase);
  }
}
