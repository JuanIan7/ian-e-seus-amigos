// Capturas de prévia: menu (tela inicial), editor de personagem e corrida 3D, com as mudanças atuais.
import { serve, launch } from './helpers.mjs';
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out', 'preview'); fs.mkdirSync(out, { recursive: true });
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch({ viewport: { width: 1560, height: 720 } });
const ctx = await browser.newContext({ viewport: { width: 1560, height: 720 }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tap = async (gx, gy) => {
  const m = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 1560 }; });
  await page.touchscreen.tap(m.x + gx * m.s, m.y + gy * m.s);
};

await page.goto('http://localhost:4199/?renderer=canvas');
await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
await sleep(600);
await page.screenshot({ path: path.join(out, '01-menu.png') });
console.log('menu ok');

// tela de personagem (botão do personagem no menu, DOM real — usa pointerdown, não click)
await page.locator('.sbtn', { hasText: 'Personagem' }).dispatchEvent('pointerdown');
await sleep(700);
await page.screenshot({ path: path.join(out, '02-personagem.png') });
console.log('personagem ok');

// aba "Cabelo" -> escolhe o 1º penteado (Curto liso, com as mechas espetadas novas)
const tabs = page.locator('.tabs .b');
await tabs.nth(3).dispatchEvent('pointerdown'); await sleep(400);
const hairOpts = page.locator('.opts .b');
await hairOpts.nth(0).dispatchEvent('pointerdown'); await sleep(400);
await page.screenshot({ path: path.join(out, '02b-personagem-cabelo-espetado.png') });
console.log('cabelo espetado ok');

// corrida na fase 1 (bombeiro), alguns segundos
await page.evaluate(() => { window.__ian.game.scene.start('Game3D', { mode: 'facil', phase: 1, seed: 'preview', manual: true }); });
await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
await page.evaluate(() => {
  const g = window.__ian3; const dt = 1 / 60;
  for (let i = 0; i < 60 * 4; i++) {
    const p = g.p; if (p.ground) { const h = g.nextHazard(); if (g.tutorialActive || (h && h.gap < g.jumpDist() * 0.3 && h.gap > 0)) g.pressJump(); }
    g.tick(dt);
  }
  g.render();
});
await page.screenshot({ path: path.join(out, '03-corrida-fase1.png') });
console.log('corrida ok');

console.log('erros:', errors.length ? errors.slice(0, 8) : 'nenhum');
await browser.close(); srv.close();
