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
await run(() => window.__ian3.addStars(37));
const coins0 = await run(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')).coins || 0);
await page.locator('.g3 .btn.pause').click();
await page.locator('.g3 .veil .btn').nth(0).dispatchEvent('pointerdown');
ok(await page.locator('.g3 .res').evaluate((e) => getComputedStyle(e).display !== 'none'), 'encerrar mostra o resultado (estrelas da corrida)');
const coins1 = await run(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')).coins || 0);
ok(coins1 >= coins0 + 37, 'as estrelas da corrida viram estrelas da lojinha', `${coins0} → ${coins1}`);
await page.locator('.g3 .res .btn[data-k="menu"]').dispatchEvent('pointerdown');
await page.waitForFunction(() => window.__ian.game.scene.isActive('Menu'), null, { timeout: 8000 }).catch(() => {});
ok(await run(() => window.__ian.game.scene.isActive('Menu') && !window.__ian3), 'saída clara para o menu');

console.log('4b. Vidas, fim de jogo, lojinha e poder comprado');
await start('aventura'); await ticks(30);
await run(() => { const g = window.__ian3; g.p.invul = 0; });
for (let k = 0; k < 3; k++) await run(() => { const g = window.__ian3; g.p.invul = 0; g.onHit({ x: g.p.x, hit: false }); for (let i = 0; i < 30; i++) g.tick(1 / 60); });
const ov = await run(() => { const g = window.__ian3; for (let i = 0; i < 120; i++) g.tick(1 / 60); return { lives: g.lives, over: g.over }; });
ok(ov.lives === 0 && ov.over, '3 batidas = fim de jogo', JSON.stringify(ov));
await page.locator('.g3 .res .btn[data-k="shop"]').dispatchEvent('pointerdown');
await page.waitForFunction(() => window.__ian.app.screen === 'shop' && !window.__ian3, null, { timeout: 8000 }).catch(() => {});
await run(() => { const s = JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')); s.coins = 250; localStorage.setItem('ian-e-seus-amigos:v1', JSON.stringify(s)); });
await page.reload(); await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'));
await page.locator('.front .sbtn.shop').dispatchEvent('pointerdown');
await page.locator('.front .card2[data-key="truck"] .buy').dispatchEvent('pointerdown');
await page.locator('.front .card2[data-key="shield"] .buy').dispatchEvent('pointerdown');
const bought = await run(() => { const s = JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')); return { coins: s.coins, inv: s.inv }; });
ok(bought.coins === 50 && bought.inv.truck === 1 && bought.inv.shield === 1, 'lojinha: cada poder custa 100 estrelas', JSON.stringify(bought));
await page.locator('.front .card2[data-key="fly"] .buy').dispatchEvent('pointerdown');
ok(await run(() => (JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')).inv.fly || 0) === 0), 'sem estrelas suficientes não compra');
await page.evaluate(() => window.__ian.game.scene.start('Game3D', { mode: 'aventura', phase: 1, seed: 'ctrl', manual: true }));
await page.waitForFunction(() => window.__ian3);
ok(await page.locator('.g3 .inv .it').count() === 2, 'janela de poderes mostra os poderes comprados');
await page.locator('.g3 .inv .it[data-key="truck"]').dispatchEvent('pointerdown');
const used = await run(() => { const g = window.__ian3; return { truck: !!g.powers.truck, inv: g.inv.truck, saved: JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')).inv.truck }; });
ok(used.truck && used.inv === 0 && used.saved === 0, 'tocar no poder ativa a viatura e gasta 1', JSON.stringify(used));
const imm = await run(() => { const g = window.__ian3; const l0 = g.lives; g.p.invul = 0; const o = g.addObstacle('crate', g.p.lane, g.dist + 0.1); g.collide(); return { l0, l1: g.lives, knocked: o.hit }; });
ok(imm.l1 === imm.l0 && imm.knocked, 'com poder ativo os obstáculos são afastados (sem perder vida)', JSON.stringify(imm));

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
