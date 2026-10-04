// Mede triângulos e chamadas de desenho em cada fase e tira uma captura. Uso: node tests/perf3d.mjs [fases] [segundos]
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out', 'perf3d'); fs.mkdirSync(out, { recursive: true });
const phases = (process.argv[2] || '1,2,3,4,5,6,7').split(',').map(Number), secs = (process.argv[3] || '6,14,24').split(',').map(Number);
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true }); const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const rows = [];
for (const ph of phases) {
  await page.goto(`http://localhost:${process.env.PORT || 4199}/?renderer=canvas`);
  await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.evaluate((ph) => { try { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ tut: { jump: true, water: true, dbl: true, float: true } })); } catch (e) {} window.__ian.game.scene.start('Game3D', { mode: 'facil', phase: ph, seed: 'perf', manual: true }); }, ph);
  await page.waitForFunction(() => window.__ian3, null, { timeout: 30000 });
  let t0 = 0;
  for (const T of secs) {
    const info = await page.evaluate(([from, to]) => {
      const g = window.__ian3, dt = 1 / 60, n = Math.round((to - from) / dt);
      for (let i = 0; i < n; i++) { if (g.mini) g.closeMini(true); const p = g.p, f = g.focus; if (f && !f.done) { if (i % 14 === 0) g.pressAction(); } else if (p.ground) { const h = g.nextHazard(); if (g.tutorialActive || (h && h.gap < g.jumpDist() * 0.3 && h.gap > 0)) g.pressJump(); } g.tick(dt); }
      const r = g.renderer; r.info.autoReset = true; const t1 = performance.now(); g.render(); const ms = performance.now() - t1;
      return { calls: r.info.render.calls, tris: r.info.render.triangles, geos: r.info.memory.geometries, tex: r.info.memory.textures, progs: r.info.programs.length, ms: +ms.toFixed(1), theme: g.phase.theme };
    }, [t0, T]); t0 = T;
    await page.screenshot({ path: path.join(out, `f${ph}-${String(T).padStart(2, '0')}.png`) });
    rows.push({ fase: ph, s: T, ...info }); console.log(JSON.stringify(rows[rows.length - 1]));
  }
}
console.log('erros:', errors.slice(0, 6));
await browser.close(); srv.close();
