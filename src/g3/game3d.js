// Motor do jogo 3D: corrida em 3 faixas com câmera atrás, saltos (duplo e planar), missões de resgate e fases.
// A lógica é determinística: tick(dt) avança a simulação; render() só desenha (os testes usam os dois separados).
import { THREE, rng, Particles, blobShadow, mixHex } from './kit.js';
import { buildKid, poseKid } from './kid.js';
import { World, LANE_W, THEMES3 } from './world.js';
import { buildObstacle, OBSTACLES, buildStar, buildFlame, buildBin, buildHouse, buildTower, buildPickup } from './props.js';
import { MODES3 } from './config3.js';
import { PHASES, POWERS, STARS_PER_POWER } from '../config.js';
import { load, save } from '../save.js';
import { sfx, unlock, startMusic, stopMusic, speak, silenceVoice } from '../audio.js';
import { createHud } from './hud.js';

const STOP = 3.2;                       // distância (em z) em que o mundo para diante de uma missão
const PLAYER_R = 0.3;
const POWER_EMOJI = { shield: '🛡️', magnet: '🧲', jump: '🦘', speed: '⚡', jet: '💦', fly: '🪽' };
const POWER_POOL = ['shield', 'magnet', 'jump', 'speed', 'jet'];     // 'fly' entra junto com os trechos de voo
const FIRE_TARGETS = { fire_bin: 'bin', fire_house: 'house', fire_building: 'tower' };

export class Game3D {
  constructor(o) {
    this.root = o.root; this.onExit = o.onExit || (() => {}); this.manual = !!o.manual;
    this.modeId = o.mode || 'facil'; this.cfg = MODES3[this.modeId];
    const c = this.cfg; this.g = 8 * c.apex / (c.airT * c.airT); this.jumpV0 = this.g * c.airT / 2;
    this.rng = rng(o.seed || 'ian-' + Math.floor(Math.random() * 1e9));
    this.phaseNum = o.phase || 1;
    this.look = o.look || load().look;

    // ---- desenho ----
    this.el = document.createElement('div'); this.el.className = 'g3'; this.root.appendChild(this.el);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.maxRatio = Math.min(window.devicePixelRatio || 1, 2); this.ratio = this.maxRatio;
    this.renderer.setPixelRatio(this.ratio); this.el.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    const th = THEMES3[this.phase.theme];
    this.scene.fog = new THREE.Fog(th.fog, 38, 112);
    this.hemi = new THREE.HemisphereLight(th.hemi[0], th.hemi[1], th.hemi[2]); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(th.sun[0], th.sun[1]); this.sun.position.set(-6, 14, 8); this.scene.add(this.sun);
    this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 400);
    this.camPos = new THREE.Vector3(0, 3.7, 6.4); this.camLook = new THREE.Vector3(0, 1.2, -9);
    this.world = new World(this.scene, this.phase.theme, 'w' + (o.seed || 'x'));
    this.fx = new Particles(this.scene, 320);

