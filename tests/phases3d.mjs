// Um robô joga cada fase 3D em cada modo e tira fotos das missões. Uso: node tests/phases3d.mjs [fases] [modos] [shots]
//   ex.: node tests/phases3d.mjs 2,3 facil 1     (shots=1 salva imagens em tests/out/phases3d)
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out', 'phases3d'); fs.mkdirSync(out, { recursive: true });
const phases = (process.argv[2] || '1,2,3,4,5').split(',').map(Number), modes = (process.argv[3] || 'facil,aventura,desafio').split(','), shots = process.argv[4] === '1';
const EXPECT = { 1: ['fire_bin', 'fire_house', 'fire_building'], 2: ['rescue_cat', 'distract_dog', 'person_safe', 'fire_dog'], 3: ['rescue_bunny', 'supplies'], 4: ['rescue_roof', 'fire_building'], 5: ['distract_dino', 'nest', 'baby_free', 'baby_reunite'] };
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let fails = 0; const ok = (c, msg, x = '') => { console.log((c ? '  ok  ' : ' FALHA ') + msg + (x ? '  [' + x + ']' : '')); if (!c) fails++; };

const BOT = () => {
  window.__bot = { jumpAt: -9, dblDone: true, hold: false, lastAct: 0 };
  window.__step = (n) => {
    const g = window.__ian3, b = window.__bot, done = [];
    for (let i = 0; i < n; i++) {
      const p = g.p, f = g.focus;
      if (f && !f.done) { if (g.t - b.lastAct > 0.2 && g.sprayCd <= 0) { g.pressAction(); b.lastAct = g.t; } g.setJump(false); }
      else if (g.powers.fly) { g.setJump(p.y < 2.2 || g.dist % 7 < 3.5); }
      else if (p.ground) {
        g.setJump(false); b.hold = false; b.dblDone = true;
        const h = g.nextHazard(), jd = g.jumpDist();
        if (g.tutorialActive) { if (g.tutKind === 'double') { g.setJump(true); g.setJump(false); b.dblDone = false; b.jumpAt = g.t; } else { g.setJump(true); g.setJump(false); b.jumpAt = g.t; b.hold = true; } }
        else if (h && h.gap > 0) {
          const lead = h.kind === 'hole' && !h.glide ? 0.9 : h.kind === 'wall' ? jd * 0.24 : h.glide ? jd * 0.1 : jd * 0.26;
          if (h.gap < lead) { g.setJump(true); g.setJump(false); b.jumpAt = g.t; b.dblDone = h.kind !== 'wall'; b.hold = !!h.glide; }
        }
      } else {
        if (!b.dblDone && g.t - b.jumpAt > 0.22) { g.setJump(true); g.setJump(false); b.dblDone = true; }
        g.setJump(b.hold || (g.p.vy < -2 && g.world.inHole(g.dist - 0.5, g.dist + 3.5)));
      }
      const m0 = g.stats.missions; g.tick(1 / 60); if (g.stats.missions > m0) done.push(g.focus ? g.focus.key : 'x');
    }
    g.render(); return g.snapshot();
  };
};

for (const phase of phases) for (const mode of modes) {
  await page.goto('http://localhost:'+(process.env.PORT||4199)+'/?renderer=canvas');
  await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
  await page.evaluate(() => { try { localStorage.removeItem('ian-e-seus-amigos:v1'); } catch (e) {} });
  await page.evaluate(([phase, mode]) => window.__ian.game.scene.start('Game3D', { mode, phase, seed: 'bot' + phase, manual: true }), [phase, mode]);
  await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
  await page.evaluate(BOT);
  const seen = new Set(); let s, t0 = Date.now(), stuck = 0, lastDist = 0, maxStuck = 0, shotsTaken = 0;
  for (let k = 0; k < 60 * 240 / 30; k++) {
    s = await page.evaluate(() => window.__step(30));
    if (s.mission && s.mission.engaged && !seen.has(s.mission.key)) {
      seen.add(s.mission.key);
      if (shots) { await page.evaluate(() => window.__step(40)); await page.screenshot({ path: path.join(out, `p${phase}-${mode}-${s.mission.key}-a.png`) }); await page.evaluate(() => window.__step(30)); await page.screenshot({ path: path.join(out, `p${phase}-${mode}-${s.mission.key}-b.png`) }); }
    }
    if (shots && s.focus === false && s.stats.missions > 0 && shotsTaken < 0) shotsTaken++;
    if (Math.abs(s.dist - lastDist) < 0.05 && !s.focus && !s.tutorial && !s.paused) { stuck++; maxStuck = Math.max(maxStuck, stuck); } else stuck = 0;
    lastDist = s.dist;
    if (s.phase > phase || (s.stats.missions >= EXPECT[phase].length && s.mission === null && !s.focus && s.queue === 0)) break;
  }
  const got = s.stats.missions;
  ok(s.phase > phase || got >= EXPECT[phase].length, `fase ${phase} ${mode}: missões ${got}/${EXPECT[phase].length}, fase atual ${s.phase}`, `t=${s.t.toFixed(0)}s quedas ${s.stats.falls} batidas ${s.stats.hits} pulos ${s.stats.jumps} duplos ${s.stats.doubles} planar ${s.stats.floats} quicadas ${s.stats.bounces || 0} estrelas ${s.stars}`);
  ok(maxStuck < 5, `fase ${phase} ${mode}: sem travar`, 'maxStuck=' + maxStuck);
}
console.log('erros de página:', errors.length ? errors.slice(0, 8) : 'nenhum'); if (errors.length) fails++;
await browser.close(); srv.close();
console.log(fails ? `\n${fails} FALHA(S)` : '\nTUDO OK'); process.exit(fails ? 1 : 0);
