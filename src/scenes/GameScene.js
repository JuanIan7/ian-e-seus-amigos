import Phaser from 'phaser';
import { W, H, GROUND, PLAYER_X, MODES, COLORS, PHASES, POWERS, POWER_KEYS, STARS_PER_POWER } from '../config.js';
import { load, save } from '../save.js';
import { buildBackground, buildHole, buildPlatform, buildPad } from '../world.js';
import { roundButton, icons } from '../ui.js';
import { buildChild, poseChild } from '../character.js';
import { buildDog, poseDog, buildPtero, buildFireTruck, DOGS } from '../creatures.js';
import { MISSIONS } from '../missions.js';
import { sfx, unlock, startMusic, stopMusic, speak, silenceVoice } from '../audio.js';

const OBS = { cone: { w: 46, h: 58 }, log: { w: 100, h: 62 } };
const PLAYER_HALF_W = 17, PLAYER_H = 98, CENTER_H = 55;
const STOP_GAP = 300;            // distância (px) em que a corrida para para uma missão
const LEAF_TOP = 140;            // altura das plataformas baixas (alcançáveis em todos os modos)
const HIGH_TOP = 300;            // altura da plataforma alta (precisa do trampolim)
const PRAISE = ['Muito bem!', 'Parabéns!', 'Você é demais!', 'Isso mesmo!'];
const POWER_ICON = { shield: 'shield', magnet: 'magnet', jump: 'spring', speed: 'bolt', fly: 'wing', jet: 'jetDrop' };
const PICKUP = {
  hose:   { icon: 'hose', say: 'Mangueira!', color: 0xfff3b0 },
  bone:   { icon: 'bone', say: 'Osso!', color: 0xfff3b0 },
  glider: { icon: 'wing', say: 'Asas de planar! Segure o botão de pular no ar.', color: 0xd6c0ff },
  egg:    { icon: 'egg', say: 'Um ovo! Leve até o ninho.', color: 0xfff3b0 },
  truck:  { icon: 'truck', say: 'Caminhão de bombeiros!', color: 0xffc9c9 },
  flight: { icon: 'wing', say: 'Hora de voar!', color: 0xd6c0ff },
};
const PROJ_TEX = { drop: 'drop', bone: 'bone', heart: 'heart', box: 'box', egg: 'egg', basket: 'box' };

