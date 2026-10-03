// Grava quadros de uma partida de demonstração (robô joga) para montar o vídeo curto.
// Uso: DIST=dist PORT=4250 PHASE=1 MODE=facil SECS=24 OUT=/tmp/frames/a node tests/video3d.mjs
import { serve, launch } from './helpers.mjs';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const srv = await serve(process.env.DIST ? path.resolve(process.env.DIST) : path.join(here, '..', 'dist'));
const PORT = +(process.env.PORT || 4199), PHASE = +(process.env.PHASE || 1), MODE = process.env.MODE || 'facil', SECS = +(process.env.SECS || 20), OUT = process.env.OUT || '/tmp/frames/a';
fs.mkdirSync(OUT, { recursive: true });
const { browser } = await launch({ viewport: { width: 960, height: 450 } });
const ctx = await browser.newContext({ viewport: { width: 960, height: 450 }, hasTouch: true });
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/?renderer=canvas`);
await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'));
await page.evaluate(([mode, phase]) => { try { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ tut: phase === 1 ? {} : { jump: true, water: true, dbl: true, float: true } })); } catch (e) {} window.__ian.game.scene.start('Game3D', { mode, phase, seed: 'video' + phase, manual: true }); }, [MODE, PHASE]);
await page.waitForFunction(() => window.__ian3);
const total = SECS * 60; let n = 0;
for (let i = 0; i < total; i += 4) {
  await page.evaluate(() => {
    const g = window.__ian3, b = (g.__bot = g.__bot || { jumpAt: -9, dbl: true, hold: false, lastAct: -9 });
    for (let k = 0; k < 4; k++) {
      const p = g.p, f = g.focus;
      if (f && !f.done) { if (g.t - b.lastAct > 0.25 && g.sprayCd <= 0) { g.pressAction(); b.lastAct = g.t; } g.setJump(false); g.setRun(false); }
      else if (g.powers.fly) { g.setJump(p.y < 2.2 || g.dist % 7 < 3.5); }
      else if (p.ground) {
        g.setJump(false); b.hold = false; b.dbl = true;
        const h = g.nextHazard(), jd = g.jumpDist();
        if (g.tutorialActive) { g.setJump(true); g.setJump(false); b.jumpAt = g.t; b.dbl = g.tutKind !== 'double'; b.hold = g.tutKind === 'float'; }
        else if (h && h.gap > 0 && h.gap < Math.max(1.2, jd * 0.34)) { g.setJump(true); g.setJump(false); b.jumpAt = g.t; b.dbl = h.kind !== 'wall'; b.hold = !!h.glide; }
        g.setRun(!h || h.gap > 30);
      } else {
        if (!b.dbl && g.t - b.jumpAt > 0.22) { g.setJump(true); g.setJump(false); b.dbl = true; }
        g.setJump(b.hold || (g.p.vy < -2 && g.world.inHole(g.dist - 0.5, g.dist + 3.5)));
      }
      g.tick(1 / 60);
    }
    g.render();
  });
  await page.screenshot({ path: path.join(OUT, String(n++).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 78 });
}
const snap = await page.evaluate(() => window.__ian3.snapshot());
console.log('quadros', n, 'fase', snap.phase, 'missões', snap.stats.missions, 'estrelas', snap.stars);
await browser.close(); srv.close();