    // ---- criança ----
    this.kid = buildKid(this.look); this.kid.scale.setScalar(1.2); this.scene.add(this.kid);
    this.shadow = blobShadow(0.9, 0.9); this.scene.add(this.shadow);
    this.bubble = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 12), new THREE.MeshBasicMaterial({ color: 0x4db8ff, transparent: true, opacity: 0.28, depthWrite: false })); this.bubble.visible = false; this.scene.add(this.bubble);
    this.hint = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 4), new THREE.MeshBasicMaterial({ color: 0xffd23f })); this.hint.rotation.x = Math.PI; this.hint.visible = false; this.scene.add(this.hint);
    this.tpl = {};

    // ---- estado ----
    this.paused = false; this.t = 0; this.dist = 0; this.runTime = 0; this.worldSpeed = 0;
    this.stars = 0; this.nextPowerAt = STARS_PER_POWER; this.powers = {}; this.assist = 0; this.hitTimes = []; this.cleanTimer = 0;
    this.p = { x: 0, y: 0, vy: 0, lane: 0, ground: true, coyote: 0, buffer: 0, invul: 0, dbl: false, dblReq: false, floating: false, floatT: 0, jumpT: -9, lastSteer: -9, rescued: false, hitT: 0, squash: 0, roll: 0, cheer: 0 };
    this.runHeld = false; this.jumpHeld = false; this.turbo = 1; this.recover = 0; this.fall = null; this.missionMul = 1;
    this.eq = { hose: this.phaseNum >= 2 };
    this.stats = { hits: 0, falls: 0, jumps: 0, doubles: 0, missions: 0, stars: 0, phases: 0, powers: 0, floats: 0 };
    this.ents = []; this.mission = null; this.tutorialJump = !load().tut.jump && this.phaseNum === 1; this.tutorialActive = false; this.tutWait = 0;
    this.lastTap = 0; this.sprayT = 0; this.sprayCd = 0; this.idleT = 0; this.shake = 0;
    this.queue = this.scriptFor(this.phaseNum); this.nextS = 26; this.firstObstacle = true;

    // ---- interface ----
    this.hud = createHud(this.el, {
      lane: (d) => this.steer(d), jump: (v) => this.setJump(v), run: (v) => this.setRun(v), action: () => this.pressAction(), pause: () => this.setPaused(true),
    });
    this.hud.showRun(this.cfg.showRun); this.hud.setDots((this.phaseNum - 1) % PHASES.length, PHASES.length, this.loop);
    this.hud.setStars(0);
    this.bindKeys();
    this.resize(); this.onResize = () => this.resize(); window.addEventListener('resize', this.onResize);
    this.onHidden = () => { if (document.hidden) this.setPaused(true); }; document.addEventListener('visibilitychange', this.onHidden);
    this.hud.banner('Fase ' + this.phaseNum, this.phase.name);
    startMusic();
    window.__ian3 = this;
    this.last = performance.now(); this.frames = 0; this.acc = 0;
    if (!this.manual) { this.loopFn = (now) => { this.raf = requestAnimationFrame(this.loopFn); this.frame(now); }; this.raf = requestAnimationFrame(this.loopFn); }
    else { this.pose(0); this.updateCamera(1, true); this.render(); }
  }

  get phase() { return PHASES[(this.phaseNum - 1) % PHASES.length]; }
  get loop() { return Math.floor((this.phaseNum - 1) / PHASES.length); }
  get baseSpeed() { const c = this.cfg; return Math.min(c.speedMax, c.speed0 + c.ramp * this.runTime) * (1 - 0.06 * this.assist); }
  get jumpV() { return this.jumpV0 * (this.powers.jump ? 1.25 : 1); }
  jumpDist(speed = this.baseSpeed) { return speed * this.cfg.airT; }

  // ================================================================ entrada
  bindKeys() {
    const k = (e, down) => {
      if (e.repeat) return;
      const c = e.code;
      if (c === 'ArrowUp' || c === 'Space' || c === 'KeyW') { e.preventDefault(); this.setJump(down); }
      else if (c === 'ShiftLeft' || c === 'ShiftRight' || c === 'KeyR') this.setRun(down);
      else if (down && (c === 'ArrowLeft' || c === 'KeyA')) this.steer(-1);
      else if (down && (c === 'ArrowRight' || c === 'KeyD')) this.steer(1);
      else if (down && (c === 'ArrowDown' || c === 'KeyX' || c === 'KeyZ')) this.pressAction();
      else if (down && (c === 'KeyP' || c === 'Escape')) this.setPaused(!this.paused);
    };
    this.kd = (e) => k(e, true); this.ku = (e) => k(e, false);
    window.addEventListener('keydown', this.kd); window.addEventListener('keyup', this.ku);
  }
  setJump(v) { unlock(); if (v === this.jumpHeld) return; this.jumpHeld = v; if (v) this.pressJump(); }
  setRun(v) { this.runHeld = v; this.hud.setRunActive(v); }
  steer(d) { unlock(); if (this.paused || this.fall) return; const p = this.p; const nl = Math.max(-1, Math.min(1, p.lane + d)); if (nl !== p.lane) { p.lane = nl; sfx.tap && sfx.tap(); } p.lastSteer = this.t; }
  pressJump() {
    unlock(); if (this.paused) return;
    const p = this.p, m = this.mission;
    p.buffer = this.cfg.buffer + 0.08 * this.assist; this.lastTap = this.t;
    // pulo duplo: segundo toque no ar (perto do chão vale como pulo antecipado para a aterrissagem)
    if (!p.ground && p.coyote <= 0 && !this.fall && !p.dbl && !this.focus && this.t - p.jumpT > 0.08 && !(p.vy < 0 && p.y < 0.35)) p.dblReq = true;
  }
  pressAction() {
    unlock(); if (this.paused) return;
    this.lastTap = this.t;
    const m = this.focus;
    if (m && !m.done && this.sprayCd <= 0) this.spray(m);
  }
  setPaused(v) {
    if (v === this.paused) return; this.paused = v;
    if (v) {
      stopMusic(); silenceVoice();
      this.hud.pauseUI(true, {
        resume: () => this.setPaused(false), home: () => this.exit(),
        sound: () => { const on = !load().sound; save({ sound: on }); return on; },
      }, load().sound);
    } else { this.hud.pauseUI(false); startMusic(); this.last = performance.now(); }
  }
  exit() { this.destroy(); this.onExit(); }

  // ================================================================ roteiro das fases
  scriptFor(num) {
    // Nesta etapa só os tokens da fase 1 existem em 3D; os demais viram estrelas (ou buraco) até serem portados.
    const ph = PHASES[(num - 1) % PHASES.length];
    return ph.script.map((tok) => {
      if (tok === 'obs' || tok === 'stars' || tok === 'gap') return tok;
      if (tok === 'glidegap') return 'gap';
      if (tok === 'pickup:hose' && num === 1) return tok;
      if (tok.startsWith('mission:') && FIRE_TARGETS[tok.slice(8)]) return tok;
      return 'stars';
    });
  }

  // ================================================================ laço principal
  frame(now) {
    const dtReal = Math.min((now - this.last) / 1000, 0.1); this.last = now;
    if (!this.paused) {
      this.acc += dtReal; let n = 0;
      while (this.acc >= 1 / 60 && n < 4) { this.tick(1 / 60); this.acc -= 1 / 60; n++; }
      if (n === 4) this.acc = 0;
    }
    this.render();
    // resolução dinâmica: mantém a fluidez em celulares intermediários
    this.frames++; this.fpsT = (this.fpsT || 0) + dtReal;
    if (this.fpsT > 1.5) {
      const fps = this.frames / this.fpsT; this.frames = 0; this.fpsT = 0;
      if (fps < 44 && this.ratio > 0.7) { this.ratio = Math.max(0.7, this.ratio * 0.85); this.renderer.setPixelRatio(this.ratio); this.resize(); }
      else if (fps > 58 && this.ratio < this.maxRatio) { this.ratio = Math.min(this.maxRatio, this.ratio * 1.08); this.renderer.setPixelRatio(this.ratio); this.resize(); }
    }
  }
  render() { this.renderer.render(this.scene, this.camera); }
  resize() {
    const w = this.el.clientWidth || window.innerWidth, h = this.el.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.domElement.style.width = '100%'; this.renderer.domElement.style.height = '100%';
  }

  tick(dt) {
    if (this.paused) return;
    const c = this.cfg, p = this.p;
    this.t += dt;
    if (p.invul > 0) p.invul -= dt; if (this.recover > 0) this.recover -= dt; if (this.sprayCd > 0) this.sprayCd -= dt;
    if (p.buffer > 0) p.buffer -= dt; if (p.coyote > 0) p.coyote -= dt; if (p.hitT > 0) p.hitT -= dt; if (p.cheer > 0) p.cheer -= dt; if (this.sprayT > 0) this.sprayT -= dt;
    this.cleanTimer += dt;
    if (this.assist > 0 && this.cleanTimer > 40) { this.assist--; this.cleanTimer = 0; }
    this.updatePowers(dt);

    // ---- missão mais próxima ainda não concluída ----
    const m = this.ents.find((e) => e.type === 'mission' && !e.done) || null; this.mission = m;
    this.focus = this.ents.find((e) => e.type === 'mission' && e.engaged) || null;      // missão em andamento (ou comemorando)

    // ---- velocidade do mundo ----
    let mul = 1; this.tutorialActive = false;
    if (this.fall) mul = 0;
    else if (this.tutorialJump && p.ground) {
      const h = this.nextHazard();
      if (h && h.gap > 0 && h.gap <= this.jumpDist() * 0.62) { this.tutorialActive = true; mul = 0; this.tutWait += dt; if (this.tutWait > 10) p.buffer = 0.2; }
    }
    let target = 1;
    if (m) {
      const gap = m.s - this.dist;
      if (gap < 16) target = Math.max(0, Math.min(1, (gap - STOP) / 9));
      if (gap <= STOP + 0.15) { target = 0; if (!m.engaged) this.engageMission(m); }
    }
    this.missionMul += (target - this.missionMul) * Math.min(1, dt * 5);
    if (this.focus) this.missionMul = 0;
    mul = Math.min(mul, this.missionMul);
    const rec = this.recover > 0 ? c.slow + (1 - c.slow) * (1 - this.recover / 1.0) : 1;
    // correr: aceleração gradual enquanto o botão está pressionado; ao soltar volta suavemente à velocidade da partida
    const turboMax = this.powers.speed ? 1.5 : c.runBoost;
    const wantTurbo = (this.runHeld && !this.fall && !this.focus && !this.tutorialActive) ? turboMax : (this.powers.speed ? 1.5 : 1);
    this.turbo += (wantTurbo - this.turbo) * Math.min(1, dt * (wantTurbo > this.turbo ? 2.6 : 3.2));
    const speed = Math.min(this.baseSpeed * this.turbo, c.speedMax * c.runBoost * 1.02) * mul * rec;
    const stopped = this.focus || this.tutorialActive || this.fall;
    if (!stopped) this.runTime += dt;                                  // só o tempo ativo conta para a velocidade básica
    const dx = speed * dt; this.dist += dx; this.worldSpeed = speed;

    this.world.update(this.dist, dt, speed);
    this.spawnLogic();
    this.assistSteer(speed);
    this.physics(dt);
    if (!this.fall) { this.collide(); this.pickups(dt); }
    this.updateEnts(dt);
    this.updateMission(dt, m);
    this.cleanup();
    this.pose(dt);
    this.updateCamera(dt);
    this.fx.update(dt, dx);
    this.updateHud(m);
  }

  // ================================================================ física do personagem
  groundOK(s) { return !this.world.inHole(s - 0.12, s + 0.12); }
  physics(dt) {
    const c = this.cfg, p = this.p, engaged = !!this.focus;
    // faixa: movimento suave; durante missões o menino se alinha ao centro
    if (engaged) p.lane = 0;
    const tx = p.lane * LANE_W, vx0 = p.x;
    p.x += (tx - p.x) * Math.min(1, dt * 11);
    p.roll += ((p.x - vx0) / Math.max(dt, 1e-3) * -0.045 - p.roll) * Math.min(1, dt * 12);

    p.floating = false;
    const wasGround = p.ground;
    // perder o apoio ao passar do chão para um buraco
    if (p.ground && !this.groundOK(this.dist) && !this.fall) { p.ground = false; p.coyote = c.coyote; p.vy = 0; }
    // pulo (buffer + coyote), assistido na beira de buracos
    if (!engaged && !this.fall) {
      let want = p.buffer > 0;
      if (!want && p.ground && (c.jumpAssist || this.assist > 0) && !this.tutorialActive) {
        const h = this.nextHole(); if (h && h.s - this.dist < this.jumpDist() * 0.16 + 0.3 && h.s - this.dist > -0.1) want = true;
      }
      if (want && (p.ground || p.coyote > 0)) {
        p.vy = this.jumpV; p.ground = false; p.coyote = 0; p.buffer = 0; p.dbl = false; p.dblReq = false; p.jumpT = this.t; p.rescued = false; this.stats.jumps++; sfx.jump();
        p.squash = -0.2; this.fx.burst(p.x, 0.1, 0, 5, { col: 0xffffff, s: 0.14, speed: 1.2, life: 0.4, g: 0 });
        if (this.tutorialJump) { this.tutorialJump = false; this.tutWait = 0; save({ tut: { ...load().tut, jump: true } }); }
      }
    }
    if (this.fall) {
      this.fall.t += dt; p.y -= 6 * dt; p.vy = 0;
      if (this.fall.t > 0.6) this.finishFall();
    } else if (!p.ground) {
      if (p.dblReq) {
        p.dblReq = false; p.dbl = true; p.buffer = 0; p.vy = this.jumpV * 0.95; this.stats.doubles++; sfx.jump(); p.flip = 0.55; p.squash = -0.25;
        this.fx.burst(p.x, p.y + 0.2, 0, 14, { col: 0xffe14a, s: 0.12, speed: 2.4, life: 0.5 });
      }
      // segurar o pulo no ar: desce devagarzinho (limitado para não virar voo infinito)
      p.vy -= this.g * dt;
      if (this.jumpHeld && p.vy < -1.7 && p.floatT < 2.2 && !engaged) { p.floating = true; p.floatT += dt; p.vy += (-1.7 - p.vy) * Math.min(1, dt * 14); }
      p.y += p.vy * dt;
      if (p.floating && !this._wasFloating) this.stats.floats++;
      // salto de resgate sobre buracos em modos assistidos
      if (p.vy < 0 && !p.rescued && (c.jumpAssist || this.assist > 0) && p.y < 0.5 && !this.groundOK(this.dist)) { p.vy = this.jumpV * 0.8; p.rescued = true; sfx.jump(); this.fx.burst(p.x, p.y, 0, 6, { col: 0xffe14a, s: 0.12, speed: 1.6, life: 0.4 }); }
      if (p.y <= 0 && p.vy <= 0) {
        if (this.groundOK(this.dist)) { p.y = 0; p.vy = 0; p.ground = true; p.dbl = false; p.dblReq = false; p.floatT = 0; p.rescued = false; p.coyote = c.coyote; p.squash = 0.28; this.fx.burst(p.x, 0.05, 0, 6, { col: 0xf1ead8, s: 0.16, speed: 1.3, life: 0.45 }); sfx.land && sfx.land(); }
        else if (p.y < -1.1) this.startFall();
      }
    } else { p.y = 0; p.vy = 0; }
    this._wasFloating = p.floating;
    if (p.flip > 0) p.flip -= dt;
    p.squash += (0 - p.squash) * Math.min(1, dt * 10);
  }

  startFall() {
    const h = this.world.holes.find((x) => this.dist > x.s - 0.2 && this.dist < x.s + x.len + 0.2);
    this.fall = { t: 0, s: h ? h.s : this.dist }; this.stats.falls++; sfx.hit();
    this.hitTimes.push(this.t); this.hitTimes = this.hitTimes.filter((t) => this.t - t < 25); this.cleanTimer = 0;
    this.fx.burst(this.p.x, -0.4, 0, 14, { col: 0x8ee0ff, s: 0.16, speed: 3, up: 3, life: 0.7, g: 9 });
    if (this.hitTimes.length >= 3 && this.assist < 2) { this.assist++; this.hitTimes = []; }
  }
  finishFall() {
    const f = this.fall; this.fall = null;
    // recuperação amigável: volta para um ponto seguro antes do buraco, sem perder progresso
    this.dist = Math.max(0, f.s - 7.5);
    const p = this.p; p.y = 0; p.vy = 0; p.ground = true; p.invul = 2.2; this.recover = 1.0; p.dbl = false; p.floatT = 0; p.lane = 0; p.x = 0;
    this.world.update(this.dist, 0, 0);
    this.sparkleRing(p.x, 0.8);
  }

  // ================================================================ perigos, geração e colisão
  nextHole() { let b = null; for (const h of this.world.holes) if (h.s + h.len > this.dist && (!b || h.s < b.s)) b = h; return b; }
  nextHazard() {
    let best = null; const px = this.p.x;
    for (const e of this.ents) {
      if (e.type !== 'obs' || e.hit) continue;
      if (Math.abs(e.x - px) > e.w / 2 + 0.8) continue;
      const gap = e.s - e.d / 2 - this.dist - PLAYER_R; if (gap < -0.3) continue;
      if (!best || gap < best.gap) best = { gap, top: e.h, x: e.x, s: e.s };
    }
    const h = this.nextHole(); if (h) { const gap = h.s - this.dist - 0.1; if (gap > -0.3 && (!best || gap < best.gap)) best = { gap, top: 0, x: 0, s: h.s + h.len / 2, hole: true }; }
    return best;
  }
  laneBlocked(lane, s0, s1) { return this.ents.some((e) => e.type === 'obs' && !e.hit && e.lane === lane && e.s + e.d / 2 > s0 && e.s - e.d / 2 < s1); }
  assistSteer(speed) {
    const p = this.p;
    if (!(this.cfg.steerAssist || this.assist > 0) || this.fall || (this.mission && this.mission.engaged) || this.tutorialActive || speed < 1) return;
    if (this.t - p.lastSteer < 0.5 || !p.ground) return;
    const look = Math.max(2.4, speed * 1.15);
    if (!this.laneBlocked(p.lane, this.dist - 0.2, this.dist + look)) return;
    const o = this.ents.find((e) => e.type === 'obs' && !e.hit && e.lane === p.lane && e.s > this.dist - 0.2 && e.s - e.d / 2 < this.dist + look);
    // nunca desvia de barreiras que ocupam todas as faixas (essas pedem pulo)
    const free = [-1, 0, 1].filter((l) => !this.laneBlocked(l, this.dist - 0.2, this.dist + look + 2)).sort((a, b) => Math.abs(a - p.lane) - Math.abs(b - p.lane));
    if (o && free.length && Math.abs(free[0] - p.lane) <= 1) p.lane = free[0];
  }

  spawnLogic() {
    const c = this.cfg, ahead = this.dist + 72;
    while (this.nextS < ahead) {
      if (!this.queue.length) {
        if (this.ents.some((e) => e.type === 'mission' && !e.done)) return;
        if (this.nextS < this.dist + 20) { this.advancePhase(); return; }
        return;
      }
      const tok = this.queue.shift(); const s = this.nextS;
      const r = this.spawnToken(tok, s);
      const sp = this.baseSpeed;
      const g = this.rng.between(c.gap[0], c.gap[1]) * (1 + 0.15 * this.assist) * Math.max(0.8, 1 - 0.05 * this.loop);
      this.nextS = s + r.width + (g + (r.extra || 0)) * sp * (r.short ? 0.35 : 1);
    }
  }

  laneX(l) { return l * LANE_W; }
  spawnToken(tok, s) {
    const [kind, arg] = tok.split(':'); const c = this.cfg, theme = this.phase.theme;
    switch (kind) {
      case 'stars': {
        const lane = this.rng.int(-1, 1);
        for (let i = 0; i < 5; i++) this.addStar(lane, s + i * 1.6, 0.8);
        return { width: 9 };
      }
      case 'obs': return { width: this.spawnObstacleGroup(s) };
      case 'gap': {
        const len = 3;                                         // um bloco de pista; planar/voar vêm nas próximas etapas
        const start = Math.ceil(s / 3) * 3;
        const h = this.world.addHole(start, len); this.ents.push({ type: 'hole', s: start, len, h });
        for (let i = 0; i < 4; i++) this.addStar(0, start - 1.6 + i * 1.7, 1.2 + Math.sin((i / 3) * Math.PI) * 1.1);
        return { width: start - s + len + 5, extra: 0.4 };
      }
      case 'pickup': this.addPickup(arg, this.rng.int(-1, 1), s); return { width: 5 };
      case 'mission': return this.addMission(arg, s);
      default: return { width: 4 };
    }
  }
  obsKinds() { return { bairro: ['cone', 'barrier', 'crate', 'hydrant'], praca: ['cone', 'bench', 'crate', 'bush'], floresta: ['log', 'rock', 'bush', 'mushroom'], altura: ['crate', 'ac', 'barrier', 'pipe'], pre: ['rock', 'log', 'bone', 'mushroom'] }[this.phase.theme]; }
  spawnObstacleGroup(s) {
    const grp = this.firstObstacle ? 'full' : this.rng.pick(this.cfg.groups); this.firstObstacle = false;
    const kinds = this.obsKinds(), r = this.rng;
    const k = r.pick(kinds.slice(0, 3));
    if (grp === 'full') { for (let l = -1; l <= 1; l++) this.addObstacle(k === 'barrier' || k === 'log' || k === 'pipe' || k === 'bench' ? k : r.pick(['cone', 'crate', 'rock', 'bush', 'ac', 'mushroom'].filter((x) => kinds.includes(x)).concat([kinds[0]])), l, s); for (let i = 0; i < 3; i++) this.addStar(0, s - 1.2 + i * 1.2, 1.1 + (i === 1 ? 0.8 : 0.3)); return 6; }
    if (grp === 'double') { const free = r.int(-1, 1); for (let l = -1; l <= 1; l++) if (l !== free) this.addObstacle(r.pick(kinds), l, s); this.addStar(free, s - 1, 0.8); this.addStar(free, s, 0.8); this.addStar(free, s + 1, 0.8); return 5; }
    const l = r.int(-1, 1); this.addObstacle(k, l, s);
    for (let i = 0; i < 3; i++) this.addStar(l, s - 1.4 + i * 1.4, 1.1 + (i === 1 ? 0.9 : 0.3));
    return 5;
  }
  tmpl(kind) { return (this.tpl[kind] ||= buildObstacle(kind)); }
  addObstacle(kind, lane, s) {
    const d = OBSTACLES[kind]; const mesh = this.tmpl(kind).clone(); this.scene.add(mesh);
    const sh = blobShadow(d.w * 1.1, d.d * 1.3); this.scene.add(sh);
    const e = { type: 'obs', kind, lane, x: this.laneX(lane), s, w: d.w, h: d.h, d: d.d, mesh, sh, hit: false }; this.ents.push(e); return e;
  }
  addStar(lane, s, y) {
    const mesh = buildStar(); this.scene.add(mesh);
    this.ents.push({ type: 'star', lane, x: this.laneX(lane), s, y, mesh, spin: this.rng.frac() * 6 });
  }
  addPickup(kind, lane, s) {
    const mesh = buildPickup(kind); this.scene.add(mesh);
    this.ents.push({ type: 'pickup', kind, lane, x: this.laneX(lane), s, y: 1.1, mesh });
  }
  addMission(key, s) {
    const side = this.rng.frac() < 0.5 ? -1 : 1; const kind = FIRE_TARGETS[key];
    const obj = new THREE.Group(); let tx, flames = [], model, aim = [];
    if (kind === 'bin') { model = buildBin(); model.scale.setScalar(1.7); tx = 3.9; flames = [[0, 2.3, 0, 1.9]]; }
    else if (kind === 'house') { model = buildHouse(this.rng.pick([0xffd66b, 0xff9fb2, 0x86dcff]), 0xe8352f); tx = 7.8; flames = [[-1.4, 1.5, -1.9, 1.1], [1.4, 1.5, -1.9, 1.1], [0.0, 3.4, -0.4, 1.4]]; }
    else { model = buildTower(4); tx = 10.2; flames = [[-1.6, 1.4, -1.9, 1.1], [1.6, 3.3, -1.9, 1.1], [0, 5.2, -1.9, 1.2], [-1.6, 7.0, -1.9, 1.1]]; }
    model.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; obj.add(model);
    const fl = flames.map(([x, y, z, sc]) => { const f = buildFlame(); f.position.set(x, y, z); f.scale.setScalar(sc); f.userData.base = sc; const holder = new THREE.Group(); holder.add(f); holder.rotation.y = model.rotation.y; obj.add(holder); return f; });
    obj.position.set(side * tx, 0, 0); this.scene.add(obj);
    const hits = kind === 'bin' ? this.cfg.fireHits : kind === 'house' ? this.cfg.fireHits + 1 : this.cfg.fireHits + 2;
    const m = { type: 'mission', key, kind, s, side, tx: side * tx, obj, model, flames: fl, hp: hits + Math.min(this.loop, 2), done: false, engaged: false, w: 4 };
    m.max = m.hp; this.ents.push(m);
    return { width: 14, extra: 0.6 };
  }

  collide() {
    const p = this.p; if (p.invul > 0 || this.powers.speed) return;
    for (const o of this.ents) {
      if (o.type !== 'obs' || o.hit) continue;
      if (Math.abs(p.x - o.x) < o.w / 2 + PLAYER_R * 0.85 && Math.abs(this.dist - o.s) < o.d / 2 + 0.2 && p.y < o.h - 0.12) { this.onHit(o); break; }
    }
  }
  onHit(o) {
    const p = this.p; o.hit = true;
    o.fly = { t: 0, vx: (o.x >= p.x ? 1 : -1) * 4, vy: 5 };
    if (this.powers.shield) { this.removePower('shield'); sfx.star(); this.fx.burst(p.x, 0.8, 0, 16, { col: 0x4db8ff, s: 0.14, speed: 3, life: 0.6 }); p.invul = 0.7; return; }
    p.invul = 1.5; this.recover = 1.0; this.stats.hits++; sfx.hit(); p.hitT = 0.45; this.shake = 0.18;
    this.fx.burst(p.x, 0.8, -0.2, 8, { col: 0xffffff, s: 0.16, speed: 2.4, life: 0.5 });
    this.hitTimes.push(this.t); this.hitTimes = this.hitTimes.filter((t) => this.t - t < 25); this.cleanTimer = 0;
    if (this.hitTimes.length >= 3 && this.assist < 2) { this.assist++; this.hitTimes = []; }
  }

  pickups(dt) {
    const p = this.p; const magnet = !!this.powers.magnet;
    for (const e of this.ents) {
      if (e.taken) continue;
      const dz = e.s - this.dist;
      if (e.type === 'star') {
        if (magnet && Math.abs(dz) < 7 && Math.abs(e.x - p.x) < 5) { e.s -= Math.sign(dz) * Math.min(Math.abs(dz), 12 * dt); e.x += (p.x - e.x) * Math.min(1, dt * 6); e.y += (p.y + 0.8 - e.y) * Math.min(1, dt * 6); }
        if (Math.abs(e.x - p.x) < 1.0 && Math.abs(dz) < 0.8 && Math.abs(e.y - (p.y + 0.8)) < 1.25) { e.taken = true; this.addStars(1); sfx.star(); this.fx.burst(e.mesh.position.x, e.y, e.mesh.position.z, 7, { col: 0xffe14a, s: 0.12, speed: 2, life: 0.4 }); this.scene.remove(e.mesh); }
      } else if (e.type === 'pickup') {
        if (Math.abs(e.x - p.x) < 1.3 && Math.abs(dz) < 1.1) { e.taken = true; this.takePickup(e); }
      }
    }
  }
  takePickup(e) {
    sfx.hose && sfx.hose();
    if (e.kind === 'hose') { this.eq.hose = true; speak('Mangueira!'); this.hud.toast('🧯', 'Mangueira!'); }
    this.fx.burst(e.mesh.position.x, e.y, e.mesh.position.z, 14, { col: 0xffd23f, s: 0.14, speed: 2.6, life: 0.6 });
    this.scene.remove(e.mesh);
  }

  addStars(n) {
    this.stars += n; this.stats.stars += n; this.hud.setStars(this.stars);
    if (this.stars > (load().bestStars || 0)) save({ bestStars: this.stars });
    while (this.stars >= this.nextPowerAt) { this.nextPowerAt += STARS_PER_POWER; this.grantPower(this.rng.pick(POWER_POOL.filter((k) => !this.powers[k]).concat(POWER_POOL.filter((k) => this.powers[k]).length === POWER_POOL.length ? POWER_POOL : []))); }
  }

  // ================================================================ poderes temporários (um a cada 50 estrelas)
  grantPower(key) {
    if (!key) return; const d = POWERS[key]; this.stats.powers++;
    this.powers[key] = { t: d.dur, dur: d.dur }; this.hud.toast(POWER_EMOJI[key], d.name); speak(d.say); sfx.star();
    this.fx.burst(this.p.x, 0.9, 0, 18, { col: d.color, s: 0.15, speed: 3, life: 0.7 }); this.lastPower = key;
  }
  removePower(k) { delete this.powers[k]; }
  updatePowers(dt) {
    for (const k of Object.keys(this.powers)) {
      const pw = this.powers[k];
      if (!this.focus && !this.tutorialActive && k !== 'shield') pw.t -= dt;    // o tempo dos poderes para durante missões
      if (pw.t <= 0) { this.removePower(k); }
    }
  }

  // ================================================================ missões de incêndio
  engageMission(m) {
    m.engaged = true; m.idle = 0; this.hud.toast('🔥', 'Fogo!'); speak(m.kind === 'bin' ? 'Fogo na lixeira!' : m.kind === 'house' ? 'Fogo na casa!' : 'Fogo no prédio!');
    if (!this.eq.hose) { this.eq.hose = true; this.hud.toast('🧯', 'Um amigo trouxe a mangueira!'); }
    this.tutorialWater = !load().tut.water;
  }
  aimPoint(m, i = null) {
    m.obj.updateMatrixWorld(true);
    const alive = m.flames.filter((f) => f.visible && f.scale.x > 0.05);
    const f = i === null ? (alive[0] || m.flames[0]) : m.flames[i];
    const v = new THREE.Vector3(); f.getWorldPosition(v); v.y += 0.35; return v;
  }
  spray(m) {
    const p = this.p; this.sprayCd = 0.28; this.sprayT = 0.55; sfx.hose && sfx.hose();
    const from = new THREE.Vector3(p.x + 0.3 * Math.cos(this.kid.rotation.y), 0.82, -0.25), to = this.aimPoint(m);
    const T = 0.5, gr = 9;
    const jet = this.powers.jet ? 2 : 1;
    for (let i = 0; i < 14 * jet; i++) {
      const dt0 = i / (14 * jet) * 0.18, jx = (Math.random() - 0.5) * 0.3, jz = (Math.random() - 0.5) * 0.3;
      this.fx.emit(from.x, from.y, from.z, { vx: (to.x - from.x + jx) / T, vy: (to.y - from.y + 0.5 * gr * T * T) / T, vz: (to.z - from.z + jz) / T, g: gr, s: this.powers.jet ? 0.26 : 0.2, life: T + dt0, col: this.powers.jet ? 0x7fd0ff : 0x9be0ff });
    }
    this.hitQueue = (this.hitQueue || []); this.hitQueue.push({ t: T * 0.9, m, n: jet });
    if (this.tutorialWater) { this.tutorialWater = false; save({ tut: { ...load().tut, water: true } }); }
  }
  updateMission(dt, m) {
    if (this.hitQueue && this.hitQueue.length) {
      for (const h of this.hitQueue) h.t -= dt;
      const due = this.hitQueue.filter((h) => h.t <= 0); this.hitQueue = this.hitQueue.filter((h) => h.t > 0);
      for (const h of due) { const mm = h.m; if (mm.done) continue; mm.hp = Math.max(0, mm.hp - h.n); const v = this.aimPoint(mm); this.fx.burst(v.x, v.y, v.z, 10, { col: 0xffffff, s: 0.2, speed: 1.8, up: 1.5, life: 0.7, grow: 1.3 }); if (mm.hp <= 0) this.finishMission(mm); }
    }
    const f = this.focus;
    if (f && !f.done) { f.idle += dt; if (this.cfg.autoHelpAfter && f.idle > this.cfg.autoHelpAfter && this.sprayCd <= 0) { f.idle = this.cfg.autoHelpAfter - 3; this.spray(f); this.hud.toast('🐶', 'Um amigo ajuda!'); } }
  }
  finishMission(m) {
    m.done = true; this.stats.missions++; sfx.star(); this.addStars(5); this.p.cheer = 2.2;
    m.flames.forEach((f) => { const v = new THREE.Vector3(); f.getWorldPosition(v); this.fx.burst(v.x, v.y + 0.3, v.z, 12, { col: 0xdfe6f1, s: 0.3, speed: 1.6, up: 1.8, life: 0.9, grow: 1.5 }); });
    // moradores comemoram
    m.cheer = [];
    const n = m.kind === 'bin' ? 0 : m.kind === 'house' ? 2 : 3;
    for (let i = 0; i < n; i++) { const k = buildKid({ skin: this.rng.int(0, 6), face: this.rng.int(0, 2), hair: this.rng.int(0, 7), hairColor: this.rng.int(0, 7), eyes: this.rng.int(0, 5), outfit: 9 }); k.position.set(m.tx + (m.side < 0 ? 1 : -1) * (m.kind === 'house' ? 3.2 : 4.2), 0, 1.4 + i * 1.5 - 1); k.rotation.y = m.side < 0 ? Math.PI / 2 + 0.6 : -Math.PI / 2 - 0.6; k.rotation.y = Math.PI * (0.9 + (i - 1) * 0.12); this.scene.add(k); m.cheer.push(k); }
    this.hud.toast('⭐', '+5'); speak(this.rng.pick(['Muito bem!', 'Você conseguiu!', 'Parabéns!']));
    this.p.invul = Math.max(this.p.invul, 2.2);
    this.time0 = this.t;
    m.endAt = this.t + 1.6;
  }

  // ================================================================ fases
  advancePhase() {
    this.phaseNum++; this.stats.phases++;
    const ph = this.phase; this.world.setTheme(ph.theme);
    this.queue = this.scriptFor(this.phaseNum); this.firstObstacle = false;
    save({ phase: Math.min(5, (this.phaseNum - 1) % PHASES.length + 1) });
    this.hud.banner('Fase ' + this.phaseNum, ph.name); this.hud.setDots((this.phaseNum - 1) % PHASES.length, PHASES.length, this.loop);
    const th = THEMES3[ph.theme]; this.themeTarget = th; this.sunTarget = th.sun;
    if (this.phaseNum >= 2) this.eq.hose = true;
    speak('Fase ' + this.phaseNum + '! ' + ph.name);
  }

  // ================================================================ atualização das entidades
  updateEnts(dt) {
    const t = this.t;
    for (const e of this.ents) {
      const z = this.dist - e.s;
      if (e.type === 'obs') {
        if (e.hit) { if (e.fly) { e.fly.t += dt; e.fly.vy -= 16 * dt; e.mesh.position.x += e.fly.vx * dt; e.mesh.position.y += e.fly.vy * dt; e.mesh.rotation.z += 9 * dt; e.mesh.rotation.x += 6 * dt; if (e.fly.t > 0.8) { e.mesh.visible = false; e.sh.visible = false; } } e.mesh.position.z = z; }
        else { e.mesh.position.set(e.x, 0, z); e.sh.position.set(e.x, 0.02, z); }
      } else if (e.type === 'star') {
        if (!e.taken) { e.mesh.position.set(e.x, e.y + Math.sin(t * 3 + e.spin) * 0.08, z); e.mesh.rotation.y = t * 2.4 + e.spin; }
      } else if (e.type === 'pickup') {
        if (!e.taken) { e.mesh.position.set(e.x, e.y + Math.sin(t * 3) * 0.12, z); e.mesh.rotation.y = t * 1.8; if (e.mesh.userData.halo) { e.mesh.userData.halo.rotation.y = -t * 1.8; e.mesh.userData.halo.scale.setScalar(1 + Math.sin(t * 5) * 0.08); e.mesh.userData.halo.lookAt(this.camera.position); } }
      } else if (e.type === 'mission') {
        e.obj.position.z = z;
        // chamas diminuem conforme a água acerta e tremeluzem
        const frac = e.hp / e.max, n = e.flames.length, alive = Math.ceil(frac * n - 1e-6);
        const v = new THREE.Vector3();
        e.flames.forEach((f, i) => {
          const on = i < alive, base = f.userData.base, wob = 1 + Math.sin(t * 14 + i * 2) * 0.1;
          const target = on ? base * (0.55 + 0.45 * Math.min(1, (frac * n - i))) * wob : 0;
          f.scale.setScalar(Math.max(0, f.scale.x + (target - f.scale.x) * Math.min(1, dt * 8))); f.visible = f.scale.x > 0.03;
          if (f.visible) {
            f.rotation.y = Math.sin(t * 6 + i) * 0.3;
            f.userData.parts.forEach((pp, j) => { pp.scale.y = 1 + Math.sin(t * (11 + j * 3) + i) * 0.14; pp.scale.x = 1 + Math.cos(t * (9 + j * 2) + i) * 0.07; });
            if (Math.random() < dt * 4) { f.getWorldPosition(v); this.fx.emit(v.x, v.y + 0.6, v.z, { vy: 1.2, vx: (Math.random() - 0.5) * 0.4, s: 0.14, life: 1.0, col: 0x59616e, grow: 1.6 }); }
          }
        });
        if (e.done) {
          e.cheer && e.cheer.forEach((k, i) => { k.position.z = z + 0.4 + i * 1.5; poseKid(k, 'cheer', 0, t + i); });
          if (e.model && e.kind === 'bin') e.model.scale.y = 1 + Math.abs(Math.sin((t - (e.endAt - 1.6)) * 8)) * 0.1 * Math.max(0, e.endAt - t);
          if (t > e.endAt && e.engaged) { e.engaged = false; e.released = true; this.missionMul = 0.2; }
        }
      }
    }
  }
  cleanup() {
    this.ents = this.ents.filter((e) => {
      if (e.taken && e.type !== 'obs') { if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh); return false; }
      if (e.type === 'hole') return e.s + e.len > this.dist - 14;
      const far = e.s < this.dist - 22;
      if (far) {
        if (e.type === 'pickup' && !e.taken) this.queue.unshift('pickup:' + e.kind);     // equipamentos perdidos reaparecem adiante
        if (e.type === 'mission' && !e.done) this.queue.unshift('mission:' + e.key);
        this.disposeEnt(e); return false;
      }
      if (e.type === 'mission' && e.released && e.s < this.dist - 8) { this.disposeEnt(e); return false; }
      return true;
    });
  }
  disposeEnt(e) {
    ['mesh', 'sh', 'obj'].forEach((k) => { if (e[k] && e[k].parent) e[k].parent.remove(e[k]); });
    if (e.cheer) e.cheer.forEach((k) => k.parent && k.parent.remove(k));
  }

  // ================================================================ apresentação
  pose(dt) {
    const p = this.p, engaged = !!(this.focus && !this.focus.done);
    let st = 'run';
    if (this.fall) st = 'hit';
    else if (p.cheer > 0 && p.ground) st = 'cheer';
    else if (!p.ground) st = p.flip > 0 ? 'flip' : p.floating ? 'float' : 'jump';
    else if (engaged) st = 'spray';
    else if (p.hitT > 0) st = 'hit';
    else if (this.worldSpeed < 0.3 && (this.tutorialActive || this.focus)) st = 'idle';
    this.phaseRun = (this.phaseRun || 0) + dt * (5.4 + this.worldSpeed * 1.25);
    // direção do corpo: enfrenta o incêndio nas missões, e a câmera quando comemora
    let yaw = 0; const fo = this.focus;
    if (fo && !fo.done) yaw = -fo.side * Math.atan2(Math.abs(fo.tx - p.x), Math.max(1, fo.s - this.dist)) * 0.95;
    if (p.cheer > 0 && p.ground) yaw = Math.PI * 0.88;
    this.yaw = (this.yaw || 0) + (yaw - (this.yaw || 0)) * Math.min(1, dt * 7);
    this.kid.rotation.y = this.yaw;
    const k = this.kid.userData;
    poseKid(this.kid, st, this.phaseRun, this.t, { roll: p.roll * 0.9, lean: (this.turbo > 1.05 ? 0.1 : 0), fast: this.turbo > 1.08 });
    k.hose.visible = this.eq.hose; k.nozzle.visible = st === 'spray';
    if (st === 'spray') { k.armR.rotation.x = -1.5 + Math.sin(this.t * 14) * 0.05; k.armR.rotation.z = -0.1; }
    // cambalhota do pulo duplo
    k.spin.rotation.x = p.flip > 0 ? -((0.55 - p.flip) / 0.55) * Math.PI * 2 : 0;
    k.body.scale.set(1 - p.squash * 0.35, 1 + p.squash * 0.5, 1 - p.squash * 0.35);
    this.kid.position.set(p.x, p.y, 0);
    this.kid.visible = !(p.invul > 0 && p.invul < 1.6 && Math.floor(this.t * 14) % 2 && !this.fall);
    this.shadow.position.set(p.x, 0.02, 0); const alt = Math.max(0, p.y); this.shadow.scale.set(0.9 * (1 - Math.min(0.5, alt / 5)), 1, 0.9 * (1 - Math.min(0.5, alt / 5))); this.shadow.visible = !this.fall;
    this.bubble.visible = !!this.powers.shield; this.bubble.position.set(p.x, p.y + 0.75, 0); this.bubble.scale.setScalar(1 + Math.sin(this.t * 6) * 0.03);
    // dica de salto (modo fácil)
    const h = this.cfg.hintDist && p.ground && !this.fall ? this.nextHazard() : null;
    const show = !!h && h.gap < this.cfg.hintDist && h.gap > 0.5;
    this.hint.visible = show; if (show) { this.hint.position.set(h.hole ? 0 : h.x, (h.top || 0) + 1.5 + Math.sin(this.t * 9) * 0.18, this.dist - h.s); this.hint.rotation.y = this.t * 2; }
    // brilho de poderes
    if (this.powers.speed && Math.random() < 0.6) this.fx.emit(p.x + (Math.random() - 0.5) * 0.4, p.y + 0.4 + Math.random() * 0.6, 0.4, { vz: 6, s: 0.1, life: 0.35, col: 0xffb347 });
    if (this.turbo > 1.08 && this.p.ground && Math.random() < 0.5) this.fx.emit(p.x + (Math.random() - 0.5) * 0.5, 0.15, 0.3, { vz: 4, vy: 0.4, s: 0.12, life: 0.4, col: 0xf1ead8 });
    // poeira ao correr
    this.dustT = (this.dustT || 0) - dt; if (p.ground && this.worldSpeed > 1 && this.dustT <= 0) { this.dustT = 0.12; this.fx.emit(p.x, 0.08, 0.35, { vz: 1, vy: 0.5, s: 0.1, life: 0.4, col: 0xefe6d2, vx: (Math.random() - 0.5) * 0.4 }); }
    // luz e céu seguem o tema
    if (this.themeTarget) { const th = this.themeTarget; this.hemi.color.lerp(new THREE.Color(th.hemi[0]), Math.min(1, dt * 1.2)); this.hemi.groundColor.lerp(new THREE.Color(th.hemi[1]), Math.min(1, dt * 1.2)); this.sun.color.lerp(new THREE.Color(th.sun[0]), Math.min(1, dt * 1.2)); this.scene.fog.color.copy(this.world.fogColor); }
    else this.scene.fog.color.copy(this.world.fogColor);
  }

  sparkleRing(x, y) { for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; this.fx.emit(x, y, 0, { vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, s: 0.12, life: 0.6, col: 0xffe14a }); } }

  updateCamera(dt, snap = false) {
    const p = this.p, m = this.focus;
    let pos, look, fov = 60;
    if (m) {
      const big = m.kind === 'bin' ? 0 : m.kind === 'house' ? 1 : 2;
      pos = new THREE.Vector3(-m.side * 1.2, 2.7 + big * 1.0, 4.6 + big * 1.4);
      look = new THREE.Vector3(m.tx * 0.55, 1.3 + big * 1.5, -3.0); fov = 56 + big * 3;
    }
    else { pos = new THREE.Vector3(p.x * 0.55, 3.3 + Math.max(0, p.y) * 0.4, 5.7); look = new THREE.Vector3(p.x * 0.35, 1.1 + Math.max(0, p.y) * 0.3, -9); fov = 60 + (this.turbo - 1) * 16; }
    if (this.shake > 0) { this.shake -= dt; pos.y += Math.sin(this.t * 60) * 0.04 * Math.min(1, this.shake * 5); }
    const k = snap ? 1 : 1 - Math.exp(-dt * 5);
    this.camPos.lerp(pos, k); this.camLook.lerp(look, k);
    this.camera.position.copy(this.camPos); this.camera.lookAt(this.camLook);
    if (Math.abs(this.camera.fov - fov) > 0.05) { this.camera.fov += (fov - this.camera.fov) * (snap ? 1 : Math.min(1, dt * 4)); this.camera.updateProjectionMatrix(); }
    this.world.follow(this.camera.position.z);
  }

  updateHud(m) {
    const frac = (this.stars - (this.nextPowerAt - STARS_PER_POWER)) / STARS_PER_POWER; this.hud.setBar(Math.max(0, Math.min(1, frac)));
    const keys = Object.keys(this.powers);
    if (keys.length) { const k = keys[keys.length - 1], pw = this.powers[k]; this.hud.power(POWER_EMOJI[k], pw.t / pw.dur, '#' + POWERS[k].color.toString(16).padStart(6, '0')); } else this.hud.power(null);
    // botão de ação: mostra de antemão o que fará
    const near = m && !m.done && (m.s - this.dist) < 34;
    this.hud.setAction(near ? 'drop' : null, !!(this.focus && !this.focus.done), near && !m.engaged);
    this.hud.pulseJump(this.tutorialActive || (this.hint.visible && this.cfg.hintDist > 0));
    if (this.tutorialActive) { this.hud.hand(this.hud.els.jump, true); if (!this._saidJump) { this._saidJump = true; speak('Toque na seta para pular!'); } }
    else if (this.focus && !this.focus.done && this.tutorialWater) this.hud.hand(this.hud.els.act, true);
    else this.hud.hand(null, false);
  }

  snapshot() {
    const m = this.mission, p = this.p;
    return {
      mode: this.modeId, phase: this.phaseNum, theme: this.world.nextTheme, t: this.t, dist: this.dist, stars: this.stars, speed: this.worldSpeed, base: this.baseSpeed, turbo: this.turbo,
      y: p.y, lane: p.lane, onGround: p.ground, floating: p.floating, dbl: p.dbl, assist: this.assist, powers: Object.keys(this.powers), eq: { ...this.eq },
      falling: !!this.fall, paused: this.paused, tutorial: this.tutorialActive, mission: m ? { key: m.key, hp: m.hp, engaged: m.engaged, done: m.done } : null, focus: !!this.focus, runTime: this.runTime,
      stats: { ...this.stats }, ents: this.ents.length, queue: this.queue.length,
    };
  }

  destroy() {
    cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.onResize); document.removeEventListener('visibilitychange', this.onHidden);
    window.removeEventListener('keydown', this.kd); window.removeEventListener('keyup', this.ku);
    stopMusic(); silenceVoice(); this.hud.destroy();
    this.renderer.dispose(); if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    if (window.__ian3 === this) window.__ian3 = null;
  }
}
