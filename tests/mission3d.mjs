// Captura a missão de incêndio do início ao fim (jogo 3D). Uso: node tests/mission3d.mjs [fase] [modo]
import { serve, launch } from './helpers.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out', 'shots3d'); fs.mkdirSync(out, { recursive: true });
const phase = +(process.argv[2] || 1), mode = process.argv[3] || 'facil';
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
const step = (frames, act) => page.evaluate(([frames, act]) => {
  const g = window.__ian3;
  for (let i = 0; i < frames; i++) {
    const p = g.p, f = g.focus;
    if (act && f && !f.done && i % 14 === 0 && g.sprayCd <= 0) g.pressAction();
    else if (!f && p.ground) { const h = g.nextHazard(); if (g.tutorialActive || (h && h.gap < g.jumpDist() * 0.3 && h.gap > 0)) g.pressJump(); }
    g.tick(1 / 60);
  }
  g.render(); return g.snapshot();
}, [frames, act]);
const shot = async (n) => page.screenshot({ path: path.join(out, `m-${n}.png`) });
// corre até a missão
let s;
for (let k = 0; k < 400; k++) { s = await step(30, false); if (s.focus) break; }
console.log('engajou', JSON.stringify(s.mission), 't=', s.t.toFixed(1));
await step(25, false); await shot('1-parado');
// três jatos
await page.evaluate(() => window.__ian3.pressAction()); await step(14, false); await shot('2-jato');
await step(40, false); await shot('3-depois-do-jato');
for (let k = 0; k < 6; k++) { const m = await page.evaluate(() => window.__ian3.focus && window.__ian3.focus.done); if (m) break; await page.evaluate(() => window.__ian3.pressAction()); await step(24, false); }
await step(20, false); await shot('4-apagou');
await step(60, false); await shot('5-comemora');
s = await step(240, true); await shot('6-seguindo');
console.log('fim', JSON.stringify({ stats: s.stats, mission: s.mission, speed: s.speed }));
console.log('erros:', errors.slice(0, 6));
await browser.close(); srv.close();
