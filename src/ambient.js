// Vida extra no cenário: amigos que correm passando pela tela, veículos e bichos que cruzam,
// plantas em primeiro plano que passam bem rápido e folhinhas ao vento. Tudo é só visual
// (não colide e não muda as regras do jogo) e usa Math.random para não mexer na semente das fases.
import { W, H, GROUND } from './config.js';
import { buildChild, poseChild } from './character.js';
import { buildDog, poseDog, DOGS, buildDino, buildCat, buildBunny, buildPtero, buildFireTruck, buildHeli } from './creatures.js';
import { og } from './outline.js';
import { sfx } from './audio.js';

const R = () => Math.random();
const pick = (a) => a[Math.floor(R() * a.length)];
const DOG_KEYS = Object.keys(DOGS);

function buildBird(scene) {
  const c = scene.add.container(0, 0);
  const body = og(scene); body.fillStyle(0xffffff, 1); body.fillEllipse(0, 0, 34, 20); body.fillStyle(0xffb300, 1); body.fillTriangle(16, -2, 28, 2, 16, 5);
  body.fillStyle(0x222222, 1); body.fillCircle(9, -3, 2.4);
  const wing = og(scene); wing.fillStyle(0x4db8ff, 1); wing.fillTriangle(-10, 0, 8, 0, -4, -30);
  c.add([body, wing]); c.wing = wing;
  return c;
}

function randomLook() {
  return { skin: Math.floor(R() * 7), face: Math.floor(R() * 3), hair: Math.floor(R() * 8), hairColor: Math.floor(R() * 8), eyes: Math.floor(R() * 6), outfit: Math.floor(R() * 10) };
}

// Cada tipo: make -> container (origem nos pés, olhando para a direita), sc = escala, mode = como se mexe.
const KINDS = {
  kid: { make: (s) => buildChild(s, randomLook()), sc: 0.62, anim: (o, t) => poseChild(o, 'run', t * 14, t), say: 'Oi!' },
  dog: { make: (s) => buildDog(s, pick(DOG_KEYS), 1), sc: 0.62, anim: (o, t) => poseDog(o, 'run', t * 15, t), say: 'Au!', bark: true },
  cat: { make: (s) => buildCat(s), sc: 0.8, hop: 16, say: 'Miau!' },
  bunny: { make: (s) => buildBunny(s), sc: 0.75, hop: 34, say: 'Oi!' },
  baby: { make: (s) => buildDino(s, 'baby'), sc: 0.6, hop: 22, say: 'Rawr!' },
  trex: { make: (s) => buildDino(s, 'trex'), sc: 0.34, hop: 8, say: 'Rawr!' },
  stego: { make: (s) => buildDino(s, 'stego'), sc: 0.34, hop: 8, say: 'Rawr!' },
  truck: { make: (s) => buildFireTruck(s), sc: 0.5, anim: (o, t) => { o.light.setAlpha(Math.floor(t * 6) % 2 ? 1 : 0.4); }, bob: 2, say: 'Nhóin nhóin!' },
  heli: { make: (s) => buildHeli(s), sc: 0.5, anim: (o, t) => { o.rotor.scaleX = Math.abs(Math.sin(t * 40)) * 0.9 + 0.1; }, bob: 7, sky: true },
  ptero: { make: (s) => buildPtero(s), sc: 0.5, anim: (o, t) => { o.wing.scaleY = 0.55 + Math.abs(Math.sin(t * 7)) * 0.6; o.scaleX = -Math.abs(o.scaleX); }, bob: 10, sky: true, rev: true },
  bird: { make: (s) => buildBird(s), sc: 1, anim: (o, t) => { o.wing.scaleY = Math.sin(t * 16); }, bob: 8, sky: true },
};

// lane: near = na frente do menino (mais embaixo na tela), far = atrás, sky = no céu.
// dir: +1 passa correndo pelo menino (da esquerda para a direita); -1 vem de frente e cruza.
const SPAWNS = {
  bairro: [['kid', 'near', 1], ['dog', 'near', 1], ['cat', 'near', -1], ['truck', 'far', -1], ['kid', 'far', -1], ['heli', 'sky', 1], ['bird', 'sky', -1]],
  praca: [['kid', 'near', 1], ['dog', 'near', 1], ['bunny', 'near', -1], ['kid', 'far', -1], ['bird', 'sky', -1], ['bird', 'sky', 1]],
  floresta: [['bunny', 'near', -1], ['dog', 'near', 1], ['kid', 'near', 1], ['cat', 'far', -1], ['bird', 'sky', -1], ['bird', 'sky', 1]],
  altura: [['kid', 'near', 1], ['dog', 'near', 1], ['truck', 'far', -1], ['heli', 'sky', 1], ['heli', 'sky', -1], ['bird', 'sky', -1]],
  pre: [['baby', 'near', -1], ['kid', 'near', 1], ['dog', 'near', 1], ['trex', 'far', -1], ['stego', 'far', 1], ['ptero', 'sky', -1], ['ptero', 'sky', 1]],
};

