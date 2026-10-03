// Capturas do jogo 3D em movimento: roda um bot e tira quadros em tempos escolhidos. Uso: node tests/shots3d.mjs fase modo seg1,seg2,...
import { serve, launch } from './helpers.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out', 'shots3d'); fs.mkdirSync(out, { recursive: true });
const phase = +(process.argv[2] || 1), mode = process.argv[3] || 'facil';
const times = (process.argv[4] || '1,4,8').split(',').map(Number);
const W = +(process.env.W || 1280), H = +(process.env.H || 600);
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch({ viewport: { width: W, height: H } });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://localhost:4199/?renderer=canvas');
await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
await page.evaluate(([phase, mode]) => { window.__ian.game.scene.start('Game3D', { mode, phase, seed: 'shots', manual: true }); }, [phase, mode]);
await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
let t0 = 0;
for (const T of times) {
  const info = await page.evaluate(([from, to]) => {
    const g = window.__ian3; const dt = 1 / 60; const frames = Math.round((to - from) / dt);
    for (let i = 0; i < frames; i++) {
      const p = g.p, f = g.focus;
      if (f && !f.done) { if (i % 14 === 0) g.pressAction(); }
      else if (p.ground) { const h = g.nextHazard(); if (g.tutorialActive || (h && h.gap < g.jumpDist() * 0.3 && h.gap > 0)) g.pressJump(); }
      g.tick(dt);
    }
    g.render();
    return g.snapshot();
  }, [t0, T]);
  t0 = T;
  const f = path.join(out, `p${phase}-${mode}-${String(T).padStart(3, '0')}.png`);
  await page.screenshot({ path: f });
  console.log(T + 's', JSON.stringify({ dist: +info.dist.toFixed(1), speed: +info.speed.toFixed(1), stars: info.stars, y: +info.y.toFixed(2), mission: info.mission, hits: info.stats.hits, falls: info.stats.falls }));
}
console.log('erros:', errors.slice(0, 6));
await browser.close(); srv.close();
