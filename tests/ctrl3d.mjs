// Etapa 6: toques simultâneos, pausa/retomada, segundo plano, som salvo, saída ao menu e custo de desenho.
// Uso: DIST=dist PORT=4230 node tests/ctrl3d.mjs
import { serve, launch } from './helpers.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const srv = await serve(process.env.DIST ? path.resolve(process.env.DIST) : path.join(here, '..', 'dist'));
const PORT = +(process.env.PORT || 4199);
const { browser, errors } = await launch({ viewport: { width: 1280, height: 600 } });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 600 }, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let fails = 0;
const ok = (c, msg, extra = '') => { console.log((c ? '  ok  ' : ' FALHA ') + msg + (extra ? '  [' + extra + ']' : '')); if (!c) fails++; };
const run = (fn, arg) => page.evaluate(fn, arg);
const ticks = (n) => run((n) => { const g = window.__ian3; for (let i = 0; i < n; i++) g.tick(1 / 60); return g.snapshot(); }, n);
async function start(mode, manual = true) {
  await page.goto(`http://localhost:${PORT}/?renderer=canvas`);
  await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'), null, { timeout: 20000 });
  await page.evaluate(() => { try { localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify({ tut: { jump: true, water: true, dbl: true, float: true } })); } catch (e) {} });
  await page.evaluate(([mode, manual]) => window.__ian.game.scene.start('Game3D', { mode, phase: 1, seed: 'ctrl', manual }), [mode, manual]);
  await page.waitForFunction(() => window.__ian3, null, { timeout: 20000 });
  await run(() => { const g = window.__ian3; g.spawnLogic = () => {}; g.tutorialJump = false; g.p.invul = 1e9; });
}
// toque (PointerEvent) com id próprio, como dois dedos
const touch = (sel, type, id) => run(([sel, type, id]) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, bubbles: true, cancelable: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })); }, [sel, type, id]);

console.log('1. Multitoque: correr + pular ao mesmo tempo');
await start('aventura');
await ticks(60);
await touch('.g3 .btn.run', 'pointerdown', 1);
const a = await ticks(90);
await touch('.g3 .btn.jump', 'pointerdown', 2);
const b = await ticks(12);
ok(b.speed > a.base * 1.05, 'correr continua pressionado enquanto outro dedo pula', `vel ${a.speed.toFixed(2)} → ${b.speed.toFixed(2)}`);
const air = await run(() => !window.__ian3.p.ground); ok(air, 'o pulo aconteceu com o outro dedo em "correr"');
await touch('.g3 .btn.jump', 'pointerup', 2);
ok(await run(() => window.__ian3.runHeld), 'soltar o pulo não solta o correr');
await touch('.g3 .btn.run', 'pointerup', 1);
ok(!(await run(() => window.__ian3.runHeld)), 'soltar o correr para de acelerar');
await ticks(120);

console.log('2. Pausa e retomada');
await start('facil'); await ticks(120);
const s0 = await run(() => { const g = window.__ian3; return { dist: g.dist, t: g.t, stars: g.stars }; });
await page.locator('.g3 .btn.pause').click();
ok(await run(() => window.__ian3.paused), 'botão de pausa pausa o jogo');
await ticks(300);
const s1 = await run(() => { const g = window.__ian3; return { dist: g.dist, t: g.t }; });
ok(s1.dist === s0.dist && s1.t === s0.t, 'nada avança durante a pausa');
ok(await page.locator('.g3 .veil .btn').count() === 3, 'pausa mostra 3 botões grandes: menu, continuar, som');
// som alternado e salvo
const snd0 = await run(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1') || '{}').sound);
await page.locator('.g3 .veil .btn').nth(2).dispatchEvent('pointerdown');
const snd1 = await run(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1') || '{}').sound);
ok(snd0 !== snd1, 'som liga/desliga e fica salvo', `${snd0} → ${snd1}`);
await page.locator('.g3 .veil .btn').nth(2).dispatchEvent('pointerdown');
await page.locator('.g3 .veil .btn').nth(1).dispatchEvent('pointerdown');
ok(!(await run(() => window.__ian3.paused)), 'continuar retoma');
const s2 = await ticks(60); ok(s2.dist > s1.dist, 'a corrida segue de onde parou');

console.log('3. App em segundo plano');
await run(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
ok(await run(() => window.__ian3.paused), 'ao ir para segundo plano o jogo pausa sozinho');
await run(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
ok(await run(() => window.__ian3.paused), 'ao voltar continua pausado (a criança retoma quando quiser)');

console.log('4. Pausa dentro de minijogo e voltar ao menu');
await run(() => window.__ian3.setPaused(false));
await run(() => window.__ian3.openMini('puzzle'));
await run(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
ok(await run(() => window.__ian3.paused && !!window.__ian3.mini), 'segundo plano com minijogo aberto: pausa sem perder o minijogo');
await run(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
await run(() => window.__ian3.closeMini(false)); await run(() => window.__ian3.setPaused(false));
await page.locator('.g3 .btn.pause').click();
await page.locator('.g3 .veil .btn').nth(0).dispatchEvent('pointerdown');
await page.waitForFunction(() => window.__ian.game.scene.isActive('Menu'), null, { timeout: 8000 }).catch(() => {});
ok(await run(() => window.__ian.game.scene.isActive('Menu') && !window.__ian3), 'saída clara para o menu');

console.log('5. Custo de desenho (referência; o teste usa GPU por software)');
await start('desafio');
await ticks(60 * 20);
await run(() => window.__ian3.render());
const info = await run(() => { const i = window.__ian3.renderer.info; return { calls: i.render.calls, tris: i.render.triangles, geos: i.memory.geometries, tex: i.memory.textures }; });
ok(info.calls < 250 && info.tris < 250000, `chamadas de desenho ${info.calls}, triângulos ${info.tris}, geometrias ${info.geos}, texturas ${info.tex}`);
const heap = await run(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1));
console.log('  memória JS (MB):', heap);

console.log('erros de página:', errors.length ? errors.slice(0, 6) : 'nenhum');
if (errors.length) fails++;
await browser.close(); srv.close();
console.log(fails ? `\n${fails} FALHA(S)` : '\nTUDO OK');
process.exit(fails ? 1 : 0);
