// Captura cada missão no momento em que a criança chega nela. Uso: node tests/missions-shots.mjs fase:missao,...
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)); const out = path.join(here, 'out', 'missions'); fs.mkdirSync(out, { recursive: true });
const list = (process.argv[2] || '1:bin').split(',').map((x) => x.split(':'));
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true }); const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
for (const [ph, key] of list) {
  await page.goto(`http://localhost:${process.env.PORT || 4199}/?renderer=canvas`);
  await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 30000 });
  await page.evaluate((ph) => { try { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ tut: { jump: true, water: true, dbl: true, float: true } })); } catch (e) {} window.__ian.game.scene.start('Game3D', { mode: 'facil', phase: +ph, seed: 'ms', manual: true }); }, ph);
  await page.waitForFunction(() => window.__ian3, null, { timeout: 30000 });
  const r = await page.evaluate((key) => { const g = window.__ian3; for (let i = 0; i < 30; i++) g.tick(1 / 60); g.queue = ['mission:' + key]; g.nextS = g.dist + 14; for (let i = 0; i < 60 * 20 && !g.focus; i++) { if (g.mini) g.closeMini(true); g.tick(1 / 60); } for (let i = 0; i < 40; i++) g.tick(1 / 60); g.render(); return { focus: !!g.focus, key: g.focus && g.focus.key }; }, key);
  await page.screenshot({ path: path.join(out, `${ph}-${key}.png`) }); console.log(ph, key, JSON.stringify(r));
}
console.log('erros:', errors.slice(0, 6)); await browser.close(); srv.close();