function drawObstacle(g, kind, theme, w, h) {
  const O = 0x1b2a49;
  g.lineStyle(4, O, 1);
  const wild = theme === 'floresta' || theme === 'pre';
  if (kind === 'cone' && !wild) {
    g.fillStyle(0x3b3b4f, 1); g.fillRoundedRect(-27, -8, 54, 10, 4); g.strokeRoundedRect(-27, -8, 54, 10, 4);
    g.fillStyle(COLORS.orange, 1); g.fillTriangle(-21, -8, 21, -8, 0, -h); g.strokeTriangle(-21, -8, 21, -8, 0, -h);
    g.fillStyle(0xffffff, 1); g.fillTriangle(-14, -26, 14, -26, 9, -38); g.fillTriangle(-14, -26, 14, -26, -9, -38); g.fillRect(-14, -26, 28, 7);
  } else if (kind === 'cone') { // pedra
    g.fillStyle(0x8f96a3, 1); g.fillEllipse(0, -26, 62, 56); g.strokeEllipse(0, -26, 62, 56);
    g.fillStyle(0xb5bcc8, 1); g.fillEllipse(-8, -36, 28, 18); g.fillStyle(0x6f7683, 1); g.fillEllipse(14, -12, 24, 14);
  } else if (!wild) { // barreira listrada
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(-w / 2, -h + 6, w, 26, 8); g.strokeRoundedRect(-w / 2, -h + 6, w, 26, 8);
    g.fillStyle(0xe53935, 1); for (let x = -w / 2 + 6; x < w / 2 - 14; x += 28) g.fillTriangle(x, -h + 32, x + 14, -h + 32, x + 24, -h + 6);
    g.fillStyle(0x6c757d, 1); g.fillRect(-w / 2 + 8, -h + 30, 10, h - 30); g.fillRect(w / 2 - 18, -h + 30, 10, h - 30);
  } else { // tronco
    g.fillStyle(0x8a5a35, 1); g.fillRoundedRect(-w / 2, -h, w, h, 14); g.strokeRoundedRect(-w / 2, -h, w, h, 14);
    g.fillStyle(0x6e4527, 1); g.fillRect(-w / 2 + 14, -h + 10, w - 28, 4); g.fillRect(-w / 2 + 10, -h + 28, w - 22, 4); g.fillRect(-w / 2 + 16, -h + 46, w - 34, 4);
    g.fillStyle(0xd9a86a, 1); g.fillCircle(-w / 2 + 12, -h / 2, 24); g.fillCircle(w / 2 - 12, -h / 2, 24);
    g.lineStyle(4, 0x8a5a35, 1); g.strokeCircle(w / 2 - 12, -h / 2, 14); g.strokeCircle(w / 2 - 12, -h / 2, 6);
  }
}

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.modeId = (data && data.mode) || load().mode;
    this.cfg = MODES[this.modeId] || MODES.facil;
    this.startPhase = Math.max(1, Math.min(5, (data && data.phase) || load().phase || 1));
    this.seed = (data && data.seed) || String(Date.now());
    this.autoRun = !(data && data.manual); // testes podem avançar o jogo manualmente
  }

  // ================================================================ criação
  create() {
    this.rng = new Phaser.Math.RandomDataGenerator([this.seed]);
    this.input.addPointer(2);
    this.phaseNum = this.startPhase;
    const ph = this.phase;
    this.bg = buildBackground(this, ph.theme); this.bgOld = null;

    // ---- estado ----
    this.t = 0; this.runTime = 0; this.dist = 0; this.stars = 0; this.nextPowerAt = STARS_PER_POWER;
    this.eq = { hose: this.phaseNum >= 2, bone: this.phaseNum >= 5, glider: this.phaseNum >= 4, egg: false };
    this.powers = {}; this.powerHud = {};
    this.paused = false; this.jumpHeld = false;
    this.recover = 0; this.assist = 0; this.hitTimes = []; this.cleanTimer = 0;
    this.ents = []; this.drops = []; this.mission = null; this.ride = null; this.sprayCd = 0; this.lastTap = 0;
    this.sinceSpawn = 0; this.nextGapPx = 700; this.groupId = 0; this.missionMul = 1; this.fall = null;
    this.queue = ph.script.slice();
    this.tutorialJump = !load().tut.jump; this.tutorialWater = !load().tut.water; this.tutWait = 0;
    this.stats = { hits: 0, falls: 0, jumps: 0, missions: 0, stars: 0, phases: 0, powers: 0, glides: 0 };
    this.worldSpeed = 0; this.dustT = 0; this.squash = { x: 1, y: 1 };
    this.p = { x: PLAYER_X, y: GROUND, vy: 0, ground: true, onPlat: null, coyote: 0, buffer: 0, invul: 0, phase: 0, state: 'run', flying: false, gliding: false };

    // ---- personagem ----
    this.shadow = this.add.ellipse(this.p.x, GROUND + 4, 70, 16, 0x000000, 0.25).setDepth(9);
    this.kid = buildChild(this).setDepth(10);
    this.wings = this.add.graphics().setDepth(11); this.wings.visible = false;
    this.wings.fillStyle(0xb18cff, 1); this.wings.lineStyle(4, 0x1b2a49, 1);
    this.wings.fillTriangle(-80, 0, 40, -18, 80, 8); this.wings.strokeTriangle(-80, 0, 40, -18, 80, 8);
    this.wings.fillStyle(0xffd23f, 1); this.wings.fillTriangle(-30, -6, 40, -18, 10, 2);
    this.bubble = this.add.graphics().setDepth(12); this.bubble.visible = false;
    this.bubble.fillStyle(0x4db8ff, 0.25); this.bubble.fillCircle(0, 0, 76); this.bubble.lineStyle(6, 0xffffff, 0.8); this.bubble.strokeCircle(0, 0, 76);
    this.eggCarry = this.add.image(0, 0, 'egg').setDepth(12).setVisible(false);
    this.truck = null; this.dog = null; this.dogKey = null;
    this.speedLines = this.add.container(0, 0).setDepth(35).setVisible(false);
    for (let i = 0; i < 9; i++) { const l = this.add.rectangle(Math.random() * W, 60 + Math.random() * 560, 140 + Math.random() * 120, 4, 0xffffff, 0.45); this.speedLines.add(l); }
    this.setDog(ph.dog, true);

    this.buildHud();

    // ---- teclado (para testar no computador) ----
    const kb = this.input.keyboard;
    kb.on('keydown-SPACE', () => { this.jumpHeld = true; this.pressJump(); }); kb.on('keyup-SPACE', () => { this.jumpHeld = false; });
    kb.on('keydown-UP', () => { this.jumpHeld = true; this.pressJump(); }); kb.on('keyup-UP', () => { this.jumpHeld = false; });
    kb.on('keydown-DOWN', () => this.pressAction()); kb.on('keydown-X', () => this.pressAction()); kb.on('keydown-Z', () => this.pressAction());
    kb.on('keydown-P', () => this.setPaused(!this.paused)); kb.on('keydown-ESC', () => this.setPaused(!this.paused));

    // pausa automática ao ir para segundo plano
    this.onHidden = () => this.setPaused(true);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.onHidden);
    this.events.once('shutdown', () => { this.game.events.off(Phaser.Core.Events.HIDDEN, this.onHidden); stopMusic(); silenceVoice(); });

    this.showBanner();
    // primeiro obstáculo já à vista: a criança não espera para começar a brincar
    this.addObstacle('cone', 1020);
    { const apexC = (this.cfg.jumpV ** 2) / (2 * this.cfg.gravity) + CENTER_H; [[-70, 0.7], [0, 1], [70, 0.7]].forEach(([dx, f]) => this.addStar(1020 + OBS.cone.w / 2 + dx, GROUND - apexC * f * 0.92)); }
    this.sinceSpawn = 0; this.nextGapPx = 120;

    startMusic();
    window.__ian = Object.assign(window.__ian || {}, { game: this.game, scene: this });
  }

  get phase() { return PHASES[(this.phaseNum - 1) % PHASES.length]; }
  get loop() { return Math.floor((this.phaseNum - 1) / PHASES.length); }

  buildHud() {
    const hud = this.add.container(0, 0).setDepth(40);
    const starIcon = this.add.graphics(); starIcon.x = 70; starIcon.y = 62; icons.star(starIcon, 30);
    this.starText = this.add.text(112, 62, '0', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '56px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 10 }).setOrigin(0, 0.5);
    // barra até o próximo poder
    this.powerBar = this.add.graphics(); this.powerBarIcon = this.add.graphics(); this.powerBarIcon.x = 250; this.powerBarIcon.y = 128; icons.bolt(this.powerBarIcon, 15);
    hud.add([starIcon, this.starText, this.powerBar, this.powerBarIcon]);
    this.eqGfx = {};
    ['hose', 'bone', 'glider', 'egg'].forEach((k) => { const g = this.add.graphics(); g.visible = false; icons[PICKUP[k].icon](g, 20); hud.add(g); this.eqGfx[k] = g; });
    this.phaseDots = this.add.graphics().setDepth(40);
    this.loopText = this.add.text(W / 2 + 130, 40, '', { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 6 }).setOrigin(0, 0.5).setDepth(40);
    this.drawPhaseDots();

    this.pauseBtn = roundButton(this, W - 80, 70, 46, { color: COLORS.blue, depth: 60, iconScale: 0.5, icon: (g, s) => icons.pause(g, s), onDown: () => this.setPaused(true) });
    this.actionBtn = roundButton(this, 205, 590, 105, { color: COLORS.orange, depth: 50, iconScale: 0.5, icon: (g, s) => icons.drop(g, s), onDown: () => this.pressAction() });
    this.actionIcon = 'drop';
    this.jumpBtn = roundButton(this, W - 215, 590, 118, { color: COLORS.green, depth: 50, iconScale: 0.52, icon: (g, s) => icons.jump(g, s), onDown: () => { this.jumpHeld = true; this.pressJump(); }, onUp: () => { this.jumpHeld = false; } });
    this.actionBtn.setEnabled(false);

    this.hand = this.add.graphics().setDepth(70); icons.hand(this.hand, 70); this.hand.visible = false;
    this.tweens.add({ targets: this.hand, scale: { from: 1, to: 0.8 }, duration: 380, yoyo: true, repeat: -1 });
    this.hint = this.add.graphics().setDepth(30); this.hint.fillStyle(COLORS.yellow, 1); this.hint.lineStyle(6, 0x1b2a49, 1);
    this.hint.fillTriangle(-26, -30, 26, -30, 0, 8); this.hint.strokeTriangle(-26, -30, 26, -30, 0, 8); this.hint.visible = false;
  }

  drawPhaseDots() {
    const g = this.phaseDots; g.clear();
    const cur = (this.phaseNum - 1) % PHASES.length;
    for (let i = 0; i < PHASES.length; i++) {
      const x = W / 2 - 100 + i * 50, y = 40;
      g.fillStyle(0x000000, 0.25); g.fillCircle(x, y + 3, 17);
      g.fillStyle(i < cur ? COLORS.green : i === cur ? COLORS.yellow : 0xffffff, i > cur ? 0.55 : 1); g.fillCircle(x, y, i === cur ? 17 : 13);
      g.lineStyle(4, COLORS.dark, 1); g.strokeCircle(x, y, i === cur ? 17 : 13);
    }
    this.loopText.setText(this.loop > 0 ? '×' + (this.loop + 1) : '');
  }

  showBanner() {
    const ph = this.phase;
    const t1 = this.add.text(W / 2, 190, 'Fase ' + this.phaseNum, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '110px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 16 }).setOrigin(0.5).setDepth(80).setAlpha(0);
    const t2 = this.add.text(W / 2, 285, ph.name, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '46px', color: '#ffd23f', stroke: '#1b2a49', strokeThickness: 10 }).setOrigin(0.5).setDepth(80).setAlpha(0);
    this.tweens.add({ targets: t1, alpha: 1, scale: { from: 0.6, to: 1 }, duration: 350, ease: 'Back.out', hold: 1500, yoyo: true, onComplete: () => t1.destroy() });
    this.tweens.add({ targets: t2, alpha: 1, duration: 350, delay: 120, hold: 1400, yoyo: true, onComplete: () => t2.destroy() });
    // brilho de transição
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.5).setDepth(79);
    this.tweens.add({ targets: flash, alpha: 0, duration: 700, onComplete: () => flash.destroy() });
  }

  // ================================================================ entrada
  pressJump() {
    unlock();
    if (this.paused) return;
    this.p.buffer = this.cfg.buffer + 0.08 * this.assist;
    this.lastTap = this.t;
  }
  pressAction() {
    unlock();
    if (this.paused) return;
    this.lastTap = this.t;
    const m = this.mission;
    if (m && m.engaged && !m.done && this.sprayCd <= 0) { this.actHit(m, false); return; }
    this.tweens.add({ targets: this.actionBtn.root, angle: { from: -6, to: 6 }, duration: 60, yoyo: true, repeat: 1, onComplete: () => this.actionBtn.root.setAngle(0) });
  }

  setPaused(v) {
    if (v === this.paused) return;
    this.paused = v;
    if (v) {
      stopMusic(); silenceVoice();
      const o = this.pauseUI = this.add.container(0, 0).setDepth(200);
      o.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive());
      const resume = roundButton(this, W / 2, H / 2, 100, { color: COLORS.green, depth: 210, iconScale: 0.55, icon: (g, s) => icons.play(g, s), onDown: () => this.setPaused(false) });
      const home = roundButton(this, W / 2 - 260, H / 2 + 10, 72, { color: COLORS.blue, depth: 210, iconScale: 0.55, icon: (g, s) => icons.home(g, s), onDown: () => this.scene.start('Menu') });
      const snd = roundButton(this, W / 2 + 260, H / 2 + 10, 72, { color: COLORS.blue, depth: 210, iconScale: 0.55, icon: (g, s) => icons.sound(g, s, 0xffffff, load().sound), onDown: () => { const on = !load().sound; save({ sound: on }); snd.setIcon((g, s) => icons.sound(g, s, 0xffffff, on)); } });
      this.pauseParts = [resume, home, snd];
    } else {
      this.pauseParts && this.pauseParts.forEach((b) => b.destroy());
      this.pauseUI && this.pauseUI.destroy();
      this.pauseParts = null; this.pauseUI = null;
      startMusic();
    }
  }

  // ================================================================ laço principal
  update(_, delta) {
    if (!this.autoRun) return;
    this.tick(Math.min(delta / 1000, 0.05));
  }

  get airtime() { return (2 * this.jumpV) / this.cfg.gravity; }
  get jumpV() { return this.cfg.jumpV * (this.powers.jump ? 1.3 : 1); }
  get baseSpeed() { const c = this.cfg; return Math.min(c.speedMax, c.speed0 + c.ramp * this.runTime) * (1 - 0.08 * this.assist); }
  jumpDist(speed = this.baseSpeed) { return speed * (2 * this.cfg.jumpV) / this.cfg.gravity; }

  supportedGround(x) { return !this.ents.some((e) => e.type === 'hole' && x > e.x + 12 && x < e.x + e.w - 12); }
  holeNear(x0, x1) { return this.ents.some((e) => e.type === 'hole' && e.x + e.w > x0 && e.x < x1); }

  tick(dt) {
    if (this.paused) return;
    const c = this.cfg, p = this.p;
    this.t += dt;
    if (p.invul > 0) p.invul -= dt;
    if (this.recover > 0) this.recover -= dt;
    if (this.sprayCd > 0) this.sprayCd -= dt;
    if (p.buffer > 0) p.buffer -= dt;
    if (p.coyote > 0) p.coyote -= dt;
    this.cleanTimer += dt;
    if (this.assist > 0 && this.cleanTimer > 40) { this.assist--; this.cleanTimer = 0; }
    this.updatePowers(dt);
    if (this.ride) { this.ride.t -= dt; }

    // ---- missão ativa (mais próxima ainda não concluída) ----
    const m = this.ents.find((e) => e.type === 'mission' && !e.done) || null;
    this.mission = m;

    // ---- velocidade do mundo ----
    let mul = 1;
    this.tutorialActive = false;
    if (this.fall) { mul = 0; }
    else if (this.tutorialJump && p.ground && !p.flying) {
      const h = this.nextHazard();
      if (h && h.cx > p.x && h.edge - (p.x + PLAYER_HALF_W) <= this.jumpDist() * h.lead) {
        this.tutorialActive = true; mul = 0; this.tutWait += dt;
        if (this.tutWait > 10) p.buffer = 0.2;
      }
    }
    let target = 1;
    if (m) {
      const gap = m.x + m.w / 2 - (p.x + 30);
      if (gap < 560) target = Math.max(0, Math.min(1, (gap - STOP_GAP) / 260));
      if (gap <= STOP_GAP + 5) { target = 0; if (!m.engaged) this.engageMission(m); }
    }
    this.missionMul += (target - this.missionMul) * Math.min(1, dt * 6);
    if (m && m.engaged) this.missionMul = 0;
    mul = Math.min(mul, this.missionMul);
    const rec = this.recover > 0 ? c.slow + (1 - c.slow) * (1 - this.recover / 1.0) : 1;
    const boost = (this.powers.speed ? 1.45 : 1) * (this.ride ? 1.5 : 1);
    const speed = this.baseSpeed * boost * mul * rec;
    const stopped = (m && m.engaged) || this.tutorialActive || this.fall;
    if (!stopped) this.runTime += dt;
    const dx = speed * dt;
    this.dist += dx; this.sinceSpawn += dx;
    this.bg.update(dx, dt); if (this.bgOld) this.bgOld.update(dx, dt);
    this.worldSpeed = speed;

    // ---- mover o mundo ----
    for (const e of this.ents) { e.x -= dx; this.place(e, dt); }
    this.cleanup();
    this.spawnLogic();

    // ---- física ----
    this.physics(dt, dx, m);

    // ---- colisões e coletas ----
    if (!this.fall) { this.collide(); this.padsAndPickups(dt); }
    this.updateMission(dt, m);
    this.updateDrops(dt);
    this.updateCompanions(dt, speed);
    this.updateFx(dt, speed);
    this.updateUI(m);
  }

  // ================================================================ física do personagem
  physics(dt, dx, m) {
    const c = this.cfg, p = this.p;
    const engaged = m && m.engaged;
    p.gliding = false;
    // transição de voo
    if (p.flying && !(this.powers.fly) ) {
      // fim do voo: só termina quando há chão firme à frente
      if (!this.holeNear(p.x - 60, p.x + 330)) { p.flying = false; p.ground = false; p.vy = 0; p.coyote = 0; }
    }
    if (p.flying && engaged) { this.removePower('fly'); p.flying = false; p.vy = 0; }

    // pulo (buffer + coyote), com pulo assistido na beira de buracos
    if (!p.flying && !this.ride && !engaged) {
      let want = p.buffer > 0;
      if (!want && p.ground) {
        const h = this.ents.find((e) => e.type === 'hole' && e.x + e.w > p.x && e.x - (p.x + PLAYER_HALF_W) < this.jumpDist() * 0.12 && e.x - (p.x + PLAYER_HALF_W) > -4);
        if (h && (c.id === 'facil' || this.assist > 0) && !this.tutorialActive) want = true;
      }
      if (want && (p.ground || p.coyote > 0)) {
        p.vy = -this.jumpV; p.ground = false; p.onPlat = null; p.coyote = 0; p.buffer = 0; this.stats.jumps++; sfx.jump();
        this.squash.x = 0.82; this.squash.y = 1.2;
        this.puff(p.x, p.y, 3);
        if (this.tutorialJump) { this.tutorialJump = false; this.tutWait = 0; save({ tut: { ...load().tut, jump: true } }); this.hand.visible = false; }
      }
    }

    const prevY = p.y;
    if (p.flying) {
      const tgt = this.jumpHeld ? GROUND - 330 : GROUND - 170;
      p.y += (tgt - p.y) * Math.min(1, dt * 4); p.vy = 0; p.ground = false; p.onPlat = null;
    } else if (this.ride) {
      p.y = GROUND; p.vy = 0; p.ground = true; p.onPlat = null;
    } else if (this.fall) {
      this.fall.t += dt; p.y += 380 * dt; p.vy = 0;
      if (this.fall.t > 0.55) this.finishFall();
    } else {
      // plataforma / chão: perder o apoio
      if (p.ground) {
        const onP = p.onPlat && this.ents.includes(p.onPlat) && p.x > p.onPlat.x - 6 && p.x < p.onPlat.x + p.onPlat.w + 6;
        const onG = !p.onPlat && p.y >= GROUND - 0.5 && this.supportedGround(p.x);
        if (!onP && !onG) { p.ground = false; p.onPlat = null; p.vy = 0; p.coyote = c.coyote; }
      }
      if (!p.ground) {
        // planar: segurar o botão de pular (no fácil, planar é automático sobre buracos)
        const canGlide = this.eq.glider && p.vy > 0;
        const autoGlide = c.id === 'facil' && this.holeNear(p.x - 20, p.x + 380);
        if (canGlide && (this.jumpHeld || autoGlide)) { p.gliding = true; if (p.vy > 130) p.vy -= (p.vy - 130) * Math.min(1, dt * 12); }
        else p.vy += c.gravity * dt;
        p.y += p.vy * dt;
        // salto de resgate: em modo assistido, quem cai no buraco ganha um impulso extra (uma vez por pulo)
        if (!p.gliding && p.vy > 0 && !p.rescued && (c.id === 'facil' || this.assist > 0) && p.y > GROUND - 90 && !this.supportedGround(p.x) && !p.onPlat) {
          p.vy = -this.jumpV * 0.85; p.rescued = true; sfx.jump(); this.sparkle(p.x, p.y - 30, 6); this.squash.x = 0.85; this.squash.y = 1.15;
        }
        if (p.gliding && !this._glideCounted) { this._glideCounted = true; this.stats.glides++; }
        if (!p.gliding) this._glideCounted = false;
        if (p.vy >= 0) {
          let landed = false;
          for (const e of this.ents) {
            if (e.type !== 'plat') continue;
            if (p.x > e.x - 6 && p.x < e.x + e.w + 6 && prevY <= e.top + 2 && p.y >= e.top) { p.y = e.top; p.onPlat = e; landed = true; break; }
          }
          if (!landed && ((prevY <= GROUND && p.y >= GROUND) || (p.y > GROUND && p.y < GROUND + 55)) && this.supportedGround(p.x)) { p.y = GROUND; p.onPlat = null; landed = true; }
          if (landed) {
            p.vy = 0; p.ground = true; p.rescued = false; p.coyote = c.coyote; this.squash.x = 1.18; this.squash.y = 0.84; this.puff(p.x, p.y, 4);
          } else if (p.y > GROUND + 130) {
            this.startFall();
          }
        }
      }
    }
    // estado visual
    const spraying = this.spraying > 0; if (spraying) this.spraying -= dt;
    p.state = p.flying ? 'fly' : p.gliding ? 'glide' : !p.ground ? 'jump' : (engaged ? (spraying ? 'spray' : 'idle') : 'run');
    if (this.ride) p.state = 'idle';
    if (engaged && !p.flying && p.ground) p.state = this.mission && this.mission.def.icon === 'drop' ? 'spray' : (spraying ? 'throw' : 'idle');
    p.phase += dt * (6 + this.worldSpeed / 22);
    poseChild(this.kid, p.state, p.phase, this.t);
    this.kid.parts.hoseBack.visible = this.eq.hose;
    const ky = this.ride ? p.y - 96 : p.y;
    this.kid.setPosition(p.x + (this.ride ? 18 : 0), ky);
    // squash & stretch (volta suavemente ao normal)
    this.squash.x += (1 - this.squash.x) * Math.min(1, dt * 10); this.squash.y += (1 - this.squash.y) * Math.min(1, dt * 10);
    this.kid.setScale(0.9 * this.squash.x, 0.9 * this.squash.y);
    const fadeFall = this.fall ? Math.max(0, 1 - this.fall.t / 0.55) : 1;
    this.kid.alpha = (p.invul > 0 ? (Math.floor(this.t * 14) % 2 ? 0.35 : 1) : 1) * fadeFall;
    const alt = Math.max(0, GROUND - p.y);
    this.shadow.setPosition(p.x, (p.onPlat ? p.onPlat.top : GROUND) + 4).setScale(1 - Math.min(0.5, alt / 500), 1).setAlpha(this.fall ? 0 : 0.25);
    this.wings.visible = (p.gliding || p.flying) && !this.fall;
    this.wings.setPosition(p.x - 4, p.y - 150 + Math.sin(this.t * 10) * (p.flying ? 5 : 2));
    this.bubble.visible = !!this.powers.shield;
    this.bubble.setPosition(p.x, ky - 54).setScale(1 + Math.sin(this.t * 6) * 0.03);
    this.eggCarry.visible = this.eq.egg;
    this.eggCarry.setPosition(p.x + 34, ky - 128 + Math.sin(this.t * 8) * 3);
    // caminhão
    if (this.ride) {
      if (!this.truck) { this.truck = buildFireTruck(this).setDepth(9); this.truck.setScale(0.95); }
      this.truck.setPosition(p.x + 8, GROUND);
      this.truck.light.setAlpha(Math.floor(this.t * 6) % 2 ? 1 : 0.4);
      this.truck.y = GROUND + Math.sin(this.t * 22) * 1.6;
      if (this.ride.t <= 0 || engaged) this.endRide();
    }
  }

  startFall() {
    this.fall = { t: 0 }; this.stats.falls++; sfx.hit(); this.cameras.main.shake(160, 0.004); this.puff(this.p.x, GROUND, 8);
    this.hitTimes.push(this.t); this.hitTimes = this.hitTimes.filter((t) => this.t - t < 25); this.cleanTimer = 0;
    if (this.hitTimes.length >= 3 && this.assist < 2) { this.assist++; this.hitTimes = []; }
  }
  finishFall() {
    // recuperação amigável: o mundo volta um pouco, o personagem reaparece em chão firme antes do buraco
    const p = this.p;
    const holes = this.ents.filter((e) => e.type === 'hole').sort((a, b) => Math.abs(a.x + a.w / 2 - p.x) - Math.abs(b.x + b.w / 2 - p.x));
    const h = holes[0];
    const delta = h ? Math.max(0, (PLAYER_X + 260) - h.x) : 0;
    if (delta > 0) {
      for (const e of this.ents) { e.x += delta; this.place(e, 0); }
      this.bg.update(-delta, 0); if (this.bgOld) this.bgOld.update(-delta, 0);
      this.sinceSpawn -= delta; this.dist -= delta;
    }
    p.y = GROUND; p.vy = 0; p.ground = true; p.onPlat = null; p.invul = 2.2; p.flying = false;
    this.recover = 1.0; this.fall = null; this.squash.x = 1.2; this.squash.y = 0.8;
    this.tweens.add({ targets: this.kid, scale: { from: 0.5, to: 0.9 }, duration: 250, ease: 'Back.out' });
  }

  // ================================================================ geração
  nextHazard() {
    // próximo obstáculo sólido ou buraco à frente
    let best = null;
    for (const e of this.ents) {
      if (e.type === 'obs' && !e.hit) {
        const cx = e.x + e.w / 2; if (cx <= this.p.x) continue;
        if (!best || cx < best.cx) best = { cx, edge: e.x, top: GROUND - e.h, lead: 0.5, e };
      } else if (e.type === 'hole') {
        const cx = e.x + e.w / 2; if (e.x + e.w <= this.p.x) continue;
        if (!best || cx < best.cx) best = { cx, edge: e.x, top: GROUND - 90, lead: 0.2, e };
      }
    }
    return best;
  }

  spawnLogic() {
    if (this.sinceSpawn < this.nextGapPx) return;
    // fim da fase: roteiro acabou e todas as missões foram concluídas
    if (!this.queue.length) {
      if (this.ents.some((e) => e.type === 'mission' && !e.done)) { this.sinceSpawn = this.nextGapPx - 40; return; }
      this.advancePhase(); return;
    }
    this.sinceSpawn = 0;
    const tok = this.queue.shift();
    const x = W + 140;
    const r = this.spawnToken(tok, x);
    const sp = this.baseSpeed;
    const g = this.rng.realInRange(this.cfg.gap[0], this.cfg.gap[1]) * (1 + 0.15 * this.assist) * Math.max(0.8, 1 - 0.05 * this.loop);
    this.nextGapPx = r.width + (g + (r.extra || 0)) * sp * (r.short ? 0.35 : 1);
  }

  spawnToken(tok, x) {
    const [kind, arg] = tok.split(':');
    const cfg = this.cfg, sp = this.baseSpeed, theme = this.phase.theme;
    const apexC = (cfg.jumpV ** 2) / (2 * cfg.gravity) + CENTER_H;
    switch (kind) {
      case 'stars': { for (let i = 0; i < 4; i++) this.addStar(x + i * 90, GROUND - CENTER_H); return { width: 300 }; }
      case 'obs': return { width: this.spawnObstacleGroup(x) };
      case 'gap': {
        const w = Math.max(120, this.jumpDist(sp) * 0.5);
        this.addHole(x, w, theme);
        [[0.2, 0.6], [0.5, 1], [0.8, 0.6]].forEach(([k, f]) => this.addStar(x + w * k, GROUND - apexC * f * 0.92));
        return { width: w + 80, extra: 0.4 };
      }
      case 'glidegap': {
        if (!this.eq.glider && !this.powers.fly) return this.spawnToken('gap', x);
        const w = this.jumpDist(sp) * 1.7;
        this.addHole(x, w, theme);
        for (let i = 0; i < 5; i++) this.addStar(x + w * (0.12 + i * 0.19), GROUND - 230 + i * 18);
        return { width: w + 80, extra: 0.6 };
      }
      case 'leaf': {
        const w = 280;
        this.addPlat(x, w, GROUND - LEAF_TOP, theme);
        for (let i = 0; i < 3; i++) this.addStar(x + 60 + i * 80, GROUND - LEAF_TOP - 56);
        return { width: w + 40 };
      }
      case 'pad': {
        this.addPad(x);
        this.addPlat(x + 170, 380, GROUND - HIGH_TOP, theme);
        for (let i = 0; i < 4; i++) this.addStar(x + 230 + i * 80, GROUND - HIGH_TOP - 56);
        return { width: 600, extra: 0.4 };
      }
      case 'flystars': {
        for (let i = 0; i < 7; i++) this.addStar(x + i * 105, GROUND - 250 + Math.sin(i * 1.1) * 80);
        return { width: 740, short: true };
      }
      case 'ptero': {
        const pt = buildPtero(this).setDepth(8); pt.setScale(0.9);
        const e = { type: 'ptero', x: x + 400, w: 140, y: 150, sprite: pt, t: 0 }; this.ents.push(e);
        for (let i = 0; i < 6; i++) this.addStar(x + 120 + i * 90, GROUND - 190 - Math.sin(i * 0.52) * 60);
        speak('Um pterossauro! Ele é um réptil voador, não é dinossauro.');
        return { width: 700 };
      }
      case 'pickup': this.addPickup(arg, x); return { width: 140 };
      case 'mission': { const m = this.addMission(arg, x); return { width: m.w + 60, extra: 0.9 }; }
      default: return { width: 100 };
    }
  }

  spawnObstacleGroup(x) {
    const grp = this.rng.pick(this.cfg.groups);
    const kinds = () => (this.rng.frac() < 0.5 ? 'cone' : 'log');
    let width;
    if (grp === 'double') { this.addObstacle('cone', x); this.addObstacle('cone', x + OBS.cone.w + 8); width = OBS.cone.w * 2 + 8; }
    else if (grp === 'conelog') { this.addObstacle('cone', x); this.addObstacle('log', x + OBS.cone.w + 22); width = OBS.cone.w + 22 + OBS.log.w; }
    else { const k = kinds(); this.addObstacle(k, x); width = OBS[k].w; }
    const apexC = (this.cfg.jumpV ** 2) / (2 * this.cfg.gravity) + CENTER_H;
    const cx = x + width / 2;
    [[-70, 0.7], [0, 1], [70, 0.7]].forEach(([dx, f]) => this.addStar(cx + dx, GROUND - apexC * f * 0.92));
    return width;
  }

  addObstacle(kind, x) {
    const { w, h } = OBS[kind];
    const s = this.add.graphics().setDepth(5);
    drawObstacle(s, kind, this.phase.theme, w, h);
    const o = { type: 'obs', kind, x, w, h, sprite: s, hit: false };
    this.ents.push(o); this.place(o, 0);
    return o;
  }
  addHole(x, w, theme) { const s = buildHole(this, theme, w).setDepth(4); const e = { type: 'hole', x, w, sprite: s }; this.ents.push(e); this.place(e, 0); return e; }
  addPlat(x, w, top, theme) { const s = buildPlatform(this, theme, w).setDepth(5); const e = { type: 'plat', x, w, top, sprite: s }; this.ents.push(e); this.place(e, 0); return e; }
  addPad(x) { const s = buildPad(this).setDepth(5); const e = { type: 'pad', x, w: 100, sprite: s, cool: 0 }; this.ents.push(e); this.place(e, 0); return e; }
  addStar(x, y) {
    const sp = this.add.image(x, y, 'star').setDepth(6);
    this.tweens.add({ targets: sp, angle: { from: -12, to: 12 }, scale: { from: 1, to: 1.12 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.ents.push({ type: 'star', x, w: 0, y, sprite: sp });
  }
  addPickup(kind, x) {
    const d = PICKUP[kind];
    const c = this.add.container(x, GROUND - 100).setDepth(6);
    const glow = this.add.circle(0, 0, 62, d.color, 0.7); const g = this.add.graphics(); icons[d.icon](g, 46);
    c.add([glow, g]);
    this.tweens.add({ targets: c, y: GROUND - 118, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: glow, scale: { from: 0.9, to: 1.25 }, duration: 500, yoyo: true, repeat: -1 });
    this.ents.push({ type: 'pickup', kind, x, w: 0, y: GROUND - 100, sprite: c });
  }
  addMission(key, x) {
    const def = MISSIONS[key];
    const b = def.build(this);
    const m = Object.assign({ type: 'mission', key, def, x, offX: 0, done: false, engaged: false, sprite: b.root, shown: 1, hasHit: 0 }, b);
    m.max = m.hp = Math.max(1, def.hits({ fireHits: this.cfg.fireHits + Math.min(this.loop, 2) }));
    m.pips = this.add.graphics(); m.root.add(m.pips);
    this.ents.push(m); this.drawPips(m); this.place(m, 0);
    return m;
  }

  place(e, dt) {
    switch (e.type) {
      case 'obs': if (e.sprite && !e.hit) e.sprite.setPosition(e.x + e.w / 2, GROUND); break;
      case 'hole': e.sprite.setPosition(e.x, GROUND); break;
      case 'plat': e.sprite.setPosition(e.x, e.top); break;
      case 'pad': e.sprite.setPosition(e.x + e.w / 2, GROUND); break;
      case 'star': e.sprite.setPosition(e.x, e.y); break;
      case 'pickup': e.sprite.x = e.x; break;
      case 'mission': e.root.x = e.x + e.w / 2 + e.offX; break;
      case 'ptero': { e.t += dt; e.x -= 120 * dt; e.sprite.setPosition(e.x, e.y + Math.sin(e.t * 2) * 24); e.sprite.wing.scaleY = 0.7 + Math.abs(Math.sin(e.t * 7)) * 0.5; break; }
      default: break;
    }
  }

  destroyEnt(e) {
    const kill = (o) => { if (!o) return; this.tweens.killTweensOf(o); if (o.list) o.list.forEach(kill); };
    kill(e.sprite); if (e.type === 'mission') this.tweens.killTweensOf(e);
    if (e.sprite && e.sprite.destroy) e.sprite.destroy();
  }

  cleanup() {
    this.ents = this.ents.filter((e) => {
      if (e.taken) return false;
      if (e.x + (e.w || 0) < -320) {
        // objetivos perdidos reaparecem adiante
        if (e.type === 'pickup') this.queue.unshift('pickup:' + e.kind);
        if (e.type === 'mission' && !e.done) this.queue.unshift('mission:' + e.key);
        this.destroyEnt(e); return false;
      }
      return true;
    });
  }

  // ================================================================ fases
  advancePhase() {
    this.phaseNum++; this.stats.phases++;
    const ph = this.phase;
    this.queue = ph.script.slice();
    this.sinceSpawn = 0; this.nextGapPx = 560;
    this.setTheme(ph.theme);
    this.setDog(ph.dog);
    this.drawPhaseDots(); this.showBanner();
    sfx.win(); speak('Fase ' + this.phaseNum + '! ' + ph.name);
    // equipamentos das fases anteriores ficam disponíveis
    if (this.phaseNum >= 2) this.eq.hose = true;
  }

  setTheme(theme) {
    if (this.bg.theme === theme) return;
    if (this.bgOld) { this.bgOld.destroy(); this.bgOld = null; }
    const old = this.bg;
    this.bg = buildBackground(this, theme, -300);
    this.bgOld = old;
    const o = { a: 1 };
    this.tweens.add({ targets: o, a: 0, duration: 2200, ease: 'Sine.inOut', onUpdate: () => old.setAlpha(o.a), onComplete: () => { old.destroy(); if (this.bgOld === old) this.bgOld = null; } });
  }

  setDog(key, instant = false) {
    if (key === this.dogKey) return;
    if (this.dog) { const d = this.dog; this.tweens.add({ targets: d, alpha: 0, duration: 400, onComplete: () => d.destroy() }); this.dog = null; }
    this.dogKey = key;
    if (!key) return;
    this.dog = buildDog(this, key, 1.0).setDepth(9);
    this.dog.x = instant ? this.p.x - 170 : -160; this.dog.y = GROUND;
    this.dogT = 0;
    if (!instant) this.time.delayedCall(900, () => speak(DOGS[key].name + ' vai ajudar! ' + DOGS[key].say));
  }

  // ================================================================ colisão / coleta
  collide() {
    const p = this.p;
    if (p.invul > 0 || p.flying || this.ride || this.powers.speed) return;
    const pl = p.x - PLAYER_HALF_W, pr = p.x + PLAYER_HALF_W, pt = p.y - PLAYER_H, pb = p.y;
    for (const o of this.ents) {
      if (o.type !== 'obs' || o.hit) continue;
      const ol = o.x + 7, or = o.x + o.w - 7, ot = GROUND - o.h + 8;
      if (pr > ol && pl < or && pb > ot && pt < GROUND) { this.onHit(o); break; }
    }
  }

  onHit(o) {
    const p = this.p;
    o.hit = true;
    const spr = o.sprite;
    this.tweens.add({ targets: spr, x: spr.x + 120, y: GROUND - 140, angle: 200, alpha: 0, duration: 520, ease: 'Quad.out', onComplete: () => { spr.destroy(); } });
    if (this.powers.shield) { this.removePower('shield'); sfx.star(); this.puff(p.x, p.y - 60, 10, 0x4db8ff); p.invul = 0.6; return; }
    p.invul = 1.4; this.recover = 1.0; this.stats.hits++; sfx.hit(); this.cameras.main.shake(140, 0.004);
    this.tweens.add({ targets: this.kid, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => this.kid.setAngle(0) });
    this.puff(p.x + 20, p.y - 60, 5);
    this.hitTimes.push(this.t); this.hitTimes = this.hitTimes.filter((t) => this.t - t < 25); this.cleanTimer = 0;
    if (this.hitTimes.length >= 3 && this.assist < 2) { this.assist++; this.hitTimes = []; }
  }

  padsAndPickups(dt) {
    const p = this.p, cx = p.x, cy = p.y - CENTER_H;
    const wide = p.flying || this.ride;
    const magnet = !!this.powers.magnet;
    for (const e of this.ents) {
      if (e.taken) continue;
      if (e.type === 'pad') {
        if (e.cool > 0) e.cool -= dt;
        if (!wide && e.cool <= 0 && Math.abs(p.x - (e.x + e.w / 2)) < 46 && p.y >= GROUND - 70 && p.vy >= -50 && !p.onPlat) {
          e.cool = 0.6; p.vy = -this.cfg.jumpV * 1.45; p.ground = false; p.onPlat = null; p.coyote = 0; sfx.jump(); this.squash.x = 0.8; this.squash.y = 1.25;
          this.tweens.add({ targets: e.sprite, scaleY: 0.6, duration: 100, yoyo: true });
          this.puff(p.x, GROUND, 6, 0x4db8ff);
        }
      } else if (e.type === 'star') {
        if (magnet && Math.hypot(e.x - cx, e.y - cy) < 460) { e.x += (cx - e.x) * Math.min(1, dt * 6); e.y += (cy - e.y) * Math.min(1, dt * 6); }
        const r = wide ? 125 : 58;
        if (Math.hypot(e.x - cx, e.y - (this.ride ? cy - 90 : cy)) < r) {
          e.taken = true; this.addStars(1); sfx.star(); this.sparkle(e.x, e.y);
          const sp = e.sprite; this.tweens.killTweensOf(sp);
          this.tweens.add({ targets: sp, y: e.y - 50, alpha: 0, scale: 1.6, duration: 260, onComplete: () => sp.destroy() });
        }
      } else if (e.type === 'pickup') {
        if (Math.hypot(e.x - cx, e.y - cy) < 95 || Math.abs(e.x - cx) < 70) { e.taken = true; this.takePickup(e); }
      }
    }
  }

  takePickup(e) {
    const d = PICKUP[e.kind];
    sfx.hose(); speak(d.say);
    if (e.kind === 'hose') this.eq.hose = true;
    else if (e.kind === 'bone') this.eq.bone = true;
    else if (e.kind === 'glider') this.eq.glider = true;
    else if (e.kind === 'egg') this.eq.egg = true;
    else if (e.kind === 'truck') this.startRide();
    else if (e.kind === 'flight') this.grantPower('fly', 12);
    const sp = e.sprite; this.tweens.killTweensOf(sp);
    this.tweens.add({ targets: sp, x: 280, y: 130, scale: 0.4, alpha: 0.2, duration: 400, onComplete: () => sp.destroy() });
    this.sparkle(e.x, e.y, 8);
  }

  addStars(n) {
    this.stars += n; this.stats.stars += n;
    this.starText.setText(String(this.stars));
    this.tweens.add({ targets: this.starText, scale: { from: 1.35, to: 1 }, duration: 160 });
    if (this.stars > (load().bestStars || 0)) save({ bestStars: this.stars });
    while (this.stars >= this.nextPowerAt) { this.nextPowerAt += STARS_PER_POWER; this.grantPower(this.pickPower()); }
  }

  // ================================================================ poderes
  pickPower() {
    // sorteia entre os poderes; evita repetir o que já está ativo e o jato de água quando nada apaga
    const busy = (this.mission && this.mission.engaged) || this.ride;
    let pool = POWER_KEYS.filter((k) => !this.powers[k] && !(busy && k === 'fly'));
    if (!pool.length) pool = POWER_KEYS.slice();
    return this.rng.pick(pool);
  }

  grantPower(key, dur) {
    const def = POWERS[key];
    const d = dur || def.dur;
    this.powers[key] = { t: d, max: d };
    this.stats.powers++;
    if (key === 'fly') { this.p.flying = true; this.p.ground = false; this.p.onPlat = null; this.p.vy = 0; }
    sfx.win(); speak(def.say);
    // aviso grande no centro (não pausa o jogo)
    const c = this.add.container(W / 2, 300).setDepth(85);
    const bg = this.add.circle(0, 0, 110, def.color, 1).setStrokeStyle(10, 0xffffff);
    const g = this.add.graphics(); icons[POWER_ICON[key]](g, 70);
    const tx = this.add.text(0, 150, def.name + '!', { fontFamily: 'Arial Black, Arial', fontSize: '56px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 10 }).setOrigin(0.5);
    c.add([bg, g, tx]);
    this.tweens.add({ targets: c, scale: { from: 0.2, to: 1 }, alpha: { from: 0, to: 1 }, duration: 380, ease: 'Back.out', hold: 1100, yoyo: true, onComplete: () => c.destroy() });
    this.sparkle(this.p.x, this.p.y - 60, 12);
    this.buildPowerHud(key);
  }

  buildPowerHud(key) {
    if (this.powerHud[key]) return;
    const def = POWERS[key];
    const c = this.add.container(0, 70).setDepth(41);
    const bg = this.add.circle(0, 0, 34, def.color, 1).setStrokeStyle(5, 0xffffff);
    const g = this.add.graphics(); icons[POWER_ICON[key]](g, 20);
    const ring = this.add.graphics();
    c.add([bg, g, ring]); this.powerHud[key] = { c, ring };
    this.layoutPowerHud();
  }
  layoutPowerHud() { Object.keys(this.powerHud).forEach((k, i) => { this.powerHud[k].c.x = W - 200 - i * 84; }); }
  removePower(key) {
    delete this.powers[key];
    const h = this.powerHud[key]; if (h) { h.c.destroy(); delete this.powerHud[key]; this.layoutPowerHud(); }
  }
  updatePowers(dt) {
    for (const k of Object.keys(this.powers)) {
      const pw = this.powers[k];
      pw.t -= dt;
      const h = this.powerHud[k];
      if (h) { h.ring.clear(); h.ring.lineStyle(7, 0xffffff, 1); h.ring.beginPath(); h.ring.arc(0, 0, 41, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, pw.t / pw.max), false); h.ring.strokePath(); if (pw.t < 3) h.c.setAlpha(Math.floor(this.t * 6) % 2 ? 1 : 0.4); else h.c.setAlpha(1); }
      if (pw.t <= 0) {
        if (k === 'fly' && this.p.flying && this.holeNear(this.p.x - 60, this.p.x + 330)) { pw.t = 0.0; continue; } // só termina sobre chão firme
        this.removePower(k);
      }
    }
  }

  // ================================================================ veículo
  startRide() { this.ride = { t: 7 }; this.p.vy = 0; this.p.ground = true; this.p.y = GROUND; this.p.onPlat = null; }
  endRide() {
    this.ride = null;
    if (this.truck) { const t = this.truck; this.truck = null; this.tweens.add({ targets: t, x: -300, duration: 900, onComplete: () => t.destroy() }); }
    this.squash.x = 0.85; this.squash.y = 1.2;
  }

  // ================================================================ missões
  engageMission(m) {
    m.engaged = true; this.waitIdle = 0; this.dogHitT = 0;
    const def = m.def;
    if (def.needs && !this.eq[def.needs]) this.eq[def.needs] = true; // a viatura sempre empresta o que falta
    if (m.key === 'nest') this.eq.egg = true;
    if (this.ride) this.endRide();
    this.setActionIcon(def.icon);
    this.actionBtn.setEnabled(true); this.actionBtn.pulse(true);
    speak(def.cue);
    if (this.dog && !this.dogBarked) { this.dogBarked = true; }
  }

  setActionIcon(name) {
    if (this.actionIcon === name) return;
    this.actionIcon = name;
    this.actionBtn.setIcon((g, s) => icons[name](g, s));
  }

  actHit(m, byDog) {
    const def = m.def;
    this.sprayCd = 0.32; this.spraying = 0.4; sfx.splash();
    const p = this.p;
    const tx = m.root.x + m.aim.x, ty = GROUND - m.aim.y;
    const n = def.proj === 'drop' ? 9 : 1;
    const tex = PROJ_TEX[def.proj] || 'drop';
    const sx = byDog && this.dog ? this.dog.x + 60 : p.x + 58, sy = byDog && this.dog ? GROUND - 70 : p.y - 78;
    for (let i = 0; i < n; i++) {
      const d = this.add.image(sx, sy, tex).setDepth(14);
      if (def.proj !== 'drop') d.setScale(1.3);
      this.drops.push({ s: d, t: -i * 0.035, dur: 0.4, x0: sx, y0: sy, x1: tx + Phaser.Math.Between(-20, 20) * (n > 1 ? 1 : 0), y1: ty + Phaser.Math.Between(-20, 20) * (n > 1 ? 1 : 0), arc: 70 });
    }
    const pow = this.powers.jet && !byDog ? 2 : 1;
    const before = m.hp;
    m.hp = Math.max(0, m.hp - pow);
    this.drawPips(m);
    if (def.onHit) def.onHit(this, m, m.max - m.hp, m.max);
    if (this.tutorialWater && !byDog) { this.tutorialWater = false; save({ tut: { ...load().tut, water: true } }); this.hand.visible = false; }
    if (!byDog && def.dogAssist && this.dog) { this.dogHitT = 0.9; }
    if (before > 0 && m.hp === 0) this.finishMission(m);
  }

  updateDrops(dt) {
    for (const d of this.drops) {
      d.t += dt; const k = Math.max(0, d.t / d.dur);
      d.s.visible = d.t >= 0;
      d.s.x = d.x0 + (d.x1 - d.x0) * k; d.s.y = d.y0 + (d.y1 - d.y0) * k - Math.sin(Math.PI * Math.min(1, k)) * d.arc;
      if (k >= 1) { d.s.destroy(); d.done = true; }
    }
    this.drops = this.drops.filter((d) => !d.done);
  }

  drawPips(m) {
    const g = m.pips; g.clear();
    const n = m.max, gap = 34, x0 = -((n - 1) * gap) / 2, y = -(m.h + 40);
    for (let i = 0; i < n; i++) {
      const done = i < m.max - m.hp;
      g.fillStyle(0x000000, 0.25); g.fillCircle(x0 + i * gap, y + 2, 15);
      g.fillStyle(done ? 0x4db8ff : 0xffffff, 1); g.fillCircle(x0 + i * gap, y, 13);
      g.lineStyle(4, 0x1b2a49, 1); g.strokeCircle(x0 + i * gap, y, 13);
    }
  }

  updateMission(dt, m) {
    if (!m || m.done) return;
    if (m.flames) {
      const frac = m.hp / m.max;
      m.shown += (frac - m.shown) * Math.min(1, dt * 8);
      m.flames.forEach((fl) => {
        const k = 0.15 + 0.85 * m.shown;
        fl.setScale(k * (1 + 0.1 * Math.sin(this.t * 9 + fl.phase)), k * (1 + 0.16 * Math.sin(this.t * 7 + fl.phase)));
        fl.visible = m.shown > 0.12;
      });
    }
    if (m.parts && m.parts.heli) { m.parts.heli.rotor.scaleX = 0.6 + Math.abs(Math.sin(this.t * 25)) * 0.4; m.parts.heli.y = -430 + Math.sin(this.t * 3) * 8; }
    if (m.engaged) {
      this.waitIdle = (this.waitIdle || 0) + dt;
      if (this.dogHitT > 0) { this.dogHitT -= dt; if (this.dogHitT <= 0 && m.hp > 0) this.actHit(m, true); }
      const c = this.cfg;
      if (c.autoHelpAfter && this.waitIdle > c.autoHelpAfter && this.t - this.lastTap > c.autoHelpAfter) { this.waitIdle = 0; this.actHit(m, true); }
    }
  }

  finishMission(m) {
    m.done = true; m.engaged = false; this.stats.missions++;
    this.actionBtn.pulse(false);
    this.hand.visible = false;
    sfx.win(); speak(this.rng.pick(PRAISE));
    this.addStars(5);
    if (m.def.kind === 'fire' && m.flames) m.flames.forEach((fl) => this.tweens.add({ targets: fl, scale: 0, duration: 300, onComplete: () => fl.destroy() }));
    if (m.key === 'nest') this.eq.egg = false;
    m.pips.clear();
    m.def.finish && m.def.finish(this, m);
    this.waitIdle = 0;
  }

  // ================================================================ companheiros e efeitos
  updateCompanions(dt, speed) {
    if (!this.dog) return;
    const p = this.p, d = this.dog;
    const engaged = this.mission && this.mission.engaged;
    const tx = p.x - (engaged ? 120 : 170) + Math.sin(this.t * 1.7) * 12;
    d.x += (tx - d.x) * Math.min(1, dt * 3);
    this.dogT = (this.dogT || 0) + dt;
    const air = !p.ground && !p.flying;
    d.y = GROUND - (air ? Math.max(0, (GROUND - p.y) * 0.35) : 0) - Math.abs(Math.sin(this.dogT * 9)) * (speed > 5 ? 4 : 0);
    poseDog(d, speed < 5 ? 'idle' : air ? 'jump' : 'run', this.dogT * 11, this.t);
    d.alpha = Math.min(d.alpha + dt * 2, 1);
  }

  updateFx(dt, speed) {
    const p = this.p;
    // poeira ao correr
    if (p.ground && speed > 40 && !this.ride) { this.dustT -= dt; if (this.dustT <= 0) { this.dustT = 0.13; this.puff(p.x - 14, (p.onPlat ? p.onPlat.top : GROUND), 1, 0xe9e3d4, 0.4); } }
    // linhas de velocidade (turbo, caminhão, voo)
    const fast = !!this.powers.speed || !!this.ride || p.flying;
    this.speedLines.visible = fast;
    if (fast) this.speedLines.list.forEach((l) => { l.x -= (900 + speed) * dt; if (l.x < -200) { l.x = W + 100; l.y = 60 + Math.random() * 560; } });
    // fogo da viatura
    if (this.truck) this.truck.setDepth(9);
  }

  puff(x, y, n = 4, tint = 0xffffff, sc = 0.5) {
    for (let i = 0; i < n; i++) {
      const pf = this.add.image(x, y - 6, 'puff').setDepth(15).setScale(sc).setTint(tint).setAlpha(0.8);
      this.tweens.add({ targets: pf, x: x + Phaser.Math.Between(-60, 40), y: y - Phaser.Math.Between(10, 60), alpha: 0, scale: sc * 2, duration: 450, onComplete: () => pf.destroy() });
    }
  }
  sparkle(x, y, n = 5) {
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x, y, 'spark').setDepth(16).setScale(0.6);
      const a = (i / n) * Math.PI * 2;
      this.tweens.add({ targets: s, x: x + Math.cos(a) * 60, y: y + Math.sin(a) * 60, alpha: 0, scale: 0.2, duration: 420, onComplete: () => s.destroy() });
    }
  }

  // ================================================================ interface
  updateUI(m) {
    const c = this.cfg, p = this.p;
    // barra de poder
    const frac = (this.stars - (this.nextPowerAt - STARS_PER_POWER)) / STARS_PER_POWER;
    this.powerBar.clear(); this.powerBar.fillStyle(0x000000, 0.3); this.powerBar.fillRoundedRect(72, 114, 160, 28, 14);
    this.powerBar.fillStyle(COLORS.yellow, 1); this.powerBar.fillRoundedRect(76, 118, Math.max(10, 152 * Math.min(1, frac)), 20, 10);
    // equipamentos
    let i = 0; const keys = ['hose', 'bone', 'glider', 'egg'];
    keys.forEach((k) => { const g = this.eqGfx[k]; g.visible = !!this.eq[k]; if (g.visible) { g.setPosition(86 + i * 52, 176); i++; } });
    // botão de ação: mostra de antemão o que fará
    if (m && !m.done && !m.engaged && m.x - p.x < 900) {
      this.setActionIcon(m.def.icon); this.actionBtn.setEnabled(true); this.actionBtn.pulse(true);
    } else if (!(m && m.engaged)) {
      this.actionBtn.pulse(false); this.actionBtn.setEnabled(false);
    }
    // dica visual de pulo (sempre no fácil; nos outros modos só quando o jogo está ajudando)
    const hintDist = c.hintDist || (this.assist > 0 ? 520 : 0);
    const h = hintDist && !p.flying && !this.ride ? this.nextHazard() : null;
    let showHint = false;
    if (h && p.ground) {
      const gapL = h.edge - (p.x + PLAYER_HALF_W);
      if (gapL < hintDist && gapL > 0) { showHint = true; this.hint.setPosition(h.cx, h.top - 36 + Math.sin(this.t * 10) * 7); }
    }
    this.hint.visible = showHint;
    this.jumpBtn.pulse(showHint || this.tutorialActive);
    // dedo do tutorial
    const needHand = this.tutorialActive || (m && m.engaged && this.tutorialWater);
    if (needHand) {
      const b = this.tutorialActive ? this.jumpBtn : this.actionBtn;
      this.hand.setPosition(b.root.x, b.root.y - b.r - 20).setAngle(180).visible = true;
    } else this.hand.visible = false;
    if (this.tutorialActive && !this._saidJump) { this._saidJump = true; speak('Toque na seta para pular!'); }
  }

  // estado resumido para testes
  snapshot() {
    const m = this.mission;
    return {
      mode: this.modeId, phase: this.phaseNum, theme: this.bg.theme, t: this.t, dist: this.dist, stars: this.stars,
      eq: { ...this.eq }, powers: Object.keys(this.powers), assist: this.assist, speed: this.worldSpeed, y: this.p.y,
      onGround: this.p.ground, flying: this.p.flying, gliding: this.p.gliding, ride: !!this.ride, falling: !!this.fall, paused: this.paused,
      mission: m ? { key: m.key, hp: m.hp, engaged: m.engaged, done: m.done } : null, queue: this.queue.length,
      stats: { ...this.stats }, ents: this.ents.length,
    };
  }
}