// Plantas e objetos que passam em primeiro plano (desenhados por código, base em y = 0).
const FG = {
  bairro: [
    (g) => { g.fillStyle(0x4a5568, 1); g.fillRoundedRect(-5, -230, 10, 230, 4); g.fillStyle(0xffd23f, 1); g.fillRoundedRect(-24, -250, 48, 26, 12); g.fillStyle(0xfff6c4, 1); g.fillRoundedRect(-17, -245, 34, 14, 7); },
    (g) => { g.fillStyle(0x22b455, 1); g.fillCircle(-26, -22, 30); g.fillCircle(10, -34, 38); g.fillCircle(42, -20, 28); g.fillStyle(0xff5d8f, 1); [[-30, -30], [8, -48], [40, -26], [-6, -20]].forEach(([x, y]) => g.fillCircle(x, y, 7)); },
    (g) => { g.fillStyle(0xffffff, 1); for (let i = 0; i < 4; i++) g.fillRoundedRect(i * 36 - 6, -78, 22, 78, 6); g.fillStyle(0xe9edf5, 1); g.fillRect(-6, -58, 140, 10); },
  ],
  praca: [
    (g) => { [[-30, 0xff5d8f], [0, 0xffd23f], [30, 0xff8a1f]].forEach(([x, c]) => { g.fillStyle(0x22b455, 1); g.fillRect(x - 3, -70, 6, 70); g.fillStyle(c, 1); g.fillCircle(x, -78, 18); g.fillStyle(0xfff3b0, 1); g.fillCircle(x, -78, 7); }); },
    (g) => { g.fillStyle(0x22b455, 1); g.fillCircle(-24, -26, 32); g.fillCircle(14, -38, 40); g.fillCircle(46, -22, 28); },
    (g) => { g.fillStyle(0x8a5a35, 1); g.fillRoundedRect(-46, -52, 92, 12, 4); g.fillRect(-40, -40, 8, 40); g.fillRect(32, -40, 8, 40); g.fillStyle(0xc2864a, 1); g.fillRoundedRect(-46, -88, 92, 30, 6); },
  ],
  floresta: [
    (g) => { g.fillStyle(0x1fa84a, 1); [-1, 0, 1].forEach((k) => g.fillTriangle(k * 34 - 18, 0, k * 34 + 18, 0, k * 34 + k * 24, -150 + Math.abs(k) * 30)); g.fillStyle(0x7ddc4c, 1); g.fillTriangle(-10, 0, 10, 0, 0, -170); },
    (g) => { g.fillStyle(0xfff3dc, 1); g.fillRoundedRect(-8, -46, 16, 46, 6); g.fillStyle(0xff3b3b, 1); g.slice(0, -44, 34, Math.PI, 0, false); g.fillPath(); g.fillStyle(0xffffff, 1); g.fillCircle(-12, -58, 5); g.fillCircle(10, -64, 6); g.fillCircle(16, -50, 4); },
    (g) => { g.fillStyle(0x22b455, 1); for (let i = -3; i <= 3; i++) g.fillTriangle(i * 11 - 7, 0, i * 11 + 7, 0, i * 11 + i * 3, -60 - (3 - Math.abs(i)) * 12); },
  ],
  altura: [
    (g) => { g.fillStyle(0x9aa6c0, 1); g.fillRoundedRect(-16, -110, 32, 110, 4); g.fillStyle(0x6c7a9c, 1); g.fillRoundedRect(-22, -122, 44, 16, 4); g.fillStyle(0xbfc8dc, 1); g.fillRect(-16, -90, 10, 90); },
    (g) => { g.fillStyle(0x6c7a9c, 1); g.fillRect(-4, -200, 8, 200); g.fillStyle(0xff3b3b, 1); g.fillTriangle(4, -200, 4, -160, 54, -180); },
    (g) => { g.fillStyle(0xe0763a, 1); g.fillRoundedRect(-26, -56, 52, 56, 8); g.fillStyle(0x22b455, 1); g.fillCircle(-14, -70, 22); g.fillCircle(14, -78, 26); g.fillCircle(0, -96, 20); },
  ],
  pre: [
    (g) => { g.fillStyle(0x2f9e44, 1); for (let i = -2; i <= 2; i++) g.fillTriangle(0, -10, i * 46 - 12, -90 + Math.abs(i) * 24, i * 46 + 16, -70 + Math.abs(i) * 26); g.fillStyle(0x8a5a35, 1); g.fillRect(-6, -30, 12, 30); },
    (g) => { g.fillStyle(0x8f8a99, 1); g.fillCircle(-12, -26, 30); g.fillCircle(22, -20, 22); g.fillStyle(0xb7b2c2, 1); g.fillCircle(-20, -34, 12); },
    (g) => { g.fillStyle(0x5bb85a, 1); for (let i = 0; i < 6; i++) g.fillRect(i * 12 - 30, -60 - (i % 3) * 22, 6, 60 + (i % 3) * 22); },
  ],
};

const DRIFT_TINT = { bairro: 0xffffff, praca: 0xff9ec4, floresta: 0x9be564, altura: 0xffd9a0, pre: 0xffe08a };

