// Capturas de tela de cada missão, poder e transição (para conferir o visual).
import { serve, launch, waitGame } from './helpers.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out', 'shots'); fs.mkdirSync(out, { recursive: true });
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv[2] ? process.argv[2].split(',').map(Number) : [1, 2, 3, 4, 5];

for (const phase of only) {
  const ctx = await browser.newContext({ viewport: { width: 1560, height: 720 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await waitGame(page, 'http://localhost:4199/?renderer=canvas');
  await page.evaluate((phase) => { window.__ian.game.scene.start('Game', { mode: 'facil', phase, seed: 'shots', manual: true }); }, phase);
  await sleep(500);
  const shot = async (name) => { await sleep(120); await page.screenshot({ path: path.join(out, `f${phase}-${name}.png`) }); };
  let step = 0; const taken = new Set();
  while (step < 600) {
    const st = await page.evaluate(() => {
      const s = window.__ian.scene; const dt = 1 / 60;
      for (let i = 0; i < 20; i++) {
        const p = s.p, m = s.mission;
        if (m && m.engaged) { if (!s._shotHit) { } }
        else if (p.ground && !p.flying && !s.ride) {
          const h = s.nextHazard();
          if (h) {
            if (h.e.type === 'hole') { if (h.edge - (p.x + 17) <= s.jumpDist() * (h.e.w > s.jumpDist() * 0.9 ? 0.04 : 0.2)) s.pressJump(); }
            else if (h.cx - p.x <= s.jumpDist() / 2) s.pressJump();
          }
        }
        s.jumpHeld = !p.ground && s.holeNear(p.x - 30, p.x + 400);
        s.tick(dt);
        if (s.mission && s.mission.engaged) break;
      }
      const m = s.mission;
      return { key: m && m.engaged ? m.key : null, hp: m ? m.hp : null, max: m ? m.max : null, phase: s.phaseNum, ride: !!s.ride, fly: s.p.flying, glide: s.p.gliding, powers: Object.keys(s.powers), t: s.t, hole: s.holeNear(s.p.x - 20, s.p.x + 300), hasEgg: s.eq.egg };
    });
    step++;
    if (st.phase !== phase) break;
    if (st.key && !taken.has(st.key + 'a')) { taken.add(st.key + 'a'); await shot(st.key + '-1-chegada'); }
    if (st.key && st.hp === st.max && taken.has(st.key + 'a') && !taken.has(st.key + 'b')) {
      taken.add(st.key + 'b');
      await page.evaluate(() => window.__ian.scene.pressAction()); await sleep(60);
      await page.evaluate(() => { const s = window.__ian.scene; for (let i = 0; i < 12; i++) s.tick(1 / 60); });
      await shot(st.key + '-2-acao');
    }
    if (st.key) { // termina a missão
      await page.evaluate(() => { const s = window.__ian.scene; let n = 0; while (s.mission && s.mission.engaged && n++ < 20) { s.sprayCd = 0; s.pressAction(); for (let i = 0; i < 25; i++) s.tick(1 / 60); } for (let i = 0; i < 30; i++) s.tick(1 / 60); });
      await shot(st.key + '-3-fim');
    }
    if (st.ride && !taken.has('ride')) { taken.add('ride'); await shot('caminhao'); }
    if (st.fly && !taken.has('fly')) { taken.add('fly'); await shot('voo'); }
    if (st.glide && !taken.has('glide')) { taken.add('glide'); await shot('planar'); }
    if (st.powers.length && !taken.has('pw' + st.powers[0])) { taken.add('pw' + st.powers[0]); await shot('poder-' + st.powers[0]); }
  }
  console.log('fase', phase, [...taken].join(' '));
  await ctx.close();
}
console.log('erros:', errors.length, errors.slice(0, 5));
await browser.close(); srv.close();
