// Fumaça: abre cada tela e cada fase, tira capturas e lista erros de console.
import { serve, launch, waitGame } from './helpers.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, page, errors } = await launch();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await waitGame(page, 'http://localhost:4199/?renderer=canvas');
await sleep(500);
await page.screenshot({ path: path.join(out, 's01-menu.png') });
await page.evaluate(() => window.__ian.game.scene.start('Character', {}));
// troca de cena é feita via scene.getScene('Menu').scene.start
await sleep(800);
for (const t of [0, 1, 2]) {
  await page.evaluate((t) => { const s = window.__ian.game.scene.getScene('Character'); s.setTab(t); }, t);
  await sleep(500);
  await page.screenshot({ path: path.join(out, `s02-char-${t}.png`) });
}
for (let ph = 1; ph <= 5; ph++) {
  await page.evaluate((ph) => { window.__ian.game.scene.stop('Character'); window.__ian.game.scene.start('Game', { mode: 'facil', phase: ph, manual: true, seed: 'x' }); }, ph);
  await page.waitForFunction(() => window.__ian.game.scene.isActive('Game') && window.__ian.scene.p, null, { timeout: 15000 });
  await sleep(300);
  await page.evaluate(() => { const s = window.__ian.game.scene.getScene('Game'); s.tutorialJump = false; for (let i = 0; i < 600; i++) { s.p.buffer = (i % 40 === 0) ? 0.3 : s.p.buffer; s.tick(1 / 60); } });
  await sleep(400);
  await page.screenshot({ path: path.join(out, `s03-fase${ph}.png`) });
  console.log('fase', ph, JSON.stringify(await page.evaluate(() => window.__ian.game.scene.getScene('Game').snapshot())));
}
console.log('ERROS:', errors.length); errors.slice(0, 15).forEach((e) => console.log(e));
await browser.close(); srv.close();