export function buildAmbient(scene) {
  const A = { theme: 'bairro', items: [], fg: [], drift: [], tPass: 3.2, tFg: 0.5, tDrift: 0.2, t: 0 };

  function spawnPass(speed) {
    if (A.items.length >= 3) return;
    const list = SPAWNS[A.theme] || SPAWNS.bairro;
    const [kindKey, lane, dir] = pick(list);
    const k = KINDS[kindKey];
    const obj = k.make(scene);
    const baseSc = k.sc;
    const y = lane === 'near' ? GROUND + 52 : lane === 'far' ? GROUND - 16 : 90 + R() * 150;
    const depth = lane === 'near' ? 11 : lane === 'far' ? 3 : 2;
    const sc = lane === 'far' ? baseSc * 0.8 : baseSc;
    obj.setDepth(depth);
    const sx = (k.rev ? -1 : 1) * dir;
    obj.setScale(sx * sc, sc);
    const vRel = dir > 0 ? 260 + R() * 160 : 280 + R() * 200;
    const it = { obj, k, lane, dir, sc, baseY: y, vRel, t: R() * 6, said: false, x: dir > 0 ? -260 : W + 260 };
    obj.setPosition(it.x, y);
    A.items.push(it);
  }

  function spawnFg(speed) {
    if (A.fg.length >= 6) return;
    const g = og(scene);
    const fn = pick(FG[A.theme] || FG.bairro);
    fn(g);
    const sc = 0.9 + R() * 0.7;
    g.setScale(sc).setDepth(20).setPosition(W + 150, H + 6 + R() * 14);
    A.fg.push(g);
  }

  function spawnDrift() {
    if (A.drift.length >= 10) return;
    const im = scene.add.image(W + 40, 40 + R() * 520, 'puff').setDepth(19).setTint(DRIFT_TINT[A.theme] || 0xffffff).setScale(0.12 + R() * 0.16).setAlpha(0.55);
    im.ph = R() * 6; im.v = 0.9 + R() * 0.9; im.baseY = im.y;
    A.drift.push(im);
  }

  function popup(x, y, text) {
    const t = scene.add.text(x, y, text, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '38px', color: '#ffffff', stroke: '#1b2a49', strokeThickness: 8 }).setOrigin(0.5).setDepth(30);
    scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 900, ease: 'Quad.out', onComplete: () => t.destroy() });
  }

  A.setTheme = (th) => { A.theme = th; };

  A.update = (dt, speed, px, py) => {
    A.t += dt;
    // novos amigos só quando o mundo está correndo
    if (speed > 120) {
      A.tPass -= dt; if (A.tPass <= 0) { A.tPass = 3.4 + R() * 3.2; spawnPass(speed); }
      A.tFg -= dt * (speed / 330); if (A.tFg <= 0) { A.tFg = 0.7 + R() * 0.9; spawnFg(speed); }
    }
    A.tDrift -= dt; if (A.tDrift <= 0) { A.tDrift = 0.28 + R() * 0.3; spawnDrift(); }

    for (let i = A.items.length - 1; i >= 0; i--) {
      const it = A.items[i], o = it.obj;
      it.t += dt;
      const vx = it.dir > 0 ? it.vRel - speed * 0.35 : -(speed + it.vRel);
      it.x += vx * dt;
      let y = it.baseY;
      const k = it.k;
      if (k.anim) k.anim(o, it.t);
      if (k.hop) y -= Math.abs(Math.sin(it.t * 8)) * k.hop;
      if (k.bob) y += Math.sin(it.t * 3) * k.bob;
      // reação quando passa pelo menino: late, acena, pula e solta estrelinhas
      if (!it.said && it.lane === 'near' && Math.abs(it.x - px) < 110) {
        it.said = true; it.react = 0.6;
        if (k.say) popup(it.x, y - 120 * it.sc - 30, k.say);
        if (k.bark) sfx.bark();
        scene.sparkle(it.x, y - 60 * it.sc, 4);
      }
      if (it.react > 0) { it.react -= dt; y -= Math.sin((1 - it.react / 0.6) * Math.PI) * 46; }
      o.setPosition(it.x, y);
      if (it.x < -420 || it.x > W + 420) { o.destroy(); A.items.splice(i, 1); }
    }
    for (let i = A.fg.length - 1; i >= 0; i--) {
      const g = A.fg[i];
      g.x -= (speed * 1.9 + 70) * dt;
      if (g.x < -260) { g.destroy(); A.fg.splice(i, 1); }
    }
    for (let i = A.drift.length - 1; i >= 0; i--) {
      const im = A.drift[i];
      im.x -= (speed * 1.5 + 140 * im.v) * dt;
      im.y = im.baseY + Math.sin(A.t * 2.2 * im.v + im.ph) * 22;
      if (im.x < -40) { im.destroy(); A.drift.splice(i, 1); }
    }
  };
  A.destroy = () => { [...A.items.map((i) => i.obj), ...A.fg, ...A.drift].forEach((o) => o.destroy()); A.items = []; A.fg = []; A.drift = []; };
  return A;
}
