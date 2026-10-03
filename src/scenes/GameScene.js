import Phaser from 'phaser';
import { W, H, GROUND, PLAYER_X, MODES, COLORS } from '../config.js';
import { load, save } from '../save.js';
import { buildBackground } from '../world.js';
import { roundButton, icons } from '../ui.js';
import { buildChild, poseChild } from '../character.js';
import { sfx, unlock, startMusic, stopMusic, speak, silenceVoice } from '../audio.js';

const OBS = { cone: { w: 46, h: 58 }, log: { w: 100, h: 62 } };
const PLAYER_HALF_W = 17, PLAYER_H = 98, CENTER_H = 55;
const FIRE_STOP_GAP = 300;

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.modeId = (data && data.mode) || load().mode;
    this.cfg = MODES[this.modeId] || MODES.facil;
    this.seed = (data && data.seed) || String(Date.now());
    this.autoRun = !(data && data.manual); // testes podem avançar o jogo manualmente
  }

  create() {
    this.rng = new Phaser.Math.RandomDataGenerator([this.seed]);
    this.bg = buildBackground(this);
    this.input.addPointer(2); // permite dois toques ao mesmo tempo

    // ---- estado ----
    this.t = 0; this.runTime = 0; this.dist = 0; this.stars = 0;
    this.hasHose = false; this.paused = false;
    this.recover = 0; this.assist = 0; this.hitTimes = []; this.cleanTimer = 0;
    this.obstacles = []; this.items = []; this.drops = []; this.fire = null;
    this.groupId = 0; this.sinceSpawn = 0; this.nextGapPx = 700;
    this.queue = ['obstacle', 'stars', 'obstacle', 'hose', 'obstacle', 'stars', 'fire'];
    this.initialObstacle = true;
    this.fireMul = 1; this.fireWait = 0; this.sprayCd = 0; this.lastTap = 0;
    this.tutorialJump = !load().tut.jump; this.tutorialWater = !load().tut.water; this.tutWait = 0;
    this.stats = { hits: 0, jumps: 0, fires: 0, stars: 0 };
    this.p = { x: PLAYER_X, y: GROUND, vy: 0, ground: true, coyote: 0, buffer: 0, invul: 0, phase: 0, state: 'run' };

    // ---- personagem ----
    this.shadow = this.add.ellipse(this.p.x, GROUND + 4, 70, 16, 0x000000, 0.25).setDepth(9);
    this.kid = buildChild(this).setDepth(10);

    // ---- HUD ----
    const hud = this.add.container(0, 0).setDepth(40);
    const starIcon = this.add.graphics(); starIcon.x = 70; starIcon.y = 62; icons.star(starIcon, 30);
    this.starText = this.add.text(112, 62, '0', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '56px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 10 }).setOrigin(0, 0.5);
    this.hoseIcon = this.add.graphics(); this.hoseIcon.x = 270; this.hoseIcon.y = 62; icons.hose(this.hoseIcon, 24); this.hoseIcon.visible = false;
    hud.add([starIcon, this.starText, this.hoseIcon]);

    this.pauseBtn = roundButton(this, W - 80, 70, 46, { color: COLORS.blue, depth: 60, iconScale: 0.5, icon: (g, s) => icons.pause(g, s), onDown: () => this.setPaused(true) });

    // ---- botões grandes (2): ação à esquerda, pular à direita ----
    this.actionBtn = roundButton(this, 205, 590, 105, { color: COLORS.orange, depth: 50, iconScale: 0.5, icon: (g, s) => icons.drop(g, s), onDown: () => this.pressAction() });
    this.jumpBtn = roundButton(this, W - 215, 590, 118, { color: COLORS.green, depth: 50, iconScale: 0.52, icon: (g, s) => icons.jump(g, s), onDown: () => this.pressJump() });
    this.actionBtn.setEnabled(false);

    // dedo do tutorial
    this.hand = this.add.graphics().setDepth(70); icons.hand(this.hand, 70); this.hand.visible = false;
    this.handTween = this.tweens.add({ targets: this.hand, scale: { from: 1, to: 0.8 }, duration: 380, yoyo: true, repeat: -1 });
    // seta de dica sobre o obstáculo
    this.hint = this.add.graphics().setDepth(30); this.hint.fillStyle(COLORS.yellow, 1); this.hint.lineStyle(6, 0x1b2a49, 1);
    this.hint.fillTriangle(-26, -30, 26, -30, 0, 8); this.hint.strokeTriangle(-26, -30, 26, -30, 0, 8); this.hint.visible = false;

    // banner de fase (sobreposição breve)
    const banner = this.add.text(W / 2, 200, 'Fase 1', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '110px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 16 }).setOrigin(0.5).setDepth(80).setAlpha(0);
    this.tweens.add({ targets: banner, alpha: 1, scale: { from: 0.6, to: 1 }, duration: 350, ease: 'Back.out', hold: 1300, yoyo: true, onComplete: () => banner.destroy() });

    // ---- teclado (para testar no computador) ----
    const kb = this.input.keyboard;
    kb.on('keydown-SPACE', () => this.pressJump()); kb.on('keydown-UP', () => this.pressJump());
    kb.on('keydown-DOWN', () => this.pressAction()); kb.on('keydown-X', () => this.pressAction()); kb.on('keydown-Z', () => this.pressAction());
    kb.on('keydown-P', () => this.setPaused(!this.paused)); kb.on('keydown-ESC', () => this.setPaused(!this.paused));

    // pausa automática ao ir para segundo plano
    this.onHidden = () => this.setPaused(true);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.onHidden);
    this.events.once('shutdown', () => { this.game.events.off(Phaser.Core.Events.HIDDEN, this.onHidden); stopMusic(); silenceVoice(); });

    // primeiro obstáculo já à vista: a criança não espera para começar a brincar
    this.groupId++; this.addObstacle('cone', 1020, this.groupId);
    { const apexC = (this.cfg.jumpV ** 2) / (2 * this.cfg.gravity) + CENTER_H; [[-70, 0.7], [0, 1], [70, 0.7]].forEach(([dx, f]) => this.addStar(1020 + OBS.cone.w / 2 + dx, GROUND - apexC * f * 0.92)); }
    this.sinceSpawn = 0; this.nextGapPx = 120;

    startMusic();
    window.__ian = Object.assign(window.__ian || {}, { game: this.game, scene: this });
  }

  // ===================== entrada =====================
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
    if (this.fire && this.fire.engaged && this.hasHose && this.sprayCd <= 0) { this.spray(); return; }
    // sem nada para fazer agora: sacudidinha amigável
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

  // ===================== laço principal =====================
  update(_, delta) {
    if (!this.autoRun) return;
    this.tick(Math.min(delta / 1000, 0.05));
  }

  get airtime() { return (2 * this.cfg.jumpV) / this.cfg.gravity; }
  get baseSpeed() {
    const c = this.cfg;
    return Math.min(c.speedMax, c.speed0 + c.ramp * this.runTime) * (1 - 0.08 * this.assist);
  }

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

    // ---- velocidade do mundo ----
    let mul = 1;
    // tutorial do pulo: congela no ponto ideal até tocar (ou o amigo pula junto após 10 s)
    this.tutorialActive = false;
    if (this.tutorialJump && p.ground) {
      const t = this.nextSolid();
      if (t && t.cx - p.x <= this.baseSpeed * this.airtime * 0.5 + 8 && t.cx > p.x) {
        this.tutorialActive = true; mul = 0; this.tutWait += dt;
        if (this.tutWait > 10) { p.buffer = 0.2; }
      }
    }
    // fogo: desacelera suavemente até parar na posição de interação
    const fire = this.fire && !this.fire.out ? this.fire : null;
    let target = 1;
    if (fire) {
      const gap = fire.x - (p.x + 30);
      if (gap < 560) target = Math.max(0, Math.min(1, (gap - FIRE_STOP_GAP) / 260));
      if (gap <= FIRE_STOP_GAP + 5) { target = 0; if (!fire.engaged) this.engageFire(fire); }
    }
    this.fireMul += (target - this.fireMul) * Math.min(1, dt * 6);
    if (fire && fire.engaged) this.fireMul = 0;
    mul = Math.min(mul, this.fireMul);
    const rec = this.recover > 0 ? c.slow + (1 - c.slow) * (1 - this.recover / 1.0) : 1;
    const speed = this.baseSpeed * mul * rec;
    if (!(fire && fire.engaged) && !this.tutorialActive) this.runTime += dt;
    const dx = speed * dt;
    this.dist += dx; this.sinceSpawn += dx;
    this.bg.update(dx, dt);
    this.worldSpeed = speed;

    // ---- mover coisas ----
    for (const o of this.obstacles) { o.x -= dx; this.placeObstacle(o); }
    for (const it of this.items) { it.x -= dx; it.sprite.x = it.x; }
    this.cleanup();
    this.spawnLogic();

    // ---- física do personagem ----
    if (p.buffer > 0 && (p.ground || p.coyote > 0) && !(fire && fire.engaged)) {
      p.vy = -c.jumpV; p.ground = false; p.coyote = 0; p.buffer = 0; this.stats.jumps++; sfx.jump();
      if (this.tutorialJump) { this.tutorialJump = false; this.tutWait = 0; save({ tut: { ...load().tut, jump: true } }); this.hand.visible = false; }
    }
    if (!p.ground) {
      p.vy += c.gravity * dt; p.y += p.vy * dt;
      if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; p.ground = true; p.coyote = c.coyote; }
    }
    const spraying = this.spraying > 0; if (spraying) this.spraying -= dt;
    p.state = !p.ground ? 'jump' : (fire && fire.engaged) ? (spraying ? 'spray' : 'idle') : 'run';
    if (fire && fire.engaged && this.hasHose) p.state = 'spray';
    p.phase += dt * (6 + speed / 22);
    poseChild(this.kid, p.state, p.phase);
    this.kid.setPosition(p.x, p.y);
    this.kid.alpha = p.invul > 0 ? (Math.floor(this.t * 14) % 2 ? 0.35 : 1) : 1;
    this.kid.parts.hoseBack.visible = this.hasHose;
    this.shadow.setPosition(p.x, GROUND + 4).setScale(1 - Math.min(0.5, (GROUND - p.y) / 500), 1);

    // ---- colisões e coletas ----
    this.collide();
    this.pickups();

    // ---- fogo vivo ----
    if (this.fire) this.animateFire(dt);
    this.updateDrops(dt);
    if (fire && fire.engaged) {
      this.fireWait += dt;
      if (c.autoHelpAfter && this.fireWait > c.autoHelpAfter && this.t - this.lastTap > c.autoHelpAfter) { this.fireWait = 0; this.spray(true); }
    }
    this.updateUI();
  }

  // ===================== geração =====================
  nextSolid() {
    let best = null;
    for (const o of this.obstacles) {
      if (!o.solid || o.hit) continue;
      const cx = o.x + o.w / 2; if (cx <= this.p.x) continue;
      if (!best || cx < best.cx) best = { o, cx };
    }
    return best;
  }

  spawnLogic() {
    if (this.sinceSpawn < this.nextGapPx) return;
    this.sinceSpawn = 0;
    let kind = this.queue.length ? this.queue.shift() : null;
    if (!kind) { this.queue = ['obstacle', 'stars', 'obstacle', 'obstacle', 'stars', 'obstacle', 'fire']; kind = this.queue.shift(); }
    if (kind === 'fire' && (!this.hasHose || this.fire)) {
      if (!this.hasHose) { this.queue.unshift('fire'); kind = 'hose'; } else { kind = 'obstacle'; }
    }
    const x = W + 140;
    let width = 60;
    if (kind === 'obstacle') width = this.spawnObstacleGroup(x);
    else if (kind === 'stars') { for (let i = 0; i < 4; i++) this.addStar(x + i * 90, GROUND - CENTER_H); width = 300; }
    else if (kind === 'hose') { this.addHose(x); width = 120; }
    else if (kind === 'fire') { this.addFire(x); width = 160; }
    const sp = this.baseSpeed;
    const g = this.rng.realInRange(this.cfg.gap[0], this.cfg.gap[1]) * (1 + 0.15 * this.assist);
    const extra = kind === 'fire' ? 0.8 : 0;
    this.nextGapPx = width + (g + extra) * sp;
  }

  spawnObstacleGroup(x) {
    const grp = this.rng.pick(this.cfg.groups);
    const id = ++this.groupId;
    const kinds = () => (this.rng.frac() < 0.5 ? 'cone' : 'log');
    let width;
    if (grp === 'double') { this.addObstacle('cone', x, id); this.addObstacle('cone', x + OBS.cone.w + 8, id); width = OBS.cone.w * 2 + 8; }
    else if (grp === 'conelog') { this.addObstacle('cone', x, id); this.addObstacle('log', x + OBS.cone.w + 22, id); width = OBS.cone.w + 22 + OBS.log.w; }
    else { const k = kinds(); this.addObstacle(k, x, id); width = OBS[k].w; }
    // arco de estrelas acima do grupo, seguindo a trajetória ideal do salto
    const apexC = (this.cfg.jumpV ** 2) / (2 * this.cfg.gravity) + CENTER_H;
    const cx = x + width / 2;
    [[-70, 0.7], [0, 1], [70, 0.7]].forEach(([dx, f]) => this.addStar(cx + dx, GROUND - apexC * f * 0.92));
    return width;
  }

  addObstacle(kind, x, group) {
    const { w, h } = OBS[kind];
    const s = this.add.graphics().setDepth(5);
    if (kind === 'cone') {
      s.fillStyle(0x3b3b4f, 1); s.fillRoundedRect(-27, -8, 54, 10, 4);
      s.fillStyle(COLORS.orange, 1); s.fillTriangle(-21, -8, 21, -8, 0, -h);
      s.fillStyle(0xffffff, 1); s.fillTriangle(-14, -26, 14, -26, 9, -38); s.fillTriangle(-14, -26, 14, -26, -9, -38); s.fillRect(-14, -26, 28, 7);
    } else {
      s.fillStyle(0x8a5a35, 1); s.fillRoundedRect(-w / 2, -h, w, h, 14);
      s.fillStyle(0x6e4527, 1); s.fillRect(-w / 2 + 14, -h + 10, w - 28, 4); s.fillRect(-w / 2 + 10, -h + 28, w - 22, 4); s.fillRect(-w / 2 + 16, -h + 46, w - 34, 4);
      s.fillStyle(0xd9a86a, 1); s.fillCircle(-w / 2 + 12, -h / 2, 24); s.fillCircle(w / 2 - 12, -h / 2, 24);
      s.lineStyle(4, 0x8a5a35, 1); s.strokeCircle(w / 2 - 12, -h / 2, 14); s.strokeCircle(w / 2 - 12, -h / 2, 6);
    }
    const o = { kind, x, w, h, sprite: s, hit: false, solid: true, group };
    this.obstacles.push(o); this.placeObstacle(o);
    return o;
  }
  placeObstacle(o) { o.sprite.setPosition(o.x + o.w / 2, GROUND); }

  addStar(x, y) {
    const sp = this.add.image(x, y, 'star').setDepth(6);
    this.tweens.add({ targets: sp, angle: { from: -12, to: 12 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.items.push({ kind: 'star', x, y, sprite: sp });
  }
  addHose(x) {
    const c = this.add.container(x, GROUND - 90).setDepth(6);
    const glow = this.add.circle(0, 0, 62, 0xfff3b0, 0.6); const g = this.add.graphics(); icons.hose(g, 46);
    c.add([glow, g]);
    this.tweens.add({ targets: c, y: GROUND - 105, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: glow, scale: { from: 0.9, to: 1.25 }, duration: 500, yoyo: true, repeat: -1 });
    this.items.push({ kind: 'hose', x, y: GROUND - 90, sprite: c });
  }

  addFire(x) {
    const w = 90;
    const root = this.add.container(0, GROUND).setDepth(6);
    const bin = this.add.graphics();
    bin.fillStyle(0x000000, 0.2); bin.fillEllipse(0, 2, 90, 14);
    bin.fillStyle(0x4f7d9a, 1); bin.fillRoundedRect(-36, -84, 72, 84, 8);
    bin.fillStyle(0x3d6580, 1); bin.fillRoundedRect(-42, -96, 84, 16, 6);
    bin.fillStyle(0x2d4d63, 1); for (let i = -18; i <= 18; i += 12) bin.fillRect(i - 2, -72, 4, 56);
    const flames = [[-20, 38, 0], [0, 54, 1], [20, 38, 2]].map(([fx, size, i]) => {
      const f = this.add.graphics(); f.x = fx; f.y = -92;
      f.fillStyle(0xff6a1a, 1); f.fillCircle(0, -size * 0.5, size * 0.5); f.fillTriangle(-size * 0.5, -size * 0.55, size * 0.5, -size * 0.55, 0, -size * 1.5);
      f.fillStyle(0xffd23f, 1); f.fillCircle(0, -size * 0.35, size * 0.28); f.fillTriangle(-size * 0.28, -size * 0.4, size * 0.28, -size * 0.4, 0, -size * 0.95);
      f.phase = i * 1.7; return f;
    });
    const pips = this.add.graphics();
    root.add([bin, ...flames, pips]);
    this.fire = { kind: 'fire', x, w, sprite: root, flames, pips, hp: this.cfg.fireHits, max: this.cfg.fireHits, engaged: false, out: false, solid: false, hit: false, shown: 1 };
    this.obstacles.push(this.fire);
    this.placeObstacle(this.fire);
    this.drawPips();
  }

  drawPips() {
    const f = this.fire; if (!f) return;
    f.pips.clear();
    const n = f.max, gap = 34, x0 = -((n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      const done = i < f.max - f.hp;
      f.pips.fillStyle(0x000000, 0.25); f.pips.fillCircle(x0 + i * gap, -176, 15);
      f.pips.fillStyle(done ? 0x4db8ff : 0xffffff, 1); f.pips.fillCircle(x0 + i * gap, -178, 13);
      f.pips.lineStyle(4, 0x1b2a49, 1); f.pips.strokeCircle(x0 + i * gap, -178, 13);
    }
  }

  cleanup() {
    this.obstacles = this.obstacles.filter((o) => {
      if (o.x + o.w < -250) { o.sprite.destroy(); if (o === this.fire) this.fire = null; return false; }
      return true;
    });
    this.items = this.items.filter((it) => {
      if (it.x < -150) {
        if (it.kind === 'hose' && !this.hasHose) this.queue.unshift('hose'); // objetivo perdido reaparece adiante
        this.killSprite(it.sprite); return false;
      }
      return true;
    });
  }

  killSprite(sp) { if (!sp) return; this.tweens.killTweensOf(sp); sp.destroy(); }

  // ===================== colisão / coleta =====================
  collide() {
    const p = this.p;
    if (p.invul > 0) return;
    const pl = p.x - PLAYER_HALF_W, pr = p.x + PLAYER_HALF_W, pt = p.y - PLAYER_H, pb = p.y;
    for (const o of this.obstacles) {
      if (!o.solid || o.hit) continue;
      const ol = o.x + 7, or = o.x + o.w - 7, ot = GROUND - o.h + 8;
      if (pr > ol && pl < or && pb > ot && pt < GROUND) { this.onHit(o); break; }
    }
  }

  onHit(o) {
    const p = this.p;
    o.hit = true; p.invul = 1.4; this.recover = 1.0; this.stats.hits++; sfx.hit();
    this.tweens.add({ targets: o.sprite, x: o.sprite.x + 120, y: GROUND - 140, angle: 200, alpha: 0, duration: 520, ease: 'Quad.out' });
    this.tweens.add({ targets: this.kid, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => this.kid.setAngle(0) });
    for (let i = 0; i < 5; i++) {
      const pf = this.add.image(p.x + 20, p.y - 60, 'puff').setDepth(15).setScale(0.5);
      this.tweens.add({ targets: pf, x: p.x + Phaser.Math.Between(-70, 90), y: p.y - Phaser.Math.Between(40, 130), alpha: 0, scale: 1, duration: 450, onComplete: () => pf.destroy() });
    }
    // erros repetidos => mais ajuda (menos velocidade, mais espaço e dica visual)
    this.hitTimes.push(this.t); this.hitTimes = this.hitTimes.filter((t) => this.t - t < 25); this.cleanTimer = 0;
    if (this.hitTimes.length >= 3 && this.assist < 2) { this.assist++; this.hitTimes = []; }
  }

  pickups() {
    const p = this.p, cx = p.x, cy = p.y - CENTER_H;
    for (const it of this.items) {
      if (it.taken) continue;
      const r = it.kind === 'hose' ? 95 : 58;
      if (Math.hypot(it.x - cx, it.y - cy) < r || (it.kind === 'hose' && Math.abs(it.x - cx) < 70)) {
        it.taken = true;
        if (it.kind === 'star') { this.addStars(1); sfx.star(); this.tweens.add({ targets: it.sprite, y: it.y - 50, alpha: 0, scale: 1.6, duration: 260, onComplete: () => this.killSprite(it.sprite) }); }
        else if (it.kind === 'hose') {
          this.hasHose = true; sfx.hose(); speak('Mangueira!');
          this.tweens.add({ targets: it.sprite, x: 270, y: 62, scale: 0.4, alpha: 0.2, duration: 400, onComplete: () => this.killSprite(it.sprite) });
        }
      }
    }
    this.items = this.items.filter((it) => !it.taken);
  }

  addStars(n) {
    this.stars += n; this.stats.stars += n;
    this.starText.setText(String(this.stars));
    this.tweens.add({ targets: this.starText, scale: { from: 1.35, to: 1 }, duration: 160 });
    if (this.stars > (load().bestStars || 0)) save({ bestStars: this.stars });
  }

  // ===================== fogo e água =====================
  engageFire(f) {
    f.engaged = true; this.fireWait = 0; this.stats.fires++;
    this.actionBtn.setEnabled(true); this.actionBtn.pulse(true);
    if (this.tutorialWater) { speak('Toque na gota de água!'); }
  }

  spray(auto = false) {
    const f = this.fire; if (!f || f.out) return;
    this.sprayCd = 0.32; this.spraying = 0.4; sfx.splash();
    this.lastSprayAuto = auto;
    const p = this.p, fx = f.x + f.w / 2, fy = GROUND - 70;
    for (let i = 0; i < 9; i++) {
      const d = this.add.image(p.x + 58, p.y - 78, 'drop').setDepth(14);
      this.drops.push({ s: d, t: -i * 0.035, dur: 0.38, x0: p.x + 58, y0: p.y - 78, x1: fx + Phaser.Math.Between(-20, 20), y1: fy + Phaser.Math.Between(-30, 20), arc: 60 });
    }
    f.hp = Math.max(0, f.hp - 1);
    this.drawPips();
    if (this.tutorialWater) { this.tutorialWater = false; save({ tut: { ...load().tut, water: true } }); this.hand.visible = false; }
    if (f.hp === 0) this.extinguish(f);
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

  animateFire(dt) {
    const f = this.fire; if (!f || f.out) return;
    const frac = f.hp / f.max;
    f.shown += (frac - f.shown) * Math.min(1, dt * 8);
    f.flames.forEach((fl) => {
      const k = 0.15 + 0.85 * f.shown;
      fl.setScale(k * (1 + 0.1 * Math.sin(this.t * 9 + fl.phase)), k * (1 + 0.16 * Math.sin(this.t * 7 + fl.phase)));
      fl.visible = f.shown > 0.12;
    });
  }

  extinguish(f) {
    f.out = true; f.engaged = false;
    this.actionBtn.pulse(false); this.actionBtn.setEnabled(false);
    this.hand.visible = false;
    sfx.win(); speak('Muito bem!');
    this.addStars(5);
    f.flames.forEach((fl) => this.tweens.add({ targets: fl, scale: 0, duration: 300, onComplete: () => fl.destroy() }));
    f.pips.clear();
    for (let i = 0; i < 8; i++) {
      const pf = this.add.image(f.x + f.w / 2, GROUND - 100, 'puff').setDepth(15).setTint(0xcfd8e3).setScale(0.6);
      this.tweens.add({ targets: pf, x: pf.x + Phaser.Math.Between(-80, 80), y: pf.y - Phaser.Math.Between(60, 160), alpha: 0, scale: 1.8, duration: 800, onComplete: () => pf.destroy() });
    }
    // fogo apagado deixa de ser a "meta atual"; a lixeira segue como cenário
    this.time.delayedCall(500, () => { this.fire = null; });
    this.fireWait = 0;
  }

  // ===================== interface =====================
  updateUI() {
    const c = this.cfg, p = this.p;
    this.hoseIcon.visible = this.hasHose;
    // botão de ação: mostra de antemão o que fará
    const fire = this.fire && !this.fire.out ? this.fire : null;
    if (this.hasHose && !(fire && fire.engaged)) {
      this.actionBtn.setEnabled(true);
      this.actionBtn.pulse(!!(fire && fire.x - p.x < 900));
    } else if (!this.hasHose) { this.actionBtn.setEnabled(false); this.actionBtn.pulse(false); }

    // dica visual de pulo (sempre no fácil; nos outros modos só quando o jogo está ajudando)
    const hintDist = c.hintDist || (this.assist > 0 ? 520 : 0);
    const t = hintDist ? this.nextSolid() : null;
    let showHint = false;
    if (t && p.ground) {
      const gapL = t.o.x - (p.x + PLAYER_HALF_W);
      if (gapL < hintDist && gapL > 0) { showHint = true; this.hint.setPosition(t.cx, GROUND - t.o.h - 36 + Math.sin(this.t * 10) * 7); }
    }
    this.hint.visible = showHint;
    this.jumpBtn.pulse(showHint || this.tutorialActive);

    // dedo do tutorial
    const needHand = this.tutorialActive || (this.fire && this.fire.engaged && this.tutorialWater);
    if (needHand) {
      const b = this.tutorialActive ? this.jumpBtn : this.actionBtn;
      this.hand.setPosition(b.root.x + 10, b.root.y - b.r - 50).setAngle(180).visible = true;
      this.hand.setPosition(b.root.x, b.root.y - b.r - 20);
    } else this.hand.visible = false;
    if (this.tutorialActive && !this._saidJump) { this._saidJump = true; speak('Toque na seta para pular!'); }
  }

  // estado resumido para testes
  snapshot() {
    return { mode: this.modeId, t: this.t, dist: this.dist, stars: this.stars, hasHose: this.hasHose, assist: this.assist, speed: this.worldSpeed, y: this.p.y, onGround: this.p.ground, paused: this.paused, fire: this.fire ? { hp: this.fire.hp, engaged: this.fire.engaged, out: this.fire.out } : null, stats: { ...this.stats }, obstacles: this.obstacles.length };
  }
}
