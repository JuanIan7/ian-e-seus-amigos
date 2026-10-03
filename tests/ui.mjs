// Teste de interface com toques reais (emulados) e capturas de tela.
import { serve, launch, waitGame } from './helpers.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out'); fs.mkdirSync(out, { recursive: true });
const srv = await serve(path.join(here, '..', 'dist'));
const { browser, errors } = await launch();
let fails = 0;
const check = (name, cond, extra = '') => { console.log((cond ? 'OK   ' : 'FALHA') + ' ' + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(viewport = { width: 1560, height: 720 }) {
  const ctx = await browser.newContext({ viewport, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await waitGame(page, 'http://localhost:4199/?renderer=canvas');
  const tap = async (gx, gy) => {
    const m = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 1560 }; });
    await page.touchscreen.tap(m.x + gx * m.s, m.y + gy * m.s);
  };
  const state = () => page.evaluate(() => window.__ian.game.scene.getScene('Game').snapshot());
  return { ctx, page, tap, state };
}

// ---------- 1) menu, seleção de modo e salvamento ----------
{
  const { ctx, page, tap } = await open();
  await page.screenshot({ path: path.join(out, '01-menu.png') });
  await tap(1150, 330); await sleep(200);
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')));
  check('toque no cartão Desafio salva o modo', saved.mode === 'desafio', JSON.stringify(saved.mode));
  await page.goto('http://localhost:4199/?renderer=canvas'); await page.waitForFunction(() => window.__ian && window.__ian.game.scene.isActive('Menu'));
  await sleep(300);
  check('modo escolhido persiste após reabrir', await page.evaluate(() => window.__ian.game.scene.getScene('Menu').mode) === 'desafio');
  await tap(410, 330); await sleep(150);
  await tap(1470, 80); await sleep(150);
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ian-e-seus-amigos:v1')));
  check('botão de som alterna e salva', saved.sound === false && saved.mode === 'facil');
  await tap(1470, 80); await sleep(100);
  await ctx.close();
}

// ---------- 2) jogo: toques de pulo e ação, tutorial, pausa ----------
{
  const { ctx, page, tap, state } = await open();
  await tap(780, 575); // jogar (modo fácil padrão)
  await page.waitForFunction(() => window.__ian.game.scene.isActive('Game'));
  await sleep(1200);
  await page.screenshot({ path: path.join(out, '02-jogo-corrida.png') });
  let s = await state();
  check('jogo inicia no modo fácil e corre sozinho', s.mode === 'facil' && s.dist > 50, `dist=${Math.round(s.dist)}`);

  // tutorial: o mundo congela perto do primeiro obstáculo até tocar em pular
  await page.waitForFunction(() => window.__ian.game.scene.getScene('Game').tutorialActive === true, null, { timeout: 30000 });
  await sleep(300);
  await page.screenshot({ path: path.join(out, '03-tutorial-pulo.png') });
  const d0 = (await state()).dist; await sleep(600); const d1 = (await state()).dist;
  check('tutorial congela a corrida até o toque', Math.abs(d1 - d0) < 1);
  await tap(1345, 590); await sleep(150);
  s = await state();
  check('toque no botão Pular faz o personagem saltar', s.onGround === false && s.stats.jumps === 1);
  await sleep(1400);
  s = await state();
  check('tutorial salta junto e passa sem colisão', s.stats.hits === 0, `hits=${s.stats.hits}`);

  // multitoque: pular + ação ao mesmo tempo
  await sleep(1200);
  const cdp = await ctx.newCDPSession(page);
  const geo = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.left, y: r.top, s: r.width / 1560 }; });
  const pt = (id, gx, gy) => ({ x: geo.x + gx * geo.s, y: geo.y + gy * geo.s, id });
  await page.waitForFunction(() => window.__ian.game.scene.getScene('Game').p.ground);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(1, 1345, 590), pt(2, 205, 590)] });
  await sleep(120);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const multi = await page.evaluate(() => { const g = window.__ian.game.scene.getScene('Game'); return { jumped: !g.p.ground, shaking: g.tweens.isTweening(g.actionBtn.root) }; });
  check('dois toques simultâneos são lidos (pular e ação)', multi.jumped && multi.shaking, JSON.stringify(multi));

  // pausa
  await sleep(1200);
  await tap(1480, 70); await sleep(200);
  s = await state(); const dp0 = s.dist;
  await page.screenshot({ path: path.join(out, '04-pausa.png') });
  await sleep(800); const dp1 = (await state()).dist;
  check('pausa congela o jogo', s.paused === true && Math.abs(dp1 - dp0) < 0.5);
  await tap(780, 360); await sleep(300); // retomar
  s = await state(); const dr0 = s.dist; await sleep(600);
  check('retomar volta a correr', s.paused === false && (await state()).dist > dr0 + 20);

  // segundo plano => pausa automática
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  check('ir para segundo plano pausa o jogo', (await state()).paused === true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await tap(780, 360); await sleep(200);

  // ---------- 3) missão da mangueira e do fogo ----------
  await page.evaluate(() => { const g = window.__ian.game.scene.getScene('Game'); g.queue = ['hose', 'obstacle', 'fire']; g.nextGapPx = 0; g.sinceSpawn = 1; });
  const ok = await page.evaluate(async () => {
    const g = window.__ian.game.scene.getScene('Game');
    for (let i = 0; i < 60 * 90 && !(g.fire && g.fire.engaged); i++) {
      const p = g.p; const obs = g.obstacles.filter((o) => o.solid && !o.hit && o.x + o.w > p.x - 20);
      if (obs.length && p.ground) { const o = obs.reduce((a, b) => (b.x < a.x ? b : a)); if (o.x + o.w / 2 - p.x <= g.baseSpeed * g.airtime / 2) g.pressJump(); }
      g.tick(1 / 60);
    }
    return { engaged: !!(g.fire && g.fire.engaged), hose: g.hasHose };
  });
  check('pega a mangueira e para diante do fogo', ok.engaged && ok.hose, JSON.stringify(ok));
  await sleep(400);
  await page.screenshot({ path: path.join(out, '05-fogo.png') });
  const before = await state();
  check('corrida parada na posição de interação', before.fire && before.fire.engaged && before.speed === 0);
  for (let i = 0; i < 3; i++) { await tap(205, 590); await sleep(420); if (i === 0) await page.screenshot({ path: path.join(out, '06-jato.png') }); }
  await sleep(400);
  s = await state();
  check('3 toques na gota apagam o fogo (+5 estrelas) e liberam a corrida', s.fire === null || s.fire.out, JSON.stringify(s.fire));
  const dd = s.dist; await sleep(1500);
  check('corrida retoma sozinha depois do fogo', (await state()).dist > dd + 100);
  await page.screenshot({ path: path.join(out, '07-depois.png') });
  await ctx.close();
}

// ---------- 4) proporções de tela diferentes ----------
for (const [name, vp] of [['16x9', { width: 1280, height: 720 }], ['20x9', { width: 2400, height: 1080 }], ['4x3', { width: 1024, height: 768 }]]) {
  const { ctx, page, tap } = await open(vp);
  await tap(780, 575); await sleep(900);
  await page.screenshot({ path: path.join(out, `08-tela-${name}.png`) });
  const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; });
  check(`tela ${name}: jogo inteiro visível, centralizado`, box.l >= -1 && box.t >= -1 && box.l + box.w <= vp.width + 1 && box.t + box.h <= vp.height + 1, JSON.stringify(box));
  await ctx.close();
}

check('sem erros no console/página', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close(); srv.close();
console.log(fails ? `\n${fails} verificação(ões) falharam` : '\nTudo certo');
process.exit(fails ? 1 : 0);
